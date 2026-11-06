# Runbook Détour

Procédures d'exploitation. Chaque procédure contient des commandes réellement testées. Mettre à jour dans le même commit que le changement concerné.

## Installer

Prérequis : Node 24, Android Studio (SDK Android + JDK 21 embarqué). Xcode pour iOS, plus tard.

Gradle refuse le JDK 25. Ajouter dans `~/.zshrc` :

```
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
```

Installer les dépendances depuis la racine (monorepo npm workspaces) :

```
npm install
cp server/.env.example server/.env
cp app/.env.example app/.env
```

Serveur : Docker Desktop et Supabase CLI (`brew install supabase/tap/supabase`).

Ajouter une dépendance à l'app : `cd app && npx expo install <paquet>` (versions compatibles avec le SDK Expo).

Les skills d'agents et le runner expérimental décrits dans [la documentation](README.md#consignes-et-outils-ia) sont locaux et ne sont pas nécessaires pour installer, lancer ou builder l'app.

## Boucle locale Claude Code → Hermes Agent

Cette boucle expérimentale nécessite Python 3.9+ et utilise Claude Code pour planifier et relire, Hermes Agent pour modifier les fichiers avec son seul toolset `file`, puis lance elle-même les contrôles autorisés. Hermes doit pointer vers Ollama local ; aucun prompt, diff ou fichier du projet n'est envoyé à un fournisseur Hermes distant. Les vérifications déterministes simulées ne contactent aucun modèle.

Le script, ses modules, les prompts, plans et journaux sont ignorés par Git et propres à ce clone. Un verrou local interdit deux runs concurrents. La boucle exige une branche dédiée ; l'arbre peut être sale, son état de départ est enregistré (voir plus bas). Procédures pas à pas : [runbook-agent-loop.md](runbook-agent-loop.md). Chaque exécution a un dossier unique sous `.agent/runtime/runs/`; ne supprime ni ne remplace pas un ancien état pour reprendre.

Vérifier les dépendances et afficher l'aide (sans appeler Claude ni Hermes) :

```
python3 -m unittest discover -s .agent/tests -v
python3 scripts/agent-loop.py --help
```

Avant le premier lancement, compléter `.agent/REQUEST.md` et `.agent/DECISIONS.md` sans y mettre de secret ni de donnée personnelle. Relire le diff et le commit de la branche, vérifier que `hermes status` montre bien le fournisseur/modèle Ollama voulus et que `ollama list` contient ce modèle. Pour le premier essai, limiter le run à une tâche et le plafond à 1 USD par appel Claude :

```
python3 scripts/agent-loop.py --max-tasks 1 --claude-max-budget-usd 1
```

Il n'y a volontairement aucune valeur de budget par défaut. Le plafond s'applique séparément à chaque appel Claude (planification et revue), et non à l'ensemble de la boucle : pour une tâche, 1 USD par appel borne le premier run à 4 USD au maximum (une planification et trois revues). Un run complet de huit tâches peut théoriquement aller jusqu'à 25 appels Claude. Claude a un délai de 2 minutes par appel (`--claude-timeout` pour le modifier). Si Claude n'est pas installé, ne répond pas à temps, renvoie une erreur ou ne retourne rien, Hermes prépare le plan localement puis implémente avec Ollama. Hermes ne peut cependant pas approuver son propre travail.

Le runner refuse les plans invalides, cycles de dépendances, fichiers hors de la portée déclarée et commandes autres que `npm test`, `npm run typecheck`, `npm run lint` et `npm run format:check`. Chaque tâche est limitée à trois tentatives ; seul un verdict Claude `approved`, avec tous les contrôles réussis, la valide. Un arrêt au milieu d'une implémentation exige d'inspecter le diff puis de choisir explicitement :

```
python3 scripts/agent-loop.py --resume <run-id> --claude-max-budget-usd <montant>
python3 scripts/agent-loop.py --resume <run-id> --recover-task <task-id> --recovery-action review --claude-max-budget-usd <montant>
```

`--recovery-action` accepte `review`, `retry` ou `block`. `review` demande une revue des changements présents, `retry` autorise une nouvelle tentative sans effacer les changements existants, et `block` arrête la tâche. Si Claude tombe en panne pendant la revue, les tests et l'implémentation sont conservés et l'état indique que le run attend Claude ; le processus sort avec le code 2. Une fois Claude disponible, relancer `--resume <run-id> --claude-max-budget-usd <montant>` : le runner reprend à la revue sans demander une nouvelle implémentation à Hermes. Les détails de chaque appel, sorties et état lisible se trouvent sous `.agent/runtime/runs/<run-id>/`. Les erreurs laissent les modifications en place : les inspecter avant toute reprise. Une exécution réelle de Claude/Hermes entraîne des appels payants à Claude et doit être déclenchée manuellement avec le plafond souhaité ; elle n'est pas lancée par les tests.

### Modes, repli et récupération

Le run a trois modes, enregistrés dans `plan.json` (`mode`, `plan_author`, `claude`, `history`, `checkpoints`, `baseline`) :

| Mode       | Quand                                                                 | Qui fait quoi                                                      |
| ---------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `primary`  | Claude répond                                                         | Claude planifie et relit, Hermes implémente, le runner teste       |
| `fallback` | Claude ne répond pas (planification ou revue)                         | Hermes planifie (`plan_author: hermes`) et implémente ; les tâches finies passent en `awaiting_claude_review`, jamais `approved` |
| `recovery` | Un appel court `claude --print` (health check) réussit en fallback    | Claude relit chaque tâche en attente (plan Hermes, diff, tests, raison du repli) ; corrections par Hermes puis nouvelle revue ; retour en `primary` quand plus rien n'est ouvert (`recovery_complete` dans `history`) |

Échecs Claude classés : `timeout`, `network`, `rate_limit`, `auth`, `credit`, `other`. Seuls `timeout` et `network` sont réessayés, `claude_retries` fois (1 par défaut, 3 au plus) ; les autres basculent tout de suite sur Hermes. Pendant l'attente, Hermes continue les tâches dont les dépendances sont implémentées ; le health check est refait au plus toutes les `recovery_check_interval` secondes (300 par défaut) et à chaque `--resume`. Si tout est implémenté mais non relu, le run a le statut `awaiting_claude_review` et sort avec le code 2 : relancer `--resume <run-id>` quand Claude est de retour.

L'arbre Git peut être sale au lancement : le runner enregistre l'empreinte (sha256) des fichiers déjà modifiés ou non suivis (`baseline`) et n'envoie à Claude que ce qui a changé depuis. Si Hermes modifie un fichier pendant la planification, le plan est rejeté. Les changements de `package.json`, lockfiles et `migrations/` exigent `--approve-sensitive`. Aucun commit, push, reset, stash ni clean n'est exécuté. Les journaux masquent les motifs de secrets courants.

Configuration optionnelle (`.agent/config.json`, ignoré par Git, ou `--config chemin`) ; les options de la ligne de commande priment :

```json
{
  "claude_command": ["claude"],
  "claude_timeout": 120,
  "claude_retries": 1,
  "claude_retry_delay": 5,
  "claude_max_budget_usd": 1,
  "hermes_command": ["hermes"],
  "hermes_timeout": 3600,
  "ollama_model": "deepseek-coder:33b",
  "max_tasks": 8,
  "test_timeout": 900,
  "validation_commands": ["npm test", "npm run typecheck"],
  "recovery_check_interval": 300,
  "health_check_timeout": 30,
  "approve_sensitive": false
}
```

`ollama_model` doit figurer dans `ollama list` ; `validation_commands` ne peut contenir que des commandes de la liste autorisée. Hermes n'a pas de skill `plan` (vérifié avec `hermes skills search plan`) : le prompt de planification intègre la méthode du skill `planning-and-task-breakdown` (tranches verticales, critères vérifiables) sans activer de skill. Limites connues : si un fichier déjà modifié par l'utilisateur est aussi modifié par Hermes, son diff entier est relu ; un run interrompu pendant une tâche exige toujours `--recover-task` ; aucun test n'appelle un vrai Claude ou un vrai Ollama.

Inspecter : `.agent/runtime/runs/<run-id>/status.md` (mode, Claude, tâches), `plan.json` (état complet), `*.json` et `*.log` (un fichier par appel, `-retryN` pour les réessais). Tests : `python3 -m unittest discover -s .agent/tests`.

## Préparer le téléphone Android (Nothing Phone)

1. Paramètres > À propos du téléphone : taper 7 fois sur « Numéro de build ».
2. Paramètres > Système > Options pour les développeurs : activer « Débogage USB ».
3. Brancher en USB (câble de données), accepter « Autoriser le débogage USB ».
4. Vérifier : `adb devices` liste le téléphone avec l'état `device`.

## Lancer en développement

MapLibre est du code natif : Expo Go ne marche pas. Il faut un development build.

```
cd app && npm run android   # build + installation sur le téléphone, à refaire après ajout de code natif
cd app && npm start         # Metro, pour les sessions suivantes
cd server && npm run dev    # Node exécute le TypeScript directement
```

## Lancer la base et l'API des lieux

Supabase local, ports 544xx (un autre projet Supabase du poste peut occuper les ports 543xx par défaut) :

```
cd server && supabase start -x realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor
cd server && npm run collect -- landes    # environ 1 min, plus si Overpass est chargé (504 : 30 s d'attente puis nouvel essai)
cd server && npm run collect -- gironde   # environ 4 min : département, Bordeaux à part
cd server && npm run dev
curl -s localhost:3000/areas/landes/places | head -c 300
```

`supabase start` applique les migrations de `server/supabase/migrations/` au premier lancement. Studio (lecture des tables) : http://127.0.0.1:54423. E-mails de connexion envoyés en local (codes) : Mailpit, http://127.0.0.1:54424. SQL en ligne de commande, sans `psql` installé :

```
echo "select category, count(*) from places group by 1" | docker exec -i supabase_db_detour psql -U postgres
```

Téléphone branché en USB : il joint l'API du Mac par `localhost` grâce à `adb reverse` (à refaire après chaque débranchement). `EXPO_PUBLIC_API_URL=http://localhost:3000` dans `app/.env`, puis relancer Metro (variable lue au démarrage du bundler) :

```
adb reverse tcp:3000 tcp:3000
```

Vérifier : le journal de `npm run dev` montre `GET /areas 200` puis `GET /areas/landes/places 200` au lancement de l'app. Chaque ligne du journal contient seulement la méthode, le chemin et le statut : aucune position.

Ajouter un département : une ligne dans `server/src/collect/departments.ts` (id, nom, relation OSM du département, `admin_level=6`), puis `npm run collect -- <id>`, puis une étape dans `.github/workflows/collect.yml`. Ses grandes villes (plus de 100 000 habitants) sont trouvées par la collecte. Trouver la relation :

```
curl -s -A "Detour/0.1 (+https://github.com/B9R9/discover)" https://overpass-api.de/api/interpreter --data-urlencode 'data=[out:json];rel["boundary"="administrative"]["admin_level"="6"]["name"="Landes"];out ids;'
```

Vérifier le découpage (la grande ville a un `department_id`, le département ne contient plus son centre) :

```
echo "select id, department_id, round(ST_Area(boundary)/1e6) km2, ST_Covers(boundary, ST_MakePoint(-0.5792,44.8378)::geography) centre_bordeaux from areas" | docker exec -i supabase_db_detour psql -U postgres
```

Repartir d'une base serveur vide (efface lieux et zones, rejoue les migrations) : `cd server && supabase db reset`, puis relancer la collecte. Arrêter : `cd server && supabase stop`.

## Vérifier

Mêmes étapes que la CI (`.github/workflows/ci.yml`), depuis la racine :

```
npm run format:check
npm run typecheck
npm run lint
npm test
cd app && npx expo-doctor
```

## Tester la carte et le brouillard

Après un ajout de plugin ou de code natif (MapLibre, `expo-location`, `expo-task-manager`), regénérer le dossier `android/` puis réinstaller :

```
cd app && npx expo prebuild -p android --clean --no-install
cd app && npx expo run:android --no-bundler
cd app && npm start
```

Revoir l'écran d'accueil : désinstaller l'app (`adb uninstall com.b9r9.dtour`) ou effacer ses données, puis relancer.

Vérifier l'enregistrement du chemin : marcher quelques minutes, puis compter les points (base copiée comme dans « Inspecter la base locale ») :

```
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');console.log(d.prepare('SELECT COUNT(*) n, MAX(recorded_at) last FROM walked_paths').get())"
```

Vérifier la tâche de fond (permission « Toujours » + réglage actif) : la notification « Détour dévoile ta balade » est visible, et le service tourne :

```
adb shell dumpsys activity services com.b9r9.dtour | grep -i location
```

## Tester le Cercle (amis)

Il faut deux comptes qui reçoivent le code : tant qu'il n'y a pas de SMTP à nous (phase 7-0), seuls les e-mails des membres de l'équipe Supabase en reçoivent.

1. Appliquer la migration sur la base visée : `cd server && source .env.production && supabase db push -p "$SUPABASE_DB_PASSWORD"` (en ligne), ou `supabase db reset` (base locale).
2. Lancer l'API (`cd server && npm run dev`, ou la version Render redéployée) avec `SUPABASE_URL` et `SUPABASE_SECRET_KEY`.
3. Téléphone A : Profil, se connecter, onglet Cercle, choisir un pseudo. Téléphone B (ou le même après déconnexion) : idem avec un autre e-mail.
4. A invite B par pseudo ; B voit la demande dans « Demandes reçues » après être revenu sur l'onglet, l'accepte ; les deux se voient dans « Amis ».
5. Sans l'app, avec un jeton de session : `curl -H "Authorization: Bearer <jeton>" $EXPO_PUBLIC_API_URL/friends`. Sans jeton, la réponse est `401`.

## Achats de cartes (Play Console)

L'app parle directement à Google Play Billing (`expo-iap`), sans clé ni service tiers. L'app est payante au téléchargement ; les cartes sont des produits intégrés, en achat unique.

Créer une carte : Play Console > l'app > Monétiser > Produits > Produits intégrés > Créer. Id `map_<id de zone>` avec `_` à la place de `-` (`map_landes`, `map_gironde`, `map_gironde_bordeaux`, `map_france`), puis un prix et « Activer ». Prix : ville < département < France. Une zone sans produit actif s'affiche « À débloquer », sans bouton.

Ajouter un département : le collecter (voir plus haut), puis créer `map_<id>` pour lui et pour chaque grande ville.

Tester un achat sans payer :
1. Play Console > Paramètres > Tests de licence : ajouter le compte Google du téléphone.
2. L'app doit exister sur une piste de test (test interne) avec le même nom de paquet `com.b9r9.dtour`, sinon Google refuse tout achat.
3. Sur le téléphone : Profil > Mes cartes > « Débloquer · prix ». La fenêtre Google indique « carte de test, aucun débit ». La carte passe à « Débloquée ».
4. Restaurer : désinstaller, réinstaller, Profil > « Restaurer mes achats ».

Logs : `adb logcat -s ReactNativeJS:V | grep -iE "purchase|store"`.

Changer l'icône, le splash ou `userInterfaceStyle` dans `app.json` demande le même `prebuild --clean` puis `run:android` : Metro ne suffit pas. L'ancienne icône peut rester en cache : désinstalle l'app avant de réinstaller.

Après un ajout de module natif comme `expo-iap`, `prebuild --clean` efface `android/local.properties` : `ANDROID_HOME` doit être exporté (voir Installer), sinon Gradle échoue avec `SDK location not found`.

## Clé OpenRouteService

1. Créer un compte sur https://openrouteservice.org/dev/#/signup, puis une clé dédiée à l'app.
2. `cp app/.env.example app/.env` puis remplir `EXPO_PUBLIC_ORS_KEY=` (fichier non commité).
3. Relancer Metro (`cd app && npm start`) : les variables `EXPO_PUBLIC_` sont lues au démarrage du bundler.
4. Vérifier la clé :

```
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api.openrouteservice.org/v2/directions/foot-walking/geojson -H "Authorization: $EXPO_PUBLIC_ORS_KEY" -H 'Content-Type: application/json' -d '{"coordinates":[[-1.1495,44.3908],[-1.1563,44.3931]]}'
```

`200` = OK, `401`/`403` = clé absente ou invalide. Sans clé, l'app affiche « Itinéraire indisponible pour le moment. ». Quota : tableau de bord ORS.

## Ajouter ou retirer une découverte factice (téléphone de développement)

Pour tester un lieu découvert avant la phase 4. App arrêtée, base copiée et renvoyée :

```
adb shell am force-stop com.b9r9.dtour
adb exec-out run-as com.b9r9.dtour sh -c 'cat files/SQLite/discover.db' > /tmp/discover.db
adb exec-out run-as com.b9r9.dtour sh -c 'cat files/SQLite/discover.db-wal' > /tmp/discover.db-wal
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');const r=d.prepare('INSERT INTO photos (uri, latitude, longitude, accuracy, taken_at) VALUES (?,?,?,?,?)').run('file:///fake-dev.jpg',44.39308,-1.15628,5,Date.now());d.prepare('INSERT INTO discovered_places VALUES (?,?,?,?)').run('osm:way/127816135',Date.now(),'[]',Number(r.lastInsertRowid));d.exec('PRAGMA wal_checkpoint(TRUNCATE)')"
adb push /tmp/discover.db /data/local/tmp/discover.db
adb shell "run-as com.b9r9.dtour sh -c 'cp /data/local/tmp/discover.db files/SQLite/discover.db && rm -f files/SQLite/discover.db-wal files/SQLite/discover.db-shm'"
```

Pour la retirer, même procédure avec à la place du `node -e` :

```
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');d.exec(\"DELETE FROM discovered_places WHERE photo_id IN (SELECT id FROM photos WHERE uri='file:///fake-dev.jpg'); DELETE FROM photos WHERE uri='file:///fake-dev.jpg'; PRAGMA wal_checkpoint(TRUNCATE)\")"
```

## Tester la photo sans se déplacer (téléphone de développement)

Pose un faux lieu à la dernière position enregistrée, puis prends une photo depuis l'onglet Photo. Le lieu `dev` (zone `dev`) n'est pas effacé par la mise à jour des lieux, qui ne remplace que la zone du téléphone. App arrêtée, base copiée et renvoyée :

```
adb shell am force-stop com.b9r9.dtour
adb exec-out run-as com.b9r9.dtour sh -c 'cat files/SQLite/discover.db' > /tmp/discover.db
adb exec-out run-as com.b9r9.dtour sh -c 'cat files/SQLite/discover.db-wal' > /tmp/discover.db-wal
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');const p=d.prepare('SELECT latitude, longitude FROM walked_paths ORDER BY recorded_at DESC LIMIT 1').get();d.prepare('INSERT OR REPLACE INTO places_cache (id, area_id, name, latitude, longitude, category, updated_at) VALUES (?,?,?,?,?,?,?)').run('dev:'+Date.now(),'dev','Lieu de test photo',p.latitude,p.longitude,null,Date.now());d.exec('PRAGMA wal_checkpoint(TRUNCATE)')"
adb push /tmp/discover.db /data/local/tmp/discover.db
adb shell "run-as com.b9r9.dtour sh -c 'cp /data/local/tmp/discover.db files/SQLite/discover.db && rm -f files/SQLite/discover.db-wal files/SQLite/discover.db-shm'"
```

Attendu : « Tu y es presque » sur la caméra, puis retour sur la Carte avec la zone qui se dissipe. Une deuxième photo au même endroit : « Tu as déjà découvert ce lieu. ». Photos gardées : `adb shell run-as com.b9r9.dtour ls files/photos`.

Créer un lieu à toi : prendre une photo à plus de 50 m de tout lieu (sans faux lieu, la plupart des endroits conviennent). Attendu : formulaire « Aucun lieu ici. En faire un lieu à toi ? », puis retour Carte avec la zone dévoilée. Le 4e en 24 h : « Tu as déjà créé 3 lieux aujourd'hui ». Les retirer :

```
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');d.exec(\"CREATE TEMP TABLE gone AS SELECT photo_id FROM personal_places; DELETE FROM discovered_places WHERE place_id LIKE 'personal:%'; DELETE FROM personal_places; DELETE FROM photos WHERE id IN (SELECT photo_id FROM gone); PRAGMA wal_checkpoint(TRUNCATE)\")"
```

Pour tout retirer (faux lieux, leurs découvertes et toutes les photos), même procédure avec à la place du `node -e`, puis supprimer les fichiers :

```
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');d.exec(\"CREATE TEMP TABLE gone AS SELECT photo_id FROM discovered_places WHERE place_id LIKE 'dev:%'; DELETE FROM discovered_places WHERE place_id LIKE 'dev:%'; DELETE FROM photos WHERE id IN (SELECT photo_id FROM gone); DELETE FROM places_cache WHERE area_id='dev'; PRAGMA wal_checkpoint(TRUNCATE)\")"
adb shell "run-as com.b9r9.dtour rm -rf files/photos"
```

Le dernier `rm` efface aussi les photos de vraies découvertes : à éviter hors du téléphone de développement.

## Builder et publier

### Publier sur Google Play (AAB signé)

Clé d'envoi Google Play, hors du dépôt, dans `~/.config/detour/` (créée le 2026-10-11) :
- `upload.keystore` : la clé (alias `detour-upload`, PKCS12) ;
- `upload.properties` : chemin et mots de passe, lus par Gradle.

Garde une copie de ce dossier dans un gestionnaire de mots de passe. Google garde la vraie clé de signature (Play App Signing) : une clé d'envoi perdue se remplace depuis la Play Console, mais il faut la demander.

Le plugin `app/plugins/withReleaseSigning.js` signe les builds release avec cette clé si `upload.properties` existe (autre chemin : variable `DETOUR_UPLOAD_PROPERTIES`), sinon avec la clé de debug.

Construire l'AAB (variables `JAVA_HOME` et `ANDROID_HOME` de la section Installer) :

```
cd app && npx expo prebuild -p android --clean --no-install
cd app/android && ./gradlew app:bundleRelease -Dorg.gradle.jvmargs="-Xmx4g -XX:MaxMetaspaceSize=1g"
```

Résultat : `app/android/app/build/outputs/bundle/release/app-release.aab` (environ 100 Mo). Le bundle JS prend les variables de `app/.env` : `EXPO_PUBLIC_API_URL` doit être l'API en ligne, pas `localhost`. Sans l'option mémoire, Gradle échoue avec `OutOfMemoryError: Metaspace` (le gabarit Expo limite à 512 Mo).

Vérifier la signature : `keytool -printcert -jarfile app/android/app/build/outputs/bundle/release/app-release.aab` doit afficher `CN=Detour`, pas `CN=Android Debug`.

Envoyer : Play Console > Tester et publier > Tests > Test interne > Créer une release > déposer l'AAB. Chaque nouvel envoi demande un `versionCode` plus grand (`android.versionCode` dans `app/app.json`).

_iOS (TestFlight) : phase 8._

## Changer de projet Supabase

Un projet de l'offre gratuite se met en pause après une période sans activité (statut `INACTIVE`, erreur `tenant/user not found` sur le pooler). Le relancer depuis le dashboard (« Restore project ») ou en créer un autre. Pour en changer :

1. `server/.env.production` : `SUPABASE_DB_PASSWORD`, `DATABASE_URL` (pooler en mode session), `SUPABASE_URL`, `SUPABASE_SECRET_KEY`.
2. `app/.env` : `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY`, puis `cd app && npx expo start -c`.
3. Render (`detour-api`) : `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, puis redéployer.
4. GitHub : secret `DATABASE_URL` du dépôt (collecte hebdomadaire).
5. `server/supabase/config.toml` : `project_id` de `[remotes.production]`, et le lien du CLI : `supabase link --project-ref <ref>`.
6. `supabase db push`, `supabase config push`, puis la collecte à la main (`landes`, `gironde`).

## Déployer le serveur

Secrets du projet en ligne dans `server/.env.production` (ignoré par git, droits 600) : `SUPABASE_DB_PASSWORD`, `DATABASE_URL`, `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`. Le recréer à la main depuis le tableau de bord Supabase (Database > Connect > Session pooler, et Settings > API Keys) et Resend si le fichier est perdu. Le CLI masque les clés secrètes sans `--reveal` :

```
supabase projects api-keys --project-ref fmhtvyhsqfcdacasbspx --reveal -o json
```

Base en ligne (CLI déjà lié au projet `fmhtvyhsqfcdacasbspx`, voir `server/supabase/.temp/`) :

```
cd server && supabase link --project-ref fmhtvyhsqfcdacasbspx   # une fois par poste
cd server && source .env.production && supabase db push -p "$SUPABASE_DB_PASSWORD"
cd server && set -a && source .env.production && set +a && supabase config push   # Auth, modèles d'e-mail, SMTP Resend
cd server && node --env-file=.env.production src/collect/index.ts landes   # collecte à la main sur la base en ligne (puis gironde)
```

`supabase config push` affiche le diff et demande confirmation : relire avant de dire oui. Le SMTP Resend n'est défini que pour le projet en ligne (`[remotes.production]` dans `config.toml`) : sans `RESEND_API_KEY` dans l'environnement, le push échoue.

API sur Render : déploiement automatique à chaque push sur `main`. Build `npm ci -w server`, démarrage `node server/src/index.ts`, `NODE_VERSION=24`, variables `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`. Vérifier :

```
curl -s https://detour-api-30ul.onrender.com/health
```

Tableau de bord : https://dashboard.render.com/web/srv-db55qr4s728c73bv7g50 (journaux, variables, déploiements). Après 15 min sans requête, l'offre gratuite s'endort : le premier appel prend environ 30 s, l'app garde son cache pendant ce temps (délai de 10 s puis repli).

Collecte planifiée : GitHub Actions, chaque lundi à 03:00 UTC (`.github/workflows/collect.yml`). Lancer à la main et suivre :

```
gh workflow run collect.yml -R B9R9/discover
gh run watch -R B9R9/discover $(gh run list -R B9R9/discover -w collect.yml -L 1 --json databaseId -q '.[0].databaseId')
```

Le secret `DATABASE_URL` du dépôt vient de `server/.env.production` ; à refaire si le mot de passe de la base change :

```
grep '^DATABASE_URL=' server/.env.production | cut -d= -f2- | gh secret set DATABASE_URL -R B9R9/discover
```

Lancer l'API du Mac sur la base en ligne (test de la suppression de compte avec le téléphone, `adb reverse tcp:3000 tcp:3000`) :

```
cd server && node --env-file=.env --env-file=.env.production src/index.ts
```

## Diagnostiquer une panne

_Une entrée par panne rencontrée : symptôme, cause, correctif._

- **expo-doctor : « duplicate dependencies » sur `react`**. Cause : une dépendance de test tire une autre version de `react` à la racine. Correctif : `overrides.react` dans `package.json` racine, aligné sur la version de `app/package.json`, puis supprimer `node_modules` et `package-lock.json` et relancer `npm install`.
- **Le téléphone n'affiche pas les changements de code**. Cause : Metro lancé avec `CI=1`, qui désactive la surveillance des fichiers. Correctif : relancer `cd app && npm start` sans `CI`, puis rouvrir l'app.
- **Onglets avec une icône « GLYPH » cassée**. Cause : sans `tabBarIcon`, Expo Router affiche un `MissingIcon`. Correctif : fournir `tabBarIcon` (voir `app/src/app/_layout.tsx`).
- **L'app se ferme au lancement avec `Requested job cannot be persisted without holding android.permission.RECEIVE_BOOT_COMPLETED permission`** (logcat, `LocationTaskConsumer`). Cause : `expo-task-manager` planifie un job persistant mais son plugin n'ajoute pas la permission. Correctif : `android.permissions` contient `RECEIVE_BOOT_COMPLETED` dans `app/app.json`, puis prebuild `--clean` et réinstallation.
- **Permission « Toujours » accordée et réglage actif, mais pas de notification ni de service** (`dumpsys activity services` vide). Cause : la tâche reste enregistrée après la mort de son service (crash, mise à jour), et `hasStartedLocationUpdatesAsync` renvoie `true`. Correctif : `syncBackgroundTracking` appelle toujours `startLocationUpdatesAsync` quand le suivi est voulu (`app/src/features/location/tracking.ts`).
- **`NativeDatabase.prepareAsync has been rejected` (`NullPointerException`) dans le journal, puis plus rien ne se met à jour**. Cause : une poignée expo-sqlite de la même base a été fermée ou ramassée par le ramasse-miettes, ce qui ferme la connexion partagée avec `SQLiteProvider`. Correctif : ne jamais appeler `closeAsync` sur une base ouverte ailleurs ; la tâche de fond garde sa poignée (`backgroundTask.ts`). Vérifier : `adb logcat -s ReactNativeJS:V` pendant 2 min, aucune erreur.
- **Gradle : `SDK location not found`**. Cause : `ANDROID_HOME` absent du shell (par exemple un shell qui ne lit pas `~/.zshrc`). Correctif : `export ANDROID_HOME=$HOME/Library/Android/sdk` avant `npm run android`.
- **Logcat : `MapLibre Native [WARN] ... Invalid geometry in line layer`**. Sans gravité : vient des tuiles OpenFreeMap (le warning reste quand nos couches de lignes sont retirées).
- **`supabase start` : `Bind for 0.0.0.0:54322 failed: port is already allocated`**. Cause : un autre projet Supabase local tourne avec les ports par défaut. Correctif : nos ports sont déjà en 544xx dans `server/supabase/config.toml` ; si le conflit revient, `docker ps` montre qui tient le port.
- **Collecte : `Overpass answered 504`** après 3 essais. Cause : Overpass surchargé. Correctif : relancer plus tard ; la base garde les lieux précédents (une collecte en échec n'écrit rien).
- **Connexion : « Trop de demandes. Réessaie dans quelques minutes. »**. Cause : une demande de code par minute et par adresse (`max_frequency`). Correctif : attendre 60 s.
- **Le code n'arrive pas (en ligne)**. Cause probable : l'expéditeur `onboarding@resend.dev` ne livre qu'au titulaire du compte Resend. Vérifier dans Resend (Emails) l'état de l'envoi. Correctif durable : domaine Détour vérifié dans Resend, puis `admin_email` dans `[remotes.production.auth.email.smtp]`.
- **`supabase config push` : `Email template modification is not available for free tier projects using the default email provider`**. Cause : SMTP Resend absent du push (`RESEND_API_KEY` non exporté). Correctif : `set -a && source .env.production && set +a` avant le push.
- **L'app ne rappelle pas l'API au lancement (rien dans le journal du serveur), sans erreur**. Normal pendant une heure : le cache HTTP d'Android sert `/areas` et `/areas/:id/places` (`Cache-Control: max-age=3600`). Pour forcer un appel : `adb shell run-as com.b9r9.dtour rm -rf cache/http-cache`, app arrêtée.
- **L'app garde les anciens lieux**. Cause : API injoignable (serveur arrêté, `adb reverse` perdu, `EXPO_PUBLIC_API_URL` absent ou Metro pas relancé). Metro affiche `Areas not refreshed, using the cache`. Correctif : relancer `npm run dev`, `adb reverse tcp:3000 tcp:3000`, Metro.
- **Gradle échoue avec une erreur de version Java**. Cause : JDK 25 par défaut. Correctif : `JAVA_HOME` sur le JDK d'Android Studio (voir Installer).

## Inspecter la base locale

La base SQLite de l'app est dans le dossier privé de l'app (build de développement uniquement, `run-as` exige une app débogable) :

```
adb exec-out run-as com.b9r9.dtour sh -c 'cat files/SQLite/discover.db' > /tmp/discover.db
adb exec-out run-as com.b9r9.dtour sh -c 'cat files/SQLite/discover.db-wal' > /tmp/discover.db-wal
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');console.log(d.prepare('PRAGMA user_version').get(),d.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all())"
```

Repartir d'une base vide : `adb shell pm clear com.b9r9.dtour` (efface toutes les découvertes de l'appareil).

## Restaurer

Offre gratuite Supabase : aucune sauvegarde. Si la base en ligne est perdue, recréer le projet, puis `supabase db push`, `supabase config push` et la collecte (voir Déployer le serveur). Lieux et zones reviennent par la collecte ; les comptes sont perdus (les utilisateurs se reconnectent avec leur e-mail, rien d'autre n'est lié au compte). Les découvertes ne sont jamais sur le serveur. Achats : gardés par les stores, jamais dans notre base ; « Restaurer mes achats » (Profil) les retrouve sur un nouveau téléphone, avec le même compte de store.

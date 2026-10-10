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

Revoir l'écran d'accueil : désinstaller l'app (`adb uninstall com.b9r9.discover`) ou effacer ses données, puis relancer.

Vérifier l'enregistrement du chemin : marcher quelques minutes, puis compter les points (base copiée comme dans « Inspecter la base locale ») :

```
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');console.log(d.prepare('SELECT COUNT(*) n, MAX(recorded_at) last FROM walked_paths').get())"
```

Vérifier la tâche de fond (permission « Toujours » + réglage actif) : la notification « Détour dévoile ta balade » est visible, et le service tourne :

```
adb shell dumpsys activity services com.b9r9.discover | grep -i location
```

## RevenueCat (achats)

Clé publique du SDK dans `app/.env` : `EXPO_PUBLIC_REVENUECAT_KEY`. En développement, la clé `test_…` du Test Store : achats simulés, sans compte Play ni App Store. Après un changement de `.env`, relancer Metro (`npm start`), la valeur est copiée dans le bundle.

L'app est payante au téléchargement (prix fixé dans la Play Console et App Store Connect) : RevenueCat ne vend que les cartes. Configurer le projet dans le tableau de bord RevenueCat (app.revenuecat.com), Test Store :

1. Product catalog > Products : une carte par zone, achat unique, `map_<id de zone>` (`map_landes`, `map_gironde`, `map_gironde-bordeaux`), et `map_france`. Prix : ville < département < France.
2. Rien d'autre : ni entitlement, ni offering, ni paywall. L'app lit les cartes par `getProducts` et les achats par `allPurchasedProductIdentifiers`.

Ajouter un département : le collecter (voir plus haut), puis créer ses produits `map_<id>` pour lui et chaque grande ville. Une zone sans produit s'affiche « À débloquer », sans bouton.

Tester un achat sur le téléphone : Profil > Mes cartes > « Débloquer · prix », puis « Test valid purchase » dans la fenêtre du Test Store. La carte passe à « Débloquée ». Logs : `adb logcat | grep -i purchases`.

Après un ajout de module natif comme `react-native-purchases`, `prebuild --clean` efface `android/local.properties` : `ANDROID_HOME` doit être exporté (voir Installer), sinon Gradle échoue avec `SDK location not found`.

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
adb shell am force-stop com.b9r9.discover
adb exec-out run-as com.b9r9.discover sh -c 'cat files/SQLite/discover.db' > /tmp/discover.db
adb exec-out run-as com.b9r9.discover sh -c 'cat files/SQLite/discover.db-wal' > /tmp/discover.db-wal
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');const r=d.prepare('INSERT INTO photos (uri, latitude, longitude, accuracy, taken_at) VALUES (?,?,?,?,?)').run('file:///fake-dev.jpg',44.39308,-1.15628,5,Date.now());d.prepare('INSERT INTO discovered_places VALUES (?,?,?,?)').run('osm:way/127816135',Date.now(),'[]',Number(r.lastInsertRowid));d.exec('PRAGMA wal_checkpoint(TRUNCATE)')"
adb push /tmp/discover.db /data/local/tmp/discover.db
adb shell "run-as com.b9r9.discover sh -c 'cp /data/local/tmp/discover.db files/SQLite/discover.db && rm -f files/SQLite/discover.db-wal files/SQLite/discover.db-shm'"
```

Pour la retirer, même procédure avec à la place du `node -e` :

```
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');d.exec(\"DELETE FROM discovered_places WHERE photo_id IN (SELECT id FROM photos WHERE uri='file:///fake-dev.jpg'); DELETE FROM photos WHERE uri='file:///fake-dev.jpg'; PRAGMA wal_checkpoint(TRUNCATE)\")"
```

## Tester la photo sans se déplacer (téléphone de développement)

Pose un faux lieu à la dernière position enregistrée, puis prends une photo depuis l'onglet Photo. Le lieu `dev` (zone `dev`) n'est pas effacé par la mise à jour des lieux, qui ne remplace que la zone du téléphone. App arrêtée, base copiée et renvoyée :

```
adb shell am force-stop com.b9r9.discover
adb exec-out run-as com.b9r9.discover sh -c 'cat files/SQLite/discover.db' > /tmp/discover.db
adb exec-out run-as com.b9r9.discover sh -c 'cat files/SQLite/discover.db-wal' > /tmp/discover.db-wal
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');const p=d.prepare('SELECT latitude, longitude FROM walked_paths ORDER BY recorded_at DESC LIMIT 1').get();d.prepare('INSERT OR REPLACE INTO places_cache (id, area_id, name, latitude, longitude, category, updated_at) VALUES (?,?,?,?,?,?,?)').run('dev:'+Date.now(),'dev','Lieu de test photo',p.latitude,p.longitude,null,Date.now());d.exec('PRAGMA wal_checkpoint(TRUNCATE)')"
adb push /tmp/discover.db /data/local/tmp/discover.db
adb shell "run-as com.b9r9.discover sh -c 'cp /data/local/tmp/discover.db files/SQLite/discover.db && rm -f files/SQLite/discover.db-wal files/SQLite/discover.db-shm'"
```

Attendu : « Tu y es presque » sur la caméra, puis retour sur la Carte avec la zone qui se dissipe. Une deuxième photo au même endroit : « Tu as déjà découvert ce lieu. ». Photos gardées : `adb shell run-as com.b9r9.discover ls files/photos`.

Créer un lieu à toi : prendre une photo à plus de 50 m de tout lieu (sans faux lieu, la plupart des endroits conviennent). Attendu : formulaire « Aucun lieu ici. En faire un lieu à toi ? », puis retour Carte avec la zone dévoilée. Le 4e en 24 h : « Tu as déjà créé 3 lieux aujourd'hui ». Les retirer :

```
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');d.exec(\"CREATE TEMP TABLE gone AS SELECT photo_id FROM personal_places; DELETE FROM discovered_places WHERE place_id LIKE 'personal:%'; DELETE FROM personal_places; DELETE FROM photos WHERE id IN (SELECT photo_id FROM gone); PRAGMA wal_checkpoint(TRUNCATE)\")"
```

Pour tout retirer (faux lieux, leurs découvertes et toutes les photos), même procédure avec à la place du `node -e`, puis supprimer les fichiers :

```
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');d.exec(\"CREATE TEMP TABLE gone AS SELECT photo_id FROM discovered_places WHERE place_id LIKE 'dev:%'; DELETE FROM discovered_places WHERE place_id LIKE 'dev:%'; DELETE FROM photos WHERE id IN (SELECT photo_id FROM gone); DELETE FROM places_cache WHERE area_id='dev'; PRAGMA wal_checkpoint(TRUNCATE)\")"
adb shell "run-as com.b9r9.discover rm -rf files/photos"
```

Le dernier `rm` efface aussi les photos de vraies découvertes : à éviter hors du téléphone de développement.

## Builder et publier

_À remplir en phase 8 : EAS Build iOS/Android, TestFlight, Play Store._

## Déployer le serveur

Secrets du projet en ligne dans `server/.env.production` (ignoré par git, droits 600) : `SUPABASE_DB_PASSWORD`, `DATABASE_URL`, `RESEND_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`. Le recréer à la main depuis le tableau de bord Supabase (Database > Connect > Session pooler, et Settings > API Keys) et Resend si le fichier est perdu. Le CLI masque les clés secrètes sans `--reveal` :

```
supabase projects api-keys --project-ref oqlyowhfpfueslepdlzi --reveal -o json
```

Base en ligne (CLI déjà lié au projet `oqlyowhfpfueslepdlzi`, voir `server/supabase/.temp/`) :

```
cd server && supabase link --project-ref oqlyowhfpfueslepdlzi   # une fois par poste
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
- **L'app ne rappelle pas l'API au lancement (rien dans le journal du serveur), sans erreur**. Normal pendant une heure : le cache HTTP d'Android sert `/areas` et `/areas/:id/places` (`Cache-Control: max-age=3600`). Pour forcer un appel : `adb shell run-as com.b9r9.discover rm -rf cache/http-cache`, app arrêtée.
- **L'app garde les anciens lieux**. Cause : API injoignable (serveur arrêté, `adb reverse` perdu, `EXPO_PUBLIC_API_URL` absent ou Metro pas relancé). Metro affiche `Areas not refreshed, using the cache`. Correctif : relancer `npm run dev`, `adb reverse tcp:3000 tcp:3000`, Metro.
- **Gradle échoue avec une erreur de version Java**. Cause : JDK 25 par défaut. Correctif : `JAVA_HOME` sur le JDK d'Android Studio (voir Installer).

## Inspecter la base locale

La base SQLite de l'app est dans le dossier privé de l'app (build de développement uniquement, `run-as` exige une app débogable) :

```
adb exec-out run-as com.b9r9.discover sh -c 'cat files/SQLite/discover.db' > /tmp/discover.db
adb exec-out run-as com.b9r9.discover sh -c 'cat files/SQLite/discover.db-wal' > /tmp/discover.db-wal
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');console.log(d.prepare('PRAGMA user_version').get(),d.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all())"
```

Repartir d'une base vide : `adb shell pm clear com.b9r9.discover` (efface toutes les découvertes de l'appareil).

## Restaurer

Offre gratuite Supabase : aucune sauvegarde. Si la base en ligne est perdue, recréer le projet, puis `supabase db push`, `supabase config push` et la collecte (voir Déployer le serveur). Lieux et zones reviennent par la collecte ; les comptes sont perdus (les utilisateurs se reconnectent avec leur e-mail, rien d'autre n'est lié au compte). Les découvertes ne sont jamais sur le serveur. Achats : gardés par les stores et RevenueCat, jamais dans notre base ; « Restaurer mes achats » (Profil) les retrouve sur un nouveau téléphone, avec le même compte de store.

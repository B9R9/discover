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
```

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

Pose un faux lieu à la dernière position enregistrée, puis prends une photo depuis l'onglet Photo. Le lieu `dev` n'est pas effacé par les lieux de test au démarrage. App arrêtée, base copiée et renvoyée :

```
adb shell am force-stop com.b9r9.discover
adb exec-out run-as com.b9r9.discover sh -c 'cat files/SQLite/discover.db' > /tmp/discover.db
adb exec-out run-as com.b9r9.discover sh -c 'cat files/SQLite/discover.db-wal' > /tmp/discover.db-wal
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');const p=d.prepare('SELECT latitude, longitude FROM walked_paths ORDER BY recorded_at DESC LIMIT 1').get();d.prepare('INSERT OR REPLACE INTO places_cache (id, city_id, name, latitude, longitude, category, updated_at) VALUES (?,?,?,?,?,?,?)').run('dev:'+Date.now(),'dev','Lieu de test photo',p.latitude,p.longitude,null,Date.now());d.exec('PRAGMA wal_checkpoint(TRUNCATE)')"
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
node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync('/tmp/discover.db');d.exec(\"CREATE TEMP TABLE gone AS SELECT photo_id FROM discovered_places WHERE place_id LIKE 'dev:%'; DELETE FROM discovered_places WHERE place_id LIKE 'dev:%'; DELETE FROM photos WHERE id IN (SELECT photo_id FROM gone); DELETE FROM places_cache WHERE city_id='dev'; PRAGMA wal_checkpoint(TRUNCATE)\")"
adb shell "run-as com.b9r9.discover rm -rf files/photos"
```

Le dernier `rm` efface aussi les photos de vraies découvertes : à éviter hors du téléphone de développement.

## Builder et publier

_À remplir en phase 8 : EAS Build iOS/Android, TestFlight, Play Store._

## Déployer le serveur

_À remplir en phase 5._

## Diagnostiquer une panne

_Une entrée par panne rencontrée : symptôme, cause, correctif._

- **expo-doctor : « duplicate dependencies » sur `react`**. Cause : une dépendance de test tire une autre version de `react` à la racine. Correctif : `overrides.react` dans `package.json` racine, aligné sur la version de `app/package.json`, puis supprimer `node_modules` et `package-lock.json` et relancer `npm install`.
- **Le téléphone n'affiche pas les changements de code**. Cause : Metro lancé avec `CI=1`, qui désactive la surveillance des fichiers. Correctif : relancer `cd app && npm start` sans `CI`, puis rouvrir l'app.
- **Onglets avec une icône « GLYPH » cassée**. Cause : sans `tabBarIcon`, Expo Router affiche un `MissingIcon`. Correctif : fournir `tabBarIcon` (voir `app/src/app/_layout.tsx`).
- **L'app se ferme au lancement avec `Requested job cannot be persisted without holding android.permission.RECEIVE_BOOT_COMPLETED permission`** (logcat, `LocationTaskConsumer`). Cause : `expo-task-manager` planifie un job persistant mais son plugin n'ajoute pas la permission. Correctif : `android.permissions` contient `RECEIVE_BOOT_COMPLETED` dans `app/app.json`, puis prebuild `--clean` et réinstallation.
- **Permission « Toujours » accordée et réglage actif, mais pas de notification ni de service** (`dumpsys activity services` vide). Cause : la tâche reste enregistrée après la mort de son service (crash, mise à jour), et `hasStartedLocationUpdatesAsync` renvoie `true`. Correctif : `syncBackgroundTracking` appelle toujours `startLocationUpdatesAsync` quand le suivi est voulu (`app/src/features/location/tracking.ts`).
- **Gradle : `SDK location not found`**. Cause : `ANDROID_HOME` absent du shell (par exemple un shell qui ne lit pas `~/.zshrc`). Correctif : `export ANDROID_HOME=$HOME/Library/Android/sdk` avant `npm run android`.
- **Logcat : `MapLibre Native [WARN] ... Invalid geometry in line layer`**. Sans gravité : vient des tuiles OpenFreeMap (le warning reste quand nos couches de lignes sont retirées).
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

_À remplir en phase 5 : sauvegardes Postgres, restauration des achats (RevenueCat)._

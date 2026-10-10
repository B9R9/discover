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

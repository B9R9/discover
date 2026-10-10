# Documentation Détour

Mise à jour au fil des phases de `tasks/todo.md`. Concept : `../discover.md`. Règles pour les agents : `../CLAUDE.md`. Exploitation : `runbook.md`. Charte graphique : `design.md`.

## Vue d'ensemble

App mobile (React Native + Expo) qui montre les lieux autour de l'utilisateur. La carte est cachée et se dévoile autour des lieux découverts, validés par une photo prise à proximité.

## Architecture

- `/app` : app Expo. Position, chemin parcouru et découvertes restent sur l'appareil (SQLite).
- `/server` : API Node + jobs de collecte des lieux, Postgres/PostGIS (Supabase).
- `/shared` : types partagés (`@discover/shared`), consommés en source TypeScript, sans build.

Monorepo npm workspaces. Expo SDK 57, React Native 0.86, TypeScript 6 strict. Le serveur tourne sur Node 24, qui exécute le TypeScript sans build.

## Fonctionnalités

- **Squelette de l'app** : 3 onglets (Carte, Photo, Profil) avec Expo Router. Les routes de `app/src/app/` ré-exportent les écrans de `app/src/screens/`. Tous les textes passent par `t()` (`app/src/lib/i18n/`). Une clé inconnue est une erreur TypeScript.
- **Stockage local (SQLite)** : `expo-sqlite`, base `discover.db` sur l'appareil, ouverte par `SQLiteProvider` dans `app/src/app/_layout.tsx`, qui lance les migrations au démarrage. Tables : `photos`, `discovered_places` (lieu, date, chemin parcouru en JSON, photo), `owned_maps` (ville, `free` ou `purchased`), `walked_paths` (points GPS horodatés), `places_cache` (lieux d'une ville pour le hors ligne). Une fonction de lecture/écriture par table dans `app/src/db/`. Ces données ne quittent jamais l'appareil, sauf `places_cache` qui vient du serveur.
- **Serveur** : squelette HTTP qui répond `{"status":"ok"}` (`server/src/index.ts`).
- **Qualité** : ESLint (`any` interdit), Prettier, Jest (`jest-expo`) côté app, `node --test` côté serveur, CI GitHub Actions.

## Décisions

- Ville de développement : Biscarrosse
- Tuiles : OpenFreeMap
- Itinéraire à pied : OpenRouteService (repli : Valhalla)
- Première source de lieux : OpenStreetMap via Overpass
- Navigation : Expo Router, onglets JS (`Tabs`)
- Traductions : dictionnaire typé maison, sans dépendance
- Plateforme de développement : Android (Nothing Phone), iOS plus tard
- Migrations SQLite : liste de scripts SQL dans `app/src/db/migrations.ts`, version dans `PRAGMA user_version`, une transaction par migration. On ajoute, on ne modifie jamais une migration publiée.
- Tests de la base : les requêtes prennent une interface `Db` (sous-ensemble d'expo-sqlite). En test, elle est fournie par `node:sqlite` (intégré à Node 24), sans code natif ni dépendance.
- Nom de l'app : Détour. Identifiants techniques inchangés (`discover` : slug, scheme, `com.b9r9.discover`, `discover.db`, workspaces `@discover/*`, dépôt) pour ne pas casser le build installé ni les données locales.
- Interface en thème clair forcé pour l'instant (`userInterfaceStyle: light`)

# Documentation Discover

Mise à jour au fil des phases de `tasks/todo.md`. Concept : `../discover.md`. Règles pour les agents : `../CLAUDE.md`. Exploitation : `runbook.md`.

## Vue d'ensemble

App mobile (React Native + Expo) qui montre les lieux autour de l'utilisateur. La carte est cachée et se dévoile autour des lieux découverts, validés par une photo prise à proximité.

## Architecture

- `/app` : app Expo. Position, chemin parcouru et découvertes restent sur l'appareil (SQLite).
- `/server` : API Node + jobs de collecte des lieux, Postgres/PostGIS (Supabase).
- `/shared` : types partagés (`@discover/shared`), consommés en source TypeScript, sans build.

Monorepo npm workspaces. Expo SDK 57, React Native 0.86, TypeScript 6 strict. Le serveur tourne sur Node 24, qui exécute le TypeScript sans build.

## Fonctionnalités

- **Squelette de l'app** : 3 onglets (Carte, Photo, Profil) avec Expo Router. Les routes de `app/src/app/` ré-exportent les écrans de `app/src/screens/`. Tous les textes passent par `t()` (`app/src/lib/i18n/`). Une clé inconnue est une erreur TypeScript.
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
- Interface en thème clair forcé pour l'instant (`userInterfaceStyle: light`)

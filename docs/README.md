# Documentation Discover

Mise à jour au fil des phases de `tasks/todo.md`. Concept : `../discover.md`. Règles pour les agents : `../CLAUDE.md`. Exploitation : `runbook.md`.

## Vue d'ensemble

App mobile (React Native + Expo) qui montre les lieux autour de l'utilisateur. La carte est cachée et se dévoile autour des lieux découverts, validés par une photo prise à proximité.

## Architecture

- `/app` : app Expo. Position, chemin parcouru et découvertes restent sur l'appareil (SQLite).
- `/server` : API Node + jobs de collecte des lieux, Postgres/PostGIS (Supabase).
- `/shared` : types partagés.

## Fonctionnalités

_Rien de livré pour l'instant. Ajouter une entrée par fonctionnalité terminée : comportement, règles métier, fichiers clés._

## Décisions

- Ville de développement : Biscarrosse
- Tuiles : OpenFreeMap
- Itinéraire à pied : OpenRouteService (repli : Valhalla)
- Première source de lieux : OpenStreetMap via Overpass

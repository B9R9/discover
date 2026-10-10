# Runbook Discover

Procédures d'exploitation. Chaque procédure contient des commandes réellement testées. Mettre à jour dans le même commit que le changement concerné.

## Installer

_À remplir en phase 0 : prérequis (Node, Xcode, Android Studio), `npm install`, variables d'environnement (`.env.example`)._

## Lancer en développement

```
cd app && npx expo start --dev-client
cd server && npm run dev
```

MapLibre est du code natif : Expo Go ne marche pas. Il faut un development build (`npx expo run:ios` ou `run:android`).

## Vérifier

```
cd app && npx tsc --noEmit
```

## Builder et publier

_À remplir en phase 8 : EAS Build iOS/Android, TestFlight, Play Store._

## Déployer le serveur

_À remplir en phase 5._

## Diagnostiquer une panne

_Une entrée par panne rencontrée : symptôme, cause, correctif._

## Restaurer

_À remplir en phase 5 : sauvegardes Postgres, restauration des achats (RevenueCat)._

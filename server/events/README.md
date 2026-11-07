# Sorties de Détour

Les sorties de l'onglet Sorties sont ajoutées à la main pour l'instant (la collecte automatique viendra ensuite).

```
cd server && source .env.production && npm run events -- seed events/<fichier>.json
```

Un fichier est un tableau d'événements : `title`, `kind`, `placeName`, `latitude`, `longitude` et `startsAt` (avec le décalage horaire, ex. `2026-11-14T11:00:00+02:00`) sont obligatoires ; `endsAt`, `theme`, `description`, `area`, `free` (faux par défaut) et `priceNote` sont facultatifs. Relancer le même fichier met à jour les événements (même titre, même début). Un événement disparaît de l'app trois heures après son début, ou à sa fin s'il en a une.

`exemple-helsinki.json` est un exemple inventé pour essayer l'écran : ne pas le semer en production tel quel. Remplace les événements par de vrais avant.

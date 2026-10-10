# Plan : construire Détour

Ordre pensé pour avoir une boucle jouable le plus tôt possible : carte, photo, validation, le tout en local. Le backend vient après, avec des lieux de test en dur au départ.

Chaque phase finit par une vérification : `cd app && npx tsc --noEmit`, les tests, puis un test manuel sur development build. Après chaque phase, mettre à jour « État actuel » dans `CLAUDE.md` et le bilan en bas de ce fichier.

## Phase 0 : Fondations
- [x] Créer `/app` avec Expo (TypeScript strict, `"strict": true`)
- [x] Créer `/shared` (types partagés) et `/server` (squelette Node + TypeScript strict)
- [x] Brancher `/shared` dans `/app` et `/server` (npm workspaces)
- [x] Arborescence `/app/src` : `screens/`, `components/`, `features/`, `db/`, `lib/`
- [x] ESLint (règle `no-explicit-any`) + Prettier
- [x] Runner de tests (`jest-expo` dans `/app`, `node --test` dans `/server`)
- [x] Variables d'environnement : `.env.example`, aucune clé dans le code
- [x] Navigation (écran Carte, écran Photo, écran Profil)
- [x] Fichier de traduction français + helper `t()` (aucun texte en dur)
- [x] Development build Android (`npm run android` dans `/app`), Expo Go ne marche pas avec MapLibre
- [x] CI GitHub Actions : typecheck + lint + tests sur chaque push
- [x] Test : l'app démarre sur development build, la CI passe

## Phase 1 : Stockage local (SQLite)
- [x] Schéma `discovered_places`, `photos`, `owned_maps` dans `app/src/db/`
- [x] Table `walked_paths` : points GPS du chemin parcouru (reste sur l'appareil)
- [x] Table `places_cache` : lieux de la ville en cache, pour le hors ligne
- [x] Migrations versionnées au démarrage
- [x] Fonctions de lecture/écriture (une responsabilité par fichier)
- [x] Test : insérer et relire une découverte, migration sur base vide et sur base existante

## Phase 2 : Carte et brouillard
- [x] Brancher les tuiles OpenFreeMap
- [x] Intégrer `@maplibre/maplibre-react-native` + style de carte
- [x] Écran d'accueil : explication du concept et des permissions avant de les demander
- [x] Position utilisateur (`expo-location`, texte de permission en français)
- [ ] Enregistrement du chemin parcouru dans `walked_paths`, app ouverte et en arrière-plan (`expo-location` + `expo-task-manager`), échantillonnage limité pour la batterie (distance minimale entre deux points)
- [x] Permission « Toujours autoriser » demandée après la permission de premier plan, avec explication en français ; l'app reste jouable si elle est refusée (enregistrement app ouverte seulement)
- [ ] Android : service de premier plan avec notification permanente pendant l'enregistrement ; iOS : `UIBackgroundModes` `location`
- [x] Réglage pour couper l'enregistrement en arrière-plan
- [x] Calcul des zones dévoilées : cercle de 150 m autour des lieux découverts + bande le long des chemins parcourus
- [x] Couche brouillard : tout est caché sauf les zones dévoilées
- [ ] Performance : le brouillard reste fluide avec 500 lieux découverts et de longs chemins
- [x] Test : avec une découverte factice, seule la zone de 150 m est visible

### Plan détaillé phase 2 (validé le 2026-10-10)

Dépendances (`npx expo install`) :
- `@maplibre/maplibre-react-native` (prévue par la stack) + `@types/geojson` en dev (peer dependency)
- `expo-location` (prévue par la stack), `expo-task-manager` (seul moyen Expo de recevoir des positions en arrière-plan)
- `polygon-clipping` (remplace `polyclip-ts`, 7 fois plus lente) : union des zones dévoilées, pur JS, sans code natif (c'est ce qu'utilise turf 7). Sans union, les trous qui se chevauchent cassent le remplissage MapLibre.

Étapes :
- [x] 1. Dépendances + plugins `app.json` (MapLibre, `expo-location` avec textes français, arrière-plan Android et iOS, service de premier plan), nouveau development build
- [x] 2. Migration 2 : table `settings` (clé, valeur) + `db/settings.ts` : onboarding fait, enregistrement en arrière-plan actif
- [x] 3. `features/map/mapStyle.ts` : style OpenFreeMap `positron` (sobre, peu de labels). Mode sombre plus tard (l'app est en clair seulement)
- [x] 4. `features/location/` : `recordPoint.ts` (ignore précision > 50 m et points à moins de 20 m du précédent, écrit `walked_paths`), `backgroundTask.ts` (`TaskManager.defineTask`, ouvre la base lui-même), `tracking.ts` (arrière-plan via `startLocationUpdatesAsync` si permis et réglage actif, sinon `watchPositionAsync` app ouverte), `permissions.ts` (premier plan puis « Toujours »)
- [x] 5. `features/fog/` en fonctions pures : cercle de 150 m (polygone 32 côtés), bande le long des chemins (capsule par segment, chemins simplifiés à 5 m avant), union, puis polygone « monde moins zones dévoilées ». Position des lieux découverts lue dans `places_cache`, repli sur la position de la photo
- [x] 6. Rendu : `FogLayer` (remplissage Brume opacité 0,9 au-dessus de toutes les couches, bords adoucis par une ligne floutée `line-blur`), `WalkedPathLayer` (trait Sentier 4, bouts arrondis), position utilisateur Lanterne
- [x] 7. Écran d'accueil (route `onboarding`, affichée tant que non fait) : concept, pourquoi la position, pourquoi « Toujours », puis demande des permissions
- [x] 8. Profil : interrupteur « Enregistrer mes balades en arrière-plan »
- [x] 9. Tests : 140 m dévoilé / 160 m caché, zones qui se chevauchent fusionnées, filtre de `recordPoint`, migration 2, perf (500 lieux + 20 000 points sous 1 s en Node)
- [ ] 10. Test sur le Nothing Phone : carte, permissions, balade réelle app ouverte puis écran éteint, notification visible, réglage coupé
- [ ] 11. Doc (`docs/README.md`, `docs/runbook.md`), « État actuel » dans `CLAUDE.md`, bilan

Écarts avec le plan, une fois le code écrit :
- Style `liberty` et non `positron` : `positron` est gris, et la charte réserve le gris au brouillard.
- Union par tuiles de 0,005° (`fogGrid.ts`) : l'union globale coûtait environ 250 ms par nouveau point sur Mac. Seuil du test de perf passé à 1,5 s (balade aléatoire très dense), un nouveau point reste sous 50 ms.
- Écran d'accueil rendu à la place des onglets par `_layout.tsx`, pas une route. Fichiers renommés : `recordLocations.ts`, `FogLayers.tsx`, `UserDot.tsx`, `onboarding.ts`, `backgroundSetting.ts`.
- Ajout de la permission Android `RECEIVE_BOOT_COMPLETED` (sans elle, crash d'`expo-task-manager`).
- Vérifié sur le téléphone le 2026-10-10 : carte et brouillard, point de position, service de premier plan avec notification, réglage Profil qui coupe puis relance le service. Reste : une vraie balade (app ouverte puis écran éteint) et la fluidité avec beaucoup de données.
- Test de rendu `MapScreen.test.tsx` supprimé : MapLibre est natif et ne se rend pas dans Jest.

Hors phase 2 : animation de dissipation (phase 4), marqueurs de lieux (phase 3), cache du polygone calculé (seulement si le test de perf échoue).

## Phase 3 : Lieux et navigation (données de test)
- [x] Type `Place` dans `/shared` (fait en phase 1, pour `places_cache`)
- [ ] Jeu de lieux de test en dur à Biscarrosse
- [ ] Liste ou marqueurs des lieux proches (non découverts : pas de position exacte affichée sur la carte cachée)
- [ ] Lieu non découvert : flèche orientée par la boussole (`expo-location` heading) + distance à vol d'oiseau, jamais d'itinéraire
- [ ] Lieu découvert : itinéraire à pied via OpenRouteService, appel direct depuis l'app (notre serveur ne voit jamais la position). Clé dédiée à l'app, quota surveillé
- [ ] Test : un lieu non découvert n'expose aucune route, ni dans l'UI ni dans les données

### Plan détaillé phase 3 (à valider)

Aucune nouvelle dépendance : boussole via `expo-location`, appel OpenRouteService avec `fetch`, panneau du bas sans bibliothèque.

- [ ] 1. Lieux de test : une dizaine de vrais lieux de Biscarrosse (positions relevées une fois dans OpenStreetMap), écrits dans `places_cache` au démarrage par `replaceCachedPlaces`. La phase 5 remplacera seulement la source : le reste de l'app lit déjà `places_cache`
- [ ] 2. `features/places/nearbyPlaces.ts` : lieux triés par distance, chacun marqué découvert ou non (jointure avec `discovered_places`)
- [ ] 3. Panneau du bas sur l'écran Carte : liste des lieux proches (carte de lieu de la charte : aplat Brume + point d'interrogation si non découvert, distance). Aucun marqueur pour un lieu non découvert ; marqueur Sentier pour un lieu découvert
- [ ] 4. Lieu non découvert sélectionné : flèche Lanterne orientée par `watchHeadingAsync` (cap vers le lieu moins cap du téléphone) + distance à vol d'oiseau. Calcul du cap en fonction pure, testée
- [ ] 5. Lieu découvert sélectionné : itinéraire à pied OpenRouteService (`foot-walking`), clé dans `EXPO_PUBLIC_ORS_KEY`, tracé en trait Lanterne. La fonction d'itinéraire prend un `Discovery` (pas un `Place`) : impossible de l'appeler pour un lieu non découvert, et elle revérifie en base
- [ ] 6. Tests : cap et distance, tri des lieux, `fetchWalkingRoute` refuse un lieu non découvert sans appel réseau (`fetch` espionné), l'état de l'écran ne contient jamais de route pour un lieu non découvert
- [ ] 7. Test sur le téléphone, doc, runbook (clé ORS, quota), bilan

## Phase 4 : Photo et validation d'un lieu
- [ ] Écran caméra (`expo-camera`), pas d'import depuis la galerie
- [ ] Vérification GPS au moment de la photo : lieu à moins de 50 m
- [ ] Refus si la précision GPS est trop faible (seuil à définir, ex. 30 m)
- [ ] Android : refus si la position est simulée (`mocked`)
- [ ] Refus clair en français si trop loin ou GPS imprécis
- [ ] Enregistrement : fichier dans le dossier de l'app, ligne `photos`, ligne `discovered_places` (avec chemin parcouru)
- [ ] La carte se dévoile à la validation, avec une animation
- [ ] Galerie des lieux découverts (écran Profil)
- [ ] Test : photo à 49 m acceptée, à 51 m refusée, précision faible refusée

## Phase 5 : Backend, comptes et collecte des lieux
- [ ] Projet Supabase, Postgres + PostGIS
- [ ] Comptes : Supabase Auth (nécessaire pour achats, partage, commentaires). Le jeu local marche sans compte
- [ ] Suppression de compte depuis l'app (obligatoire App Store)
- [ ] Tables : lieux (nom, position, catégorie, source), villes, cartes partageables, commentaires, achats
- [ ] Row Level Security sur toutes les tables
- [ ] API Node : lieux d'une ville par identifiant de ville, pas par position exacte (le serveur ne voit pas où est l'utilisateur)
- [ ] Détection de la ville côté appareil (limites des villes téléchargées, test local)
- [ ] Jobs de collecte : OpenStreetMap via Overpass d'abord, puis autres sources ou scraping (respect des conditions d'usage et du `robots.txt`)
- [ ] Déduplication des lieux (même nom + distance < seuil)
- [ ] Jobs planifiés pour rafraîchir les lieux
- [ ] L'app remplace les lieux de test par l'API et remplit `places_cache`
- [ ] Test : relire les requêtes réseau, le serveur ne reçoit ni position ni historique des déplacements

## Phase 6 : Cartes et achats
- [ ] Ville offerte : la ville de l'utilisateur au premier lancement, enregistrée dans `owned_maps`
- [ ] Règle anti-abus : la ville offerte ne change pas (ou changement limité, à décider)
- [ ] RevenueCat : achat unique par ville (produits App Store et Play Store)
- [ ] Écran de choix des villes
- [ ] Restauration des achats
- [ ] Test : achat en sandbox iOS et Android, restauration sur un autre appareil

## Phase 7 : Social
- [ ] Partage volontaire d'une photo et d'un commentaire (envoi seulement après confirmation)
- [ ] Retirer les métadonnées EXIF (position) des photos avant envoi
- [ ] Carte partageable
- [ ] Modération (obligatoire App Store pour contenu utilisateur) : signaler, bloquer un utilisateur, filtrer
- [ ] Rien ne part vers le serveur sans action explicite de l'utilisateur
- [ ] Test : une photo partagée ne contient aucune donnée EXIF de position

## Phase 8 : Finition et publication
- [ ] Gestion d'erreurs (GPS refusé, caméra refusée, hors ligne, serveur indisponible)
- [ ] Mode hors ligne : jouer avec `places_cache`, synchroniser au retour du réseau
- [ ] Accessibilité de base (libellés, taille de texte, contraste)
- [ ] Tests des règles métier (50 m, 150 m, pas d'itinéraire sans découverte, aucune position envoyée)
- [ ] Remontée des crashs sans donnée de position (outil à décider)
- [ ] Play Store : déclaration de la position en arrière-plan (formulaire + vidéo de démonstration)
- [ ] Politique de confidentialité + étiquettes de confidentialité App Store et Play Store
- [ ] Icône, écran de lancement, fiches des stores
- [ ] Build EAS iOS/Android
- [ ] Bêta TestFlight + test interne Play Store

## Décisions prises
- Ville de développement : Biscarrosse
- Tuiles de carte : OpenFreeMap (OpenStreetMap, sans clé API)
- Itinéraire à pied : OpenRouteService (clé API, quota quotidien). Repli : Valhalla auto-hébergé
- Première source de lieux : OpenStreetMap via l'API Overpass
- Chemin parcouru : enregistré aussi en arrière-plan (les points restent sur l'appareil)

## Questions ouvertes
- Ville offerte au lancement (phase 6)
- Sauvegarde des découvertes si perte du téléphone : aucune, export manuel, ou sauvegarde chiffrée volontaire (phase 5)
- Catégories de lieux (phase 5)
- Ville offerte modifiable ou non (phase 6)
- Prix par ville (phase 6)
- Outil de remontée des crashs (phase 8)

## Bilan

À remplir à la fin de chaque phase.

### Phase 0
- Monorepo npm workspaces (`app`, `server`, `shared`), Expo SDK 57, TypeScript 6 strict, Node 24 côté serveur (TypeScript exécuté sans build).
- 3 onglets Expo Router, textes via `t()` typé, testé sur Nothing Phone (development build).
- Vérifié : format, typecheck, lint, tests (2 app, 3 serveur), `expo-doctor` 21/21, `assembleDebug` OK.
- Pièges rencontrés (détaillés dans `docs/runbook.md`) : doublon `react` (corrigé par `overrides`), JDK 25 refusé par Gradle, Metro sans surveillance des fichiers avec `CI=1`, icônes d'onglet `MissingIcon`.
- Reste : icônes d'onglet, thème sombre.

### Phase 1
- `expo-sqlite` (seule nouvelle dépendance, prévue par la stack). Base `discover.db` ouverte par `SQLiteProvider`, migrations au démarrage via `PRAGMA user_version`, une transaction par migration.
- 5 tables : `photos`, `discovered_places` (chemin en JSON, clé étrangère vers `photos`), `owned_maps`, `walked_paths`, `places_cache`. Un fichier de requêtes par table dans `app/src/db/`.
- Tests sur `node:sqlite` (Node 24) derrière une interface `Db` : 8 tests (base vide, base existante, rollback d'une migration cassée, aller-retour par table).
- Vérifié : format, typecheck, lint, tests, development build installé sur le Nothing Phone, base de l'appareil relue (version 1, 5 tables).
- `Place` et `CityId` ajoutés à `/shared` (avance sur la phase 3). `category` reste un texte libre en attendant la décision sur les catégories.

### Phase 2
- 4 dépendances : `@maplibre/maplibre-react-native` 11, `expo-location`, `expo-task-manager`, `polygon-clipping` (+ `@types/geojson` en dev). Migration 2 : table `settings`.
- Brouillard calculé par tuiles de 0,005° avec `polygon-clipping` : 500 lieux + 20 000 points en environ 1,2 s sur Mac, un nouveau point en moins de 50 ms. Bords adoucis par une ligne floutée découpée par tuile.
- Chemin : points à 20 m minimum, précision 50 m ou mieux, coupure au-delà de 200 m, simplification à 5 m. Arrière-plan via tâche `walked-path-tracking` et service de premier plan Android ; sinon l'app ouverte enregistre.
- Vérifié : 18 tests, typecheck, lint, format, `expo-doctor` 21/21, sur le téléphone : carte, brouillard, position, notification de fond, réglage Profil qui coupe et relance le service.
- 3 bugs vus seulement sur le téléphone : `RECEIVE_BOOT_COMPLETED` manquante (crash), tâche enregistrée sans service après le crash, deux enregistrements simultanés. Corrigés, détaillés dans `tasks/lessons.md` et `docs/runbook.md`.
- Reste : une vraie balade (app ouverte puis écran éteint) et la fluidité sur téléphone avec beaucoup de données.

# Plan : construire Détour

Ordre pensé pour avoir une boucle jouable le plus tôt possible : carte, photo, validation, le tout en local. Le backend vient après, avec des lieux de test en dur au départ.

Chaque phase finit par une vérification : `cd app && npx tsc --noEmit`, les tests, puis un test manuel sur development build. Après chaque phase, mettre à jour « État actuel » dans `.claude/CLAUDE.md` et le bilan en bas de ce fichier.

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
- [ ] 11. Doc (`docs/README.md`, `docs/runbook.md`), « État actuel » dans `.claude/CLAUDE.md`, bilan

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
- [x] Jeu de lieux de test en dur à Biscarrosse
- [x] Liste ou marqueurs des lieux proches (non découverts : pas de position exacte affichée sur la carte cachée)
- [ ] Lieu non découvert : flèche orientée par la boussole (`expo-location` heading) + distance à vol d'oiseau, jamais d'itinéraire
- [x] Lieu découvert : itinéraire à pied via OpenRouteService, appel direct depuis l'app (notre serveur ne voit jamais la position). Clé dédiée à l'app, quota surveillé
- [x] Test : un lieu non découvert n'expose aucune route, ni dans l'UI ni dans les données

### Plan détaillé phase 3 (validé le 2026-10-10)

Aucune nouvelle dépendance : boussole via `expo-location`, appel OpenRouteService avec `fetch`, panneau du bas sans bibliothèque.

- [x] 1. Lieux de test : une dizaine de vrais lieux de Biscarrosse (positions relevées une fois dans OpenStreetMap), écrits dans `places_cache` au démarrage par `replaceCachedPlaces`. La phase 5 remplacera seulement la source : le reste de l'app lit déjà `places_cache`
- [x] 2. `features/places/nearbyPlaces.ts` : lieux triés par distance, chacun marqué découvert ou non (jointure avec `discovered_places`)
- [x] 3. Panneau du bas sur l'écran Carte : liste des lieux proches (carte de lieu de la charte : aplat Brume + point d'interrogation si non découvert, distance). Aucun marqueur pour un lieu non découvert ; marqueur Sentier pour un lieu découvert
- [x] 4. Lieu non découvert sélectionné : flèche Lanterne orientée par `watchHeadingAsync` (cap vers le lieu moins cap du téléphone) + distance à vol d'oiseau. Calcul du cap en fonction pure, testée
- [x] 5. Lieu découvert sélectionné : itinéraire à pied OpenRouteService (`foot-walking`), clé dans `EXPO_PUBLIC_ORS_KEY`, tracé en trait Lanterne. `fetchWalkingRoute` revérifie en base que le lieu est découvert avant tout appel réseau, et un lieu non découvert ne porte ni nom ni position dans les données de l'écran (type `NearbyPlace`)
- [x] 6. Tests : cap et distance, tri des lieux, `fetchWalkingRoute` refuse un lieu non découvert sans appel réseau (`fetch` espionné), l'état de l'écran ne contient jamais de route pour un lieu non découvert
- [ ] 7. Test sur le téléphone, doc, runbook (clé ORS, quota), bilan

Fait sur le téléphone le 2026-10-10 : liste (nom caché, catégorie, distance), flèche orientée par la boussole, lieu découvert factice (Piscine) avec badge, message sans clé ORS, carte centrée au-dessus du panneau. Itinéraire réel vérifié avec la clé ORS (Piscine : 10 min à pied, 830 m, tracé par les rues). Reste : flèche vérifiée dehors en marchant. Lieux relevés avec Nominatim (Overpass surchargé ce jour-là). Découverte factice laissée sur le téléphone (procédure de retrait dans le runbook).

## Phase 4 : Photo et validation d'un lieu
- [x] Écran caméra (`expo-camera`), pas d'import depuis la galerie
- [x] Vérification GPS au moment de la photo : lieu à moins de 50 m
- [x] Refus si la précision GPS est trop faible (seuil à définir, ex. 30 m)
- [x] Android : refus si la position est simulée (`mocked`)
- [x] Refus clair en français si trop loin ou GPS imprécis
- [x] Enregistrement : fichier dans le dossier de l'app, ligne `photos`, ligne `discovered_places` (avec chemin parcouru)
- [x] La carte se dévoile à la validation, avec une animation
- [x] Galerie des lieux découverts (écran Profil)
- [x] Test : photo à 49 m acceptée, à 51 m refusée, précision faible refusée

### Plan détaillé phase 4 (validé le 2026-10-10)

Dépendances (`npx expo install`) :
- `expo-camera` (prévue par la stack). Plugin `app.json` : texte de permission en français, micro désactivé (`recordAudioAndroid: false`, pas de permission micro).
- `expo-file-system` (déjà présent en dépendance transitive d'`expo`, à déclarer) : déplacer la photo du cache vers le dossier documents de l'app, sinon le système peut l'effacer.

Étapes :
- [x] 1. `features/photo/validatePhoto.ts`, fonction pure : reçoit la position au moment de la photo et les lieux en cache, renvoie le lieu validé ou la raison du refus : `mocked` (Android), `inaccurate` (précision > 30 m), `stale` (position de plus de 10 s), `alreadyDiscovered` (seul un lieu déjà découvert est à 50 m ou moins), `tooFar` (aucun lieu non découvert à 50 m ou moins). Plusieurs lieux à portée : le plus proche.
- [x] 2. `features/photo/saveDiscovery.ts` : copie le fichier dans `documents/photos/`, puis dans une transaction ligne `photos` + ligne `discovered_places`. Chemin parcouru enregistré = points de `walked_paths` depuis la découverte précédente (ou depuis 24 h pour la première). Fichier supprimé si la transaction échoue.
- [x] 3. Écran Photo plein écran (`CameraView`) : pastille Lanterne de capture, message de portée en direct via la position déjà suivie (« Tu y es presque » à 50 m ou moins d'un lieu non découvert, sinon « Rapproche-toi »). À la capture : `takePictureAsync` et `getCurrentPositionAsync` (précision haute) en parallèle, puis validation. Refus : message clair, photo jetée. Succès : bascule sur l'onglet Carte. Pas d'import depuis la galerie. Permission caméra refusée : message + bouton vers les réglages.
- [x] 4. Dissipation sur la carte : `useFog` repère les découvertes arrivées après le premier chargement ; `FogLayers` pose un disque Brume de 150 m par-dessus la zone neuve, dont l'opacité passe de 0,9 à 0 en 600 ms par transition MapLibre (`fill-opacity-transition`, aucun calcul JS par image). Réduire les animations activé : pas de disque. Caméra centrée sur le lieu.
- [x] 5. `useNearbyPlaces` relit les lieux au retour sur l'écran Carte (`useFocusEffect`), pour qu'un lieu découvert passe tout de suite en « Découvert » avec itinéraire.
- [x] 6. Galerie sur l'écran Profil : grille de miniatures (rayon 12, recadrées), nom du lieu et date. Vide : texte d'encouragement. Requête `listDiscoveriesWithPhotos` dans `db/discoveries.ts`.
- [x] 7. Tests : 49 m acceptée, 51 m refusée, précision 31 m refusée, position simulée refusée, position périmée refusée, lieu déjà découvert, le plus proche gagne ; `saveDiscovery` écrit photo + découverte + chemin, et rien si la transaction échoue.
- [x] 8. Téléphone : manifeste (permission caméra, pas de micro), `adb logcat` sans crash, vraie photo devant un lieu ou découverte simulée (repli : faux lieu posé à ma position, procédure dans le runbook).
- [x] 9. Doc (`docs/README.md`, `docs/runbook.md`), « État actuel » dans `.claude/CLAUDE.md`, `.claude/lessons.md`, bilan.

Écarts avec le plan, une fois le code écrit :
- Dissipation pilotée en JS (`requestAnimationFrame`, seule l'opacité change) et non par `fill-opacity-transition` : avec une transition, rien ne garantit que MapLibre a peint l'état 0,9 avant de passer à 0.
- `captureDiscovery.ts` (caméra, GPS, fichiers) séparé de `recordDiscovery.ts` (SQLite, testé en Node).
- Galerie sur deux colonnes, fond Brume si le fichier manque (découverte factice de la phase 3).

Fait sur le téléphone le 2026-10-10 : permission caméra (texte, pas de micro dans le manifeste), « Tu y es presque » à côté d'un faux lieu, photo acceptée, retour Carte avec zone de 150 m dévoilée et lieu « Découvert », galerie Profil, deuxième photo refusée (« déjà découvert »), photo refusée bien effacée, aucun crash dans `adb logcat`. Pas vu : l'animation elle-même (l'enregistrement d'écran démarrait après), refus « trop loin » dehors, position simulée. Faux lieux et photos retirés du téléphone.

Hors phase 4 : marqueur avec miniature de la photo sur la carte (charte), partage (phase 7), suppression d'une découverte.

## Phase 4b : Lieux à toi, spots et chez quelqu'un (plan validé le 2026-10-10)

L'utilisateur crée un lieu à lui (ex. chez un ami) en le prenant en photo. Décisions du 2026-10-10 : le lieu reste privé sur l'appareil ; il dévoile le brouillard comme une découverte, avec au plus 3 lieux perso par 24 h (sinon on dévoile la ville en créant des lieux partout) ; partage plus tard (phase 7).

Aucune nouvelle dépendance.

- [x] 1. Migration 3 : table `personal_places` (id, nom, position, `created_at`, `photo_id`) + vue `all_places` (`places_cache` UNION `personal_places`, catégorie `personal`). Table à part : `places_cache` est un cache que le serveur remplace, un lieu perso ne doit jamais y être effacé. Id local `personal:<horodatage>`.
- [x] 2. Requêtes : `listPlacesWithDiscovery`, `listDiscoveredPositions` et la galerie lisent `all_places`. Rien d'autre ne change : direction, itinéraire, brouillard et galerie marchent tels quels.
- [x] 3. `features/photo/createPersonalPlace.ts` : une transaction `photos` + `personal_places` + `discovered_places` (chemin comme pour une découverte). Refus si 3 lieux perso créés dans les dernières 24 h, ou nom vide (espaces retirés, 40 caractères max).
- [x] 4. Parcours : on reprend la photo qui vient d'être refusée « aucun lieu à 50 m » (les vérifications GPS sont déjà passées, la photo est gardée en attente au lieu d'être effacée). L'écran Photo propose « En faire un lieu perso ? » : champ nom, bouton accent « Créer ce lieu », bouton secondaire « Annuler » (photo effacée). Succès : retour Carte avec la dissipation. Pas de création possible si un lieu (découvert ou non) est déjà à 50 m.
- [x] 5. Affichage : catégorie « Lieu perso » dans la liste et la galerie, même marqueur Sentier que les lieux découverts.
- [x] 6. Tests : migration 3 sur base existante, la vue renvoie les deux sources, 4e lieu perso en 24 h refusé, nom vide refusé, transaction annulée sans trace, un lieu perso apparaît découvert dans `listPlacesWithDiscovery` et dans le brouillard.
- [x] 7. Téléphone (photo refusée loin de tout lieu, puis création), doc, runbook, bilan.

Écarts avec le plan, une fois le code écrit (demandes du 2026-10-10) :
- Type choisi à la création : « Chez quelqu'un » (privé, par défaut) ou « Spot ou lieu public » (point de vue, nature, commerce), colonne `visibility`. Catégorie affichée « Lieu à toi » ou « Spot ».
- Si la limite de 3 est atteinte, le formulaire n'apparaît pas : message, photo effacée.
- Fait sur le téléphone le 2026-10-10 : photo loin de tout lieu, formulaire, refus du nom vide, spot créé (`visibility = public` en base, migration 3 appliquée), zone dévoilée, « Spot · Découvert » dans la liste. Corrigé : le message d'erreur restait affiché pendant la saisie. Spot de test retiré (procédure du runbook). Pas vu sur le téléphone : la limite de 3 (testée en Jest).

Hors phase 4b : modifier ou supprimer un lieu perso, catégorie choisie par l'utilisateur, partage.

## Phase 4c : Genre d'un spot (validé le 2026-10-10)

Genres : point de vue, nature, commerce, café/resto, plage, street art, patrimoine, sport/loisir, autre (= sans genre, affiché « Spot »). Rien pour un domicile.

- [x] 1. Migration 4 : colonne `genre` (nulle) dans `personal_places`, vue `all_places` recréée : catégorie = genre, sinon `spot` ; `personal` pour un domicile. La migration 3 est publiée, on ne la touche pas.
- [x] 2. Genre enregistré avec le lieu, forcé à nul pour un domicile.
- [x] 3. Formulaire : pastilles de genre, visibles seulement pour « Spot ou lieu public », facultatives.
- [x] 4. Libellés `category.*` : liste et galerie les affichent sans autre changement.
- [ ] 5. Tests (migration sur base existante, catégorie selon le genre, domicile sans genre), téléphone, doc, bilan.

Fait sur le téléphone le 2026-10-10 : pastilles visibles seulement pour un spot, spot « Point de vue » créé, catégorie affichée dans la liste. Vu sur le téléphone : avec le clavier ouvert, le bouton « Créer ce lieu » était caché. Formulaire rendu défilant puis `KeyboardAvoidingView` (phase 4d), vérifié. Spot de test supprimé depuis l'app en phase 4d.

## Phase 4d : Modifier ou supprimer un lieu créé (plan validé le 2026-10-10)

Seulement les lieux créés par l'utilisateur (`personal_places`), jamais les lieux du serveur.

- [x] 1. Profil, galerie : appui sur un lieu créé, feuille de détail (photo, nom, type, genre). Les lieux du serveur s'ouvrent aussi, en lecture seule.
- [x] 2. Modifier : nom, type (chez quelqu'un / spot), genre. Même formulaire que la création (`PersonalPlaceForm` réutilisé, valeurs de départ). Position non modifiable : la photo prouve où le lieu est.
- [x] 3. Supprimer : confirmation dans l'écran (deuxième appui « Oui, supprimer »), pas de boîte système. Une transaction retire `discovered_places`, `personal_places`, `photos`, puis le fichier photo est effacé.
- [x] 4. Brouillard : `useFog` ne sait qu'ajouter. Après une suppression, il reconstruit tout depuis SQLite (même coût qu'au lancement, environ 1 s au pire mesuré).
- [x] 5. Tests : modification (nom vide refusé, domicile perd son genre), suppression sans trace (et la zone n'est plus dévoilée), un lieu du serveur ne peut être ni modifié ni supprimé.
- [x] 6. Téléphone, doc, runbook, bilan.

Décision du 2026-10-10 : à la suppression, le brouillard revient (sinon on dévoilerait sans limite en créant puis supprimant).
Écarts : fenêtre de détail en `Modal` React Native, remise à zéro par `key` à chaque lieu ouvert. Suppression détectée par `useFog` en comptant les découvertes, sans lien entre les écrans. Le recalcul du brouillard n'a pas de test automatique (logique dans le hook) : à vérifier sur le téléphone.
Fait sur le téléphone le 2026-10-10 : fiche d'un spot, modification (Point de vue vers Nature), suppression avec confirmation, brouillard revenu autour, fichier photo effacé, galerie à jour. Formulaire avec clavier ouvert : le défilement seul ne suffisait pas (Android plein écran, le clavier ne réduit pas l'écran), corrigé avec `KeyboardAvoidingView` sur l'écran Photo et la fiche, vérifié. Reste connu : une photo en attente est perdue dans le cache si l'app est tuée avant « Créer » ou « Annuler » (le système vide le cache).

## Phase 5 : Backend, comptes et collecte des lieux
- [x] Postgres + PostGIS en Supabase local (5a) ; projet en ligne en 5b
- [x] Comptes : Supabase Auth (nécessaire pour achats, partage, commentaires). Le jeu local marche sans compte
- [x] Suppression de compte depuis l'app (obligatoire App Store)
- [x] Tables : lieux (nom, position, catégorie, source), villes (5a). Cartes partageables, commentaires, achats : avec leurs phases
- [x] Row Level Security sur toutes les tables (`cities`, `places` ; les tables à venir l'activent dans leur migration)
- [x] API Node : lieux d'une ville par identifiant de ville, pas par position exacte (le serveur ne voit pas où est l'utilisateur)
- [x] Détection de la ville côté appareil (limites des villes téléchargées, test local)
- [x] Jobs de collecte : OpenStreetMap via Overpass d'abord, puis autres sources ou scraping (respect des conditions d'usage et du `robots.txt`)
- [x] Déduplication des lieux (même nom + distance < seuil)
- [x] Jobs planifiés pour rafraîchir les lieux
- [x] L'app remplace les lieux de test par l'API et remplit `places_cache`
- [x] Test : relire les requêtes réseau, le serveur ne reçoit ni position ni historique des déplacements

### Plan détaillé phase 5a : lieux du serveur (validé le 2026-10-10)

Décisions du 2026-10-10 : phase 5 coupée en deux. 5a = lieux (base, collecte, API, app). 5b = comptes, suppression de compte, jobs planifiés, hébergement. Base en Supabase local (CLI + Docker) pour le développement. L'app passe par l'API Node, jamais directement par Supabase. Catégories : une liste fixe courte.

1. [x] **Catégories** dans `/shared` : `PLACE_CATEGORIES` = `culture`, `heritage`, `nature`, `viewpoint`, `beach`, `leisure`, `food`, `shop` (`sport` retiré : le genre `leisure` couvre déjà « Sport, loisir »). Ce sont les mêmes clés que les genres de spot (`streetart` reste propre aux spots). Les textes existent déjà en partie (`category.<clé>`), on ajoute ceux qui manquent. Types `City` et `CityBoundary` (GeoJSON) dans `/shared`.
2. [x] **Supabase local** dans `server/supabase/` (`supabase init`). Une migration SQL avec `postgis`, puis deux tables :
   - `cities` : id texte (`biscarrosse`), nom, relation OSM, `boundary geography(MultiPolygon)`
   - `places` : id texte (`osm:node/123`, même format que les lieux de test, donc les découvertes déjà faites restent liées), `city_id`, nom, `location geography(Point)`, catégorie (`CHECK` sur la liste), source, date de mise à jour. Index GiST sur `location`.
   - RLS activée sur les deux tables, sans aucune politique : `anon` ne lit rien. Seul le serveur (connexion Postgres directe) lit et écrit.
3. [x] **Client Postgres** côté serveur : dépendance `postgres` (porsager). Raison : petite, sans dépendance, requêtes paramétrées par gabarit, types TypeScript. `DATABASE_URL` dans `server/.env`.
4. [x] **Job de collecte** `npm run collect -- biscarrosse` (lancé à la main en 5a, planifié en 5b) :
   - limites de la commune : relation OSM via Overpass
   - lieux nommés dans la commune via Overpass (`out center`) : tags `tourism`, `historic`, `leisure`, `natural=beach`, `amenity` culture, choisis par une table tag → catégorie (fonction pure, testée)
   - déduplication : même nom normalisé et distance < 50 m, on garde le premier (fonction pure, testée)
   - une transaction : upsert de la ville et des lieux, suppression des lieux OSM de la ville absents de la nouvelle collecte
   - User-Agent identifiable, une requête à la fois (règles d'usage d'Overpass), attribution ODbL notée dans la doc
5. [x] **API Node** (`node:http`, sans framework) :
   - `GET /cities` : id, nom, limites simplifiées (`ST_Simplify`) en GeoJSON
   - `GET /cities/:id/places` : `Place[]`, 404 si la ville est inconnue
   - aucun paramètre de position accepté ; les journaux ne contiennent que la méthode, le chemin et le statut
   - tests des routes avec une base fictive derrière une petite interface (comme `Db` côté app)
6. [x] **Détection de la ville sur l'appareil** :
   - migration SQLite : table `cities_cache` (id, nom, limites en JSON)
   - fonction pure `findCity(point, cities)` (point dans polygone, testée)
   - la position ne quitte jamais l'appareil, seul l'id de ville part
7. [x] **L'app passe à l'API** :
   - `EXPO_PUBLIC_API_URL` ; en dev, `adb reverse tcp:3000 tcp:3000`
   - au démarrage et au retour sur l'onglet Carte : `GET /cities`, puis la ville courante, puis `GET /cities/:id/places`, puis `replaceCachedPlaces`
   - hors ligne ou serveur en panne : on garde le cache, sans erreur bloquante
   - suppression de `testPlaces.ts` et de son seed
8. [x] **Vérification** :
   - typecheck, lint, format, tests
   - collecte réelle de Biscarrosse sur Supabase local (nombre de lieux, catégories)
   - sur le téléphone : lieux de l'API sur la carte, la découverte « Piscine » toujours liée
   - journal du serveur relu : aucune position ni coordonnée reçue
9. [x] **Doc** : `docs/README.md` (architecture serveur, catégories, flux des lieux), `docs/runbook.md` (lancer Supabase local, `.env`, collecte, `adb reverse`, réinitialiser la base), `.claude/CLAUDE.md` « État actuel », bilan.

Écarts : `findCity` écrit à la main (point dans polygone, 25 lignes) plutôt qu'une dépendance. La synchro tourne une fois par lancement, au premier relevé GPS ; un changement de ville en cours de session attend le lancement suivant. Délai de 10 s sur chaque appel, ajouté après le test sur le téléphone.
Fait sur le téléphone le 2026-10-10 : 106 lieux reçus, nouvelles catégories affichées, la Piscine toujours « Découvert ». Hors ligne (serveur arrêté, cache HTTP vidé) : villes lues dans `cities_cache`, lieux gardés, aucune erreur à l'écran. Journal du serveur : seulement `GET /cities` et `GET /cities/biscarrosse/places`.

Hors 5a : comptes, jobs planifiés, hébergement de l'API et projet Supabase en ligne (5b). Autres sources que OSM. Lieux de plusieurs villes en même temps. Sauvegarde des découvertes (question encore ouverte).

### Plan détaillé phase 5b : comptes et mise en ligne (validé le 2026-10-10)

Décisions du 2026-10-10 :
- connexion par code à 6 chiffres reçu par e-mail (Supabase Auth, sans mot de passe)
- exception à « l'app ne parle qu'à notre API » : l'app parle directement à Supabase Auth, seulement pour la connexion et la session ; les données passent toujours par l'API
- API et collecte planifiée sur Render
- projet Supabase en ligne, offre gratuite, en Europe

1. [x] **Projet Supabase en ligne** `detour`, région Paris (`eu-west-3`) :
   - lier le CLI au projet (`supabase link`), puis `supabase db push` pour la migration de la 5a
   - collecte de Biscarrosse sur la base en ligne
   - conseils de sécurité Supabase (advisors) relus
2. [x] **Config de connexion** dans `server/supabase/config.toml` puis `supabase config push` :
   - code à 6 chiffres, valable 10 min
   - modèle d'e-mail en français, qui montre le code (`{{ .Token }}`) et non un lien
   - limite : le SMTP fourni par Supabase n'envoie qu'aux membres de l'équipe et quelques e-mails par heure, ce qui suffit pour le développement. Un SMTP à nous (Resend, avec un domaine) sera nécessaire avant la bêta (phase 8).
3. [x] **App, connexion** :
   - dépendance `@supabase/supabase-js`
   - session gardée dans `expo-sqlite/localStorage`, déjà installé (SecureStore limite chaque valeur à 2 Ko, une session dépasse souvent)
   - logique dans `features/account/` : demander un code, vérifier le code, se déconnecter, session courante
   - Profil, section « Compte » : e-mail puis code ; connecté : e-mail affiché, « Se déconnecter », « Supprimer mon compte »
   - le jeu reste entièrement utilisable sans compte, et la connexion n'envoie aucune donnée du jeu
4. [x] **Suppression de compte** (obligatoire App Store) :
   - route `DELETE /me` sur l'API, avec le jeton de session en `Authorization: Bearer`
   - le serveur vérifie le jeton auprès de Supabase Auth (`GET /auth/v1/user`), puis supprime l'utilisateur (`DELETE /auth/v1/admin/users/:id`, clé secrète côté serveur seulement). Juste `fetch`, aucune dépendance.
   - confirmation dans l'app avant ; les découvertes locales restent sur le téléphone (elles n'ont jamais été liées au compte)
   - routes testées avec un faux client Auth
5. [x] **Render** (blueprint `render.yaml` dans le dépôt) :
   - service web `detour-api` (offre gratuite, s'endort après 15 min) : `npm ci`, puis `node server/src/index.ts`
   - cron `detour-collect` : `npm run collect -- biscarrosse` une fois par semaine. Le cron est payant chez Render : facturé à la seconde, minimum 1 $ par mois. Remplacé par GitHub Actions (Render exige une carte, décision du 2026-10-10)
   - variables : `DATABASE_URL` (pooler Supabase, car Render n'a pas d'IPv6), `SUPABASE_URL`, `SUPABASE_SECRET_KEY`
   - Render doit avoir accès au dépôt GitHub `B9R9/discover`
6. [x] **App vers l'API en ligne** : `EXPO_PUBLIC_API_URL` pointe sur l'URL Render (ajout de `EXPO_PUBLIC_SUPABASE_URL` et de la clé publique) ; `localhost` reste possible en dev
7. [x] **Vérification** :
   - typecheck, lint, format, tests
   - sur le téléphone : connexion avec un vrai code, déconnexion, suppression du compte (le compte disparaît dans Supabase), lieux servis par Render
   - journal Render relu : aucune position
8. [x] **Doc** :
   - `docs/README.md` : comptes, exception Auth, hébergement
   - `docs/runbook.md` : déployer, variables, relancer la collecte, restaurer (offre gratuite sans sauvegarde : migrations puis collecte ; comptes perdus)
   - `.claude/CLAUDE.md` : exception Auth, « État actuel »
   - bilan

Écarts : SMTP Resend dès maintenant (offre gratuite : pas de modèle d'e-mail modifiable sans SMTP à nous), expéditeur `onboarding@resend.dev` ; SMTP déclaré seulement pour le projet en ligne (`[remotes.production]`), Mailpit en local. Services Render créés par l'outil MCP plutôt qu'un `render.yaml` (config décrite dans le runbook). Correction en passant : `Screen` comptait deux fois la zone sûre du bas dans Profil.
Fait sur le téléphone le 2026-10-10, d'abord avec l'API du Mac branchée sur Supabase en ligne, puis à travers Render : code reçu par e-mail (Resend : livré), connexion, session gardée après redémarrage de l'app, suppression du compte (`DELETE /me 204`, plus aucun utilisateur dans Supabase), découvertes toujours là.

Hors 5b : connexion Apple ou Google, SMTP à nous, nom de domaine, profil public et pseudo (phase 7), sauvegarde des découvertes.

## Phase 6 : Cartes et achats

Décision du 2026-10-10 : une carte = un **département** (OSM `admin_level=6`). Les communes de plus de 100 000 habitants (tag OSM `population`) ont leur propre carte, retirée de celle du département. Offerte : le département où est l'utilisateur au premier lancement, sans ses grandes villes (un habitant de Bordeaux reçoit la Gironde, pas Bordeaux). Le reste se paie, achat unique : une grande ville seule (prix selon son attrait), ou un département entier, grandes villes comprises, toujours plus cher qu'une de ses villes (précision du 2026-10-10). Le découpage serveur ne change pas : un département acheté débloque sa zone et celles de ses grandes villes.

1. [x] **Zones à la place des villes** (serveur) : la table `cities` devient `areas` avec `department_id` (nul pour un département), `CityId` devient `AreaId` dans `/shared`. Limite d'un département = département moins ses grandes villes (`ST_Difference`). Routes `GET /areas` et `GET /areas/:id/places`.
2. [x] **Collecte par département** : `npm run collect -- landes` collecte la limite du département, trouve ses communes de plus de 100 000 habitants, crée une zone par grande ville, puis range chaque lieu dans la zone qui le contient (`ST_Covers`). Départements de départ : Landes (Biscarrosse dedans, ids `osm:` inchangés donc découvertes gardées) et Gironde (pour tester l'exclusion de Bordeaux). Workflow hebdo mis à jour. Vérifier la taille de la réponse (Landes : quelques milliers de lieux).
3. [x] **App** : `cities_cache` devient `areas_cache` (migration), `findCity` devient `findArea`. La grande ville passe avant le département (les limites ne se chevauchent plus, donc un seul résultat).
4. [x] **Carte offerte** : au premier `findArea` réussi, le département est écrit dans `owned_maps` en `free`. Ne change plus jamais (pas de réinstallation : à voir avec RevenueCat ou le compte, point 7).
5. [x] **Zone non débloquée** : pas de lieux téléchargés, message « Carte à débloquer » dans le panneau. Le chemin parcouru s'enregistre et se dévoile comme ailleurs (seuls les lieux restent cachés).
6. [x] **Écran des cartes** : section « Mes cartes » du Profil (choix du 2026-10-10), départements et grandes villes avec leur état. Prix et bouton d'achat à l'étape 7 (prix localisés venus des stores).
   - règle « possédée » (fonction pure, testée) : une zone est débloquée si elle est dans `owned_maps`, ou si c'est une grande ville dont le département est **acheté** (`purchased`). Le département offert (`free`) ne débloque pas ses grandes villes.
7. [ ] **RevenueCat** (décision du 2026-10-10 : l'app est payante au téléchargement dans Google Play et l'App Store ; dans l'app, on n'achète que des cartes. Pas d'abonnement, pas de paywall, pas de Customer Center) :
   - [x] Dépendance `react-native-purchases`. Clé publique dans `.env` : `EXPO_PUBLIC_REVENUECAT_KEY` (clé `test_` du Test Store pour le développement, clés Play et App Store ensuite). Plugin `plugins/withSingleTopActivity.js` (activité `singleTop`, demandé par RevenueCat).
   - [x] `features/purchases/` : `Purchases.configure` au démarrage, utilisateur anonyme ; `Purchases.logIn(id Supabase)` à la connexion, `logOut` à la déconnexion. Rien du jeu n'est envoyé à RevenueCat.
   - [x] Cartes : un produit non consommable par carte, `map_<areaId>`. Achetées = `allPurchasedProductIdentifiers` (`purchasedMaps`, testée), pas écrites dans `owned_maps`. Pas d'entitlement par carte.
   - [x] Carte pays : `map_france`, débloque toutes les zones (`mapStatus`). Prix : ville < département < pays.
   - [x] Section « Mes cartes » : « Débloquer · prix » (prix localisé), aussi sur le département offert ; « Restaurer mes achats ». Un achat relance le téléchargement des lieux de la zone.
   - [x] Erreurs : annulé (silencieux), réseau, paiement en attente, autre. Zone sans produit : « À débloquer » sans bouton.
   - [x] Tableau de bord RevenueCat (par l'API, 2026-10-11) : produits `map_landes`, `map_gironde`, `map_gironde-bordeaux`, `map_france` ; offering courante `maps` (package `france`) ; `monthly`, `yearly`, `lifetime`, `default` et `detour_pro` supprimés. Client de test supprimé le 2026-10-11 (ses achats simulés bloquaient la modification des produits). Prix mis par toi le 2026-10-11 : Landes 2,99 €, Gironde 3,99 €, Bordeaux 3,99 €, France 19,99 €. À corriger : la Gironde doit coûter plus que Bordeaux.
   - [x] Test sur le téléphone (2026-10-11, Test Store) : Bordeaux acheté à 3,99 €, « Débloquée » tout de suite ; « Restaurer mes achats » la garde. Gironde achetée ensuite : « Débloquée ». Le département offert sans grande ville bloquée (Landes) n'a plus de bouton. Descriptions sous chaque carte. Pas vu : restauration sur un autre appareil.
   - [ ] Prix de l'app dans la Play Console et App Store Connect, produits des cartes dans les deux stores, clés RevenueCat de production.
   - [x] Lancement lent (corrigé le 2026-10-11) : deux causes mesurées sur le téléphone. Le panneau « Autour de toi » rendait les 3 493 lieux (17 533 vues natives, ANR si on touchait l'écran) : il n'en montre plus que les 30 plus proches (217 vues). Et `replaceCachedPlaces` insérait un lieu par appel (3 493 allers-retours, 16,5 s) : insertions par paquets de 500 (0,4 s). Tout est prêt 3,6 s après le lancement, plus d'ANR avec un appui à 8 s.
7b. [ ] **Remplacer RevenueCat par les stores en direct** (décision du 2026-10-11 : RevenueCat trop compliqué pour des achats uniques ; on parle directement à Google Play Billing et à StoreKit avec `expo-iap`). Codé le 2026-10-11 :
   - [x] **Dépendances** : retirer `react-native-purchases` et `EXPO_PUBLIC_REVENUECAT_KEY`. Ajouter `expo-iap` (module Expo maintenu, Google Play Billing et StoreKit 2, pas de service tiers). Garder `plugins/withSingleTopActivity.js` (même risque d'achat annulé avec Play Billing). Nouveau development build, vérifier `BILLING` dans le manifeste fusionné et `adb logcat`.
   - [x] **Ids de produit** : Google et Apple refusent le tiret (lettres minuscules, chiffres, `_` et `.` seulement). `mapProductId` remplace `-` par `_` (`map_gironde_bordeaux`). `purchasedMaps` retrouve la zone en comparant aux zones connues, pas en inversant le nom. Tests mis à jour.
   - [x] **`features/purchases/`** : `StoreProvider` à la place de `PurchasesProvider` (`initConnection` au démarrage, liste des achats possédés par `getAvailablePurchases`, rafraîchie après un achat). `usePurchasedMaps` garde la même signature : « Mes cartes », `mapStatus`, `isForSale` et `syncPlaces` ne bougent pas.
   - [x] **Achat** : `requestPurchase`, puis à la réception de l'achat `finishTransaction` (non consommable) sinon Google le rembourse au bout de 3 jours. Achat en attente (paiement différé) : rien de débloqué, message « Paiement en attente ». Erreurs : annulé (silencieux), réseau, déjà possédé (on rafraîchit), autre.
   - [x] **Prix** : `fetchProducts` des cartes en vente, prix localisé du store. Carte sans produit : « À débloquer » sans bouton (comme aujourd'hui).
   - [x] **Restaurer** : `getAvailablePurchases`. Les achats suivent le compte Google (ou Apple) : restauration sur un autre téléphone du même store, pas d'Android vers iPhone. Retirer le lien avec le compte Détour (`logIn`) et corriger le texte du compte (« Il servira à acheter des cartes »).
   - [x] **Hors ligne** : Google Play et StoreKit gardent les achats en cache sur le téléphone. ponytail : pas de copie dans SQLite ; à ajouter si une carte achetée disparaît hors ligne.
   - [x] **Sécurité** : pas de vérification des achats par notre serveur pour l'instant (un téléphone rooté peut simuler un achat). Ajoutée à la phase 8 : l'API vérifie le jeton d'achat auprès de Google avant d'envoyer les lieux d'une zone payante.
   - [ ] **Play Console (toi, avec mon aide pas à pas)** : app créée, prix de l'app, produits intégrés `map_landes`, `map_gironde`, `map_gironde_bordeaux`, `map_france` avec leurs prix (ville < département < France), ton compte Google en testeur de licence, une version sur le test interne.
   - [x] **AAB signé** (2026-10-11) : clé d'envoi dans `~/.config/detour/`, plugin `withReleaseSigning.js`, `app-release.aab` signé `CN=Detour` avec `BILLING`. Reste (toi) : l'envoyer sur le test interne, ce qui fait apparaître « Produits ponctuels » dans la Play Console.
   - [x] **Test sur le téléphone** (2026-10-11, build du test interne `com.b9r9.dtour`, compte testeur de licence) : Bordeaux puis Gironde achetées par la vraie fenêtre Google Play, les deux passent à « Débloquée » et le bouton disparaît ; « Restaurer mes achats » répond « Achats restaurés. » et garde les deux. Prix affichés TVA comprise (4,99 € devient 5,99 €). Pas vu : restauration après désinstallation/réinstallation, achat de la France entière.
   - [x] **Ménage RevenueCat** : `~/.config/detour/revenuecat.env` supprimé, doc à jour (`.claude/CLAUDE.md`, `docs/product-concept.md`, `docs/README.md`, `docs/runbook.md` : plus aucune mention hors historique). Reste (toi) : révoquer les deux clés et supprimer le projet RevenueCat.
   - Décision du 2026-10-11 : pas de compte Apple pour l'instant (trop cher), on reste sur Android. Le code `expo-iap` couvre déjà StoreKit, mais rien n'est configuré ni testé côté iOS.
   Vérifié le 2026-10-11 : typecheck, lint, 67 tests ; development build avec `expo-iap` installé, `BILLING` dans le manifeste fusionné, activité `singleTop`, pas de crash ; « Restaurer mes achats » répond « Achats restaurés. » (connexion à Google Play OK) ; toutes les cartes « À débloquer » sans bouton tant que la Play Console n'a pas de produits.
7c. [ ] **Script produits et prix pour toute la France** (demande du 2026-10-11, à faire plus tard) : un script serveur lit les zones (`areas`, départements et grandes villes), calcule un prix par zone (règle : ville < département < France ; ville selon son attrait, par exemple nombre de lieux ou population) et écrit le fichier d'import CSV des produits intégrés de la Play Console (`map_<id>` avec `_`). Pas d'API Google : l'import CSV évite un compte de service. Le prix France (`map_france`) vient de la somme ou d'un plafond fixé à la main. Grille du 2026-10-11 : ville 1,99 €, ville attractive 2,99 €, département 4,99 €, pays 19,99 €. « Attractive » = les grandes villes qui accueillent le plus de tourisme (2026-10-11). Aucune donnée de tourisme dans notre base : liste à la main dans le script, à valider par toi (proposition : Paris, Nice, Marseille, Lyon, Bordeaux, Strasbourg, Montpellier, Toulouse, Nantes, Lille, Aix-en-Provence, Annecy), plus Rouen, Nîmes, Dijon, Toulon ajoutées le 2026-10-11. Les autres villes de plus de 100 000 habitants sont à 1,99 €, sauf les villes de banlieue (Villeurbanne, Boulogne-Billancourt, Argenteuil, Montreuil, Saint-Denis 93) gardées à prix réduit (0,99 €, proposé le 2026-10-11, à confirmer). Liste des banlieues à la main. Paris (département et commune) : une seule carte « Paris » à 2,99 €, sans carte département (validé le 2026-10-11). 0,99 € validé.
   - Décision du 2026-10-11 : **zones touristiques**. En plus des villes de plus de 100 000 habitants, une liste à la main de sites touristiques (Mont-Saint-Michel, Étretat, Carcassonne, Chamonix…) devient une zone à part, retirée de son département, au prix « attractive » 2,99 €. Touche : collecte (`ST_Difference` comme pour les grandes villes, limite OSM du site), `areas`, règle de `.claude/CLAUDE.md` et `docs/product-concept.md` (« grandes villes » devient « grandes villes et sites touristiques »), prix de la carte offerte (un site n'est jamais offert). À faire avant le script : liste des sites validée par toi.
   Plan 7c (à valider, 2026-10-11) :
   - [x] 1. `server/src/collect/pricing.ts` : listes à la main (villes attractives, banlieues) et `priceOf(zone)` (fonction pure, testée) : département 4,99, attractive ou site 2,99, banlieue 0,99, autre ville 1,99, France 19,99. Paris : département et ville fusionnés.
   - [x] 2. `touristSites.ts` : sites par département, retrouvés par nom de commune dans la limite du département (même requête Overpass que les grandes villes, filtrée par nom au lieu de `population`). Ids `<département>-<slug>` comme les grandes villes. `saveDepartment` ne change pas (il reçoit déjà une liste de zones). Fait le 2026-10-11 : `fetchCommuneByName` vérifié sur Overpass en ligne (Arcachon trouvé dans la Gironde, nom inconnu donne `null`), 24 tests serveur verts. Pas encore collecté : un site introuvable est signalé par un avertissement, il ne bloque pas la collecte.
   - [ ] 3. `npm run products` : lit `areas` + `pricing.ts`, écrit `products.csv` (format d'import de la Play Console, à vérifier dans la console avant d'écrire le code) avec `map_france`.
   - [~] 4. `DEPARTMENT_SOURCES` : les 101 départements avec leur relation OSM (à récupérer par Overpass, pas de saisie à la main), collecte France entière (jobs hebdo plus longs : à mesurer, quotas Overpass). Fait le 2026-10-11 : 97 départements de métropole dans `departments.ts` (relations lues sur Overpass ; Rhône et Métropole de Lyon séparés, Corse 2A et 2B ; Paris sans découpe de ville ; DOM-TOM pas inclus). Testé en local sur la Manche : 3 266 lieux, Mont-Saint-Michel zone à part avec 44 lieux. Reste : collecte des autres départements en ligne (Overpass répond souvent 504, trois essais de 30 s), mesure de la durée du job hebdo.
   - [ ] 5. Doc (`.claude/CLAUDE.md`, `docs/product-concept.md`, `docs/README.md`, `docs/runbook.md`), tests, bilan.
8. [ ] **Tests** : `findArea` (grande ville avant département), collecte (Bordeaux hors Gironde), achat Android (fait pour Bordeaux et Gironde ; reste la France entière), restauration après réinstallation. Achat iOS : reporté (pas de compte Apple).
9. [ ] **Doc** : `docs/README.md`, `docs/runbook.md` (ajouter un département), `.claude/CLAUDE.md`, bilan.

Fait le 2026-10-10 (étapes 1 à 5, en local) : collecte Gironde (5355 lieux, Bordeaux 1644, 50 km² retirés) et Landes (3493 lieux, Biscarrosse dedans), 61 tests app et tests serveur verts. En ligne le 2026-10-10 : migration appliquée, Landes, Gironde et Bordeaux collectés, API Render servant `/areas` (3 zones). Fait sur le téléphone le 2026-10-10 : migration 6 passée, Landes en `free`, 3 493 lieux en cache, Piscine toujours « Découvert », 4 min sans erreur. Corrigé en passant : la tâche de fond fermait la connexion SQLite partagée avec l'app (voir `.claude/lessons.md`). Pas vu : une zone bloquée sur le téléphone (il faudrait être en Gironde), couverte par les tests.
Fait le 2026-10-10 (étape 6) : `mapStatus` et `listMaps` (testés) dans `features/maps/ownership.ts`, `isUnlocked` passe par `mapStatus`. Vu sur le téléphone : Landes « Offerte », Gironde et Bordeaux « À débloquer », 62 tests verts.
Écarts : `kind` remplacé par `department_id` (nul = département). Chemins dévoilés aussi en zone bloquée. Ids de grande ville préfixés (`gironde-bordeaux`) car Saint-Denis existe deux fois. Réponse Gironde de 750 Ko sans compression : gzip à ajouter si ça gêne. Reste ouvert : Paris, département et commune à la fois (département vide après découpage) ; un lieu perso créé en zone bloquée y dévoile 150 m.

## Phase 7 : Social
- [ ] Partage volontaire d'une photo et d'un commentaire (envoi seulement après confirmation)
- [ ] Retirer les métadonnées EXIF (position) des photos avant envoi
- [ ] Carte partageable
- [ ] Partage d'un lieu créé : à la communauté seulement les spots et lieux publics (`visibility = 'public'` : établissements recevant du public, points de vue, nature), après modération. Un lieu `private` (domicile) jamais public, partageable à des amis choisis
- [ ] Modération (obligatoire App Store pour contenu utilisateur) : signaler, bloquer un utilisateur, filtrer
- [ ] Rien ne part vers le serveur sans action explicite de l'utilisateur
- [ ] Amis : inviter, accepter, retirer (comptes de la phase 5b)
- [ ] Voir la carte d'un ami : seulement ce qu'il a choisi de partager (lieux découverts ou image de sa carte), jamais ses chemins parcourus. Pas de synchronisation automatique
- [ ] Partager un lieu ou un spot à des amis choisis
- [ ] Événements : à préciser (voir questions ouvertes)
- [ ] Test : une photo partagée ne contient aucune donnée EXIF de position

### Plan détaillé phase 7 : social (proposé le 2026-11-06, à valider)

Principe : l'app reste jouable sans compte. Le compte n'est demandé que pour partager, commenter ou laisser une balade. Rien ne part sans confirmation. Les chemins parcourus et la position ne partent jamais.

Découpage en quatre étapes livrables chacune seule :

**7a. Profil public et amis** (base de tout le reste) — code fait le 2026-11-06, reste : appliquer la migration `20261107000000_social.sql` en ligne (`supabase db push`, voir runbook) et tester à deux comptes (membres de l'équipe Supabase, voir 7-0)
- Table `profiles` (id = utilisateur Supabase, pseudo unique, créé à la première action sociale), table `friendships` (demande, acceptée, retirée).
- API : `PUT /me/profile`, `GET /users?pseudo=`, `POST /friends/requests`, accepter, retirer, `GET /friends`. Jeton de session obligatoire.
- App : `features/social/`, écran Cercle (liste d'amis, demandes), invitation par pseudo.
- Pas de recherche libre dans l'annuaire : on trouve quelqu'un par son pseudo exact (vie privée).

**7b. Photo et commentaire sur un lieu**
- L'utilisateur choisit de partager une de ses découvertes : photo (EXIF retiré sur l'appareil avant l'envoi, test dédié) + commentaire court.
- Table `place_posts` (lieu, auteur, photo, commentaire, date, statut de modération), stockage des photos (Supabase Storage, URL signées).
- Signaler un post, bloquer un utilisateur, supprimer le sien, suppression en cascade à la suppression du compte.
- Visible : de ses amis seulement au départ (la communauté ouverte demande une vraie modération, voir 7d).

**7b, plan détaillé (2026-11-07)** — code fait le 2026-11-07 (serveur 41 tests, app 118 tests, typecheck et lint propres). Reste : appliquer la migration `20261107010000_posts.sql` (`supabase db push`), redéployer l'API, tester à deux comptes. Non vérifié contre un vrai Storage : l'envoi de la photo par un PUT brut sur l'URL signée (si Storage le refuse, passer en `multipart/form-data`), et le bucket créé par la migration.
- Visibilité : l'auteur et ses amis acceptés, personne d'autre. Un utilisateur bloqué (dans un sens ou dans l'autre) disparaît du fil.
- Photos : Supabase Storage, bucket privé `post-photos`. L'app ne reçoit jamais d'URL publique : l'API signe des URL d'envoi (une par post) et de lecture (1 h). Le serveur ne touche pas aux octets de la photo.
- EXIF : retiré sur le téléphone avant l'envoi, sans dépendance (`stripJpeg`, fonction pure testée : tous les segments sauf JFIF et profil ICC sont supprimés, l'orientation est conservée dans un EXIF minimal pour que la photo ne tourne pas).
- Flux : `POST /posts` (lieu + commentaire, 280 caractères au plus) crée la ligne et renvoie l'URL d'envoi ; l'app envoie la photo nettoyée ; `POST /posts/:id/uploaded` la rend visible. Un envoi raté ne laisse donc rien de visible.
- Fil : `GET /posts` (moi et mes amis, 50 derniers, hors posts masqués). Pas de paramètre dans l'URL : le serveur ignore les query strings par principe.
- Modération par signalements : `POST /posts/:id/report` ; un post signalé par 3 personnes différentes est masqué automatiquement. `POST /blocks` bloque quelqu'un (et retire l'amitié). Suppression de son post, et à la suppression du compte, de toutes ses photos.
- App : bouton « Partager » sur la fiche d'un lieu (aperçu, commentaire, confirmation explicite), fil des amis dans l'onglet Cercle, signaler et bloquer depuis un post.

**7c. Carte d'un ami** — code fait le 2026-11-07 (serveur 46 tests, app typecheck et lint propres). Reste : appliquer la migration `20261107020000_shared_maps.sql`, redéployer l'API, tester à deux comptes amis.
- Ce qui est partagé : la liste des ids de lieux découverts (lieux du serveur seulement). Ni dates, ni chemins, ni lieux créés par l'utilisateur (le serveur refuse les ids `personal:`). Pas de synchronisation automatique : l'utilisateur envoie un instantané, le met à jour ou l'arrête.
- Serveur : table `shared_maps` (une ligne par utilisateur, 5000 lieux au plus), `PUT/GET/DELETE /me/map`, `GET /friends/:pseudo/map` (amis acceptés et non bloqués, sinon 404). Limite du corps JSON portée à 256 Ko.
- App : section « Ma carte partagée » dans Cercle ; bouton « Voir sa carte » sur chaque ami ; la carte de l'ami s'ouvre en lecture seule dans une fenêtre, brouillard levé autour de ses lieux.
- Limite connue : la position d'un lieu vient du cache de CE téléphone. Les lieux d'un ami situés dans des départements que tu n'as pas ne s'affichent pas (le compteur dit « N lieux découverts, M sur ta carte »). Un jour, le serveur pourrait renvoyer les positions.
- Chargement de la carte : un écran « Chargement de la carte… » couvre la carte tant que son style n'est pas chargé (carte principale et carte d'un ami), et un message d'échec si le chargement échoue.

**7d-1. Spots publics** (plan du 2026-11-07, commencé dans la foulée de ta demande « enchaîne »)
- L'utilisateur propose un de ses lieux `public` avec un genre (jamais un domicile `private`). Ce qui part : nom, genre, position exacte du lieu (il le sait : texte explicite et bouton de confirmation). Pas de photo au départ.
- Serveur : table `spot_submissions` (en attente, accepté, refusé), `POST /spots`, `GET /spots/mine`, `DELETE /spots/:placeId` (retirer sa proposition, et le lieu publié s'il l'était). Au plus 20 propositions en attente par personne.
- Validation à la main au début : `cd server && npm run spots -- list | approve <id> | reject <id>`. Un spot accepté entre dans `places` (id `spot:<uuid>`, source `user`, zone la plus petite qui le couvre), donc arrive dans les cartes de tous au prochain téléchargement de la zone. La collecte OSM ne supprime que la source `osm`, les spots survivent.
- App : sur la fiche d'un lieu public créé par l'utilisateur, « Proposer à la communauté », avec l'état (en attente, publié, refusé).
- Limite connue : si les frontières de zone changent à une collecte, la zone d'un spot publié n'est pas recalculée.

**7d-2. Balades**
- Tracé dessiné puis accroché par OpenRouteService (décision déjà prise), publié directement au début ; modération plus tard (décision du 2026-11-06).
- Les lieux `private` (domicile) ne sont jamais publics.

Hors phase 7 : événements (questions ouvertes), messagerie, notifications push.

Décisions du 2026-11-06 :
1. Pseudo seul, pas de nom affiché.
2. Photos partagées dans Supabase Storage (offre gratuite, 1 Go).
3. Modération au lancement : par signalements d'abus seulement, pas de validation manuelle avant publication.
4. E-mail à nous (domaine + SMTP Resend) avant 7a, pour que des amis puissent recevoir le code de connexion. Étape 7-0 ci-dessous.

**7-0. E-mail de connexion** (reporté le 2026-11-06 : pas de domaine pour le moment ; à faire avant la bêta, phase 8. En attendant, seuls les membres de l'équipe Supabase reçoivent le code, donc les tests sociaux se font entre comptes de l'équipe)
- [ ] Choisir le domaine d'envoi et ajouter ses enregistrements DNS (SPF, DKIM) chez Resend
- [ ] Brancher le SMTP Resend dans `server/supabase/config.toml` puis `supabase config push`
- [ ] Vérifier : un code arrive chez une adresse hors équipe Supabase

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
- Cartes : une par département, les communes de plus de 100 000 habitants à part. Département de l'utilisateur offert, sans ses grandes villes. Achat d'une grande ville seule ou d'un département entier, grandes villes comprises (2026-10-10)
- Paiements : stores en direct (`expo-iap`, Google Play Billing et StoreKit), plus RevenueCat (2026-10-11)
- Accès : l'app est payante au téléchargement (Google Play, App Store) et donne la carte offerte. Dans l'app, seulement des cartes à l'unité : ville, département, France entière (`map_france`). Pas d'abonnement ni de paywall (2026-10-10)

## Questions ouvertes
- Sauvegarde des découvertes si perte du téléphone : aucune, export manuel, ou sauvegarde chiffrée volontaire (phase 5)
- Carte offerte après réinstallation ou changement de téléphone : la lier au compte ? (phase 6)
- Prix par carte : département, grande ville selon son attrait (phase 6)
- Outil de remontée des crashs (phase 8)
- Événements (phase 7) : créés par les utilisateurs ou collectés par le serveur ? Date de fin et disparition ? Validés par une photo comme un lieu ?
- Carte d'un ami (phase 7) : partage de la liste des lieux découverts, d'une image, ou des deux ?

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
- 3 bugs vus seulement sur le téléphone : `RECEIVE_BOOT_COMPLETED` manquante (crash), tâche enregistrée sans service après le crash, deux enregistrements simultanés. Corrigés, détaillés dans `.claude/lessons.md` et `docs/runbook.md`.
- Reste : une vraie balade (app ouverte puis écran éteint) et la fluidité sur téléphone avec beaucoup de données.

### Phase 3
- Aucune nouvelle dépendance : boussole `expo-location`, OpenRouteService en `fetch` direct (`openrouteservice-js` écartée, un seul appel utile), panneau du bas sans bibliothèque.
- 12 lieux de test de Biscarrosse (OpenStreetMap, via Nominatim) écrits dans `places_cache` au démarrage.
- Règle « jamais d'itinéraire sans découverte » tenue à trois niveaux : type `NearbyPlace` sans nom ni position pour un lieu non découvert, `fetchWalkingRoute` qui revérifie en base avant tout appel réseau, `useWalkingRoute` qui ne rend jamais de route pour un lieu non découvert.
- Vérifié : 28 tests, typecheck, lint, format ; sur le téléphone : liste, flèche, lieu découvert factice, itinéraire réel.
- Reste : flèche testée dehors en marchant. Découverte factice (Piscine) encore sur le téléphone, retrait dans le runbook.

### Phase 4
- 2 dépendances : `expo-camera` (prévue), `expo-file-system` (déjà présente via `expo`, déclarée pour sortir les photos du cache). Micro et codes-barres désactivés.
- `validatePhoto` en fonction pure : simulée, précision > 30 m, position > 10 s, déjà découvert, > 50 m. `recordDiscovery` : photo + découverte + chemin depuis la découverte précédente (24 h max) en une transaction.
- Dissipation 600 ms par un disque Brume dont l'opacité baisse, coupée si « réduire les animations ». Carte et lieux relus au retour sur l'onglet.
- Galerie « Mes découvertes » dans Profil (onglet Photo gardé, choix du 2026-10-10).
- Vérifié : 38 tests, typecheck, lint, format ; sur le téléphone : photo acceptée, carte dévoilée, galerie, refus « déjà découvert ».
- Reste : voir l'animation à l'œil, refus « trop loin » et « position simulée » dehors.

### Phase 4b
- Lieux créés par l'utilisateur : « Chez quelqu'un » (privé par défaut) ou « Spot ou lieu public ». Table `personal_places` + vue `all_places`, aucune dépendance.
- Comptent comme découverts (150 m dévoilés), au plus 3 par 24 h.
- Partage prévu en phase 7 : communauté pour les spots et lieux publics seulement, après modération ; domicile entre amis seulement.
- Vérifié : 43 tests, typecheck, lint, format ; sur le téléphone : création d'un spot et dévoilement.

### Phase 4d
- Fiche d'un lieu depuis la galerie du Profil : modifier (nom, type, genre) ou supprimer un lieu créé ; lieux du serveur en lecture seule.
- Suppression : transaction puis fichier ; `useFog` détecte qu'une découverte a disparu et recalcule tout, le brouillard revient.
- Vérifié : 47 tests, typecheck, lint, format ; sur le téléphone : modification, suppression, brouillard, clavier.

### Phase 5a
- Supabase local (CLI + Docker, ports 544xx) dans `server/supabase/`, une migration : PostGIS, tables `cities` et `places`, RLS sans politique (l'API REST de Supabase ne lit rien).
- 1 dépendance serveur : `postgres` (porsager). `@types/geojson` déclaré dans `/shared` (déjà présent pour l'app).
- Collecte `npm run collect -- biscarrosse` : Overpass (limites + lieux), table tag OSM → catégorie, dédoublonnage nom + 50 m, une transaction, collecte vide refusée, nouvel essai sur 429/504. Biscarrosse : 106 lieux.
- API `node:http` : `/health`, `/cities`, `/cities/:id/places`. Query string ignorée, journal sans position.
- App : `cities_cache` (migration 5), `findCity` sur l'appareil, `syncPlaces` au premier relevé GPS, repli sur le cache, délai de 10 s. `testPlaces.ts` supprimé, anciens textes de catégories retirés.
- Vérifié : 15 tests serveur, 53 tests app, typecheck, lint, format ; sur le téléphone : lieux de l'API, découverte gardée, hors ligne.
- Reste (5b) : comptes, suppression de compte, collecte planifiée, hébergement API + projet Supabase en ligne.

### Phase 5b
- Projet Supabase `detour` en ligne (offre gratuite ; ancien projet Paris en pause le 2026-11-06, remplacé par `fmhtvyhsqfcdacasbspx`, mêmes migrations et collecte à refaire) : migration de la 5a, collecte, RLS vérifiée (la clé publique ne lit rien).
- Connexion par code e-mail à 6 chiffres (10 min, une demande par minute), modèle français, envoi par Resend depuis `onboarding@resend.dev` (seul le titulaire du compte Resend reçoit les codes). Config dans `server/supabase/config.toml`, poussée par `supabase config push` ; SMTP seulement pour le projet en ligne, Mailpit en local.
- App : section Compte dans Profil, session `supabase-js` dans le `localStorage` d'`expo-sqlite`. 1 dépendance : `@supabase/supabase-js`. Exception Auth notée dans `.claude/CLAUDE.md`.

## Réorganisation des documents et consignes — 2026-10-12

- [x] Déplacer les consignes Claude et les leçons d'agent dans `.claude/`.
- [x] Garder le concept produit et la roadmap dans `docs/`.
- [x] Mettre à jour les références dans les consignes, la documentation et la roadmap.
- Vérification : références aux anciens chemins absentes ; instructions Claude confirmées par la documentation officielle.
- API : `DELETE /me` (jeton vérifié par Supabase Auth, suppression avec la clé secrète, `fetch` seul). Délai de 10 s partagé (`fetchWithTimeout`) pour les appels de l'app.
- En ligne : API Render `detour-api` (https://detour-api-30ul.onrender.com, gratuite) ; collecte chaque lundi par GitHub Actions (Render exige une carte pour un cron).
- Vérifié : 56 tests app, 18 serveur, typecheck, lint, format ; workflow de collecte lancé (106 lieux) ; sur le téléphone à travers Render : lieux, connexion, session gardée, suppression du compte. Journaux Render : méthode, chemin, statut seulement.
- Reste : domaine Détour + expéditeur Resend avant la bêta (phase 8). L'API gratuite s'endort (premier appel environ 30 s).

## Orchestration Claude Code → Hermes Agent — implémentation locale (2026-10-12)

Objectif : compléter le runner local existant pour qu'une commande planifie avec Claude Code, fasse implémenter les tâches une par une par Hermes via Ollama, puis fasse relire le diff réel par Claude Code. L'état et les journaux restent locaux ; aucun commit, push ou déploiement n'est automatique.

Choix de sécurité retenus : Hermes Agent v0.21.7 confirme que `-z` contourne les approbations d'outils. Le runner limite donc chaque appel Hermes au toolset `file` (pas de terminal) et exécute lui-même les commandes de test issues d'une liste autorisée et sans shell. Claude planifie et relit en mode `plan`, avec les options réellement prises en charge par Claude Code 2.1.284. Les fichiers locaux existants sous `.agent/` sont préservés ; chaque run écrit dans un dossier unique plutôt que d'écraser un état local antérieur.

### État vérifié avant l'implémentation

- [x] Le runner existant planifie et relit avec Claude, lance Hermes en one-shot, limite les tentatives à 3, exige une branche dédiée et un arbre Git propre, écrit un état lisible et transmet à Claude le diff Git réel.
- [x] Versions/configuration vérifiées : Claude Code 2.1.284 ; Hermes v0.21.7 ; Ollama 0.40.3 ; Hermes utilise effectivement `ollama-launch` et `deepseek-coder:33b`, présent dans `ollama list`.
- [x] Le toolset `file` et son passage par option Hermes sont disponibles ; `-z` contourne les confirmations, d'où l'interdiction prévue du toolset terminal.
- [x] Les 11 worktrees Git enregistrés sont propres ; le worktree `todo-navigation` est verrouillé par une session existante et restera intact. La branche `main` était propre et en avance d'un commit avant l'ajout de ce plan.
- [x] Le runner, `.agent/` et ses journaux sont volontairement ignorés par Git et décrits comme locaux dans `docs/README.md` ; les prompts et l'état déjà présents restent intacts.

### Écarts démontrés à corriger

- Claude Code reçoit `--max-turns`, option absente de sa CLI installée : le runner actuel échoue avant la planification.
- Le plan n'est validé que superficiellement : dépendances, critères, commandes, transitions d'état et reprises ne sont pas contrôlés ; `plan.json` est réécrit.
- L'ordre des tâches est celui du tableau, pas celui du graphe de dépendances ; tentatives et verdicts ne sont pas persistés dans un état structuré.
- Hermes est lancé sans toolset explicite ; le fournisseur/modèle local n'est ni contrôlé ni passé explicitement à chaque appel.
- Les délais sont fixes ; les sorties et le code de retour sont capturés en mémoire, sans durée ni journal persistant par tentative ; le runner ne lance pas les validations lui-même.

### Tâches validées et bilan d'implémentation

#### T1 — Valider le contrat des plans et de l'état
- [x] Valider les plans strictement : identifiants, dépendances sans cycle, fichiers dans le dépôt, critères, commandes de test allowlistées, fournisseur/modèle local et état.
- [x] Persister l'état atomiquement dans un dossier unique par run ; une interruption ne redémarre rien sans choix explicite (`review`, `retry` ou `block`).
- [x] Limiter chaque tâche à trois tentatives, valider les transitions et conserver les journaux même quand un appel échoue.
- Vérifié : tests unitaires locaux sur plan, dépendances, transitions, limite d'essais, stockage, chemins, reprise et sorties.
- Fichiers probables : `scripts/agent-loop.py`, tests du runner.

#### T2 — Compléter la boucle Claude → Hermes → Claude
- [x] Vérifier les exécutables, versions, configuration Hermes/Ollama, statut fournisseur/modèle et modèle installé ; revérifier avant chaque lancement Hermes.
- [x] Passer explicitement le fournisseur et le modèle, limiter Hermes au toolset fichier, et exécuter les tests autorisés sans shell.
- [x] Enregistrer stdout, stderr, statut, durée, timeouts et état par tentative ; préserver un diff qui sort de la portée et bloquer.
- [x] Faire relire à Claude le diff effectif, y compris le contenu des nouveaux fichiers ; refuser un diff trop grand ou détecté comme contenant un secret.
- [x] Exiger un plafond Claude explicite par appel ; aucun commit, push ni déploiement automatique.
- Dépendance : T1.
- Vérifié : exécutions simulées ; appels réels non lancés. Plafond recommandé et confirmé par l'utilisateur pour le pilote : 1 USD par appel Claude, avec `--max-tasks 1` (4 USD maximum).
- Fichiers probables : `scripts/agent-loop.py`, tests du runner.

#### T3 — Tester les reprises et les échecs sans modèles réels
- [x] Ajouter des tests standard-library qui simulent les appels de processus, validations Git et verdicts sans exécuter les modèles.
- [x] Couvrir dépendances, verdicts, tentatives, timeouts, capture, secrets, taille du diff, stockage et reprise explicite.
- Critères vérifiés : la suite n'exécute aucun modèle ; un échec laisse un état structuré et les fichiers en place.
- Dépendances : T1 et T2.
- Vérifié : `python3 -m unittest discover -s .agent/tests -v` (63 tests : modes primary/fallback/recovery, classification des erreurs Claude, config, arbre sale).
- Fichiers probables : tests du runner.

#### T4 — Documenter le runner local sans publier l'état
- [x] Préserver l'intention existante : runner, tests locaux, prompts, états et journaux restent ignorés par Git ; `.gitignore` et les fichiers `.agent/` préexistants restent intacts.
- [x] Documenter prérequis, configuration Hermes/Ollama, budgets, commandes, limites, logs et reprise dans `docs/README.md` et `docs/runbook.md`.
- Vérifié : commandes de tests et `--help` documentées ; l'exécution réelle reste explicitement une action manuelle.
- Dépendances : T1 à T3.
- Fichiers probables : `docs/README.md`, `docs/runbook.md`, fichiers locaux du runner et de ses tests.

#### T5 — Vérifier et faire le bilan
- [x] Exécuter les tests unitaires et la compilation Python ; vérifier la CLI et les options Hermes réellement installées.
- [x] Confirmer que les changements suivis sont limités à la roadmap, la documentation et la leçon ; les fichiers runner et `.agent/` restent ignorés.
- [x] Ne pas contacter de modèle réel depuis cet arbre de travail modifié ; aucun commit/push créé ni branche/worktree modifié.
- Reste avant premier cycle réel : remplir les prompts locaux et lancer sur une branche dédiée propre. Le runner refusera l'arbre actuel tant que les changements documentaires suivis ne sont pas intégrés ou retirés.
- Dépendances : T1 à T4.

**État :** runner implémenté et validé par tests simulés ; cycle réel volontairement non lancé.

### Relais Hermes quand Claude est indisponible

- [x] Réduire le délai Claude à 2 minutes par appel (configurable).
- [x] Si Claude est absent, expire, renvoie une erreur ou ne retourne rien pendant la planification, demander à Hermes de produire le plan localement puis poursuivre l'implémentation.
- [x] Si Claude est indisponible à la revue, conserver les modifications en état `review`, suspendre le run avec code de sortie 2 et permettre de reprendre la revue sans relancer Hermes.
- [x] Vérifié par tests simulés : fallback de planification, pause et reprise au stade review, sortie non nulle sur revue différée, capture d'un message d'indisponibilité/crédit.
- Décision : Hermes ne peut pas s'auto-approuver ; la tâche ne devient terminée qu'après un verdict Claude.

## Refonte visuelle : carnet de voyage — 2026-11-06

Référence : `docs/design.md` (charte validée, mode clair et mode sombre) et le canvas « Détour, direction carnet de voyage ». Visuels de marque dans `app/assets/brand/`.

### R1 — Tokens et polices
- [x] Remplacer `app/src/theme/tokens.ts` par `colors`, `colorsDark`, `fonts`, `spacing`, `radius`, `motion` de la charte.
- [x] Hook de thème qui choisit le jeu de couleurs selon le réglage du téléphone.
- [x] Installer et charger `@expo-google-fonts/fraunces`, `caveat`, `special-elite`, `dm-sans` (garder l'écran de lancement tant que les polices ne sont pas prêtes).
- [x] `userInterfaceStyle` à `automatic` dans `app.json` (2026-11-06) : tous les écrans lisent le thème. Demande un rebuild natif.
- Vérifier : `npm run typecheck`, `npm run lint`, l'app démarre sur le téléphone avec les nouvelles polices.
- Fait le 2026-11-06 : typecheck, lint et 88 tests passent (dont `tokens.test.ts`, 21 cas de contraste). Pas encore vu sur le téléphone : lancer `cd app && npm start` et vérifier que l'app démarre, que l'écran de lancement disparaît et qu'aucune erreur de police n'apparaît.
- Écart avec la charte d'origine : `stamp` assombri en clair, éclairci en sombre, `muted` et `kraft` sombre ajoutés (voir `docs/design.md`).

### R2 — Icône et lancement
- [x] Icône branchée (2026-11-06) : `icon.png` (1024), icône adaptative Android (avant-plan réduit à 62 % pour tenir dans la zone sûre, fond `#2A2630`, version monochrome), image de lancement sur `#2A2630`. Les PNG sont tirés des SVG de `assets/brand/`.
- [x] Anciens `logo-detour*.svg`, `chemin-angulaire*.svg` et `android-icon-background.png` retirés (rien ne les utilisait).
- [ ] Écran de lancement animé (pour l'instant : image fixe) (trajet, mot, croix), coupé dès que l'app est prête, version sans animation si « réduire les animations ».
- Vérifier : development build sur le téléphone, icône visible sur l'écran d'accueil.

### R3 — Composants de base
- [x] Barre d'onglets (bouton photo rond `stamp` ; 3 entrées pour l'instant, Sorties et Cercle n'existent pas encore).
- [x] Boutons principal, secondaire et danger.
- [ ] Pastille de filtre, interrupteur, champ, bouton retour : avec les écrans qui s'en servent (R4).
- [x] Polaroïd, tampon, scotch (galerie du Profil, badge « Découvert »).
- [ ] Billet, note manuscrite : avec Sorties et la fiche d'un lieu (R4).
- [ ] Transition entre onglets (320 ms, glissement de 46 px avec redressement de 2°) : pas faite, elle demande une animation Reanimated propre sur le navigateur d'onglets ; à traiter à part.
- Chaque composant fonctionne en clair et en sombre, uniquement via les tokens. Un fichier par composant, moins de 500 lignes.
- Fait le 2026-11-06 : typecheck, lint, tests (`Button`, `TabBar`). À voir sur le téléphone : barre d'onglets, bouton photo qui dépasse et reste cliquable sur Android, polaroïds du Profil, tampon « Découvert ».

### R4 — Écrans, un par un
- [ ] Connexion par code e-mail, compte et déconnexion (habillage de `features/account/`)
- [x] Carte, première passe (2026-11-06) : brouillard hachuré (`fog-hatch.png` posé sur la couleur `fog`), repères en disque papier à contour `stamp` (plein quand le lieu est choisi), trajet à pied en pointillés `stamp`, point de position `postal`, panneau du bas en carte fiche (Fraunces, note manuscrite, contour encre), liste des lieux, bouton de recentrage, flèche de direction.
- [ ] Carte, ce qui reste : style de carte sur mesure (le style `liberty` est coloré, la charte veut papier, eau bleu postal, parcs sauge ; il faut surcharger les couleurs du style), repères numérotés, annotations manuscrites, boussole, carte « Prochain détour », croix de fin de trajet. À vérifier sur le téléphone : l'espacement des hachures (image à 1x, peut sortir trop petite ou trop grande selon la densité d'écran).
- [x] Types de carte (2026-11-06) : Carnet (défaut), Classique et Sombre, réglage dans le Profil en attendant l'écran Réglages. Code, tests de `themeStyle` et typecheck passent ; vérifié sur le téléphone le 2026-11-06 : les trois cartes fonctionnent bien. Idées pour plus tard : aperçu de chaque style dans le choix, satellite (autre fournisseur à étudier).
- [x] Migration des écrans existants vers le thème (2026-11-06) : Profil, cartes (`MapsSection`), compte, formulaire de lieu, fiche d'un lieu, Photo et Onboarding lisent `useTheme()` et les polices de la charte (plus de `palette.light` hors de `tokens.ts`). Profil : couverture de carnet encre avec tampon du nombre de lieux, interrupteur `stamp`/`kraft`. Typecheck, lint, 101 tests. À voir sur le téléphone : tous ces écrans (les bordures de champs et cartes ont pris la couleur `ink`, à adoucir en `kraft` si trop dur).
- [x] Validation d'un lieu (2026-11-06) : `ValidatedOverlay` après une photo réussie, le polaroïd monte (450 ms) puis le tampon « Validé » se pose, 0,9 s de pause, retour à la carte. `captureDiscovery` renvoie maintenant `photoUri`. Pas vue sur le téléphone le 2026-11-06 (rien à l'écran après la photo) : gardée telle quelle, à revoir plus tard.
- [x] Fiche d'un lieu (2026-11-06) : photo en polaroïd avec la date en légende manuscrite, nom en Fraunces 28, tampon « Découvert », suppression en bouton danger. Pas de billet ni de note : rien à y mettre tant que Sorties n'existe pas.
- [ ] Sorties et détail d'une sortie
- [ ] Cercle et sous-pages (carte partagée, voyageur, mots doux, balades, laisser une balade, dessiner)
- [ ] Moi et sous-pages (pages collées, données, réglages, débloquer une ville)
- Les écrans sociaux (Cercle) suivent la phase 7 : on ne fait ici que l'habillage de ce qui existe déjà.

### Décisions prises pour R4
- Accroche du tracé de balade : OpenRouteService `foot-walking`, déjà utilisé pour l'itinéraire (`walkingRoute.ts`). Le trait dessiné est converti en quelques points de passage, ORS renvoie le chemin piéton. Attention au quota de la clé : un appel par tracé validé, pas par mouvement du doigt. Les points de passage partent chez ORS comme pour l'itinéraire ; le tracé n'est envoyé à notre serveur que si l'utilisateur publie sa balade.
- Modération des balades : plus tard. Au début, publication directe.
- Recadrage des photos dans les polaroïds : fait par l'utilisateur au moment de la photo.
- Connexion et déconnexion : ajoutées au design (écrans Connexion, Code, Compte, Déconnexion). Le compte passe par Supabase Auth, code par e-mail (`app/src/features/account/`). Il n'est demandé que pour partager, commenter ou publier une balade. Jouer, découvrir et acheter des cartes marchent sans compte.

### Bilan
À remplir à la fin de chaque étape.

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
- [x] 9. Doc (`docs/README.md`, `docs/runbook.md`), « État actuel » dans `CLAUDE.md`, `tasks/lessons.md`, bilan.

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
9. [x] **Doc** : `docs/README.md` (architecture serveur, catégories, flux des lieux), `docs/runbook.md` (lancer Supabase local, `.env`, collecte, `adb reverse`, réinitialiser la base), `CLAUDE.md` « État actuel », bilan.

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
   - `CLAUDE.md` : exception Auth, « État actuel »
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
   - [ ] **Test sur le téléphone** : achat d'une carte avec un compte testeur (pas de vrai paiement), carte « Débloquée », restauration après réinstallation.
   - [ ] **Ménage RevenueCat** : `~/.config/detour/revenuecat.env` supprimé, doc à jour. Reste (toi) : révoquer les deux clés et supprimer le projet RevenueCat. Doc : `CLAUDE.md` (stack : paiements par les stores), `discover.md`, `docs/README.md`, `docs/runbook.md` (section Play Console à la place de RevenueCat).
   Vérifié le 2026-10-11 : typecheck, lint, 67 tests ; development build avec `expo-iap` installé, `BILLING` dans le manifeste fusionné, activité `singleTop`, pas de crash ; « Restaurer mes achats » répond « Achats restaurés. » (connexion à Google Play OK) ; toutes les cartes « À débloquer » sans bouton tant que la Play Console n'a pas de produits.
8. [ ] **Tests** : `findArea` (grande ville avant département), collecte (Bordeaux hors Gironde), achat sandbox iOS et Android, restauration sur un autre appareil.
9. [ ] **Doc** : `docs/README.md`, `docs/runbook.md` (ajouter un département), `CLAUDE.md`, bilan.

Fait le 2026-10-10 (étapes 1 à 5, en local) : collecte Gironde (5355 lieux, Bordeaux 1644, 50 km² retirés) et Landes (3493 lieux, Biscarrosse dedans), 61 tests app et tests serveur verts. En ligne le 2026-10-10 : migration appliquée, Landes, Gironde et Bordeaux collectés, API Render servant `/areas` (3 zones). Fait sur le téléphone le 2026-10-10 : migration 6 passée, Landes en `free`, 3 493 lieux en cache, Piscine toujours « Découvert », 4 min sans erreur. Corrigé en passant : la tâche de fond fermait la connexion SQLite partagée avec l'app (voir `tasks/lessons.md`). Pas vu : une zone bloquée sur le téléphone (il faudrait être en Gironde), couverte par les tests.
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
- 3 bugs vus seulement sur le téléphone : `RECEIVE_BOOT_COMPLETED` manquante (crash), tâche enregistrée sans service après le crash, deux enregistrements simultanés. Corrigés, détaillés dans `tasks/lessons.md` et `docs/runbook.md`.
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
- Projet Supabase `detour` en ligne (Paris, offre gratuite) : migration de la 5a, collecte, RLS vérifiée (la clé publique ne lit rien).
- Connexion par code e-mail à 6 chiffres (10 min, une demande par minute), modèle français, envoi par Resend depuis `onboarding@resend.dev` (seul le titulaire du compte Resend reçoit les codes). Config dans `server/supabase/config.toml`, poussée par `supabase config push` ; SMTP seulement pour le projet en ligne, Mailpit en local.
- App : section Compte dans Profil, session `supabase-js` dans le `localStorage` d'`expo-sqlite`. 1 dépendance : `@supabase/supabase-js`. Exception Auth notée dans `CLAUDE.md`.
- API : `DELETE /me` (jeton vérifié par Supabase Auth, suppression avec la clé secrète, `fetch` seul). Délai de 10 s partagé (`fetchWithTimeout`) pour les appels de l'app.
- En ligne : API Render `detour-api` (https://detour-api-30ul.onrender.com, gratuite) ; collecte chaque lundi par GitHub Actions (Render exige une carte pour un cron).
- Vérifié : 56 tests app, 18 serveur, typecheck, lint, format ; workflow de collecte lancé (106 lieux) ; sur le téléphone à travers Render : lieux, connexion, session gardée, suppression du compte. Journaux Render : méthode, chemin, statut seulement.
- Reste : domaine Détour + expéditeur Resend avant la bêta (phase 8). L'API gratuite s'endort (premier appel environ 30 s).

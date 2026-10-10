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
- [ ] Partage d'un lieu créé : à la communauté seulement les spots et lieux publics (`visibility = 'public'` : établissements recevant du public, points de vue, nature), après modération. Un lieu `private` (domicile) jamais public, partageable à des amis choisis
- [ ] Partage de position en direct entre amis (exception volontaire à « la position reste sur l'appareil », à valider) : désactivé par défaut, amis choisis un par un, durée limitée (1 h, 8 h ou jusqu'à l'arrêt), arrêt en un geste, bandeau visible tant que le partage tourne. Seule la dernière position part, écrasée à chaque envoi, effacée à l'arrêt ou à l'expiration : jamais d'historique côté serveur. Lecture réservée aux amis choisis (RLS Supabase). Point de l'ami sur la carte, sans dévoiler le brouillard ni donner d'itinéraire vers lui
- [ ] Test : après l'arrêt ou l'expiration, le serveur ne garde aucune position ; un utilisateur non choisi ne lit rien
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

# Plan : construire Discover

Ordre pensé pour avoir une boucle jouable le plus tôt possible : carte, photo, validation, le tout en local. Le backend vient après, avec des lieux de test en dur au départ.

Chaque phase finit par une vérification : `cd app && npx tsc --noEmit`, les tests, puis un test manuel sur development build. Après chaque phase, mettre à jour « État actuel » dans `CLAUDE.md` et le bilan en bas de ce fichier.

## Phase 0 : Fondations
- [ ] Créer `/app` avec Expo (TypeScript strict, `"strict": true`)
- [ ] Créer `/shared` (types partagés) et `/server` (squelette Node + TypeScript strict)
- [ ] Brancher `/shared` dans `/app` et `/server` (npm workspaces ou alias de chemin TypeScript)
- [ ] Arborescence `/app/src` : `screens/`, `components/`, `features/`, `db/`, `lib/`
- [ ] ESLint (règle `no-explicit-any`) + Prettier
- [ ] Runner de tests (`jest-expo` dans `/app`, Jest ou Vitest dans `/server`)
- [ ] Variables d'environnement : `.env.example`, aucune clé dans le code
- [ ] Navigation (écran Carte, écran Photo, écran Profil)
- [ ] Fichier de traduction français + helper `t()` (aucun texte en dur)
- [ ] Development build iOS/Android (`npx expo run:ios`), Expo Go ne marche pas avec MapLibre
- [ ] CI GitHub Actions : typecheck + lint + tests sur chaque push
- [ ] Test : l'app démarre sur development build, la CI passe

## Phase 1 : Stockage local (SQLite)
- [ ] Schéma `discovered_places`, `photos`, `owned_maps` dans `app/src/db/`
- [ ] Table `walked_paths` : points GPS du chemin parcouru (reste sur l'appareil)
- [ ] Table `places_cache` : lieux de la ville en cache, pour le hors ligne
- [ ] Migrations versionnées au démarrage
- [ ] Fonctions de lecture/écriture (une responsabilité par fichier)
- [ ] Test : insérer et relire une découverte, migration sur base vide et sur base existante

## Phase 2 : Carte et brouillard
- [ ] Brancher les tuiles OpenFreeMap
- [ ] Intégrer `@maplibre/maplibre-react-native` + style de carte
- [ ] Écran d'accueil : explication du concept et des permissions avant de les demander
- [ ] Position utilisateur (`expo-location`, texte de permission en français)
- [ ] Enregistrement du chemin parcouru dans `walked_paths` (app ouverte, échantillonnage limité pour la batterie)
- [ ] Calcul des zones dévoilées : cercle de 150 m autour des lieux découverts + bande le long des chemins parcourus
- [ ] Couche brouillard : tout est caché sauf les zones dévoilées
- [ ] Performance : le brouillard reste fluide avec 500 lieux découverts et de longs chemins
- [ ] Test : avec une découverte factice, seule la zone de 150 m est visible

## Phase 3 : Lieux et navigation (données de test)
- [ ] Type `Place` dans `/shared`
- [ ] Jeu de lieux de test en dur à Biscarrosse
- [ ] Liste ou marqueurs des lieux proches (non découverts : pas de position exacte affichée sur la carte cachée)
- [ ] Lieu non découvert : flèche orientée par la boussole (`expo-location` heading) + distance à vol d'oiseau, jamais d'itinéraire
- [ ] Lieu découvert : itinéraire à pied via OpenRouteService, appel direct depuis l'app (notre serveur ne voit jamais la position). Clé dédiée à l'app, quota surveillé
- [ ] Test : un lieu non découvert n'expose aucune route, ni dans l'UI ni dans les données

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
- [ ] Politique de confidentialité + étiquettes de confidentialité App Store et Play Store
- [ ] Icône, écran de lancement, fiches des stores
- [ ] Build EAS iOS/Android
- [ ] Bêta TestFlight + test interne Play Store

## Décisions prises
- Ville de développement : Biscarrosse
- Tuiles de carte : OpenFreeMap (OpenStreetMap, sans clé API)
- Itinéraire à pied : OpenRouteService (clé API, quota quotidien). Repli : Valhalla auto-hébergé
- Première source de lieux : OpenStreetMap via l'API Overpass

## Questions ouvertes
- Ville offerte au lancement (phase 6)
- Chemin parcouru en arrière-plan ou seulement app ouverte (phase 2, impact batterie et permissions)
- Sauvegarde des découvertes si perte du téléphone : aucune, export manuel, ou sauvegarde chiffrée volontaire (phase 5)
- Catégories de lieux (phase 5)
- Ville offerte modifiable ou non (phase 6)
- Prix par ville (phase 6)
- Outil de remontée des crashs (phase 8)

## Bilan

À remplir à la fin de chaque phase.

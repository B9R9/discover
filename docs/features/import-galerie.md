# Importer les photos d'un voyage depuis la galerie : spec

Brouillon du 8 nov 2026, à relire

## 1. Résumé

L'utilisateur choisit un album ou une plage de dates dans sa galerie. Détour lit la date et la position (EXIF) des photos, sur l'appareil, sans rien envoyer. L'app range les photos dans le carnet du voyage, les place sur la carte et propose des lieux. Rien n'est découvert tant que l'utilisateur n'a pas validé : le brouillard ne se lève qu'après son geste. La validation se fait lieu par lieu ou par lots.

Les photos restent dans la galerie. Détour garde seulement des références vers elles, jamais de copie. Rien ne part sur Supabase sans un partage explicite, et au partage l'EXIF est retiré.

L'import peut créer un voyage après coup sur une plage de dates, ou compléter un voyage existant. Un lieu se découvre une seule fois. Uniquement Helsinki pour l'instant.

## 2. Objectif et utilisateur

**Objectif.** Permettre de remplir Détour avec des sorties déjà faites, sans avoir pris les photos dans l'app. Aujourd'hui, une balade faite avec l'appareil photo du téléphone ne laisse aucune trace dans le carnet. Avec l'import, elle devient des pages et des trous dans le brouillard, en quelques minutes.

**Utilisateurs visés.**
- La personne qui vient d'installer Détour et a déjà des centaines de photos de Helsinki. Elle veut voir sa carte se remplir tout de suite, sans tout refaire.
- La personne qui a oublié de démarrer un voyage dans l'app, ou qui a pris ses photos avec l'appareil photo natif par habitude.
- La personne qui a fait une sortie à plusieurs : les photos des autres arrivent dans sa galerie (AirDrop, messagerie) et elle veut les ranger.

**Ce que la feature n'est pas.**
- Pas une sauvegarde de photos. Détour ne copie rien et ne garde rien si la photo disparaît de la galerie.
- Pas une analyse du contenu des photos. Aucune reconnaissance de visages, d'objets ou de texte.
- Pas une découverte automatique. L'app propose, l'utilisateur valide.

**Mesure de réussite (à confirmer).** Part des imports lancés qui aboutissent à au moins un lieu validé. Part des propositions validées sans modification (indique la qualité des propositions). Aucune de ces mesures ne remonte de coordonnée ni de photo (voir Safety).

## 3. Comportement détaillé

### 3.1 Points d'entrée

1. Écran **Sorties** : bouton secondaire « Importer depuis la galerie » en haut de la liste des voyages.
2. Fiche d'un voyage existant (dans Sorties) : action « Ajouter des photos de la galerie ». La destination est alors ce voyage, l'étape « À quel voyage ? » est sautée.
3. État vide de Sorties (aucun voyage) : texte « Tu as déjà des photos de Helsinki ? Range-les dans ton carnet. » et bouton principal `stamp` « Importer des photos ».

L'appareil photo et la Carte n'ont pas de point d'entrée dans cette version (à rediscuter, voir Questions ouvertes).

### 3.2 Écran E0 : explication avant la demande système

Affiché uniquement si la permission n'a jamais été demandée, ou si elle a été refusée.

- Titre (Fraunces italique) : « Tes photos, ta carte »
- Texte (DM Sans) :
  « Détour lit la date et le lieu de tes photos pour les placer sur ta carte et te proposer des lieux. »
  « Tes photos restent dans ta galerie. Détour ne les copie pas. »
  « Rien ne part sur internet, sauf ce que tu choisis de partager. »
- Bouton principal `stamp` : « Autoriser l'accès aux photos »
- Bouton secondaire : « Pas maintenant »
- Lien texte : « Ce que Détour lit dans tes photos » (ouvre une feuille qui liste : date de prise de vue, position, type de média, dimensions, identifiant de la photo dans la galerie. Et ce qu'il ne lit pas : le contenu de l'image, les visages, les légendes.)

Sur iOS, une ligne en plus : « Tu peux aussi n'autoriser que certaines photos. Ça suffit pour importer un voyage. »

Si la permission a été refusée (état « refusé définitivement ») :
- Texte : « Détour n'a pas accès à tes photos. Tu peux changer ça dans les réglages de ton téléphone. »
- Bouton principal : « Ouvrir les réglages »
- Bouton secondaire : « Retour »
- Au retour dans l'app, la permission est relue. Si elle est accordée, le flux reprend à E1 sans repasser par E0.

### 3.3 Écran E1 : choisir les photos

- Titre : « Quelles photos ? »
- Deux choix (cartes sélectionnables, 44 px minimum, état sélectionné porté par une coche et le texte « Choisi », pas seulement par la couleur) :
  - « Un album » : liste des albums visibles par Détour, avec nombre de photos et dates (« Été 2026 · 214 photos · 2 juin au 28 août »). Les albums vides ou faits uniquement de vidéos sont grisés avec la mention « Pas de photo ».
  - « Des dates » : deux champs avec libellés visibles « Du » et « Au », sélecteur de date natif. Par défaut : les 7 derniers jours.
- Sous le choix, un compteur mis à jour à chaque changement : « 812 photos dans cette période ». Le compteur ne lit que le nombre d'éléments, pas l'EXIF (rapide même sur une très grosse galerie).
- Sur iOS en accès limité : bandeau `postal` (texte `ink`) « Détour ne voit que les photos que tu as choisies. » avec bouton secondaire « Choisir d'autres photos » (ouvre le sélecteur limité du système).
- Bouton principal : « Continuer »

### 3.4 Écran E2 : à quel voyage ?

Sauté si l'import part d'un voyage existant.

- Titre : « À quel voyage les ranger ? »
- Choix :
  - « Un nouveau voyage » (par défaut). Champ « Nom du voyage » avec libellé visible, prérempli « Balade du 3 au 7 août ». Les dates du voyage sont celles de la plage choisie, ou la première et la dernière photo de l'album.
  - « Un voyage existant » : liste des voyages dont les dates touchent la période choisie en premier, puis les autres.
  - « Aucun voyage » : les lieux validés ne seront rattachés à aucun voyage.
- Si la plage du nouveau voyage chevauche un voyage existant, voir 4.6 et l'edge case 23.
- Bouton principal : « Lancer l'import »

### 3.5 Écran E3 : lecture des photos

- Titre : « On regarde tes photos »
- Barre de progression avec texte « 240 sur 812 ». La barre a une valeur accessible (`accessibilityValue`) annoncée toutes les 10 % au lecteur d'écran, pas à chaque photo.
- Texte : « Tu peux quitter cet écran. On te dit quand c'est prêt. »
- Bouton secondaire : « Arrêter ». Arrêter garde ce qui a déjà été lu et propose « Reprendre plus tard » ou « Tout annuler ».
- Si des photos sont dans iCloud ou Google Photos et pas sur l'appareil, ligne en plus : « 38 photos sont dans le cloud. On lit leur date et leur lieu sans les télécharger. »
- Quand c'est fini et que l'utilisateur est ailleurs dans l'app : bandeau discret en haut de l'écran courant « Ton import est prêt : 23 lieux à valider », touchable, qui ouvre E4. Pas de notification système dans cette version.

### 3.6 Écran E4 : résumé de l'import

- Titre : le nom du voyage.
- Tampon (Special Elite) « Import » et la plage de dates.
- Lignes de résumé, chacune touchable quand elle mène quelque part :
  - « 640 photos rangées dans le carnet »
  - « 23 lieux à valider »
  - « 4 lieux déjà découverts : on peut y ajouter tes photos »
  - « 98 photos sans position » (mène à E7)
  - « 51 photos hors de Helsinki » (mène à la liste, voir 4.9)
  - « 12 photos déjà dans un autre voyage »
  - « 34 photos mises de côté : vidéos, captures d'écran, doublons » (mène à la liste, avec la raison de chacune)
- Bouton principal : « Voir les lieux proposés »
- Bouton secondaire : « Plus tard ». Les propositions restent en attente sans limite de temps, accessibles depuis la fiche du voyage (« 23 lieux à valider »).

### 3.7 Écran E5 : propositions et validation par lots

C'est l'écran central de la feature.

- Titre : « Lieux à valider »
- Sous-titre : « Coche ceux où tu es vraiment allé. »
- Liste groupée par jour. En-tête de jour (Special Elite) : « MARDI 5 AOÛT » avec une case « Tout ce jour » (44 px).
- Une carte par proposition :
  - Case à cocher à gauche, 44 px, avec libellé accessible « Valider Kaivopuisto, 14 photos ».
  - Trois vignettes (sans rotation : la carte est interactive).
  - Nom du lieu proposé (DM Sans gras), « 14 photos · 14 h 10 à 15 h 02 ».
  - Si le lieu est incertain : mention « Ou bien : Café Ursula, Merisatama » (deux autres candidats maximum).
  - Si la position est douteuse (voir 4.4) : la carte n'apparaît pas ici, la photo va dans E7.
- Par défaut, **aucune case n'est cochée**. Le geste de validation reste celui de l'utilisateur. « Tout cocher » existe (bouton secondaire en haut), mais il faut le toucher.
- Barre fixe en bas :
  - Bouton principal `stamp` : « Valider 9 lieux » (désactivé avec texte « Coche des lieux » quand rien n'est coché).
  - Bouton secondaire : « Ignorer la sélection ». Les propositions ignorées partent dans un repli « Ignorés (5) » en bas de liste, récupérables.
- Mini-carte repliable en haut (« Voir sur la carte ») : les propositions y apparaissent en repères à contour pointillé `ink`, avec le mot « à valider » sous chaque repère. Pas de `lantern` pour un lieu non validé. Le brouillard n'est pas levé.
- Toucher une carte (hors case) ouvre E6.

Lieux déjà découverts : section séparée en haut, « Déjà dans ton carnet ». Chaque carte porte le tampon « DÉJÀ DÉCOUVERT · N° 37 » et une case « Ajouter les photos à sa page ». Ces cases ne comptent pas dans « Valider N lieux » ; le bouton devient « Valider 9 lieux et ajouter 2 pages de photos » quand les deux sont cochés.

### 3.8 Écran E6 : détail d'une proposition

- Grande carte locale centrée sur le groupe de photos, repère pointillé.
- Toutes les photos du groupe en grille. Toucher une photo la retire du groupe (elle va dans E7) avec annulation possible.
- « Photo de la page » : choix de la photo qui fera le polaroïd. Par défaut, la plus nette selon les métadonnées (la plus grande résolution, pas de rafale), jamais par analyse du contenu.
- « Ce n'est pas le bon lieu » : liste des lieux dans un rayon de 300 m, triés par distance, plus une recherche par nom.
- « Séparer » : coupe le groupe en deux à l'heure choisie.
- Bouton principal : « Valider ce lieu ». Bouton secondaire : « Ignorer ».

### 3.9 Validation et lever du brouillard

1. L'utilisateur touche « Valider 9 lieux ».
2. Les 9 lieux passent à l'état découvert en une seule écriture locale (tout ou rien).
3. Retour sur la Carte, filtrée sur le voyage. Les 9 trous s'ouvrent ensemble, en 450 ms maximum, sans rebond. Si « réduire les animations » est actif, ils apparaissent ouverts directement.
4. Bandeau en bas : « 9 lieux découverts. » avec bouton « Annuler » pendant 10 secondes. Annuler remet les 9 propositions en attente et referme les trous.
5. Les pages correspondantes apparaissent dans le carnet du voyage (polaroïd de la photo choisie, tampon numéroté, date de la photo).

### 3.10 Écran E7 : photos sans lieu

- Titre : « Photos sans lieu »
- Groupes : « Sans position » ; « Position douteuse » ; « Retirées d'un lieu ».
- Pour une photo sans position prise entre deux photos placées à moins de 30 minutes d'écart : suggestion « Prise 12 min après Kauppatori. Peut-être au même endroit ? » avec bouton « Placer à Kauppatori ».
- Action manuelle sur une sélection : « Placer sur un lieu » (liste des lieux du voyage, puis recherche par nom). Le lieu placé à la main suit la même règle : il n'est découvert qu'après « Valider ».
- Les photos restent ici, rangées dans le carnet du voyage sous « À trier », tant qu'elles ne sont pas placées.

### 3.11 Le carnet après import

- Chaque lieu validé a sa page (polaroïd, note manuscrite vide, tampon numéroté). Les autres photos du groupe sont sur la page, sous le polaroïd.
- Section « À trier » en fin de carnet du voyage : photos sans lieu et propositions en attente, avec le compteur « 23 lieux à valider ».
- Les photos importées portent une petite étiquette (Special Elite, `postal`) « GALERIE ». C'est une étiquette texte, donc l'information ne repose pas sur la couleur.

### 3.12 Photos introuvables

Quand une référence ne mène plus à une photo (supprimée, accès retiré) :
- À la place du polaroïd : cadre papier avec la note (Caveat, 20 px minimum) « Photo partie de ta galerie ».
- Action : « Choisir une autre photo » (parmi celles du lieu ou de la galerie) ou « Retirer de la page ».
- Le lieu reste découvert. Le brouillard ne se referme pas.

### 3.13 Charte

- Toutes les couleurs, tailles et espacements viennent des tokens. Mode clair et sombre testés sur chaque écran de ce flux.
- Une seule action principale `stamp` par écran (vérifié pour E0 à E7).
- Rotations seulement sur les polaroïds du carnet, jamais sur les cartes de E5, les cases ou les boutons.
- Les vignettes sont décoratives pour le lecteur d'écran quand le libellé de la carte dit déjà tout ; la photo de E6 a un libellé « Photo du 5 août, 14 h 12 ».

## 4. Règles métier

### 4.1 Validation
1. Un lieu ne passe à « découvert » que par un geste explicite de l'utilisateur sur ce lieu ou sur un lot qu'il a coché. Aucune case n'est cochée par défaut. Aucun délai, aucun seuil de confiance ne déclenche une validation automatique.
2. Une validation par lot est atomique : tous les lieux du lot sont découverts, ou aucun.
3. Une validation peut être annulée pendant 10 secondes. Ensuite, elle suit les règles normales du carnet (hypothèse : l'utilisateur peut retirer un lieu de son carnet comme pour un lieu validé à l'appareil photo, voir Hypothèses).

### 4.2 Un lieu se découvre une seule fois
4. Si le lieu proposé est déjà découvert, la proposition devient « Ajouter les photos à sa page ». Ça ne change ni le numéro de tampon, ni la date de découverte, ni le voyage de rattachement.
5. Si deux propositions du même import tombent sur le même lieu (deux passages à des jours différents), elles sont fusionnées en une seule carte : « Kauppatori · 2 passages · 31 photos ».
6. Date de découverte d'un lieu importé = date de prise de vue de la photo choisie pour la page. La date de validation est gardée à part.
7. Numéro de tampon : attribué dans l'ordre de validation, jamais renuméroté (proposition, voir Questions ouvertes).

### 4.3 Regroupement et proposition de lieux
8. Seules les photos avec une position valide et dans Helsinki sont proposées.
9. Deux photos sont dans le même groupe si elles sont à moins de 100 m l'une de l'autre et à moins de 2 heures d'écart. Un groupe se prolonge de proche en proche.
10. Un groupe est associé au lieu existant le plus proche de son centre, si ce lieu est à moins de 75 m (ou à l'intérieur de sa zone si les lieux ont une zone, voir Hypothèses). Jusqu'à deux autres candidats à moins de 150 m sont montrés en « Ou bien ».
11. Si l'EXIF donne une précision horizontale (`GPSHPositioningError`) supérieure à 100 m, la photo est en « Position douteuse ».
12. Un groupe sans lieu candidat devient une proposition « Endroit sans nom » que l'utilisateur peut associer à un lieu à la main (dépend du référentiel de lieux, voir Hypothèses).

### 4.4 Positions douteuses
13. Position douteuse si : coordonnées (0, 0) ; coordonnées hors des bornes valides ; vitesse implicite supérieure à 300 km/h avec la photo précédente et la suivante (point isolé) ; précision supérieure à 100 m.
14. Une photo à position douteuse n'est jamais proposée seule. Elle va dans E7 et peut être placée à la main.

### 4.5 Zones privées et domicile
15. L'utilisateur peut définir des zones privées (cercle de 200 m par défaut, réglable de 100 à 500 m) dans Moi. Stockées sur l'appareil uniquement.
16. Aucune proposition n'est faite dans une zone privée. Les photos y sont rangées dans « À trier » avec la raison « Dans une zone privée ».
17. Détection d'un logement : si, dans les photos lues, une même zone de 150 m contient des photos prises entre 22 h et 7 h sur au moins 2 nuits différentes, l'app demande avant de proposer quoi que ce soit dans cette zone : « Beaucoup de photos prises ici le soir. C'est chez toi ou là où tu dors ? » Boutons : « Oui, masquer cette zone » (principal) / « Non, c'est un lieu ». La réponse est mémorisée localement.

### 4.6 Voyages
18. Un voyage créé après coup a une date de début, une date de fin et la source « import ». Il se comporte ensuite comme un voyage démarré dans l'app (filtre carte, carnet), sans trajet (le suivi de trajet n'a rien enregistré).
19. Un lieu validé depuis un import est rattaché au voyage cible de l'import. Si la cible est « Aucun voyage », il n'est rattaché à rien.
20. Proposition : deux voyages ne peuvent pas se chevaucher. Si la plage choisie touche un voyage existant, l'app propose « Ajouter à "Été à Suomenlinna" » ou « Raccourcir les dates » (voir edge case 23 et Questions ouvertes).
21. Supprimer un voyage créé par import ne supprime ni les lieux, ni le brouillard, ni les références photo des pages. Les propositions en attente de ce voyage sont supprimées (ce ne sont que des propositions).

### 4.7 Photos
22. Une photo de la galerie (même identifiant) n'appartient qu'à un seul voyage dans Détour. Si elle est déjà rangée ailleurs, elle est ignorée par défaut et comptée dans « déjà dans un autre voyage ». L'utilisateur peut la déplacer depuis cette liste (« Déplacer ici »). Une photo qui sert de polaroïd à un lieu ne peut pas être déplacée : le lieu reste dans son voyage.
23. Médias pris en compte : photos (JPEG, HEIC, HEIF, PNG avec EXIF, DNG si l'OS fournit l'aperçu). Mis de côté : vidéos, captures d'écran, enregistrements d'écran, photos de rafale autres que la photo clé.
24. Live Photos : seule l'image fixe est utilisée. La partie vidéo n'est jamais lue.
25. Doublons : deux éléments avec la même date de prise de vue à la seconde près, la même position et les mêmes dimensions sont un doublon. Le plus ancien dans la galerie est gardé, les autres sont mis de côté avec la raison « Doublon ».
26. Retouches : une photo retouchée dans l'app Photos garde son identifiant, c'est la version retouchée qui s'affiche. Une copie retouchée exportée (nouvel identifiant, même date) est traitée comme un doublon, la version la plus récente est montrée en premier dans E6.

### 4.8 Dates
27. Date de référence d'une photo : `DateTimeOriginal` de l'EXIF, avec `OffsetTimeOriginal` si présent. Sans décalage, la date est lue en heure de Helsinki (Europe/Helsinki, heure d'été comprise). Si l'EXIF n'a pas de date, on prend la date de création donnée par la galerie.
28. Si l'horodatage GPS (`GPSDateStamp`, `GPSTimeStamp`, en UTC) existe et diffère de plus de 1 heure de la date de prise de vue convertie en UTC, c'est l'horodatage GPS qui sert au regroupement.
29. Date invalide (avant 2000, ou dans le futur) : la photo garde sa position mais sa date s'affiche « Date inconnue ». Elle n'est pas comptée dans un voyage par dates, mais peut l'être dans un import par album.
30. Le filtre « Des dates » s'applique sur la date de référence, en jours calendaires de Helsinki, bornes incluses.

### 4.9 Helsinki uniquement
31. Une photo hors du périmètre de Helsinki (polygone utilisé par l'app, voir Hypothèses) n'est jamais proposée. Elle est comptée « hors de Helsinki ». Par défaut elle n'est pas rangée dans le carnet. L'utilisateur peut cocher « Les garder dans le carnet du voyage » sur la liste ; elles vont alors dans « À trier » avec l'étiquette « HORS CARTE ».

### 4.10 Références, pas de copies
32. Détour ne stocke que l'identifiant de la photo dans la galerie et les métadonnées utiles (date, position, dimensions, type). Jamais l'image, ni en pleine taille ni en miniature, dans ses propres fichiers persistants.
33. L'affichage passe par les miniatures fournies par le système. Un cache mémoire de session est autorisé. Tout cache disque doit être dans le dossier cache de l'app (que l'OS peut vider) et être documenté dans la feuille « Ce que Détour lit ».
34. Détour ne modifie ni ne supprime jamais une photo de la galerie. Aucune permission d'écriture n'est demandée pour cette feature.

## 5. Modèle de données

Tout ce qui suit est **local à l'appareil**. Aucune table Supabase n'est créée ou modifiée par cette feature. Le choix du stockage local (SQLite, autre) dépend du code existant (voir Hypothèses).

### 5.1 Nouvelles entités locales

**import_job**
- `id`
- `source_type` : `album` | `dates`
- `album_id` (identifiant de l'album dans la galerie, si album)
- `date_from`, `date_to` (si dates)
- `target_trip_id` (nullable : aucun voyage)
- `status` : `scanning` | `paused` | `ready` | `done` | `cancelled`
- `cursor` (position de lecture dans la liste des éléments, pour reprendre)
- `total_count`, `scanned_count`
- `created_at`, `updated_at`

**photo_ref**
- `id`
- `asset_id` (identifiant iOS `PHAsset.localIdentifier` ou identifiant MediaStore Android), unique
- `platform` : `ios` | `android`
- `taken_at` (date de référence, UTC), `taken_at_source` : `exif` | `exif_offset` | `gps` | `gallery`
- `tz_offset_minutes` (nullable)
- `lat`, `lng` (nullable), `h_accuracy_m` (nullable)
- `position_status` : `ok` | `missing` | `doubtful` | `outside_helsinki` | `private_zone`
- `width`, `height`, `orientation` (valeur EXIF 1 à 8)
- `media_kind` : `photo` | `live_photo` | `burst_key`
- `in_cloud_only` (booléen, au moment de la lecture)
- `trip_id` (nullable)
- `place_id` (nullable : rattachée à une page de lieu)
- `proposal_id` (nullable)
- `excluded_reason` (nullable : `video`, `screenshot`, `burst`, `duplicate`, `other_trip`)
- `duplicate_of` (nullable, `photo_ref.id`)
- `availability` : `available` | `missing` | `no_access` (mis à jour à chaque contrôle)
- `import_job_id`
- `last_checked_at`

**place_proposal**
- `id`
- `import_job_id`, `trip_id` (nullable)
- `candidate_place_id` (lieu proposé, nullable si « Endroit sans nom »)
- `alt_place_ids` (deux au plus)
- `centroid_lat`, `centroid_lng`
- `starts_at`, `ends_at`
- `cover_photo_ref_id`
- `kind` : `new_discovery` | `add_to_existing`
- `status` : `pending` | `validated` | `ignored`
- `validated_at` (nullable)

**private_zone**
- `id`, `lat`, `lng`, `radius_m`, `label` (facultatif, jamais affiché ailleurs que dans Moi), `created_at`, `origin` : `manual` | `detected`

### 5.2 Champs ajoutés aux entités existantes (à confirmer avec le code)

**trip** (voyage)
- `origin` : `live` | `import`
- `starts_at`, `ends_at` obligatoires pour `import`

**place discovery** (découverte d'un lieu par l'utilisateur)
- `discovered_via` : `camera` | `import`
- `discovered_at` (date de la photo), `validated_at` (date du geste)
- `cover_photo_ref_id` (au lieu d'un chemin de fichier, si les photos de l'appareil photo sont stockées autrement)

### 5.3 Relations
- Un `import_job` a plusieurs `photo_ref` et plusieurs `place_proposal`.
- Une `place_proposal` a plusieurs `photo_ref`, une photo de couverture, et pointe vers un lieu.
- Une `photo_ref` appartient à au plus un voyage et au plus une page de lieu.
- Une découverte de lieu est rattachée à un voyage ou à aucun (règle globale inchangée).

### 5.4 Supabase
- Rien à l'import. Rien à la validation.
- Au partage (phase 3), seuls partent : l'identifiant du lieu, la note, et une copie de la photo choisie, ré-encodée en JPEG sans aucune métadonnée. Les coordonnées EXIF de la photo ne partent jamais ; la position affichée dans le Cercle est celle du lieu.

## 6. Dépendances et phasage

**Phase : 2** (import galerie, voyage créé après coup), selon le phasage global.

**Dépend de (phase 1, doit être livré avant) :**
- Démarrer et arrêter un voyage, entité voyage.
- Rattachement automatique d'un lieu à un voyage.
- Filtre de la carte par voyage.
- Pins photo sur la carte (les repères « à valider » de cette feature en sont une variante).

**Dépend aussi de :**
- Un référentiel de lieux de Helsinki avec coordonnées (et zone si elle existe).
- Le périmètre de Helsinki utilisé par la carte.
- Le module d'accès à la galerie (probablement `expo-media-library`) et sa capacité à lire l'EXIF, la position, les sous-types de média et l'état cloud.

**Liée à la phase 2, mais livrable séparément :** bilan et couverture de voyage. L'import doit fournir une photo de couverture par défaut (la photo de page du premier lieu validé) sans en dépendre.

**Prépare la phase 3 :** le nettoyage EXIF au partage est spécifié ici (Safety) et doit être en place avant que le partage dans le Cercle ne soit ouvert aux photos importées.

**Découpage proposé :**
1. Lecture et classement (E0 à E4, sans propositions) : permissions, lecture EXIF, rangement « À trier ».
2. Propositions et validation par lots (E5, E6, lever du brouillard).
3. Photos sans lieu, zones privées, détection du logement (E7, 4.5).
4. Contrôle de disponibilité des références (photos supprimées, accès limité qui change).

Les étapes 1 et 3 (zones privées) doivent sortir ensemble : pas de propositions publiques ou visibles sans zone privée possible.

## 7. Safety

### 7.1 Permissions iOS
- Clé `NSPhotoLibraryUsageDescription` : « Détour lit la date et le lieu de tes photos pour les placer sur ta carte. Tes photos restent dans ta galerie. »
- Accès en lecture seule. Pas de demande d'ajout à la photothèque pour cette feature.
- Accès limité (iOS 14 et plus) : il doit suffire. Toute la feature fonctionne avec les seules photos choisies. Jamais de message qui pousse vers « Accès complet » ; le bouton « Choisir d'autres photos » ouvre le sélecteur limité du système.
- Désactiver l'alerte automatique d'iOS sur l'accès limité (`PHPhotoLibraryPreventAutomaticLimitedAccessAlert`) pour que Détour décide quand proposer le sélecteur (à vérifier avec la config Expo).
- La position des photos est accessible sans permission de localisation. Cette feature ne demande pas la localisation.

### 7.2 Permissions Android
- Android 13 et plus : `READ_MEDIA_IMAGES`. Pas de `READ_MEDIA_VIDEO` (vidéos exclues).
- Android 14 et plus : prise en charge de l'accès partiel (`READ_MEDIA_VISUAL_USER_SELECTED`), comportement identique à l'accès limité iOS.
- Android 12 et moins : `READ_EXTERNAL_STORAGE`.
- Android 10 et plus : `ACCESS_MEDIA_LOCATION` est nécessaire, sinon le système retire la position de l'EXIF. Si elle est refusée, l'import marche quand même : toutes les photos sont « sans position », et E4 l'explique : « Ton téléphone ne donne pas la position des photos à Détour. Tu peux les placer à la main, ou l'autoriser dans les réglages. »
- Aucune permission d'écriture.
- Politique Google Play sur les permissions photos : l'accès large doit être justifié comme fonction centrale. À valider avant développement (voir Hypothèses). Si refusé, repli sur le sélecteur photo Android, avec ses limites.

### 7.3 Données lues et ce qu'on en fait
- L'EXIF peut contenir : position précise, heure exacte, modèle d'appareil, numéro de série, parfois nom de l'auteur. Détour ne garde que date, décalage horaire, position, précision, dimensions, orientation. Le reste n'est ni stocké ni journalisé.
- Aucune analyse du contenu des images. Pas de reconnaissance de visages, d'enfants, de texte, de documents.
- Les journaux d'erreur et la télémétrie (s'il y en a) ne contiennent jamais de coordonnées, d'identifiant de photo, de nom d'album ni de date de prise de vue. Seulement des compteurs (« 812 lues, 23 proposées ») et des codes d'erreur.

### 7.4 Domicile et lieux sensibles
- Les photos de la galerie révèlent le domicile, l'école des enfants, un lieu de soin, un lieu de culte. Ces positions restent sur l'appareil, et :
  - les zones privées bloquent toute proposition ;
  - la détection du logement (4.5) demande avant de proposer ;
  - les repères « à valider » ne sont visibles que sur l'appareil, jamais partagés.
- Un lieu validé dans une zone privée (si l'utilisateur le force à la main) est marqué « privé » et exclu par défaut de tout partage futur.

### 7.5 Rien n'est envoyé sans partage explicite
- Import, lecture, propositions, validation : zéro appel réseau vers Supabase ou un tiers. Vérifié par test (voir Tests).
- Le seul accès réseau possible est celui du système pour afficher une miniature d'une photo stockée dans iCloud ou Google Photos. Il passe par l'OS, pas par Détour, et ne touche pas Supabase. La feuille « Ce que Détour lit » le dit.
- Le texte « Rien ne part sur internet, sauf ce que tu choisis de partager » doit rester vrai. Si un jour une partie du traitement passe par un serveur (géocodage, par exemple), ce texte doit changer avant.

### 7.6 Photos d'enfants et photos sensibles
- Une galerie contient des photos d'enfants, de papiers d'identité, de personnes qui n'ont rien demandé. Ces photos ne quittent pas l'appareil à l'import.
- Les captures d'écran sont mises de côté par défaut (souvent des billets, des cartes bancaires, des conversations).
- Au partage (phase 3) : écran de vérification qui montre chaque photo qui va partir, en grand, avec « Retirer cette photo » sur chacune. Texte : « Ces photos seront visibles par les gens du Cercle. Vérifie qu'on n'y reconnaît personne qui n'est pas d'accord. » Aucune photo importée n'est cochée pour le partage par défaut.
- Choisir les photos d'une page à partager reste photo par photo. Pas de « partager tout le voyage » qui inclurait toutes les photos importées.

### 7.7 Nettoyage de l'EXIF au partage
- Toute photo qui part vers Supabase Storage est ré-encodée : JPEG (HEIC converti), orientation appliquée aux pixels, **toutes** les métadonnées retirées (EXIF, XMP, IPTC, GPS, miniature intégrée, profil d'appareil, MakerNotes). Seul le profil de couleur peut rester.
- Le fichier temporaire créé pour l'envoi est supprimé juste après, qu'il ait réussi ou non.
- Test bloquant : aucun fichier envoyé ne contient de bloc EXIF ou XMP (voir Tests).
- Si le nettoyage échoue, la photo ne part pas. Message : « On n'a pas pu préparer cette photo pour le partage. Elle n'a pas été envoyée. »

### 7.8 Sécurité physique
- Une sortie partagée avec des photos datées peut dire où et quand quelqu'un passe régulièrement. Au partage, la date affichée dans le Cercle est arrondie au mois (proposition, à trancher dans la spec Cercle).
- Les lieux d'une zone privée ne sont jamais proposés au partage.

### 7.9 Suppression et RGPD
- « Effacer les données d'import » dans Moi : supprime toutes les références, propositions, zones détectées et tâches d'import. Ne touche pas la galerie. Les lieux déjà validés restent découverts (le brouillard est une donnée à part), leurs pages perdent leurs photos importées. Texte de confirmation : « Tes photos restent dans ta galerie. Détour oublie lesquelles il avait rangées. Tes lieux découverts restent sur la carte. »
- Supprimer le compte ne change rien à ces données locales (elles ne sont pas sur le compte). Supprimer l'app les efface.
- Les données locales issues de l'EXIF sont des données personnelles (position). Base légale : elles ne quittent pas l'appareil, mais la politique de confidentialité doit les mentionner (lecture de la position des photos, stockage local, pas d'envoi).
- Retrait de la permission dans les réglages : Détour arrête toute lecture, garde les références (inutiles sans accès) et affiche les pages avec « Photo non accessible ». L'utilisateur peut tout effacer depuis Moi.

## 8. Edge cases

1. **Photo sans GPS.** Rangée dans « À trier » du voyage, groupe « Sans position ». Si une photo placée existe à moins de 30 minutes avant ou après, suggestion « Peut-être au même endroit ? ». Sinon, placement à la main. Jamais proposée seule comme lieu.
2. **Toutes les photos sans GPS** (position désactivée dans l'appareil photo, ou `ACCESS_MEDIA_LOCATION` refusée sur Android). E4 affiche « Aucune de ces photos n'a de position. » et explique la cause probable selon la plateforme. Les photos sont rangées, aucune proposition, accès direct à E7.
3. **GPS faux** (0,0 ; point isolé à 300 km/h ; précision supérieure à 100 m). Groupe « Position douteuse » dans E7, pas de proposition. La photo n'apparaît pas sur la carte.
4. **GPS du domicile.** Si une zone privée le couvre : aucune proposition, raison affichée. Sinon, la détection du logement (règle 17) pose la question avant de proposer. Si l'utilisateur répond « Non, c'est un lieu », les propositions apparaissent normalement.
5. **Photos hors de Helsinki.** Comptées dans E4, pas rangées par défaut, jamais proposées. Option « Les garder dans le carnet du voyage ». Si toutes sont hors de Helsinki : « Ces photos ont été prises hors de Helsinki. Détour ne couvre que Helsinki pour l'instant. » et rien n'est créé (pas de voyage vide).
6. **Photos à la frontière du périmètre** (Espoo, Vantaa, îles). Même règle : dans le polygone ou non. Une proposition dont le centre est dans Helsinki mais dont certaines photos sont juste à côté reste une proposition.
7. **Doublons** (même photo reçue par messagerie, enregistrée deux fois). Mis de côté avec raison « Doublon », un seul gardé. La liste des mis de côté permet de remettre un doublon (« Garder aussi celle-ci »).
8. **Doublons sans EXIF** (photos reçues par messagerie, EXIF retiré par l'app de messagerie). Pas de position, pas de date fiable : traités comme « Sans position ». Pas de détection de doublon par le contenu.
9. **Retouches.** Retouche dans Photos (même identifiant) : version retouchée affichée, une seule entrée. Copie exportée : doublon, la plus récente montrée en premier. Photo recadrée qui a perdu son EXIF : sans position.
10. **Photo dans iCloud non téléchargée.** Date et position lues depuis les métadonnées de la photothèque, sans téléchargement. Miniature demandée au système avec accès réseau autorisé. Si pas de réseau : cadre papier « Photo dans iCloud » à la place de la vignette, la proposition reste valable.
11. **Photo seulement dans Google Photos (pas sur l'appareil).** Invisible pour Détour (elle n'est pas dans la galerie de l'appareil). La feuille d'aide le dit : « Les photos qui sont seulement dans Google Photos, pas sur ton téléphone, n'apparaissent pas. Télécharge-les d'abord. » À vérifier selon l'appareil (voir Hypothèses).
12. **« Optimiser le stockage » activé sur iOS, téléchargement impossible** (iCloud plein, hors ligne pendant longtemps). L'import se fait sur les métadonnées. Le polaroïd du lieu affiche la miniature système si disponible, sinon le cadre « Photo dans iCloud ». Aucun téléchargement de l'original n'est déclenché par Détour.
13. **Accès limité qui change entre deux ouvertures** (l'utilisateur retire ou ajoute des photos). À chaque ouverture de l'app (et au retour au premier plan), contrôle des références du dernier import et des pages visibles. Photos retirées de l'accès : état `no_access`, page avec « Photo non accessible », bandeau sur le voyage : « Détour ne voit plus 12 photos de ce voyage. » avec « Choisir d'autres photos ». Rien n'est supprimé. Les lieux restent découverts. Photos ajoutées : pas d'import automatique ; le voyage propose « 8 nouvelles photos de ces dates. Les ranger ? »
14. **Passage de l'accès complet à l'accès limité.** Même comportement que le cas 13, appliqué à toutes les références.
15. **Permission refusée puis accordée dans les réglages.** Au retour dans l'app, relecture de la permission. Si l'utilisateur était dans le flux d'import, reprise à E1 avec les choix déjà faits. S'il n'y était plus, rien ne se lance tout seul.
16. **Permission refusée à la première demande.** E0 en mode refusé avec « Ouvrir les réglages ». Pas de nouvelle demande système (iOS ne la réaffiche pas, Android peut la bloquer).
17. **Permission retirée pendant la lecture.** La lecture s'arrête proprement, l'import passe en `paused`, message « Détour n'a plus accès à tes photos. » avec « Ouvrir les réglages ».
18. **Galerie de dizaines de milliers de photos.** Jamais de lecture de toute la galerie. Requête par album ou par dates, par pages de 200 éléments, lecture EXIF seulement pour les éléments retenus. Le compteur de E1 se base sur une requête de comptage. Au-delà de 3 000 photos dans la sélection : « C'est beaucoup de photos. Choisis une période plus courte, ou continue : ça peut prendre quelques minutes. » Pas de limite dure (à confirmer par les tests de performance).
19. **Album qui couvre des années.** Le nouveau voyage prendrait des années : message « Cet album couvre 2019 à 2026. Tu veux un voyage pour tout ça, ou ranger les photos sans voyage ? » Choix : « Un seul voyage » / « Sans voyage » / « Choisir des dates ».
20. **Vidéos, rafales, captures d'écran, enregistrements d'écran.** Mis de côté avec raison. Rafales : seule la photo clé (choisie par l'utilisateur dans Photos ou désignée par le système) est gardée. Captures sur Android sans sous-type fiable : repérées par absence de données appareil photo et dossier « Screenshots » (heuristique à valider).
21. **Fuseaux horaires.** Photo avec décalage dans l'EXIF : date convertie correctement. Sans décalage : lue en heure de Helsinki. Photo prise juste après minuit : comptée dans le bon jour de Helsinki. Changement d'heure (fin octobre) : pas de groupe coupé à tort ni fusionné à tort sur l'heure en double.
22. **Date fausse** (horloge d'un appareil photo réglée en 2015, ou à l'heure d'un autre pays). Si l'horodatage GPS existe et diffère, il fait foi. Sans GPS, la date de la photo est utilisée telle quelle ; dans un import par dates, la photo peut ne pas être trouvée, et la feuille d'aide propose « Essaie par album ». Date avant 2000 ou future : « Date inconnue ».
23. **Plage de dates qui chevauche un autre voyage.** Avant de lancer : « Ces dates touchent ton voyage "Été à Suomenlinna" (2 au 6 août). » Choix : « Ajouter à ce voyage » (principal) / « Raccourcir les dates » (ouvre les champs avec la partie libre préremplie). Pas de voyage qui chevauche dans cette version.
24. **Photo déjà importée dans un autre voyage.** Ignorée par défaut, comptée dans E4. La liste permet « Déplacer ici » sauf si la photo est le polaroïd d'un lieu déjà validé (le lieu reste dans son voyage d'origine, règle globale).
25. **Photo déjà prise avec l'appareil photo de Détour** (si l'appareil photo de Détour enregistre aussi dans la galerie). Repérée comme déjà connue (identifiant ou date et position identiques), mise de côté avec raison « Déjà dans ton carnet ».
26. **Lieu déjà découvert.** Proposition « Ajouter les photos à sa page ». Aucun changement de numéro, de date de découverte ou de voyage. Le brouillard ne bouge pas.
27. **Lieu découvert entre l'import et la validation** (l'utilisateur valide le lieu avec l'appareil photo pendant que la proposition attend). Au moment d'ouvrir E5, la proposition passe en « Déjà découvert ». Si E5 est déjà ouvert, la validation ignore ce lieu et le bandeau dit « 8 lieux découverts. Kauppatori l'était déjà, tes photos sont sur sa page. »
28. **Deux propositions du même import sur le même lieu.** Fusionnées (règle 5).
29. **Photo supprimée de la galerie après import.** Référence `missing`. Sur la page : « Photo partie de ta galerie », avec « Choisir une autre photo » ou « Retirer de la page ». Le lieu reste découvert. Si c'était une photo en attente, elle disparaît de la proposition ; une proposition qui n'a plus de photo est retirée.
30. **Photo supprimée puis restaurée depuis « Supprimés récemment ».** Même identifiant sur iOS : la référence redevient `available` au contrôle suivant. Sur Android, l'identifiant peut changer : la photo reste perdue pour Détour (à vérifier).
31. **Import interrompu (app tuée, téléphone éteint, plantage).** L'état de l'import et le curseur sont écrits après chaque page de 200. À la réouverture : « L'import de "Balade du 3 au 7 août" s'est arrêté à 340 sur 812. » Boutons « Reprendre » (principal) / « Annuler l'import ». Reprendre ne recrée pas les références déjà lues (unicité sur `asset_id`).
32. **App tuée pendant une validation par lot.** La validation est une transaction locale : à la réouverture, soit les 9 lieux sont découverts, soit aucun. Jamais un état partiel.
33. **App mise en arrière-plan pendant la lecture.** La lecture continue tant que le système le permet, sinon elle se met en pause et reprend au retour au premier plan sans rien demander.
34. **Espace disque faible.** Détour ne copie pas de photos, l'import prend peu de place (métadonnées). Avant de lancer, si l'espace libre est sous 100 Mo : « Ton téléphone est presque plein. L'import peut échouer. » Boutons « Lancer quand même » / « Annuler ». Si une écriture échoue en cours : pause propre, même message, reprise possible.
35. **Live Photos.** Image fixe seulement. La date et la position sont celles de l'image fixe.
36. **HEIC et HEIF.** Lus et affichés par le système. Au partage, convertis en JPEG sans métadonnées. Sur un Android qui ne décode pas le HEIC : vignette remplacée par le cadre « Format non lu par ton téléphone », la photo reste utilisable pour sa date et sa position.
37. **Orientation.** L'orientation EXIF (valeurs 1 à 8) est respectée partout : vignettes, polaroïd, E6. Une photo prise en portrait n'apparaît jamais couchée. Au partage, la rotation est appliquée aux pixels avant de retirer l'EXIF.
38. **Photos prises à plusieurs** (photos d'un ami reçues par AirDrop, avec sa position et sa date). Traitées comme les autres. Si elles sont arrivées dans la galerie sans EXIF, elles sont « Sans position ».
39. **Album partagé iCloud ou album d'une autre app.** Affiché seulement si le système le donne comme album lisible. Les photos d'un album partagé iCloud ont souvent perdu leur position : elles vont dans « Sans position ».
40. **Plage de dates vide** (aucune photo). E1 affiche « Aucune photo dans cette période » et le bouton « Continuer » est désactivé.
41. **Rien à proposer** (toutes les photos sont sans position, hors de Helsinki, dans une zone privée). E4 le dit, ligne par ligne, et le bouton principal devient « Voir les photos à trier ».
42. **Voyage cible supprimé pendant que des propositions attendent.** Les propositions de ce voyage sont supprimées, les photos rangées retournent à « aucun voyage » (références gardées seulement si elles sont sur une page de lieu).
43. **Deux imports lancés en même temps.** Un seul import à la fois. Le second affiche « Un import est déjà en cours. » avec « Voir l'import en cours ».
44. **Lecteur d'écran sur E5 avec 60 propositions.** Navigation par en-têtes de jour, chaque carte lue en une phrase, le bouton de validation annonce le nombre de lieux cochés à chaque changement.
45. **Réduire les animations actif.** Les trous du brouillard apparaissent ouverts d'un coup, la barre de progression ne s'anime pas.
46. **Mode sombre.** Les repères pointillés `ink` et le bandeau `postal` gardent un contraste de 4,5:1 sur le fond sombre.
47. **Changement de langue ou de région du téléphone.** Les jours et dates restent en français dans l'app, mais le calcul des jours se fait toujours en heure de Helsinki.

## 9. Tests

### 9.1 Unitaires
1. **Date de référence.** EXIF avec `OffsetTimeOriginal` +03:00 à 00:30 : jour = celui de Helsinki, UTC = veille 21:30. Sans décalage, 2026-10-25 03:30 (heure en double) : interprété sans erreur, groupes non cassés.
2. **GPS contre EXIF.** Date EXIF 2015, horodatage GPS 2026 : la date retenue est celle du GPS, `taken_at_source = gps`.
3. **Date invalide.** 1970-01-01 et 2030-01-01 : « Date inconnue ».
4. **Regroupement.** 10 photos à 50 m sur 1 h : 1 groupe. Deux paquets à 300 m l'un de l'autre : 2 groupes. Mêmes positions à 5 h d'écart : 2 groupes. Chaîne de photos tous les 80 m sur 1 km : 1 groupe qui se prolonge (vérifier que c'est voulu, sinon couper au-delà de 300 m d'étendue).
5. **Lieu candidat.** Centre à 40 m d'un lieu : proposé. À 120 m : « Ou bien » seulement. À 200 m : « Endroit sans nom ».
6. **Positions douteuses.** (0,0), lat 91, précision 250 m, point à 50 km entre deux photos à 2 min d'écart : `doubtful`.
7. **Helsinki.** Points dans Helsinki, à Espoo, sur Suomenlinna, à Tallinn : classement conforme au polygone.
8. **Zones privées.** Point à 150 m d'une zone de 200 m : exclu. À 250 m : proposé.
9. **Détection du logement.** Photos à 23 h sur 2 nuits dans la même zone : question posée. Sur 1 nuit : pas de question.
10. **Doublons.** Même seconde, même position, mêmes dimensions : doublon. Même seconde, dimensions différentes : pas doublon.
11. **Chevauchement de voyages.** 3 au 7 août contre 7 au 9 août : chevauchement (bornes incluses). 3 au 6 contre 7 au 9 : pas de chevauchement.
12. **Lieu déjà découvert.** Proposition sur un lieu découvert : `kind = add_to_existing`, la validation ne crée pas de seconde découverte, numéro et date inchangés.
13. **Atomicité.** Lot de 9 avec une erreur simulée sur le 6e : aucun des 9 n'est découvert.

### 9.2 Intégration
1. **Lecture galerie simulée** (module galerie bouchonné) : 812 éléments dont 30 vidéos, 15 captures, 2 rafales de 10 : 812 lus, 30 + 15 + 18 mis de côté avec la bonne raison.
2. **Reprise.** Tuer le processus après la page 2 : à la relance, curseur à 400, aucune référence en double.
3. **Accès limité.** Permission `limited` avec 20 photos visibles : l'import ne voit que les 20, aucune erreur, aucune invite vers l'accès complet.
4. **Changement d'accès.** Retirer 5 photos de l'accès limité entre deux lancements : 5 références `no_access`, lieux toujours découverts, bandeau affiché.
5. **Photo supprimée.** Supprimer la photo de couverture d'un lieu : page avec « Photo partie de ta galerie », brouillard inchangé.
6. **Permission refusée puis accordée** : retour au premier plan avec `granted`, reprise à E1 avec les choix gardés.
7. **Android sans `ACCESS_MEDIA_LOCATION`** : toutes les photos `missing`, message dédié en E4.
8. **Aucun appel réseau.** Intercepteur réseau sur le client Supabase et sur `fetch` : un import complet de 500 photos plus une validation de 10 lieux produisent zéro requête.
9. **Effacer les données d'import** : toutes les tables locales de l'import vides, lieux découverts toujours présents, galerie intacte (même nombre d'éléments avant et après).
10. **Nettoyage EXIF au partage** (dès que le partage existe) : pour un JPEG avec GPS, un HEIC avec GPS, une Live Photo, une photo orientation 6 : le fichier envoyé est un JPEG sans segment APP1 EXIF ni XMP, orientation appliquée, et le fichier temporaire est supprimé.

### 9.3 Bout en bout (sur appareil ou simulateur avec galerie préparée)
1. **Chemin principal.** Galerie de test avec une balade de 3 h à Helsinki (60 photos, 5 lieux) : import par dates, nouveau voyage, E5 montre 5 propositions non cochées, cocher 4, valider : 4 trous sur la carte filtrée, 4 pages numérotées, 1 proposition reste en attente.
2. **Annuler.** Valider 3 lieux puis « Annuler » dans les 10 s : trous refermés, 3 propositions de nouveau en attente.
3. **Import par album sur voyage existant** : aucune étape E2, lieux rattachés au voyage existant.
4. **Chevauchement** : message et « Ajouter à ce voyage » fonctionnent.
5. **Photos sans position** : placer 3 photos sur un lieu depuis E7, valider : lieu découvert.
6. **Zone privée** : définir une zone, importer des photos prises dedans : aucune proposition, raison affichée.

### 9.4 Accessibilité
1. VoiceOver et TalkBack sur E0 à E7 : chaque contrôle a un libellé ; l'ordre de lecture suit l'ordre visuel ; les vignettes décoratives sont ignorées.
2. E5 : une carte se lit « Kaivopuisto, 14 photos, de 14 h 10 à 15 h 02, non coché » ; cocher annonce « coché » ; le bouton annonce « Valider 9 lieux ».
3. Toutes les cibles tactiles mesurent 44 px ou plus (vérification automatique sur les composants du flux).
4. Contraste 4,5:1 sur tous les textes, en clair et en sombre, y compris le bandeau `postal` et les étiquettes « GALERIE » et « HORS CARTE ».
5. Aucun état porté par la seule couleur : repère « à valider » (pointillé + texte), case cochée (coche + annonce), lieu déjà découvert (tampon texte).
6. Réduire les animations : aucune animation dans le flux.
7. Texte agrandi (taille système maximale) : E5 reste utilisable, rien n'est coupé.

### 9.5 Performance
1. Galerie de 50 000 photos sur un Android d'entrée de gamme (à définir, par exemple 4 Go de RAM) : compteur de E1 en moins de 1 s ; import de 2 000 photos en moins de 2 minutes ; mémoire de l'app sous 300 Mo ; aucun gel de l'interface de plus de 100 ms.
2. Même test sur un iPhone de 4 ans avec iCloud « Optimiser le stockage » et 30 000 photos.
3. E5 avec 200 propositions : défilement fluide, ouverture en moins de 500 ms.
4. Contrôle des références à l'ouverture sur 5 000 références : en arrière-plan, sans retarder l'affichage de la carte.

### 9.6 Tests terrain
1. Balade réelle de 2 h dans le centre (Kauppatori, Esplanadi, Kaivopuisto), photos avec l'appareil photo natif, import le soir : comparer les propositions aux lieux réellement visités. Cible : au moins 80 % des lieux visités proposés, moins de 10 % de propositions fausses.
2. Même balade avec un deuxième téléphone, position désactivée pour l'appareil photo : comportement « sans position » correct.
3. Photos prises dans le métro et sous les toits du centre (GPS dégradé) : positions douteuses bien écartées.
4. Import depuis chez soi (photos du domicile dans la sélection) : la question sur le logement apparaît.
5. Photos sur Suomenlinna et à la limite Espoo : classement Helsinki correct.
6. Téléphone en mode avion pendant tout l'import et la validation : tout fonctionne (sauf vignettes iCloud), aucune erreur.
7. Test avec un proxy réseau sur le téléphone pendant import et validation : aucune requête de Détour.

## 10. Critères d'acceptation

- [ ] On peut importer par album ou par plage de dates, sur iOS et Android.
- [ ] L'accès limité (iOS) et l'accès partiel (Android 14+) suffisent pour tout le flux.
- [ ] L'écran d'explication s'affiche avant la demande système et dit vrai sur ce qui est lu.
- [ ] Permission refusée : bouton vers les réglages, reprise du flux au retour si accordée.
- [ ] Aucune proposition n'est cochée par défaut. Aucun lieu n'est découvert sans geste de l'utilisateur.
- [ ] La validation par lot est atomique et annulable pendant 10 secondes.
- [ ] Le brouillard ne se lève que sur les lieux validés, en 450 ms maximum, et saute à l'état final avec « réduire les animations ».
- [ ] Un lieu déjà découvert n'est jamais redécouvert : ni nouveau numéro, ni nouvelle date, ni changement de voyage.
- [ ] Un voyage peut être créé après coup sur une plage de dates ; un chevauchement est signalé avant création.
- [ ] Les photos sans position, à position douteuse, hors de Helsinki, dans une zone privée ne sont jamais proposées comme lieux.
- [ ] Vidéos, captures d'écran, rafales (hors photo clé) et doublons sont mis de côté avec leur raison, et récupérables.
- [ ] Les zones privées existent et bloquent les propositions ; la détection du logement demande avant de proposer.
- [ ] Détour ne garde aucune copie persistante des photos ; seules des références et des métadonnées sont stockées.
- [ ] Aucune requête réseau de Détour pendant l'import et la validation (test d'interception passé).
- [ ] Une photo supprimée ou devenue inaccessible n'efface ni le lieu ni le brouillard, et la page le dit.
- [ ] Un import interrompu reprend là où il s'était arrêté, sans doublon.
- [ ] Les dates sont correctes en heure de Helsinki, y compris autour de minuit et du changement d'heure.
- [ ] HEIC, Live Photos et orientation EXIF s'affichent correctement.
- [ ] Une galerie de 50 000 photos ne bloque pas l'app (critères de 9.5 tenus).
- [ ] « Effacer les données d'import » vide les données locales de l'import sans toucher la galerie ni les lieux découverts.
- [ ] Le nettoyage EXIF au partage est implémenté et testé avant l'ouverture du partage des photos importées.
- [ ] Tous les écrans du flux respectent les tokens, le mode sombre, une seule action `stamp`, les cibles de 44 px et le contraste 4,5:1.
- [ ] Les textes d'interface sont en français, au tutoiement, sans tiret cadratin.

## 11. Hypothèses à vérifier

1. L'app utilise `expo-media-library` (ou peut l'utiliser) pour la galerie. À vérifier : lecture de l'EXIF et de la position par élément, filtre par date de création, pagination, sous-types (capture, Live Photo, rafale), état « dans le cloud », gestion de l'accès limité iOS et partiel Android, option `isAccessMediaLocationEnabled`.
2. La config Expo permet de régler le texte `NSPhotoLibraryUsageDescription`, la clé `PHPhotoLibraryPreventAutomaticLimitedAccessAlert` et les permissions Android listées en 7.2, sans module natif maison. Sinon, un config plugin ou un module natif est à prévoir.
3. La politique Google Play sur les permissions photos accepte `READ_MEDIA_IMAGES` pour cette fonction. Si elle exige le sélecteur photo Android, vérifier qu'il donne une référence durable (permission persistante sur l'URI) et qu'il ne retire pas la position de l'EXIF. Si l'un des deux manque, la feature est à repenser sur Android.
4. Il existe un référentiel des lieux de Helsinki avec coordonnées (et peut-être une zone par lieu). Les règles 10 et 12 en dépendent. Si un lieu peut être n'importe quel point choisi par l'utilisateur, la proposition devient « nouveau lieu ici » et la règle « un lieu une seule fois » doit être redéfinie (à quelle distance deux lieux sont-ils le même ?).
5. Le périmètre de Helsinki utilisé pour la carte est disponible dans l'app sous forme de polygone réutilisable.
6. Le stockage local existant (SQLite ou autre) supporte les transactions nécessaires à la validation atomique et à la reprise d'import.
7. Les pages de lieu validées à l'appareil photo stockent aujourd'hui la photo d'une certaine façon (fichier dans l'app ? dans la galerie ?). La page doit pouvoir afficher soit ce stockage, soit une référence galerie.
8. L'appareil photo de Détour enregistre ou non une copie dans la galerie (cas 25).
9. Les pins photo (phase 1) acceptent un style « à valider » distinct, sans lever le brouillard.
10. Le brouillard est calculé à partir des lieux découverts et sait ouvrir plusieurs trous à la fois en 450 ms sans chute de fluidité.
11. Un utilisateur peut déjà retirer un lieu découvert de son carnet (règle 3). Si non, l'annulation de 10 s est la seule façon de revenir en arrière.
12. Il existe ou non une télémétrie et des journaux d'erreur distants (Sentry ou autre). Si oui, il faut un filtre qui empêche coordonnées, identifiants de photo et dates d'y passer.
13. Le suivi de trajet local n'a pas de données pour un voyage créé après coup, et l'absence de trajet ne casse pas l'affichage du voyage.
14. Sur iOS, les métadonnées (date, position) d'une photo seulement dans iCloud sont lisibles sans télécharger l'original.
15. Sur Android, une photo restaurée depuis la corbeille garde ou non son identifiant MediaStore (cas 30). Et les photos seulement dans Google Photos n'apparaissent pas dans MediaStore sur les appareils visés (cas 11).
16. Le ré-encodage JPEG sans métadonnées au partage est faisable avec les outils de l'app (par exemple `expo-image-manipulator`), et le résultat ne garde vraiment aucun bloc EXIF ou XMP.
17. La lecture peut continuer un peu en arrière-plan sur iOS et Android avec Expo, ou seulement au premier plan (cas 33).

## 12. Questions ouvertes

1. **Numéro de tampon des lieux importés.** Dans l'ordre de validation (stable, mais un lieu d'août peut avoir un numéro plus grand qu'un lieu d'octobre) ou dans l'ordre des dates de photo (cohérent, mais oblige à renuméroter) ? Proposition : ordre de validation, jamais renuméroté.
2. **Date de découverte.** Date de la photo ou date de validation ? Proposition : date de la photo affichée, date de validation gardée. À vérifier avec le bilan de voyage.
3. **Voyages qui se chevauchent.** Interdit dans cette version. Faut-il un jour des voyages imbriqués (un week-end dans un été) ? Ça touche le rattachement d'un lieu à un seul voyage.
4. **Lieu déjà découvert avant, photos d'avant.** Si un lieu a été découvert en octobre et qu'on importe des photos d'août du même lieu, garde-t-on octobre comme date de découverte ? Proposition : oui, la découverte ne bouge jamais.
5. **Placement manuel.** Un lieu placé à la main (photo sans GPS) vaut-il une découverte comme les autres, ou faut-il le distinguer (et le montrer autrement dans le Cercle) ?
6. **Photos hors de Helsinki.** Les garder dans le carnet par défaut ou non ? Proposition : non par défaut, pour ne pas remplir le carnet de choses que la carte ne montre pas.
7. **Cache de miniatures.** Accepte-t-on un cache disque de miniatures dans le dossier cache (rapide, mais c'est une copie réduite) ? Si oui, le texte « Détour ne les copie pas » doit devenir plus précis.
8. **Date affichée dans le Cercle** pour une photo importée : au jour, au mois, ou pas du tout ? À trancher dans la spec Cercle, mais la décision touche la sécurité physique.
9. **Notification à la fin de l'import.** Faut-il une notification système quand l'import est long ? Elle demande une permission de plus.
10. **Point d'entrée depuis la Carte ou l'appareil photo.** Utile pour la découverte de la feature, mais la Carte a déjà son action principale.
11. **Taille des groupes et seuils** (100 m, 2 h, 75 m, 300 km/h, 2 nuits). À régler après les tests terrain.
12. **Vidéos.** Les exclure toujours, ou les ranger dans le carnet sans proposition dans une version suivante ?
13. **Import automatique des nouvelles photos** pendant un voyage en cours (sans action) : hors périmètre ici, et contraire à « l'app propose, ne valide pas ». À garder hors de la feuille de route ou à étudier à part ?

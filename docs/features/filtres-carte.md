# Filtres d'affichage de la carte : spec

Brouillon du 8 nov 2026, à relire

## 1. Résumé

La carte principale de Détour montre tout ce que l'utilisateur a découvert. Cette feature ajoute un panneau unique, « Filtres », qui permet de n'afficher qu'une partie de la carte : un ou plusieurs voyages, certains jours, une période. Le même panneau gère la couleur par jour : soit un dégradé du plus ancien au plus récent, soit une couleur par jour sur une courte période (7 jours maximum).

Le filtre ne supprime rien. Il change seulement l'affichage. Sous filtre, le brouillard n'est levé qu'autour des lieux retenus, le reste de la carte redevient papier vierge. Dès qu'on retire le filtre, tout revient.

La couleur ne porte jamais seule l'information : chaque pin porte le numéro du jour, chaque trajet porte un motif de trait et un repère de date. La palette se limite aux tokens `stamp`, `postal`, `sage` et `lantern`.

## 2. Objectif et utilisateur

**Utilisateur visé.** Quelqu'un qui utilise Détour depuis quelques semaines ou mois à Helsinki. Sa carte commence à être bien découverte. Il a démarré quelques voyages (un week-end à Suomenlinna, une semaine de vacances, des balades du dimanche) et veut revoir l'un d'eux sans le bruit du reste.

**Ce qu'il veut faire.**
- Revoir « ma semaine de vacances » seule sur la carte, comme une page de carnet.
- Comparer deux voyages côte à côte (mode superposé).
- Voir dans quel ordre il a découvert les lieux d'un week-end (une couleur par jour).
- Voir comment sa carte s'est remplie avec le temps (dégradé).
- Revenir à la carte complète en un geste.

**Ce qu'on veut éviter.**
- Qu'il croie avoir perdu des découvertes parce qu'un filtre est resté actif.
- Qu'une info ne soit lisible que par la couleur (daltonisme, plein soleil, mode sombre).
- Un écran de réglages compliqué. Un seul panneau, des choix courts, des valeurs par défaut sensées.

**Mesure de réussite.** L'utilisateur trouve et applique un filtre voyage en moins de 3 taps depuis la carte. Il identifie toujours qu'un filtre est actif sans ouvrir le panneau. Personne ne signale « j'ai perdu mes lieux » à cause d'un filtre.

## 3. Comportement détaillé

### 3.1 Point d'entrée sur la carte

- Sur l'écran Carte, une pastille de filtre (44 px de haut minimum, Special Elite, contour 2 px `ink`) en haut de l'écran, sous la barre d'état.
- Texte de la pastille :
  - Aucun filtre : « Filtres »
  - Filtre actif : « Filtres · 2 » (nombre de critères actifs : voyages, période, jours, couleur comptent chacun pour 1).
- `accessibilityLabel` : « Filtres de la carte, aucun filtre actif » ou « Filtres de la carte, 2 filtres actifs ».
- La pastille n'est pas tournée (élément interactif, pas de rotation).
- Elle n'est pas l'action principale de l'écran. Le bouton `stamp` de la Carte reste celui qui existe déjà (hypothèse : l'appareil photo). La pastille filtre a le style secondaire.

### 3.2 Bandeau « filtre actif »

Quand au moins un critère de filtre est actif (voyage, période, jour), un bandeau papier s'affiche sous la pastille, en permanence, tant que le filtre est actif.

- Texte, selon le cas :
  - Un voyage : « Tu vois : Week-end à Suomenlinna »
  - Plusieurs voyages : « Tu vois : 3 voyages »
  - Période : « Tu vois : du 3 au 9 nov. »
  - Voyage et jours : « Tu vois : Vacances d'automne, 2 jours »
  - Lieux hors voyage : « Tu vois : lieux hors voyage »
- Sous-texte en `muted`, DM Sans : « 12 lieux affichés sur 148. Le reste est juste masqué. »
- À droite, bouton secondaire « Tout voir » (contour 2 px `ink`, 44 px). Il retire tous les critères de filtre en un tap. La couleur par jour, elle, reste si elle était choisie (ce n'est pas un filtre, c'est un mode d'affichage).
- Le bandeau est lu par les lecteurs d'écran : « Filtre actif. Tu vois Week-end à Suomenlinna. 12 lieux affichés sur 148. »
- Si seule la couleur est active (aucun filtre), pas de bandeau, mais la légende (3.6) est visible.

### 3.3 Le panneau « Filtres »

Ouverture : tap sur la pastille. Le panneau monte depuis le bas (feuille papier), à mi-hauteur par défaut, extensible à pleine hauteur en le tirant. La carte reste visible derrière à mi-hauteur et se met à jour en direct.

Transition d'ouverture : 300 ms, sans rebond. Si « réduire les animations » est actif, le panneau apparaît directement.

Contenu, de haut en bas :

**En-tête**
- Titre en Fraunces italique 700 : « Ce que tu vois »
- Phrase courte en DM Sans, `muted` : « Le filtre change seulement l'affichage. Rien n'est effacé. »

**Section « Voyages »** (Special Elite pour le titre de section)
- Liste de lignes cochables, 44 px minimum chacune. Chaque ligne : nom du voyage, dates (« 3 au 9 nov. »), nombre de lieux (« 14 lieux »).
- Ordre : le voyage en cours d'abord, marqué « en cours » (texte, pas seulement une couleur), puis les autres du plus récent au plus ancien.
- Dernière ligne fixe : « Lieux hors voyage » avec son nombre de lieux.
- Choix multiple. Cocher deux voyages ou plus = mode superposé.
- Aucun voyage coché = tous les lieux (comportement par défaut). La ligne du haut « Tous les lieux » est cochée dans ce cas. La cocher décoche le reste.
- Au-delà de 8 voyages : un champ de recherche apparaît au-dessus de la liste, avec libellé visible « Chercher un voyage ». La liste montre les 8 plus récents puis « Voir les 23 autres ».
- Un voyage sans aucun lieu reste listé, grisé en `muted`, avec « aucun lieu pour l'instant ». Il reste cochable (il peut avoir un trajet).

**Section « Période »**
- Pastilles de filtre (44 px) à choix unique : « Tout », « Aujourd'hui », « 7 derniers jours », « Ce mois-ci », « Choisir… »
- « Choisir… » ouvre deux champs avec libellés visibles « Du » et « Au », sélecteur de date natif.
- Les périodes relatives (« 7 derniers jours », « Ce mois-ci ») restent relatives : demain, « 7 derniers jours » glisse d'un jour.
- La période se combine avec les voyages (ET logique) : « Vacances d'automne » + « 7 derniers jours » = les lieux de ce voyage découverts ces 7 derniers jours.

**Section « Jours »**
- Visible seulement quand la sélection courante (voyages + période) contient 31 jours ou moins avec du contenu. Au-delà, texte en `muted` : « Choisis un voyage ou une période plus courte pour filtrer par jour. »
- Liste des jours qui ont au moins un lieu ou un trajet dans la sélection. Une ligne par jour : « mar. 12 nov. », nombre de lieux (« 4 lieux » ou « trajet seulement »).
- Choix multiple. Aucun jour coché = tous les jours de la sélection.
- Les jours sans lieu ni trajet ne sont pas listés.

**Section « Couleur »**
- Pastilles à choix unique :
  - « Aucune » (par défaut) : affichage normal de la charte (lieux révélés en `lantern`, trajets en pointillé `stamp`).
  - « Un jour, une couleur » : disponible si la sélection compte 7 jours ou moins avec du contenu.
  - « Du plus ancien au plus récent » : toujours disponible dès qu'il y a au moins 2 jours avec du contenu.
- Si « Un jour, une couleur » n'est pas disponible, la pastille reste visible mais désactivée, avec une phrase dessous : « Une couleur par jour marche jusqu'à 7 jours. Ici tu en as 12. Essaie « Du plus ancien au plus récent » ou choisis moins de jours. »
- Aperçu de la légende juste sous les pastilles (même contenu que 3.6).

**Pied du panneau**
- Bouton principal `stamp` : « Voir la carte » (ferme le panneau). C'est la seule action principale du panneau.
- Bouton secondaire : « Tout réinitialiser » (remet voyages à « Tous les lieux », période à « Tout », jours à aucun, couleur à « Aucune »). Pas de confirmation : rien n'est détruit et l'état précédent n'a pas de valeur à protéger.

Fermeture aussi par glissement vers le bas ou tap sur la carte. Fermer le panneau garde les choix faits (ils sont déjà appliqués en direct).

### 3.4 Effet du filtre sur la carte

- **Lieux** : seuls les lieux retenus par le filtre sont affichés (pins photo, ou repères numérotés tant que les pins photo ne sont pas livrés).
- **Brouillard** : il n'est levé qu'autour des lieux retenus. Les trous des autres lieux se referment, la zone redevient papier vierge hachuré sur `fog`. Transition : fondu de 300 ms maximum. Avec « réduire les animations », changement direct.
- **Trajets** : seuls les segments de trajet des jours et voyages retenus sont affichés.
- **Position utilisateur** : le point `postal` reste toujours affiché, filtre ou pas.
- **Cadrage** : à l'application d'un filtre depuis le panneau, la carte recadre pour montrer tous les lieux retenus (avec une marge). Si l'utilisateur a déplacé la carte à la main pendant que le panneau est ouvert, on ne recadre pas.
- Rien d'autre ne change : le carnet, l'écran Moi, les compteurs de découvertes, la liste des voyages ne sont pas filtrés.

### 3.5 Couleur par jour

**Règle générale.** Le mode couleur colore le contour du pin (ou du repère) et le trait du trajet. Le centre du pin reste la photo. La couleur ne remplace jamais les autres repères.

**Repères non colorés obligatoires**, dans les deux modes :
- Pin : une petite étiquette en Special Elite, texte `ink` sur `paperWhite`, accrochée au pin. Elle porte le numéro du jour (« 12 ») en mode « Un jour, une couleur », et la date courte (« 12/11 ») en mode dégradé.
- Trajet : un motif de trait par jour ou par palier, et une étiquette de date au départ de chaque segment de jour.

**Mode « Un jour, une couleur »** (7 jours maximum)
- Ordre d'attribution, du jour le plus ancien au plus récent, sur les jours qui ont du contenu seulement :

| Jour | Couleur | Motif du trajet |
|---|---|---|
| 1 | `stamp` | pointillé |
| 2 | `postal` | pointillé |
| 3 | `sage` | pointillé |
| 4 | `lantern` | pointillé |
| 5 | `stamp` | tirets longs |
| 6 | `postal` | tirets longs |
| 7 | `sage` | tirets longs |

- Les jours 5 à 7 réutilisent une couleur déjà prise. Ils restent distincts par le motif et par le numéro du jour.
- Le pointillé reste le motif par défaut pour rester fidèle à la charte (« pointillé de trajet `stamp` »).

**Mode « Du plus ancien au plus récent »**
- Comme la charte n'a pas de dégradé continu, on utilise 4 paliers ordonnés, du plus ancien au plus récent : `postal`, `sage`, `lantern`, `stamp`.
- Les jours qui ont du contenu sont répartis en 4 groupes de taille aussi égale que possible, dans l'ordre chronologique. Avec 4 jours ou moins, un palier par jour.
- Motif du trajet : trait plein pour le palier 1, tirets longs pour le 2, tirets courts pour le 3, pointillé pour le 4. Le plus récent garde le pointillé habituel.
- Les dates courtes sur les pins rendent l'ordre lisible sans la couleur.

### 3.6 Légende

Dès qu'un mode couleur est actif, une légende repliable apparaît en bas à gauche de la carte, au-dessus de la barre d'onglets.

- Repliée : pastille 44 px « Légende ».
- Dépliée : une ligne par jour ou par palier, avec pastille de couleur, échantillon de motif, et texte.
  - « 12 · mar. 12 nov. · 5 lieux »
  - « 3/11 au 5/11 · 9 lieux » (dégradé)
- Lecteur d'écran : chaque ligne est lue en texte complet, la pastille de couleur est décorative et cachée. Exemple : « Jour 12, mardi 12 novembre, 5 lieux, trait en pointillé. »

### 3.7 Écran vide expliqué

Si le filtre ne retient aucun lieu et aucun trajet :
- La carte montre tout le papier vierge (brouillard complet).
- Une carte papier au centre, non tournée (elle contient des boutons) :
  - Titre Fraunces : « Rien à montrer ici »
  - Texte, construit à partir des critères : « Aucun lieu dans « Vacances d'automne » entre le 1er et le 2 nov. »
  - Variante si le voyage est vide : « Tu n'as encore validé aucun lieu pendant « Balade de dimanche ». »
  - Variante période seule : « Tu n'as rien découvert ces 7 derniers jours. »
  - Bouton principal `stamp` : « Modifier les filtres » (ouvre le panneau).
  - Bouton secondaire : « Tout voir ».
- Dans le panneau, la même situation est annoncée en haut : « 0 lieu avec ces choix. »

### 3.8 Pin et accessibilité sur la carte

- Chaque pin a un `accessibilityLabel` complet : « Lieu 12, Café Regatta, mardi 12 novembre, voyage Vacances d'automne. »
- En mode couleur, rien de la couleur n'est lu. Le jour et la date sont lus.
- Le lecteur d'écran peut parcourir les lieux filtrés dans l'ordre chronologique.

### 3.9 Flux pas à pas

**Flux A : voir un seul voyage**
1. Carte, tap sur « Filtres ».
2. Le panneau s'ouvre à mi-hauteur.
3. Tap sur « Vacances d'automne ». La carte derrière se met à jour : seuls ses lieux restent révélés.
4. Tap sur « Voir la carte ». Le panneau se ferme, la carte recadre sur le voyage.
5. Le bandeau affiche « Tu vois : Vacances d'automne » et « 14 lieux affichés sur 148. Le reste est juste masqué. »
6. Tap sur « Tout voir » : tous les lieux et tout le brouillard levé reviennent.

**Flux B : superposer deux voyages**
1. Panneau ouvert, cocher « Week-end à Suomenlinna » et « Vacances d'automne ».
2. Les deux voyages s'affichent ensemble. Bandeau : « Tu vois : 2 voyages ».

**Flux C : une couleur par jour sur un week-end**
1. Panneau, cocher « Week-end à Suomenlinna » (3 jours).
2. Section Couleur, tap sur « Un jour, une couleur ».
3. Les pins prennent un contour par jour et une étiquette « 8 », « 9 », « 10 ». Les trajets prennent la couleur du jour.
4. « Voir la carte ». La légende apparaît, repliée.

**Flux D : voir sa carte se remplir**
1. Panneau, laisser « Tous les lieux », période « Tout ».
2. Couleur : « Du plus ancien au plus récent ».
3. Pins et trajets en 4 paliers, légende avec les plages de dates.
4. Pas de bandeau (aucun filtre), légende visible.

**Flux E : relancer l'app avec un filtre actif**
1. L'utilisateur avait laissé « Vacances d'automne » filtré et a fermé l'app.
2. Au lancement, la carte s'ouvre avec le filtre et le bandeau visible dès la première image.
3. Un tap sur « Tout voir » remet la carte complète.

## 4. Règles métier

1. **Le filtre est seulement de l'affichage.** Aucune action du panneau ne modifie, ne déplace ni ne supprime un lieu, un voyage, un trajet ou le brouillard enregistré.
2. **Combinaison des critères.** Voyages : OU entre eux. Puis ET avec la période. Puis ET avec les jours. Un lieu est affiché s'il passe les trois.
3. **Valeur vide = pas de restriction.** Aucun voyage coché = tous les lieux (y compris hors voyage). Période « Tout » = pas de borne. Aucun jour coché = tous les jours de la sélection.
4. **Lieux hors voyage.** Ils forment un groupe « Lieux hors voyage » qu'on peut cocher comme un voyage.
5. **Jour d'un lieu.** Un lieu appartient au jour local de l'endroit et du moment où il a été validé : date de validation + décalage horaire enregistré au moment de la validation. Le jour change à minuit heure locale.
6. **Jour d'un trajet.** Un segment de trajet qui passe minuit est coupé en deux à minuit heure locale. Chaque partie appartient à son jour.
7. **Date d'un lieu, ordre de priorité.** 1) date de validation si valide ; 2) sinon date d'enregistrement du lieu sur l'appareil si valide ; 3) sinon le lieu est « sans date ».
8. **Date invalide.** Une date est invalide si elle est dans le futur de plus de 24 h par rapport à l'heure de l'appareil, ou antérieure à la première installation de Détour sur l'appareil (pour la phase 1, où tous les lieux sont validés dans l'app). En phase 2 (import galerie), la borne basse sera revue.
9. **Lieux sans date.** Affichés quand aucun filtre de période ni de jour n'est actif. Masqués dès qu'une période ou un jour est choisi. Le panneau l'indique : « 3 lieux sans date ne sont pas affichés avec une période. » En mode couleur, ils gardent l'affichage normal (`lantern`, sans étiquette de jour) et la légende ajoute « Sans date · 3 lieux ».
10. **Brouillard sous filtre.** Le brouillard affiché = brouillard complet, avec des trous uniquement autour des lieux retenus. Les trous ont le même rayon et le même contour irrégulier qu'en affichage normal (un lieu doit avoir exactement le même trou filtré ou non).
11. **Couleur, palette.** Seuls `stamp`, `postal`, `sage` et `lantern` sont utilisés, dans leurs variantes claire et sombre de la charte. Aucune valeur en dur, aucune interpolation de couleur, aucune opacité réduite qui créerait une nouvelle teinte.
12. **Couleur, jamais seule.** En mode couleur, chaque pin porte une étiquette de jour ou de date et chaque trajet un motif et une étiquette. Si l'étiquette ne peut pas s'afficher (zoom éloigné, voir edge cases), la couleur n'est pas affichée non plus pour cet élément.
13. **Attribution des couleurs.** Uniquement sur les jours qui ont du contenu dans la sélection. Un jour vide ne consomme pas de couleur. L'attribution est recalculée à chaque changement de sélection, dans l'ordre chronologique.
14. **« Un jour, une couleur » limité à 7 jours.** Au-delà, l'option est désactivée. Si une sélection passe de 7 à plus de 7 jours alors que ce mode est actif, on bascule sur « Du plus ancien au plus récent » et on l'annonce : « Plus de 7 jours : on passe au dégradé. »
15. **Filtre « Jours » limité à 31 jours** avec du contenu dans la sélection, pour garder une liste lisible.
16. **Mémorisation.** L'état du panneau (voyages, période, jours, couleur) est mémorisé sur l'appareil et restauré au lancement suivant. Les périodes relatives sont gardées en relatif. Une période « Choisir… » est gardée en dates fixes.
17. **Le bandeau est obligatoire** dès qu'un critère de filtre est actif, y compris au lancement. On ne peut pas le masquer.
18. **Voyage supprimé.** Il est retiré du filtre immédiatement. Ses lieux deviennent « hors voyage » (décision globale). Si le filtre ne contient plus aucun voyage, on revient à « Tous les lieux ».
19. **Jours sélectionnés devenus hors sélection** (par exemple après avoir décoché un voyage) : ils sont retirés de la sélection de jours. Si plus aucun jour ne reste, on revient à « tous les jours ».
20. **Périmètre.** Le filtre ne s'applique qu'à l'écran Carte. Le carnet, Sorties, Cercle et Moi ne sont pas filtrés.
21. **Voyage en cours.** Un lieu validé pendant qu'un filtre l'exclut est quand même enregistré et rattaché au voyage en cours. L'animation de révélation joue toujours (voir edge case 13).

## 5. Modèle de données

Tout ce qui concerne cette feature est **local sur l'appareil**. Rien ne part sur Supabase.

### 5.1 Données lues (existantes ou prévues par d'autres features)

**Lieu** (local)
- `id`
- `validatedAt` : horodatage UTC de la validation par photo
- `tzOffsetMinutes` : décalage horaire au moment de la validation (à ajouter s'il n'existe pas, voir hypothèses)
- `recordedAt` : horodatage UTC d'enregistrement sur l'appareil (repli)
- `tripId` : référence au voyage, ou vide (hors voyage)
- `lat`, `lng`
- `stampNumber` : numéro du tampon

**Voyage** (local)
- `id`, `name`
- `startedAt`, `endedAt` (vide si en cours)
- `deletedAt` ou suppression réelle (selon l'existant, voir hypothèses)

**Point de trajet** (local, suivi déjà en place)
- `timestamp` UTC, `tzOffsetMinutes`, `lat`, `lng`
- `tripId` ou rattachement déduit par les bornes du voyage (voir hypothèses)

### 5.2 Données calculées (non stockées, ou en cache local reconstruisible)

- `dayKey` d'un lieu ou d'un point : « AAAA-MM-JJ » en heure locale (`validatedAt` + `tzOffsetMinutes`).
- `dateStatus` d'un lieu : `ok`, `fallback` (date d'enregistrement utilisée), `none` (sans date).
- Index par jour : `dayKey` vers liste d'identifiants de lieux et de segments de trajet. Sert au filtre et à la légende.
- Attribution couleur : `dayKey` vers `{ colorToken, dashPattern, label }`.
- Masque de brouillard filtré : calculé à partir des lieux retenus.

### 5.3 Données nouvelles stockées

**État du filtre** (local, une seule entrée)
```
mapFilter {
  version: 1
  tripIds: string[]          // vide = tous
  includeNoTrip: boolean     // "Lieux hors voyage"
  period: { kind: "all" | "today" | "last7" | "thisMonth" | "custom",
            from?: "AAAA-MM-JJ", to?: "AAAA-MM-JJ" }
  dayKeys: string[]          // vide = tous les jours
  colorMode: "none" | "perDay" | "gradient"
  updatedAt: horodatage
}
```
- `version` permet de migrer ou d'ignorer un ancien format après une mise à jour.
- Effacé avec les données de l'app. Nettoyé quand un voyage est supprimé.

### 5.4 Relations

- Lieu 0..1 Voyage. Un lieu appartient à un seul voyage au plus.
- Filtre 0..n Voyages (par identifiant, sans contrainte forte : un identifiant inconnu est ignoré).

## 6. Dépendances et phasage

**Dépend de**
- Démarrer / arrêter un voyage et rattachement automatique des lieux (phase 1). Sans voyages, seule la période et le jour ont du sens.
- Suivi du trajet existant, avec horodatage des points.
- Rendu du brouillard capable de prendre un sous-ensemble de lieux.
- Pins photo (phase 1) pour l'étiquette de jour. Tant qu'ils ne sont pas livrés, l'étiquette s'accroche au repère numéroté.
- Tokens de la charte en clair et en sombre pour `stamp`, `postal`, `sage`, `lantern`.

**Phase 1 (cette spec, découpée)**
- 1a : panneau, filtre voyages (dont superposé et hors voyage), période, bandeau, écran vide, brouillard sous filtre, mémorisation.
- 1b : filtre par jour, modes couleur, légende, étiquettes et motifs de trajet.
- 1a peut sortir seul. 1b ne sort pas sans les étiquettes et motifs (règle « couleur jamais seule »).

**Phase 2** : prise en compte de l'import galerie (dates EXIF, lieux avec date ancienne, voyage créé après coup). Revoir la règle de date invalide (règle 8).

**Phase 3** : partage dans le Cercle. Le filtre ne doit pas être partagé par défaut. À spécifier dans la feature de partage.

**Lien avec d'autres features**
- Une page voyage pourra proposer « Voir sur la carte », qui applique le filtre de ce voyage seul. Même état, même bandeau.

## 7. Safety

**Données locales.** L'état du filtre reste sur l'appareil. Aucune donnée de filtre, de trajet ou de date n'est envoyée sur Supabase par cette feature. La phrase « Les photos et la position restent sur l'appareil par défaut » reste vraie.

**Permissions.** Aucune nouvelle permission. La feature n'utilise que des données déjà enregistrées.

**Vie privée et regard d'autrui.** Le filtre par jour avec trajet peut montrer précisément où l'utilisateur était un jour donné, y compris le point de départ (souvent son domicile). C'est déjà visible sur la carte complète, mais le filtre le rend plus lisible. Conséquences :
- Pas de capture ou de partage du filtre depuis cette feature.
- En phase 3, le partage d'une carte ou d'une balade ne doit jamais inclure le trajet filtré sans un choix explicite, et devra masquer la zone autour du domicile (à traiter dans la spec de partage).

**Sécurité physique.** Rien à faire sur le terrain avec le panneau. Pas d'alerte, pas de son. Le panneau s'ouvre à mi-hauteur pour garder la carte et la position visibles en marchant.

**Confiance et perte apparente.** Le risque principal est psychologique : croire que des lieux ont disparu. Le bandeau obligatoire, la phrase « Rien n'est effacé » et le bouton « Tout voir » toujours accessible y répondent.

**Abus.** Pas de surface d'abus : rien n'est partagé ni visible par d'autres.

**Suppression de compte.** Le filtre ne dépend pas du compte. Supprimer le compte ne touche pas l'état local du filtre. Effacer les données de l'app (ou désinstaller) l'efface. Les textes d'aide ne doivent pas affirmer autre chose.

**RGPD.** L'état du filtre est une préférence locale, pas une donnée transmise. Il est couvert par l'effacement des données locales. Les dates et trajets restent soumis aux règles déjà en place pour le suivi du trajet.

## 8. Edge cases

1. **Plus de jours que de couleurs (5 à 7 jours, mode « Un jour, une couleur »).** Les jours 5 à 7 réutilisent `stamp`, `postal`, `sage` avec un trait en tirets longs. Chaque pin porte le numéro du jour. La légende liste les 7 jours avec couleur, motif et date. Deux jours de même couleur ne sont jamais adjacents dans l'ordre (jour 1 et 5 au plus proche).
2. **Plus de 7 jours avec « Un jour, une couleur » demandé.** L'option est désactivée avec la phrase d'explication (3.3). Si la sélection grandit alors que le mode est actif, bascule automatique sur le dégradé avec message « Plus de 7 jours : on passe au dégradé. » (affiché 4 s, lu par le lecteur d'écran).
3. **Dégradé avec beaucoup de jours (ex. 200 jours).** 4 paliers de taille quasi égale en nombre de jours avec contenu. La légende montre 4 lignes avec plages de dates : « 2/6 au 14/7 · 38 lieux ». Les étiquettes de pin montrent la date courte du lieu.
4. **Dégradé avec 2 ou 3 jours.** Un palier par jour, en partant du premier palier (`postal`) et en finissant par le dernier (`stamp`) : avec 2 jours, jour 1 `postal`, jour 2 `stamp`. Le plus récent est toujours `stamp`.
5. **Dégradé avec un seul jour.** L'option est désactivée : « Il faut au moins 2 jours pour voir un dégradé. »
6. **Jours sans aucun lieu.** Pas listés dans « Jours », pas de couleur attribuée, pas de ligne de légende. Si une période choisie à la main contient des jours vides au milieu, la légende ne les montre pas et l'ordre des couleurs saute ces jours.
7. **Jour avec trajet mais sans lieu.** Listé « trajet seulement ». Il compte comme un jour avec contenu pour la couleur. Le brouillard ne se lève pas pour ce jour (aucun lieu), seul le trajet s'affiche par-dessus le papier vierge.
8. **Filtre qui ne renvoie rien.** Écran vide expliqué (3.7), brouillard complet, phrase construite à partir des critères, « Modifier les filtres » et « Tout voir ».
9. **Lieu sans date.** Règle 9 : visible sans période ni jour, masqué sinon, signalé dans le panneau. En mode couleur, affichage normal sans étiquette de jour, ligne « Sans date » dans la légende.
10. **Lieu avec date fausse (futur, horloge de l'appareil faussée, 1970).** Règle 7 et 8 : on tente la date d'enregistrement, sinon « sans date ». Jamais de jour « 1er janv. 1970 » dans la liste des jours. Jamais de jour dans le futur.
11. **Horloge de l'appareil changée en arrière après des validations.** Les périodes relatives (« Aujourd'hui ») utilisent l'heure de l'appareil. Des lieux peuvent apparaître « dans le futur » de moins de 24 h : ils sont acceptés et comptés au jour de leur date. Au-delà de 24 h, ils passent en « sans date » jusqu'à ce que l'horloge revienne.
12. **Fuseaux horaires et minuit.** Un lieu validé à 00 h 20 heure locale appartient au jour qui commence. Un trajet de 23 h 30 à 00 h 40 est coupé en deux à minuit : deux couleurs, deux étiquettes. Un utilisateur qui arrive d'un autre fuseau et valide un lieu à Helsinki : le jour est celui d'Helsinki au moment de la validation (décalage enregistré), pas celui de son fuseau d'origine. Si l'appareil change de fuseau ensuite, les jours déjà enregistrés ne bougent pas. Passage à l'heure d'hiver (nuit avec 25 h) : le jour reste le jour calendaire local, l'heure en double n'est pas un problème puisqu'on stocke l'UTC et le décalage.
13. **Voyage en cours pendant qu'un filtre l'exclut.** L'utilisateur valide un lieu. Retour sur la carte : l'animation de révélation joue (le moment de récompense est conservé). Ensuite un message : « Ce lieu est hors de ton filtre. Il est bien dans ton carnet. » avec « Voir tout » (secondaire) et « OK » (secondaire). Sur « OK » ou après 6 s, le trou se referme en fondu et le lieu est masqué. Le compteur du bandeau passe de 148 à 149 lieux au total.
14. **Voyage en cours inclus dans le filtre.** Les nouveaux lieux apparaissent normalement. En mode « Un jour, une couleur », un nouveau jour (après minuit) prend la couleur suivante. Si cela fait passer à 8 jours, edge case 2.
15. **Filtre « Aujourd'hui » qui passe minuit pendant l'utilisation.** Au prochain retour sur la carte (ou au prochain rendu), « Aujourd'hui » désigne le nouveau jour. Les lieux de la veille disparaissent de l'affichage et le bandeau se met à jour. Pas de changement en plein geste de l'utilisateur.
16. **Beaucoup de voyages (50 et plus).** Recherche par nom, 8 plus récents visibles, « Voir les 42 autres ». Bandeau : « Tu vois : 12 voyages ». La liste reste fluide (rendu virtualisé).
17. **Noms de voyage très longs.** Coupés sur deux lignes dans le panneau, puis points de suspension. Dans le bandeau, une ligne avec points de suspension. Le nom complet est lu par le lecteur d'écran.
18. **Voyage sans aucun lieu coché.** S'il a un trajet, le trajet s'affiche. Sinon écran vide avec la variante « Tu n'as encore validé aucun lieu pendant « … ». »
19. **Lieu rattaché à aucun voyage.** Visible avec « Tous les lieux » ou « Lieux hors voyage ». Masqué dès qu'on coche seulement des voyages.
20. **Suppression d'un voyage pendant qu'il est filtré.** Règle 18 : retiré du filtre. S'il était le seul, retour à « Tous les lieux », message « Le voyage a été supprimé. Ses lieux sont toujours là, sans voyage. » Ses lieux sont maintenant « hors voyage ». Le brouillard autour de ces lieux reste levé en affichage complet.
21. **Suppression d'un voyage depuis un autre écran puis retour sur la carte.** Même chose, appliqué au retour. L'identifiant obsolète est retiré de l'état mémorisé.
22. **Voyage renommé pendant qu'il est filtré.** Le bandeau prend le nouveau nom au prochain rendu. Le filtre ne change pas (il repose sur l'identifiant).
23. **Filtre actif au lancement.** Bandeau visible dès le premier rendu de la carte, avant même la fin du chargement des pins. Le brouillard filtré est dessiné directement, sans montrer d'abord la carte complète puis de refermer les trous (pas de clignotement).
24. **État mémorisé illisible ou d'une ancienne version.** On l'ignore, on revient à « Tous les lieux » sans message bloquant. Jamais de plantage.
25. **Période personnalisée avec « Du » après « Au ».** Les dates sont inversées automatiquement, sans message. Une période d'un seul jour est acceptée.
26. **Mode sombre.** Les 4 tokens utilisent leur variante sombre de la charte. Les étiquettes de jour restent `ink` sur `paperWhite` (ou leur équivalent sombre) avec contraste 4,5:1. Le contour coloré du pin vérifie 3:1 contre le fond de carte sombre, sinon un liseré `ink` est ajouté autour. À tester (voir Tests).
27. **Daltonisme.** `stamp` et `sage` sont proches pour une deutéranopie, `postal` et `sage` peuvent l'être pour une tritanopie. L'information reste lisible par l'étiquette et le motif. La légende lie toujours couleur, motif et texte. Aucun état n'est montré par la couleur seule, y compris « voyage en cours » dans le panneau (texte « en cours »).
28. **Couleurs de la carte qui se confondent avec les couleurs de jour.** L'eau est `postal`, la nature `sage`, la position utilisateur un point `postal`. Un pin `sage` sur un parc ou un trajet `postal` en bord de mer peut se fondre. Le pin garde son étiquette `paperWhite` et un liseré `ink`. Le point de position garde sa forme propre (point plein, sans étiquette) et n'est jamais confondu avec un pin.
29. **`lantern` comme couleur de jour.** En affichage normal, `lantern` = lieu révélé. En mode couleur, `lantern` désigne un jour (ou un palier). La légende lève l'ambiguïté. `lantern` ne porte jamais de texte sur `paper` : il ne sert qu'au contour et au trait.
30. **Performance avec des milliers de points.** 5 000 lieux et 200 000 points de trajet : le changement de filtre se voit sur la carte en moins de 300 ms sur un téléphone milieu de gamme de 2023. Le filtrage se fait sur l'index par jour, sans relire toutes les données. Les trajets sont simplifiés selon le niveau de zoom. Le masque de brouillard filtré est mis en cache par combinaison de filtre. Les mises à jour en direct pendant que le panneau est ouvert sont regroupées (pas plus d'un recalcul toutes les 150 ms).
31. **Changements rapides dans le panneau.** Cocher et décocher 10 voyages en 3 secondes : seul le dernier état est rendu. Aucune animation ne s'empile.
32. **Zoom très éloigné.** Les pins se regroupent en grappes. Une grappe montre un nombre de lieux, contour `ink`, sans couleur de jour (une grappe peut mélanger des jours et sans étiquette la couleur porterait seule l'info). Si tous les lieux d'une grappe sont du même jour, la grappe peut prendre la couleur de ce jour et l'étiquette de jour. Les trajets restent visibles avec leur motif, les étiquettes de date de trajet disparaissent sous un seuil de zoom, et le trajet passe alors en pointillé `stamp` neutre.
33. **Zoom très éloigné avec un filtre très étalé (lieux aux deux bouts d'Helsinki).** Le recadrage automatique montre tous les lieux, quitte à regrouper en grappes. Pas de zoom plus éloigné que le niveau qui montre tout Helsinki.
34. **Très petit écran (320 pt de large, ex. iPhone SE 1re génération).** Le panneau ouvre directement en pleine hauteur, sections empilées et défilables. La pastille « Filtres » et « Tout voir » restent à 44 px. Le bandeau tient sur deux lignes au maximum, le sous-texte est masqué en dessous de 360 pt de large mais reste lu par le lecteur d'écran. La légende repliée par défaut.
35. **Très grand écran (tablette, paysage).** Le panneau s'ouvre en colonne latérale à droite (largeur fixe, environ 380 pt) au lieu d'une feuille du bas, la carte reste visible en entier. La légende peut rester dépliée.
36. **Grande taille de texte (accessibilité, jusqu'à 200 %).** Le panneau défile, rien n'est coupé. Les étiquettes de pin grandissent jusqu'à une limite (à fixer avec la charte) puis le texte passe en version courte (« 12 » au lieu de « 12/11 »). Le bandeau peut passer sur trois lignes.
37. **« Réduire les animations » actif.** Ouverture du panneau, fondu du brouillard, révélation sous filtre (edge case 13) : tout passe directement à l'état final.
38. **Lecteur d'écran.** Le panneau est parcouru dans l'ordre visuel. Chaque case cochable annonce son état (« coché », « non coché »). Les mises à jour du nombre de lieux sont annoncées poliment (« 12 lieux affichés »), sans couper la lecture en cours.
39. **Lieu tout près d'un lieu masqué.** Le trou du lieu affiché garde sa forme. Le lieu masqué voisin ne laisse pas de demi-trou. Pas de « fuite » visuelle du lieu masqué.
40. **Trajet d'un jour filtré qui passe par une zone d'un autre jour.** Le trajet s'affiche par-dessus le papier vierge. Il ne lève pas le brouillard (seuls les lieux le lèvent).
41. **Ouverture du panneau pendant une animation de révélation.** La révélation se termine (450 ms maximum) puis le panneau s'ouvre. Pas d'état intermédiaire figé.
42. **Données restaurées sur un nouvel appareil (si une restauration existe).** L'état du filtre n'est pas forcément restauré. Si un identifiant de voyage ne correspond à rien, il est ignoré (edge case 24).
43. **Aucun lieu du tout (nouvel utilisateur).** La pastille « Filtres » est visible mais le panneau dit : « Valide ton premier lieu pour pouvoir filtrer ta carte. » Seul « Voir la carte » est proposé.
44. **Hors connexion.** Tout fonctionne, la feature est entièrement locale.

## 9. Tests

### 9.1 Unitaires

- **Calcul du jour.** `validatedAt` = 2026-11-12T22:20Z, décalage +120 min, résultat `dayKey` = 2026-11-13. Même instant avec décalage 0 : 2026-11-12.
- **Changement d'heure.** Lieu validé le 25 oct. 2026 à 03 h 30 heure d'Helsinki (avant et après le recul d'heure) : même `dayKey` 2026-10-25 dans les deux cas.
- **Découpe de trajet à minuit.** Segment de 23 h 30 à 00 h 40 locale : deux segments, coupés à 00 h 00, `dayKey` différents.
- **Date invalide.** Date 3 jours dans le futur : `dateStatus` = `fallback` si `recordedAt` valide, sinon `none`. Date 1970-01-01 : idem. Date future de 2 h : `ok`.
- **Combinaison des critères.** Voyages A et B, période 3 au 9 nov., jour 5 nov. coché : seuls les lieux de A ou B datés du 5 nov. sont retenus. Lieu hors voyage du 5 nov. : exclu. Avec `includeNoTrip` : inclus.
- **Valeurs vides.** Aucun voyage, période « Tout », aucun jour : tous les lieux, y compris sans date.
- **Lieux sans date et période.** Période « 7 derniers jours » : les lieux `none` sont exclus et comptés à part.
- **Attribution « Un jour, une couleur ».** 7 jours avec contenu : couleurs et motifs exactement selon le tableau 3.5. 3 jours avec un jour vide au milieu de la période : les 3 jours avec contenu prennent `stamp`, `postal`, `sage`.
- **Bascule à 8 jours.** Mode `perDay` et 8 jours : le résultat passe à `gradient` et un message est produit.
- **Paliers de dégradé.** 2 jours : `postal`, `stamp`. 4 jours : les 4 paliers dans l'ordre. 10 jours : groupes de tailles 3, 3, 2, 2 (ou 2, 2, 3, 3, à fixer, mais toujours chronologique et le plus récent en `stamp`). 1 jour : option indisponible.
- **Aucun token hors palette.** Pour toute sélection, toutes les couleurs produites appartiennent à {`stamp`, `postal`, `sage`, `lantern`}.
- **Étiquette obligatoire.** Pour toute attribution de couleur, chaque élément coloré a une étiquette ou un motif non vide.
- **Période personnalisée inversée.** Du 9 au 3 nov. : normalisée en 3 au 9 nov.
- **Périodes relatives.** « 7 derniers jours » le 8 nov. : du 2 au 8 nov. inclus. Le 9 nov., du 3 au 9.
- **Lecture de l'état mémorisé.** État de `version` inconnue : retourne l'état par défaut sans erreur. Identifiant de voyage inconnu : retiré.
- **Texte du bandeau et de l'écran vide.** Pour chaque combinaison (1 voyage, n voyages, période, voyage + jours, hors voyage), le texte attendu de la section 3.

### 9.2 Intégration

- **Brouillard filtré.** Filtrer sur un voyage de 5 lieux : le masque contient exactement 5 trous, identiques en forme à ceux de la carte complète (comparaison du masque par lieu).
- **Rien n'est supprimé.** Appliquer 20 filtres successifs puis « Tout voir » : nombre de lieux, de voyages, de points de trajet et masque complet identiques à l'état initial.
- **Mémorisation.** Appliquer « Vacances d'automne » + couleur par jour, tuer l'app, relancer : même état, bandeau présent au premier rendu.
- **Suppression de voyage.** Filtrer sur A seul, supprimer A : filtre vide, retour à « Tous les lieux », lieux de A en « hors voyage », état mémorisé sans l'identifiant de A.
- **Validation sous filtre.** Voyage en cours B, filtre sur A seul, valider un lieu : lieu enregistré dans B, révélation jouée, message affiché, lieu masqué ensuite, compteur total +1.
- **Périmètre.** Avec un filtre actif, le carnet, Moi et la liste des voyages montrent tout.
- **Mode sombre.** Basculer le système en sombre avec un mode couleur actif : toutes les couleurs viennent des variantes sombres des tokens.

### 9.3 Bout en bout

- Flux A à E de la section 3.9, sur iOS et Android, chacun avec le résultat attendu décrit.
- Nouvel utilisateur sans lieu : ouvrir « Filtres », voir le message d'invitation, aucun plantage.
- Filtre « Aujourd'hui » laissé ouvert de 23 h 55 à 00 h 05 (horloge simulée) : après minuit, l'affichage montre le nouveau jour au prochain retour sur la carte.
- 50 voyages générés : recherche « suomen » trouve « Week-end à Suomenlinna » en moins de 3 caractères tapés après le premier.

### 9.4 Accessibilité

- VoiceOver et TalkBack : parcourir le panneau entier, chaque élément annonce libellé et état. Le bandeau est annoncé à l'ouverture de la carte quand un filtre est actif.
- Pins en mode couleur : le libellé lu contient le jour et la date, jamais un nom de couleur.
- Contraste : étiquettes de jour 4,5:1 en clair et sombre. Contour coloré des pins et traits de trajet 3:1 contre le fond de carte (ou liseré `ink` présent), mesuré pour les 4 tokens sur `fog`, sur l'eau `postal` et sur la nature `sage`.
- Simulation deutéranopie, protanopie, tritanopie et niveaux de gris sur captures des modes « Un jour, une couleur » (7 jours) et dégradé : chaque jour reste identifiable par étiquette et motif.
- Cibles tactiles : pastille, cases, pastilles de période, « Tout voir », « Légende » mesurent 44 px minimum.
- Texte à 200 % : aucun texte coupé, panneau défilable.
- « Réduire les animations » : aucune transition visible.

### 9.5 Performance

- Jeu de données de 5 000 lieux, 300 voyages, 200 000 points de trajet sur un Android milieu de gamme de 2023 et un iPhone 12 :
  - Application d'un filtre voyage : carte à jour en moins de 300 ms.
  - Passage en mode couleur dégradé sur « Tous les lieux » : moins de 500 ms, fluidité de déplacement de la carte au-dessus de 50 images par seconde ensuite.
  - Lancement avec filtre mémorisé : pas plus de 200 ms ajoutés au temps d'affichage de la carte actuel.
  - 10 changements de filtre en 3 secondes : pas de gel de l'interface, mémoire stable.
  - Zoom très éloigné en dégradé : regroupement en grappes, pas de chute sous 45 images par seconde.

### 9.6 Tests terrain (Helsinki)

- Balade réelle à cheval sur minuit (par exemple de Kallio à Hakaniemi vers 23 h 30) : le lendemain, filtre par jour, le trajet est bien coupé à minuit, deux jours dans la légende.
- Week-end de 3 jours avec voyage démarré : « Un jour, une couleur » rend l'ordre lisible sans légende ouverte, pour 3 testeurs.
- Lecture en plein soleil (front de mer, Kaivopuisto) : les étiquettes de jour restent lisibles, les couleurs ne sont pas nécessaires pour comprendre.
- Au moins 2 testeurs daltoniens : ils retrouvent le jour d'un lieu donné et l'ordre des jours.
- Test « perte apparente » : laisser un filtre actif, rendre le téléphone au testeur le lendemain sans explication. Il doit comprendre qu'un filtre est actif et revenir à tout en moins de 10 s.
- Mode sombre le soir, en marchant : panneau utilisable d'une main, à mi-hauteur.

## 10. Critères d'acceptation

- [ ] Un seul panneau « Filtres » gère voyages, période, jours et couleur.
- [ ] On peut cocher plusieurs voyages et les voir superposés.
- [ ] « Lieux hors voyage » est filtrable comme un voyage.
- [ ] Les critères se combinent selon la règle 2 (OU entre voyages, ET avec période et jours).
- [ ] Sous filtre, le brouillard n'est levé qu'autour des lieux retenus, avec la même forme de trou qu'en affichage complet.
- [ ] Après n'importe quelle suite de filtres puis « Tout voir », la carte est identique à l'état initial. Rien n'est supprimé.
- [ ] Le bandeau « Tu vois : … » est visible dès qu'un filtre est actif, y compris au lancement, avec le nombre de lieux affichés sur le total.
- [ ] « Tout voir » retire tous les filtres en un tap.
- [ ] L'état du filtre est mémorisé sur l'appareil et restauré au lancement.
- [ ] Un filtre sans résultat affiche l'écran vide expliqué, avec une phrase qui reprend les critères.
- [ ] Mode « Un jour, une couleur » disponible jusqu'à 7 jours, couleurs et motifs selon le tableau 3.5.
- [ ] Mode dégradé en 4 paliers `postal`, `sage`, `lantern`, `stamp`, le plus récent en `stamp`.
- [ ] Aucune couleur hors `stamp`, `postal`, `sage`, `lantern`, aucune valeur en dur, variantes claires et sombres issues des tokens.
- [ ] Chaque pin coloré porte une étiquette de jour ou de date. Chaque trajet coloré porte un motif. Aucune info n'est portée par la couleur seule, même en zoom éloigné.
- [ ] La légende lie couleur, motif et texte, et est lisible au lecteur d'écran.
- [ ] Le jour d'un lieu est son jour local au moment de la validation. Les trajets sont coupés à minuit.
- [ ] Les lieux sans date ou à date invalide ne créent jamais de jour faux.
- [ ] Supprimer un voyage filtré le retire du filtre sans erreur, ses lieux passent hors voyage.
- [ ] Un lieu validé hors filtre pendant un voyage en cours est enregistré, la révélation joue, un message explique qu'il est masqué.
- [ ] Toutes les cibles tactiles font 44 px minimum. Aucun élément interactif n'est tourné.
- [ ] Une seule action principale `stamp` par écran ou panneau.
- [ ] Animations de 450 ms maximum, sans rebond, supprimées si « réduire les animations » est actif.
- [ ] Objectifs de performance de 9.5 atteints.
- [ ] Le panneau fonctionne sur 320 pt de large, sur tablette en paysage et avec un texte à 200 %.
- [ ] Aucune donnée de cette feature n'est envoyée sur Supabase.

## 11. Hypothèses à vérifier

Je n'ai pas accès au code. Tout ce qui suit dépend de l'existant et doit être confirmé.

1. **Rendu du brouillard.** On suppose que le masque du brouillard peut être recalculé à partir d'une liste de lieux donnée. S'il est stocké comme une image ou une géométrie cumulée (et non recalculé par lieu), le brouillard filtré demande un autre mécanisme.
2. **Forme des trous.** On suppose que le contour irrégulier d'un trou est déterministe par lieu (même lieu, même forme). Sinon, un lieu aurait une forme différente filtré ou non.
3. **Décalage horaire.** On suppose qu'il faut ajouter `tzOffsetMinutes` sur les lieux et les points de trajet. À vérifier : est-il déjà stocké ? Sinon, que faire des lieux existants (proposition : décalage d'Helsinki à la date du lieu).
4. **Horodatage des lieux.** On suppose que chaque lieu a une date de validation fiable et une date d'enregistrement distincte.
5. **Rattachement des points de trajet aux voyages.** Par identifiant de voyage sur chaque point, ou déduit des bornes `startedAt` / `endedAt` ? Cela change la façon de filtrer les trajets par voyage.
6. **Suppression de voyage.** Suppression réelle ou marquage `deletedAt` ? Le nettoyage de l'état du filtre en dépend.
7. **Stockage local de préférences.** On suppose un stockage clé-valeur local disponible pour l'état du filtre.
8. **Bibliothèque de carte.** On suppose qu'elle gère les traits en pointillé et en tirets avec motifs différents par segment, les étiquettes accrochées aux pins et le regroupement en grappes. À vérifier, surtout les motifs de trait sur Android.
9. **Tokens sombres.** On suppose que `stamp`, `postal`, `sage`, `lantern` ont une variante sombre dans `app/src/theme/tokens.ts`.
10. **Contraste des tokens sur la carte.** Non mesuré. `lantern` et `sage` risquent de ne pas atteindre 3:1 sur `fog` ou `paper` : le liseré `ink` est prévu pour ça.
11. **Bouton principal de la Carte.** On suppose que l'action principale de l'écran Carte est déjà le bouton `stamp` de l'appareil photo, et que la pastille Filtres reste secondaire.
12. **Taille minimale de Special Elite.** La charte ne fixe pas de taille minimale pour Special Elite. L'étiquette de jour en a besoin.
13. **Volume de données réel.** Les cibles de 5 000 lieux et 200 000 points de trajet sont des ordres de grandeur. À comparer avec la fréquence réelle d'enregistrement du suivi.
14. **Pins photo.** Leur forme permet-elle d'accrocher une étiquette et de colorer un contour sans masquer la photo ?
15. **Restauration de données.** Existe-t-il une sauvegarde ou une restauration entre appareils ? Cela change ce qui arrive à l'état du filtre.

## 12. Questions ouvertes

1. **Mémoriser le filtre ou non.** La spec propose de le mémoriser, avec bandeau obligatoire. Faut-il une expiration (par exemple retour automatique à « Tous les lieux » après 7 jours sans ouverture de l'app) pour limiter le risque de « j'ai perdu mes lieux » ?
2. **Fin de journée.** Minuit pile, ou une journée de voyage qui finit à 4 h du matin (une soirée qui déborde reste « le même jour ») ? La spec part sur minuit, plus simple à expliquer.
3. **Vrai dégradé.** Ajouter à la charte une suite de tokens dédiée au dégradé (par exemple 5 teintes de `stamp`) pour un rendu plus fin que 4 paliers ?
4. **Ordre des couleurs.** `stamp` en premier jour donne au jour 1 la couleur de l'action principale. Préfère-t-on garder `stamp` pour le jour le plus récent dans les deux modes, par cohérence ?
5. **`postal` et la position utilisateur.** Un jour en `postal` peut rappeler le point de position. Faut-il exclure `postal` des couleurs de jour (on tomberait à 3 couleurs) ou renforcer la forme du point de position ?
6. **Couleur qui survit à « Tout voir ».** La spec garde le mode couleur après « Tout voir ». Est-ce attendu, ou « Tout voir » doit-il aussi remettre la couleur à « Aucune » ?
7. **Filtre par jour sans voyage.** Limite de 31 jours dans la liste « Jours ». Est-ce le bon seuil ?
8. **Lieux validés hors filtre pendant un voyage en cours.** Faut-il plutôt ajouter automatiquement le voyage en cours au filtre quand on démarre un voyage ?
9. **Partage en phase 3.** Une carte filtrée pourra-t-elle être partagée dans le Cercle ? Si oui, quelle protection du point de départ du trajet (domicile) ?
10. **Filtre ailleurs.** Faut-il, plus tard, appliquer le même filtre au carnet ou à Sorties, ou garder la carte comme seul écran filtré ?

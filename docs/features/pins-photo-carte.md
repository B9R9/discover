# Pins photo sur la carte : spec

Brouillon du 8 nov 2026, à relire

## 1. Résumé

Chaque lieu validé apparaît sur la carte comme un mini polaroïd épinglé : une petite vignette de la photo de validation, dans un cadre `paperWhite`, légèrement inclinée, avec un bout de scotch `lantern`. Un toucher ouvre la fiche du lieu. Quand on dézoome, les pins proches se rangent en pile avec un chiffre. En mode superposé (plusieurs voyages affichés), chaque pin porte un petit tampon avec l'initiale ou le symbole de son voyage. Sans photo, le polaroïd prend un fond `fog` hachuré. L'utilisateur choisit le cadrage de sa photo (1:1 ou 4:3).

Le pin photo remplace le repère numéroté actuel de la charte. Le numéro du tampon reste dans la fiche et dans l'annonce du lecteur d'écran.

Point clé de la charte : un pin est interactif, donc il ne tourne pas. Seule l'image décorative à l'intérieur est inclinée. La zone de toucher, l'état sélectionné, le focus et le tampon du voyage restent droits (détail en section 3.2).

## 2. Objectif et utilisateur

**Objectif.** Rendre la carte personnelle d'un coup d'œil : on reconnaît ses lieux à leur photo, pas à un numéro. La carte devient le vrai carnet, celui qu'on a envie de rouvrir et de montrer.

**Utilisateur.** Quelqu'un qui se balade dans Helsinki, valide des lieux en photo, parfois pendant un voyage (ou plusieurs), et revient sur la carte pour se souvenir ou pour choisir où aller. Il utilise souvent l'app dehors, en marchant, avec une main, parfois au soleil ou avec des gants l'hiver.

**Ce qu'on veut éviter.**
- Une carte illisible quand on a beaucoup de lieux.
- Une carte qui expose des photos privées quand on montre son téléphone.
- Une carte qui vide la batterie ou rame sur un Android d'entrée de gamme.

**Mesure de réussite (indicative, locale, sans télémétrie nominative).** Toucher un pin ouvre la bonne fiche du premier coup. Pas de baisse visible de fluidité avec 500 lieux validés.

## 3. Comportement détaillé

### 3.1 Les états du pin

Le pin a trois tailles, choisies selon le niveau de zoom (seuils à régler sur le terrain, voir section 11) :

| Niveau | Nom | Rendu | Zone de toucher |
|---|---|---|---|
| Zoom proche (rue, quartier) | Pin plein | Polaroïd ~36 × 42 px (1:1) ou ~44 × 38 px (4:3), cadre `paperWhite`, bord bas plus épais, vignette, scotch `lantern` en haut, ombre légère, image inclinée entre -4° et +4° | 48 × 48 px minimum, droite, centrée sur le lieu |
| Zoom moyen (plusieurs quartiers) | Pin compact | Carré droit ~22 px, cadre `paperWhite` de 2 px, contour 1 px `ink`, vignette réduite, pas de scotch, pas de rotation | 44 × 44 px minimum, droite |
| Zoom lointain (toute la ville et au-delà) | Pas de pin seul | Uniquement des piles (voir 3.4), sans photo, pour économiser mémoire et lisibilité | 44 × 44 px minimum |

États communs :
- **Chargement** : cadre `paperWhite` avec fond `fog` hachuré, puis la vignette apparaît en fondu de 150 ms (instantané si « réduire les animations » est actif).
- **Sans photo ou photo illisible** : fond `fog` hachuré, petit pictogramme appareil photo en `ink` au centre. Ce n'est pas un état d'erreur visible en rouge : c'est un polaroïd vierge.
- **Masqué (mode discret ou photo masquée)** : même rendu que « sans photo », avec le numéro du tampon en Special Elite `ink` au centre (lisible, droit, voir 3.6).
- **Touché (pressé)** : la zone droite reçoit un contour 2 px `ink` le temps du toucher. L'image ne change pas d'angle.
- **Sélectionné (fiche ouverte)** : contour 2 px `ink` sur la zone droite + pin légèrement agrandi (x 1,15, 150 ms, sans rebond), passé au-dessus des autres. L'état est donc porté par la forme (contour, taille), jamais par la couleur seule.
- **Focus lecteur d'écran** : le cadre de focus du système entoure la zone droite, pas l'image inclinée.

### 3.2 La rotation et la charte : solution retenue

**Le problème.** La charte réserve les rotations aux éléments décoratifs et les interdit sur les éléments interactifs. Un pin se touche, donc il est interactif.

**La solution : séparer le pin en deux couches.**

1. **Couche de toucher (interactive, droite).** Un conteneur carré, jamais tourné, d'au moins 48 × 48 px pour le pin plein et 44 × 44 px partout ailleurs. C'est lui qui reçoit le toucher, le focus, le libellé d'accessibilité, le contour de l'état pressé ou sélectionné. Il porte aussi le tampon du voyage (initiale ou symbole) en mode superposé. Il est invisible en soi, sauf quand il dessine un contour d'état.
2. **Couche image (décorative, inclinée).** Le polaroïd, la vignette, le scotch et l'ombre. Il est posé au centre de la couche de toucher, tourné de -4° à +4°, ne reçoit aucun toucher (le toucher le traverse vers la couche droite) et il est caché aux lecteurs d'écran.

**Pourquoi ça tient la charte.**
- Ce qui tourne est purement décoratif : le retirer ne change ni le sens ni l'usage.
- Ce qui est interactif est droit : la zone de toucher est un carré prévisible, le contour de focus est droit, aucun texte informatif ne tourne.
- La zone droite est plus grande que l'image, donc un coin de polaroïd qui dépasse en tournant reste dans la zone. À 4° sur 42 px, le débord est d'environ 3 px par côté : il tient dans les 48 px.

**Règles de la rotation.**
- L'angle est calculé à partir de l'identifiant du lieu (fonction stable), pas au hasard à chaque rendu : un lieu garde toujours le même angle, la carte ne « tremble » pas au déplacement.
- Plage -4° à +4° (dans la plage -5 à +5° de la charte, avec une marge pour le débord). Jamais 0° exact pour que l'effet carnet existe, jamais plus de 4°.
- Pas de rotation au pin compact ni sur les piles vues de loin : à 22 px, l'inclinaison brouille plus qu'elle n'apporte.
- Le chiffre d'une pile et le tampon de voyage sont toujours droits.
- Pas d'animation de rotation (ni à l'apparition, ni à la sélection).

### 3.3 Toucher un pin

1. L'utilisateur touche un pin plein ou compact.
2. Contour d'état pressé sur la zone droite.
3. La carte se recentre doucement (300 ms max, instantané si « réduire les animations ») pour que le pin reste visible au-dessus de la fiche.
4. La fiche du lieu s'ouvre (composant existant, voir section 11). Le pin passe en état sélectionné.
5. Fermer la fiche rend au pin son état normal. La carte ne revient pas à sa position d'avant (on évite les mouvements non demandés).

Un toucher sur le point de position de l'utilisateur ou sur un contrôle de la carte (boussole, recentrage, filtre) va à ce contrôle, jamais au pin dessous (voir edge cases 13 et 14).

### 3.4 Piles (regroupement au dézoom)

- Quand plusieurs pins se rapprochent à l'écran, ils se rangent en **pile** : deux ou trois polaroïds empilés et décalés (décoratifs, inclinés différemment), avec la vignette du lieu le plus récent dessus.
- Un **chiffre** droit en Special Elite, `paperWhite` sur une pastille `ink` (contraste vérifié en clair et en sombre), en haut à droite de la zone droite. Au-delà de 99 : « 99+ ».
- Le rayon de regroupement est d'au moins 48 px à l'écran. Conséquence voulue : deux zones de toucher ne se chevauchent jamais.
- **Toucher une pile** : la carte zoome sur l'emprise des lieux de la pile (300 ms max) jusqu'à ce qu'ils se séparent.
- **Pile au zoom maximal** (lieux trop proches pour se séparer) : toucher la pile ouvre une feuille « Lieux à cet endroit » avec la liste (vignette, nom, date, voyage). Toucher une ligne ouvre la fiche.
  - Titre de la feuille : « 12 lieux ici »
  - Bouton de fermeture : « Fermer » (`accessibilityLabel` si icône seule)
- Une pile ne compte que les lieux visibles avec le filtre actif (voir edge case 18).
- En mode superposé, une pile de lieux de plusieurs voyages affiche jusqu'à trois tampons de voyage alignés droits sous le chiffre, puis « + » s'il y en a plus.

### 3.5 Mode superposé : distinguer les voyages

La charte interdit que la couleur seule porte un état. En mode superposé, chaque pin porte donc un **tampon de voyage** :

- Petite pastille ronde droite (16 px visuels), posée en bas à droite de la zone droite, fond `paperWhite`, contour 1,5 px `ink`, contenu en Special Elite `ink`.
- **Contenu par défaut** : l'initiale du nom du voyage (« É » pour « Été à Suomenlinna »).
- **Si deux voyages affichés ont la même initiale** : on passe automatiquement à un symbole pour tous les voyages concernés, pris dans une liste fixe de 8 formes simples et lisibles à 16 px : rond plein, carré, triangle, losange, étoile, croix, vague, demi-lune. L'attribution est stable (stockée sur le voyage).
- L'utilisateur peut choisir lui-même l'initiale ou le symbole dans les réglages du voyage :
  - Libellé : « Signe sur la carte »
  - Aide : « Il s'affiche sur tes photos quand plusieurs voyages sont visibles. »
  - Choix : « Initiale » / « Symbole »
- Une couleur de voyage (cadre) peut s'ajouter en renfort, uniquement avec des tokens existants et jamais seule.
- **Lieu hors voyage** : pas de tampon. Le lecteur d'écran dit « hors voyage ».
- Un petit encart de légende, ouvert depuis la pastille de filtre, liste les voyages affichés avec leur signe. Titre : « Tes voyages sur la carte ».
- Quand un seul voyage est affiché (ou aucun filtre), pas de tampon : il n'apporte rien.

### 3.6 Mode discret

Pour montrer son téléphone sans montrer ses photos.

- Réglage dans Moi, section confidentialité :
  - Libellé : « Cacher les photos sur la carte »
  - Aide : « Tes lieux restent sur la carte, mais sans leur photo. Pratique quand tu montres ton téléphone. »
- Raccourci sur la carte : appui long sur la pastille de filtre ou entrée dans le menu de la carte, libellé « Mode discret ».
- Effet : tous les pins passent à l'état « masqué » (fond `fog`, numéro du tampon). Les piles n'affichent plus de vignette. Les fiches restent accessibles normalement (l'utilisateur ouvre lui-même ce qu'il veut montrer).
- Un petit indicateur droit reste visible sur la carte tant que le mode est actif : « Photos cachées », touchable pour le couper.

### 3.7 Masquer la photo d'un seul lieu

- Dans la fiche du lieu, menu de la photo : « Ne pas montrer sur la carte ».
- Le pin de ce lieu passe à l'état masqué, partout et pour toujours, jusqu'à ce que l'utilisateur annule (« Montrer sur la carte »).
- Le lieu reste validé, le brouillard reste levé, la photo reste dans la fiche.

### 3.8 Recadrer la photo

À la validation d'un lieu (après la prise de photo) :

1. Écran de recadrage avec la photo, un cadre visible et deux pastilles de format de 44 px : « Carré » (1:1) et « Paysage » (4:3).
2. L'utilisateur déplace et zoome la photo dans le cadre (pincer, glisser). Aucun cadre ne tourne.
3. Action principale `stamp` : « Garder ce cadrage ». Bouton secondaire : « Passer » (cadrage centré par défaut en 1:1).
4. Le cadrage sert au pin et au polaroïd de la fiche. La photo d'origine n'est jamais modifiée.

Plus tard, depuis la fiche : menu de la photo, « Recadrer ». Même écran. Le pin se met à jour dès la validation.

Accessibilité du recadrage : deux boutons « Agrandir » / « Réduire » et quatre flèches de déplacement sont proposés quand un lecteur d'écran est actif, car le geste de pincement n'est pas accessible à tous. « Passer » reste toujours possible.

### 3.9 Textes d'interface (récapitulatif)

| Endroit | Texte |
|---|---|
| Feuille de pile | « 12 lieux ici » |
| Fiche, photo absente du téléphone | « La photo d'origine n'est plus sur ton téléphone. On garde la petite version pour ta carte. » |
| Fiche, photo illisible | « On n'arrive pas à lire cette photo. Tu peux en choisir une autre. » + bouton « Choisir une photo » |
| Fiche, lieu sans photo | « Pas encore de photo pour ce lieu. » + bouton « Ajouter une photo » |
| Menu photo | « Recadrer », « Changer de photo », « Ne pas montrer sur la carte » / « Montrer sur la carte » |
| Recadrage | « Carré », « Paysage », « Garder ce cadrage », « Passer » |
| Mode discret | « Cacher les photos sur la carte », « Photos cachées » |
| Réglage voyage | « Signe sur la carte », « Initiale », « Symbole » |
| Légende superposé | « Tes voyages sur la carte » |
| Lieux masqués par le filtre | « 3 lieux cachés par le filtre » (dans l'encart du filtre) |

### 3.10 Annonces du lecteur d'écran

- **Pin seul** : « Kauppatori, lieu numéro 14, découvert le 3 octobre, voyage Été à Suomenlinna. Bouton. » Indice : « Touche deux fois pour ouvrir la fiche. »
- **Pin sans photo ou masqué** : on ajoute « sans photo » ou « photo cachée ».
- **Pile** : « Groupe de 12 lieux, dont Kauppatori, Uspenski et 10 autres. Bouton. » Indice : « Touche deux fois pour zoomer. » Au zoom maximal : « Touche deux fois pour voir la liste. »
- **Pile en mode superposé** : « Groupe de 12 lieux, de 3 voyages. »
- Action personnalisée sur chaque pile : « Voir la liste » (ouvre la feuille même hors zoom maximal).
- Ordre de parcours : de haut en bas puis de gauche à droite à l'écran, piles comprises.
- La couche image, le scotch, l'ombre et les polaroïds empilés sont cachés aux lecteurs d'écran.
- Alternative complète : la feuille « Lieux à cet endroit » et la liste existante des lieux (si elle existe, voir section 11) permettent de tout atteindre sans viser la carte.

### 3.11 Mouvement

- Fondu d'apparition de la vignette : 150 ms.
- Séparation ou fusion des piles au zoom : fondu croisé de 200 ms, sans trajectoire ni rebond.
- Sélection : agrandissement 150 ms.
- Recentrage au toucher : 300 ms max.
- Avec « réduire les animations » : tout saute à l'état final, recentrage compris.

## 4. Règles métier

1. Un pin existe pour chaque lieu validé visible avec le filtre actif. Pas de pin pour un lieu non validé.
2. Un lieu a au plus une photo de pin. Elle vient de la photo de validation, sauf si l'utilisateur la change.
3. La vignette du pin est une petite copie locale, recadrée, orientée, sans métadonnées (EXIF, position GPS comprise). Elle survit à la suppression de la photo d'origine dans la galerie.
4. La photo d'origine n'est jamais modifiée par Détour.
5. Le cadrage est 1:1 ou 4:3. Par défaut : 1:1 centré.
6. L'angle d'inclinaison est déterministe (dérivé de l'identifiant du lieu), entre -4° et +4°, jamais 0°. Il n'est appliqué qu'à la couche image du pin plein.
7. Rien d'interactif ne tourne : zone de toucher, contours d'état, chiffre de pile, tampon de voyage.
8. Zone de toucher : 48 × 48 px minimum pour le pin plein, 44 × 44 px minimum partout.
9. Rayon de regroupement : au moins 48 px à l'écran. Deux zones de toucher ne se chevauchent jamais.
10. Le point de position de l'utilisateur est toujours dessiné au-dessus des pins. Les contrôles de la carte sont au-dessus de tout.
11. En mode superposé (deux voyages ou plus affichés), chaque pin rattaché à un voyage porte un tampon de voyage. Les initiales en double basculent en symboles.
12. Un lieu masqué (mode discret ou masquage individuel) n'affiche jamais sa vignette sur la carte, ni dans les piles, ni dans la feuille de pile.
13. Supprimer un lieu supprime sa vignette et son cadrage. Supprimer un voyage ne supprime ni les lieux ni les vignettes (décision globale) ; les pins passent « hors voyage ».
14. Les pins ne sortent jamais de l'appareil en phase 1. Aucune vignette n'est envoyée à Supabase.
15. Le repère numéroté disparaît de la carte. Le numéro du tampon reste dans la fiche, dans l'état masqué et dans l'annonce du lecteur d'écran.

## 5. Modèle de données

Tout est **local sur l'appareil** en phase 1. Les noms ci-dessous sont des propositions, à aligner sur le modèle existant (section 11).

### 5.1 Lieu (champs ajoutés au lieu validé existant)

| Champ | Type | Rôle |
|---|---|---|
| `photoSourceRef` | texte, nullable | Référence vers la photo d'origine (identifiant de la galerie ou fichier dans le stockage de l'app, selon l'existant) |
| `photoCrop` | objet, nullable | `{ ratio: '1:1' \| '4:3', x, y, width, height }` en valeurs normalisées 0 à 1 sur l'image orientée |
| `thumbUri` | texte, nullable | Chemin de la vignette dans le dossier documents de l'app (pas le cache, que le système peut vider) |
| `thumbStatus` | énuméré | `pending`, `ok`, `noPhoto`, `sourceMissing`, `error` |
| `thumbVersion` | entier | Incrémenté à chaque recadrage ou changement de photo, pour invalider le cache mémoire |
| `hiddenOnMap` | booléen, défaut faux | Masquage individuel (3.7) |

L'angle n'est pas stocké : il est recalculé depuis l'identifiant.

Taille de la vignette : environ 3 fois la taille d'affichage du pin plein (environ 132 px de côté pour 1:1, 132 × 99 px pour 4:3), en JPEG ou WebP, qualité moyenne. Ordre de grandeur : 5 à 15 Ko par lieu, soit 1,5 à 4,5 Mo pour 300 lieux.

### 5.2 Voyage (champs ajoutés)

| Champ | Type | Rôle |
|---|---|---|
| `mapSignType` | `initial` \| `symbol` | Choix de l'utilisateur ou bascule automatique |
| `mapSignValue` | texte | Lettre ou identifiant de symbole parmi les 8 |
| `mapSignAuto` | booléen | Vrai si choisi par l'app (peut être recalculé), faux si choisi par l'utilisateur (jamais écrasé) |

### 5.3 Réglages

| Champ | Type | Rôle |
|---|---|---|
| `mapDiscreetMode` | booléen, défaut faux | Mode discret (3.6) |

### 5.4 Cache mémoire (non persistant)

- Cache LRU des vignettes décodées, limité (proposition : 150 vignettes ou 20 Mo, le plus petit des deux).
- Index de regroupement recalculé quand le filtre ou la liste des lieux change, interrogé à la fin d'un mouvement de carte.

### 5.5 Supabase

Rien en phase 1. En phase 3 (partage dans le Cercle), voir section 6 et 7 : la photo partagée sera un fichier distinct, sans métadonnées, envoyé seulement après un choix explicite de l'utilisateur.

## 6. Dépendances et phasage

**Dépend de :**
- Validation d'un lieu par photo (existant).
- Fiche du lieu (existante).
- Rendu de la carte et du brouillard (existant).
- Filtre de voyage sur la carte (phase 1, même lot).
- Démarrer/arrêter un voyage et rattachement automatique (phase 1, même lot) pour le tampon de voyage.
- Mise à jour de DESIGN.md (ci-dessous).

**Phase 1 (cette spec) :** pin plein, pin compact, piles, feuille de pile, fond `fog`, recadrage, tampon de voyage en mode superposé, mode discret, masquage individuel, accessibilité complète.

**Phase 2 :** les photos importées de la galerie et les voyages créés après coup produisent des pins par les mêmes règles. La couverture d'un voyage pourra réutiliser le cadrage. Vérifier alors les edge cases 1, 2 et 3 sur les imports en masse.

**Phase 3 :** pins des balades d'autres personnes dans le Cercle, seulement sur l'écran de la balade, jamais mélangés à la carte personnelle. Photos partagées sans métadonnées, signalement possible sur chaque photo (voir section 7).

### Mise à jour proposée de DESIGN.md (section Carte)

> **Pins photo (remplacent les repères numérotés).**
> Un lieu validé est un mini polaroïd : cadre `paperWhite`, bord bas plus épais, vignette 1:1 ou 4:3 recadrée par l'utilisateur, scotch `lantern` en haut, ombre légère.
> Le pin a deux couches. La couche de toucher est droite, 48 × 48 px minimum (44 px pour le compact), elle porte le libellé, le focus, les contours d'état (2 px `ink`) et le tampon de voyage. La couche image est décorative, inclinée de -4° à +4° (angle fixe par lieu), cachée aux lecteurs d'écran et ne reçoit pas le toucher. Rien d'interactif ne tourne.
> **Tailles.** Pin plein ~36 × 42 px au zoom proche. Pin compact ~22 px au zoom moyen : carré droit, cadre `paperWhite` 2 px, contour 1 px `ink`, sans scotch ni rotation. Au zoom lointain, seulement des piles.
> **Piles.** 2 ou 3 polaroïds empilés, chiffre Special Elite `paperWhite` sur pastille `ink`, droit, « 99+ » au-delà. Rayon de regroupement d'au moins 48 px.
> **Sans photo ou photo cachée.** Fond `fog` hachuré dans le cadre `paperWhite`. Photo cachée : numéro du tampon en Special Elite `ink`.
> **Mode superposé.** Tampon de voyage rond 16 px, `paperWhite`, contour 1,5 px `ink`, initiale ou symbole (8 formes) en `ink`. La couleur ne distingue jamais seule un voyage.
> **Ordre d'affichage.** Brouillard, trajets, pins, pin sélectionné, point de position `postal`, contrôles.
> **Sombre.** Mêmes tokens en version sombre ; la pastille du chiffre et le tampon de voyage doivent garder 4,5:1.

## 7. Safety

### 7.1 Téléphone montré à quelqu'un

- Risque : on montre sa carte à un collègue, un ami, un inconnu, et une photo privée apparaît en vignette.
- Réponse : mode discret (3.6) activable en un geste depuis la carte, masquage photo par photo (3.7). Le mode discret ne coupe rien d'autre, pour qu'on ne soit pas tenté de le laisser désactivé.
- La vignette est petite (36 px), ce qui limite déjà ce qu'on voit à distance, mais on ne s'appuie pas que là-dessus.

### 7.2 Captures d'écran et aperçu des apps

- Une capture de la carte montre à la fois des photos et **où** elles ont été prises. Une capture partagée peut révéler le domicile, le lieu de travail, des habitudes.
- On ne bloque pas les captures (c'est l'usage normal d'un carnet qu'on montre). Mais :
  - Le mode discret s'applique aussi aux captures puisqu'il change l'affichage.
  - Question ouverte : flouter la carte dans l'aperçu du sélecteur d'apps quand le mode discret est actif (section 12).
- Aucun texte de l'app ne doit dire « tes photos restent privées » sans nuance : elles restent sur l'appareil, mais une capture d'écran sort de l'app. Formulation juste dans l'aide du mode discret : « Tes photos ne quittent pas ton téléphone. Une capture d'écran, elle, montre ce qui est affiché. »

### 7.3 Photos sensibles et visages

- Pas d'analyse automatique des photos en phase 1 (ni détection de visage, ni de contenu). Pas d'envoi à un service externe pour le faire.
- L'utilisateur garde la main : masquage individuel, mode discret, recadrage (on peut cadrer pour sortir un visage).
- Si une détection est ajoutée plus tard, elle doit tourner sur l'appareil et rester une suggestion (« Cette photo montre peut-être une personne. La cacher sur la carte ? »), jamais un envoi.

### 7.4 Données locales et métadonnées

- La vignette est une copie : il faut le dire honnêtement. Dans l'aide de la confidentialité : « Pour afficher tes lieux sur la carte, Détour garde une petite copie de chaque photo, sur ton téléphone uniquement. Elle part quand tu supprimes le lieu. »
- La vignette est créée sans aucune métadonnée (position GPS, date, modèle d'appareil). Une vignette récupérée hors de l'app ne révèle donc rien de plus que l'image.
- Vignettes stockées dans le dossier privé de l'app, pas dans la galerie, pas dans un dossier partagé.
- Sauvegarde du téléphone (iCloud, Google) : les vignettes suivent la politique de sauvegarde actuelle des données de l'app (à vérifier, section 11). Si les données de l'app sont sauvegardées, l'aide ne doit pas dire « uniquement sur ton téléphone » sans préciser « et dans la sauvegarde de ton téléphone si elle est active ».

### 7.5 Permissions

- Pas de nouvelle permission pour cette feature. La lecture de la photo d'origine utilise la permission déjà demandée par la validation.
- Si l'accès à la galerie est limité (iOS « photos sélectionnées ») ou retiré, les pins existants continuent de marcher grâce aux vignettes. Seule l'ouverture de la photo d'origine en grand devient impossible (edge case 1).
- On ne redemande jamais la permission depuis la carte. Le rappel se fait dans la fiche, au moment où l'utilisateur veut voir la photo en grand.

### 7.6 Sécurité physique

- Une carte couverte de photos de son quartier dit où l'on vit. Le mode discret aide quand on montre l'écran. La phase 3 doit empêcher qu'un pin personnel finisse dans une balade partagée sans choix explicite, photo par photo.
- Les pins ne doivent jamais attirer l'attention en marchant : pas de notification, pas de vibration, pas d'animation en boucle.

### 7.7 Abus dans le Cercle (phase 3, à cadrer dès maintenant)

- Une photo partagée dans une balade est envoyée seulement si l'utilisateur coche la photo au moment du partage. Par défaut : aucune photo partagée, juste le lieu.
- Avant l'envoi : recadrage obligatoire visible, rappel « Vérifie qu'aucune personne n'est reconnaissable sans son accord. »
- La photo partagée est un nouveau fichier ré-encodé sans métadonnées.
- Chaque pin photo d'une balade partagée peut être signalé : « Signaler cette photo », avec motifs « Contenu choquant », « Une personne est reconnaissable sans son accord », « Ça montre une adresse privée », « Autre ».
- Dès qu'une personne signale une photo, elle disparaît pour cette personne (remplacée par le fond `fog`). Le seuil pour la masquer pour tout le monde reste à décider (section 12), vu que la modération se fait par signalements seulement.
- Les pins d'autres personnes ne s'affichent jamais sur la carte personnelle et ne lèvent jamais le brouillard de quelqu'un d'autre.
- Le pseudo seul est affiché, jamais un nom. La photo d'un pin partagé ne doit pas devenir un moyen de deviner l'identité ou le domicile de son auteur : on évite d'afficher l'heure exacte de la photo, on garde la date seule.

### 7.8 Suppression et RGPD

- Supprimer un lieu supprime sa vignette, son cadrage et son masquage. Pas de corbeille cachée.
- Supprimer toutes ses données dans Moi supprime toutes les vignettes.
- Désinstaller l'app supprime les vignettes (dossier privé de l'app).
- Suppression du compte (phase 3) : les photos partagées dans Supabase Storage sont supprimées avec le compte. Les vignettes locales ne dépendent pas du compte et restent tant que l'app est installée, ce qui doit être dit sur l'écran de suppression du compte.
- Phase 1 : aucune donnée de cette feature ne quitte l'appareil, donc pas de nouveau traitement côté serveur à déclarer. À revoir en phase 3.

## 8. Edge cases

1. **Photo d'origine supprimée de la galerie ou du téléphone.** Le pin garde sa vignette (`thumbStatus` reste `ok`, `photoSourceRef` marquée absente au prochain accès). La fiche affiche la vignette agrandie avec le texte « La photo d'origine n'est plus sur ton téléphone. On garde la petite version pour ta carte. » et propose « Changer de photo ». Le recadrage n'est plus possible tant qu'il n'y a pas de nouvelle photo (on ne recadre pas une vignette de 132 px). Aucun message sur la carte.
2. **Photo supprimée avant que la vignette soit créée** (app tuée juste après la validation). Au prochain lancement, les lieux en `pending` sont repris. Source introuvable : `thumbStatus = sourceMissing`, pin en fond `fog`, la fiche propose « Ajouter une photo ».
3. **Photo corrompue.** Le décodage échoue : `thumbStatus = error`, pin en fond `fog`. Fiche : « On n'arrive pas à lire cette photo. Tu peux en choisir une autre. » Pas de nouvel essai en boucle : un seul nouvel essai au lancement suivant, puis plus rien tant que l'utilisateur ne change pas la photo.
4. **Photo énorme** (panorama, 100 Mpx, fichier de 50 Mo). La vignette est créée en lecture réduite (le système décode directement à petite taille), hors du fil principal. Au-delà d'une limite (proposition : 200 Mpx ou 15 s de traitement), on abandonne : comportement du cas 3. L'écran de recadrage travaille sur un aperçu réduit, jamais sur l'original en pleine résolution.
5. **Panorama ou format très allongé.** Le recadrage propose le cadre au centre ; l'utilisateur déplace. Pas de déformation : on recadre, on n'étire jamais.
6. **Orientation EXIF.** La vignette et l'écran de recadrage appliquent l'orientation EXIF avant tout calcul. Le cadrage est stocké en coordonnées de l'image déjà orientée. La vignette écrite est « droite » et sans EXIF, donc aucun lecteur ne la retourne une seconde fois. Test avec les 8 orientations EXIF (section 9).
7. **Photo HEIC, WebP, PNG avec transparence.** Converties dans le format de la vignette. La transparence est posée sur fond `paperWhite`.
8. **Lieu validé sans photo** (selon l'existant, voir section 11 : validation sans photo, migration d'anciens lieux, photo retirée). Pin en fond `fog` avec pictogramme appareil photo. Annonce « sans photo ». Fiche : « Pas encore de photo pour ce lieu. » + « Ajouter une photo ».
9. **Anciens lieux validés avant la feature.** Au premier lancement après mise à jour, création des vignettes en tâche de fond par petits lots (proposition : 10 par lot, pause entre les lots), en commençant par les lieux visibles à l'écran. Pendant ce temps, pins en état chargement. Cadrage par défaut 1:1 centré. Pas d'écran bloquant.
10. **Centaines de pins au même endroit** (ex. 300 lieux autour de la gare centrale). Une seule pile avec « 99+ ». Toucher : zoom jusqu'à séparation. Au zoom maximal, feuille « Lieux à cet endroit » avec une liste défilante virtualisée (vignettes chargées à la demande). Pas plus d'environ 60 pins individuels affichés à l'écran : au-delà, le regroupement se resserre.
11. **Deux lieux quasi superposés** (même immeuble, quelques mètres). Ils restent en pile de 2 même au zoom maximal. Toucher la pile ouvre la feuille avec les 2 lieux. Pas de décalage artificiel des positions (on ne ment pas sur l'emplacement), pas d'éventail animé.
12. **Lieux exactement aux mêmes coordonnées.** Même comportement que le cas 11. L'ordre dans la feuille : du plus récent au plus ancien.
13. **Pin sous la position de l'utilisateur.** Le point `postal` est dessiné au-dessus, avec un liseré `paperWhite` pour rester visible sur la photo. Le point n'est pas interactif : un toucher dessus traverse vers le pin. Le lecteur d'écran garde le pin dans son parcours.
14. **Pin sous la boussole ou un autre contrôle.** Les contrôles sont au-dessus et prennent le toucher dans leur propre zone. Les recentrages automatiques (toucher un pin, ouverture de fiche) utilisent des marges qui tiennent compte des contrôles, de la fiche et des zones sûres de l'écran, pour que le pin sélectionné ne finisse jamais caché. Si un pin est caché par un contrôle, l'utilisateur peut déplacer la carte ou passer par le lecteur d'écran, qui atteint le pin.
15. **Pin au bord de l'écran.** La zone de toucher est utilisable même si elle est à moitié coupée. Au toucher, la carte se recentre pour montrer le pin entier au-dessus de la fiche. Les pins à moins de la moitié visibles ne sont pas proposés au lecteur d'écran (on évite d'annoncer un élément qu'on ne voit pas).
16. **Mémoire et batterie.**
    - Seuls les pins de la zone visible (plus une marge d'un demi-écran) sont rendus.
    - Les vignettes sont décodées à leur taille d'affichage, pas à leur taille de fichier.
    - Cache LRU limité (5.4). Vidé si le système signale un manque de mémoire.
    - Le regroupement est recalculé à la fin d'un mouvement de carte, pas à chaque image.
    - Aucune animation en boucle. Les pins ne se redessinent pas quand la position de l'utilisateur bouge.
    - Création des vignettes jamais pendant un geste sur la carte.
    - En mode économie d'énergie du système : pas de fondu, création des vignettes en attente reportée tant que le téléphone n'est pas en charge (sauf vignettes visibles à l'écran).
17. **Chargement lent des vignettes** (téléphone lent, beaucoup de lieux d'un coup). État chargement (cadre + `fog`), la carte reste utilisable et les pins touchables tout de suite. Les vignettes visibles passent en premier. Si un pin sort de l'écran avant d'être chargé, sa demande est annulée.
18. **Lieux hors zone filtrée.** Un lieu d'un voyage non affiché n'a ni pin ni place dans une pile. Le chiffre des piles ne compte que les lieux visibles. L'encart du filtre indique « 3 lieux cachés par le filtre » quand c'est le cas, pour qu'on ne croie pas avoir perdu un lieu.
19. **Lieux hors de la carte de Helsinki** (si la validation est possible au-delà, voir section 11). Les pins hors des limites de la carte ne sont pas rendus. Ils restent dans la liste des lieux et dans le compte de l'encart du filtre.
20. **Très petit zoom** (toute la ville ou au-delà). Pas de pin seul, seulement des piles sans vignette (pastille et chiffre), pour garder la carte lisible et la mémoire basse. Si toute la ville tient dans une seule pile : une pile au centre de l'emprise des lieux.
21. **Mode sombre.** Tous les éléments viennent des tokens en version sombre. Le cadre `paperWhite` sombre ne doit pas éblouir (valeur sombre du token, pas un blanc pur en dur). Contrôle du contraste 4,5:1 sur la pastille du chiffre et le tampon de voyage. Le fond `fog` du polaroïd vierge doit rester distinct du brouillard de la carte autour (le cadre et le contour `ink` font la différence).
22. **Changement de thème en cours d'usage.** Les pins se redessinent avec les nouveaux tokens sans recharger les vignettes.
23. **Lecteur d'écran sur une pile.** Annonce « Groupe de 12 lieux, dont Kauppatori, Uspenski et 10 autres », action « Voir la liste ». Les deux noms cités sont les plus récents. Pile de 2 : « Groupe de 2 lieux : Kauppatori et Uspenski. »
24. **Lecteur d'écran et beaucoup de pins.** Parcours limité aux pins et piles visibles. Le regroupement garantit au plus environ 60 éléments. La liste des lieux reste l'alternative recommandée.
25. **Grande taille de texte du système.** Le chiffre de pile et le tampon de voyage grandissent jusqu'à une limite (proposition : x 1,5), la zone de toucher grandit avec. Au-delà, la feuille de pile et la fiche portent l'information complète.
26. **Réduire les animations.** Pas de fondu, pas de fondu croisé des piles, pas d'agrandissement animé à la sélection (l'état final s'affiche directement), recentrage instantané. La rotation fixe de l'image reste (ce n'est pas un mouvement).
27. **Photo avec visage ou contenu sensible.** Pas de détection automatique en phase 1. L'utilisateur peut recadrer, masquer la photo sur la carte ou activer le mode discret. Le masquage s'applique aussi à la feuille de pile.
28. **Mode discret actif et fiche ouverte.** La fiche montre la photo (l'utilisateur l'a ouverte lui-même). Fermer la fiche revient à la carte discrète.
29. **Deux voyages avec la même initiale en mode superposé.** Bascule automatique en symboles pour les voyages concernés (sauf ceux dont l'utilisateur a choisi le signe lui-même ; si deux signes choisis à la main sont identiques, on le signale dans la légende : « Deux voyages ont le même signe. » avec lien vers le réglage).
30. **Plus de 8 voyages affichés en mode superposé avec symboles.** Les 8 symboles sont combinés avec l'initiale (symbole + lettre) au-delà du 8e. Question ouverte sur la limite du nombre de voyages superposés (section 12).
31. **Nom de voyage commençant par un chiffre, un emoji ou un signe.** Initiale = premier caractère lettre ou chiffre. S'il n'y en a pas, symbole automatique.
32. **Voyage supprimé.** Ses lieux deviennent « hors voyage », perdent leur tampon, gardent leur vignette.
33. **Lieu changé de voyage** (si possible, voir section 11). Le tampon suit au prochain rendu.
34. **Recadrage abandonné** (app quittée sur l'écran de recadrage). Le lieu est validé avec le cadrage par défaut 1:1 centré. La validation n'est jamais perdue à cause du recadrage.
35. **Cadrage incohérent** (valeurs hors 0 à 1, ratio inconnu après une mise à jour). On revient au cadrage par défaut et on régénère la vignette.
36. **Espace disque plein.** La vignette ne peut pas être écrite : `thumbStatus = error`, pin en fond `fog`, nouvel essai au lancement suivant. La validation du lieu, elle, ne doit pas échouer à cause de la vignette.
37. **Restauration sur un nouveau téléphone.** Si les données sont restaurées sans les vignettes, elles sont régénérées depuis les sources encore accessibles ; sinon `sourceMissing` et fond `fog`.
38. **Accès galerie limité ou retiré (iOS, Android).** Pins inchangés grâce aux vignettes. La fiche explique pourquoi la photo en grand n'est pas disponible et propose d'ouvrir les réglages, sans insister.
39. **Rotation de l'écran (paysage).** Les pins restent droits par rapport à l'écran, zones de toucher inchangées, regroupement recalculé sur les nouvelles dimensions.
40. **Carte tournée par l'utilisateur** (geste de rotation de la carte, si autorisé). Les pins restent droits par rapport à l'écran, pas par rapport au nord.
41. **Toucher rapide pendant un dézoom** (une pile se forme sous le doigt). Le toucher va à l'élément présent au début du toucher. Si ce n'est plus possible, il est ignoré plutôt que d'ouvrir un mauvais lieu.
42. **Deux doigts sur deux pins.** Seul le premier toucher compte.
43. **Toucher avec des gants ou imprécis.** Zones de 48 px pour le pin plein, plus généreuses que le visuel. En cas de chevauchement imprévu, le pin le plus proche du point touché gagne.
44. **Lieu validé pendant que la carte est ouverte.** Le brouillard se lève (existant), le pin apparaît en état chargement puis vignette. Il rejoint une pile si besoin, sans faire sauter la carte.
45. **Photo remplacée par l'utilisateur.** Nouvelle vignette, `thumbVersion` incrémenté, ancienne vignette supprimée du disque et du cache.
46. **Captures d'écran avec mode discret coupé.** Comportement normal, rien n'est bloqué. Voir section 7.2.

## 9. Tests

### 9.1 Unitaires

| Cas | Résultat attendu |
|---|---|
| Angle pour 10 000 identifiants aléatoires | Toujours entre -4° et +4°, jamais 0°, même angle à chaque appel pour un même identifiant |
| Calcul du cadrage 1:1 et 4:3 sur une image 4000 × 3000, 3000 × 4000, 12000 × 2000 | Rectangle dans l'image, bon ratio, valeurs normalisées 0 à 1 |
| Cadrage avec chacune des 8 orientations EXIF | Après orientation, le rectangle désigne la même zone visuelle |
| Cadrage invalide (x = 1,4, ratio « 16:9 ») | Retour au défaut 1:1 centré |
| Générateur de libellé d'un pin (avec et sans voyage, sans photo, photo cachée) | Texte exact de la section 3.10 |
| Générateur de libellé d'une pile de 1, 2, 12, 150 lieux, mode superposé ou non | « Groupe de 2 lieux : A et B. », « Groupe de 12 lieux, dont A, B et 10 autres. », chiffre affiché « 99+ » pour 150 mais annonce « 150 lieux » |
| Signe de voyage : « Été », « Espoo », « 2026 Tallinn », « 🌲 forêt », « ... » | É/E en conflit selon la règle retenue (voir section 12), « 2 », « f », symbole automatique |
| Conflit d'initiales avec un signe choisi à la main | Le signe manuel n'est jamais écrasé |
| Choix de taille de pin selon le zoom | Pin plein, compact, piles seules aux bons seuils |
| Règle de regroupement à 48 px | Aucune paire de zones de toucher qui se chevauche sur un jeu de 2 000 points aléatoires à chaque zoom |
| Masquage | Un lieu `hiddenOnMap` ou en mode discret ne renvoie jamais d'URI de vignette au rendu, pile comprise |

### 9.2 Intégration

| Cas | Résultat attendu |
|---|---|
| Valider un lieu avec une photo JPEG | Vignette créée dans le dossier documents, `thumbStatus = ok`, fichier sans EXIF (vérifié en lisant les métadonnées), taille sous 20 Ko |
| Valider avec une photo HEIC portrait (orientation 6) | Vignette droite, sans EXIF |
| Supprimer la photo d'origine de la galerie puis rouvrir l'app | Pin intact, fiche affiche le texte du cas 1 |
| Photo corrompue (fichier tronqué) | `thumbStatus = error`, pin `fog`, pas de plantage, un seul nouvel essai au lancement suivant |
| Photo de 150 Mpx | Vignette créée sans dépasser le budget mémoire, ou abandon propre (cas 4) |
| Recadrer depuis la fiche | Nouvelle vignette, ancienne supprimée, pin mis à jour sans relancer la carte |
| Supprimer un lieu | Vignette absente du disque |
| Supprimer un voyage | Pins conservés, tampon retiré |
| Mise à jour avec 300 anciens lieux | Vignettes générées par lots, carte utilisable tout du long |
| Disque plein simulé | Lieu validé quand même, pin `fog` |
| Retrait de la permission galerie | Pins intacts, message dans la fiche seulement |

### 9.3 Bout en bout

| Parcours | Résultat attendu |
|---|---|
| Prendre une photo, recadrer en « Paysage », valider, revenir à la carte | Pin 4:3 à l'emplacement, incliné, fiche ouverte au toucher |
| « Passer » au recadrage | Pin 1:1 centré |
| Dézoomer de la rue à toute la ville avec 50 lieux | Piles qui se forment, chiffres justes, plus aucune vignette au zoom lointain |
| Toucher une pile de 12 | Zoom jusqu'à séparation |
| Toucher une pile de 2 lieux au même immeuble au zoom maximal | Feuille « 2 lieux ici » |
| Afficher 2 voyages « Été » et « Espoo » | Symboles différents sur les pins, légende juste |
| Activer « Mode discret » depuis la carte | Toutes les vignettes remplacées par `fog` + numéro, indicateur « Photos cachées » visible, coupure en un toucher |
| Masquer une photo depuis la fiche | Pin `fog` + numéro, aussi dans la feuille de pile |
| Filtre sur un voyage | Les autres lieux disparaissent des pins et des chiffres de pile, encart « N lieux cachés par le filtre » |

### 9.4 Accessibilité

| Cas | Résultat attendu |
|---|---|
| VoiceOver et TalkBack sur un pin | Annonce exacte de 3.10, focus droit autour de la zone, double toucher ouvre la fiche |
| Lecteur d'écran sur une pile | Annonce « Groupe de… », action « Voir la liste » disponible |
| Couche image | Jamais annoncée, jamais focalisable |
| Inspecteur d'accessibilité | Zones de toucher ≥ 44 × 44 px (48 pour le pin plein) à tous les zooms |
| Contraste en clair et en sombre | Chiffre de pile, tampon de voyage, numéro de l'état masqué ≥ 4,5:1 |
| Mode superposé en niveaux de gris | Les voyages restent distinguables grâce aux signes |
| « Réduire les animations » actif | Aucun fondu, recentrage instantané, état final direct |
| Recadrage avec lecteur d'écran | Boutons « Agrandir », « Réduire », flèches et « Passer » atteignables |
| Texte système à la taille maximale | Chiffres et tampons lisibles, rien de coupé, zones agrandies |

### 9.5 Performance

| Cas | Résultat attendu (à confirmer sur l'appareil de référence, section 11) |
|---|---|
| 500 lieux répartis dans Helsinki, déplacement et zoom continus 30 s sur un Android d'entrée de gamme | Pas de saccade visible, au moins 50 images par seconde la plupart du temps |
| 300 lieux au même endroit | Une pile, ouverture de la feuille en moins de 300 ms, défilement fluide |
| Mémoire après 5 min de navigation avec 2 000 lieux | Stable, pas de croissance continue, cache dans sa limite |
| Batterie : 30 min de carte ouverte écran allumé, avant et après la feature | Écart faible (seuil à fixer après une première mesure) |
| Premier affichage de la carte avec 500 vignettes déjà créées | Carte touchable en moins d'une seconde, vignettes visibles en moins de 2 s |

### 9.6 Tests terrain (Helsinki)

| Cas | Résultat attendu |
|---|---|
| Plein soleil, Esplanadi | Pins repérables, chiffres de pile lisibles |
| Hiver, gants tactiles, en marchant | Toucher un pin plein ouvre la bonne fiche du premier coup au moins 9 fois sur 10 |
| Kauppatori, plusieurs lieux serrés | Piles compréhensibles, feuille utile |
| Montrer la carte à quelqu'un | Le mode discret s'active en moins de 3 secondes sans chercher |
| Une main, pouce seul, grand téléphone | Pins près des bords et sous les contrôles atteignables en déplaçant la carte |
| Mode sombre le soir | Pas d'éblouissement des cadres, contraste correct |

## 10. Critères d'acceptation

- [ ] Chaque lieu validé visible avec le filtre actif apparaît comme pin photo ; le repère numéroté a disparu de la carte.
- [ ] Toucher un pin ouvre la bonne fiche, le pin reste visible au-dessus de la fiche.
- [ ] La couche image est inclinée entre -4° et +4°, angle fixe par lieu ; la zone de toucher, les contours d'état, le chiffre et le tampon de voyage ne tournent jamais.
- [ ] Zones de toucher ≥ 48 px (pin plein) et ≥ 44 px (le reste), sans chevauchement.
- [ ] Au dézoom, les pins proches forment des piles avec un chiffre juste (« 99+ » au-delà) ; toucher zoome, ou ouvre la liste au zoom maximal.
- [ ] Au zoom lointain, aucune vignette n'est chargée.
- [ ] En mode superposé, chaque pin rattaché à un voyage porte une initiale ou un symbole ; deux voyages affichés n'ont jamais le même signe automatique.
- [ ] Lieu sans photo, photo illisible ou photo absente : polaroïd à fond `fog`, fiche avec le bon texte et une action.
- [ ] Photo supprimée de la galerie : le pin garde sa vignette.
- [ ] Recadrage 1:1 ou 4:3 à la validation et depuis la fiche ; « Passer » donne 1:1 centré ; l'original n'est pas modifié.
- [ ] Orientation EXIF correcte pour les 8 valeurs ; vignettes sans aucune métadonnée.
- [ ] Mode discret et masquage individuel fonctionnent partout (carte, piles, feuille).
- [ ] Aucune vignette n'est envoyée à Supabase en phase 1 (vérifié sur le trafic réseau).
- [ ] Supprimer un lieu supprime sa vignette.
- [ ] Les textes d'aide sur la confidentialité sont vrais (copie locale, sauvegarde du téléphone selon le cas, captures d'écran).
- [ ] Clair et sombre conformes aux tokens, aucune valeur en dur, contraste ≥ 4,5:1 sur tout texte.
- [ ] Lecteur d'écran : pins et piles annoncés comme en 3.10, décor caché, action « Voir la liste ».
- [ ] « Réduire les animations » : tout saute à l'état final.
- [ ] Aucune animation au-delà de 450 ms, aucun rebond.
- [ ] Le point de position est au-dessus des pins ; les contrôles prennent le toucher dans leur zone.
- [ ] Objectifs de performance de 9.5 atteints sur l'appareil de référence.
- [ ] DESIGN.md mis à jour avec la section « Pins photo ».

## 11. Hypothèses à vérifier

1. Bibliothèque de carte utilisée (react-native-maps, Mapbox ou autre) et façon dont les repères numérotés sont rendus aujourd'hui (marqueurs natifs, vues React, couche de symboles). Ça change la façon de faire les pins (vue tournée dans un marqueur, image pré-rendue, couche native) et les performances.
2. Existence d'un regroupement de marqueurs dans le code (bibliothèque de clustering ou rien).
3. Comment la photo de validation est stockée : copie dans le dossier de l'app, référence vers la galerie, les deux. Si une copie complète existe déjà, le cas 1 est en partie déjà réglé et la phrase d'aide sur la confidentialité doit le mentionner.
4. Un lieu peut-il être validé sans photo aujourd'hui (validation manuelle, migration) ?
5. Outils disponibles avec Expo pour redimensionner, orienter et retirer l'EXIF (expo-image-manipulator ou équivalent), et si ce traitement retire bien toutes les métadonnées.
6. Rendu des images sur la carte (expo-image ou autre) et capacité de cache mémoire réglable.
7. Modèle de données local actuel du lieu et du voyage (SQLite, AsyncStorage, autre) et système de migration.
8. Ordre des couches actuel : brouillard, trajets, repères, position. Le brouillard est-il une couche native ou une vue au-dessus de la carte ?
9. La fiche du lieu est-elle une feuille du bas ? Quelle hauteur ? Ça fixe les marges de recentrage.
10. Noms exacts des tokens dans `app/src/theme/tokens.ts`, présence des versions sombres de `paperWhite`, `fog` et `ink`.
11. Existence d'une liste des lieux (alternative à la carte pour le lecteur d'écran).
12. Possibilité de valider un lieu hors des limites de la carte de Helsinki.
13. Possibilité de changer un lieu de voyage après coup.
14. Politique de sauvegarde des données de l'app (iCloud, sauvegarde Android) : incluses ou exclues.
15. La carte autorise-t-elle la rotation par geste ?
16. Appareil Android de référence pour les tests de performance.
17. Flux actuel de la validation (écrans après la photo) : où insérer le recadrage sans casser le flux existant.

## 12. Questions ouvertes

1. Faut-il un format portrait (3:4) en plus de 1:1 et 4:3 ? Beaucoup de photos de téléphone sont en portrait.
2. Initiale sensible aux accents : « É » et « E » sont-ils en conflit ? Proposition : oui, pour éviter la confusion à 16 px.
3. Le mode discret doit-il pouvoir s'activer automatiquement (par exemple au partage d'écran ou à la recopie vidéo) ?
4. Flouter la carte dans l'aperçu du sélecteur d'apps quand le mode discret est actif ?
5. Proposer plus tard une suggestion sur l'appareil quand une photo montre peut-être une personne ?
6. Phase 3 : à partir de combien de signalements une photo partagée est-elle masquée pour tout le monde, et qui la revoit ?
7. Limite du nombre de voyages affichés en même temps en mode superposé (au-delà de 8, les signes deviennent difficiles à retenir) ?
8. Le chiffre des piles doit-il indiquer « 99+ » ou le vrai nombre jusqu'à 999 ?
9. Faut-il une « zone privée » (autour du domicile) où les pins sont toujours masqués, même hors mode discret ? Ça rejoint une éventuelle feature plus large sur le trajet.
10. Garde-t-on le numéro du tampon visible sur les pins à la demande (réglage) pour ceux qui aimaient les repères numérotés ?
11. Seuils de zoom exacts entre pin plein, compact et piles seules : à fixer après les tests terrain.

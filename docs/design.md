# Détour : charte graphique

Lis ce fichier avant de créer ou modifier un écran ou un composant. Il remplace l'ancienne version (parchemin, orange Lanterne, vert Sentier, Fraunces 600 et Inter), qui était trop rudimentaire et ne portait pas l'esprit de l'app.

Référence visuelle : le canvas « Détour, direction carnet de voyage » (https://claude.ai/artifact/UtVQy8ZYtA5ju55kidNP9m). En cas de doute, le canvas fait foi pour l'apparence, ce fichier fait foi pour les valeurs et les règles.

Ne mets jamais une couleur, une taille ou une police en dur dans un composant. Tout vient de `app/src/theme/tokens.ts`.

## Ambiance

Détour est un carnet de voyage de poche. On ne consulte pas une carte froide, on remplit un carnet : on y colle des photos, on y pose des tampons, on y trace des chemins au crayon. Le tout doit sembler fait à la main, vagabond et un peu bohème, jamais lisse ni corporate.

Trois idées guident tout le reste :

- **Le brouillard est du papier encore vierge.** Ce qui n'est pas découvert reste hachuré et pâle. Ce qui est découvert se colorie.
- **Chaque lieu devient une page du carnet.** Photo en polaroïd, note manuscrite, tampon numéroté.
- **Tout bouge comme du papier.** On glisse, on se redresse, on se pose. Pas de rebond de dessin animé.

À éviter : look de GPS, néons, dégradés, verre dépoli, coins très arrondis, blanc pur, gris froid, ton publicitaire.

## Couleurs

### Mode clair (la référence)

| Token | Nom | Valeur | Usage |
|---|---|---|---|
| `paper` | Papier | `#EFE4CC` | Fond des écrans |
| `paperLight` | Papier clair | `#FBF6E8` | Billets, lignes, étiquettes |
| `paperWhite` | Papier blanc | `#FFFDF6` | Polaroïds, cartes mises en avant |
| `kraft` | Kraft | `#D9C39A` | Fonds de démos, séparations |
| `fog` | Brouillard | `#E2D2AE` | Zones non découvertes (avec hachures) |
| `ink` | Encre | `#2A2630` | Texte, contours, barre d'onglets |
| `stamp` | Tampon | `#B13F2C` | Action principale, validation, trajets |
| `lantern` | Lanterne | `#E3A33B` | Lieux révélés, scotch, onglet actif |
| `sage` | Sauge | `#6F8660` | Parcs, nature, zones découvertes |
| `postal` | Bleu postal | `#38577A` | Eau, étiquettes secondaires, kickers |
| `muted` | Encre douce | `#5E5866` | Texte secondaire, aides, légendes |

### Mode sombre (validé)

Même logique : un carnet de nuit. Les écrans Carte et Moi existent en version sombre sur le canvas.

| Token | Valeur |
|---|---|
| `paper` | `#1C1A21` |
| `paperLight` | `#26232C` |
| `paperWhite` | `#2F2B36` |
| `ink` (texte, contours) | `#EFE4CC` |
| `stamp` | `#E8765F` |
| `fog` | `#2B2832` |
| `kraft` (séparations) | `#3A3641` |
| `muted` | `#B3AAA0` |
| barre d'onglets | `#121017` |
| `postal` (texte) | `#7FA3CC` |
| brun des tampons | `#C9A860` |

`lantern`, `sage` et `postal` (en surface, comme l'eau de la carte) restent identiques. Le texte sur un bouton `stamp` passe en `#1C1A21`, car du blanc sur `#E8765F` n'atteint pas 4,5:1. Les ombres deviennent noires (35 %) et les contours des traits clairs à 35 %.

### Règles d'usage

- Une seule action principale par écran, en `stamp`. Le texte dessus est en `paperWhite` (contraste 5,5:1).
- `lantern` et `sage` ne portent jamais de texte sur fond `paper` (contraste trop faible). Ils servent de couleur de surface ou de décor.
- `postal` sert aux petites étiquettes en capitales (11 à 13 px), au contraste suffisant sur `paper`.
- Pas d'autre rouge que `stamp`, pas d'autre gris que `fog` sur la carte.
- Contraste minimum 4,5:1 pour tout texte. `app/src/theme/tokens.test.ts` vérifie les paires de la charte dans les deux modes : ajoute-y toute nouvelle combinaison.

## Typographie

Quatre voix, chacune avec un rôle précis. Ne les mélange pas.

| Rôle | Police | Usage | Taille typique |
|---|---|---|---|
| Titres | Fraunces italique 700 | Noms de lieux, titres d'écran, wordmark | 20 à 38 px |
| Notes à la main | Caveat 700 | Annotations, légendes de photo, mots doux | 20 à 28 px |
| Tampons et étiquettes | Special Elite 400 | Dates, compteurs, kickers, boutons, onglets | 11 à 17 px |
| Texte courant | DM Sans 400, 500, 700 | Descriptions, histoires, aide | 14 à 15 px |

- Kickers en capitales avec `letterSpacing` 0.12 à 0.16 em.
- Interligne du texte courant : 1.5. Titres : 1.05 à 1.1.
- Une phrase manuscrite fait une ou deux lignes. Au-delà, passe en DM Sans.
- Paquets Expo : `@expo-google-fonts/fraunces`, `@expo-google-fonts/caveat`, `@expo-google-fonts/special-elite`, `@expo-google-fonts/dm-sans`.

## Matières et gestes

Ces éléments donnent le caractère de l'app. Chacun a une règle.

- **Papier** : fond `paper` avec une fine ligne de cahier (1 px, encre à 5 %, tous les 30 px).
- **Polaroïd** : cadre `paperWhite`, bord bas plus épais pour la légende manuscrite, ombre portée douce, rotation de -5° à +5°. Il contient la vraie photo du voyageur.
- **Scotch** : petit rectangle `lantern` à 70 % d'opacité, rotation de ±5°, posé à cheval sur le bord haut. Uniquement sur polaroïds et cartes mises en avant.
- **Billet** : fond `paperLight`, séparation en pointillés, deux encoches rondes aux extrémités du pointillé. Sert aux sorties.
- **Tampon** : double contour (3 px), capitales Special Elite, rotation de -14° à +6°. Sert à valider (`VALIDÉ 004`), compter ou signaler (`CHOISIE`).
- **Pointillé de trajet** : `stamp`, points ronds (`strokeDasharray` 2 9, extrémités rondes), fin du trajet marquée d'une croix.
- **Rotation** : réservée aux éléments décoratifs (polaroïds, billets, tampons, notes). Boutons, champs et barre d'onglets restent droits ou à 1° maximum.
- **Ombres** : toujours chaudes (encre à 20 à 30 %), jamais bleutées.

## Composants

- **Barre d'onglets** : fond `ink`, 76 px. Cinq entrées : Carte, Sorties, appareil photo (rond `stamp`, 56 px, bordure `paper`, qui dépasse de 26 px), Cercle, Moi. Onglet actif en `lantern`, les autres en `paper`. Libellés en Special Elite 12 px.
- **Bouton principal** : fond `stamp`, texte `paperWhite`, Special Elite, capitales, 52 px de haut, coins 4 px.
- **Bouton secondaire** : contour 2 px `ink`, fond transparent. Variante danger : contour `stamp`.
- **Pastille de filtre** : 44 px de haut, contour 2 px. Active : fond `ink`, texte `paper`.
- **Interrupteur** : piste 52 x 30, `stamp` allumé, kraft éteint. Toute la ligne est la zone de toucher (`role=switch`).
- **Champ** : contour 2 px `ink`, fond `paperWhite`, 48 à 52 px. Libellé visible au-dessus, en capitales `stamp`.
- **Bouton retour** : rond de 44 px, contour 2 px `ink`.
- **Carte « fiche »** : `paperWhite`, ombre portée, scotch, rotation légère.
- **Cible tactile** : 44 px minimum, partout.

## La carte

- **Types de carte** (réglage) : Carnet (défaut), Classique (couleurs OpenStreetMap, style `liberty`) et Sombre (carte en `colorsDark`). Le brouillard, les repères et le trajet suivent la palette de la carte.
- Fond `paper`. Eau en `postal` à 55 %. Parcs en `sage`. Bâtiments en `lantern` à 50 %.
- **Brouillard** : motif hachuré à 35° (traits `ink` à 12 %, tous les 9 px) sur `fog`, percé de « trous » aux contours irréguliers autour des lieux validés. Le contour d'un trou est un pointillé fin.
- **Repères** : disque `paperLight` avec contour `stamp`, numéro Special Elite. Un repère choisi est plein `stamp`. Un repère à ajouter est en pointillés avec un « + ».
- **Annotations** : noms de lieux en Caveat 22 px, légèrement inclinés. Zones inconnues marquées « terra incognita » en Caveat à 55 % d'opacité.
- **Position de l'utilisateur** : point `postal` avec anneau à 25 %.
- **Boussole** : en haut de carte, contour fin, aiguille `stamp`.
- **Tracé de balade** : le trait se colle au chemin le plus proche (réglage activé par défaut). Pendant le dessin, on affiche le geste d'origine en pointillés fins `ink` et le tracé recollé en `stamp`. L'aimant de la barre d'outils coupe l'accroche pour les parcs et les cours.

## Mouvements

| Moment | Durée | Courbe | Description |
|---|---|---|---|
| Changer d'onglet | 320 ms | ease-out | La page entrante glisse de 46 px en se redressant de 2°, l'ancienne s'efface de l'autre côté |
| Valider un lieu | 450 ms + 140 ms | ease-out | Le polaroïd monte depuis le bouton photo, puis le tampon claque, avec une petite vibration |
| Brouillard qui se lève | 900 ms | ease-in-out | Le trou s'agrandit autour du lieu, la couleur apparaît dessous |
| Lancement | 3,5 s max | linéaire puis fondu 300 ms | Le trajet se dessine, le mot se pose, la croix se tamponne, le brouillard se retire |

- Rien au-delà de 450 ms sauf le lancement et le brouillard.
- Pas de rebond de dessin animé.
- Si « réduire les animations » est activé, tout saute à l'état final.
- Coupe l'écran de lancement dès que l'app est prête.

## Identité

- **Nom** : détour, en minuscules.
- **Logotype** : « détour » en Fraunces italique 700, suivi d'une petite croix de fin de trajet (`stamp` sur papier clair, `lantern` sur fond sombre). Le trajet pointillé complet est réservé à l'écran de lancement et à l'icône.
- **Icône d'app** : couverture sombre `ink`, couture ocre sur le bord gauche, « d » italique `paper`, trajet pointillé `lantern` qui finit par une croix. À petite taille (40 px), le pointillé disparaît et il reste la lettre et la croix.
- Export final, dans `app/assets/brand/` : `detour-icon-1024.svg` et `.png` (lettre en tracés, 1024 px, sans coins arrondis, le téléphone les applique), `detour-icon-foreground.svg` (sans fond, pour l'icône adaptative Android, à placer sur un fond `#2A2630`), `detour-logotype-ink.svg` (sur papier clair, croix `stamp`) et `detour-logotype-paper.svg` (sur fond sombre, croix `lantern`). Ne retape jamais le nom avec une police : utilise ces fichiers.
- Dans `app.json` : `icon` = le PNG 1024, `android.adaptiveIcon.foregroundImage` = le foreground, `backgroundColor` = `#2A2630`. Retire les anciens `app/assets/logo-detour*.svg`.

## Écrans

| Écran | Rôle |
|---|---|
| Chargement | Lancement animé |
| Carte | Plan du quartier, brouillard, prochain détour proposé |
| Valider un lieu | Après la photo : polaroïd, tampon, « Coller dans le carnet » |
| Fiche d'un lieu | Photo, histoire, mots-clés, sorties associées |
| Sorties | Liste de billets, filtres (ce soir, week-end, gratuit) |
| Détail d'une sortie | Quand, prix, où, thème, qui y va |
| Cercle | Fil de pages et de cartes des autres |
| Cercle, sous-pages | Carte partagée, profil voyageur, mots doux, balades, laisser une balade, dessiner sa balade |
| Moi | Couverture du carnet, tampons, cartes de villes |
| Moi, sous-pages | Pages collées, données, réglages, débloquer une ville |
| Compte | Connexion par e-mail, code à 6 chiffres, compte, déconnexion, suppression. Demandé seulement pour partager, commenter ou laisser une balade |

## Textes

- Français, tutoiement, ton chaleureux et simple. Phrases courtes.
- Les phrases manuscrites sont des petites remarques, pas des slogans : « 8 min à pied de chez toi », « encore un peu, jusqu'au 3 ».
- Pas de point d'exclamation en série, pas d'argot marketing, pas de tiret cadratin.
- Les textes passent par le fichier de traduction. Les prix, adresses et versions encore inconnus restent en `[PRIX]`, `[ADRESSE]`, `[VERSION]` tant qu'ils ne sont pas définis.
- Toute affirmation sur les données personnelles doit rester vraie dans le produit (position sur l'appareil, photos sur l'appareil par défaut).

## Accessibilité

- Cible tactile de 44 px minimum, libellés visibles sur chaque champ.
- Icône seule : toujours un `accessibilityLabel`.
- Le texte manuscrit reste lisible : jamais sous 20 px, jamais en `lantern` ou `sage` sur `paper`.
- Les éléments décoratifs (scotch, rotations, hachures) sont cachés aux lecteurs d'écran.
- La couleur seule ne porte jamais l'état : un repère choisi est aussi plein, une pastille active aussi inversée.

## Tokens (à copier dans `tokens.ts`)

```ts
export const colors = {
  paper: '#EFE4CC',
  paperLight: '#FBF6E8',
  paperWhite: '#FFFDF6',
  kraft: '#D9C39A',
  fog: '#E2D2AE',
  ink: '#2A2630',
  stamp: '#B13F2C',
  lantern: '#E3A33B',
  sage: '#6F8660',
  postal: '#38577A',
  muted: '#5E5866',
  tabBar: '#2A2630',
  onTabBar: '#EFE4CC',
  postalText: '#38577A',
  brownStamp: '#6F5A2A',
  onStamp: '#FFFDF6',
} as const;

export const colorsDark = {
  ...colors,
  paper: '#1C1A21',
  paperLight: '#26232C',
  paperWhite: '#2F2B36',
  kraft: '#3A3641',
  fog: '#2B2832',
  ink: '#EFE4CC',
  stamp: '#E8765F',
  muted: '#B3AAA0',
  tabBar: '#121017',
  onTabBar: '#EFE4CC',
  postalText: '#7FA3CC',
  brownStamp: '#C9A860',
  onStamp: '#1C1A21',
} as const;

export const fonts = {
  title: 'Fraunces_700Bold_Italic',
  hand: 'Caveat_700Bold',
  stamp: 'SpecialElite_400Regular',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { card: 4, pill: 26, round: 999 } as const;
export const motion = { tab: 320, polaroid: 450, stamp: 140, fog: 900, splash: 3500 } as const;
```

## Règles pour les agents

1. Toute couleur, taille et police vient des tokens. S'il en manque un, ajoute-le ici et dans `tokens.ts` avant de l'utiliser.
2. Chaque composant fonctionne en mode clair et en mode sombre, uniquement via les tokens du thème. Le texte sur un bouton `stamp` suit le mode (clair en clair, `#1C1A21` en sombre).
3. Une seule action principale par écran.
4. Les rotations restent décoratives, jamais sur un élément interactif.
5. Si une demande contredit cette charte, signale-le au lieu de contourner.
6. Si tu ajoutes un composant, vérifie qu'il utilise l'une des quatre voix typographiques et l'une des matières ci-dessus.

## Points ouverts

- Photos réelles dans les polaroïds : l'utilisateur recadre au moment de la photo (1:1 ou 4:3) ; prévoir un fond de secours en `fog`.
- Accroche du tracé de balade : OpenRouteService `foot-walking`, déjà utilisé pour l'itinéraire. Un appel par tracé validé, pas par mouvement du doigt (quota de la clé).
- Modération des balades : plus tard, publication directe au début.
- Les noms, lieux et textes d'exemple du canvas sont inventés et doivent être remplacés par de vraies données.

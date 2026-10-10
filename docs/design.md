# Détour : charte graphique

Lis ce fichier avant de créer ou modifier un écran ou un composant. Les valeurs ci-dessous sont la référence. Ne mets jamais une couleur ou une taille en dur dans un composant, utilise les tokens de `app/src/theme/tokens.ts`.

C'est une première version. Les choix marqués "à valider" peuvent changer.

## Marque

- **Nom** : Détour (sortir du chemin le plus rapide pour découvrir ce qu'il y a autour).
- **Logo** : un cercle plein couleur Lanterne qui émerge du brouillard, avec un halo de lumière. Le concept de l'app en un seul symbole.
- Fichiers : `app/assets/logo-detour.svg` (version complète, avec dégradés), `app/assets/logo-detour-flat.svg` (version simplifiée en aplats), `app/assets/logo-detour-1024.png` (aperçu 1024 px, pas encore fourni).
- **Logotype** : le mot « détour » en minuscules, entouré d'un chemin angulaire Sentier qui part d'un cercle vide (le départ) et finit sur un point Lanterne (le lieu découvert). Sert aux en-têtes, à l'écran d'accueil et aux supports, pas à l'icône de l'app.
- Fichiers : `app/assets/logo-detour-wordmark.svg` (fond clair : Encre et Sentier), `app/assets/logo-detour-wordmark-dark.svg` (fond sombre : Craie et Sentier clair). Fond transparent, à poser sur Parchemin ou Nuit.
- Pour l'icône de l'app, exporte le SVG en PNG 1024 x 1024 sans transparence. Garde le cercle centré, avec de la marge autour.
- Ne modifie pas les couleurs du logo. Le fond est toujours Brume (`#D5D9DD`) ou, en sombre, Brume nuit (`#2B343C`).

## Ambiance

Détour, c'est la curiosité et la balade. On doit avoir l'impression de déplier une vieille carte d'explorateur et de la voir se remplir de couleur au fil des découvertes.

- **Chaleureux et humain**, pas froid ni technique.
- **Calme** : on marche, on lève les yeux, l'interface ne doit pas crier.
- **Le contraste central** : ce qui n'est pas découvert est dans le brouillard (gris doux, effacé), ce qui est découvert est vivant et coloré.

À éviter : look de GPS classique, néons, dégradés flashy, ton corporate.

## Couleurs

### Mode clair

| Rôle | Nom | Valeur |
|---|---|---|
| Fond de l'app | Parchemin | `#F6F1E7` |
| Surface (cartes, feuilles) | Papier | `#FFFFFF` |
| Texte principal | Encre | `#1F2A33` |
| Texte secondaire | Brume foncée | `#5B6670` |
| Accent principal (actions) | Lanterne | `#F2A33A` |
| Texte sur l'accent | Encre | `#1F2A33` |
| Chemins parcourus et lieux découverts | Sentier | `#2F7F79` |
| Brouillard (zones non découvertes) | Brume | `#D5D9DD` |
| Bordures | Trait | `#E3DCCB` |

### Mode sombre

| Rôle | Nom | Valeur |
|---|---|---|
| Fond de l'app | Nuit | `#14191E` |
| Surface | Ardoise | `#1E262D` |
| Texte principal | Craie | `#F2EEE4` |
| Texte secondaire | Brume claire | `#A3ADB5` |
| Accent principal | Lanterne | `#F2A33A` |
| Chemins et lieux découverts | Sentier clair | `#5FB8B0` |
| Brouillard | Brume nuit | `#2B343C` |
| Bordures | Trait nuit | `#2F3A43` |

### Couleurs d'état

| État | Valeur |
|---|---|
| Succès (lieu validé) | `#3E9B5F` |
| Erreur | `#C94B3B` |
| Information | `#3C7DB5` |

### Règles d'usage

- L'accent Lanterne sert aux actions principales (prendre une photo, valider). Un seul bouton accent par écran.
- Le texte sur l'accent est toujours en Encre, jamais en blanc (contraste insuffisant).
- Le vert Sentier est réservé à ce qui est découvert : chemins, lieux validés, badges. Ne l'utilise pas pour de la décoration.
- Le brouillard est la seule couleur "éteinte" de la carte. Pas d'autre gris sur la carte.
- Vise un contraste d'au moins 4,5:1 pour le texte (WCAG AA) et vérifie les nouvelles combinaisons.

## Typographie

- **Titres** : Fraunces (serif chaleureux, esprit carte ancienne), poids 600. À valider.
- **Texte et interface** : Inter, poids 400, 500 et 600.
- Chargement avec `@expo-google-fonts/fraunces` et `@expo-google-fonts/inter`.

| Style | Police | Taille | Interligne | Poids |
|---|---|---|---|---|
| Titre 1 | Fraunces | 28 | 34 | 600 |
| Titre 2 | Fraunces | 22 | 28 | 600 |
| Titre 3 | Inter | 18 | 24 | 600 |
| Corps | Inter | 16 | 24 | 400 |
| Corps petit | Inter | 14 | 20 | 400 |
| Légende | Inter | 12 | 16 | 500 |
| Bouton | Inter | 16 | 20 | 600 |

Respecte la taille de texte système de l'utilisateur (accessibilité), ne bloque pas le zoom.

## Espacements et formes

- Grille de 4 : `4, 8, 12, 16, 24, 32, 48`.
- Marge latérale des écrans : 16.
- Rayons : petits éléments 8, cartes 16, feuilles du bas 24, boutons et badges en pilule (999).
- Ombres douces, une seule intensité pour les cartes : léger flou, opacité faible. Pas d'ombres dures.
- Zone tactile minimale : 44 x 44.

## La carte

C'est l'élément le plus important de l'app.

- **Fond de carte** : style MapLibre sobre et chaud, en harmonie avec le Parchemin (clair) ou Nuit (sombre). Peu de labels.
- **Brouillard** : couche couleur Brume par-dessus la carte, avec une opacité élevée mais pas totale, pour qu'on devine qu'il y a quelque chose. Les bords des zones découvertes sont adoucis (dégradé), jamais coupés net.
- **Zones découvertes** : la carte est visible et en couleur autour des lieux validés et des chemins parcourus.
- **Chemins parcourus** : trait Sentier, 4 de large, extrémités arrondies.
- **Lieux découverts** : marqueur Sentier avec la miniature de la photo prise.
- **Lieux non découverts** : pas de marqueur sur la carte. Seulement une flèche de direction, couleur Lanterne, avec la distance.
- **Position de l'utilisateur** : point Lanterne avec un halo léger.
- L'apparition d'une zone nouvellement découverte est animée (le brouillard se dissipe, environ 600 ms).

## Composants

### Bouton principal
Fond Lanterne, texte Encre, pilule, hauteur 52. État pressé : légèrement plus foncé. État désactivé : opacité réduite.

### Bouton secondaire
Fond transparent, bordure Trait, texte Encre, même taille que le principal.

### Carte de lieu
Fond Papier, rayon 16, ombre douce. Photo en haut (si découvert), titre, catégorie et distance. Non découvert : la photo est remplacée par un aplat Brume avec une icône de point d'interrogation.

### Badge "Découvert"
Pilule Sentier avec texte blanc ou Craie, taille Légende. Le contraste doit rester suffisant.

### Écran de prise de photo
Plein écran, interface minimale. Le bouton de capture est une grande pastille Lanterne en bas au centre. Un message court indique si le lieu est à portée ("Tu y es presque" / "Rapproche-toi").

### Feuille du bas
Fond Papier, rayon 24 en haut, poignée centrée. Sert à la liste des lieux proches et au détail d'un lieu.

### Barre de navigation
Trois onglets maximum : Carte, Découvertes (ses photos et lieux), Profil. Icône active en Lanterne, les autres en Brume foncée.

## Icônes et images

- Jeu d'icônes unique, trait de 2, extrémités arrondies (Lucide ou Phosphor). Ne mélange pas deux jeux.
- Les photos des utilisateurs sont affichées avec un rayon de 12 et jamais déformées (recadrage, pas d'étirement).
- Illustrations : simples, à plat, tons Parchemin et Sentier. Pas de photos de stock.

## Ton des textes

- Tutoiement, phrases courtes, ton amical.
- Encourager sans pousser : "Il y a quelque chose par là" plutôt que "Allez, découvre vite !".
- Pas de jargon technique ni de ton corporate.
- Exemples : "Lève les yeux, tu y es presque", "Nouvelle zone découverte", "Cette carte se débloque pour 2,99 €".

## Mouvement

- Animations courtes (150 à 300 ms), douces, pas de rebond exagéré.
- Seule animation "spéciale" : la dissipation du brouillard à une découverte. Elle doit être le moment fort de l'app.
- Respecte le réglage "réduire les animations" du système.

## Tokens (à copier dans `app/src/theme/tokens.ts`)

```ts
export const palette = {
  light: {
    background: '#F6F1E7',
    surface: '#FFFFFF',
    text: '#1F2A33',
    textMuted: '#5B6670',
    accent: '#F2A33A',
    onAccent: '#1F2A33',
    discovered: '#2F7F79',
    fog: '#D5D9DD',
    border: '#E3DCCB',
  },
  dark: {
    background: '#14191E',
    surface: '#1E262D',
    text: '#F2EEE4',
    textMuted: '#A3ADB5',
    accent: '#F2A33A',
    onAccent: '#1F2A33',
    discovered: '#5FB8B0',
    fog: '#2B343C',
    border: '#2F3A43',
  },
  state: {
    success: '#3E9B5F',
    error: '#C94B3B',
    info: '#3C7DB5',
  },
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 8, photo: 12, md: 16, lg: 24, pill: 999 } as const;

export const font = {
  heading: 'Fraunces_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodyBold: 'Inter_600SemiBold',
} as const;
```

## Règles pour les agents

1. Toute couleur, taille et police vient des tokens. Si un token manque, ajoute-le ici et dans `tokens.ts` avant de l'utiliser.
2. Chaque composant doit fonctionner en mode clair et sombre.
3. Un seul bouton accent par écran.
4. Les textes affichés passent par le fichier de traduction et respectent le ton ci-dessus.
5. Si une demande contredit cette charte, signale-le au lieu de contourner.

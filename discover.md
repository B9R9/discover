# Discover : concept

Source de vérité produit. Stack, structure et règles de code sont dans `CLAUDE.md`.

## Vision

Discover est une app mobile qui montre les activités et les lieux autour de l'utilisateur. La carte est cachée par défaut. Elle se dévoile seulement là où l'utilisateur a découvert un lieu. Explorer la ville revient à révéler la carte.

Public cible : À DÉCIDER

## Boucle de jeu

1. L'utilisateur voit la direction d'un lieu non découvert.
2. Il s'y rend.
3. Il prend le lieu en photo.
4. L'app valide le lieu et dévoile la carte autour.
5. L'app donne désormais l'itinéraire vers ce lieu.

## Règles de découverte

- Validation par photo uniquement. Passer devant ne suffit pas.
- La photo doit être prise à moins de **50 m** du lieu. L'app vérifie la position GPS au moment de la photo.
- Un lieu découvert dévoile la carte dans un rayon de **150 m**.
- Les chemins parcourus pour atteindre un lieu sont aussi dévoilés.

## Navigation

- Lieu découvert : itinéraire.
- Lieu non découvert : direction à vol d'oiseau seulement. Jamais d'itinéraire.

## Cartes et prix

- La carte de la ville de l'utilisateur est offerte.
- Les autres villes sont payantes, en **achat unique par ville** (RevenueCat).
- Prix par ville : À DÉCIDER

## Social

Partage volontaire : photo, commentaire, carte. Rien n'est partagé sans action de l'utilisateur.

## Vie privée

- La position et la carte découverte restent sur l'appareil (SQLite).
- Le serveur ne reçoit jamais l'historique des déplacements.
- Seul ce que l'utilisateur partage volontairement part vers le serveur.

## Sources des lieux

Scraping et APIs, côté serveur uniquement. L'app ne scrape rien. Les conditions d'usage et le `robots.txt` de chaque source sont respectés.

Catégories de lieux : À DÉCIDER

## Hors périmètre v1

À DÉCIDER

## Questions ouvertes

- Public cible
- Prix par ville
- Catégories de lieux
- Hors périmètre v1

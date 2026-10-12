# Détour : concept

Source de vérité produit. Stack, structure et règles de code sont dans `../.claude/CLAUDE.md`.

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

- Une carte couvre un **département**. Les grandes villes (plus de 100 000 habitants, d'après OpenStreetMap) ont leur propre carte, retirée de celle du département : la carte Gironde ne couvre pas Bordeaux.
- L'app est **payante au téléchargement** (prix fixé dans Google Play et l'App Store, pas d'achat dans l'app pour l'ouvrir). Pas d'abonnement.
- Avec l'app, la carte du département où se trouve l'utilisateur au premier lancement est offerte, sans ses grandes villes : elles restent payantes, même pour un habitant de la grande ville.
- Les autres cartes sont payantes, en **achat unique** dans l'app (Google Play, App Store) :
  - une grande ville seule, prix selon son attrait ;
  - un département entier, grandes villes comprises, toujours plus cher que chacune de ses grandes villes ;
  - la France entière, toutes les cartes, plus chère qu'un département.
- Prix par carte : À DÉCIDER

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
- Prix par carte (département, grande ville)
- Catégories de lieux
- Hors périmètre v1

# Détour : guide pour les agents

Lis ce fichier en entier avant de toucher au code. Pour le concept complet, lis `discover.md`.
Avant de créer ou modifier un écran ou un composant, lis `docs/design.md` (charte graphique, tokens dans `app/src/theme/tokens.ts`).

## Le projet en bref

App mobile qui montre les activités et lieux autour de l'utilisateur. La carte est cachée par défaut et ne se dévoile que là où il a découvert un lieu. Pour valider un lieu, il faut le prendre en photo.

- Lieu découvert : l'app donne l'itinéraire.
- Lieu pas découvert : l'app donne seulement la direction à vol d'oiseau.
- La carte de la ville de l'utilisateur est offerte, les autres cartes sont payantes.

## Stack

- App : React Native avec Expo, TypeScript en mode strict
- Carte : `@maplibre/maplibre-react-native`
- Stockage local : `expo-sqlite`
- Caméra et GPS : `expo-camera`, `expo-location`
- Backend : Node.js, TypeScript, Postgres avec PostGIS (Supabase)
- Paiements : RevenueCat

Attention : MapLibre est du code natif, donc Expo Go ne marche pas. Il faut un development build (`npx expo run:ios` ou `run:android`, ou EAS Build).

## Structure du dépôt

```
/app        app Expo (écrans, composants, logique locale)
/server     API Node et jobs de collecte des lieux
/shared     types TypeScript partagés entre app et server
discover.md concept du projet
CLAUDE.md   ce fichier
```

Dans `/app/src` :

```
app/         routes Expo Router, une ligne qui ré-exporte l'écran de screens/
screens/     un fichier par écran
components/  composants réutilisables
features/    logique par fonctionnalité (discovery, map, photo, social)
db/          schéma SQLite et requêtes
lib/         petits utilitaires (dont i18n/ : textes français et t())
```

## Règles de code

1. **Un fichier fait moins de 500 lignes.** Si un fichier approche 400 lignes, découpe-le avant d'ajouter quoi que ce soit.
2. **Une responsabilité par fichier.** Un écran n'embarque pas la logique métier, il appelle une fonction de `features/`.
3. TypeScript strict. Pas de `any`. Si un type est inconnu, utilise `unknown` et valide.
4. Les types partagés vivent dans `/shared`. Ne les duplique pas.
5. Fonctions courtes, noms explicites, en anglais pour le code. Les textes affichés à l'utilisateur sont en français, rangés dans un fichier de traduction, jamais écrits en dur.
6. Pas de nouvelle dépendance sans raison claire. Dis laquelle et pourquoi dans ta réponse.
7. Pas de commentaire qui répète le code. Commente seulement le pourquoi.

## Règles métier à ne jamais casser

- **La position et la carte découverte restent sur l'appareil** (SQLite). Le serveur ne reçoit jamais l'historique des déplacements.
- Seul ce que l'utilisateur partage volontairement (photo, commentaire, carte) part vers le serveur.
- **Un lieu est validé par une photo**, prise à proximité du lieu (vérification par GPS au moment de la photo). Passer devant ne suffit pas.
- La carte est cachée par défaut. Les zones visibles sont celles autour des lieux découverts et des chemins parcourus.
- Un lieu non découvert n'a jamais d'itinéraire, seulement une direction.

## Modèle de données local (SQLite)

- `discovered_places` : id du lieu, date, chemin parcouru, id de la photo
- `photos` : chemin du fichier local, position, date
- `owned_maps` : villes débloquées (offerte ou achetée)

Le serveur garde les lieux (nom, position, source), les cartes partageables, les commentaires et les achats.

## Collecte des lieux (server)

Les lieux viennent de web scraping et d'APIs. Ces jobs tournent côté serveur et écrivent dans Postgres. L'app ne scrape rien et ne parle qu'à notre API, avec une seule exception : la connexion et la session passent directement par Supabase Auth (`app/src/features/account/`). Respecte les conditions d'usage et le robots.txt de chaque source.

## Comment travailler

### 1. Planifier d'abord
- Pour toute tâche non triviale (3 étapes ou plus, ou une décision d'architecture), passe en mode plan.
- Si quelque chose part de travers, arrête-toi et replanifie tout de suite.
- Écris un plan précis avant de coder pour réduire les ambiguïtés.

### 2. Sous-agents
- Utilise des sous-agents pour garder le contexte principal propre.
- Délègue la recherche, l'exploration et les analyses en parallèle.
- Une tâche par sous-agent.

### 3. Boucle d'amélioration
- Après chaque correction de ma part, ajoute la leçon dans `tasks/lessons.md`.
- Écris-toi des règles qui évitent de refaire la même erreur.
- Relis `tasks/lessons.md` au début de chaque session.

### 4. Vérifier avant de dire que c'est fini
- Ne marque jamais une tâche terminée sans preuve que ça marche.
- Lance le typecheck (`npx tsc --noEmit`), les tests, regarde les logs.
- Compare le comportement avant et après quand c'est utile.
- Demande-toi : "Un développeur senior validerait-il ce changement ?"

### 5. Chercher l'élégance, sans en faire trop
- Pour un changement non trivial, demande-toi s'il existe une solution plus propre.
- Si un correctif paraît bricolé, reprends-le avec ce que tu sais maintenant.
- Pour un correctif simple et évident, ne sur-ingénierie pas.
- Challenge ton propre travail avant de me le présenter.

### 6. Bugs : corrige sans qu'on te tienne la main
- Sur un rapport de bug, corrige. Pars des logs, des erreurs et des tests qui échouent.
- Corrige les tests CI qui échouent sans attendre qu'on te dise comment.

### Gestion des tâches
1. Écris le plan dans `tasks/todo.md` avec des cases à cocher.
2. Valide le plan avec moi avant de commencer.
3. Coche les éléments au fur et à mesure.
4. Résume les changements à chaque étape, en quelques lignes.
5. Ajoute une section de bilan dans `tasks/todo.md` à la fin.
6. Mets à jour `tasks/lessons.md` après chaque correction.

### 7. Documentation et runbook au fil de l'eau
- Chaque changement qui touche le comportement, l'installation, la config ou l'exploitation met à jour la doc dans le même commit.
- `docs/README.md` : ce que fait l'app et comment elle est construite (architecture, fonctionnalités, décisions).
- `docs/runbook.md` : comment installer, lancer, builder, déployer, diagnostiquer une panne, restaurer. Chaque procédure est une suite de commandes testées.
- Une phase de `tasks/todo.md` n'est pas finie tant que la doc et le runbook ne la couvrent pas.
- Mets aussi `tasks/lessons.md` à jour avant de clore la tâche.

### Principes
- **Simplicité d'abord** : chaque changement le plus simple possible, avec le moins de code touché.
- **Pas de paresse** : cherche la cause racine, pas de correctif temporaire, standard de développeur senior.
- **Impact minimal** : ne touche que ce qui est nécessaire, pour ne pas créer de nouveaux bugs.
- Ne réécris pas un fichier entier pour une petite modification.
- Si une demande contredit une règle de ce fichier, signale-le au lieu de contourner.

## Commandes

Monorepo npm workspaces (`app`, `server`, `shared`). Installer depuis la racine : `npm install`. Dans `/app`, ajouter une dépendance avec `npx expo install <paquet>`.

```
npm run typecheck        # tous les workspaces
npm run lint
npm test
npm run format           # Prettier
cd app && npm run android   # development build sur le téléphone Android
cd app && npm start         # serveur Metro pour le development build
cd server && npm run dev    # Node 24 exécute le TypeScript directement
cd server && supabase start -x realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor   # base locale
cd server && npm run collect -- biscarrosse   # collecte des lieux
```

Installation, téléphone Android, JDK et pannes connues : `docs/runbook.md`.

## État actuel

À mettre à jour au fil du projet : ce qui est fait, ce qui est en cours, ce qui est prévu.

- [x] Squelette Expo et navigation
- [ ] Carte avec brouillard (code fait et vérifié sur le téléphone, reste une vraie balade)
- [x] Lieux de test, direction et itinéraire (phase 3, flèche à vérifier dehors)
- [x] Prise de photo et validation d'un lieu (phase 4, animation à voir à l'œil)
- [x] Lieux créés par l'utilisateur, spots et chez quelqu'un, en local : genre, modifier, supprimer (phases 4b à 4d)
- [x] Stockage local des découvertes (SQLite, migrations, requêtes)
- [x] Backend et collecte des lieux (phase 5 : Supabase en ligne, collecte OSM chaque semaine, API sur Render, comptes par code e-mail et suppression de compte ; reste un domaine pour les e-mails avant la bêta)
- [ ] Partage et commentaires
- [ ] Achat de cartes

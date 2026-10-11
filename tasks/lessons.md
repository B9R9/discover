# Leçons

Ajoute ici chaque erreur corrigée et la règle qui évite de la refaire. Relis ce fichier au début de chaque session.

Format :
- **Erreur** : ce qui s'est passé
- **Règle** : ce qu'on fait désormais

## Entrées

- **Erreur** : la doc et le runbook n'étaient pas prévus dans le workflow ; rien ne forçait à les écrire pendant le développement.
- **Règle** : chaque changement met à jour `docs/README.md` et `docs/runbook.md` dans le même commit, et `tasks/lessons.md` avant de clore la tâche (règle 7 de `CLAUDE.md`).

- **Erreur** : après ajout d'`expo-task-manager`, l'app plantait sur le téléphone dès qu'une position arrivait en arrière-plan (permission `RECEIVE_BOOT_COMPLETED` manquante). Les tests Jest ne pouvaient pas le voir.
- **Règle** : après tout ajout de module natif, vérifier le manifeste généré (`app/android/app/src/main/AndroidManifest.xml`) et lancer l'app sur le téléphone en lisant `adb logcat | grep -E "FATAL|AndroidRuntime"` avant de dire que c'est fini.

- **Erreur** : premier choix de bibliothèque d'union (`polyclip-ts`) pris sans mesure ; 7 fois plus lente que `polygon-clipping` sur nos données.
- **Règle** : pour du calcul lourd côté app, écrire d'abord le test de perf avec des données réalistes, puis choisir la bibliothèque sur mesure.

- **Erreur** : `syncBackgroundTracking` ne démarrait la tâche que si `hasStartedLocationUpdatesAsync` renvoyait `false`. Après un crash, la tâche restait enregistrée sans service : plus jamais d'enregistrement en arrière-plan.
- **Règle** : ne pas se fier à l'état « enregistré » d'une tâche native pour savoir si elle tourne ; rendre le démarrage idempotent et l'appeler à chaque synchronisation. Vérifier sur l'appareil avec `dumpsys activity services`.

- **Erreur** : l'app ouverte et la tâche de fond pouvaient écrire une position en même temps ; les deux lisaient le même dernier point, d'où deux points à 0,8 m.
- **Règle** : toute écriture qui lit puis écrit (`recordLocations`) passe par une file unique.

- **Erreur** : le test de perf du brouillard imposait 1,5 s en temps absolu ; il passait sur le Mac (1,2 s) et a cassé la CI GitHub (2,2 s).
- **Règle** : pas de seuil en millisecondes absolues dans un test qui tourne en CI. Comparer deux mesures sur la même machine (ici : un nouveau point coûte moins de 1/20 de la construction complète), avec au plus un plafond large contre les régressions énormes.

- **Erreur** : `npx prettier --write src ../docs` lancé depuis `app/` a reformaté `docs/design.md` en entier : le `.prettierignore` de la racine (qui exclut `*.md`) n'est pas lu quand Prettier tourne depuis un sous-dossier.
- **Règle** : formater avec `npm run format` depuis la racine, jamais Prettier à la main sur des chemins hors du dossier courant.

- **Erreur** : pendant un test sur le téléphone, mes appuis `adb` sont partis dans une autre app : une notification en haut de l'écran les a interceptés.
- **Règle** : avant chaque appui `adb`, vérifier que l'app a le focus (`dumpsys window | grep mCurrentFocus`) et éviter le haut de l'écran ; s'arrêter et demander dès qu'une autre app apparaît.

- **Erreur** : formulaire rendu défilant pour le clavier, mais rien ne défilait : Android plein écran (edge-to-edge) ne réduit pas l'écran quand le clavier s'ouvre.
- **Règle** : tout écran avec un champ texte est dans un `KeyboardAvoidingView` (`behavior="padding"`), vérifié sur le téléphone clavier ouvert.

- **Erreur** : test hors ligne sur le téléphone (serveur arrêté) jugé d'abord comme un `fetch` bloqué. En fait, le cache HTTP d'Android répondait à la place du serveur (`Cache-Control: max-age=3600`) : ni requête, ni erreur, et le repli sur SQLite n'était pas testé du tout.
- **Règle** : pour tester un repli hors ligne ou un appel réseau sur l'appareil, vider d'abord le cache HTTP de l'app (`run-as ... rm -rf cache/http-cache`) et prouver par un log quel chemin a été pris, au lieu de déduire à partir d'un silence.

- **Erreur** : appuis `adb` à des coordonnées lues sur une capture : après la fermeture du clavier la page avait bougé, l'appui est tombé sur le mauvais bouton et le test de connexion est reparti de zéro (un code e-mail perdu, 60 s d'attente).
- **Règle** : sur le téléphone, appuyer sur un élément par son texte, avec les coordonnées lues dans `uiautomator dump` juste avant l'appui, jamais d'après une capture plus ancienne.

- **Erreur** : clé secrète Supabase enregistrée depuis `supabase projects api-keys` sans `--reveal` : le CLI renvoie une valeur masquée (`sb_secret_3o··········`) de la bonne longueur, refusée ensuite avec `Invalid API key`.
- **Règle** : après avoir enregistré un secret, le tester tout de suite par un appel réel (ici l'endpoint admin, attendu 200) avant de s'en servir ailleurs.

- **Erreur** : la tâche de fond ouvrait la base avec `openDatabaseAsync` puis `closeAsync` à chaque position. expo-sqlite lui rend la connexion native déjà ouverte par `SQLiteProvider` ; quand le ramasse-miettes JS libère cette poignée, `sharedObjectDidRelease` ferme la connexion partagée, et toute requête de l'app échoue ensuite (`NativeDatabase.prepareAsync has been rejected`, `NullPointerException`). Invisible avec 106 lieux, systématique vers 20 s avec 3 500 lieux en cache (plus de mémoire, ramasse-miettes plus tôt).
- **Règle** : une seule poignée expo-sqlite par base et par processus, gardée en vie, jamais fermée par un module qui partage la connexion de `SQLiteProvider`. Après un changement de volume de données, laisser l'app ouverte au moins 2 min sur le téléphone en lisant `adb logcat -s ReactNativeJS:V`.

- **Erreur** : une ANR sur le téléphone juste après l'ajout de RevenueCat, d'abord attribuée au paywall. La pile de l'ANR (bugreport) et le même test sur le code d'avant (`git stash`) ont montré que c'était ancien : au lancement, environ 30 s de calcul (3 500 lieux en cache) bloquent JS et l'écran ; un appui pendant ce temps donne l'ANR.
- **Règle** : sur une ANR, lire la pile (`adb bugreport`, puis `FS/data/anr/` dans le zip) et refaire le même geste sur le code d'avant le changement, au même moment après le lancement, avant d'accuser le changement.

- **Erreur** : le lendemain, appuis `adb` lancés sans vérifier le focus : l'app n'était plus au premier plan, les appuis sont tombés sur l'écran d'accueil et ont ouvert l'app Téléphone (aucun appel passé). La vérification du focus était faite, mais dans la même commande que les appuis, sans arrêt si elle échouait.
- **Règle** : vérifier le focus dans une commande à part, lire le résultat, et n'envoyer les appuis que si `mCurrentFocus` est `com.b9r9.discover`. Sinon, ne rien toucher et demander.

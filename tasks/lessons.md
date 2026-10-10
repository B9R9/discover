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

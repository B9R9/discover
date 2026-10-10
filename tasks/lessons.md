# Leçons

Ajoute ici chaque erreur corrigée et la règle qui évite de la refaire. Relis ce fichier au début de chaque session.

Format :
- **Erreur** : ce qui s'est passé
- **Règle** : ce qu'on fait désormais

## Entrées

- **Erreur** : la doc et le runbook n'étaient pas prévus dans le workflow ; rien ne forçait à les écrire pendant le développement.
- **Règle** : chaque changement met à jour `docs/README.md` et `docs/runbook.md` dans le même commit, et `tasks/lessons.md` avant de clore la tâche (règle 7 de `CLAUDE.md`).

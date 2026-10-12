# Runbook : boucle Claude Code → Hermes (Ollama)

Procédures pas à pas du runner `scripts/agent-loop.py`. Le détail des modes et de la configuration est dans [runbook.md](runbook.md#modes-repli-et-récupération). Toutes les commandes se lancent depuis la racine du dépôt.

## 0. D'où lancer : terminal, Hermes Desktop ou Hermes Agent

Le runner se lance **toujours depuis un terminal**, à la racine du dépôt. C'est lui qui appelle `claude` puis `hermes chat -q ... --oneshot` en sous-processus. Il n'est pas piloté par une interface Hermes.

- **Terminal** : un terminal classique (Terminal.app, iTerm, ou celui de VS Code) suffit. Le laisser ouvert pendant le run.
- **Hermes Agent (CLI)** : rien à lancer à la main. Il doit seulement être installé et configuré (`hermes status`, `hermes model`) avec Ollama comme fournisseur ; le runner l'appelle seul.
- **Hermes Desktop** : non utilisé par le runner (aucune application Hermes n'est installée dans `/Applications` sur cette machine). Ne pas ouvrir de session interactive sur le même dépôt pendant un run : deux agents modifieraient les mêmes fichiers. Si tu l'utilises, ne le fais qu'entre deux runs, après avoir lu `git diff`.
- **Claude Code** : le runner l'appelle aussi en sous-processus ; pas besoin d'une session Claude ouverte, seulement d'être connecté (`claude` une fois en interactif).

Les réglages Hermes (modèle, fournisseur) sont ceux de `hermes model` ; `ollama_model` dans `.agent/config.json` les surcharge pour le run.

## 1. Avant le premier lancement

```
git branch --show-current          # doit être autre chose que main / master
git status --short                 # l'arbre peut être sale, le runner enregistre l'état de départ
python3 -m unittest discover -s .agent/tests
python3 scripts/agent-loop.py --help
claude --version
hermes status                      # fournisseur Ollama local attendu
ollama list                        # le modèle choisi doit y figurer
```

Remplir `.agent/REQUEST.md` (la demande) et `.agent/DECISIONS.md` (contraintes) sans secret ni donnée personnelle. Optionnel : `.agent/config.json` (voir le runbook principal).

## 2. Lancer un run

```
python3 scripts/agent-loop.py --max-tasks 1 --claude-max-budget-usd 1
```

Le plafond est par appel Claude (planification et revue). Chaque run a son dossier `.agent/runtime/runs/<run-id>/`.

## 3. Arrêter

`Ctrl+C` dans le terminal. Les tâches finies et l'état sont conservés ; rien n'est annulé dans les fichiers. Ne jamais supprimer `.agent/runtime/` ni le verrou à la main sans avoir vérifié qu'aucun processus `agent-loop.py` ne tourne (`pgrep -fl agent-loop`).

## 4. Reprendre

```
python3 scripts/agent-loop.py --resume <run-id> --claude-max-budget-usd 1
```

Les tâches déjà `approved` ou `awaiting_claude_review` ne sont pas refaites. Si l'arrêt a eu lieu pendant une implémentation, inspecter `git diff` puis choisir :

```
python3 scripts/agent-loop.py --resume <run-id> --recover-task <task-id> --recovery-action review --claude-max-budget-usd 1
```

`--recovery-action` : `review` (relire les changements présents), `retry` (nouvelle tentative sans effacer), `block` (arrêter la tâche).

## 5. Claude indisponible (mode fallback)

Symptôme : `status.md` indique `mode: fallback` et `plan_author: hermes`, ou le processus sort avec le code 2.

1. Lire la cause : `.agent/runtime/runs/<run-id>/status.md` (champ Claude) ou `plan.json` → `claude.failure_kind`.
2. Selon le type :
   - `auth` : se reconnecter (`claude` en interactif), puis reprendre.
   - `credit` / `rate_limit` : attendre ou recharger, puis reprendre.
   - `timeout` / `network` : réessayés automatiquement (bornés) ; vérifier la connexion.
3. Hermes continue seul les tâches possibles. Ses tâches finies sont `awaiting_claude_review`, jamais approuvées.

## 6. Récupération et revue par Claude

Quand Claude répond de nouveau :

```
python3 scripts/agent-loop.py --resume <run-id> --claude-max-budget-usd 1
```

Le runner fait un appel court de contrôle, puis Claude relit chaque tâche en attente. Corrections demandées : Hermes les applique, Claude relit. Fin : `history` contient `recovery_complete` et le mode repasse à `primary`.

## 7. Inspecter

```
cat .agent/runtime/runs/<run-id>/status.md
python3 -m json.tool .agent/runtime/runs/<run-id>/plan.json | less
ls .agent/runtime/runs/<run-id>/            # un .json et un .log par appel (-retryN pour les réessais)
git diff
```

## 8. Pannes connues

| Symptôme | Cause probable | Action |
| --- | --- | --- |
| Refus de démarrer, verrou présent | Un autre run tourne ou s'est arrêté brutalement | `pgrep -fl agent-loop` ; si rien, inspecter le verrou avant de le retirer |
| Plan rejeté, « fichiers modifiés pendant la planification » | Hermes a écrit pendant la phase de plan | Inspecter `git diff`, relancer un run |
| Tâche en échec, chemin sensible | `package.json`, lockfile ou `migrations/` modifiés | Relire le diff, relancer avec `--approve-sensitive` si voulu |
| Modèle Ollama introuvable | `ollama_model` absent de `ollama list` | `ollama pull <modèle>` ou corriger la config |
| Code de sortie 2 | Tout est implémenté mais non relu par Claude | Voir section 6 |

## 9. Ce qui n'est jamais fait

Commit, push, reset, stash, clean, mise à jour de dépendances ou migration sans approbation explicite. Le runner ne valide jamais seul le travail d'Hermes : seul un verdict Claude `approved`, avec tous les contrôles réussis, clôt une tâche.

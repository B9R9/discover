# Balades audio : spec

Brouillon du 8 nov 2026, à relire

## Résumé

Pendant une balade, la personne qui la crée enregistre de courts extraits audio (10 à 30 s), chacun accroché à l'endroit où elle se trouve. Celui qui suit la balade les entend en arrivant au même endroit, comme un audio guide.

La feature est pensée d'abord pour les personnes aveugles et malvoyantes, et utile à tous. La consigne donnée à celui qui décrit va au-delà du visuel : sons, odeurs, sol, pentes, escaliers, traversées, obstacles, repères qu'on peut sentir ou entendre.

Chaque extrait est transcrit automatiquement (lecteurs d'écran, personnes sourdes ou malentendantes). Un mode « balade audio » permet de suivre une balade sans regarder l'écran : VoiceOver et TalkBack complets, consignes de direction parlées, commandes au casque.

Les informations de sécurité passent en priorité (traversées, travaux, trottoirs étroits). Une balade peut porter le tag « accessible » ou « sans escaliers ». Celui qui écoute peut signaler un obstacle.

Les audios sont stockés dans Supabase Storage. Tout le monde peut enregistrer dès le départ. Modération par signalements d'abus seulement. Pseudo seul.

Le détail (rayons de déclenchement, formulation des directions, gestes) sera testé avec des personnes aveugles avant d'être figé. Les valeurs chiffrées de cette spec sont des points de départ.

## Objectif et utilisateur

### Objectif

Détour est très visuel : brouillard, photos, carnet. Une personne aveugle ne peut pas en profiter aujourd'hui. Les balades audio lui ouvrent le Cercle : elle suit la balade de quelqu'un d'autre et découvre un lieu par ce qu'on lui en dit, avec des repères utiles pour s'y déplacer.

Pour tous les autres, c'est une façon de découvrir une balade en gardant les yeux sur la ville plutôt que sur l'écran.

Ce que la feature n'est pas : un outil de navigation pour personnes aveugles. Elle ne remplace ni la canne, ni le chien guide, ni l'apprentissage de la locomotion. L'app le dit clairement (voir Safety).

### Utilisateur 1 : celui qui décrit

- Il a un compte (pseudo), il crée une balade dans le Cercle ou en parcourt une à lui.
- Il marche, s'arrête à un endroit, enregistre 10 à 30 s, repart.
- Il est voyant dans la plupart des cas. Il ne sait pas forcément ce qui est utile à une personne aveugle. La consigne doit l'aider sans le décourager.
- Il est dans la rue : bruit, vent, passants, mains prises, téléphone en plein soleil.
- Ce qu'il attend : enregistrer vite, sans se tromper, et savoir que son extrait sera bien placé.

### Utilisateur 2 : celui qui écoute

Deux profils, une seule feature.

**2a. La personne aveugle ou malvoyante**
- Utilise VoiceOver (iOS) ou TalkBack (Android) au quotidien, souvent avec une canne ou un chien guide.
- Téléphone dans la poche ou dans un étui, écran éteint. Écouteurs ouverts ou à conduction osseuse, ou un seul écouteur, pour garder l'oreille sur la rue.
- Elle a besoin de : savoir où elle en est, ce qui vient, et surtout ce qui peut être dangereux, avant d'y arriver.
- Elle ne peut pas vérifier visuellement ce que dit l'app. Une erreur de l'app peut la mettre en danger.

**2b. Tout le monde**
- Suit la balade en écoutant, avec la carte ou sans.
- Peut lire la transcription au lieu d'écouter (personne sourde, lieu bruyant, préférence).

## Comportement détaillé

### Écrans concernés

1. **Fiche balade** (Cercle) : indique qu'elle contient des extraits audio, leur nombre, la durée totale, les tags, les obstacles signalés récents. Bouton principal : « Écouter la balade ».
2. **Enregistrement pendant la création** : ajout d'un bouton « Décrire cet endroit » sur l'écran de balade en cours.
3. **Relecture d'un extrait** (avant publication) : écouter, lire et corriger la transcription, choisir le type, garder ou refaire.
4. **Mode balade audio** : écran simplifié, utilisable sans regarder.
5. **Signalement d'obstacle** : depuis le mode balade audio.
6. **Réglages balade audio** (dans Moi) : lecture auto ou manuelle, sens des directions, verbosité, bip de proximité.

### Charte

- Tout passe par les tokens, en mode clair et sombre.
- Bouton « Décrire cet endroit » et « Écouter la balade » : bouton principal `stamp`, Special Elite. Un seul par écran.
- Repère d'un extrait sur la carte : petit billet `paperWhite` avec une icône d'onde, contour `ink`. Extrait de sécurité : même billet avec un tampon `stamp` « attention ». L'état ne passe jamais par la couleur seule : l'icône et le libellé changent aussi.
- Transcription : DM Sans, jamais Caveat (lisibilité, lecteurs d'écran).
- En mode balade audio, aucune rotation, aucune animation décorative, aucun élément caché derrière la carte. Les éléments décoratifs (scotch, tampons) sont masqués aux lecteurs d'écran.
- Toutes les cibles tactiles font au moins 44 px. En mode balade audio, les boutons sont plus grands (voir plus bas).

### Flux 1 : décrire un endroit (celui qui décrit)

**Première fois : la consigne**

Avant le premier enregistrement, un écran court, lisible en entier par un lecteur d'écran :

> **Décrire pour quelqu'un qui ne voit pas**
> Ta balade pourra être suivie par des personnes aveugles ou malvoyantes. Ce que tu vois compte, mais pas seulement.
> Parle aussi de ce qu'on entend, de ce qu'on sent, du sol sous les pieds, des pentes, des marches, des traversées, des obstacles. Donne des repères qu'on peut toucher ou entendre : « le muret à droite », « la fontaine qu'on entend avant de la voir ».
> Si quelque chose peut être dangereux, dis-le d'abord.
> Arrête-toi pour enregistrer. Jamais en traversant.
> Évite d'enregistrer les conversations des gens autour de toi.
>
> [C'est parti] (principal)
> [Voir des exemples] (secondaire)

« Voir des exemples » propose 3 extraits types (texte et audio) : un passage piéton, un parc, une rue commerçante. La consigne reste accessible depuis l'écran d'enregistrement (lien « Que dire ? »).

**Enregistrer**

1. Pendant la balade, il touche « Décrire cet endroit ».
2. Si le micro n'a jamais été demandé, l'app explique avant la demande système : « Pour décrire cet endroit, Détour a besoin du micro. Ta voix ne sert qu'à cet extrait. » Puis demande système.
3. L'app fige la position (meilleure précision disponible dans les 5 dernières secondes) et affiche « Position notée à 8 m près ». Si la précision dépasse 25 m : « Ta position est imprécise (40 m). L'extrait risque d'être mal placé. Tu pourras le déplacer sur la carte après. »
4. Avant de lancer : choix du type, deux pastilles 44 px :
   - « Description » (par défaut)
   - « Attention » (sécurité : traversée, travaux, trottoir étroit, marches, obstacle)
   Si « Attention » : sous-choix rapide, plusieurs possibles : « Traversée », « Travaux », « Trottoir étroit », « Marches », « Pente », « Obstacle », « Autre ».
5. Il touche « Enregistrer ». Compte à rebours sonore court (un bip), puis enregistrement.
6. Pendant l'enregistrement : gros bouton « Arrêter », temps écoulé, jauge de niveau sonore. Une vibration et un bip à 25 s : « Encore 5 secondes ». Arrêt automatique à 30 s.
7. Le bouton de lecture du casque (ou le bouton volume si l'OS le permet, à vérifier) arrête aussi l'enregistrement, pour ne pas devoir regarder l'écran.

**Relire et publier l'extrait**

8. Écran de relecture :
   - Lecture de l'extrait.
   - Transcription en cours : « Transcription en cours… » puis le texte, éditable. Mention : « Transcription automatique. Corrige-la si besoin. »
   - Langue détectée ou choisie : « Français », « Suomi », « English » (modifiable).
   - Alertes éventuelles (voir edge cases) : vent, silence, voix en arrière-plan.
   - Boutons : « Garder » (principal), « Refaire » (secondaire), « Supprimer » (lien texte).
9. « Garder » : l'extrait est rattaché à la balade en brouillon, sur l'appareil. Il n'est envoyé qu'à la publication de la balade.
10. À la publication de la balade, récapitulatif : « 12 extraits, 4 min 30 au total, dont 3 « Attention ». » Puis, case à cocher obligatoire la première fois : « Je n'ai pas enregistré de conversation ni de personne qui ne voulait pas l'être. »
11. Tags facultatifs proposés à la publication : « Accessible » et « Sans escaliers ». Texte d'aide : « Coche seulement si tu as fait tout le chemin et que c'est vrai sur toute la balade. » Si un extrait est de type « Attention / Marches », l'app ne propose pas « Sans escaliers » et l'explique.

**Ordre et emplacement**

- Les extraits sont ordonnés selon leur position le long du trajet de la balade, pas selon l'heure d'enregistrement.
- Sur la carte, en brouillon, l'auteur peut déplacer un extrait (glisser le repère, ou en accessibilité : « Déplacer de 5 m vers l'avant / l'arrière du trajet »). Un extrait ne peut pas être placé à plus de 30 m du trajet.

### Flux 2 : écouter une balade (celui qui écoute)

**Depuis la fiche balade**

1. La fiche indique : « Balade audio · 12 extraits · 2,3 km · environ 45 min ». Tags : « Accessible (déclaré par l'auteur) », « Sans escaliers (déclaré par l'auteur) ». Obstacles signalés de moins de 14 jours : « 1 obstacle signalé il y a 2 jours ».
2. Bouton « Écouter la balade ».
3. Si la balade n'est pas encore téléchargée : « Télécharger pour l'écoute hors réseau (3 Mo) ? » [Télécharger] [Écouter en ligne]. (Le mode hors-ligne complet reste une question ouverte ; voir plus bas le minimum requis.)
4. La première fois, écran d'avertissement, lu en entier par le lecteur d'écran, avec un bouton qui ne s'active qu'une fois l'écran affiché (pas de délai artificiel) :

> **Avant de partir**
> Cette balade a été décrite par une autre personne. Les lieux changent : travaux, voitures garées, terrasses.
> Détour ne remplace pas ta canne, ton chien guide ni ton jugement. Les directions sont approximatives, le GPS peut se tromper de plusieurs dizaines de mètres.
> Aux traversées, fie-toi toujours à ce que tu entends et à la signalisation. Détour ne te dira jamais quand traverser.
> Garde une oreille libre.
>
> [J'ai compris] (principal)

Les fois suivantes, une version courte est lue au démarrage : « Rappel : Détour ne te dira jamais quand traverser. » Réglage possible pour la couper, sauf la phrase sur les traversées qui reste.

5. Choix du point de départ : si la personne est à plus de 50 m du début : « Tu es à 300 m du départ. Je te guide vers le départ ? » [Oui] [Commencer ici]. « Commencer ici » prend l'extrait le plus proche sur le trajet. Le guidage vers le départ donne seulement distance et direction générale (pas d'itinéraire rue par rue), et le dit : « Je te donne la direction à vol d'oiseau, pas le chemin. »

**En cours d'écoute (mode balade audio)**

6. Le mode balade audio démarre. L'écran passe en vue simplifiée (voir ci-dessous). La lecture continue écran verrouillé.
7. Entre deux extraits, l'app parle seulement si utile :
   - Annonce de proximité : « Prochain extrait dans 50 mètres. »
   - Annonce d'un extrait de sécurité : « Attention dans 40 mètres : traversée. » Toujours avant d'arriver, jamais à l'arrivée seulement.
   - Direction : « Le chemin continue tout droit » / « légèrement à droite », basé sur le trajet enregistré et le sens de marche réel. Option dans les réglages : directions en heures (« à 2 heures »). Le choix par défaut sera fixé après les tests.
8. En arrivant dans la zone d'un extrait :
   - Lecture auto (par défaut en mode balade audio) : un son court (« ding » papier), puis l'extrait.
   - Lecture manuelle : un son et une vibration, puis « Extrait disponible. Appuie pour écouter. » La personne déclenche avec le bouton du casque ou le bouton à l'écran.
9. Après l'extrait : silence, ou l'annonce suivante. Rien de bavard.
10. Fin : « Fin de la balade. 12 extraits écoutés sur 12. » Puis proposition de laisser un merci ou un signalement (voir Cercle, hors périmètre).

**Écran du mode balade audio**

Peu d'éléments, grands, dans un ordre fixe, lisibles de haut en bas par VoiceOver et TalkBack :

1. Titre de l'état (lu en premier, région « live » discrète) : « Extrait 4 sur 12 · En lecture » / « En marche · prochain extrait dans 80 m ».
2. « Lire » / « Pause » (principal, `stamp`, pleine largeur, au moins 88 px de haut).
3. « Répéter l'extrait »
4. « Où suis-je ? » : lit la position sur la balade, la distance au prochain extrait, la distance au trajet, la direction.
5. « Extrait suivant » / « Extrait précédent »
6. « Lire la transcription » : affiche le texte en grand, et le lit par le lecteur d'écran si actif.
7. « Signaler un obstacle »
8. « Arrêter la balade » (en bas, demande confirmation : « Arrêter la balade ? Tu pourras la reprendre là où tu en es. » [Arrêter] [Continuer])

La carte reste disponible via un onglet « Carte », masquée par défaut en mode balade audio quand un lecteur d'écran est actif.

**Commandes sans écran**

- Bouton lecture/pause du casque : lire / pause.
- Double appui : extrait suivant. Triple appui : répéter (selon ce que l'OS transmet, à vérifier).
- Contrôles écran verrouillé et centre de contrôle : titre « Détour · Extrait 4 sur 12 », lecture, pause, suivant, précédent.
- Rien d'essentiel ne dépend d'un geste sur l'écran.

**Signaler un obstacle**

1. « Signaler un obstacle » → liste courte, un choix : « Travaux », « Trottoir bloqué », « Marches non annoncées », « Chemin fermé », « Autre ».
2. Option : « Ajouter un message vocal (10 s) » (transcrit comme un extrait, même règles).
3. « Envoyer ». Confirmation parlée : « Merci. Ton signalement est noté à cet endroit. »
4. Le signalement est daté, placé à la position actuelle, visible par l'auteur et par les suivants pendant 14 jours : « Obstacle signalé par un marcheur il y a 2 jours, non vérifié. » Il est lu comme une annonce de sécurité en approchant.
5. Hors réseau : enregistré localement, envoyé plus tard.

### Textes d'interface principaux (récapitulatif)

| Contexte | Texte |
|---|---|
| Bouton création | Décrire cet endroit |
| Lien d'aide | Que dire ? |
| Types | Description · Attention |
| Sous-types | Traversée · Travaux · Trottoir étroit · Marches · Pente · Obstacle · Autre |
| Relecture | Garder · Refaire · Supprimer |
| Mention transcription | Transcription automatique. Corrige-la si besoin. |
| Fiche | Écouter la balade |
| Annonce proximité | Prochain extrait dans 50 mètres. |
| Annonce sécurité | Attention dans 40 mètres : traversée. |
| Hors trajet | Tu t'éloignes du chemin de la balade. Il est à environ 40 mètres, sur ta gauche. |
| Batterie | Batterie à 20 %. La balade audio consomme pas mal. Il reste 5 extraits. |
| Fin | Fin de la balade. 12 extraits écoutés sur 12. |

## Règles métier

**Extraits**

1. Durée max 30 s, arrêt automatique. Durée min 3 s (en dessous : « C'est un peu court. Tu veux refaire ? », non publiable). Entre 3 et 10 s : accepté sans alerte.
2. Format : AAC mono, 64 kbit/s (environ 240 Ko pour 30 s). Silences de début et de fin coupés automatiquement (au-delà de 0,5 s).
3. Normalisation du volume à l'envoi (même niveau perçu pour tous les extraits, valeur cible à fixer pendant les tests). Pas de réduction de bruit forcée : le son ambiant peut être le sujet de l'extrait (fontaine, marché). Réduction de bruit proposée en option à la relecture : « Réduire le bruit de fond ».
4. Maximum 40 extraits par balade. Au moins 15 m entre deux extraits « Description » ; en dessous, l'app propose de remplacer l'extrait voisin ou de le décaler. Les extraits « Attention » ne sont pas soumis à cette distance.
5. Chaque extrait a : une position, une précision GPS notée, un type, des sous-types de sécurité, une langue, une transcription, un ordre le long du trajet.

**Déclenchement**

6. Zone de déclenchement par défaut : 20 m autour de l'extrait. Elle s'élargit avec l'imprécision GPS (rayon = max(20 m, précision actuelle), plafonné à 40 m) et avec la vitesse (voir edge cases).
7. Un extrait « Attention » est annoncé une première fois à 40 m (« Attention dans 40 mètres : traversée »), puis lu en entier à l'entrée de sa zone.
8. Déclenchement seulement si la personne s'approche dans le sens de la balade, ou si elle est arrêtée dans la zone depuis 3 s. Un extrait déjà lu ne se relance pas tout seul (sauf « Attention », relu si la personne revient dans la zone après en être sortie de plus de 30 m).
9. Jamais deux audios en même temps. File d'attente. Priorité : 1) extrait « Attention » et obstacle signalé, 2) annonce de direction, 3) extrait « Description ».
10. Un extrait « Attention » interrompt un extrait « Description » en cours : fondu de 300 ms, l'extrait de sécurité, puis « Je reprends l'extrait précédent ? » (lecture auto : reprise auto depuis le début de l'extrait interrompu s'il reste dans sa zone, sinon il est marqué « non écouté » et accessible par « Extrait précédent »).
11. Si la précision GPS dépasse 40 m, plus aucun déclenchement auto : « Position imprécise. Je passe en lecture manuelle pour l'instant. » Retour auto quand la précision repasse sous 25 m pendant 10 s.

**Directions**

12. Les directions sont calculées depuis le trajet enregistré et le sens de marche réel (cap GPS sur les derniers mètres), pas depuis la boussole quand le téléphone est en poche. Si le cap n'est pas fiable (personne arrêtée), l'app le dit : « Avance quelques pas pour que je trouve ta direction. »
13. L'app ne dit jamais « traverse », « tu peux traverser », « c'est sûr », « la voie est libre ». Elle peut dire « Le chemin traverse la rue ici. » seulement si l'auteur l'a signalé par un extrait « Attention / Traversée », et toujours suivi de « Écoute bien avant de traverser. »
14. Pas d'itinéraire calculé hors du trajet de la balade. Hors trajet, seulement distance et direction à vol d'oiseau, avec la mention que ce n'est pas un chemin.

**Tags et obstacles**

15. « Accessible » et « Sans escaliers » sont déclarés par l'auteur, affichés comme tels (« déclaré par l'auteur »). L'app ne les certifie pas.
16. Un obstacle signalé « Marches non annoncées » sur une balade « Sans escaliers » ajoute sur la fiche : « Un marcheur a signalé des marches sur cette balade. » Le tag reste, l'auteur est notifié.
17. Un obstacle signalé expire après 14 jours. L'auteur peut le marquer « réglé », ou l'intégrer en enregistrant un extrait.

**Droits**

18. Tout compte peut enregistrer et publier. Seul l'auteur modifie ou supprime ses extraits. Tout compte peut signaler un extrait (abus) ou une transcription (« transcription fausse », envoyé à l'auteur seulement, pas de modération).
19. Écouter une balade publiée ne demande pas de compte (cohérent avec l'app : compte demandé seulement pour partager, commenter, laisser une balade). Signaler un obstacle ou un abus demande un compte (hypothèse à valider : un signalement d'obstacle sans compte serait plus inclusif mais plus exposé aux abus).
20. Pseudo seul affiché, jamais de nom. La voix est celle de l'auteur ; l'app ne la transforme pas (question ouverte : proposer une voix de synthèse à partir du texte pour ceux qui ne veulent pas que leur voix soit publiée).

**Quota**

21. Quota par compte : 500 extraits publiés (environ 120 Mo). À 90 % : « Tu approches de la limite d'extraits. Tu peux en supprimer d'anciens dans Moi. » À 100 % : enregistrement possible en brouillon local, publication bloquée avec le même message.

## Modèle de données

### Sur Supabase

**`walk_audio_clips`**
| Champ | Type | Note |
|---|---|---|
| `id` | uuid | |
| `walk_id` | uuid → balade publiée | suppression en cascade |
| `author_id` | uuid → profil | |
| `walk_version` | int | version de la balade à laquelle l'extrait a été ajouté |
| `lat`, `lng` | double | position de l'extrait (publique avec la balade) |
| `recorded_accuracy_m` | int | précision GPS à l'enregistrement |
| `path_offset_m` | int | distance depuis le début du trajet, sert à l'ordre |
| `kind` | enum `description` / `safety` | |
| `safety_tags` | text[] | `crossing`, `works`, `narrow_sidewalk`, `stairs`, `slope`, `obstacle`, `other` |
| `language` | enum `fr` / `fi` / `en` | |
| `duration_ms` | int | |
| `storage_path` | text | chemin dans le bucket |
| `transcript` | text | |
| `transcript_source` | enum `auto` / `edited` | |
| `status` | enum `published` / `hidden_pending_review` / `removed` | |
| `created_at`, `updated_at` | timestamptz | |

**`walk_obstacle_reports`**
| Champ | Type | Note |
|---|---|---|
| `id` | uuid | |
| `walk_id` | uuid | cascade |
| `reporter_id` | uuid | jamais affiché aux autres |
| `lat`, `lng` | double | |
| `type` | enum `works` / `blocked_sidewalk` / `unannounced_stairs` / `closed` / `other` | |
| `voice_storage_path` | text, nullable | |
| `transcript` | text, nullable | |
| `status` | enum `open` / `resolved` / `expired` / `removed` | |
| `created_at`, `expires_at` | timestamptz | `expires_at` = +14 jours |

**Ajouts sur la balade publiée** (table existante, à vérifier) : `version` (int), `has_audio` (bool), `tag_accessible` (bool), `tag_step_free` (bool), `audio_total_ms` (int).

**Signalements d'abus** : réutiliser la table de signalements existante, avec une cible `audio_clip` ou `obstacle_report` et des motifs : « Insulte ou harcèlement », « Voix ou conversation de quelqu'un enregistrée sans accord », « Informations personnelles sur quelqu'un », « Contenu illégal », « Information dangereuse ou fausse », « Autre ».

**Supabase Storage**
- Bucket privé `walk-audio`, chemin `{author_id}/{walk_id}/{clip_id}.m4a`.
- Lecture par URL signée de courte durée, générée pour les balades publiées. Écriture seulement par l'auteur (RLS sur le préfixe `author_id`).
- Pas d'URL publique permanente : un extrait retiré ou supprimé doit cesser d'être lisible.

**Transcription** : traitement à l'envoi (fonction serveur) ou sur l'appareil, à décider (voir Questions ouvertes). Si serveur : l'audio ne sort pas de l'infrastructure choisie et n'est pas conservé par un tiers ; à vérifier selon le prestataire.

### Local, sur l'appareil

- Extraits en brouillon (fichier audio, position, transcription) jusqu'à la publication.
- File d'envoi (extraits et signalements créés hors réseau).
- Cache d'écoute : audios, transcriptions et trajet d'une balade téléchargée, avec la `version` téléchargée et une date d'expiration.
- Progression d'écoute : balade, extraits écoutés, dernier extrait. Jamais envoyée au serveur.
- Position pendant l'écoute : reste sur l'appareil, comme le suivi de trajet existant. L'écoute d'une balade ne crée aucune trace côté serveur, à part le téléchargement des fichiers.
- Réglages : lecture auto/manuelle, directions (gauche/droite ou heures), verbosité, rappel de sécurité court, bip de proximité.

## Dépendances et phasage

### Dépendances

- Phase 3 des voyages (partage dans le Cercle) : il faut des balades publiées avec un trajet.
- Suivi de trajet existant (local, automatique).
- Lecture audio et localisation en arrière-plan, écran verrouillé (iOS et Android).
- Permission micro.
- Service de transcription français, finnois, anglais.
- Table de signalements et circuit de modération existants.
- Suppression de compte existante, à étendre aux audios.
- Recrutement de testeurs aveugles et malvoyants (par exemple via Näkövammaisten liitto ry, à contacter) et d'un instructeur de locomotion pour encadrer les tests terrain.

### Phasage

**Phase 0 : prototype à tester avant de figer**
- Balade test enregistrée à la main (3 ou 4 extraits), lecture déclenchée par GPS, écran du mode balade audio minimal.
- 3 à 5 sessions avec des personnes aveugles, accompagnées. Objectifs : rayon de déclenchement, annonces de sécurité, gauche/droite ou heures, verbosité, commandes au casque, écouteurs utilisés.
- Les valeurs de cette spec sont revues après cette phase.

**Phase 1 : enregistrer et écouter**
- Enregistrement, relecture, transcription, publication avec la balade.
- Écoute avec déclenchement GPS, file d'attente, priorité sécurité.
- Mode balade audio complet avec VoiceOver et TalkBack, commandes au casque et écran verrouillé.
- Signalement d'abus, suppression, quota, suppression de compte.
- Téléchargement préalable de la balade (minimum pour la question hors-ligne).
- Écran d'avertissement et règles de direction.

Aucune balade audio n'est ouverte au public avant que la phase 1 complète soit passée en test terrain.

**Phase 2 : sécurité collaborative**
- Signalement d'obstacle par les suivants, expiration, notification à l'auteur.
- Tags « Accessible » et « Sans escaliers » et leur contradiction par signalement.
- Déplacement d'un extrait après publication.

**Phase 3 : selon les retours**
- Hors-ligne complet (selon la décision).
- Directions en heures si non retenues par défaut.
- Voix de synthèse, traduction des transcriptions.

## Safety

### Sécurité physique de celui qui écoute (priorité absolue)

- **Ne jamais guider vers un danger sans avertissement.** Les extraits « Attention » et les obstacles signalés sont annoncés avant la zone (40 m), lus en priorité, et interrompent tout le reste.
- **Jamais d'ordre de traverser.** Liste de formulations interdites dans le code et testée (règle 13). La décision de traverser reste à la personne.
- **Pas de faux sentiment de précision.** Les distances sont arrondies (10 m sous 100 m, 50 m au-delà). Quand le GPS est imprécis, l'app le dit et arrête le déclenchement auto.
- **Pas d'itinéraire inventé.** Hors du trajet enregistré, l'app ne calcule pas de chemin. Elle ne fait jamais passer quelqu'un par un endroit que l'auteur n'a pas parcouru.
- **L'audio ne masque pas la rue.** Pas d'augmentation du volume au-delà du réglage système. Recommandation au démarrage de garder une oreille libre (écouteurs ouverts, conduction osseuse, un seul écouteur). Annonces courtes. Silence entre les extraits.
- **Avertissement clair** au premier lancement (texte plus haut) : l'app ne remplace ni canne, ni chien guide, ni jugement. Cet avertissement n'est pas une décharge juridique : la formulation et sa portée sont à relire avec un juriste.
- **Vélo et vitesse** : au-delà de 12 km/h, l'app propose la lecture manuelle et rappelle de rester attentif. Les effets légaux d'écouter de l'audio à vélo en Finlande ne sont pas affirmés ici, à vérifier.
- **Batterie** : l'app prévient avant de s'éteindre faute de batterie (voir edge cases), pour qu'une personne aveugle ne se retrouve pas sans repère sans le savoir.
- **Contenu dangereux** : un extrait qui donne une consigne dangereuse (« traverse ici, il n'y a jamais de voitures ») peut être signalé avec le motif « Information dangereuse ou fausse ». Ce motif est traité en priorité dans la file de modération.

### Sécurité physique de celui qui enregistre

- Consigne : s'arrêter pour enregistrer, jamais en traversant.
- Arrêt possible au bouton du casque, pas besoin de regarder l'écran.
- Pas de rappel ni de notification qui pousse à enregistrer en marchant.

### La voix est une donnée personnelle

- La voix de l'auteur identifie une personne, même avec un pseudo. L'app le dit avant le premier enregistrement publié : « Ta voix sera entendue par les personnes qui suivent ta balade. Tu peux supprimer un extrait quand tu veux. »
- Savoir si la voix publiée relève de règles particulières (par exemple données biométriques au sens du RGPD) dépend de l'usage qui en est fait : à vérifier avec un juriste. L'app ne fait aucune reconnaissance ni analyse de la voix.
- Pas d'utilisation des audios pour autre chose que la balade (pas d'entraînement de modèles, pas de partage). Si un prestataire de transcription est utilisé, ses conditions doivent le garantir, à vérifier avant le choix.
- Les affirmations faites dans l'app (« ta voix ne sert qu'à cet extrait ») doivent rester vraies : toute évolution du traitement doit faire revoir ces textes.

### Passants et conversations de tiers

- Risque : l'auteur capte la voix ou la conversation de passants, parfois des propos privés.
- Mesures : consigne explicite, case à cocher à la première publication, alerte à la relecture quand la transcription contient du texte que l'auteur n'a probablement pas dit (détection de plusieurs voix si l'outil le permet, à vérifier), signalement « Voix ou conversation de quelqu'un enregistrée sans accord ».
- Le cadre légal (droit finlandais sur l'enregistrement de conversations et la vie privée, RGPD) n'est pas affirmé dans cette spec. **À vérifier avec un juriste avant l'ouverture publique**, notamment : enregistrement de voix dans l'espace public, publication, responsabilité de Détour comme hébergeur.

### Mineurs

- L'app ne connaît pas l'âge des comptes (hypothèse à vérifier). Un mineur peut publier sa voix, ou enregistrer la voix d'autres enfants.
- À décider avec un juriste : âge minimum pour publier de l'audio, mentions dans les conditions d'utilisation. Motif de signalement « Concerne un enfant » à ajouter, traité en priorité.

### Harcèlement et contenu illégal

- Signalement possible depuis chaque extrait, y compris en mode balade audio (« Signaler cet extrait » dans les actions de l'extrait en cours, lisible par lecteur d'écran).
- Exemples à couvrir : insultes, désigner une personne (« ici habite… »), propos haineux, contenu illégal, enregistrement d'une conversation privée.
- Un extrait signalé passe en `hidden_pending_review` selon le seuil existant (à vérifier), puis `removed` ou `published` après revue. Un extrait retiré n'est plus servi (URL signée refusée) et est purgé des caches à la synchronisation suivante.
- Le pseudo de celui qui signale n'est jamais montré à l'auteur.
- Le circuit de traitement du contenu illégal (conservation pour les autorités, délais) est à définir avec un juriste.

### Données locales et permissions

- Micro : demandé seulement au premier « Décrire cet endroit », avec explication avant la demande système.
- Localisation en arrière-plan : nécessaire pour le mode balade audio écran éteint. Demandée au premier « Écouter la balade », avec explication : « Pour te prévenir en arrivant aux extraits, même écran éteint, Détour a besoin de ta position en arrière-plan. Elle reste sur ton téléphone. » Si refusée : écoute possible seulement écran allumé, l'app le dit.
- Position pendant l'écoute : locale, jamais envoyée.
- Position des extraits : publique avec la balade, comme le trajet. L'auteur le voit sur la carte avant publication. Recommandation dans la consigne : ne pas enregistrer devant chez soi ou devant chez quelqu'un.

### Suppression de compte et RGPD

- Suppression de compte : supprime tous les extraits audio, transcriptions et signalements d'obstacle vocaux de la personne, dans la base et dans Storage. Les balades publiées par la personne sont supprimées avec leurs extraits (comportement existant à vérifier).
- Les caches des autres appareils sont purgés à leur synchronisation suivante, au plus tard à l'expiration du cache (voir edge case balade supprimée). Ce délai est à valider avec un juriste.
- Droit d'accès et de portabilité : l'export des données du compte inclut les fichiers audio et transcriptions.
- Durée de conservation : tant que l'extrait est publié. Les signalements d'obstacle sont supprimés 30 jours après expiration. Les extraits retirés après signalement : durée de conservation à définir (preuve en cas de contenu illégal), à valider.
- Base légale, mentions dans la politique de confidentialité, registre des traitements : à mettre à jour, à relire avec un juriste.

## Edge cases

1. **GPS imprécis qui déclenche trop tôt.** Précision de 30 m, l'extrait « le banc est à ta gauche » se lance 30 m avant le banc. Comportement : le rayon s'adapte à la précision mais plafonne à 40 m ; au-delà, passage en manuel avec annonce. Si la précision dépasse 15 m au moment du déclenchement, l'extrait est précédé de « Tu arrives à peu près à l'endroit. » L'auteur voit la précision notée à l'enregistrement et peut corriger l'emplacement.
2. **GPS imprécis qui déclenche trop tard ou pas du tout.** La personne passe l'extrait sans le déclencher. Comportement : si la position sur le trajet (`path_offset`) dépasse celle de l'extrait de plus de 30 m, l'extrait est proposé : « Tu as passé un extrait. Je le lis maintenant ? » En lecture auto, un extrait « Attention » manqué est lu aussitôt avec « Attention, tu viens de passer : » en tête. En ville dense (immeubles), le test terrain mesure les écarts réels.
3. **Deux extraits proches qui se chevauchent.** Zones qui se recouvrent. Comportement : jamais deux en même temps, file par ordre du trajet, priorité sécurité (règles 9 et 10). À la création, l'écart minimum de 15 m entre deux « Description » limite le cas.
4. **Vent et bruit à l'enregistrement.** Comportement : jauge de niveau pendant l'enregistrement ; à la relecture, si l'analyse détecte du vent ou un niveau de bruit élevé : « Il y a beaucoup de vent ou de bruit. Ça s'entend bien ? Tu peux refaire, ou réduire le bruit de fond. » Jamais bloquant (le bruit peut être le sujet). Astuce dans « Que dire ? » : se mettre dos au vent, couvrir le micro avec la main sans le toucher.
5. **Appel téléphonique pendant l'écoute.** Comportement : pause immédiate (gérée par l'OS). Les extraits déclenchés pendant l'appel sont mis en file (« Description » au plus 2, « Attention » toujours gardés). Fin d'appel : les « Attention » en file sont lus d'abord, si la personne est encore à moins de 100 m de leur zone ; sinon « Pendant ton appel, tu as passé 2 extraits, dont une traversée. » Puis reprise de l'extrait interrompu depuis son début.
6. **Écouteurs débranchés.** Comportement : pause, pas de bascule automatique sur le haut-parleur. Vibration longue. Si un lecteur d'écran est actif, il annonce « Écouteurs débranchés, balade en pause. » La reprise demande une action.
7. **Casque Bluetooth qui se déconnecte ou se reconnecte.** Déconnexion : comme 6. Reconnexion : pas de reprise auto ; « Écouteurs reconnectés. Appuie pour reprendre. » Latence Bluetooth : le son de début d'extrait (« ding ») sert aussi de tampon pour ne pas couper les premiers mots.
8. **Micro refusé.** Comportement : « Décrire cet endroit » reste visible mais ouvre : « Le micro est désactivé pour Détour. Tu peux l'activer dans les réglages du téléphone. » [Ouvrir les réglages] [Plus tard]. Le reste de la balade (photos, trajet) marche.
9. **Micro pris par une autre app (appel, mémo vocal).** Comportement : « Le micro est utilisé par une autre app. Réessaie dans un moment. » Aucun fichier vide créé.
10. **Écoute sans réseau, balade téléchargée.** Comportement : tout marche (audio, transcriptions, trajet, directions). Les signalements partent en file d'envoi. Les extraits retirés depuis le téléchargement ne sont connus qu'à la reconnexion (risque accepté, cache limité, voir 19).
11. **Écoute sans réseau, balade non téléchargée.** Comportement minimum (avant décision hors-ligne) : en ligne, l'app précharge le trajet et les 3 extraits suivants, les « Attention » de toute la balade en priorité. Si un extrait manque : « Pas de réseau, je n'ai pas pu charger cet extrait. » Puis lecture de sa transcription par synthèse vocale si elle est en cache (transcriptions de toute la balade chargées au démarrage, quelques Ko).
12. **Enregistrement sans réseau.** Comportement : enregistrement et brouillon locaux, transcription faite à la reconnexion (si serveur) : « Transcription en attente de réseau. » Publication impossible tant que des transcriptions manquent, ou publication sans transcription à décider (question ouverte).
13. **Extrait trop long.** Bip et vibration à 25 s, arrêt net à 30 s, extrait gardé jusque-là : « 30 secondes, c'est le maximum. Tu peux continuer dans un nouvel extrait juste après. » Le nouvel extrait est placé à la même position, ordonné après le premier, sans la règle des 15 m.
14. **Silence.** Plus de 80 % de l'extrait sous le seuil de voix : « On n'entend presque rien. Le micro était couvert ? » [Refaire] [Garder quand même]. Les extraits gardés quand même restent publiables (silence volontaire possible, rare).
15. **Voix de passants captée.** À la relecture, si la transcription ou l'analyse suggère d'autres voix : « On dirait qu'il y a d'autres voix. Si quelqu'un parle de choses privées, refais l'extrait. » Non bloquant. Côté écoute : motif de signalement dédié.
16. **Langues.** L'auteur parle finnois alors que l'app est en français. Comportement : langue détectée et proposée à la relecture, modifiable. Les annonces de l'app sont dans la langue de l'app ; l'extrait reste dans sa langue. La fiche indique les langues : « Extraits en suomi et en français. » Un extrait qui mélange deux langues est transcrit dans la langue choisie, la qualité baisse ; l'auteur peut corriger. Pas de traduction en phase 1.
17. **Transcription fausse.** Toujours étiquetée « Transcription automatique » tant qu'elle n'est pas corrigée. L'auteur peut la corriger avant et après publication. Un suiveur peut signaler « Transcription fausse » (envoyé à l'auteur seulement). Une transcription qui contredit un extrait « Attention » n'est pas détectable automatiquement : l'audio fait foi, et la transcription d'un « Attention » est présentée à l'auteur avec une mise en avant : « Vérifie bien ce texte, c'est une info de sécurité. »
18. **Balade modifiée après publication.** La version augmente. Un suiveur en cours garde la version chargée jusqu'à la fin de sa session, sauf : extraits retirés pour abus (purgés dès que connus) et nouveaux extraits « Attention » (ajoutés en cours de route dès que connus). À la session suivante, la nouvelle version est chargée. Si la balade téléchargée a changé : « Cette balade a été mise à jour. Je télécharge la nouvelle version ? »
19. **Balade supprimée alors qu'un suiveur l'écoute.** Compromis entre droit de l'auteur et sécurité du suiveur : si la session est en cours et en cache, elle peut se terminer ; à la synchronisation suivante, l'app annonce : « Son auteur a retiré cette balade. Tu peux la finir, elle disparaîtra ensuite. » Purge à la fin de la session, au plus tard 6 h après (délai à valider avec un juriste). Si rien n'est en cache : arrêt avec la même annonce et rappel de la position actuelle par rapport au départ. Une balade non commencée disparaît du cache à la synchronisation.
20. **Audio signalé et retiré pendant l'écoute.** L'extrait est retiré de la file et du cache dès que connu. S'il s'agit d'un extrait « Attention », il est remplacé par une annonce neutre à son emplacement : « Un avertissement a été retiré à cet endroit. Sois prudent. » La fiche de la balade perd le tag « Accessible » en attendant que l'auteur repasse, et l'auteur est notifié.
21. **Quota de stockage atteint.** Règle 21. Brouillon local toujours possible. Aucun extrait perdu.
22. **Stockage du téléphone plein.** À l'enregistrement : « Ton téléphone n'a plus de place pour enregistrer. » Au téléchargement : « Pas assez de place pour télécharger la balade (3 Mo). Tu peux l'écouter en ligne. »
23. **L'écouteur n'est pas sur le chemin.** À plus de 40 m du trajet pendant 20 s : « Tu t'éloignes du chemin de la balade. Il est à environ 50 mètres, sur ta gauche. Je te le redis dans une minute si tu restes loin. » Rappel au plus une fois par minute, puis toutes les 3 minutes. Aucun extrait déclenché hors trajet. Pas d'itinéraire de retour. Option « Mettre la balade en pause » proposée au deuxième rappel.
24. **Balade parcourue à l'envers.** Détecté quand les extraits sont atteints dans l'ordre décroissant : « Tu fais la balade dans l'autre sens. Les gauche et droite des extraits seront inversés par rapport à toi. » Les annonces de l'app s'adaptent au sens réel ; les extraits, non. Les « Attention » restent annoncés à 40 m.
25. **Écoute en marchant vite.** Le rayon de déclenchement s'élargit avec la vitesse (rayon = vitesse × 6 s, entre 20 et 40 m) pour que l'extrait commence avant d'arriver. Si un extrait n'est pas fini quand le suivant arrive, le suivant attend (sauf « Attention », règle 10).
26. **Écoute à vélo.** Au-delà de 12 km/h pendant 30 s : « Tu vas vite. Les extraits sont pensés pour la marche. Je passe en lecture manuelle ? » [Oui] [Non]. Les « Attention » restent automatiques, annoncés à 80 m au lieu de 40.
27. **Lecture automatique vs manuelle.** Auto par défaut en mode balade audio, manuel par défaut hors mode balade audio (carte à l'écran). Réglable. En manuel, un extrait « Attention » joue quand même son annonce courte automatiquement (« Attention dans 40 mètres : traversée ») ; seul l'extrait complet attend une action. Ce point ne se désactive pas.
28. **Volume dans la rue.** Extraits normalisés à l'envoi. Pas de dépassement du volume système. Si le volume système est très bas au démarrage (sous 20 %, si l'OS le permet de le lire) : « Le volume est bas, tu risques de ne pas entendre les extraits. » Les autres apps audio (musique) baissent pendant un extrait et reprennent après.
29. **Lecteur d'écran qui parle en même temps qu'un extrait.** Pendant un extrait, l'app n'envoie pas d'annonce au lecteur d'écran (sauf « Attention »). Si l'utilisateur fait défiler l'écran pendant un extrait, l'OS gère la cohabitation ; le test vérifie que l'extrait reste compréhensible et qu'on peut le mettre en pause sans chercher.
30. **Batterie.** Localisation haute précision seulement à moins de 150 m d'un extrait, plus économe entre deux. À 20 % : annonce avec le nombre d'extraits restants. À 10 % : « Batterie à 10 %. Je te conseille d'arrêter la balade bientôt. » Mode économie d'énergie de l'OS actif : « Le mode économie d'énergie peut retarder les extraits. » Jamais d'arrêt silencieux : si l'app est tuée par le système, à la réouverture : « La balade s'est arrêtée. Je reprends à l'extrait 7 ? »
31. **App fermée ou tuée par l'OS en arrière-plan.** Si l'OS arrête la localisation en arrière-plan (cas connu sur certains Android), la notification permanente de la balade le signale quand c'est détectable. Les tests couvrent les constructeurs les plus courants.
32. **Compte supprimé (auteur).** Ses extraits disparaissent des balades d'autres personnes s'il y en avait (hypothèse : un extrait appartient toujours à la balade de son auteur). Suiveurs en cours : même comportement que 19.
33. **Compte supprimé (suiveur).** Ses signalements d'obstacle vocaux sont supprimés. Ses signalements d'abus restent anonymisés pour la modération (à valider).
34. **Interruption par une autre app audio ou un GPS voiture** (Siri, Google Assistant, navigation). Pause, reprise comme 5.
35. **Notification qui passe pendant un extrait.** Le son de notification ne coupe pas l'extrait (géré par l'OS selon la catégorie audio, à vérifier).
36. **Extrait enregistré au mauvais endroit (auteur corrige après publication).** Phase 2 : déplacement possible, la version de la balade augmente (voir 18).
37. **Deux personnes enregistrent à la même balade.** Hors périmètre : une balade n'a qu'un auteur (hypothèse). Pour ajouter des extraits à la balade de quelqu'un d'autre : non en phase 1.
38. **Enregistrement interrompu (appel, app en arrière-plan) pendant la prise.** Ce qui a été enregistré est gardé en brouillon : « L'enregistrement a été coupé. Tu veux garder ces 12 secondes ? »
39. **Mode sombre, gros caractères, réduire les animations.** L'écran du mode balade audio supporte la taille de police système maximale sans couper de texte. Réduire les animations : aucune transition, état final direct.
40. **Personne malvoyante qui utilise le zoom ou une grande police plutôt qu'un lecteur d'écran.** Le mode balade audio reste utilisable : boutons pleine largeur, texte d'état en gros, contraste 4,5:1 minimum en clair et en sombre.

## Tests

### Unitaires

| Cas | Résultat attendu |
|---|---|
| Rayon de déclenchement avec précision 10 m, vitesse 4 km/h | 20 m |
| Précision 35 m | rayon 35 m |
| Précision 50 m | pas de déclenchement auto, passage en manuel |
| Vitesse 20 km/h | rayon 33 m (vitesse × 6 s), « Attention » annoncé à 80 m |
| File : « Description » en cours, « Attention » arrive | « Description » coupée, « Attention » lue, reprise selon règle 10 |
| File : deux « Description » dans la même zone | lues dans l'ordre du trajet, jamais ensemble |
| Extrait passé de 35 m sans déclenchement | proposé « Tu as passé un extrait » ; « Attention » lu aussitôt |
| Sens de marche inversé sur 2 extraits | annonce de balade à l'envers |
| Générateur de phrases de direction | aucune sortie ne contient « traverse », « tu peux traverser », « c'est sûr », « la voie est libre » (liste testée sur toutes les combinaisons) |
| Arrondi des distances | 37 m → « 40 mètres », 230 m → « 250 mètres » |
| Extrait de 2 s | refusé ; 31 s impossible (coupé à 30 s) |
| Silence 85 % | alerte silence |
| Écart de 10 m entre deux « Description » | proposition de remplacer ou décaler ; « Attention » non concerné |
| Quota à 450 / 500 | alerte 90 % ; à 500, publication bloquée, brouillon autorisé |
| Tag « Sans escaliers » avec un extrait « Marches » | tag non proposé |
| Expiration obstacle | statut `expired` à J+14 |

### Intégration

| Cas | Résultat attendu |
|---|---|
| Publication d'une balade avec 12 extraits | 12 lignes `walk_audio_clips`, 12 fichiers dans le bucket, ordre correct |
| Lecture par un autre compte d'un fichier de brouillon | refusée (RLS) |
| URL signée d'un extrait passé en `removed` | refusée |
| Écriture dans le dossier d'un autre `author_id` | refusée |
| Suppression de la balade | extraits, fichiers, signalements d'obstacle supprimés |
| Suppression de compte | plus aucun fichier ni ligne liés au compte dans base et Storage |
| Transcription FR, FI, EN sur un jeu de 30 extraits enregistrés dans la rue | transcription produite pour chacun ; taux d'erreur mesuré et noté (seuil d'acceptation à fixer) |
| Enregistrement hors réseau puis reconnexion | envoi et transcription automatiques, aucun doublon |
| Signalement d'abus jusqu'au seuil | extrait en `hidden_pending_review`, plus servi aux nouveaux suiveurs |
| Mise à jour de version pendant une session | session conserve sa version, sauf retrait pour abus et ajout « Attention » |
| Export des données du compte | contient audios et transcriptions |

### Bout en bout

1. Créer une balade, enregistrer 3 extraits dont un « Attention / Traversée », corriger une transcription, publier. Attendu : balade visible dans le Cercle avec « 3 extraits » et l'extrait de sécurité marqué.
2. Un autre compte (ou sans compte) télécharge la balade, active le mode avion, la parcourt en simulation GPS. Attendu : 3 extraits joués dans l'ordre, annonce « Attention dans 40 mètres » avant la traversée.
3. Même parcours écran verrouillé. Attendu : tout fonctionne, contrôles écran verrouillé présents.
4. Pendant la simulation, l'auteur supprime la balade. Attendu : annonce de retrait à la synchronisation, fin possible, purge en fin de session.
5. Simulation d'appel entrant pendant un extrait puis passage d'un « Attention » pendant l'appel. Attendu : comportement de l'edge case 5.
6. Débrancher les écouteurs pendant la lecture. Attendu : pause, rien sur le haut-parleur.
7. Signaler un obstacle, puis un deuxième compte parcourt la balade. Attendu : obstacle annoncé comme info de sécurité, mention « non vérifié ».

### Accessibilité : VoiceOver (iOS)

1. Faire tout le flux d'écoute (fiche → avertissement → mode balade audio → fin) avec VoiceOver seul, écran masqué (rideau d'écran actif). Attendu : faisable sans aide, chaque élément a un libellé clair, ordre de lecture identique à la liste de l'écran.
2. Faire tout le flux d'enregistrement avec VoiceOver seul. Attendu : faisable, l'état d'enregistrement (en cours, temps, arrêté) est annoncé.
3. Le titre d'état se met à jour (« prochain extrait dans 50 m ») sans voler le focus.
4. Aucun élément décoratif (scotch, tampons, rotations) n'est lu.
5. Rotor : les actions de l'extrait en cours (répéter, transcription, signaler) sont disponibles en actions personnalisées.
6. Taille de police maximale : aucun texte coupé dans le mode balade audio.
7. Commandes du casque (AirPods et écouteurs filaires) : lecture, pause, suivant.

### Accessibilité : TalkBack (Android)

1. Mêmes scénarios 1 à 7 avec TalkBack, sur au moins deux constructeurs (par exemple Samsung et Pixel).
2. Notification permanente de la balade lisible et actionnable par TalkBack.
3. Localisation en arrière-plan qui survit 45 min écran éteint, avec optimisation de batterie constructeur active. Attendu : extraits déclenchés, ou à défaut l'arrêt est signalé.

### Accessibilité : visuel

- Contraste 4,5:1 vérifié sur tous les écrans de la feature, en clair et en sombre.
- Aucun état porté par la couleur seule (repère « Attention » distinct par l'icône et le libellé).
- Cibles 44 px minimum partout, boutons du mode balade audio pleine largeur.
- Réduire les animations : état final direct.

### Performance

- Batterie : 1 h de mode balade audio écran éteint, GPS adaptatif. Attendu : consommation mesurée et notée (cible à fixer, par exemple moins de 15 % sur un téléphone récent).
- Données : téléchargement d'une balade de 40 extraits sous 12 Mo.
- Latence : entre l'entrée dans la zone et le début du son, moins de 1 s balade téléchargée.

### Tests terrain avec des utilisateurs aveugles et malvoyants

Protocole commun :
- Avec l'accord éclairé des participants, en finnois, anglais ou français selon leur choix.
- Un accompagnant voyant suit à quelques mètres, prêt à intervenir, sans guider. Présence d'un instructeur de locomotion pour au moins une session.
- Parcours choisis à l'avance, de jour, avec au moins une traversée réglée par feux, une sans feux, des marches, une zone de travaux si possible.
- Participants avec canne et avec chien guide. Écouteurs à eux.
- Arrêt immédiat si une situation dangereuse apparaît. Chaque incident est noté et analysé avant la session suivante.

| Cas | Ce qu'on observe | Résultat attendu |
|---|---|---|
| Démarrage seul, téléphone en poche | peut lancer la balade et la mettre en pause sans aide | oui, en moins de 2 min |
| Arrivée à un extrait | moment où l'extrait commence par rapport au repère réel | l'extrait commence avant ou au repère, jamais plus de 10 m après, dans 8 cas sur 10 (à ajuster) |
| Approche d'une traversée | l'annonce « Attention » arrive assez tôt | le participant dit avoir eu le temps de se préparer |
| Formulation des directions | gauche/droite vs heures | préférence notée, choix par défaut décidé |
| Sortie du trajet volontaire | compréhension du message hors trajet | le participant comprend qu'il est sorti et où est le chemin approximativement |
| Bruit de rue | compréhension des extraits avec écouteurs ouverts | extraits compris, rue toujours audible |
| Verbosité | trop ou pas assez d'annonces | retour noté, réglage par défaut ajusté |
| Contenu des descriptions | ce qui a servi, ce qui manquait | consigne de l'auteur mise à jour |
| Appel pendant la balade | reprise | le participant sait où il en est après l'appel |

Aussi : 3 auteurs voyants testent la consigne et l'enregistrement en conditions réelles (vent, bruit). Attendu : extraits qui parlent du sol, des sons, des repères, sans relance.

## Critères d'acceptation

- [ ] Un auteur peut enregistrer, relire, corriger la transcription et publier des extraits de 3 à 30 s accrochés à sa position.
- [ ] La consigne « Décrire pour quelqu'un qui ne voit pas » est montrée avant le premier enregistrement et reste accessible.
- [ ] Chaque extrait a une transcription automatique en français, finnois ou anglais, étiquetée comme telle tant qu'elle n'est pas corrigée.
- [ ] Un suiveur entend chaque extrait en arrivant à son emplacement, sans action, dans le sens de la balade.
- [ ] Jamais deux audios en même temps ; un extrait « Attention » passe toujours en premier et est annoncé avant d'arriver.
- [ ] Aucune phrase générée par l'app ne dit de traverser ni qu'un passage est sûr (test automatique).
- [ ] Le mode balade audio est utilisable du début à la fin avec VoiceOver et avec TalkBack, écran masqué.
- [ ] Le mode balade audio marche écran verrouillé, avec les commandes du casque et de l'écran verrouillé.
- [ ] Le GPS imprécis fait passer en manuel avec annonce, au lieu de déclencher n'importe où.
- [ ] Hors du trajet, l'app prévient sans proposer d'itinéraire.
- [ ] Appel, écouteurs débranchés, Bluetooth, batterie faible : comportements conformes aux edge cases.
- [ ] Une balade téléchargée s'écoute entièrement sans réseau.
- [ ] Un extrait peut être signalé depuis le mode balade audio ; un extrait retiré n'est plus lisible ni par URL ni en cache après synchronisation.
- [ ] Un extrait « Attention » retiré laisse une annonce neutre « Sois prudent » à son emplacement.
- [ ] Les tags « Accessible » et « Sans escaliers » sont affichés « déclarés par l'auteur ».
- [ ] La suppression de compte supprime tous les audios et transcriptions de la personne (base et Storage).
- [ ] Aucune donnée de position du suiveur n'est envoyée au serveur.
- [ ] Contraste, cibles 44 px, mode sombre et réduire les animations respectés sur tous les écrans de la feature.
- [ ] Au moins 3 sessions terrain avec des personnes aveugles ou malvoyantes menées, retours intégrés, valeurs par défaut revues.
- [ ] Les points juridiques listés en Safety ont été relus par un juriste avant ouverture publique.

## Hypothèses à vérifier

1. Une balade publiée dans le Cercle a déjà un trajet (suite de points) stocké sur Supabase, avec un auteur unique. Le format exact du trajet n'est pas connu.
2. Il existe une table de balades publiées à laquelle ajouter `version`, `has_audio`, les tags et la durée totale.
3. Il existe une table et un circuit de signalements d'abus réutilisables, avec un seuil de masquage automatique (valeur inconnue).
4. Le flux de suppression de compte existant peut être étendu aux fichiers de Storage.
5. L'app gère déjà le français, le finnois et l'anglais côté interface (i18n). Sinon, les textes de cette spec sont en français seulement en phase 1.
6. La stack Expo utilisée permet : enregistrement audio, lecture en arrière-plan, localisation en arrière-plan avec geofencing ou suivi continu, contrôles média écran verrouillé, réception des boutons du casque. À vérifier sur la version d'Expo du projet, y compris le besoin éventuel de modules natifs.
7. Le suivi de trajet existant peut fournir la position et le cap en temps réel au mode balade audio sans double consommation de GPS.
8. Les écrans existants (Carte, Cercle, fiche balade) sont plus ou moins compatibles avec VoiceOver et TalkBack. Le niveau actuel n'est pas connu : la navigation jusqu'à « Écouter la balade » doit être auditée.
9. Écouter une balade publiée est possible sans compte aujourd'hui.
10. L'app ne connaît pas l'âge des utilisateurs.
11. Les fichiers partagés dans Storage passent aujourd'hui par un bucket public ou privé : à vérifier, cette feature demande un bucket privé avec URL signées.
12. Le cap GPS (direction de déplacement) est disponible et assez fiable à vitesse de marche sur les téléphones visés.
13. Les boutons volume ne peuvent sans doute pas servir à arrêter un enregistrement sur iOS sans contournement : à vérifier, sinon seul le bouton du casque est retenu.

## Questions ouvertes

1. **Écoute hors-ligne** : téléchargement obligatoire avant le mode balade audio, proposé, ou automatique pour les balades sauvegardées ? Durée de vie du cache ? (Proposition : proposé par défaut, obligatoire pour les balades marquées « Accessible ».)
2. **Transcription** : sur l'appareil (plus privé, qualité variable en finnois) ou côté serveur (qualité, coût, prestataire, transfert de données) ? Quel prestataire, et ses garanties sur la conservation et l'usage des audios ?
3. Publication autorisée si une transcription manque (enregistrement hors réseau) ?
4. **Directions** : gauche/droite ou position en heures par défaut ? À trancher après la phase 0.
5. Seuil de signalements avant masquage automatique d'un extrait, et qui revoit les signalements (délai de traitement) ?
6. Signaler un obstacle sans compte : oui ou non ?
7. Proposer une voix de synthèse lue à partir du texte, pour les auteurs qui ne veulent pas publier leur voix ?
8. Traduction des transcriptions (et synthèse vocale dans la langue du suiveur) : utile, et à quelle phase ?
9. Âge minimum pour publier de l'audio ?
10. Délai acceptable entre la suppression d'une balade ou d'un compte et la purge des caches des autres appareils (6 h proposé) ?
11. Faut-il un label « testée par une personne aveugle » sur une balade, et qui le donne ?
12. Peut-on ajouter des extraits à la balade de quelqu'un d'autre (description à plusieurs voix) ?
13. Durée de conservation des extraits retirés pour contenu illégal ?
14. Valeurs par défaut à confirmer en test : rayon 20 m, annonce sécurité à 40 m, plafond 40 m, seuil vélo 12 km/h, hors trajet à 40 m.

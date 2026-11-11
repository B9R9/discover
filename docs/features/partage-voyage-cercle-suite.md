# Partager un voyage dans le Cercle : spec (suite)

Suite de partage-voyage-cercle.md (sections Safety, Edge cases, Tests, Critères, Hypothèses, Questions ouvertes).

## Safety

C'est l'axe principal de la feature. Partager un trajet, c'est partager des habitudes de déplacement. La règle : rien ne part sans choix explicite, et ce qui part ne permet pas de retrouver où vit la personne ni où elle est maintenant.

### Domicile et lieux sensibles

- Zones privées réglées par l'utilisateur, obligatoires (ou refus explicite) avant le premier trajet partagé.
- Suggestion locale du lieu de nuit : on regarde, sur l'appareil, où le téléphone est immobile entre minuit et 6 h sur plusieurs nuits. Le résultat n'est jamais envoyé. Il sert seulement à proposer une zone. Texte honnête : « On pense que tu dors souvent par ici. » et pas « On a trouvé ton domicile. »
- Le trou dans le trajet ne doit pas pointer vers le domicile. Leçon connue des apps de sport : si le trajet s'arrête toujours au bord d'un cercle centré sur la maison, plusieurs trajets suffisent à retrouver le centre. D'où le centre décalé au hasard (règle 11), la taille minimale de 400 m, et le raccourcissement aléatoire du début et de la fin (règle 12), même hors zone.
- Plusieurs balades partagées par le même compte : le décalage est fixe par zone, donc les trous se superposent au même endroit et ne permettent pas d'affiner. Test dédié (voir Tests).
- Un lieu dans une zone privée n'est jamais partageable.
- Lieux sensibles hors zones (hôpital, refuge, lieu de culte, école) : pas de détection automatique dans cette phase. L'écran des zones le mentionne (« Pense à chez toi, ton travail, l'école des enfants »). Question ouverte pour une liste de catégories à proposer.

### Délai et arrondi

- Pas de partage en temps réel. Rétention de 24 heures pour le trajet et les pages récents d'un voyage en cours.
- Seuls mois et année publiés. Pas d'heure, pas de jour de la semaine, donc pas de routine lisible (« tous les mardis à 7 h »).
- Lieux arrondis à environ 10 m. Distance au km.

### Métadonnées des photos

- Ré-encodage sur l'appareil, qui retire toutes les métadonnées.
- Contrôle serveur avant mise en ligne : un fichier qui contient encore des données de position est refusé et l'envoi échoue avec « Une photo n'a pas pu être nettoyée. Réessaie. » On ne publie jamais en se fiant seulement à l'appareil.
- Le nom du fichier envoyé est l'identifiant de page, jamais le nom d'origine (qui peut contenir une date ou un nom).

### Personnes, enfants, plaques

- Rappel systématique à l'écran 3, détection de visages si disponible, outil de flou.
- Le flou est appliqué sur l'image envoyée, de façon irréversible (pas un calque qu'on pourrait retirer).
- Mineurs utilisateurs : flou proposé par défaut sur les visages.
- Signalement « Je suis sur cette photo » et « Il y a un enfant » : masquage immédiat, possible sans compte.
- Règles du Cercle : pas de photo d'enfant identifiable sans accord des parents, pas de photo de personne reconnaissable sans son accord.

### Partage à l'insu

Deux cas :
1. Quelqu'un qui a accès au téléphone publie un voyage à la place de la personne (par exemple pour la pister). Parades : l'aperçu montre tout, la page Moi > Mes partages liste tout ce qui est publié, et une notification locale apparaît à chaque publication (« Ta balade “Suomenlinna” est dans le Cercle. »). Question ouverte : redemander le code e-mail à la première publication sur un appareil.
2. Quelqu'un publie une photo d'une autre personne sans son accord. Parades : rappel, flou, signalement « Je suis sur cette photo » avec masquage immédiat.

### Harcèlement et traque

- Pas de position en direct, pas d'heure, rétention de 24 heures.
- Proposition : une liste des balades par pseudo existe (c'est naturel dans un Cercle), mais sans statistiques globales (pas de « zone la plus fréquentée », pas de carte cumulée). À valider (Questions ouvertes, point 2).
- Pas de messagerie, pas de commentaires dans cette feature.
- Blocage réciproque pour les connectés. Limite dite honnêtement dans l'interface : un visiteur sans compte peut toujours voir.
- Signalement « Harcèlement ou menace » et « Ça montre où vit quelqu'un ».
- Changement de pseudo possible pour échapper à quelqu'un, mais limité à une fois par 30 jours et ancien pseudo réservé 90 jours pour éviter l'usurpation.

### Signalements, retrait, blocage

- Voir Règles métier 28 à 36.
- Les signalements abusifs (pour faire taire quelqu'un) sont possibles. Le masquage immédiat est limité à trois catégories graves. La vérification humaine rétablit si besoin.
- Limite de fréquence : 10 signalements par compte et par jour, 3 par appareil et par jour sans compte.
- L'identité de qui signale n'est jamais montrée à l'auteur.

### Suppression de compte et droit à l'effacement

- Moi > Compte > Supprimer mon compte. Confirmation par le code e-mail.
- Texte : « On efface ton compte, ton pseudo, tes balades publiées et leurs photos sur nos serveurs. Ce qui est sur ton téléphone reste sur ton téléphone. »
- Effacement immédiat en base et dans Storage. Les sauvegardes Supabase gardent les données le temps de leur rotation (durée à vérifier, voir Hypothèses). La politique de confidentialité doit donner cette durée réelle.
- Les signalements que la personne a faits sont anonymisés. Les signalements visant ses contenus sont gardés sans contenu (catégorie, date) pour l'historique de modération, 12 mois maximum.
- Ceux qui avaient sauvegardé ses balades voient « Cette balade n'est plus disponible. » et peuvent l'enlever de leur liste. Les lieux qu'ils ont découverts eux-mêmes en la suivant restent à eux.

### RGPD

- Base légale : exécution du service demandé (publier) pour les données publiées, consentement explicite pour les photos de personnes (déclaré par l'utilisateur).
- Données minimales : e-mail, pseudo, tranche d'âge, contenus choisis. Pas d'adresse IP gardée au-delà des journaux techniques de Supabase (durée à vérifier).
- Droit d'accès et de portabilité : export JSON des publications, pages, sauvegardes, blocages, signalements faits (lot 3c).
- Droit de rectification : pseudo, titre, notes (par mise à jour du partage).
- Droit à l'effacement : dépublier et supprimer le compte.
- Âge du consentement numérique en Finlande : 13 ans. Pas de compte en dessous.
- Sous-traitant : Supabase. Région UE à confirmer. Accord de traitement signé avant la bêta.
- Politique de confidentialité : chaque phrase sur les données doit être vraie dans le produit. En particulier, ne pas écrire « tes photos ne quittent jamais ton téléphone » sans la précision « sauf celles que tu publies ».
- Signalement « Contenu illégal » : procédure de retrait et de conservation si la loi l'exige (à cadrer, voir Questions ouvertes).

### Permissions

- Aucune nouvelle permission pour publier.
- Notifications locales : demandées seulement si l'utilisateur publie un voyage en cours (pour la publication différée), avec le texte « On te prévient quand les pages d'aujourd'hui sont parties. » Refus possible, la publication se fait quand même à la prochaine ouverture.
- Envoi en arrière-plan : utilise ce que l'OS permet. Si l'OS coupe, reprise à la prochaine ouverture.

## Edge cases

1. **Partage d'un voyage encore en cours.** Écran 1 affiche l'encadré « Ce voyage n'est pas fini... ». Les pages et le trajet des dernières 24 heures sont marqués « Partira demain » dans la liste et absents de l'aperçu (avec un repère « 2 pages partiront demain »). Le lendemain, elles sont ajoutées à la publication si l'utilisateur ne les a pas décochées entre-temps. Les nouvelles pages ajoutées après la publication ne sont pas ajoutées automatiquement : badge « MODIFIÉ » et « Mettre à jour le partage ».
2. **Voyage terminé puis repris (si possible en phase 1).** Même comportement qu'en cours pour la partie reprise.
3. **Voyage modifié après partage (note, titre, ordre).** Badge « MODIFIÉ ». La version publiée ne change pas tant que l'utilisateur n'a pas mis à jour. La mise à jour repasse par l'aperçu et remplace la publication en une fois (pas d'état intermédiaire visible).
4. **Lieu supprimé en local après partage.** Feuille : « Ce lieu est aussi dans ton partage. Le retirer du Cercle ? » Oui par défaut. Oui : la page est retirée de la publication tout de suite (ou dès qu'il y a du réseau), sa photo effacée de Storage, la numérotation recalculée, le trajet recoupé sur 200 m autour. Non : la page reste publiée, badge « MODIFIÉ ».
5. **Dernière page partagée supprimée en local.** La feuille dit : « C'était la dernière page partagée. La balade va être retirée du Cercle. » Oui : dépublication complète.
6. **Voyage supprimé en local alors qu'il est partagé.** Feuille : « Ce voyage est dans le Cercle. Tu veux aussi le retirer ? » Choix « Retirer aussi » (principal) ou « Laisser dans le Cercle ». S'il reste, il apparaît dans Moi > Mes partages avec « Voyage supprimé de ton téléphone » et seule l'action « Dépublier » est possible.
7. **Un lieu ou une photo qu'on ne veut pas partager.** Décocher la page à l'écran 1. Rien de cette page ne part. En mode « Tout le voyage », le trajet est coupé sur 200 m autour du lieu. L'aperçu le montre.
8. **Trajet qui passe devant le domicile, zone réglée.** Le trajet est coupé dans la zone (centre décalé). L'aperçu dit « On a caché 1 passage près de tes zones privées. »
9. **Trajet qui passe devant le domicile, aucune zone réglée et suggestion de nuit disponible.** L'écran 2 propose la zone. Impossible de continuer avec le trajet coché sans ajouter une zone ou cocher « Je n'ai pas d'endroit à cacher ».
10. **Trajet qui commence ou finit au domicile mais l'utilisateur a dit « pas d'endroit à cacher ».** Le raccourcissement aléatoire de 300 à 600 m s'applique quand même. Le trajet ne commence pas sur la porte.
11. **Trajet entièrement dans une zone privée.** Le trajet partagé est vide. L'aperçu : « Tout le trajet est dans une zone privée. Il ne sera pas partagé. » La publication part sans trajet.
12. **Zone privée ajoutée après une publication.** Message : « Une de tes balades passe par cette nouvelle zone. On la met à jour ? » Oui par défaut, recoupe et republie sans repasser par tout le flux.
13. **Photo avec visage détecté.** Écran 3, choix « Flouter » ou « Oui, elle est d'accord ». Impossible de passer sans choisir. Utilisateur 13 à 17 ans : « Flouter » présélectionné.
14. **Photo avec visage non détecté (détection ratée ou indisponible).** Rappel fixe, outil de flou manuel. Le signalement reste le filet.
15. **Photo avec plaque d'immatriculation ou numéro de porte.** Rappel fixe, flou manuel.
16. **Upload interrompu (app fermée, réseau coupé).** La file reprend à la prochaine connexion. Les fichiers déjà envoyés et vérifiés ne sont pas renvoyés. La publication reste en `envoi`, invisible. Statut « En attente : envoi en cours » sur la page de partage.
17. **Publication sans réseau du tout.** Le flux fonctionne jusqu'à l'aperçu. Au moment de « Publier », si le compte existe déjà : mise en file, message « Pas de réseau. On publiera dès qu'il revient. » Si pas de compte : impossible de recevoir le code, message « Il faut du réseau pour créer ton compte. Ton partage est gardé. »
18. **Envoi bloqué plus de 7 jours.** La publication en `envoi` et ses fichiers côté serveur sont effacés par une tâche serveur. L'app propose « Recommencer l'envoi ».
19. **Très grosses photos (50 Mo, panoramas, 8000 px).** Redimensionnées à 2048 px sur le grand côté. Panorama très large : grand côté limité à 4096 px pour rester lisible, poids toujours sous 3 Mo, sinon qualité réduite jusqu'à passer.
20. **Photo dans un format exotique (HEIC, vidéo, live photo).** HEIC converti en JPEG. Vidéo et partie animée des live photos jamais envoyées : seule l'image fixe part.
21. **Quota atteint pendant le choix.** Avant l'envoi, l'app calcule le poids préparé. Si ça dépasse : « Cette balade dépasse ta place restante (42 Mo libres). Retire des pages ou dépublie une ancienne balade. » Bouton « Voir mes partages ».
22. **Quota atteint pendant l'envoi (autre appareil a publié entre-temps).** Le serveur refuse. Message identique. La publication reste en `envoi`, invisible, et est nettoyée si abandonnée.
23. **Compte supprimé alors que des gens ont sauvegardé la balade.** Chez eux : « Cette balade n'est plus disponible. » Bouton « Enlever de ma liste ». Leurs propres découvertes restent.
24. **Utilisateur bloqué qui avait sauvegardé la balade.** La sauvegarde est masquée chez lui (la balade n'est plus lisible pour lui). Il voit « Cette balade n'est plus disponible. » Rien ne dit qu'il a été bloqué.
25. **Utilisateur bloqué qui se déconnecte pour voir quand même.** Il voit les balades publiées comme n'importe quel visiteur. C'est la limite dite dans l'interface. Signalement « Harcèlement ou menace » pour traiter le cas.
26. **Utilisateur bloqué qui crée un autre compte.** Pas de parade technique dans cette phase. Signalement et modération. Question ouverte.
27. **Contenu signalé, catégorie grave.** Page masquée tout de suite. L'auteur voit dans sa page de partage : « Une page est masquée : quelqu'un dit être sur la photo. On vérifie. » Il peut retirer la page lui-même tout de suite.
28. **Contenu signalé, catégorie non grave, un seul signalement.** Rien ne change pour les visiteurs. Vérification en file.
29. **Contenu retiré par la modération.** Statut `retire`, fichier effacé de Storage. L'auteur voit « Cette page a été retirée : [catégorie]. » Il ne peut pas la republier telle quelle (même empreinte d'image refusée).
30. **Signalement de son propre contenu.** Pas proposé (menu « Signaler » absent sur ses propres balades).
31. **Pseudo changé.** Le nouveau pseudo s'affiche partout, y compris dans les liens déjà partagés (le lien contient l'identifiant de la balade, pas le pseudo). Les blocages tiennent (ils portent sur l'identifiant du compte).
32. **Pseudo changé deux fois en moins de 30 jours.** Refusé : « Tu pourras changer de pseudo à partir du 8 déc. »
33. **Partage page par page puis passage à tout le voyage.** « Mettre à jour le partage » rouvre l'écran 1 avec le mode « Quelques pages » et les pages déjà cochées. Passer à « Tout le voyage » ajoute la ligne trajet et repasse par les zones privées si besoin.
34. **Partage entier puis passage à quelques pages.** Le trajet est retiré de la publication à la mise à jour. L'aperçu le montre.
35. **Voyage partagé puis dépublié.** Effacement serveur immédiat. Lien : « Cette balade n'est plus partagée. » Sauvegardes : « Cette balade n'est plus disponible. » Republier plus tard crée une nouvelle publication avec un nouveau lien (l'ancien lien ne revit pas).
36. **Dépublier sans réseau.** La balade est masquée en local tout de suite et la demande est mise en file. Message honnête : « On la retire dès que tu as du réseau. Pour l'instant, elle est encore visible. » Pas de faux « C'est retiré ».
37. **Deux appareils pour un même compte.** Le voyage et ses photos sont sur l'appareil d'origine. L'autre appareil voit la balade dans Mes partages et peut copier le lien ou dépublier. « Mettre à jour le partage » n'y est pas proposé, avec le texte « Ce voyage est sur un autre téléphone. »
38. **Deux appareils publient en même temps.** Le serveur garde la version la plus récente (`version` incrémentée). L'autre appareil reçoit un refus de conflit et affiche « Ce partage a changé sur un autre téléphone. » avec « Voir la version en ligne ».
39. **Zones privées sur deux appareils.** Les zones sont locales, donc différentes par appareil. Un voyage est toujours traité avec les zones de l'appareil d'origine. Le premier partage sur un nouvel appareil repasse par l'écran 2. Question ouverte : synchroniser les zones (chiffrées) ou non.
40. **Voyage importé depuis la galerie avec photos hors d'Helsinki.** Pages hors zone grisées avec « Hors d'Helsinki : le Cercle ne couvre qu'Helsinki pour l'instant. » Si toutes sont hors zone, le bouton de partage est désactivé.
41. **Photo importée sans position.** La page n'a pas de lieu partageable sur la carte. Elle est grisée : « Cette photo n'a pas de lieu. » (le lieu est nécessaire pour qu'on puisse parcourir la balade).
42. **Voyage importé : trajet absent.** Pas de ligne « Le trajet ». Seules les pages.
43. **Lien partagé hors de l'app, app non installée.** Page web minimale sans contenu de la balade, liens vers les stores. Aucune vignette dans la messagerie.
44. **Lien vers une balade masquée ou retirée.** « Cette balade n'est plus partagée. » Même message que dépubliée, pour ne rien révéler de la modération.
45. **Lien deviné ou énuméré.** L'identifiant aléatoire rend la devinette impraticable. Limite de fréquence côté serveur sur la résolution des liens.
46. **Lien ouvert par un utilisateur bloqué connecté.** « Cette balade n'est plus partagée. »
47. **Mineur 13 à 17 ans.** Mode « Tout le voyage » non proposé, seule l'option « Quelques pages » apparaît, avec le texte « Le trajet ne se partage qu'à partir de 18 ans. » Flou par défaut sur les visages détectés.
48. **Utilisateur qui déclare moins de 13 ans.** « Le Cercle est ouvert à partir de 13 ans. Tu peux continuer à utiliser ton carnet sans compte. » Pas de compte créé. La réponse n'est pas gardée côté serveur.
49. **Utilisateur qui change sa tranche d'âge.** Passage de `13_17` à `18_plus` possible depuis Moi, une fois. L'inverse aussi. Si passage à `13_17`, les trajets déjà publiés sont retirés.
50. **Code e-mail jamais reçu (limite d'envoi du service intégré atteinte).** Message de l'écran 5b. Le brouillon reste. Pas de boucle de renvoi infinie (5 demandes par heure maximum).
51. **E-mail déjà lié à un compte.** Le code connecte au compte existant. Pas d'écran pseudo si le compte en a déjà un.
52. **Pseudo pris entre la vérification et la validation.** Refus serveur : « Ce pseudo vient d'être pris. Choisis-en un autre. »
53. **Compte suspendu par la modération.** « Publier » refusé : « Tu ne peux plus publier dans le Cercle pour l'instant. » Dépublier et supprimer restent possibles.
54. **Note contenant une adresse, un numéro de téléphone.** Pas de filtre automatique dans cette phase. L'aperçu montre la note. Signalement « Ça montre où vit quelqu'un ».
55. **Titre de voyage local contenant une info perso (« Chez maman, Kallio »).** Le titre est modifiable dans l'aperçu et affiché en clair là. Pas de filtre.
56. **Mode sombre.** Aperçu et vue Cercle respectent les tokens en mode sombre. Les photos ne sont pas teintées.
57. **Lecteur d'écran.** Chaque page de l'aperçu est lue : « Page 2, Café Regatta, photo, note : ... ». Le trajet est décrit : « Trajet de 4 km, 2 passages cachés. » (le nombre de passages cachés n'est lu que dans l'aperçu de l'auteur).
58. **Réduire les animations.** Barre d'envoi, apparition du tampon « PUBLIÉ » et transitions sautent à l'état final.
59. **Publication pendant que la modération retire une page.** La mise à jour de l'auteur ne peut pas réintroduire une page retirée (même empreinte refusée).
60. **Suppression du compte pendant un envoi.** L'envoi est annulé, les fichiers déjà envoyés effacés avec le reste.

## Tests

### Unitaires

| Cas | Résultat attendu |
|---|---|
| Coupe du trajet : ligne qui traverse une zone de 800 m | Aucun point à moins de 800 m du centre décalé. Deux morceaux en sortie. |
| Coupe : ligne tangente à une zone | Partie dans le rayon retirée, reste intact. |
| Centre décalé : 1000 zones générées | Décalage toujours ≤ rayon / 3, jamais nul, fixe après création. |
| Raccourcissement début et fin | Longueur retirée entre 300 et 600 m de chaque côté. Trajet de moins de 1,2 km : publié vide. |
| Simplification | Écart max 15 m avec la ligne d'origine coupée. Aucun horodatage dans la sortie. |
| Page décochée en mode entier | Trajet coupé sur 200 m autour du lieu. |
| Arrondi des lieux | 4 décimales exactement. |
| Lieu dans une zone privée | Marqué non partageable. |
| Lieu hors Helsinki | Marqué non partageable. |
| Date publiée | Tronquée au premier jour du mois. |
| Rétention 24 h | Page faite il y a 23 h : retenue. Page faite il y a 25 h : publiée. Trajet récent jamais publié avant 24 h même avec « Publier cette page maintenant ». |
| Nettoyage photo | Fichier de sortie sans EXIF, GPS, XMP, IPTC. Vérifié avec un lecteur de métadonnées sur 20 photos réelles (iPhone HEIC, Android JPEG, photo retouchée, capture d'écran). |
| Redimensionnement | 8000×6000 en sortie 2048×1536, poids < 3 Mo. Panorama 20000×3000 en sortie 4096 de large, < 3 Mo. |
| Flou | Pixels de la zone floutée différents de l'original, impossible de retrouver l'original à partir du fichier (pas de calque). |
| Validation pseudo | Cas limites : 2 et 21 caractères refusés, « Admin » refusé, « baptiste » et « BAPTISTE » considérés identiques. |
| Numérotation | Pages 1, 3, 7 cochées : tampons 1, 2, 3. |
| Âge 13 à 17 | Option « Tout le voyage » absente. |

### Intégration Supabase : règles d'accès avec plusieurs utilisateurs

Jeu de test sur une base locale ou une branche Supabase, avec ces acteurs :
- **A** : auteur, 18 ans et plus.
- **B** : membre connecté sans lien.
- **C** : membre que A a bloqué.
- **D** : membre qui a bloqué A.
- **V** : visiteur sans compte (clé publique seule).
- **M** : modération (rôle serveur).
- **S** : compte suspendu.

Données : A a une publication `publie`, une en `envoi`, une `masque`, une `retire`, une page `masque` dans la publication `publie`.

| Test | Résultat attendu |
|---|---|
| B lit la publication `publie` de A | Visible, avec pages `visible` et trajet. |
| B lit la publication `envoi`, `masque`, `retire` de A | Aucune ligne. |
| B lit la page `masque` | Aucune ligne. |
| C lit les publications de A | Aucune ligne, y compris par le slug. |
| A lit les publications de C | Aucune ligne. |
| D lit les publications de A | Aucune ligne. |
| V lit la publication `publie` | Visible (limite assumée). |
| V lit `envoi`, `masque`, `retire` | Aucune ligne. |
| A lit toutes ses publications | Toutes, avec motifs de masquage. |
| B crée une publication au nom de A | Refus. |
| A crée une publication directement en `publie` | Refus. |
| A passe sa publication de `envoi` à `publie` par mise à jour directe | Refus. |
| A passe `masque` à `publie` | Refus, directement et par la fonction serveur. |
| A modifie une page d'une publication `publie` | Refus (seulement en `envoi`, la mise à jour crée une nouvelle version). |
| S crée une publication | Refus. |
| B modifie le pseudo de A | Refus. |
| B lit `age_bracket` ou `publication_suspendue` de A | Refus ou colonne absente. |
| B lit l'e-mail de A par n'importe quelle table ou vue | Impossible. |
| B lit les sauvegardes de A | Aucune ligne. |
| A lit qui a sauvegardé sa balade | Seulement un total. |
| C lit la table `blocks` | Ne voit que ses propres blocages, aucune trace de celui de A. |
| A lit les signalements faits sur sa publication | Aucune ligne. Seulement `moderation_events` avec la catégorie. |
| B lit les signalements de quelqu'un d'autre | Aucune ligne. |
| V crée un signalement « Autre » | Refus. |
| V crée un signalement « Je suis sur cette photo » | Accepté, limité à 3 par jour. |
| B fait 11 signalements dans la journée | Le 11e est refusé. |
| B signale deux fois le même élément | Le 2e est refusé. |
| B envoie un fichier dans le dossier de A | Refus. |
| A envoie un fichier pour une publication `publie` ou d'un autre | Refus. |
| A envoie un fichier de 4 Mo | Refus. |
| A envoie un fichier avec GPS dans l'EXIF puis appelle le passage en `publie` | Refus du passage, publication reste en `envoi`. |
| B demande une URL signée pour une photo de A `publie` | Accordée, expire en 1 heure. |
| C demande la même URL | Refus. |
| B demande une URL signée pour une photo d'une page `masque` | Refus. |
| B ou V liste le dossier de A dans Storage | Refus. |
| A dépublie, puis B réutilise une URL signée obtenue avant | Fichier introuvable (effacé). |
| M masque une page | La page disparaît pour B, C, D, V, reste visible pour A avec motif. |
| A supprime son compte | Toutes ses lignes et fichiers effacés. Signalements de A anonymisés. Sauvegardes de B pointant vers A : balade illisible. |

### Tests de fuite de données

| Test | Résultat attendu |
|---|---|
| Requête avec jointures imbriquées (publications avec profil, pages, routes) en tant que B, C, V | Aucune donnée d'une ligne normalement cachée ne remonte par la jointure. |
| Requête de comptage (en-tête de total) sur `publications`, `saves`, `blocks`, `reports` en tant que B et V | Le total ne compte que les lignes visibles. Pas de déduction possible du nombre de publications masquées de A, ni de qui a bloqué qui. |
| Abonnements temps réel sur les tables en tant que B et V | Aucun événement sur des lignes non visibles. Si le temps réel n'est pas utilisé, il est désactivé sur ces tables. |
| Appel de chaque fonction serveur avec l'identité d'un autre | Refus. Vérifier qu'aucune fonction n'agit sur la seule foi d'un identifiant passé en paramètre. |
| Toutes les tables du schéma public ont les règles d'accès activées | Test automatique qui échoue si une table n'en a pas. |
| Fichiers dans Storage après publication | Lecture de chaque fichier par un outil de métadonnées : aucune position, aucun modèle d'appareil, aucune date. |
| Nom des fichiers dans Storage | Seulement identifiants, pas de nom d'origine. |
| Trajet publié : chercher des horodatages | Aucun. |
| Trajet publié vs zones privées de A | Aucun point à moins du rayon du centre décalé. Test sur 50 trajets réels de l'équipe. |
| Triangulation : 10 balades de A qui partent toutes de chez lui | Estimation du domicile par le centre des trous et les débuts de trajets : erreur moyenne d'au moins 250 m. Sinon, augmenter le raccourcissement. |
| Lien d'une balade dépubliée | Aucune donnée renvoyée, même message que pour une balade inexistante (pas de différence de réponse ou de temps qui trahisse l'existence). |
| Page web du lien | Code source de la page sans titre, pseudo, photo, coordonnées. Pas de balises d'aperçu avec contenu. |
| Journaux de l'app (crash, analytique) | Aucune coordonnée, aucun e-mail, aucun chemin de photo dans les journaux envoyés. |
| Réponses d'erreur du serveur | Pas de détail interne (nom de colonne d'e-mail, identifiant d'autre utilisateur). |
| Ce qui part au moment de « Publier » | Capture réseau : seules les pages cochées, le trajet coupé, les photos nettoyées. Aucun envoi avant « Publier ». Aucun envoi des zones privées ni de la suggestion de nuit. |

### Bout en bout

| Cas | Résultat attendu |
|---|---|
| Nouvel utilisateur sans compte publie un voyage entier | Passe par les 7 écrans, reçoit le code, choisit un pseudo, la balade apparaît pour un 2e appareil connecté avec un autre compte. |
| Publication de quelques pages | Aucun trajet chez les autres. |
| Envoi coupé (mode avion à 50 %) puis réseau revenu | Reprise sans doublon, balade visible seulement à la fin. |
| Dépublier | Disparaît du Cercle et des sauvegardes chez B en moins de 10 s (après rafraîchissement). |
| Bloquer depuis B | B ne voit plus les balades de A, A ne voit plus celles de B. |
| Signaler « Je suis sur cette photo » sans compte | Page masquée tout de suite pour tous sauf A. |
| Supprimer le compte de A | Tout disparaît, B voit « Cette balade n'est plus disponible. » |
| Voyage en cours publié | Pages du jour absentes, présentes le lendemain après ouverture de l'app. |
| Lien ouvert sur un téléphone sans l'app | Page web minimale, aucun contenu. |
| Deux appareils, même compte | Mes partages identiques. Mise à jour impossible depuis l'appareil sans les photos. |

### Accessibilité

- Lecteur d'écran (VoiceOver et TalkBack) sur les 8 écrans : tout est atteignable et annoncé, ordre de lecture logique, cases à cocher annoncées avec leur état.
- Icônes seules (menu « ⋯ », fermer, flou) : chacune a un accessibilityLabel.
- Tampon « PUBLIÉ », scotch, rotations : cachés au lecteur d'écran. Le statut est dit en texte.
- Contraste 4,5:1 en clair et en sombre, en particulier le texte `muted` sur `paper` et les pages grisées.
- Taille de texte système à 200 % : rien de tronqué sur les écrans 1, 4, 5.
- Cibles tactiles mesurées : 44 px minimum partout, y compris cases à cocher et poignées du rectangle de flou.
- Badge « MODIFIÉ » et pages grisées : l'état est aussi dit en texte, pas seulement par la couleur.
- Réduire les animations actif : aucune transition.

### Performance

- Préparation de 50 photos (redimensionnement, nettoyage) sur un téléphone d'entrée de gamme : moins de 60 s, app réactive pendant ce temps.
- Coupe et simplification d'un trajet de 30 km (environ 20 000 points) : moins de 1 s.
- Ouverture d'une balade de 50 pages dans le Cercle : premières photos en moins de 2 s en 4G.

### Tests terrain

- Cinq testeurs à Helsinki font chacun une balade qui part de chez eux, la partagent en entier, puis une autre personne essaie de deviner leur domicile à partir de 3 balades. Résultat attendu : personne ne trouve la rue.
- Un testeur publie un voyage en cours à midi. Un autre vérifie le soir que rien de la journée n'est visible.
- Publication dans le métro entre deux stations (réseau intermittent) : l'envoi finit sans action de l'utilisateur.
- Photo avec un ami et une plaque : le testeur trouve et utilise le flou sans aide.
- Testeur qui n'a jamais eu de compte : temps entre « Partager » et « PUBLIÉ » noté, points de blocage notés.

## Critères d'acceptation

- [ ] Un utilisateur sans compte peut aller jusqu'à l'aperçu, le compte n'est demandé qu'après.
- [ ] Seul le pseudo est visible par les autres, jamais l'e-mail.
- [ ] Aucune donnée ne part vers Supabase avant « Publier » (vérifié par capture réseau).
- [ ] Seules les pages cochées partent.
- [ ] Le mode « Quelques pages » ne publie jamais de trajet.
- [ ] L'aperçu est identique à ce que voit un autre utilisateur.
- [ ] Aucun trajet publié n'entre dans une zone privée (test automatique sur 50 trajets réels).
- [ ] Début et fin du trajet raccourcis au hasard, même sans zone privée.
- [ ] Le trajet ne contient aucun horodatage. Seuls mois et année sont publiés.
- [ ] Pages et trajet des dernières 24 heures retenus pour un voyage en cours.
- [ ] Aucune photo stockée ne contient de métadonnées (contrôle serveur et test).
- [ ] Le flou est irréversible sur le fichier envoyé, l'original local est intact.
- [ ] La balade n'est visible qu'une fois tous les fichiers envoyés et vérifiés.
- [ ] L'envoi reprend après coupure sans doublon.
- [ ] Le quota est vérifié avant et pendant l'envoi, avec un message clair.
- [ ] Dépublier efface lignes et fichiers côté serveur.
- [ ] Dépublier sans réseau ne prétend pas que c'est fait.
- [ ] Bloquer cache les balades dans les deux sens pour les connectés, et l'interface dit la limite pour les visiteurs sans compte.
- [ ] Signaler fonctionne, masquage immédiat pour les trois catégories graves.
- [ ] La personne qui signale n'est jamais identifiable par l'auteur.
- [ ] Supprimer le compte efface tout côté serveur, les sauvegardes des autres affichent « Cette balade n'est plus disponible. »
- [ ] Les 13 à 17 ans ne peuvent pas publier de trajet. Pas de compte sous 13 ans.
- [ ] Le lien hors app ne montre aucun contenu sans l'app.
- [ ] Tous les tests de règles d'accès et de fuite sont verts.
- [ ] Toutes les tables du schéma public ont des règles d'accès activées.
- [ ] Bucket de photos privé, lecture par URL signée uniquement.
- [ ] Mode clair et sombre conformes, tokens uniquement, aucune valeur en dur.
- [ ] Une seule action principale `stamp` par écran.
- [ ] Cibles 44 px, contraste 4,5:1, labels d'accessibilité présents.
- [ ] Aucune animation au-delà de 450 ms, tout saute avec « réduire les animations ».
- [ ] Chaque phrase de l'interface et de la politique de confidentialité sur les données est vraie dans le produit.
- [ ] SMTP maison en place avant l'ouverture de la bêta.

## Hypothèses à vérifier

1. Le bilan de voyage (phase 2) existe et peut accueillir le bouton « Partager dans le Cercle ».
2. L'écran Cercle (liste, détail, sauvegarde) existe ou est en cours, et son composant de détail peut servir à l'aperçu.
3. La sauvegarde d'une balade se fait sans compte (en local) ou demande un compte. Le contexte ne cite pas la sauvegarde parmi les actions qui demandent un compte. À confirmer.
4. Le trajet local est stocké avec des horodatages par point, assez précis pour la rétention de 24 heures et la suggestion de lieu de nuit.
5. Le trajet local est rattaché aux voyages (on peut extraire le trajet d'un voyage).
6. Chaque page a un identifiant stable, un lieu (coordonnées) et une photo locale accessible par l'app.
7. L'authentification par e-mail et code à 6 chiffres est déjà branchée sur Supabase Auth.
8. Le projet Supabase est hébergé dans une région de l'UE.
9. Limites réelles du service d'e-mails intégré de Supabase (nombre d'envois par heure) et compatibilité avec l'alpha.
10. Durée de rétention des sauvegardes de la base Supabase selon le plan, pour l'écrire dans la politique de confidentialité.
11. Durée de rétention des journaux Supabase (adresses IP).
12. Le ré-encodage d'image choisi (par exemple via une librairie Expo de manipulation d'image) retire bien toutes les métadonnées sur iOS et Android, HEIC compris. À tester sur appareils réels, pas seulement en simulateur.
13. Une détection de visages locale est disponible dans l'environnement Expo utilisé (module natif ou librairie tierce), sans envoyer l'image à un service externe. Sinon, l'écran 3 tombe sur le rappel et le flou manuel seuls.
14. L'envoi en arrière-plan est possible avec la configuration Expo actuelle, et dans quelles limites (iOS coupe vite).
15. Les liens universels (iOS) et liens d'application (Android) sont configurables, et un domaine est disponible pour la page web minimale.
16. Une fonction serveur (Edge Function ou fonction Postgres) peut lire les métadonnées d'une image envoyée pour le contrôle EXIF.
17. La zone « Helsinki » est définie quelque part dans l'app (polygone ou rayon) et réutilisable.
18. Les notifications locales sont déjà utilisées ou peuvent l'être.
19. Le temps réel Supabase est utilisé ou non sur ces tables.

## Questions ouvertes

1. Faut-il que le Cercle soit lisible sans compte ? C'est plus simple pour découvrir, mais ça rend le blocage inefficace face à quelqu'un qui se déconnecte. Option : « Mes balades visibles seulement par les membres connectés », réglage par compte.
2. Liste publique des balades d'un pseudo : on l'affiche ? Elle facilite le repérage des habitudes d'une personne.
3. Redemander le code e-mail à la première publication depuis un appareil, pour limiter le partage à l'insu par quelqu'un qui a le téléphone ?
4. Rétention de 24 heures : assez ? Trop ? Faut-il un réglage (24 h, 3 jours, 1 semaine) ?
5. Tailles des zones privées : 400 m minimum suffit dans un quartier dense comme Kallio, où 400 m couvre beaucoup d'immeubles, mais pas en périphérie. Ajuster selon la densité ?
6. Proposer des catégories de lieux sensibles à cacher automatiquement (écoles, hôpitaux, refuges) ? Avec quelles données ?
7. Synchroniser les zones privées entre appareils (chiffrées de bout en bout) ou les laisser locales ?
8. Âge : déclaratif seulement. Suffisant pour la bêta ? Faut-il interdire le partage aux moins de 15 ou 16 ans plutôt que 13 ?
9. Qui modère, avec quel outil, et quel délai on peut honnêtement annoncer ? Tant que ce n'est pas tranché, aucune promesse de délai dans l'interface.
10. Contenu illégal : procédure de retrait, conservation de preuves et contact avec les autorités finlandaises. À cadrer avec un avis juridique avant la bêta.
11. Faut-il détecter une empreinte d'image pour empêcher la republication d'une photo retirée par un autre compte ?
12. Comptes multiples d'une personne bloquée : on accepte la limite pour la bêta ?
13. Mettre à jour un partage change-t-il le lien ? Proposition : non, même lien, nouvelle version.
14. Le nombre de sauvegardes visible par l'auteur : utile ou source de pression ? On le garde pour la bêta ?
15. Choix du fournisseur SMTP maison (hébergé dans l'UE) et date limite avant la bêta.

# Partager un voyage dans le Cercle : spec

Brouillon du 8 nov 2026, à relire

## Résumé

L'utilisateur peut publier un voyage dans le Cercle pour que d'autres le parcourent comme une balade. Il choisit ce qu'il partage : le voyage entier (pages et trajet) ou certaines pages seulement. Il voit un aperçu exact de ce que les autres verront avant de publier. Le compte (e-mail et code à 6 chiffres) n'est demandé qu'à ce moment-là. Seul un pseudo est affiché.

Rien ne quitte l'appareil avant la publication. Au moment de publier, et seulement pour les pages choisies, les photos sont recompressées sur l'appareil, débarrassées de leurs métadonnées, puis envoyées dans Supabase Storage. Le trajet partagé est coupé autour des zones privées (domicile, travail, école, etc.), débarrassé des heures, simplifié et raccourci au début et à la fin.

L'utilisateur peut dépublier à tout moment. Il peut signaler, bloquer, supprimer son compte. La modération se fait sur signalements uniquement.

Cette feature est la phase 3 du phasage des voyages. Elle dépend des phases 1 et 2.

## Objectif et utilisateur

**Objectif.** Faire vivre le Cercle avec de vraies balades, sans jamais exposer où vit ou se trouve la personne qui partage.

**Utilisateur qui partage.** Quelqu'un qui a fait un voyage ou une balade dans Helsinki, en est content, et veut la laisser aux autres. Il n'a pas forcément de compte. Il ne pense pas spontanément aux risques (domicile visible sur le trajet, GPS dans les photos, visages).

**Utilisateur qui regarde.** Quelqu'un qui ouvre le Cercle, cherche une idée de sortie, ouvre une balade, la sauvegarde et la parcourt. Il n'a pas besoin de compte pour regarder.

**Ce qu'on ne fait pas ici.** Commentaires, likes, abonnements, messagerie, partage en temps réel, position en direct. Partage hors Helsinki.

**Mesure de succès (bêta).**
- Part des voyages terminés qui sont partagés.
- Taux d'abandon entre « Partager » et « Publier », par écran.
- Zéro photo publiée avec coordonnées GPS dans les métadonnées (contrôle serveur).
- Zéro trajet publié qui entre dans une zone privée (contrôle automatique).
- Délai moyen de traitement d'un signalement.

## Comportement détaillé

### Point d'entrée

Sur la page d'un voyage (bilan, phase 2), un bouton secondaire « Partager dans le Cercle ». Il n'est pas l'action principale de l'écran.

États du bouton :
- Voyage jamais partagé : « Partager dans le Cercle ».
- Voyage déjà partagé, à jour : « Voir mon partage ».
- Voyage partagé puis modifié en local : « Voir mon partage » avec une étiquette Special Elite « MODIFIÉ » sur fond `paperLight`, contour `ink`. L'état est aussi dit en texte, pas par la couleur.
- Voyage sans aucune page partageable (toutes hors Helsinki, ou aucune page) : bouton désactivé avec le texte en dessous « Ce voyage n'a pas encore de page à partager. »

Le bouton fait 44 px de haut minimum, sans rotation.

### Flux pas à pas

1. Choisir quoi partager
2. Zones privées (seulement la première fois, ou si aucune zone n'est réglée et que le trajet est coché)
3. Vérifier les photos (flou, personnes)
4. Aperçu
5. Compte et pseudo (seulement si pas connecté)
6. Envoi
7. Page de partage

Un indicateur d'étape en texte (« Étape 2 sur 5 ») en haut, lu par le lecteur d'écran. Retour possible à chaque étape sans perdre les choix. Les choix sont gardés en local tant que le partage n'est pas publié ou abandonné (bouton « Annuler » qui demande confirmation).

### Écran 1 : Choisir quoi partager

Titre (Fraunces italique) : « Qu'est-ce que tu partages ? »

Deux options, en cartes sélectionnables (pas de rotation, cible 44 px) :
- « Tout le voyage » : sous-texte « Les pages et le trajet. Le trajet est caché autour de tes zones privées. »
- « Quelques pages » : sous-texte « Tu choisis les pages. Pas de trajet. »

Sous l'option choisie, la liste des pages du voyage, chacune avec sa miniature, son numéro de tampon, son nom de lieu, et une case à cocher (44 px).
- « Tout le voyage » : toutes les pages cochées, plus une ligne « Le trajet » cochée. L'utilisateur peut décocher des pages ou le trajet.
- « Quelques pages » : rien n'est coché au départ. Pas de ligne « Le trajet ».

Pages non partageables, affichées grisées (`fog` pour la miniature, texte `muted`), avec la raison en texte :
- « Hors d'Helsinki : le Cercle ne couvre qu'Helsinki pour l'instant. »
- « Dans une de tes zones privées. » (avec un lien « Voir mes zones »)
- « Photo introuvable sur ce téléphone. » (cas deux appareils)

Bas d'écran : bouton principal `stamp` « Continuer », désactivé tant qu'aucune page n'est cochée. Texte d'aide : « Choisis au moins une page. »

Si le voyage est en cours, un encadré en haut : « Ce voyage n'est pas fini. Ce que tu fais aujourd'hui partira demain, pour que personne ne sache où tu es en ce moment. » (voir Règles métier).

### Écran 2 : Zones privées

Affiché si le trajet est coché et que l'utilisateur n'a jamais confirmé ses zones. Accessible aussi depuis Moi > Confidentialité > Zones privées.

Titre : « Les endroits à cacher »

Texte : « Sur un trajet partagé, on coupe tout ce qui passe près de ces endroits. Pense à chez toi, ton travail, l'école des enfants. »

Si l'appareil a repéré un endroit où le téléphone passe souvent la nuit (calcul local, voir Safety), une suggestion :
« On pense que tu dors souvent par ici. Tu veux le cacher ? » avec une mini carte (cercle `stamp` en pointillé), boutons « Oui, cacher » (principal) et « Non » (secondaire).

Ajouter une zone : appui long sur la carte ou bouton « Ajouter un endroit ». Taille au choix : « Petite (400 m) », « Moyenne (800 m) », « Grande (1,5 km) ». Défaut : Moyenne. Nom libre facultatif (« Maison »), stocké seulement en local.

Si aucune zone : l'utilisateur doit choisir entre ajouter une zone ou cocher « Je n'ai pas d'endroit à cacher sur ce voyage ». Sans l'un des deux, « Continuer » reste désactivé.

Bouton principal : « Continuer ».

### Écran 3 : Vérifier les photos

Une page par photo cochée, en défilement horizontal. Pour chaque photo :
- Si l'appareil détecte un visage (si la détection locale est disponible, voir Hypothèses) : « Il y a quelqu'un sur cette photo. Cette personne est d'accord pour être dans le Cercle ? » avec les choix « Flouter » et « Oui, elle est d'accord ».
- Dans tous les cas, un bouton secondaire « Flouter une zone » : l'utilisateur trace un rectangle, le flou est appliqué sur la copie envoyée. La photo d'origine reste intacte sur l'appareil.
- Rappel fixe sous la photo, en DM Sans `muted` : « Pense aux visages, aux enfants, aux plaques et aux numéros de porte. »

Si aucune photo n'a de visage détecté, l'écran s'affiche quand même mais en une seule liste compacte avec le rappel. L'utilisateur peut tout passer d'un coup avec « C'est bon ».

Bouton principal : « Voir l'aperçu ».

### Écran 4 : Aperçu

Titre : « Voilà ce que verront les autres »

Rendu identique à la vue Cercle d'un visiteur (même composant), avec un bandeau `paperLight` en haut : « APERÇU » en Special Elite.

Contenu affiché :
- Titre du voyage (modifiable ici, 60 caractères max). Par défaut le nom local du voyage.
- Pseudo (ou « Ton pseudo » si pas encore choisi).
- Mois et année (« nov. 2026 »), nombre de pages, distance arrondie au km si le trajet est partagé.
- Carte avec le trajet tel qu'il sera publié (coupé, simplifié), pointillé `stamp`, et les lieux.
- Les pages : polaroïd avec la photo floutée si besoin, note manuscrite, tampon numéroté (numérotation recalculée sur les pages partagées : 1, 2, 3 sans trou).

Ce qui n'apparaît jamais : heure, jour de la semaine, date exacte, vitesse, durée exacte, nom des zones privées, position actuelle.

Sous la carte, si des morceaux de trajet ont été coupés : « On a caché 3 passages près de tes zones privées. » Ce texte n'est visible que dans l'aperçu, pas par les autres.

Liens secondaires : « Changer les pages », « Changer les zones », « Revoir les photos ».

Bouton principal : « Publier ». Si pas connecté : « Continuer ».

Case obligatoire au-dessus du bouton : « Je partage seulement des photos que j'ai le droit de partager. » Lien « Règles du Cercle ».

### Écran 5 : Compte et pseudo

Seulement si l'utilisateur n'est pas connecté.

5a. E-mail
- Titre : « Pour publier, il te faut un compte »
- Texte : « On te demande ton e-mail pour t'envoyer un code. Il n'est jamais affiché. »
- Champ avec libellé visible « Ton e-mail », clavier e-mail.
- Case : « J'ai 13 ans ou plus » (obligatoire, voir Règles métier sur les mineurs). Puis question « Tu as 18 ans ou plus ? » Oui / Non.
- Bouton principal : « Recevoir le code ».

5b. Code
- Titre : « Regarde tes e-mails »
- Texte : « On a envoyé un code à 6 chiffres à a•••@exemple.fi. »
- Champ code, 6 chiffres, remplissage auto depuis l'e-mail si l'OS le propose.
- « Renvoyer le code » actif après 60 s, avec compte à rebours en texte.
- Erreur code faux : « Ce code ne marche pas. Vérifie-le ou demande-en un autre. »
- Erreur code expiré : « Ce code a expiré. On t'en envoie un autre ? »
- Envoi impossible (limite d'envoi atteinte) : « On n'arrive pas à t'envoyer de code pour l'instant. Réessaie dans une heure. Ton partage est gardé sur ton téléphone. »

5c. Pseudo
- Titre : « Ton pseudo »
- Texte : « C'est le seul nom que les autres verront. Évite ton vrai nom. »
- Champ « Pseudo », 3 à 20 caractères, lettres, chiffres, tiret bas, point. Vérification de disponibilité en direct.
- Erreurs : « Ce pseudo est déjà pris. », « Entre 3 et 20 caractères. », « Ce pseudo n'est pas accepté. » (liste de mots interdits, noms réservés comme « detour », « admin »).
- Bouton principal : « Publier ».

### Écran 6 : Envoi

Titre : « On envoie ta balade »

Barre de progression avec texte : « 4 photos sur 9 ». Pas d'animation au-delà de 450 ms, pas de rebond. Avec « réduire les animations », la barre saute d'état en état.

Texte : « Tu peux fermer l'app. On continue dès que tu as du réseau. »

Bouton secondaire : « Annuler l'envoi ». Confirmation : « Annuler ? Rien n'a encore été publié. » Annuler supprime les fichiers déjà envoyés.

États :
- Sans réseau : « Pas de réseau. On reprend dès qu'il revient. » La file reste en local.
- Erreur qui se répète (3 essais) : « L'envoi bloque. Réessayer ? » bouton principal « Réessayer ».
- Quota atteint : voir Edge cases.
- Fin : passage automatique à la page de partage, avec le tampon « PUBLIÉ » (Special Elite, `stamp`, rotation décorative -3°).

La balade n'est visible dans le Cercle qu'une fois tous les fichiers envoyés et vérifiés. Jamais à moitié.

### Écran 7 : Page de partage (côté auteur)

Accessible par « Voir mon partage » et Moi > Mes partages.

Contenu :
- Le rendu Cercle de la balade.
- Statut en texte : « Publié dans le Cercle », « En attente : envoi en cours », « Les pages d'aujourd'hui partiront demain », « Masqué : un signalement est en cours de vérification », « Retiré par la modération ».
- Nombre de sauvegardes (« Sauvegardée 12 fois »). Jamais qui l'a sauvegardée.
- Si modifié en local : encadré « Tu as changé ce voyage depuis le partage. » bouton « Mettre à jour le partage » (repasse par l'aperçu).
- Bouton « Copier le lien » et « Partager le lien » (feuille de partage de l'OS).
- Bouton « Dépublier » en bas, contour 2 px `ink` (pas `stamp`, ce n'est pas l'action principale).

Dépublier :
- Feuille de confirmation : « Retirer cette balade du Cercle ? Les photos sont effacées de nos serveurs. Ceux qui l'ont sauvegardée ne la verront plus. Ton voyage reste sur ton téléphone. »
- Boutons « Retirer » (principal) et « Garder » (secondaire).
- Après : « C'est retiré. » La page revient à l'état « Partager dans le Cercle ».

### Écran 8 : Ce que voient les autres (vue Cercle)

Liste du Cercle : carte billet avec photo de couverture (première page partagée, ou celle choisie en phase 2), titre, pseudo, « nov. 2026 », nombre de pages.

Détail d'une balade :
- Titre, pseudo, mois et année, nombre de pages, distance arrondie si trajet.
- Carte : trajet en pointillé `stamp` (si partagé), lieux en repères. Le brouillard du visiteur n'est pas modifié par la consultation. Il se lève seulement quand le visiteur valide lui-même un lieu par une photo.
- Pages en polaroïds.
- Bouton principal : « Sauvegarder cette balade » (demande pas de compte si la sauvegarde est locale, voir Hypothèses).
- Menu « ⋯ » (accessibilityLabel « Plus d'options ») : « Signaler », « Bloquer ce pseudo », « Copier le lien ».

Signaler (feuille) :
- Titre : « Qu'est-ce qui ne va pas ? »
- Choix : « Je suis sur cette photo », « Il y a un enfant », « Ça montre où vit quelqu'un », « Harcèlement ou menace », « Contenu choquant ou illégal », « Autre ».
- Champ facultatif « Tu veux ajouter quelque chose ? » (500 caractères).
- Si la balade entière ou une page précise : le signalement porte sur l'élément depuis lequel il a été ouvert.
- Demande un compte (anti-abus). Sans compte : « Pour signaler, il te faut un compte. C'est rapide. » Exception : « Je suis sur cette photo » et « Il y a un enfant » sont possibles sans compte, avec e-mail facultatif.
- Confirmation : « Merci. On regarde ça. » Pas de promesse de délai qu'on ne tient pas.

Bloquer :
- « Bloquer @pseudo ? Tu ne verras plus ses balades. Cette personne ne verra plus les tiennes quand elle est connectée. Elle ne sera pas prévenue. »
- Phrase honnête en dessous, en `muted` : « Le Cercle peut être regardé sans compte. Bloquer ne cache pas tes balades à quelqu'un qui n'est pas connecté. »
- Boutons « Bloquer » (principal) et « Annuler ».

### Lien partagé hors de l'app

Format : `https://<domaine>/b/<identifiant aléatoire>` (au moins 128 bits d'aléa, pas d'identifiant séquentiel).
- App installée : ouvre la balade dans l'app.
- App non installée : page web minimale avec le nom de l'app et les liens vers les stores. Aucun contenu de la balade (ni titre, ni pseudo, ni photo, ni carte). Aucun aperçu riche dans les messageries.
- Balade dépubliée, retirée ou auteur bloqué : « Cette balade n'est plus partagée. »

## Règles métier

**Ce qui est partagé**
1. Une publication est une copie figée, faite au moment de publier. Les changements locaux ne passent pas tout seuls : il faut « Mettre à jour le partage ».
2. Exception : supprimer en local un lieu ou une page partagée propose de le retirer aussi du Cercle, avec oui par défaut.
3. Seules les pages cochées partent. Une page non cochée n'est jamais envoyée, ni sa photo, ni sa note, ni sa position.
4. Mode « Tout le voyage » : pages cochées et trajet (si coché). Mode « Quelques pages » : pages cochées, jamais de trajet.
5. En mode « Tout le voyage », si une page est décochée, le trajet est aussi coupé sur 200 m autour de ce lieu, pour qu'on ne devine pas un arrêt.
6. Numérotation des tampons recalculée sur les pages partagées.
7. Une balade publiée doit avoir au moins 1 page.
8. Uniquement Helsinki : une page dont le lieu est hors de la zone Helsinki n'est pas partageable. Le trajet hors zone est coupé.
9. Pas de partage en direct. Une seule publication par voyage. Mettre à jour remplace la précédente.

**Position et temps**
10. Le trajet partagé est coupé dans chaque zone privée, sur son rayon.
11. Le centre de chaque zone privée est décalé au hasard (jusqu'à un tiers du rayon), une fois pour toutes à sa création, pour qu'on ne puisse pas retrouver le domicile au centre du trou.
12. Début et fin du trajet partagé raccourcis d'une longueur au hasard entre 300 et 600 m, tirée à chaque publication, même hors zone privée.
13. Le trajet est simplifié (tolérance 15 m) et rééchantillonné à pas régulier. Aucun horodatage ni vitesse ne part.
14. Un lieu situé dans une zone privée n'est pas partageable.
15. Les coordonnées d'un lieu partagé sont arrondies à 4 décimales (environ 10 m). Assez pour retrouver le lieu, pas plus.
16. Seuls le mois et l'année sont publiés. Distance arrondie au km. Pas de durée.
17. Voyage en cours : pages et trajet des dernières 24 heures retenus, publiés automatiquement le lendemain (à la prochaine ouverture de l'app avec réseau après ce délai). L'utilisateur peut publier une page récente tout de suite avec « Publier cette page maintenant » et la confirmation « Les autres sauront que tu es passé par là aujourd'hui. » Le trajet récent ne peut jamais être publié avant 24 heures.

**Photos**
18. Les photos ne partent vers Supabase Storage qu'après « Publier ».
19. Avant envoi, sur l'appareil : redimensionnement à 2048 px sur le grand côté, ré-encodage JPEG qualité 0,8, suppression de toutes les métadonnées (EXIF, GPS, XMP, IPTC, modèle d'appareil, date), application du flou choisi sur la copie.
20. Le serveur refuse un fichier de plus de 3 Mo ou qui contient encore des métadonnées de position (contrôle dans une fonction côté serveur avant la mise en ligne).
21. Quota par compte : 300 Mo et 500 photos publiées. Au-delà, il faut dépublier quelque chose.
22. Maximum 50 pages par balade.

**Compte et pseudo**
23. Le compte n'est demandé qu'au moment de publier, signaler (sauf exceptions ci-dessus), ou bloquer.
24. Seul le pseudo est affiché. L'e-mail n'est jamais visible par un autre utilisateur.
25. Pseudo unique, 3 à 20 caractères, insensible à la casse pour l'unicité.
26. Changer de pseudo : possible une fois tous les 30 jours. Le nouveau pseudo s'affiche partout, y compris sur les anciennes balades. L'ancien pseudo reste réservé 90 jours (personne d'autre ne peut le prendre).
27. Âge : moins de 13 ans, pas de compte. 13 à 17 ans : publication possible en mode « Quelques pages » seulement, jamais de trajet, et le flou est proposé par défaut sur chaque visage détecté. 18 ans et plus : tout.

**Modération**
28. Modération sur signalements seulement. Pas de relecture avant publication.
29. Un signalement « Je suis sur cette photo », « Il y a un enfant » ou « Ça montre où vit quelqu'un » masque la page visée tout de suite, en attente de vérification.
30. Trois signalements d'autres catégories, venant de trois comptes différents, masquent la balade en attente de vérification.
31. Un signalement par compte et par élément.
32. Le modérateur peut : rétablir, retirer une page, retirer la balade, suspendre la publication pour un compte, supprimer le compte.
33. L'auteur est prévenu dans l'app (pas par e-mail dans cette phase) quand un élément est masqué ou retiré, avec la catégorie, jamais avec l'identité de qui a signalé.

**Bloquer**
34. Bloquer est réciproque pour les utilisateurs connectés : ni l'un ni l'autre ne voit les balades de l'autre.
35. La personne bloquée n'est pas prévenue et ne peut pas savoir qu'elle est bloquée (elle voit simplement moins de balades).
36. Débloquer depuis Moi > Confidentialité > Pseudos bloqués.

**Dépublier et suppression**
37. Dépublier efface les fichiers de Storage et les lignes de la publication tout de suite. Rien n'est gardé côté serveur, sauf ce qui est lié à un signalement en cours (voir Safety).
38. Supprimer son compte dépublie tout, efface pseudo, e-mail, blocages, sauvegardes et signalements faits par la personne (les signalements sont anonymisés plutôt qu'effacés s'ils sont en cours de traitement).
39. Une balade sauvegardée par quelqu'un est une référence, pas une copie. Si elle est dépubliée ou supprimée, elle disparaît chez tout le monde.

**E-mails**
40. Envoi du code à 6 chiffres avec l'envoi d'e-mails intégré de Supabase pendant cette phase (alpha, testeurs). Un SMTP maison est obligatoire avant la bêta publique. Aucun autre e-mail (notification, résumé) n'est envoyé dans cette phase.

## Modèle de données

### Local (sur l'appareil)

| Élément | Champs | Notes |
|---|---|---|
| `privacy_zones` | id, lat_reel, lng_reel, lat_decale, lng_decale, rayon_m, nom (facultatif), cree_le | Ne quitte jamais l'appareil. Le centre décalé est tiré à la création. |
| `night_location_guess` | lat, lng, confiance, calcule_le | Calcul local à partir du trajet. Jamais envoyé. Effaçable. |
| `share_draft` | trip_id_local, mode (`entier`/`pages`), pages_cochees[], trajet_coche, titre, flous par photo [{page_id, rectangles[]}], consentements visage [{page_id, choix}], etape_courante, mis_a_jour_le | Brouillon du flux, gardé tant que non publié ou annulé. |
| `upload_queue` | publication_id, page_id, chemin_fichier_prepare, taille, essais, statut (`a_envoyer`/`envoye`/`verifie`/`erreur`), derniere_erreur | Fichiers préparés (redimensionnés, nettoyés, floutés) dans un dossier temporaire de l'app. Effacés après vérification. |
| `trip_share_link` | trip_id_local, publication_id, version_publiee, empreinte_contenu_publie, retenu_jusqua (pages récentes en attente) | Sert à afficher « MODIFIÉ » et à faire la mise à jour. |
| Réglages | age_declare (`13_17`/`18_plus`), zones_confirmees (bool) | |

Les photos d'origine, les notes et le trajet complet restent sur l'appareil comme aujourd'hui.

### Supabase (Postgres)

`profiles`
- `id` (uuid, = auth.users.id), `pseudo` (unique, insensible à la casse), `pseudo_change_le`, `age_bracket` (`13_17`/`18_plus`), `publication_suspendue` (bool), `cree_le`.
- L'e-mail reste dans `auth.users`, jamais copié ici.
- Vue publique `public_profiles` : uniquement `id` et `pseudo`.

`reserved_pseudos`
- `pseudo`, `libere_le`. Anciens pseudos et noms réservés.

`publications`
- `id` (uuid), `slug` (aléatoire, unique, pour le lien), `auteur_id`, `titre`, `mode` (`entier`/`pages`), `mois` (date tronquée au mois), `distance_km` (entier, nul si pas de trajet), `nb_pages`, `statut` (`envoi`/`publie`/`masque`/`retire`), `version`, `cree_le`, `mis_a_jour_le`.
- Pas d'identifiant de voyage local, pas d'identifiant d'appareil.

`publication_pages`
- `id`, `publication_id`, `ordre` (1, 2, 3...), `nom_lieu`, `note` (texte manuscrit, 280 caractères max), `lat` (4 décimales), `lng` (4 décimales), `photo_path`, `statut` (`visible`/`masque`/`retire`).

`publication_routes`
- `publication_id`, `geometrie` (ligne déjà coupée et simplifiée, sans horodatage). Un trajet découpé en plusieurs morceaux est stocké comme plusieurs lignes (multi-ligne).
- Le traitement (coupe, simplification) se fait sur l'appareil. Le serveur ne reçoit jamais le trajet brut.

`saves`
- `user_id`, `publication_id`, `cree_le`. Clé unique (user_id, publication_id).

`blocks`
- `bloqueur_id`, `bloque_id`, `cree_le`.

`reports`
- `id`, `signaleur_id` (nul si sans compte), `email_contact` (facultatif, sans compte), `publication_id`, `page_id` (nul si toute la balade), `categorie`, `texte`, `statut` (`ouvert`/`traite`/`rejete`), `decision`, `cree_le`, `traite_le`.

`moderation_events`
- `id`, `publication_id`, `page_id`, `action`, `motif_categorie`, `cree_le`. Sert aux messages in-app à l'auteur et à l'historique.

`author_notifications`
- `id`, `user_id`, `type`, `publication_id`, `lu`, `cree_le`. Remplace les e-mails dans cette phase.

### Supabase Storage

- Bucket `publication-photos`, **privé**.
- Chemin : `<auteur_id>/<publication_id>/<page_id>.jpg`.
- Lecture par URL signée de courte durée (1 heure), délivrée seulement si la publication est lisible par la personne qui demande.

### Règles d'accès (RLS) en langage clair

`profiles`
- Tout le monde peut lire le pseudo (par la vue `public_profiles`). Personne ne peut lire `age_bracket` ni `publication_suspendue` d'un autre.
- Chacun peut modifier seulement son propre profil, et seulement le pseudo (avec les règles de délai). `publication_suspendue` ne se modifie que côté modération.

`publications`
- Tout le monde, connecté ou non, peut lire une publication au statut `publie`.
- Une personne connectée ne voit pas une publication si elle a bloqué l'auteur ou si l'auteur l'a bloquée.
- L'auteur voit toutes ses publications, quel que soit le statut.
- Personne d'autre ne voit une publication en `envoi`, `masque` ou `retire`.
- Seul l'auteur peut créer une publication à son nom, et seulement en statut `envoi`, et seulement si son compte n'est pas suspendu.
- Le passage de `envoi` à `publie` ne se fait que par une fonction serveur qui vérifie que tous les fichiers sont là et propres. L'auteur ne peut pas écrire `publie` directement.
- L'auteur ne peut jamais remettre `publie` sur une publication `masque` ou `retire`.
- Seul l'auteur peut supprimer sa publication.

`publication_pages` et `publication_routes`
- Lisibles seulement si la publication parente est lisible par la personne, et si la page est `visible`.
- L'auteur voit ses pages masquées (avec le motif), pour comprendre.
- Écrites seulement par l'auteur, et seulement tant que la publication est en `envoi`.

`saves`
- Chacun lit, crée et supprime seulement ses propres sauvegardes.
- L'auteur ne voit que le nombre, par une fonction qui renvoie un total, jamais la liste des personnes.

`blocks`
- Chacun lit, crée et supprime seulement les blocages qu'il a faits.
- Personne ne peut savoir qui l'a bloqué.

`reports`
- Toute personne peut créer un signalement (connectée, ou sans compte pour les deux catégories prévues). Limite de fréquence côté serveur.
- Chacun peut relire seulement ses propres signalements, sans la décision détaillée.
- La personne signalée ne voit jamais les signalements, seulement la conséquence (élément masqué) via `moderation_events`.
- Les modérateurs lisent tout par un accès réservé (rôle serveur), jamais depuis l'app publique.

`moderation_events` et `author_notifications`
- Lisibles seulement par l'auteur concerné. Écrits seulement côté serveur.

Storage `publication-photos`
- Chacun peut envoyer un fichier seulement dans son propre dossier (`<son id>/...`), et seulement pour une publication à lui en statut `envoi`.
- Chacun peut supprimer seulement ses propres fichiers.
- Personne ne lit un fichier directement. La lecture passe par une URL signée délivrée seulement si la publication et la page sont lisibles par la personne.
- Pas de liste des fichiers d'un dossier pour les autres.

Toutes les fonctions serveur qui contournent ces règles (passage en `publie`, comptage des sauvegardes, URL signées, modération) vérifient elles-mêmes qui appelle et ce qu'il a le droit de faire.

## Dépendances et phasage

**Dépend de**
- Phase 1 : voyages (démarrer, arrêter), rattachement auto des lieux, filtre carte, pins photo.
- Phase 2 : bilan de voyage (point d'entrée), couverture, import galerie (cas photos hors Helsinki).
- Suivi du trajet local existant.
- Écran Cercle (liste et détail de balade) et sauvegarde d'une balade.
- Authentification Supabase par e-mail et code à 6 chiffres.

**Livraison en trois lots**
- Lot 3a (alpha interne) : zones privées, choix des pages, aperçu, envoi, page de partage, dépublier, vue Cercle, RLS complètes, signaler, bloquer, suppression de compte. E-mails par le service intégré Supabase.
- Lot 3b : détection locale des visages, outil de flou, rétention des pages récentes pour les voyages en cours, mise à jour du partage.
- Lot 3c (condition pour la bêta) : SMTP maison, page web minimale pour les liens, outil de modération, export des données (RGPD), politique de confidentialité à jour.

**Bloquant pour la bêta**
- SMTP maison configuré et testé.
- Tous les tests de fuite de données verts.
- Politique de confidentialité et règles du Cercle publiées et cohérentes avec le produit.
- Accord de traitement des données avec Supabase et région de stockage dans l'UE confirmée.


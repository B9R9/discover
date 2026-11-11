# Commencer et arrêter un voyage : spec

Brouillon du 8 nov 2026, à relire

## 1. Résumé

L'utilisateur peut déclarer qu'il part en voyage. Il donne un nom (ou garde le nom proposé), la date de début est prise automatiquement, et tant que le voyage est actif, chaque lieu découvert et le trajet suivi y sont rangés sans rien faire de plus. Un bandeau tampon « EN VOYAGE » rappelle en haut de la carte qu'un voyage est en cours, avec un bouton Arrêter. À l'arrêt, un bilan affiche les lieux, les kilomètres et la durée, et permet de choisir une couverture et d'ajouter des photos oubliées. On peut aussi créer après coup un voyage passé sur une plage de dates.

Un voyage ne crée pas de nouvelle carte ni de nouveau brouillard. C'est une étiquette posée sur une période, qui sert ensuite de filtre d'affichage.

Phase 1 : commencer, arrêter, nom, bandeau, rattachement automatique, écran de fin simple. Phase 2 : bilan complet, couverture, photos oubliées, voyage créé après coup.

## 2. Objectif et utilisateur

**Pour qui.** Quelqu'un qui explore Helsinki sur une période définie : un week-end, une semaine de vacances, une journée de visite avec des amis venus de loin. Il veut retrouver plus tard « ce que j'ai vu pendant ce séjour », séparé du reste de son carnet.

**Ce qu'il veut.**
- Démarrer en deux gestes au moment de partir, sans réseau, sans compte.
- Ne plus y penser ensuite : les lieux et le trajet se rangent seuls.
- À la fin, un petit bilan qui donne envie de garder la page.
- Pouvoir rattraper un oubli : voyage pas démarré, photos prises avec l'appareil photo du téléphone au lieu de l'app, voyage pas arrêté.

**Ce qu'on ne veut pas.**
- Faire du voyage l'action principale de la carte. L'action principale reste le bouton photo.
- Ajouter une consommation de batterie ou une collecte de position en plus de ce qui existe déjà.
- Faire sortir une donnée de l'appareil.

## 3. Comportement détaillé

### 3.1 Où se trouve le bouton

Décision proposée :
- **Moi**, section « Voyages » : bouton secondaire « Commencer un voyage » (contour 2 px `ink`, Special Elite, 44 px de haut minimum) en tête de la section. En dessous, en phase 2, bouton secondaire « Ajouter un voyage passé ».
- **Carte** : pas de bouton permanent en haut. L'entrée « Commencer un voyage » est la dernière ligne du sélecteur de filtre voyage (feature filtre carte, phase 1). En haut de la carte, on n'affiche que le bandeau quand un voyage est actif.

Raison : démarrer un voyage est rare. Un bouton permanent en haut de la carte ferait concurrence au bouton photo et aux filtres. À revoir après les premiers tests (voir Questions ouvertes).

Quand un voyage est actif, « Commencer un voyage » est remplacé dans Moi par la carte du voyage en cours (nom, « En cours depuis 2 j », bouton « Arrêter »), et la ligne disparaît du sélecteur de filtre.

### 3.2 Commencer un voyage (phase 1)

1. L'utilisateur touche « Commencer un voyage ».
2. Une feuille s'ouvre depuis le bas (animation 300 ms, sans rebond ; instantanée si « réduire les animations » est actif).
   - Titre (Fraunces italique 700) : « Nouveau voyage »
   - Champ, libellé visible « Nom du voyage », placeholder « Voyage du 8 novembre » (date du jour, fuseau de l'appareil).
   - Aide sous le champ (DM Sans, `muted`) : « Tu pourras le changer plus tard. »
   - Ligne d'info : « Il commence maintenant, le 8 nov à 14 h 05. »
   - Bouton principal `stamp` : « Commencer »
   - Bouton secondaire : « Annuler »
3. Si la permission de localisation n'est pas accordée (ou seulement « pendant l'utilisation » alors que le suivi en a besoin en arrière-plan, voir Hypothèses), une note s'affiche au-dessus des boutons, sans bloquer :
   « Sans accès à ta position, le trajet ne sera pas enregistré. Les lieux que tu valides en photo seront quand même rangés dans ce voyage. » avec un bouton secondaire « Autoriser ».
4. L'utilisateur touche « Commencer ». Le clavier se ferme, le bouton passe en état chargement et ne répond plus à un second toucher.
5. Le voyage est écrit en stockage local **avant** toute mise à jour d'écran. Si l'écriture échoue : message « Le voyage n'a pas pu commencer. Réessaie. » et la feuille reste ouverte avec le nom saisi.
6. La feuille se ferme. Le bandeau apparaît en haut de la carte (fondu 200 ms). Si l'utilisateur était dans Moi, il y reste et voit la carte du voyage en cours.
7. Annonce lecteur d'écran : « Voyage commencé : <nom>. »

Pas de compte demandé. Pas de réseau nécessaire.

### 3.3 Bandeau « EN VOYAGE » (phase 1)

Position : en haut de la carte, sous la zone système, au-dessus des contrôles de carte. Il ne masque ni le bouton photo ni le point de position.

Contenu :
- Tampon « EN VOYAGE » en Special Elite, couleur `stamp`, cadre tampon, légère rotation décorative (-3°). Le tampon est décoratif et caché aux lecteurs d'écran (l'information est portée par le libellé du bandeau).
- Nom du voyage en Special Elite, couleur `ink`, sur une ligne, tronqué avec « … ». Les emoji s'affichent avec la police système en repli.
- Bouton secondaire « Arrêter » à droite, contour 2 px `ink`, sans rotation, 44 × 44 px minimum.
- Fond `paperLight` en clair, équivalent token en sombre.

Toucher le bandeau (hors bouton) ouvre la fiche du voyage en cours :
- Nom, « Commencé le 8 nov à 14 h 05 »
- Trois valeurs en direct : « 4 lieux », « 6,3 km », « 3 h 20 »
- Boutons secondaires : « Renommer », « Voir sur la carte » (applique le filtre de ce voyage), « Arrêter le voyage »

Accessibilité du bandeau : un seul élément « En voyage : <nom complet>. Commencé le 8 novembre. Touche pour voir le détail. » plus le bouton « Arrêter le voyage » séparé.

États du bandeau :
- Normal.
- Position coupée : une seconde ligne DM Sans `ink` « Position coupée, le trajet ne s'enregistre plus. » et un lien « Réglages ». L'état n'est pas porté par la couleur seule.
- Rappel en attente (voyage long, voir 3.6) : seconde ligne « En cours depuis 4 jours. C'est toujours d'actualité ? »

### 3.4 Arrêter un voyage (phase 1)

1. L'utilisateur touche « Arrêter ».
2. Feuille de confirmation :
   - « Arrêter « <nom> » ? »
   - Si le dernier lieu du voyage date de plus de 24 h, on propose deux choix :
     - « Il se termine maintenant »
     - « Il s'est terminé à mon dernier lieu (mar 4 nov, 18 h 10) »
   - Bouton principal `stamp` : « Arrêter le voyage »
   - Bouton secondaire : « Continuer le voyage »
3. Si le voyage a moins de 2 minutes et ne contient aucun lieu, le texte devient « Tu viens de le commencer. On l'efface ? » avec « Effacer » (principal) et « Le garder » (secondaire). Ça couvre le démarrage par erreur.
4. À la confirmation, la date de fin est écrite en local, puis une passe de rattrapage range les lieux sans voyage dont la date de découverte tombe dans la période (voir Règles métier, R7).
5. Le bandeau disparaît (fondu 200 ms).
6. Phase 1 : écran de fin simple. Titre « Voyage terminé », nom, « 12 lieux · 34 km · 3 j 4 h », bouton principal « Voir sur la carte », bouton secondaire « Fermer ».
   Phase 2 : le bilan complet (3.5) remplace cet écran.

### 3.5 Bilan de fin (phase 2)

Accessible juste après l'arrêt, puis depuis la carte du voyage dans Moi.

- Titre Fraunces italique : le nom du voyage.
- Ligne de dates : « Du 3 au 6 nov 2026 » (ou « Le 8 nov 2026 » sur une seule journée). Dates dans le fuseau du début du voyage.
- Trois valeurs, présentées comme des billets ou tampons :
  - « 12 lieux » (au singulier « 1 lieu », à zéro « Aucun lieu »)
  - « 34 km » (« 4,2 km » sous 10 km, virgule décimale, « moins de 100 m » sous 0,1 km)
  - « 3 j 4 h » (« 45 min » sous 1 h, « 3 h 20 » sous 24 h, « 3 j 4 h » au-delà)
- Si le trajet a des trous (position coupée, téléphone éteint), une note `muted` : « Le trajet a des trous, la distance est sûrement plus longue. »
- Si l'heure de l'appareil semblait fausse : « L'heure du téléphone semblait fausse, la durée est approximative. »
- **Couverture** : rangée de polaroïds des photos du voyage. Le polaroïd choisi porte un scotch `lantern` et la mention « Couverture ». Par défaut : la première photo du voyage. Sans photo : couverture papier `kraft` avec le nom en tampon. Chaque polaroïd est un bouton (sans rotation sur la zone tactile ; la rotation ne s'applique qu'au visuel intérieur), libellé « Photo du 4 nov, Suomenlinna. Choisir comme couverture. »
- **Ajouter des photos oubliées** (bouton secondaire) : ouvre le sélecteur photo du système (3.7).
- Bouton principal `stamp` : « Ranger dans le carnet » (ferme le bilan).
- Bouton secondaire : « Voir sur la carte ».
- Menu « … » : « Renommer », « Supprimer le voyage ».

### 3.6 Voyage oublié, rappel et arrêt automatique

- Après **3 jours sans nouveau lieu** dans le voyage actif, une notification locale : « Ton voyage est toujours en cours. Tu le termines ? » Elle ne contient pas le nom du voyage (écran verrouillé). Toucher la notification ouvre la fiche du voyage.
- Un deuxième rappel après **7 jours sans nouveau lieu**. Pas plus.
- Les rappels partent entre 9 h et 21 h, heure locale. Un rappel prévu la nuit part à 9 h.
- Si les notifications sont refusées, le même texte apparaît dans le bandeau à l'ouverture de l'app.
- Après **14 jours sans nouveau lieu**, le voyage s'arrête tout seul. La date de fin est celle du dernier lieu du voyage, ou à défaut le dernier point de trajet du voyage, ou à défaut la date de début. À la prochaine ouverture : feuille « Ton voyage « <nom> » s'est arrêté tout seul, sans nouveau lieu depuis 14 jours. » avec « Voir le bilan » (principal) et « Je suis encore en voyage » (secondaire, reprend le voyage, voir R9).
- Pas d'arrêt automatique sur la seule durée. Un voyage actif où l'on découvre des lieux peut durer longtemps. Plafond de sécurité : 90 jours, puis arrêt automatique avec le même message.

### 3.7 Ajouter des photos oubliées (phase 2)

Dépend de la feature import galerie. Ici, seulement les règles propres au voyage.

1. Sélecteur photo du système, sélection multiple. Pas de permission d'accès à toute la galerie.
2. Pour chaque photo, lecture locale de la date et de la position (EXIF).
3. Cas :
   - Date dans la période du voyage, position dans la zone couverte, lieu pas encore découvert : le lieu est découvert, le brouillard se lève, le lieu est rangé dans ce voyage.
   - Lieu déjà découvert dans ce voyage : la photo rejoint la page du lieu (si la feature import galerie le permet).
   - Lieu déjà découvert dans un autre voyage ou sans voyage : le lieu ne change pas de voyage. Message groupé : « 2 photos sont des lieux déjà dans ton carnet. Ils restent où ils sont. »
   - Date hors période : non ajoutée. « 3 photos ont été prises en dehors de ce voyage. »
   - Pas de date ou pas de position : non ajoutée. « 1 photo n'a pas de date ou de position, on ne peut pas la placer. »
4. Récap final : « 5 lieux ajoutés à ce voyage. » Le bilan se met à jour.

### 3.8 Créer un voyage passé (phase 2)

1. Moi > « Ajouter un voyage passé ».
2. Feuille :
   - « Voyage passé » (titre)
   - Champ « Nom du voyage », placeholder « Voyage du 3 au 6 novembre »
   - Deux champs date avec libellés visibles : « Premier jour », « Dernier jour ». Sélecteur de date système. Pas d'heure : la période va de 0 h le premier jour à 23 h 59 le dernier jour, fuseau actuel de l'appareil.
   - Aperçu calculé en direct : « 12 lieux et 34 km seront rangés dans ce voyage. » ou « Aucun lieu ni trajet sur ces dates. Tu pourras ajouter des photos ensuite. »
   - Bouton principal « Créer le voyage », secondaire « Annuler ».
3. Contrôles :
   - Dernier jour avant premier jour : bouton désactivé, message sous le champ « Le dernier jour doit être après le premier. »
   - Date future : impossible à choisir (le sélecteur s'arrête à aujourd'hui).
   - Chevauchement avec un voyage existant (actif compris) : bouton désactivé, message « Ces dates croisent « <autre nom> » (du 4 au 5 nov). Change les dates. »
   - Période de plus de 90 jours : « 90 jours maximum pour un voyage. »
4. À la création : les lieux sans voyage découverts dans la période y sont rangés, le trajet de la période en fait partie. Ensuite le bilan s'ouvre.

### 3.9 Supprimer un voyage

Depuis le bilan ou la fiche (menu « … » > « Supprimer le voyage »).

Feuille :
- « Supprimer « <nom> » ? »
- « Les lieux et le brouillard restent sur ta carte. Seul le voyage disparaît. »
- Case à cocher, décochée par défaut : « Effacer aussi le trajet de ce voyage »
- Bouton principal « Supprimer », secondaire « Annuler ».

Si le voyage est actif, la suppression l'arrête d'abord. Pas d'annulation après coup (pas de corbeille en phase 1 et 2).

### 3.10 Renommer

Même champ et mêmes règles qu'à la création. Le bandeau et la liste se mettent à jour tout de suite.

## 4. Règles métier

- **R1. Un seul voyage actif.** Au plus un voyage a le statut `active` à un instant donné. Le bouton « Commencer un voyage » n'existe pas quand un voyage est actif. La couche de données refuse un deuxième voyage actif.
- **R2. Pas de chevauchement.** Deux voyages ne peuvent pas avoir des périodes qui se croisent. Un voyage actif a une période ouverte qui va jusqu'à maintenant.
- **R3. Rattachement d'un lieu.** Un lieu découvert pendant qu'un voyage est actif est rangé dans ce voyage, quelle que soit l'heure de l'appareil. Un lieu découvert hors voyage n'est dans aucun voyage. Un lieu se découvre une seule fois : le revisiter ne change pas son voyage.
- **R4. Rattachement du trajet.** Le trajet d'un voyage, ce sont les points enregistrés par le suivi existant pendant la période du voyage. Aucun point de plus n'est collecté parce qu'un voyage est actif.
- **R5. Date de début.** Instant du toucher sur « Commencer », en UTC, avec le fuseau IANA de l'appareil à ce moment. Pas modifiable en phase 1.
- **R6. Date de fin.** Instant de la confirmation, ou instant du dernier lieu si l'utilisateur choisit « Il s'est terminé à mon dernier lieu », ou règle d'arrêt automatique (3.6). Jamais avant la date de début.
- **R7. Rattrapage à l'arrêt.** À l'arrêt, les lieux sans voyage dont la date de découverte tombe dans la période sont rangés dans le voyage. Les lieux du voyage découverts après une date de fin avancée (choix « à mon dernier lieu ») n'existent pas par construction ; s'il y en a (horloge fausse), ils restent dans le voyage.
- **R8. Nom.** Espaces au début et à la fin retirés, espaces multiples réduits à un, retours à la ligne remplacés par un espace, caractères de contrôle retirés. Longueur comptée en graphèmes (un emoji composé compte pour 1), maximum 40. Vide après nettoyage : nom par défaut « Voyage du <jour> <mois> » (date de début, fuseau du début). Emoji acceptés. Doublons de noms acceptés.
- **R9. Reprendre.** Seul le dernier voyage terminé peut être repris, et seulement si aucun autre voyage n'a commencé depuis. La reprise efface la date de fin et range les lieux sans voyage découverts dans l'intervalle.
- **R10. Kilomètres.** Somme des distances entre points consécutifs du trajet. On ignore les points de précision plus mauvaise que 50 m et les sauts impliquant une vitesse de plus de 200 km/h. Un intervalle de plus de 10 minutes entre deux points est un trou : on ne compte pas la distance entre eux et on ne trace pas de ligne. Valeurs à confirmer en terrain.
- **R11. Durée.** Différence entre deux instants UTC, donc juste malgré les changements d'heure et de fuseau. Si négative (horloge), affichée « Durée inconnue ».
- **R12. Dates affichées.** Toujours dans le fuseau enregistré au début du voyage, pour que « du 3 au 6 nov » ne bouge pas si l'utilisateur change de pays ensuite.
- **R13. Période d'un voyage passé.** 0 h 00 du premier jour à 23 h 59 59,999 du dernier, fuseau de l'appareil à la création. 90 jours maximum. Pas dans le futur.
- **R14. Suppression.** Supprimer un voyage met à `null` le voyage de ses lieux. Le brouillard ne bouge pas. Le trajet reste, sauf si la case « Effacer aussi le trajet » est cochée : les points de la période sont alors supprimés de l'appareil.
- **R15. Couverture.** Une photo d'un lieu du voyage, ou rien (couverture papier). Si la photo de couverture disparaît, retour à la première photo du voyage, puis à la couverture papier.

## 5. Modèle de données

Tout est **local sur l'appareil** en phase 1 et 2. Rien ne va sur Supabase. Le support exact de stockage local est à vérifier (voir Hypothèses).

### Table locale `trips`

| Champ | Type | Notes |
|---|---|---|
| `id` | UUID v4 | généré sur l'appareil, pas besoin de réseau |
| `name` | texte, 1 à 40 graphèmes | nettoyé selon R8 |
| `status` | `active` ou `ended` | un seul `active` (index unique partiel si le stockage le permet, sinon contrôle dans une transaction) |
| `origin` | `live` ou `past` | `past` pour un voyage créé après coup |
| `started_at` | instant UTC | |
| `started_tz` | texte IANA | ex. `Europe/Helsinki` |
| `ended_at` | instant UTC, nul si actif | |
| `ended_tz` | texte IANA, nul si actif | |
| `end_reason` | `manual`, `manual_last_place`, `auto_inactive`, `auto_cap`, nul | |
| `cover_photo_id` | référence photo, nullable | |
| `clock_suspect` | booléen | vrai si un décalage d'horloge a été détecté au début ou à la fin |
| `reminders_sent` | entier 0 à 2 | |
| `created_at`, `updated_at` | instant UTC | |

### Changements sur les lieux

- Champ `trip_id` nullable sur le lieu local, référence vers `trips.id`. Rempli au moment de la découverte (voyage actif), par le rattrapage (R7, R9) ou par la création d'un voyage passé. Mis à `null` à la suppression du voyage.
- On s'appuie sur la date de découverte existante du lieu (à vérifier).

### Trajet

- Pas de champ ajouté sur les points. Le trajet d'un voyage est déduit par période (`started_at` à `ended_at`, ou maintenant si actif). C'est possible parce que les périodes ne se chevauchent pas (R2). Ça évite de réécrire des milliers de points et ça couvre les points écrits pendant que l'app était tuée.

### Valeurs calculées (pas stockées en phase 1)

Nombre de lieux, kilomètres, durée, présence de trous. Calculés à l'ouverture du bilan ou de la fiche. Mise en cache possible à l'arrêt si les mesures de performance le demandent.

### Supabase

Rien en phase 1 et 2. Pas de nom de voyage, pas de dates, pas de compteur dans les événements d'analyse s'il y en a. La phase 3 (partage dans le Cercle) définira sa propre table et ce qui sort de l'appareil.

## 6. Dépendances et phasage

**Dépend de :**
- Suivi du trajet existant (local, automatique).
- Validation d'un lieu par photo et sa date de découverte.
- Feature filtre carte (phase 1) pour « Voir sur la carte » et l'entrée dans le sélecteur.
- Feature pins photo (phase 1) pour l'affichage des lieux du voyage.
- Notifications locales (permission séparée).
- Feature import galerie (phase 2) pour les photos oubliées.

**Phase 1 :** table `trips`, commencer, nom, bandeau, fiche du voyage en cours, arrêter (avec choix de la date de fin), rattachement automatique et rattrapage, écran de fin simple, rappels et arrêt automatique, reprendre, renommer, supprimer, section Voyages dans Moi.

**Phase 2 :** bilan complet, couverture, photos oubliées, voyage passé.

**Phase 3 (hors de cette spec) :** partage d'un voyage dans le Cercle. Contraintes déjà fixées ici : jamais de partage d'un voyage actif en direct, et le début et la fin du trajet devront être masqués (domicile).

## 7. Safety

**Vie privée et données locales.**
- Voyages, noms, dates, trajet et rattachements restent sur l'appareil. Aucun envoi réseau n'est déclenché par cette feature. À vérifier en test réseau (voir Tests).
- Aucun texte de l'app ne doit affirmer plus que ça. Si un jour une sauvegarde cloud existe, les textes changent avec.
- Les sauvegardes système du téléphone (iCloud, Google) peuvent contenir les données locales. À vérifier et à dire honnêtement dans Moi > Données si c'est le cas.

**Permissions.**
- Aucune nouvelle permission de localisation. On réutilise celle du suivi.
- Notifications : demandées au premier démarrage de voyage seulement, avec une phrase avant la demande système : « On peut te prévenir si ton voyage tourne depuis longtemps sans nouveau lieu. » Refus accepté, rappel dans le bandeau à la place.
- Photos oubliées : sélecteur système, pas d'accès à toute la galerie.

**Sécurité physique.**
- Le bandeau « EN VOYAGE » dit à quiconque voit l'écran (ou une capture partagée) que l'utilisateur n'est pas chez lui. Il n'affiche ni lieu ni adresse. Les notifications ne contiennent pas le nom du voyage, qui peut être révélateur (« Chez maman à Turku »).
- Aucune donnée de voyage n'est visible par d'autres utilisateurs en phase 1 et 2.
- Pas de son ni de vibration particulière au démarrage ou à l'arrêt.

**Abus.** Rien n'est public, donc pas de modération des noms en phase 1 et 2.

**Suppression de compte.**
- Le compte n'est pas nécessaire pour les voyages. Supprimer le compte efface ce qui est sur Supabase, donc rien qui vienne de cette feature.
- L'écran de suppression de compte doit dire : « Tes voyages, tes lieux et ton trajet restent sur ce téléphone. Pour les effacer, va dans Moi > Données. » Il faut donc une action locale « Effacer mes voyages et mon trajet » dans Moi > Données (ou s'appuyer sur une action existante, à vérifier).

**RGPD.** Les données de position sont des données personnelles mais restent sur l'appareil, sous le contrôle de l'utilisateur. Effacement possible voyage par voyage (avec le trajet) et en bloc. Si l'app a une page de confidentialité, ajouter une ligne : les voyages sont stockés localement.

## 8. Edge cases

1. **App tuée pendant un voyage actif.** Le voyage est en stockage local dès le démarrage. À la relance, le bandeau réapparaît. Les points enregistrés pendant que l'app était tuée (si le système relance le suivi) font partie du voyage par la période. Les lieux, eux, ne peuvent être découverts que dans l'app, donc ils ont `trip_id` correct.
2. **Téléphone redémarré pendant un voyage actif.** Même chose. Si le suivi ne redémarre pas seul après un redémarrage, le trajet a un trou : la note « Le trajet a des trous » s'affiche dans le bilan. Pas de notification au redémarrage.
3. **Batterie à plat, téléphone éteint plusieurs heures.** Voyage toujours actif à la relance. Trou dans le trajet, pas de ligne tracée entre les deux bouts, distance non comptée.
4. **Écriture locale qui échoue au démarrage** (stockage plein, base verrouillée). Message « Le voyage n'a pas pu commencer. Réessaie. », pas de bandeau, rien d'écrit à moitié.
5. **Double toucher sur « Commencer ».** Un seul voyage créé. Le bouton est désactivé dès le premier toucher.
6. **Oubli d'arrêter, voyage qui dure des jours avec des lieux.** Pas de rappel tant qu'il y a des lieux nouveaux au moins tous les 3 jours. Plafond à 90 jours.
7. **Oubli d'arrêter, plus aucun lieu.** Rappel à 3 jours, puis à 7 jours, arrêt automatique à 14 jours avec date de fin au dernier lieu. Message à la prochaine ouverture, possibilité de reprendre.
8. **Arrêt bien après la fin réelle.** Choix « Il s'est terminé à mon dernier lieu » proposé si le dernier lieu date de plus de 24 h.
9. **Voyage repris après arrêt automatique, alors que des lieux ont été découverts entre-temps.** Ces lieux étaient sans voyage, ils sont rangés dans le voyage repris (R9).
10. **Reprise impossible.** Si un autre voyage a commencé depuis, « Je suis encore en voyage » n'apparaît pas. On propose « Commencer un nouveau voyage ».
11. **Deux voyages actifs** (corruption, bug, restauration d'une sauvegarde). Détection au lancement : le plus récent reste actif, l'ancien est arrêté à la date de début du plus récent (`end_reason = manual`, à ajuster si besoin d'un code dédié). Les lieux sont réaffectés selon leur date. Journalisé localement pour le débogage.
12. **Démarrer sans réseau** (mode avion, pas de 4G en forêt). Fonctionne pareil. Rien n'attend le réseau.
13. **Changement de fuseau pendant le voyage** (retour de Tallinn, téléphone qui change d'heure). Durée juste (instants UTC). Dates affichées dans le fuseau du début. `ended_tz` garde le fuseau de fin pour information.
14. **Changement d'heure été/hiver pendant le voyage.** Durée juste (UTC). Exemple : voyage du samedi 12 h au dimanche 12 h pendant le passage à l'heure d'hiver affiche « 1 j 1 h ».
15. **Voyage commencé à 23 h 58.** Date de début et nom par défaut sur le jour du début. Le voyage traverse minuit sans rien de spécial.
16. **Rappel prévu la nuit.** Décalé à 9 h le lendemain, heure locale.
17. **Nom vide ou que des espaces.** Nom par défaut « Voyage du 8 novembre ».
18. **Nom trop long.** Saisie bloquée à 40 graphèmes, compteur « 32/40 » visible à partir de 30. Collage d'un texte plus long : tronqué à 40, message « 40 caractères maximum. »
19. **Nom avec emoji, emoji composés, drapeaux.** Accepté, chaque emoji compte pour 1. Affiché avec la police système en repli dans le bandeau. Jamais coupé au milieu d'un emoji à la troncature.
20. **Nom avec retours à la ligne, tabulations, caractères invisibles.** Remplacés ou retirés (R8). Texte de droite à gauche accepté.
21. **Nom identique à un autre voyage.** Accepté.
22. **Voyage sans aucun lieu.** Bilan « Aucun lieu », km et durée affichés. Couverture papier. Le bilan propose « Ajouter des photos oubliées » (phase 2) et, dans le menu, la suppression. Le voyage est gardé si l'utilisateur ne fait rien.
23. **Voyage sans lieu et de moins de 2 minutes.** À l'arrêt, proposition de l'effacer (3.4).
24. **Trajet sans lieu.** Voyage gardé. Avec le filtre, la carte montre le pointillé `stamp` seul, sans pin. Bilan : « Aucun lieu », km réels.
25. **Lieux sans trajet** (position refusée en arrière-plan). Bilan : « 5 lieux », « moins de 100 m » ou km calculés sur les seuls points disponibles, avec la note sur les trous.
26. **Batterie faible ou mode économie d'énergie.** La feature n'ajoute aucune collecte. Si le système ralentit le suivi, le trajet a moins de points ou des trous, signalés dans le bilan. Pas de message batterie de notre part.
27. **Permission de localisation retirée en route.** Le voyage reste actif. Le bandeau passe à l'état « Position coupée » avec un lien vers les réglages. À la remise de la permission, le bandeau revient à l'état normal. Le bilan signale le trou.
28. **Position passée en approximative (iOS).** Traité comme une position coupée pour le trajet si le suivi ne l'enregistre pas (à vérifier).
29. **Voyage créé après coup qui chevauche un autre voyage.** Refusé, message avec le nom et les dates de l'autre voyage. Pas de fusion automatique.
30. **Voyage créé après coup qui chevauche le voyage actif** (dernier jour = aujourd'hui). Refusé, même message.
31. **Voyage créé après coup dans une période où des lieux sont déjà dans un autre voyage.** Impossible par R2 : ces lieux sont dans la période d'un autre voyage, donc la période chevauche.
32. **Voyage créé après coup sur une période sans rien.** Autorisé, aperçu « Aucun lieu ni trajet sur ces dates ».
33. **Suppression d'un voyage terminé.** Lieux et brouillard intacts, lieux sans voyage. Trajet gardé sauf case cochée.
34. **Suppression du voyage actif.** Arrêté puis supprimé. Bandeau retiré. Les lieux découverts ensuite ne sont dans aucun voyage.
35. **Suppression d'un voyage choisi comme filtre sur la carte.** Le filtre revient à « Tous ».
36. **Suppression d'un lieu qui est la couverture.** Couverture remplacée selon R15.
37. **Suppression de compte pendant un voyage actif.** Le voyage continue, il ne dépend pas du compte. Texte de l'écran de suppression conforme à la section Safety.
38. **Déconnexion du compte.** Aucun effet sur les voyages.
39. **Lieu déjà découvert dans un autre voyage, revisité pendant le voyage actif.** Le brouillard est déjà levé, le lieu reste dans son voyage d'origine et ne compte pas dans les lieux du voyage actif. Le trajet du voyage actif passe par là normalement.
40. **Photo oubliée d'un lieu déjà dans un autre voyage.** Le lieu reste où il est, message groupé (3.7).
41. **Horloge de l'appareil en retard ou en avance.** Détection si l'heure de l'appareil est plus de 10 minutes avant le dernier lieu ou point connu, ou plus de 10 minutes loin de l'heure serveur (si réseau) ou de l'heure GPS (si disponible). Le voyage démarre quand même, `clock_suspect = true`, note dans le bilan. Les lieux découverts pendant le voyage actif y sont rangés malgré leur date (R3).
42. **Horloge corrigée pendant le voyage, date de fin avant la date de début.** Date de fin ramenée à la date de début, « Durée inconnue ».
43. **Horloge fausse et rattrapage par période.** Les points de trajet avec une date aberrante peuvent tomber hors période et manquer au voyage. Accepté, signalé par `clock_suspect`.
44. **Voyage commencé hors de Helsinki ou trajet qui sort de la zone.** Le voyage fonctionne. Le trajet hors zone compte dans les km. Les lieux ne se découvrent que dans la zone, selon les règles existantes.
45. **Mise à jour de l'app pendant un voyage actif.** La migration de données garde le voyage actif. Test dédié.
46. **Réinstallation de l'app ou changement de téléphone.** Les données locales sont perdues sauf restauration d'une sauvegarde système. Rien à faire de plus en phase 1 et 2, mais aucun texte ne doit promettre le contraire.
47. **Très nombreux voyages (200 et plus).** La liste dans Moi reste fluide (liste virtualisée), le sélecteur de filtre aussi.
48. **Voyage très long avec énormément de points** (90 jours). Calcul du bilan en tâche de fond, indicateur « On compte tes kilomètres… » si plus de 300 ms.
49. **Notification de rappel touchée alors que le voyage a déjà été arrêté** (depuis un autre écran entre-temps). Ouvre le bilan du voyage, pas d'erreur. Les rappels en attente sont annulés à l'arrêt.
50. **Notifications refusées puis accordées plus tard.** Les rappels futurs sont programmés au prochain lancement.
51. **Mode sombre, grande taille de texte.** Bandeau sur deux lignes si nécessaire, le bouton Arrêter garde 44 px et reste visible. Le nom se tronque avant le bouton.
52. **Lecteur d'écran.** Le tampon décoratif est ignoré, le bandeau est lu comme un seul élément, l'annonce de démarrage et d'arrêt est faite.

## 9. Tests

### Unitaires

- Nettoyage du nom : `"  Tallinn   trip \n"` donne `"Tallinn trip"` ; `""` donne `"Voyage du 8 novembre"` (date injectée) ; 41 graphèmes refusés ; `"👨‍👩‍👧"` compte pour 1 ; `"🇫🇮"` compte pour 1 ; troncature à 40 sans couper un emoji.
- Format de durée : 0 s donne « 0 min » ; 45 min donne « 45 min » ; 3 h 20 donne « 3 h 20 » ; 76 h donne « 3 j 4 h » ; négatif donne « Durée inconnue ».
- Format de distance : 0,05 km donne « moins de 100 m » ; 4,24 km donne « 4,2 km » ; 34,6 km donne « 35 km ».
- Calcul des km : points à 60 m de précision ignorés ; saut à 500 km/h ignoré ; intervalle de 15 min non compté ; trajet droit de 1 km en 20 points donne 1,0 km à 2 % près.
- Durée sur changement d'heure : début 2026-10-24 12:00 Europe/Helsinki, fin 2026-10-25 12:00 donne 25 h.
- Dates affichées dans `started_tz` même si l'appareil est passé en `Europe/Paris`.
- Détection de chevauchement : [3, 6] contre [6, 8] chevauche (jours inclusifs) ; [3, 5] contre [6, 8] ne chevauche pas ; période ouverte (actif) contre période qui inclut aujourd'hui chevauche.
- Planification des rappels : dernier lieu à J, rappel à J+3 ; si l'heure tombe à 2 h, décalé à 9 h ; second à J+7 ; arrêt à J+14 avec date de fin = dernier lieu.
- Contrainte R1 : création d'un second voyage actif refusée par la couche de données.
- Réparation de deux voyages actifs : l'ancien est arrêté à la date de début du récent, lieux réaffectés.
- Détection d'horloge : heure appareil 20 min avant le dernier point donne `clock_suspect = true`.

### Intégration

- Démarrer, valider 3 lieux, arrêter : les 3 lieux ont `trip_id` du voyage, le bilan affiche « 3 lieux ».
- Démarrer, tuer l'app, relancer : bandeau présent, même `id`.
- Démarrer, simuler un lieu écrit avec `trip_id` nul dans la période (écriture concurrente), arrêter : le rattrapage le range.
- Arrêter avec « à mon dernier lieu » : `ended_at` égal à la date du dernier lieu, `end_reason = manual_last_place`.
- Supprimer un voyage sans cocher : lieux à `trip_id` nul, points intacts, brouillard identique (comparaison du masque avant et après).
- Supprimer en cochant : points de la période supprimés, points hors période intacts.
- Voyage passé sur [3, 6 nov] : lieux sans voyage de la période rangés, aperçu égal au résultat.
- Retrait de la permission pendant un voyage (simulé) : bandeau en état « Position coupée ».
- Migration de schéma avec un voyage actif : voyage toujours actif après migration.
- Contrôle réseau : démarrer, arrêter, renommer, supprimer, créer un voyage passé avec un proxy qui journalise les requêtes : aucune requête contenant nom, dates ou positions.

### Bout en bout

- Parcours complet phase 1 : Moi > Commencer un voyage > nom « Week-end Suomenlinna » > Commencer > photo d'un lieu > bandeau visible sur la carte > Arrêter > Arrêter le voyage > écran de fin « 1 lieu ».
- Nom vide : le bandeau affiche « Voyage du <date du jour> ».
- Démarrage en mode avion : même parcours sans erreur.
- Démarrage par erreur : Commencer puis Arrêter dans la minute : proposition d'effacer, Effacer, plus aucune trace dans Moi.
- Arrêt automatique : horloge simulée +14 jours sans lieu, relance : feuille « s'est arrêté tout seul », « Je suis encore en voyage » relance le bandeau.
- Phase 2 : arrêter, choisir une couverture, ajouter 3 photos (une valide, une hors période, une sans position) : récap correct, couverture visible dans Moi.
- Phase 2 : voyage passé qui chevauche : bouton désactivé, message avec le nom de l'autre voyage.

### Accessibilité

- VoiceOver et TalkBack : bandeau lu « En voyage : <nom>. Commencé le … », bouton « Arrêter le voyage » atteignable, tampon décoratif ignoré, annonces au démarrage et à l'arrêt.
- Taille de texte maximale : bandeau sans chevauchement, bouton Arrêter entier, feuilles défilables.
- Toutes les cibles de la feature mesurent 44 px minimum (vérification automatique sur les composants).
- Contraste 4,5:1 : texte `stamp` du tampon sur fond du bandeau, `muted` sur `paper`, en clair et en sombre.
- « Réduire les animations » actif : feuille et bandeau apparaissent sans transition.
- Aucun élément interactif ne tourne (bouton, champ, polaroïd cliquable).

### Performance

- Démarrage : écriture locale et apparition du bandeau en moins de 150 ms sur un téléphone d'entrée de gamme de référence.
- Bilan d'un voyage de 7 jours avec 50 000 points : calcul en moins de 500 ms, sans bloquer l'interface.
- Aucune hausse de consommation batterie mesurable sur 2 h de suivi avec et sans voyage actif (comparaison à conditions égales).

### Terrain

- Balade de 2 h dans Helsinki (Kallio vers Kaivopuisto), à pied et en tram, 5 lieux validés : km du bilan à 10 % de la distance d'une appli de référence.
- Voyage sur une nuit (départ 22 h, arrêt le lendemain 11 h) : dates et durée justes.
- Ferry vers Suomenlinna en mode économie d'énergie : trajet avec éventuels trous signalés, pas de ligne aberrante sur l'eau.
- Téléphone éteint 1 h en cours de voyage : voyage toujours actif, trou signalé.
- Retrait de la permission dans les réglages en pleine balade, puis remise : états du bandeau corrects.
- Aller-retour à Tallinn (changement d'opérateur, même fuseau) et test avec un fuseau différent simulé : dates stables.

## 10. Critères d'acceptation

Phase 1
- [ ] On peut commencer un voyage depuis Moi et depuis le sélecteur de filtre de la carte, sans compte et sans réseau.
- [ ] Le bouton de démarrage est secondaire (contour 2 px `ink`) et le bouton photo reste la seule action principale de la carte.
- [ ] Le nom suit R8 : vide donne le nom par défaut, 40 graphèmes maximum, emoji acceptés.
- [ ] La date de début est automatique, stockée en UTC avec le fuseau.
- [ ] Il ne peut jamais y avoir deux voyages actifs.
- [ ] Les lieux découverts pendant un voyage actif y sont rangés sans action.
- [ ] Le trajet du voyage est celui de sa période, sans collecte supplémentaire.
- [ ] Le bandeau « EN VOYAGE » avec le nom et le bouton Arrêter est visible en haut de la carte tant que le voyage est actif, et survit à l'app tuée et au redémarrage.
- [ ] Arrêter demande confirmation et propose la fin au dernier lieu si celui-ci date de plus de 24 h.
- [ ] Rappels à 3 et 7 jours sans lieu, arrêt automatique à 14 jours, reprise possible.
- [ ] Les notifications ne contiennent pas le nom du voyage.
- [ ] Supprimer un voyage ne touche ni aux lieux ni au brouillard ; le trajet n'est effacé que si l'utilisateur coche la case.
- [ ] Aucune donnée de la feature ne quitte l'appareil (test réseau passé).
- [ ] L'écran de suppression de compte dit la vérité sur les voyages restés sur l'appareil.
- [ ] Tokens uniquement, mode clair et sombre, 44 px, contraste 4,5:1, lecteurs d'écran, animations sous 450 ms et coupées si « réduire les animations ».

Phase 2
- [ ] Le bilan affiche lieux, km et durée aux formats définis, avec les notes trous et horloge quand il le faut.
- [ ] On peut choisir une couverture parmi les photos du voyage ; couverture papier par défaut sans photo.
- [ ] On peut ajouter des photos oubliées avec le sélecteur système ; les règles de 3.7 sont respectées et récapitulées.
- [ ] On peut créer un voyage passé sur une plage de dates, avec aperçu, refus des chevauchements, du futur et de plus de 90 jours.

## 11. Hypothèses à vérifier

1. Le suivi du trajet stocke des points horodatés avec une précision, localement, et on peut les lire par période de façon efficace (index sur la date).
2. Le suivi continue quand l'app est tuée et redémarre après un redémarrage du téléphone, ou pas. Ça change le texte sur les trous.
3. Le suivi demande la permission de localisation en arrière-plan ; on sait détecter son retrait pendant que l'app tourne et à la relance.
4. Comportement du suivi avec la position approximative sur iOS.
5. Le support de stockage local (SQLite, autre) et s'il permet un index unique partiel et des transactions.
6. Un lieu a une date de découverte fiable et un identifiant stable, et la page d'un lieu peut accueillir plusieurs photos.
7. La validation d'un lieu par photo exige une position ; ce qui se passe sans position.
8. L'existence d'un système de notifications locales dans l'app (expo-notifications ou autre).
9. Les fichiers de l'app sont inclus ou non dans les sauvegardes iCloud et Google.
10. L'existence d'événements d'analyse et ce qu'ils contiennent.
11. L'heure GPS est accessible via la bibliothèque de localisation utilisée (horodatage des positions venant du GPS ou de l'horloge du téléphone).
12. Moi a déjà une zone « Données » avec une action d'effacement local.
13. Le contraste de `stamp` sur `paperLight` et son équivalent sombre atteint 4,5:1 pour du texte en Special Elite à la taille du tampon.
14. La police Special Elite n'a pas de glyphes emoji et le repli système s'affiche proprement dans le bandeau.
15. La feature filtre carte expose un sélecteur où ajouter la ligne « Commencer un voyage ».
16. Un moyen de tracer le trajet avec des trous (segments séparés) existe déjà, ou est à faire.

## 12. Questions ouvertes

1. Faut-il un bouton permanent « Commencer un voyage » en haut de la carte quand aucun voyage n'est actif ? Proposition : non au départ, mesurer combien de voyages sont commencés, revoir si c'est trop caché.
2. Les seuils 3, 7, 14 et 90 jours sont-ils les bons ? À ajuster après les premiers retours.
3. Le bilan doit-il compter les lieux revisités (« et 3 lieux revisités ») ? Ça demande de savoir enregistrer les revisites.
4. Peut-on modifier les dates d'un voyage terminé (avancer le début, reculer la fin) ? Pas prévu ici sauf la fin au dernier lieu.
5. Une photo sans position peut-elle être posée à la main sur la carte ? Ça lèverait le brouillard sans preuve de passage, à trancher dans la spec import galerie.
6. Couverture sans photo : papier kraft avec le nom, ou un extrait de la carte avec le trajet ?
7. Faut-il une corbeille de 30 jours pour les voyages supprimés ?
8. Si un voyage passé chevauche un autre, faut-il proposer de fusionner les deux plutôt que de refuser ?
9. L'utilisateur voudra-t-il désactiver complètement le bandeau (discrétion) tout en gardant le voyage actif ?

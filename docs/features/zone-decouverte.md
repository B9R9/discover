# Zone découverte plus large : spec

Brouillon du 8 nov 2026, à relire

## Résumé

Aujourd'hui, la zone découverte quand on se déplace paraît trop petite. On ne sait pas encore si le manque vient du trajet (le couloir levé pendant la marche est trop étroit), des trous autour des lieux validés (trop petits), ou des deux. On ne sait pas non plus de combien agrandir.

Cette spec propose :

- une méthode courte pour trancher la question avant de figer les valeurs (mesure locale + test terrain, voir « Questions ouvertes », Q1) ;
- un couloir de trajet plus large, 100 à 150 m de chaque côté au lieu de quelques dizaines de mètres ;
- un rayon qui dépend du mode de déplacement (pied, vélo, transport) et, plus tard, de la densité (parc ou centre) ;
- deux niveaux de découverte : le trajet lève un brouillard léger (« esquisse », on voit les rues), seule la validation d'un lieu par photo colore la zone à fond. Les photos gardent leur valeur ;
- un curseur « Portée de la lanterne » dans les réglages, avec une valeur par défaut plus généreuse (120 m) ;
- un modèle de données local qui garde le trajet comme source de vérité et un masque en tuiles pour l'affichage, ce qui permet de recalculer si le rayon change ;
- des filtres contre les erreurs (sauts GPS, transports rapides, immobilité, GPS simulé) ;
- des garde-fous vie privée : le brouillard dessine les habitudes (domicile, travail), il reste sur l'appareil, ne part jamais dans le Cercle et peut être effacé.

Il n'y a qu'un seul brouillard pour toute la carte principale. Rien ne change sur ce point.

## Objectif et utilisateur

**Utilisateur.** Quelqu'un qui se balade dans Helsinki, à pied le plus souvent, parfois à vélo, et qui prend le tram ou le métro entre deux balades. Il ouvre la carte après une sortie pour voir ce qu'il a « déplié ».

**Problème.** Après une heure de marche, la carte montre un fil étroit et quelques trous autour des lieux photographiés. Le sentiment d'avoir exploré ne correspond pas à ce qui s'affiche. C'est décourageant.

**Objectifs.**

1. Après une balade, la carte doit refléter ce qu'on a vu : les rues qu'on a longées et celles qu'on a aperçues au bout.
2. La photo reste le geste qui compte : elle seule fait apparaître la couleur.
3. Ne jamais découvrir par erreur (tram, train, voiture, saut GPS).
4. Laisser l'utilisateur régler la générosité, sans le perdre dans des options.
5. Ne pas aggraver le risque vie privée ni la consommation de batterie.

**Hors objectifs.** Pas de score de couverture en pourcentage dans cette feature. Pas de détection automatique du domicile. Pas d'envoi de traces vers Supabase.

## Comportement détaillé

### Les deux niveaux de découverte

| Niveau | Comment on l'obtient | Ce qu'on voit |
|---|---|---|
| Brouillard | Par défaut | Hachure dense sur `fog`, comme aujourd'hui. |
| Esquisse | Passer à proximité (couloir du trajet) | Hachure légère et espacée, fond `paper`, rues et noms de rues tracés en `ink` fin. Pas de couleur de fond de carte (ni `sage`, ni `postal`). |
| Couleur | Valider un lieu par photo | Carte en couleur complète, comme les trous actuels. |

- Les trois niveaux se distinguent par la texture (hachure dense, hachure légère, pas de hachure), pas seulement par la couleur. Règle d'accessibilité respectée.
- L'esquisse utilise `fog` à une densité de hachure plus faible. Un token dédié est à ajouter dans `app/src/theme/tokens.ts` (par exemple `fogSketch`), dérivé de `fog` pour ne pas créer un nouveau gris. Versions mode clair et mode sombre.
- Les contours restent irréguliers (même effet que les trous actuels) pour l'esquisse et pour la couleur.
- Un lieu validé colore un disque irrégulier autour de lui (rayon « lieu », voir Règles métier). La couleur ne s'étend jamais au couloir du trajet.

### Pendant un déplacement (carte ouverte)

1. L'utilisateur marche. Le point `postal` avance.
2. Toutes les quelques secondes, le couloir d'esquisse s'étend autour de la portion parcourue. L'apparition se fait en fondu de 300 ms. Avec « réduire les animations », elle saute à l'état final.
3. S'il valide un lieu par photo, le disque couleur s'ouvre autour du lieu (animation existante, 450 ms maximum).
4. S'il monte dans un tram, l'app détecte le mode transport après quelques dizaines de secondes. Le couloir s'arrête. Aucun message n'apparaît pendant le trajet. Il reprend quand il remarche.

Pas de bannière, pas de notification pendant la marche. L'app ne demande aucune action.

### Après un déplacement (app ouverte plus tard)

Si la permission de localisation est « toujours », les segments enregistrés en arrière-plan sont déjà dans le masque. À l'ouverture, la carte s'affiche directement avec l'esquisse à jour. Pas d'animation de rattrapage au-delà de 450 ms.

Si la permission est « seulement pendant l'utilisation », seuls les moments où l'app était ouverte comptent (voir Edge cases 16).

### Écran Moi > Réglages : « Portée de la lanterne »

Nouvelle section dans les réglages, sous un titre en Special Elite.

- Libellé visible au-dessus du curseur : **Portée de la lanterne**
- Texte d'aide (DM Sans, `muted`) : « Jusqu'où ta lanterne éclaire les rues autour de ton chemin. Les lieux que tu photographies gardent toute leur couleur, quel que soit le réglage. »
- Curseur à 5 crans (pas de valeur continue) :
  - Courte, 60 m
  - Moyenne, 90 m
  - Large, 120 m (par défaut)
  - Très large, 150 m
  - Immense, 200 m
- La valeur choisie s'affiche à droite du libellé, en Special Elite : « Large · 120 m ».
- Sous le curseur, un petit aperçu : un bout de carte avec un trajet en pointillé `stamp` et le couloir d'esquisse à la largeur choisie. Décoratif, caché aux lecteurs d'écran. Mise à jour en fondu de 200 ms (instantané si « réduire les animations »).
- Cible tactile de 44 px minimum sur la poignée et sur chaque cran.
- Accessibilité : rôle « adjustable », valeur lue « Large, 120 mètres », actions incrémenter et décrémenter.

Quand l'utilisateur relâche le curseur sur une nouvelle valeur :

- Si la valeur augmente : pas de confirmation. Texte bref sous le curseur : « Ta carte va être redessinée avec cette portée. »
- Si la valeur baisse : une feuille de confirmation s'ouvre.
  - Titre (Fraunces italique) : « Réduire la portée ? »
  - Texte : « Les rues aperçues de loin vont repasser sous le brouillard. Les lieux que tu as photographiés ne bougent pas. »
  - Bouton principal `stamp` : « Réduire »
  - Bouton secondaire (contour `ink`) : « Garder 120 m »
- Pendant le recalcul, la carte garde l'ancien dessin. Une étiquette discrète en haut de la carte (Special Elite, `postal`) : « Carte en cours de redessin ». Elle disparaît à la fin. Pas de blocage de l'app.

### Écran Moi > Réglages : « Mes traces »

Section nouvelle, liée à la vie privée.

- Ligne d'info : « Ton chemin reste sur ton téléphone. Il sert seulement à lever le brouillard. »
- Bouton secondaire : « Effacer l'historique de trajets »
  - Confirmation : « Effacer ton historique de trajets ? Ta carte reste telle qu'elle est, mais elle ne pourra plus être redessinée si tu changes la portée de la lanterne. »
  - Boutons : « Effacer » (principal `stamp`) / « Annuler »
- Bouton secondaire : « Effacer ma carte »
  - Confirmation en deux temps. Premier écran : « Effacer ta carte ? Le brouillard revient partout. Tes lieux et tes photos restent dans ton carnet. » Bouton « Continuer ». Second écran : saisir « EFFACER » dans un champ avec libellé visible, puis bouton « Effacer ma carte ».
  - Question : les lieux validés recolorent-ils leur disque après effacement ? Proposition : oui, la couleur des lieux est recalculée depuis les lieux, seule l'esquisse disparaît.
- Lien vers « Zones privées » (voir Safety). Phase B.

### Aide sur la carte

Un bouton « ? » (icône seule, `accessibilityLabel` « Comment se lève le brouillard ») ouvre une feuille :

- « Quand tu marches, ta lanterne éclaire les rues autour de toi. Elles apparaissent en esquisse. »
- « Quand tu photographies un lieu, la couleur revient autour de lui. »
- « En tram, en métro ou en voiture, la lanterne se met en veille. »

Chaque phrase est accompagnée d'une vignette de texture (hachure dense, légère, couleur). Vignettes décoratives cachées aux lecteurs d'écran, le texte porte le sens.

## Règles métier

### R1. Rayons

- **Rayon trajet** (de chaque côté du chemin) = portée de la lanterne × coefficient de mode × coefficient de densité, plafonné à 200 m.
- **Coefficient de mode** :
  - pied : 1
  - vélo : 0,75 (on voit moins de chaque rue en passant vite, et on ne veut pas qu'une sortie vélo couvre la ville)
  - transport (tram, bus, métro, train, voiture, bateau, avion) : 0, aucune esquisse
  - inconnu : 0
- **Coefficient de densité** (phase C, à valider par le test terrain) :
  - parc, forêt, bord de mer dégagé : 1,25
  - zone mixte : 1
  - centre dense (immeubles continus) : 0,8
  - La densité vient d'une donnée cartographique hors ligne, pas d'un calcul en direct. Voir Hypothèses.
- **Rayon lieu** (disque couleur) : valeur actuelle à confirmer, proposition 150 m, indépendant du curseur. Valeur finale fixée par le test terrain (Q1, Q2).
- Le rayon appliqué est celui en vigueur au moment où le point est enregistré, puis recalculé si la portée change (R6).

### R2. Classement du mode de déplacement

- Calcul sur une fenêtre glissante de 30 secondes : vitesse médiane, vitesse maximale, régularité.
- Si la reconnaissance d'activité du système est autorisée (iOS « Mouvements et forme », Android « Activité physique »), elle prime quand sa confiance est haute.
- Sans reconnaissance d'activité :
  - médiane < 7 km/h : pied
  - 7 à 25 km/h : vélo seulement si la vitesse est régulière et sans arrêts réguliers de 15 à 60 s espacés de 300 à 600 m (signature d'un tram). Sinon inconnu.
  - > 25 km/h : transport
- Hystérésis : il faut 30 secondes cohérentes pour changer de mode, pour éviter l'alternance à un feu rouge.
- Toute pointe au-dessus de 40 km/h dans la fenêtre coupe l'esquisse de la fenêtre entière.

### R3. Filtrage des points GPS

- Point rejeté si la précision annoncée est pire que 35 m.
- Point rejeté si la vitesse implicite depuis le point précédent dépasse 50 km/h alors que le mode est pied ou vélo (saut).
- Rupture de segment (on ne relie pas deux points) si l'écart dépasse 90 secondes ou 250 m. Chaque côté de la rupture garde son couloir, mais pas de ligne entre les deux.
- Immobilité : si le déplacement reste dans le cercle de précision pendant plus de 2 minutes, la position est figée sur un point unique jusqu'à ce qu'on en sorte de plus de 30 m. Pas d'étoile de bruit autour du point.
- Points marqués comme simulés par le système : ignorés (R8).

### R4. Union et niveaux

- La zone découverte est l'union de tous les couloirs et disques. Les chevauchements ne comptent qu'une fois.
- En chaque point, le niveau affiché est le plus haut obtenu : couleur > esquisse > brouillard.
- Un lieu se découvre une seule fois (règle globale). Revalider un lieu ne change rien au masque.

### R5. Brouillard unique et voyages

- Un seul brouillard pour la carte principale. Le filtre de voyage change les pins et lieux affichés, pas le brouillard.
- Les segments de trajet portent l'identifiant du voyage en cours s'il y en a un, pour usage futur (bilan de voyage, phase 2). Supprimer un voyage ne supprime ni les segments ni le masque (règle globale).

### R6. Changement de portée

- La portée est un paramètre de dessin. Le masque d'esquisse est toujours recalculable depuis les segments.
- Changement en cours de route : les nouveaux points utilisent la nouvelle valeur tout de suite. L'historique complet est recalculé en arrière-plan, par lots, sans bloquer l'interface.
- Hausse : rétroactive sans confirmation. Baisse : rétroactive après confirmation.
- La couleur des lieux n'est jamais touchée par la portée.
- Si l'historique de trajets a été effacé, le curseur ne s'applique qu'aux trajets futurs. Texte sous le curseur : « Ton historique de trajets est effacé. La nouvelle portée s'appliquera à tes prochaines balades. »

### R7. Migration des anciennes zones

- Si les anciens points de trajet existent : on recalcule tout avec la nouvelle portée par défaut (120 m), une fois, au premier lancement de la nouvelle version.
- Si seule l'ancienne géométrie existe (pas de points) : on l'agrandit d'un tampon de (120 m moins l'ancien rayon). Si l'ancienne zone était exactement un couloir autour du trajet, le résultat est identique à un recalcul. Si la forme était déjà irrégulière, c'est une bonne approximation.
- Les anciennes zones migrées passent en esquisse, sauf les disques autour des lieux validés qui restent en couleur.
- Rien de déjà découvert ne repasse sous le brouillard pendant la migration. Pour l'ancien couloir, on fait l'union de l'ancien et du nouveau.
- La migration est idempotente (un drapeau de version de schéma l'empêche de tourner deux fois).

### R8. GPS simulé

- Points marqués « simulés » par le système (Android : position fictive ; iOS : position simulée par logiciel, si exposée) : ignorés pour l'esquisse et pour la validation de lieu.
- Pas de message accusateur, pas de sanction sur le compte. Sur la carte, rien ne se lève, c'est tout.
- Un drapeau de build de développement permet de désactiver ce filtre pour les tests.

### R9. Ce qui n'est jamais fait

- Pas de détection ni d'étiquette « domicile » ou « travail ».
- Pas d'envoi de segments, de masque ou de positions vers Supabase dans cette feature.
- Pas de récompense qui pousse à remplir les trous d'une zone fermée ou privée.

## Modèle de données

Tout est local, dans la base SQLite de l'appareil (hypothèse sur la techno, voir Hypothèses). Rien sur Supabase.

### Options étudiées pour stocker la zone

| Option | Pour | Contre |
|---|---|---|
| A. Points bruts seulement, zone recalculée à l'affichage | Simple, recalcul gratuit | Trop lent à afficher sur un gros historique |
| B. Géométrie vectorielle (polygone d'union) | Précis, compact au début | Union qui grossit et se fragmente, recalcul coûteux, rendu lent avec des milliers de sommets |
| C. Grille de cellules hexagonales (type H3) | Union triviale, comptage facile | Rendu en nid d'abeille, contours irréguliers difficiles, pas assez fin à 2 m |
| D. Masque raster en tuiles | Union = maximum par pixel, rendu tuile par tuile, coût fixe, niveaux faciles à coder | Moins précis qu'un vecteur, il faut régénérer les tuiles touchées |

**Choix proposé : segments comme source de vérité + masque raster en tuiles comme cache d'affichage (A + D).**

### Table `trace_segments`

Un segment = une suite continue de points cohérents (même mode, pas de rupture).

| Champ | Type | Note |
|---|---|---|
| `id` | texte (UUID) | |
| `started_at` | horodatage | début du segment |
| `ended_at` | horodatage | fin du segment |
| `mode` | texte | `walk`, `bike`, `transport`, `unknown` |
| `polyline` | blob | points simplifiés (tolérance 5 m), encodés, sans horodatage par point |
| `point_count` | entier | |
| `bbox` | 4 réels | pour retrouver vite les tuiles touchées |
| `trip_id` | texte, nullable | voyage en cours au moment de l'enregistrement |
| `source` | texte | `foreground`, `background`, `migrated` |
| `excluded` | booléen | vrai si dans une zone privée (phase B) |

Pas d'horodatage par point : on garde le début et la fin du segment. Cela suffit pour les voyages et réduit ce qu'un tiers pourrait lire des habitudes heure par heure.

Les segments `transport` sont gardés sous forme minimale (début, fin, mode, pas de polyline) ou pas du tout. Proposition : pas du tout. Ils n'apportent rien au brouillard.

### Table `fog_tiles`

| Champ | Type | Note |
|---|---|---|
| `z` `x` `y` | entiers | tuile web Mercator au zoom 16 (environ 305 m de côté à Helsinki) |
| `mask` | blob compressé | 128 × 128 pixels, 2 bits par pixel (0 brouillard, 1 esquisse, 2 couleur), environ 2,4 m par pixel |
| `version` | entier | version du calcul (portée, règles) |
| `updated_at` | horodatage | |

Ordre de grandeur : 4 Ko par tuile non compressée, beaucoup moins compressée. Un utilisateur qui a parcouru 50 km² touche environ 550 tuiles, soit moins de 2 Mo. Acceptable.

Pour les vues dézoomées, on génère à la volée (et on met en cache) des tuiles réduites aux zooms 14 et 12.

### Couleur des lieux

Pas de nouvelle table. Le disque couleur se déduit des lieux validés existants (position + rayon lieu). Il est écrit dans les tuiles comme niveau 2. Effacer la carte (R « Effacer ma carte ») remet les tuiles à zéro puis réécrit les disques des lieux.

### Réglages

| Clé | Valeur | Défaut |
|---|---|---|
| `lantern_range_m` | 60, 90, 120, 150, 200 | 120 |
| `fog_schema_version` | entier | version de migration |
| `fog_recompute_pending` | booléen + curseur de progression | pour reprendre un recalcul interrompu |

### Zones privées (phase B)

Table `privacy_zones` : `id`, `center` (lat, lng), `radius_m` (200 à 1000), `label` libre facultatif, local uniquement. Usage décrit dans Safety.

### Contours irréguliers

Les contours irréguliers sont produits au rendu par un bruit déterministe calculé à partir des coordonnées (même endroit, même contour, à chaque affichage). Ils ne sont pas stockés.

## Dépendances et phasage

### Dépendances

- Suivi de trajet existant (local, automatique). Cette feature le consomme et ajoute les filtres.
- Validation de lieu par photo existante (pour la couleur).
- Bibliothèque de carte capable d'afficher une couche raster ou un masque généré localement. À vérifier.
- Données hors ligne : eau (phase A, pour l'edge case bateau), occupation du sol (phase C, pour la densité).
- Reconnaissance d'activité système, facultative.
- Phase 3 globale (partage dans le Cercle) : doit respecter les règles Safety ci-dessous.

### Phasage proposé

Cette feature est indépendante du phasage des voyages. Elle peut avancer en parallèle de la phase 1.

- **Phase 0, une à deux semaines : trancher la question (Q1).** Build de test avec rayons réglables, mesure locale, test terrain. Rien n'est livré au public.
- **Phase A : couloir plus large et fiabilité.** Nouveau modèle de données, migration, filtres GPS, classement du mode, rayon pied et vélo, rayon lieu ajusté. Un seul niveau de découverte possible au départ si on veut livrer vite, mais le masque stocke déjà les 2 bits.
- **Phase B : deux niveaux et réglages.** Esquisse vs couleur, token `fogSketch`, curseur « Portée de la lanterne », « Mes traces », zones privées.
- **Phase C : densité.** Coefficient parc ou centre, seulement si le test terrain montre un besoin.

## Safety

### Ce que la zone révèle

La zone découverte est une carte des habitudes. Le domicile, le travail, l'école des enfants, une salle de sport apparaissent comme des taches très découvertes reliées par des couloirs. Avec un rayon plus large, la tache est plus grosse, mais le centre reste lisible. Toute capture d'écran de la carte principale révèle donc ces lieux.

### Stockage local

- Segments et tuiles restent sur l'appareil. Aucun envoi vers Supabase.
- À vérifier : la base locale est-elle incluse dans les sauvegardes iCloud ou Google ? Si oui, la phrase « Ton chemin reste sur ton téléphone » est fausse. Deux options : exclure ces fichiers des sauvegardes, ou corriger le texte (« Ton chemin reste sur ton téléphone et dans sa sauvegarde, si elle est activée »). La décision doit être prise avant la phase B, car les affirmations sur les données doivent rester vraies.
- Stockage dans la zone protégée du système (chiffrement au repos lié au verrouillage du téléphone). Un chiffrement applicatif en plus est une question ouverte.
- « Effacer l'historique de trajets » supprime les segments. « Effacer ma carte » supprime segments et esquisse. La désinstallation supprime tout (hors sauvegarde système, voir plus haut).

### Export

- L'export de la carte en image (si la feature existe ou arrive) affiche avant de générer : « Cette image montre où tu passes souvent. Les zones privées seront recouvertes de brouillard. » Bouton « Exporter » / « Annuler ».
- L'export de données personnelles (droit à la portabilité) inclut les segments en GeoJSON, à la demande seulement, par la feuille de partage du système. Avertissement : « Ce fichier contient tes trajets. Garde-le pour toi. »
- Aucun export automatique.

### Partage dans le Cercle (phase 3)

- Le brouillard global ne part jamais dans le Cercle. Une balade partagée contient ses lieux et son tracé, pas l'esquisse de la carte principale.
- Le tracé d'une balade partagée est coupé à 200 m de son début et de sa fin, et dans toute zone privée.
- Les autres utilisateurs ne voient jamais la zone découverte de quelqu'un d'autre.

### Zones privées (phase B)

- L'utilisateur peut poser jusqu'à 3 zones (200 à 1000 m de rayon). Exemple de texte : « Ajoute une zone privée autour de chez toi, de ton travail ou de tout endroit que tu veux garder pour toi. »
- Dans une zone privée, l'esquisse reste visible sur ta propre carte (sinon le brouillard autour de chez soi ne se lèverait jamais), mais les segments sont marqués `excluded` : jamais exportés en image ou en balade, toujours recouverts dans un partage.
- On ne propose jamais de zone automatiquement à partir des données (ce serait détecter le domicile). On peut seulement suggérer l'option une fois, au premier passage dans « Mes traces ».

### Permissions

- La feature fonctionne avec « seulement pendant l'utilisation ». On ne pousse pas vers « toujours ». Texte honnête dans les réglages : « Avec l'accès pendant l'utilisation, Détour ne voit ton chemin que quand l'app est ouverte. »
- Reconnaissance d'activité facultative. Texte de demande : « Détour peut savoir si tu marches, pédales ou prends le tram, pour ne pas lever le brouillard par erreur. Rien ne quitte ton téléphone. » Refuser ne bloque rien.

### Sécurité physique et abus

- Un rayon plus large réduit l'envie d'aller au fond des impasses, des cours d'immeuble ou des terrains clôturés pour « finir » un trou. C'est un argument pour la feature.
- Aucune récompense, aucun pourcentage, aucun badge qui compte les zones non accessibles.
- Aucune interaction demandée en mouvement. Rien n'incite à regarder l'écran à vélo.
- Pas de notification de type « il te reste un trou à côté » la nuit ou dans un lieu isolé. Cette feature n'ajoute aucune notification.

### Batterie

- Un couloir de 120 m n'a pas besoin d'un point tous les 5 m. Filtre de distance proposé : 15 m à pied, 30 m à vélo. Précision demandée « équilibrée » tant qu'elle reste meilleure que 35 m.
- En mode transport, l'échantillonnage descend fortement (on n'esquisse rien).
- En immobilité, on suspend les mises à jour jusqu'au prochain déplacement significatif.
- En mode économie d'énergie du système, on accepte des points plus espacés (jusqu'à 90 s, R3).
- Le recalcul rétroactif se fait par lots, en premier plan quand l'app est ouverte, ou quand le téléphone charge.
- Objectif à mesurer : pas plus de consommation qu'avec le suivi actuel. Voir Tests.

### Suppression de compte et RGPD

- La zone découverte n'est pas liée au compte. Supprimer le compte ne supprime pas la carte locale. L'écran de suppression de compte le dit : « Ta carte et ton carnet restent sur ce téléphone. Pour les effacer, va dans Moi > Réglages > Mes traces. »
- Traitement entièrement local : pas de donnée serveur pour cette feature, donc pas de durée de conservation serveur à gérer.
- Phase 0 : les testeurs qui envoient un export de mesure le font volontairement, après consentement écrit. Fichiers supprimés à la fin du test, date annoncée à l'avance.

## Edge cases

1. **GPS imprécis en ville (précision 40 à 80 m entre les immeubles).** Points rejetés au-delà de 35 m. Si plus aucun point n'est valide pendant plus de 90 s, rupture de segment. Le couloir reprend dès que la précision revient. Pas de couloir dessiné au hasard.
2. **Saut de position (un point à 400 m puis retour).** Vitesse implicite au-dessus de 50 km/h en mode pied : point rejeté. Le retour est relié au dernier point valide. Aucune pointe dans le couloir.
3. **Dérive lente (le point glisse de 20 m en restant immobile).** Règle d'immobilité : position figée tant qu'on reste dans le cercle de précision. Pas d'étoile.
4. **Tunnel routier ou piéton.** Pas de point pendant la traversée. Si moins de 90 s et 250 m, les deux bouts sont reliés (on est passé par là). Sinon, rupture.
5. **Métro (Kamppi vers Kalasatama).** Pas de point sous terre, ou points en transport. À la sortie, la position est à 4 km : rupture de segment, aucune ligne tracée entre les stations. L'esquisse reprend quand on marche en surface.
6. **Avion ou train longue distance.** Vitesse > 25 km/h ou absence de points : rien n'est esquissé. À l'arrivée hors d'Helsinki, l'app esquisse ce qu'on marche, mais la carte ne montre qu'Helsinki pour l'instant. Proposition : on enregistre quand même les segments (pour plus tard), sans les afficher. Question ouverte Q11.
7. **Tram à 15 km/h (même vitesse qu'un vélo).** Avec reconnaissance d'activité : mode transport, rien. Sans : la signature d'arrêts réguliers met le mode à inconnu, rien. Risque restant : un tram sans arrêt sur une longue portion. Accepté en phase A, mesuré au test terrain.
8. **Voiture dans les bouchons à 8 km/h.** Avec reconnaissance d'activité : transport. Sans : risque d'être classé vélo. Coefficient vélo 0,75 limite le dégât. Mesuré au test terrain.
9. **Ferry pour Suomenlinna.** Position sur l'eau et vitesse > 7 km/h : transport, rien. Arrivé sur l'île, on marche, l'esquisse reprend.
10. **Vélo rapide (28 km/h sur la Baana).** Classé transport par la vitesse sauf si la reconnaissance d'activité dit vélo avec confiance haute. Sans permission, un cycliste rapide perd son couloir. Documenté dans l'aide : « En vélo rapide, autorise la détection d'activité pour garder ta lanterne. »
11. **Immobile longtemps (café de 2 h, journée au bureau).** Un seul point figé. Le disque autour de ce point est esquissé une fois. Rien ne s'accumule, rien ne grossit.
12. **Ligne droite longue (Mannerheimintie).** Couloir régulier de 2 × 120 m. Correct.
13. **Zigzag dans un quadrillage serré (Kallio).** Les couloirs se chevauchent et forment une grande tache continue. Union, pas de double comptage. Correct et voulu.
14. **Aller-retour sur la même rue.** Union. Rien de plus. Pas de surbrillance.
15. **Chevauchement d'un couloir et d'un disque lieu.** Niveau le plus haut gagne : couleur dans le disque, esquisse autour.
16. **Permission « seulement pendant l'utilisation » et app fermée pendant la balade.** Aucune esquisse pour la balade. À l'ouverture, rien ne se rattrape. Pas de reproche. L'aide dit pourquoi.
17. **App passée en arrière-plan quelques secondes (photo, message).** Selon l'OS, la session « pendant l'utilisation » peut continuer brièvement. Les points reçus sont gardés. Une coupure de plus de 90 s crée une rupture.
18. **Mode économie d'énergie du système.** Points plus espacés. Tant que l'écart reste sous 90 s et 250 m, le couloir est continu. Au-delà, ruptures. Pas de message.
19. **Changement de portée en pleine balade.** Les nouveaux points prennent la nouvelle valeur tout de suite. Le recalcul de l'historique démarre en arrière-plan. La balade en cours est recalculée avec le reste, donc elle finit à la même largeur partout.
20. **Recalcul interrompu (app tuée, téléphone éteint).** Reprise au prochain lancement depuis le curseur `fog_recompute_pending`. Pendant ce temps, les tuiles pas encore recalculées gardent l'ancien dessin.
21. **Baisse de portée puis hausse rapide.** Le second recalcul annule le premier. Seule la dernière valeur compte.
22. **Historique effacé puis changement de portée.** Le curseur ne s'applique qu'aux trajets futurs (R6). Le texte l'explique.
23. **Migration sans anciens points.** Tampon autour de l'ancienne géométrie (R7). Rien ne repasse sous le brouillard.
24. **Migration avec un historique énorme (2 ans de marche).** Migration en tâche de fond, par lots, à l'ouverture. La carte reste utilisable. L'étiquette « Carte en cours de redessin » s'affiche.
25. **Zones d'eau (bord de mer, Töölönlahti).** Le couloir s'étend sur l'eau comme sur la terre. L'eau apparaît en esquisse (contour `ink`), en couleur `postal` seulement dans un disque lieu. Pas de règle spéciale.
26. **Propriété privée, zone militaire, chantier clos.** L'esquisse peut couvrir ces zones vues depuis la rue (c'est seulement un dessin de carte). Aucune récompense ne pousse à y entrer. Aucun lieu n'est proposé à l'intérieur.
27. **Domicile.** Pas révélé tout de suite, pas détecté. Il se découvre naturellement à la première sortie. L'utilisateur peut poser une zone privée (phase B).
28. **Premier lancement, permission accordée chez soi.** Le premier point esquisse un disque autour de chez soi. C'est attendu. Pas d'animation spéciale.
29. **Énorme zone découverte (des milliers de tuiles).** Seules les tuiles visibles sont chargées. Aux petits zooms, tuiles réduites en cache. Objectifs dans Tests (performance).
30. **Trou d'esquisse entre deux couloirs proches (rue parallèle à 260 m).** Une bande de brouillard reste. C'est voulu : on ne remplit pas ce qu'on n'a pas approché. Le test terrain dira si c'est frustrant.
31. **GPS simulé (application de fausse position).** Points ignorés (R8). Rien ne se lève, pas de message.
32. **GPS simulé non détecté (téléphone modifié).** Les règles de saut et de vitesse limitent la téléportation. Une marche simulée réaliste reste possible. Accepté : l'enjeu est faible tant que le brouillard n'est pas partagé.
33. **Horloge du téléphone modifiée.** Les horodatages de segment peuvent être faux. Pas d'impact sur le brouillard, seulement sur le rattachement au voyage. Pas de traitement spécial.
34. **Stockage plein.** L'écriture d'une tuile échoue : les segments sont gardés en priorité (petits), les tuiles seront régénérées plus tard. Pas de crash.
35. **Mode sombre.** Les trois textures existent en clair et en sombre, contraste vérifié.
36. **Réduire les animations.** Fondu de l'esquisse, ouverture du disque et aperçu du curseur sautent à l'état final.
37. **Lecteur d'écran sur la carte.** La carte annonce un résumé : « Carte d'Helsinki. Tu as éclairé des rues autour de 3 balades et photographié 12 lieux. » Pas de description pixel par pixel.

## Tests

### Unitaires

- **Couloir** : un segment droit de 1 km, portée 120 m, mode pied : la zone d'esquisse fait 1 km × 240 m plus deux demi-disques, à 2 pixels près dans le masque.
- **Coefficient vélo** : même segment en vélo : largeur 2 × 90 m.
- **Transport** : segment classé transport : aucun pixel modifié.
- **Plafond** : portée 200 m, densité parc 1,25 : rayon appliqué 200 m, pas 250.
- **Filtre précision** : point à 40 m de précision : rejeté.
- **Saut** : séquence pied avec un point à 400 m en 5 s : point rejeté, pas de pixel autour.
- **Rupture** : deux points à 100 s d'écart : pas de ligne entre eux.
- **Immobilité** : 10 minutes de points dans un cercle de 15 m : un seul point figé, un seul disque.
- **Classement tram** : vitesse 15 km/h avec arrêts de 30 s tous les 400 m, sans reconnaissance d'activité : mode inconnu.
- **Hystérésis** : alternance pied et vélo toutes les 10 s : pas de changement de mode.
- **Union et niveaux** : pixel déjà en couleur puis couloir d'esquisse : reste en couleur.
- **Migration par tampon** : couloir de 30 m autour d'une ligne, puis tampon de 90 m : identique (à 2 pixels près) au couloir de 120 m calculé depuis la ligne.
- **Idempotence** : migration lancée deux fois : même résultat, drapeau de version respecté.
- **Point simulé** : point marqué simulé : ignoré. Avec le drapeau de développement : pris en compte.
- **Contours** : même tuile rendue deux fois : contours identiques.

### Intégration

- Écriture d'une balade de 1 h en base : segments présents, tuiles touchées mises à jour, aucune tuile hors bbox modifiée.
- Changement de portée 120 vers 150 m : recalcul complet, toutes les tuiles passent à la nouvelle version, l'interface reste fluide pendant le recalcul.
- Recalcul interrompu à 40 % (app tuée) : reprise au lancement suivant, résultat final identique à un recalcul sans interruption.
- « Effacer l'historique de trajets » : segments supprimés, tuiles intactes, curseur affiche le texte de R6.
- « Effacer ma carte » : segments et esquisse supprimés, disques des lieux réécrits.
- Validation d'un lieu : disque couleur écrit dans les tuiles concernées, même pendant un recalcul.
- Filtre de voyage actif : le brouillard ne change pas.

### Bout en bout (trajets GPX rejoués sur simulateur)

- Balade à pied de 3 km dans Kallio : couloir continu, aucune pointe, aucune rupture.
- Trajet mixte : marche, tram 3 sur 2 km, marche : deux couloirs séparés, rien le long du tram.
- Métro Kamppi vers Kalasatama : aucune ligne entre les stations.
- Aller-retour ferry Suomenlinna : rien sur l'eau, couloir sur l'île.
- Fausse position Android (application de position fictive) : rien ne se lève.
- Permission « pendant l'utilisation », app fermée pendant la moitié du parcours : seule la moitié ouverte est esquissée.

### Accessibilité

- VoiceOver et TalkBack sur le curseur : valeur lue « Large, 120 mètres », gestes haut et bas changent de cran.
- Cibles de 44 px mesurées sur la poignée, les crans, les boutons des feuilles de confirmation.
- Contraste 4,5:1 des textes sur `paper`, en clair et en sombre.
- Les trois niveaux restent distinguables en niveaux de gris (simulation daltonisme et capture désaturée).
- « Réduire les animations » actif : aucune animation sur la carte et dans l'aperçu.
- Vignettes de l'aide et aperçu du curseur cachés aux lecteurs d'écran.

### Performance

- Carte avec 1 000 tuiles découvertes : premier affichage en moins de 500 ms sur un Android d'entrée de gamme de référence (modèle à choisir), défilement et zoom sans saccade visible (objectif 60 images/s, minimum 50).
- Mise à jour d'une tuile pendant la marche : moins de 16 ms sur le fil d'interface.
- Recalcul complet de 2 ans d'historique simulé : terminé en moins de 2 minutes en tâche de fond, interface toujours réactive.
- Taille de la base pour 50 km² découverts : moins de 5 Mo.
- Batterie : 1 h de marche écran éteint, permission « toujours », comparée à la version actuelle sur le même téléphone et le même parcours. Pas plus de consommation.

### Tests terrain

Voir aussi Q1 (méthode pour trancher la question prioritaire).

- **Parcours 1, centre dense** : Kamppi, Punavuori, Eira. À pied, 45 min.
- **Parcours 2, parc** : Keskuspuisto depuis Pasila. À pied, 45 min.
- **Parcours 3, mixte** : Kallio à pied, tram 3 ou 7 vers Töölö, marche à Töölönlahti.
- **Parcours 4, vélo** : la Baana puis le bord de mer jusqu'à Lauttasaari.
- **Parcours 5, transports** : métro, train de banlieue, ferry Suomenlinna, voiture si possible.

Résultats attendus :

- Parcours 1 à 3 : aucune esquisse le long du tram, du métro, du train ou du ferry.
- Parcours 4 : couloir vélo continu avec reconnaissance d'activité.
- Chaque testeur juge la largeur : « trop étroite », « juste », « trop large ». Objectif : au moins 70 % de « juste » à la portée par défaut.
- Chaque testeur juge si la couleur des lieux « compte encore » face à l'esquisse. Objectif : au moins 70 % de oui.

## Critères d'acceptation

- [ ] La question Q1 est tranchée par la phase 0, avec les valeurs retenues écrites dans cette spec.
- [ ] Le couloir de trajet à pied mesure la portée choisie de chaque côté (120 m par défaut).
- [ ] Le vélo applique 0,75 × la portée, le transport n'esquisse rien.
- [ ] Aucun couloir le long d'un trajet en tram, métro, train, ferry ou voiture sur les parcours terrain.
- [ ] Sauts GPS et dérive à l'arrêt ne produisent ni pointe ni étoile.
- [ ] Le trajet produit une esquisse, seule une photo validée produit la couleur.
- [ ] Les trois niveaux se distinguent par la texture, pas seulement par la couleur.
- [ ] Le token d'esquisse vient de `tokens.ts`, en clair et en sombre, sans nouveau gris.
- [ ] Le curseur « Portée de la lanterne » a 5 crans, libellé visible, cible de 44 px, lecture correcte au lecteur d'écran.
- [ ] Baisser la portée demande une confirmation, la hausser non.
- [ ] Changer la portée recalcule l'historique sans bloquer l'app et reprend après une interruption.
- [ ] La migration ne fait repasser aucune zone sous le brouillard et ne tourne qu'une fois.
- [ ] Les positions simulées ne lèvent rien et aucun message n'accuse l'utilisateur.
- [ ] Segments et tuiles restent sur l'appareil, rien n'est envoyé à Supabase.
- [ ] La phrase sur le stockage local est vraie, sauvegardes système comprises.
- [ ] « Effacer l'historique de trajets » et « Effacer ma carte » font exactement ce que dit leur texte.
- [ ] La feature fonctionne avec la permission « pendant l'utilisation » et ne pousse pas vers « toujours ».
- [ ] 1 000 tuiles s'affichent en moins de 500 ms et défilent sans saccade sur le téléphone de référence.
- [ ] Consommation batterie pas supérieure à la version actuelle sur le parcours de mesure.
- [ ] « Réduire les animations » coupe toutes les animations ajoutées.
- [ ] Aucune animation ajoutée ne dépasse 450 ms ni ne rebondit.

## Hypothèses à vérifier

Je n'ai pas accès au code. Tout ce qui suit dépend de l'existant.

1. **Stockage actuel du trajet** : points bruts gardés ou seulement une géométrie déjà calculée ? Cela décide entre recalcul complet et migration par tampon (R7).
2. **Rayon actuel** du couloir de trajet et du trou autour d'un lieu. La spec dit « quelques dizaines de mètres » pour le trajet, sans valeur exacte.
3. **Forme des trous actuels** : vrai tampon autour du trajet, ou forme déjà irrégulière ? Si irrégulière, la migration par tampon est une approximation.
4. **Base locale** : SQLite (par exemple expo-sqlite) ou autre ? Le modèle proposé suppose une base relationnelle locale avec des blobs.
5. **Bibliothèque de carte** (MapLibre, Mapbox, react-native-maps, autre) et capacité à afficher une couche raster générée localement, ou un masque, à 60 images/s.
6. **Génération du brouillard hachuré actuel** : shader, image, couche vectorielle ? Le masque en tuiles doit s'y brancher.
7. **Suivi en arrière-plan** : expo-location avec TaskManager ? Quel filtre de distance et quelle précision aujourd'hui ?
8. **Détection de position simulée** : le champ Android (« mocked ») est-il bien remonté par la bibliothèque utilisée ? La valeur iOS équivalente est-elle accessible depuis Expo, ou faut-il un module natif ?
9. **Reconnaissance d'activité** : disponible dans le projet, ou faut-il un module natif ?
10. **Données hors ligne** : l'app embarque-t-elle déjà des données d'eau et d'occupation du sol pour Helsinki ? Sinon, il faut un petit fichier dérivé d'OpenStreetMap, avec mention de la licence ODbL.
11. **Sauvegardes système** : la base locale et les photos sont-elles incluses dans les sauvegardes iCloud ou Google aujourd'hui ?
12. **Mode économie de batterie propre à l'app** : existe-t-il déjà ? Si oui, il doit appliquer les mêmes règles que le mode du système.
13. **Rattachement au voyage** : le suivi actuel connaît-il le voyage en cours, pour remplir `trip_id` ?
14. **Tokens** : y a-t-il déjà une variante de `fog` utilisable pour l'esquisse, ou faut-il l'ajouter ?

## Questions ouvertes

**Q1 (prioritaire). D'où vient le problème, et de combien agrandir ?**

Trois causes possibles : couloir de trajet trop étroit, trous autour des lieux trop petits, ou les deux. On tranche avant de figer les valeurs.

Méthode proposée, une à deux semaines :

1. **Demander à l'utilisateur qui s'est plaint** une capture de sa carte après une balade et ce qu'il s'attendait à voir. Cinq minutes, souvent suffisant pour orienter.
2. **Build de test** (non publié) avec un panneau caché : rayon trajet 30, 60, 100, 150 m et rayon lieu 75, 100, 150, 200 m, modifiables en direct sur la même balade enregistrée. Le recalcul depuis les segments rend ça possible sans refaire la balade.
3. **Mesure locale**, sur l'appareil, sans envoi automatique : pour chaque balade, part de la surface découverte venant du trajet et part venant des lieux ; nombre de rues situées à moins de 100 m du chemin et visibles. Le testeur peut exporter ces chiffres et les envoyer volontairement.
4. **Test terrain** : 6 à 8 testeurs, parcours 1 à 3 (voir Tests). Après chaque parcours, on montre la même balade à 3 réglages, ordre au hasard, et on demande : « Laquelle ressemble le plus à ce que tu as vu ? » puis « Le trajet ou les lieux te paraissent-ils trop petits ? ».
5. **Règle de décision** :
   - si au moins 60 % pointent le trajet : on agrandit le couloir, valeur par défaut = le réglage le plus choisi, arrondi au cran du curseur ;
   - si au moins 60 % pointent les lieux : on agrandit le rayon lieu, le couloir passe en phase B ;
   - si c'est partagé : on fait les deux, avec les valeurs les plus choisies ;
   - dans tous les cas, on vérifie que la couleur « compte encore » (objectif 70 %) avant de fixer un couloir large.

**Q2.** Rayon final du disque couleur autour d'un lieu. Proposition de départ : 150 m. À fixer par Q1.

**Q3.** Faut-il vraiment permettre une baisse rétroactive de la portée ? Alternative : la baisse ne s'applique qu'aux trajets futurs, ce qui évite de « perdre » de la carte mais rend le résultat moins lisible.

**Q4.** Sans reconnaissance d'activité, comment ne pas pénaliser les cyclistes tout en évitant le tram ? Option : un réglage « Je me déplace souvent à vélo » qui assouplit la règle 7 à 25 km/h. Ajoute une option de plus.

**Q5.** Les trajets en transport doivent-ils esquisser quelque chose, par exemple un petit disque autour des stations où l'on descend ? Proposition : non, la marche après la descente suffit.

**Q6.** Le filtre de voyage doit-il un jour montrer seulement l'esquisse d'un voyage ? La règle « un seul brouillard » dit non pour l'instant. Les segments portent déjà `trip_id` pour garder la porte ouverte.

**Q7.** Combien de temps garder les segments ? Pour toujours (recalcul toujours possible) ou compaction après un an (moins de données sensibles, recalcul impossible pour les vieilles zones) ?

**Q8.** Faut-il un chiffrement applicatif de la base locale en plus de la protection du système ?

**Q9.** Faut-il combler les petites bandes de brouillard entre deux couloirs très proches (edge case 30) ? Proposition : non, à revoir après le test terrain.

**Q10.** La densité (phase C) vaut-elle sa complexité et le poids des données d'occupation du sol ? À décider seulement si le test terrain montre un écart net entre parc et centre.

**Q11.** Hors d'Helsinki : on enregistre les segments sans les afficher, ou on n'enregistre rien tant que la ville n'est pas ouverte ? Enregistrer garde des données de déplacement inutiles pour l'instant.

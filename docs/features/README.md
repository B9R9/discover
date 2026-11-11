# Détour : features possibles

Liste de brainstorming du 7 nov 2026. Les idées non décidées sont une réserve à trier. Les décisions prises sont dans la section « Décisions ». Les écrans et le style restent dans `docs/design.md`.

## Specs détaillées

Chaque spec a ses règles, sa safety, ses edge cases et ses tests.

- [Voyage : démarrer et arrêter](voyage-demarrer-arreter.md)
- [Filtres de la carte](filtres-carte.md)
- [Pins photo sur la carte](pins-photo-carte.md)
- [Zone découverte](zone-decouverte.md)
- [Import depuis la galerie](import-galerie.md)
- [Balades audio](balades-audio.md)
- [Partager un voyage dans le Cercle](partage-voyage-cercle.md) et [la suite](partage-voyage-cercle-suite.md)

## Décisions

- Un lieu se découvre une seule fois, sur la carte principale. Il n'est jamais redécouvert à chaque voyage (ce serait répétitif pour rien). Il reste rattaché au voyage pendant lequel il a été découvert, ou à aucun.
- Le suivi du trajet est déjà en place, et tout reste local sur l'appareil. On le dit clairement à l'utilisateur. Il doit marcher tout seul, sans action de sa part (pas besoin de lancer un enregistrement à la main).
- Ordre de mise en place des carnets de voyage : voir « Phasage » plus bas.
- Balades audio : les audios sont stockés dans Supabase Storage, et tout le monde peut enregistrer sur ses balades dès le départ. Modération par les signalements d'abus déjà prévus.

## 1. Carnets de voyage

### Modèle
- Une seule carte principale, un seul brouillard. Tout se découvre sur la carte principale.
- Un voyage est un filtre sur la carte principale : en le choisissant, la carte n'affiche que ses pins, ses trajets, et le brouillard levé autour de ses lieux.
- Filtre à choix multiple : un voyage, plusieurs, ou tous (c'est le mode superposé).
- Supprimer un voyage ne supprime pas les lieux ni leur brouillard : ils reviennent dans le carnet principal.
- Si l'utilisateur repasse dans un lieu déjà découvert pendant un autre voyage, rien n'est à revalider. Piste à étudier : l'afficher comme « déjà vu » et laisser ajouter une photo ou une note à la page du voyage en cours.

### Commencer et arrêter un voyage
- Bouton « Commencer un voyage » : on donne un nom, la date de début est automatique. Tout ce qui est découvert ensuite se rattache au voyage actif, et le trajet suivi automatiquement lui est associé.
- Bandeau discret type tampon « EN VOYAGE » avec le nom, et le bouton devient « Arrêter ».
- À l'arrêt : petit bilan (lieux, kilomètres, durée), choix de la couverture, ajout de photos oubliées depuis la galerie.
- Création après coup d'un voyage passé à partir d'une plage de dates.
- Bouton secondaire (contour `ink`), à placer dans Moi ou en haut de la carte. L'action principale de la carte reste le bouton photo.

### Galerie
- Choisir un album ou une plage de dates, l'app range les photos dans le carnet.
- Le GPS et la date des photos (EXIF) servent à les placer sur la carte et à proposer des lieux à valider après coup.
- Les photos restent sur l'appareil par défaut. Seules celles partagées dans le Cercle vont dans Supabase Storage. Sur iOS, l'accès limité à certaines photos suffit.

### Partage
- Partager un voyage dans le Cercle, en entier ou page par page.

### Phasage
1. Démarrer et arrêter un voyage, rattachement automatique des lieux et du trajet, filtre sur la carte, pins photo (section 2).
2. Import depuis la galerie, création d'un voyage après coup, bilan de fin de voyage, couverture.
3. Partage d'un voyage dans le Cercle.

## 2. Pins photo sur la carte
- Un lieu validé devient un mini polaroïd épinglé (petit, légèrement incliné). Il s'ouvre sur la fiche au toucher.
- Au dézoom, les pins proches se regroupent en pile avec un chiffre.
- Remplace le repère numéroté de la charte : `docs/design.md` à adapter, avec une version lisible à petite taille.
- En mode superposé, un pin se distingue par une initiale ou un symbole du voyage, pas seulement par la couleur.

## 3. Zone découverte et affichage de la carte

### Zone découverte trop petite
Constat : quand on se déplace, la zone qui se lève autour de soi est trop petite. À trancher : est-ce le trajet, les trous autour des lieux validés, ou les deux ? Et quel ordre de grandeur (rayon doublé, par exemple) ?
- Rayon plus large de chaque côté du trajet (100 à 150 m au lieu de quelques dizaines de mètres).
- Rayon selon le mode de déplacement : plus large à vélo ou en transport qu'à pied.
- Rayon selon la densité : plus large dans un parc ou un quartier calme, plus serré en plein centre.
- Deux niveaux de découverte : le trajet lève un brouillard léger (on voit les rues), seule la validation d'un lieu par photo colore la zone à fond. Garde l'idée que les photos comptent.
- Réglage utilisateur : curseur « portée de la lanterne » dans les réglages, avec une valeur par défaut plus généreuse.

### Couleur par jour
- Différencier les jours sur la carte par des couleurs différentes (trajets et pins).
- C'est un cas du système de filtre d'affichage de la carte : même mécanisme que le filtre par voyage, avec un critère « jour » en plus. Un seul panneau de filtres pour tout : voyage, jour, période.
- Règle d'accessibilité : la couleur ne porte jamais seule l'information. Ajouter la date ou une initiale du jour sur le pin ou le trajet.
- Palette à rester dans la charte (`stamp`, `postal`, `sage`, `lantern`), pas de nouvelle couleur sans l'ajouter à `docs/design.md`.
- Deux modes possibles : un dégradé de la plus ancienne à la plus récente (du plus pâle au plus marqué), ou une couleur distincte par jour sur une courte période (une semaine).

## 4. Exploration
- Défi du jour : un petit lieu à valider dans les 20 min à pied.
- Détour aléatoire : « emmène-moi quelque part que je ne connais pas ».
- Thèmes de balade : vieux murs, street art, café, nature, histoire.
- Zones presque révélées (il manque un lieu).
- Mode « pas de carte » : une boussole et une phrase manuscrite.

## 5. Carnet personnel
- Note manuscrite ou vocale sur un polaroïd.
- Pages par saison ou par mois, avec un bilan.
- Export du carnet en PDF ou en album à imprimer.
- Collections : « mes cafés », « mes coins calmes ».
- Statistiques douces : km marchés, % d'Helsinki révélé.

## 6. Tampons et progression
- Tampons spéciaux (météo, heure, lieu rare).
- Séries (3 jours de suite), sans pression ni classement.
- Pages de quartier à compléter façon album.

## 7. Social (Cercle)
- Suivre un voyageur dont on aime les balades.
- Mots doux laissés sur un lieu pour les autres passants.
- Balade à deux : deux carnets qui révèlent la même carte.
- Superposer la carte d'un ami à la sienne.
- Sauvegarder la balade de quelqu'un et la marquer « faite ».
- Commentaires courts sous une balade.

### Balades audio (description pour tous, pensée d'abord pour les personnes aveugles)
- Pendant sa balade, la personne enregistre de courts extraits audio (10 à 30 s) accrochés à l'endroit où elle se trouve. Celui qui suit la balade les entend en arrivant au même endroit, comme un audio guide.
- Consigne pour celui qui décrit : pas seulement ce qu'on voit, mais les sons, les odeurs, le sol, les pentes, les escaliers, les traversées, les obstacles, les repères qu'on peut sentir ou entendre (fontaine, rue animée, bord de quai).
- Transcription automatique de chaque extrait, pour les lecteurs d'écran et pour les personnes sourdes ou qui préfèrent lire.
- Mode « balade audio » qui marche sans regarder l'écran : écran simple, VoiceOver et TalkBack complets, consignes de direction parlées. L'app est très visuelle (carte, brouillard, polaroïds), il faut donc une vraie alternative.
- Informations de sécurité en priorité : traversées, travaux, trottoirs étroits. Tag « accessible » ou « sans escaliers » sur une balade, et moyen de signaler un obstacle.
- Stockage des audios dans Supabase Storage, comme les photos partagées. Signalements d'abus pour la modération.
- À tester avec des personnes aveugles avant de figer le détail (par exemple via une association de personnes malvoyantes à Helsinki).
- Question ouverte : un audio hors-ligne, pour les suiveurs sans réseau pendant la balade.

## 8. Sorties
- Ajouter une sortie au calendrier.
- Rappel « ça commence dans 1h, 8 min à pied ».
- Proposer ses propres sorties (marché, atelier).
- Filtre météo : sorties couvertes quand il pleut.

## 9. Pratique
- Mode hors-ligne pour la carte et le carnet.
- Widget écran d'accueil : prochain détour proposé.
- Notification douce quand on passe près d'un lieu non validé.
- Version tablette ou web légère pour consulter son carnet.
- Accessibilité : balades audio (voir section 7).

## 10. Plus tard
- Autres villes (pour le moment, uniquement Helsinki).
- Partenariats avec des lieux locaux (tampon officiel d'un café).
- Mode famille ou enfants.

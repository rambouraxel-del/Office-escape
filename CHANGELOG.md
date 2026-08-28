# Journal des versions

## V0.12 — Cohérence visuelle et diète d'assets

Deux problèmes tenaient ensemble : les niveaux mélangeaient des assets fournis
récents avec des props générés d'une autre époque, et la liste de ce qu'il
restait à faire dessiner ne cessait de grossir. La réponse est la même pour les
deux : **moins de variété, plus de réutilisation.**

> Ce qui distingue deux niveaux, c'est le thème, le sol, les murs et deux ou
> trois props signature — pas vingt-cinq objets uniques.

**Le vocabulaire fond de moitié, puis des deux tiers**
- `ObstacleKind` : 14 → **9**. Disparaissent `reception`, `bench`, `lockers`,
  `server`, `shelf`, `glass`… Apparaît `car` : au parking, le rectangle EST la
  voiture, et non plus une armoire posée sur du bitume.
- `PropKind` : 53 → **17**. Sept fournis, sept props signature (un par FONCTION
  de pièce), trois de signalétique. `deskProps` — les accessoires épars posés
  sur les bureaux — n'existe plus : le poste de travail fourni les porte déjà.
- Une quarantaine de sprites générés supprimés du dépôt (cadres, vases,
  trophées, téléphone, lampe, micro-ondes, frigo, fontaine, vélo, pneus,
  caisses, cartons, cactus, chariot, tourniquet, serpillière…) : `props.mjs`
  passe de 1 151 à 510 lignes, et `public/assets/props/` de 65 à 23 PNG.
- Trois motifs de sol orphelins retirés (`tile-glass`, `tile-locker`,
  `tile-server` : 26 → 23), et quatre planches de décor animé qui ne servaient
  plus (écran, imprimante, fontaine, machine à café).

**Niveau 1 — l'open space se lit à la répétition**
- Les six bureaux du jeu étaient en portrait (90 × 105) : ils auraient exigé
  une planche de poste de travail dédiée. Ils passent en **paysage
  (116 × 78)**, le format du poste FOURNI. C'est le seul déplacement de
  rectangle de la version, et il supprime un asset de la liste.
- L'accueil, le coin pause et les sanitaires se disent maintenant par leur SOL
  plus un prop signature : dallage + deux postes, carrelage cuisine +
  distributeur, faïence + cuvettes et lavabo.

**Niveau 2 — le même mobilier, d'autres matières**
- Mêmes postes, mêmes chaises qu'au niveau 1. Ce qui change d'étage, ce sont le
  marbre, le laiton, le tapis de couloir, les caméras et le lecteur de badge.
- La ronde du stagiaire a été resserrée sur le tapis central : les bureaux
  élargis touchaient sa boucle, et un segment de ronde cessait d'être
  franchissable en ligne droite. Le test de navigabilité l'a vu tout de suite.

**Niveau 3 — des voitures, du béton, des néons**
- Les blocs des places sont des `car`. Tout le bric-à-brac (vélo, pneus,
  caisses, cartons, cactus, chariot, barrières) a disparu : dans la pénombre,
  il n'ajoutait que du bruit.
- Restent l'allée centrale, les piliers, les places peintes, quatre néons,
  trois plots et le local technique.

**Trois zones de sol qui débordaient dans un mur** ont été recadrées (coin
pause du niveau 1, local technique et coin détente du niveau 2, local technique
du niveau 3).

**La liste d'assets restants passe de 6 fiches à 13, mais elle a changé de
nature** : on ne demande plus des variantes de mobilier, on demande les
matières et les objets qui portent le jeu. Priorité haute : les trois murs
raccordables vus de dessus, le collègue bavard, la voiture, la caméra. Quatre
fiches ont été supprimées sans rien dessiner — réceptionniste, stagiaire, agent
d'entretien et poste de travail portrait — en réécrivant les niveaux autour de
ce qui existe déjà.

## V0.11.1 — Intégration des assets fournis

Première version où les visuels du jeu viennent d'assets **livrés**, et non du
générateur maison. Le lot « STRICTEMENT VALIDÉS » (37 PNG) est entré dans le
dépôt comme source de vérité ; 23 textures en sont issues.

**Une chaîne de transport, pas de dessin**
- `assets-source/v011/` contient les PNG fournis tels quels, empreintes
  comprises. `tools/assets/import.mjs` les transporte vers `public/assets/`.
- Cet outil ne sait faire que quatre choses : découper une planche,
  recomposer les frames dans la disposition du moteur, réduire d'un facteur
  entier par décimation, écrire le fichier. **Il ne contient aucune primitive
  de dessin.**
- `tests/supplied.test.ts` le vérifie plutôt que de le promettre : empreinte
  SHA-256 de chaque source, et comparaison **pixel par pixel** de chaque motif
  livré avec son fichier d'origine. Une couleur retouchée fait échouer la
  suite.
- `npm run art` déroule le générateur puis le transport : un asset fourni
  écrase toujours un asset généré.

**Personnages — les six planches fournies remplacent tout**
- Les planches livrées sont en 6 colonnes × 3 lignes de 128 px (colonnes 0-1
  face, 2-3 dos, 4-5 profil vers la droite). Le moteur attend 8 × 3 (repos,
  marche, sursaut). L'import **range** les frames dans cette disposition :
  aucune n'est redessinée, aucune n'est inventée.
- Le gabarit de frame reste 64 × 64 après décimation : `Body.setCircle()`
  n'a pas bougé d'un pixel, et aucune collision n'a changé.
- Le générateur de personnages ne produit plus de planches de jeu. Il reste
  employé par le diorama de l'accueil et les vignettes du menu.

**Décors — 10 sols, 7 meubles et accessoires**
- Sols fournis pour : moquette bleue, moquette grise, béton, sol sombre,
  carrelage de cuisine, dallage clair, pavage, carrelage sanitaire, sol
  technique, parquet. Ils remplacent les motifs générés de même rôle.
- Le poste de travail complet (écran, clavier, tasse, parapheur) remplace les
  accessoires épars sur les six bureaux dont le rectangle est en paysage.
- Chaise de bureau, écran, boîte à archives, agrafeuse, tasse et bloc de notes
  fournis remplacent leurs équivalents générés.

**Échelle**
- Les planches sont dessinées pour un monde deux fois plus grand que celui des
  niveaux : le bureau fourni fait 240 px de large, le rectangle de collision
  d'un bureau du niveau 1 en fait 110. Tout est donc transporté à **1/2**, par
  décimation — un pixel sur deux, aucune moyenne, aucun flou.
- L'autre issue aurait été de doubler toutes les coordonnées des trois
  niveaux : cela aurait cassé le level design, les vitesses, les portées de
  vision et tout l'équilibrage. **Aucune coordonnée de niveau n'a changé.**
- Échelle de référence : le joueur fait 32 × 58 unités de monde. Un bureau fait
  deux joueurs de large, une chaise un joueur et demi de haut.

**Ce qui manque est marqué, pas imité**
- `ASSET_TODO: nom` dans le code, fiche complète dans
  `tools/assets/wanted.mjs`, et `npm run assets:report` recoupe les deux — un
  tag sans fiche fait échouer le rapport.
- Six fiches ouvertes : stagiaire, collègue bavard, réceptionniste, agent
  d'entretien, mur raccordable vu de dessus, poste de travail portrait.
- **Les 14 murs fournis ne sont pas intégrés** : ce sont des segments
  d'élévation d'un jeu de tuiles (courses, angles, T, embout), alors que le
  moteur habille des rectangles de taille arbitraire en étirant un motif. Les
  brancher demanderait un auto-tuilage, donc un changement de format de
  niveau. Les murs générés restent en place, et la fiche décrit précisément le
  motif raccordable qui les remplacerait.

**Contrôle mobile**
- Nouveau `npm run mobile` : cinq formats portrait, de l'iPhone SE (320) à
  l'iPad mini (744). Il vérifie qu'aucun bord du canvas ne sort de la fenêtre,
  qu'aucun débordement horizontal n'apparaît, que le rapport d'image 390 × 844
  est conservé — sans quoi les zones tactiles ne tombent plus où on les voit —
  et qu'aucune erreur ne remonte.

**Vérifications**
- 348 tests, lint, typage, build, budget, test de fumée (trois niveaux, défi
  du jour, huit bascules de réglages) et contrôle mobile : tous verts.
- 123 PNG livrés, 1,1 Mo. Aucun asset orphelin, aucune référence manquante.

## V0.11 — Grande passe graphique

Montée en gamme visuelle des trois niveaux, à partir des planches d'assets
fournies. **Aucune règle de jeu ne change** : aucune vitesse, aucun cône,
aucune détection, aucun score, aucune ronde, et surtout **aucun rectangle de
collision n'a bougé**.

**Sur les planches fournies — ce qui a été fait, et pourquoi**

Les cinq planches livrées sont des illustrations de style pixel art, pas des
spritesheets : 29 000 couleurs sur une seule zone, aucune grille de découpe,
des perspectives mélangées (mobilier vu de dessus, murs et portes en
élévation), et un anticrénelage sur chaque contour. Elles ne peuvent donc pas
être découpées ni intégrées telles quelles — elles casseraient la palette
unique, le rendu NEAREST et la règle d'échelle du projet, et jureraient avec
tout le reste.

Elles ont donc servi de **cahier des charges visuel** : chaque objet, chaque
matière, chaque rôle et chaque type de pièce qu'elles montrent a été redessiné
à la résolution du jeu, dans la palette du jeu, par le générateur du jeu. Le
catalogue est respecté ; c'est la technique de production qui reste celle du
projet.

**Matières — 9 sols et surfaces de plus**
- Moquette bleue et moquette grise, dallage clair de hall, carrelage de
  cuisine, pavage extérieur, sol technique caoutchouc, verre de cloison,
  façade de casiers, façade de baie serveur.
- Deux nouveaux motifs génériques dans le générateur : `slabs()` (dalles à
  joints, dont l'écart donne l'échelle de la pièce) et `paving()` (dalles
  décalées d'une rangée sur deux — sans le décalage, on lit une grille).

**Mobilier — 7 natures d'obstacle de plus**
- `bench` (îlot d'open space), `meeting` (table de réunion), `reception`
  (banque d'accueil), `lockers` (vestiaire), `glass` (cloison vitrée),
  `server` (baie informatique), `counter` (plan de kitchenette).
- Chacune est déclinée sur les trois thèmes : bureau, direction, parking.
- `glass` n'est utilisée par aucun niveau livré, et c'est délibéré — voir
  l'exception documentée dans la bible graphique.

**Accessoires — 22 de plus**
- Canapé, table basse en verre, tableau blanc, panneau de liège, portemanteau,
  horloge murale, tapis d'entrée, baie de serveurs, distributeur, micro-ondes,
  réfrigérateur, seau de ménage, panneau « sol glissant », bacs de tri,
  ordinateur portable, lecteur de badge, portique de sécurité, garde-corps,
  urinoir, plan de lavabos, classeurs à levier, rubalise.
- Tous vus de DESSUS, comme le reste du jeu.

**Zones — 6 matières de sol de plus**
- `lounge`, `meeting`, `hall`, `kitchen`, `tech`, `outdoor`. Une zone de sol
  suffit désormais à dire de quelle pièce il s'agit.

**Personnages — 4 rôles de plus**
- RH, technicien informatique, réceptionniste, agent d'entretien. Chacun se
  distingue à la silhouette et à l'accessoire, jamais à la seule couleur.
- Un archétype choisit une PLANCHE, jamais un comportement : la ronde, la
  vision et la détection restent entièrement dans la donnée du PNJ.
- Passe de volume sur tous les personnages : arête éclairée sur le haut du
  buste, ombre à la taille. Deux lignes, et le personnage cesse d'être un
  aplat découpé.

**Réhabillage des trois niveaux**
- **Niveau 1** — accueil (tapis, portemanteau, horloge, panneau d'affichage),
  open space en îlots, sanitaires complétés (plan de lavabos, urinoir, seau et
  panneau du ménage), coin pause (distributeur, micro-ondes, frigo, tri),
  archives (classeurs), salle de réunion (tableau blanc, fauteuils), et
  l'alcôve où l'on se cache devient un vrai coin détente.
- **Niveau 2** — hall d'ascenseurs dallé, point de sécurité devant la porte à
  badge (portique, lecteur, rubalise), salle de réunion autour du bloc
  central, local informatique à sol technique, salle de copies équipée, coin
  détente côté direction.
- **Niveau 3** — sas d'ascenseur, local technique sous la rampe, local ménage
  près de l'escalier, zone de livraison condamnée, distributeur près de
  l'ascenseur, et le bloc « ESCALIER » devient un vestiaire.

**Ce qui n'a PAS changé**
- Tous les rectangles de collision, à l'unité près.
- Toutes les rondes, tous les cônes, toutes les vitesses, tous les seuils.
- Le menu, la nuit du niveau 3, le HUD.

**Technique**
- 131 PNG livrés, 532 Ko au total. Le décor supplémentaire est fait de sprites
  statiques : aucun coût par frame.
- Palette étendue de 24 teintes, sans un seul doublon (un test le vérifie).
- 343 tests. Lint, typage, build, budget et smoke verts.

## V0.10.3 — IA lisible, vraie nuit, plus de pression

Trois chantiers : rendre les rondes APPRENABLES, faire de la nuit du parking
une mécanique plutôt qu'une gêne, et resserrer la difficulté. Le menu, la
direction artistique générale et tout le gameplay non cité ne bougent pas.

**Les PNJ suivent à nouveau un circuit prédéfini**
- Abandon du déplacement semi-aléatoire de la V0.10.1. Un PNJ enchaîne les
  points de sa `patrol`, en **ligne droite**, dans l'ordre. La zone `roam`
  disparaît du format de niveau, `ROAM_JITTER` avec elle.
- Pourquoi : un jeu d'infiltration se joue sur ce qu'on peut apprendre. Une
  destination tirée au hasard donnait des PNJ vivants et illisibles — on
  subissait leurs trajectoires au lieu de les jouer.
- Ce qui varie, et rien d'autre, tiré **une seule fois par PNJ** au `Prng` du
  niveau : le sens de départ du circuit, la durée des pauses
  (`PATROL_PAUSE_SECONDS` ± `PATROL_PAUSE_VARIATION`), la vitesse
  (± `PATROL_SPEED_VARIATION`). Le Défi du jour reste reproductible.
- `NavGrid` ne sert plus qu'à quatre choses : la poursuite, la fouille, la
  diversion, et le **retour en ronde** — où l'on rattrape le point de circuit
  le plus proche, pas celui qu'on visait avant l'écart. Rebrousser tout le
  couloir pour revenir à un point déjà dépassé donne un PNJ qui a l'air perdu.
- Nouveau **filet anti-blocage** : un PNJ qui voulait avancer et n'a pas
  parcouru `STUCK_DISTANCE` en `STUCK_SECONDS` jette son chemin et passe par
  la grille. Le pathfinding seul ne suffisait pas — deux PNJ qui se croisent
  dans une porte se poussent hors de leur trajectoire, et aucun des deux n'est
  « contre un mur » au sens de la grille.
- **Quatre rondes corrigées dans les niveaux livrés.** Un nouveau test refuse
  tout segment qui ne soit pas franchissable en ligne droite ; il a trouvé
  quatre circuits qui traversaient un pilier ou rasaient un bureau. Ils
  « marchaient » parce que le pathfinding les contournait, et c'était
  exactement ce qui rendait les trajectoires incompréhensibles.
  - niveau 2 — le boss fait les cent pas devant la porte à badge (son ancienne
    boucle passait à dix unités du pilier central) ; le stagiaire a une boucle
    resserrée entre les deux bureaux ;
  - niveau 3 — le vigile tient la travée centrale sur toute sa longueur (son
    ancien tracé traversait le pilier du milieu) ; le collègue tardif remonte
    la travée de gauche ; l'agent d'entretien contourne le pilier du fond.

**Niveau 3 : une lampe torche, pas un halo**
- Le halo circulaire devient un **faisceau directionnel** qui suit
  l'orientation du joueur. Un halo révélait tout autour de soi : on voyait
  arriver ce qu'on n'avait aucune raison de voir. Un faisceau oriente
  l'attention et fait du fait de REGARDER une décision.
- Le faisceau glisse vers la direction de marche au lieu de se braquer d'un
  coup, et **garde sa direction à l'arrêt** : une lampe qu'on tient ne se
  recentre pas toute seule.
- Une **flaque de lumière** reste aux pieds du joueur : on ne marche jamais
  totalement à l'aveugle.
- Les PNJ, leurs étiquettes, leurs jauges, **leurs cônes de vision**, les
  objets et les indices sont désormais **réellement invisibles** hors lumière
  (`hiddenAlpha` passe de 0,1 à 0). En V0.10.2 un garde restait perceptible et
  son faisceau trahissait sa position : la nuit n'était qu'une gêne.
- Les **lampes fixes révèlent ce qu'elles éclairent** : les flaques de néon
  deviennent autant de zones à surveiller, où l'on voit les gardes et où l'on
  se voit.
- Le décor — sol, murs, voitures, mobilier, structure — reste lisible. Voile
  légèrement renforcé (0,58 → 0,66), un test refuse d'aller au-delà de 0,8.
- Nouveau module PUR `src/systems/Torch.ts` : il répond à « quelle lumière
  reçoit ce point », et rien d'autre. Testable sans navigateur.
- Nouveau sprite `fx-beam`, cuit hors ligne. Son atténuation est **linéaire**,
  pas quadratique : un faisceau qui s'éteint à mi-course révélerait des choses
  dans une zone que le joueur voit noire — le dessin doit dire la vérité sur
  la portée.
- **La détection n'a pas changé d'une virgule.** Un PNJ invisible vous voit
  exactement comme en plein jour, et c'est ce qui rend la nuit tendue.

**Détection**
- La jauge se remplit plus vite, sans toucher aux seuils : ils restent
  lisibles en secondes, et la cadence devient un multiplicateur explicite.
- **PNJ : +10 %** (`NPC_DETECTION_RATE`). Interception en 2,2 s au lieu de 2,4.
- **Caméras : +60 %** (`CAMERA_DETECTION_RATE`). Interception en 1,5 s. Une
  caméra s'observe — angle affiché, balayage régulier, arrêt en bout de
  course : on sait exactement quand passer, et se tromper doit coûter. Le
  balayage, lui, n'a pas bougé : elles restent aussi faciles à lire.
- La course reste pénalisante, et se cumule avec la cadence.

**Le temps passe 1,75× plus vite**
- Une minute de bureau prend désormais **2 857 ms** au lieu de 5 000
  (`MS_PER_GAME_MINUTE`).
- `msPerMinute` devient optionnel dans `LevelDef` et disparaît des trois
  niveaux : la pression du temps est une constante du jeu, pas une propriété
  d'étage — trois copies du même nombre, c'étaient trois occasions de se
  désynchroniser.
- Les seuils d'étoiles, l'heure fatidique et **toutes les pénalités en minutes
  de jeu sont inchangés** : c'est le temps réel disponible qui se resserre.
  Un test vérifie qu'il reste au moins deux minutes réelles par niveau.

**Tests**
- Nouveau `tests/torch.test.ts` : géométrie des angles, atténuation en
  distance et en angle, cône orienté, lampes fixes, et le contrat de nuit des
  niveaux livrés.
- `tests/nav.test.ts` : le test de zone de déplacement laisse place au test de
  ligne droite sur chaque segment de ronde.
- `tests/npc.test.ts` : circuit prédéfini, bouclage, sens de départ, reprise au
  point le plus proche, cadence des caméras.
- `tests/core.test.ts` : cadence de l'horloge et budget réel de chaque niveau.
- 295 tests.

## V0.10.2 — Refonte de l'écran d'accueil

Le menu était fonctionnel et laid : un diorama vu de dessus, à peine visible
sous une carte opaque, et cinq boutons empilés du même poids. Cette version ne
touche à rien d'autre — **aucune règle de jeu, aucun niveau, aucune vitesse,
aucun cône, aucun score n'a changé.**

**Un décor, pas un fond d'écran**
- L'accueil est désormais un open space **vu de face**, au crépuscule : baie
  vitrée sur une ville allumée, soleil couchant, rampe de néons, crédence,
  horloge, affiche, deux rangées de bureaux habités et un premier plan sombre
  qui cadre la composition.
- C'est la **seule dérogation** à la vue de dessus du projet, et elle est
  assumée : une vue de dessus donne un plan, un menu doit donner envie. La
  palette, elle, ne change pas — neuf couleurs de ciel et de ville s'y
  ajoutent, rien de plus.
- Le décor est **une seule image** de 390 × 844 (6 Ko), cuite hors ligne par
  `npm run art`. L'ancien `menu-bg` disparaît.

**Ce qui vit**
- Un collègue tape au clavier, un autre boit son café, un troisième raconte sa
  journée ; deux écrans défilent ; la vapeur monte de la machine ; les
  poussières flottent dans la lumière de la baie ; les néons vacillent.
- **L'horloge murale donne l'heure réelle**, à la seconde près.
- Les habitants sont les **personnages du jeu**, recadrés au buste au-dessus
  du plateau : on reconnaît au menu les gens qu'on va croiser.
- Aucune cadence ne dépasse six images par seconde, et un test le verrouille :
  un menu doit être vivant, pas agité.

**Ouverture**
- Le décor apparaît, vit seul le temps qu'on le remarque
  (`MENU_INTRO_HOLD_MS`), puis le titre et l'interface montent par vagues.
  L'accueil n'accepte aucun clic tant que l'introduction dure.
- **Mouvement réduit** : tout est là d'emblée, sans attente ; on coupe le
  vacillement, les poussières, la vapeur et la pulsation de lumière. Les
  personnages continuent de respirer — le réglage promet la fin des flashs,
  pas un menu mort.

**Ergonomie**
- Le titre se pose sur une **plaque translucide au-dessus de la ville**, plus
  sur le mur : la bande de mur nu est justement l'endroit où vivent l'horloge,
  l'affiche et l'écran de la crédence.
- Une seule cible primaire (**Quitter le bureau**), deux secondaires de même
  poids côte à côte (**Niveaux**, **Défi du jour**), le reste en retrait. La
  carte opaque plein écran de l'accueil laisse place à un panneau bas : le
  décor garde la moitié haute de l'écran.
- Nouvelle ligne d'état : *n/3 niveaux ouverts · Record …*. Elle remplace une
  phrase d'accroche qui répétait le sous-titre.
- Tous les boutons font au moins 44 pixels de haut, y compris les bascules des
  réglages : c'est la taille d'un pouce.
- Les écrans **Niveaux** et **Réglages** gardent leur carte, posée sur le
  décor assombri, avec le bouton retour en pied de page.
- **Aucune fonctionnalité retirée** : jouer, choisir un niveau, défi du jour et
  sa graine, records, huit réglages, remise à zéro, version.

**Technique**
- Nouvelle scène `MenuStage` : elle est à l'accueil ce que `LevelView` est à un
  niveau. La composition (`MENU_STAGE` dans `artTheme.ts`) déclare où se pose
  chaque habitant, l'horloge, les néons, la vapeur et la flaque de lumière ;
  la scène ne place rien d'elle-même.
- Nouvelle profondeur `DEPTH.menuUi` : sans elle, un collègue qui tape à la
  machine passe devant le panneau des réglages.
- `PixelCanvas.shade()` et `PixelCanvas.disc()` : assombrir un décor avec
  `rect(..., alpha)` REMPLAÇAIT les pixels par une couleur semi-transparente —
  c'est ce qui délavait la pièce ; et `circle` ne trace qu'un contour, d'où un
  cadran d'horloge troué.
- Le test de fumée passe désormais **vraiment** par l'écran des niveaux : la
  boucle d'avant cliquait « jouer » et rejouait trois fois le niveau 1. Il
  couvre aussi le défi du jour.
- 281 tests.

## V0.10.1 — Première passe d'optimisation

Passe de confort : rien de neuf à jouer, mais les irritants de la V0.10 sont
levés. Aucun score, aucun dialogue, aucun objet, aucune vitesse du joueur et
aucune règle de victoire n'a bougé — seules les valeurs directement visées
ci-dessous changent.

**Tutoriels**
- Une bulle se ferme de trois façons : au toucher (avec une marge tactile de
  `TUTORIAL_TOUCH_MARGIN`, on la ferme au pouce sans viser), dès que le joueur
  s'est vraiment déplacé quand la consigne le demande (`dismissOnMove` dans la
  donnée du niveau, `TUTORIAL_MOVE_DISMISS` unités parcourues), et toute seule
  au bout de `TUTORIAL_AUTO_DISMISS_MS`.
- Nouveau réglage **Tutoriels**, **activé par défaut**. Coupé, aucune bulle
  n'apparaît ; la progression « tutoriels vus » reste enregistrée comme avant.
- **Correction du débordement de texte** : `makeText` multipliait la largeur
  d'habillage par l'échelle du texte. Une largeur d'habillage est une largeur
  de PANNEAU, en pixels d'écran : elle ne suit pas la taille de police. À 140 %
  la phrase sortait du cadre. Le panneau se dimensionne désormais à partir du
  texte mesuré, à toutes les tailles réglables.

**Nettoyage visuel des niveaux**
- Suppression des étiquettes qui expliquaient le décor au lieu de le laisser
  parler : « TON BUREAU », « ZONE DU BOSS », « COULOIR PRINCIPAL », « ALCÔVE »,
  « DERNIER OBSTACLE », « OBJECTIF • RENTRER CHEZ TOI » au niveau 1 ;
  « VESTIAIRE », « OPEN SPACE », « ZONE SURVEILLÉE », « ACCÈS DIRECTION »,
  « COULOIR DES CADRES » au niveau 2 ; les « VOITURE » du niveau 3. Les
  panneaux qui portent une information de jeu (sortie, ascenseur) restent.
- **Les toilettes du niveau 1 ne s'appellent plus « WC »** : nouveau
  `ObstacleKind: 'restroom'`, carrelage sanitaire `tile-bathroom`, et trois
  accessoires pixel art (`toilet`, `sink`, `stall`) posés en deux cabines
  cloisonnées plus un lavabo. On reconnaît la pièce à ce qu'elle contient. Le
  rectangle de collision, lui, n'a pas bougé d'une unité.

**Déplacement des PNJ**
- Nouveau module PUR `src/systems/NavGrid.ts` : grille de navigation à 25
  unités par cellule, parcours en largeur d'abord puis lissage par ligne de
  vue. Une marge de dégagement `NAV_CLEARANCE` autour de chaque obstacle
  empêche un PNJ de raser un mur — c'est ce frottement qui bloquait les PNJ du
  niveau 3 contre les voitures.
- Chaque PNJ mobile déclare une `roam` (zone de déplacement) dans la donnée du
  niveau. Ses destinations sont tirées dans cette zone, décalées de
  `ROAM_JITTER` autour du point de ronde : la ronde reste apprenable, sans
  être identique à chaque tour.
- Le tirage vient du `Prng` du niveau, pas de `Math.random()` : **le Défi du
  jour reste reproductible.**
- La poursuite recalcule son chemin toutes les `CHASE_REPATH_SECONDS`. Tout
  changement d'état invalide le chemin : après une poursuite, une fouille ou
  une distraction, le PNJ repart proprement vers sa ronde.
- L'ouverture d'une porte reconstruit la grille à partir des obstacles encore
  solides : le passage se rouvre pour les PNJ à l'instant où il s'ouvre pour
  le joueur.
- Suppression de l'ancien déblocage à l'aveugle (`STUCK_SECONDS`,
  `STUCK_STRAFE_SECONDS`, `NpcSense.blocked`) : il traitait le symptôme.

**Vision des PNJ**
- Cône plus étroit et plus court : `DEFAULT_VISION_RANGE` 310 → **230**,
  `DEFAULT_VISION_HALF_ANGLE_DEG` 31 → **22**.
- En échange, la détection mord plus vite : `DETECTION_ALERT_SECONDS` 2 →
  **1,1**, `DETECTION_INTERCEPT_SECONDS` 4 → **2,4**. Un cône se contourne, il
  ne se traverse pas.
- La course reste pénalisante : `RUN_VISION_MULTIPLIER` allonge la portée,
  `RUN_DETECTION_MULTIPLIER` accélère la jauge.
- Chaque niveau peut affiner par PNJ (`visionRange`, `visionHalfAngleDeg`) —
  le garde du parking voit loin et étroit, les collègues voient court et large.

**Caméras de surveillance**
- Balayage réécrit : vitesse **constante** en degrés par seconde, et **arrêt à
  chaque extrémité** avant de repartir dans l'autre sens. On peut observer la
  caméra et comprendre quand passer.
- Tout est dans la donnée du niveau : `sweep: { from, to, degPerSecond, holdMs }`,
  plus `visionRange` et `visionHalfAngleDeg`. Valeurs par défaut
  `CAMERA_SWEEP_DEG_PER_SECOND` et `CAMERA_HOLD_MS`.
- Angles et portées du niveau 2 fortement réduits (portée 200 et 190, demi-angle
  11°).

**Niveau 3 : une vraie mécanique de nuit**
- Le décor reste lisible dans le noir : sol, murs, voitures, mobilier,
  structure. On doit pouvoir circuler.
- Les éléments de jeu — PNJ, objets à ramasser, indices — ne sont nets que dans
  le halo du joueur. Leur opacité suit la distance (`ambient.revealRadius`,
  `ambient.hiddenAlpha`), avec un bord adouci pour ne pas clignoter à chaque
  pas.
- Le cône de vision garde un plancher d'opacité (`CONE_NIGHT_FLOOR`) : le
  porteur se noie dans le noir, son faisceau reste perceptible. Sans ça on se
  ferait repérer par un garde qu'aucun indice ne trahissait.
- `DEPTH` réordonné pour que le voile de nuit passe au-dessus du décor et sous
  les éléments de jeu.
- **La détection n'a pas changé d'une virgule** : l'opacité est du rendu, un
  PNJ invisible vous voit exactement comme avant.

**Fantôme du record**
- Nouveau réglage **Fantôme du record**, **coupé par défaut**. Coupé, aucun
  fantôme n'est créé. Activé, le comportement de la V0.10 est conservé.
- L'enregistrement du meilleur parcours continue toujours : on peut allumer le
  fantôme plus tard et retrouver son record.
- Toujours absent du Défi du jour.

**Tests**
- Nouveau `tests/nav.test.ts` : unités de la grille (blocage, recalage,
  contournement, ligne de vue, réouverture d'une porte) et, pour **chaque
  niveau livré**, que tout point de ronde est atteignable depuis le départ,
  que la zone de déplacement contient bien les points de ronde, et que tout
  PNJ mobile déclare une zone.
- `tests/npc.test.ts` couvre le contournement d'obstacle, le retour à la ronde
  après une fouille, le maintien dans la zone, la reproductibilité du tirage et
  l'arrêt de caméra en bout de course.
- `tests/core.test.ts` couvre les deux nouveaux réglages et leurs valeurs par
  défaut.
- 271 tests.

## V0.9.2 — Polish final et généralisation (étape 3)

Fin de la refonte graphique. Toujours **visuel uniquement** : aucune vitesse,
aucun cône, aucun timing, aucune collision, aucune probabilité, aucun parcours
de PNJ n'a changé. 241 tests.

**Une identité par niveau**
- Un `LevelDef` déclare un `theme` : `office`, `exec` ou `parking`. Ce seul mot
  choisit le sol, les matières de chaque type d'obstacle et la vignette du
  menu. Aucun niveau ne cite un nom de fichier.
- **Niveau 2, l'étage direction** : marbre à dalles, tapis de couloir en
  moquette de cadres, arêtes de laiton. Fauteuils au lieu de chaises, cadres au
  mur, trophées, vases, machine à café, imprimante, fontaine.
- **Niveau 3, le parking** : bitume, béton brut, et les « armoires » du niveau
  deviennent des voitures à toit vitré. Places matérialisées au marquage
  (le rectangle peint EST la signalétique), places numérotées, néons, plots,
  barrières, extincteurs, vélo, chariot, caisses, pneus, panneaux.
- Le joueur, les PNJ, les objets, les portes, les cônes et le HUD restent
  identiques partout : c'est ce qui fait qu'on reconnaît le jeu d'un étage à
  l'autre.

**Éclairage du parking**
- Voile de nuit plus dense, percé par des halos additifs aux points déclarés
  dans `ambient.lights`, plus le halo porté par le joueur. Chaque lampe a son
  néon visible au plafond, au même endroit.
- Un seul sprite de dégradé, redimensionné : aucune texture fabriquée à
  l'exécution, aucun shader.
- **La lumière ne dit rien sur le gameplay** : la détection ne lit jamais
  l'éclairage. Une zone claire n'est pas plus dangereuse.

**Interface définitive**
- **Un seul bandeau** en haut au lieu de trois panneaux flottants : titre,
  niveau, horloge, état, pause et les deux poches. Le terrain reprend 40
  pixels et le HUD se lit d'un coup d'œil.
- Messages contextuels remontés au-dessus des commandes, joystick plus
  contrasté (invisible sur le bitume du parking en V0.9.1).
- Dialogues : bandeau de titre en incrustation, puce de conséquence sous chaque
  choix, et **le prix payé affiché en clair** après le tirage.
- Bulles de tutoriel avec liseré et éclosion.
- Menus : le joueur devient le logo, la remise à zéro de la progression
  descend dans les réglages, filets de séparation, et **une vignette pixel art
  par niveau** — bureaux, direction, parking se reconnaissent avant le titre.

**Écran de fin**
- **L'heure de départ domine la page** : chiffres dessinés en double taille.
  C'est la phrase que le joueur racontera.
- Étoiles qui tombent une par une, compteurs de score qui montent, pulsation
  sur un nouveau record. Tout est coupé en mouvement réduit.

**Game feel**
- Bulle de détection qui éclôt, flash et micro-secousse au repérage, impact
  franc à l'interception, halo vert et fondu à la sortie.
- Transitions de scène : 190 ms à l'entrée, 150 ms à la sortie.
- **Aucune règle n'attend un effet** : l'état passe à « terminé » — donc
  l'horloge se fige et le score est calculé — avant que le moindre effet ne
  démarre.

**Décors vivants**
- Écran, imprimante, fontaine, caméra, néon et machine à café respirent : deux
  frames, une variation d'un ou deux pixels, très lente. Coupé en mouvement
  réduit.

**Nettoyage**
- 26 clés de palette ajoutées (marbre, laiton, béton, bitume, marquage,
  lumière, tons d'interface), zéro doublon.
- Plus **aucune couleur écrite en dur** dans `src/scenes/` ni `src/ui/` : une
  scène choisit un rôle de lecture, jamais une valeur.
- Champs morts supprimés du format de niveau (`ambient.floor`, `decor.color`,
  `decor.scale`, `DialogueChoiceDef.color`), ainsi que `makeButton`,
  `starDisplay` et la moitié inutilisée de `COLORS`.
- Trois tests d'hygiène : aucune couleur en dur, aucun nom d'asset dans une
  scène, aucun PNG orphelin. Le test de fumée échoue désormais aussi sur un
  avertissement de texture ou d'animation manquante.

## V0.9.1 — Assets de production et animations (étape 2)

Toujours **visuel uniquement** : aucune vitesse, aucun cône, aucun timing,
aucune collision, aucun parcours de PNJ n'a changé. Les tests de gameplay
passent à l'identique ; 205 tests au total.

**Les personnages marchent**
- Chaque rôle devient une **planche de 8 poses × 3 orientations**, frames de
  64 × 64 (gabarit imposé par la physique, verrouillé par un test).
- Quatre animations par orientation : repos (respiration), marche, course
  (mêmes frames, plus vite) et sursaut lorsqu'un PNJ vient de repérer le
  joueur.
- Trois orientations : de face, **tournée** et de dos. Un seul côté est
  dessiné — la gauche est un miroir. La variante tournée garde la masse de
  tête de la vue de face, pour ne perdre ni les yeux ni les accessoires.
- Cycle de marche construit sur trois principes : pieds au sol, jambe avancée
  plus longue d'un pixel, main avancée sur deux lignes.
- Le fantôme du record marche lui aussi, dans le sens de sa trajectoire.

**Système d'animation centralisé**
- `src/game/animations.ts` — pur, sans Phaser : planches, tailles de frame,
  indices, cadences et boucles. `BootScene` déroule ces tables ; **aucune scène
  ne crée d'animation** ni ne connaît un découpage.
- `src/scenes/animate.ts` : l'état d'animation vit **sur le sprite**, et une
  animation n'est rejouée que si sa clé change.
- L'orientation se déduit de la **vitesse**, jamais de la direction du cône, et
  reste figée à l'arrêt.
- Les tests vérifient que chaque PNG contient exactement le nombre de frames
  annoncé, qu'aucune animation ne pointe hors bornes et que chaque personnage
  a bien ses quatre états dans ses trois orientations.

**Retours visuels**
- **Bulles d'émotion** au-dessus des PNJ : « ? » méfiance, « ! » alerte,
  « … » fouille. Elles remplacent l'étiquette texte : une glyphe se lit plus
  vite et se distingue par sa forme, donc aussi en mode daltonien.
- **Objets ramassables** : reflet qui balaie le sprite, éclat au ramassage,
  puis vol de l'objet jusqu'à la poche du HUD, qui encaisse le choc.
  L'étiquette au sol part avec l'objet au lieu de rester orpheline.
- **Portes** : quatre frames d'ouverture. La collision, elle, disparaît à
  l'instant exact où le joueur ouvre — aucune règle n'attend une animation.
- **Halo discret** sur les cachettes et les portes verrouillées, déduit de la
  donnée du niveau.

**Assets de production**
- Onze nouveaux accessoires de bureau : cactus, imprimante, fontaine à eau,
  poubelle, cartons, classeurs, téléphone, lampe, clavier, post-it.
- Postes de travail complétés (écran, clavier, tasse, dossiers, post-it) et
  seconde passe sur l'écran, la tasse, les dossiers, la chaise et les objets.
- Niveau 1 : douze accessoires posés dans le couloir, purement cosmétiques.
- `npm run art` produit 54 PNG (46 Ko au total), avec un dossier `fx/` pour
  les effets.

**Nettoyage**
- Plus aucun nom d'asset écrit dans une scène : `UI_TEXTURES`, `PLAYER_TEXTURE`
  et `PROP_ELEVATION` remplacent les dernières chaînes en dur.
- Les positions des poches du HUD sont partagées entre la scène qui les dessine
  et celle qui y envoie l'objet ramassé.

## V0.9 — Direction artistique pixel art (étape 1)

Refonte **visuelle uniquement** : aucune règle de jeu, aucun timing, aucune
collision n'a changé. Les 111 tests de gameplay de la V0.8 passent à
l'identique.

**Direction artistique**
- Mini bible graphique : [`docs/art-direction-v0.9.md`](docs/art-direction-v0.9.md).
- Style : bureau de dessin animé vu de dessus, chaleureux et caricatural.
  Décor en vue de dessus stricte, personnages dessinés de face.
- Règle d'échelle : **1 pixel d'art = 2 unités de monde**, agrandissement
  entier uniquement.
- `src/game/palette.json` devient la **source de vérité unique des couleurs**,
  lue à la fois par le jeu et par le générateur de sprites.

**Chaîne de production d'assets**
- `npm run art` génère 41 PNG (~30 Ko) dans `public/assets/`, rangés par
  famille : `characters/`, `tiles/`, `props/`, `ui/`.
- Les sprites sont écrits en **ASCII lisible** dans `tools/art/`, avec un
  encodeur PNG RGBA sans dépendance. Un graphiste peut remplacer n'importe
  quel PNG sans toucher au code.
- `src/game/artTheme.ts` : couche de configuration visuelle, seul pont entre
  une donnée de niveau et un asset.

**Niveau 1 refait visuellement**
- Sol, murs, bureaux, armoires, pilier et portes en motifs raccordables
  étirés, avec arête éclairée, base assombrie et contour.
- Six personnages caricaturaux, reconnaissables à leur silhouette et à un
  accessoire signature : joueur, collègue à lunettes, boss moustachu,
  stagiaire au casque, vigile à casquette, collègue bavard.
- Objets, plantes, écrans, tasses, dossiers et chaises en pixel art.
- Les zones de sol (départ, sortie, alcôve) sont déclarées **dans la donnée
  du niveau** (`material`), plus par une couleur codée en dur.

**Interface — premier passage**
- Panneaux et boutons en 9 tranches, avec enfoncement au toucher.
- **Horloge en chiffres dessinés** : l'information la plus regardée du jeu.
- Poches d'inventaire regroupées dans un cadre dédié.
- Commandes tactiles en sprites, joystick allégé.
- Menu et écran de fin alignés sur la même direction ; le fond du menu est un
  diorama composé des mêmes motifs que le jeu.

**Technique**
- Rendu en mode `pixelArt` : filtrage NEAREST, aucune interpolation.
- 71 nouveaux tests : présence des assets déclarés, gabarit 64 × 64 des
  personnages, échelle des motifs, couverture du thème, validité de la palette.
- L'illustration peinte de la V0.7 quitte `public/` (elle jurait avec le pixel
  art) et est conservée dans `docs/legacy/`.

## V0.8 — Refonte data-driven, contenu et outillage

**Architecture**
- `LevelScene` devient l'interpréteur d'un format `LevelDef` : un niveau est désormais une donnée. La scène unique de 1 709 lignes est éclatée en `core/`, `systems/`, `ui/`, `levels/` et cinq scènes (`Boot`, `Menu`, `Level` + `LevelView`, `Ui`, `Result`).
- `core/` et `systems/` n'importent plus Phaser et sont testables sans navigateur.
- HUD et contrôles sortent dans une scène `Ui` en surimpression.
- Textes d'interface centralisés (`strings.ts`), stockage centralisé (`Save`), version unique injectée depuis `package.json`.

**Contenu**
- Deux nouveaux niveaux : *L'étage direction* (caméras à balayage, badge, porte verrouillée) et *Le parking* (nuit, vigile à lampe torche, diversion).
- Nouveaux objets : café (accélération), badge (portes), rapport (diversion). Les poches se touchent pour utiliser un objet.
- Les PNJ **fouillent la dernière position connue** avant de reprendre leur ronde, et se décollent des murs en poursuite.
- Audio complet, entièrement synthétisé (aucun fichier).

**Équilibrage**
- Le troisième choix de dialogue n'est plus strictement dominé : il peut désormais faire *gagner* du temps. Un test refuse tout choix dominé.
- La pause manuelle coûte +1 minute : le chrono ne se gèle plus gratuitement.

**Score et rejouabilité**
- Score à trois axes (chrono, discrétion, collecte) détaillé en fin de partie.
- Fantôme du record précédent rejoué pendant la partie.
- Défi du jour à graine déterministe.

**Accessibilité**
- Animations réduites (suit `prefers-reduced-motion`), mode daltonien, taille de texte, joystick à gauche ou à droite, coupure du son et des vibrations.

**Technique**
- Zéro allocation par frame dans les cônes de vision, broad-phase avant raycast.
- PWA : manifeste, icônes générées par script, service worker, favicon. Zone sûre iOS respectée.
- `package-lock.json` versionné, `npm ci` en CI, cache npm.
- oxlint, Prettier, Vitest (111 tests), validateur de niveaux, budget de bundle, test de fumée Chromium.
- Phaser isolé dans son propre chunk. Mesure à l'appui : son ESM pré-bundlé ne se tree-shake pas (6 octets d'écart).
- Correction de deux bugs réels révélés par le test de fumée : glyphe de pause manquant, et références vers des objets détruits dues à la réutilisation des instances de scène par Phaser.

## V0.7 — Direction graphique « Corporate Cartoon »
Illustration d'accueil, palette crème / bleu nuit / turquoise / corail / prune, personnages différenciés, mobilier enrichi, HUD arrondi.

## V0.6 — Consolidation du niveau 1
Format portrait, joystick et course, horloge dynamique, boss et collègue, donut, inventaire, dialogue final, sortie avec étoiles et record, tutoriel contextuel, cachette, jauge de suspicion.

## V0.2 à V0.5
Première boucle d'infiltration, zone du boss, inventaire du donut, dialogue et boucle de sortie.

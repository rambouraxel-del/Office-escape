# Journal des versions

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

# Architecture

## Le principe

**Un niveau est une donnée, pas du code.** En V0.7, tout le jeu tenait dans une scène de 1 709 lignes où murs, rondes et déclencheurs étaient des appels de fonction et des `if` sur les coordonnées du joueur. Ajouter un niveau signifiait dupliquer la scène.

Depuis la V0.8, `LevelScene` est un **interpréteur** de `LevelDef` et ne connaît aucun niveau en particulier.

```
src/
├── core/            code pur, sans Phaser — testable de bout en bout
│   ├── prng.ts        générateur déterministe (Défi du jour)
│   ├── clock.ts       horloge de bureau + pénalités
│   ├── scoring.ts     score à trois axes et étoiles
│   ├── save.ts        seul point d'accès au localStorage
│   ├── settings.ts    réglages et accessibilité
│   ├── audio.ts       synthèse Web Audio (aucun fichier son)
│   └── strings.ts     tous les textes d'interface
├── game/
│   ├── types.ts       contrat LevelDef / DialogueDef / TutorialDef…
│   ├── constants.ts   game feel : uniquement des nombres
│   ├── palette.json   LA palette — source de vérité unique des couleurs
│   ├── palette.ts     accès typé à la palette
│   ├── artTheme.ts    donnée de niveau → asset (matières, rôles, objets)
│   ├── animations.ts  planches et animations — pur, sans Phaser
│   ├── geometry.ts    raycast AABB, cônes de vision
│   ├── validateLevel.ts  filet de sécurité du format data-driven
│   └── session.ts     état partagé entre scènes
├── systems/         règles pures, sans Phaser
│   ├── NpcController.ts   machine à états (ronde / poursuite / fouille / diversion)
│   ├── NavGrid.ts         grille de navigation : parcours, lissage, tirage aléatoire
│   ├── Inventory.ts       deux poches
│   ├── TutorialDirector.ts table de conditions
│   └── GhostRecorder.ts   enregistrement et relecture du record
├── levels/          level01.ts, level02.ts, level03.ts — du contenu
├── ui/
│   ├── theme.ts       textes, panneaux 9 tranches, boutons, horloge pixel
│   └── transition.ts  fondus d'entrée et de sortie de scène
└── scenes/
    ├── BootScene.ts    chargement des assets, une seule fois
    ├── MenuScene.ts    accueil, niveaux, réglages
    ├── MenuStage.ts    le décor VIVANT de l'accueil (élévation, animé)
    ├── LevelScene.ts   orchestration et règles
    ├── LevelView.ts    tout le dessin d'un niveau (pixel art)
    ├── UiScene.ts      HUD et contrôles, en surimpression
    └── ResultScene.ts  score détaillé
```

```
tools/art/          générateur de sprites, hors du bundle
├── canvas.mjs        canvas pixel + DSL de sprites en ASCII
├── png.mjs           encodeur PNG RGBA sans dépendance
├── characters.mjs    les six rôles, en planches animées
├── tiles.mjs         motifs de matière raccordables
├── props.mjs         accessoires, objets ramassables, porte animée
├── fx.mjs            bulles d'émotion, éclat de ramassage, halo d'interaction
├── ui.mjs            panneaux, boutons, chiffres d'horloge
├── menu.mjs          diorama du menu
├── thumbs.mjs        vignettes des trois niveaux
└── build-art.mjs     `npm run art` → public/assets/
```

Règle de dépendance : `core/` et `systems/` **n'importent jamais Phaser**. C'est ce qui rend les tests unitaires possibles sans navigateur.

## La couche visuelle (V0.9)

Le rendu est en **pixel art**, entièrement produit hors ligne par `npm run art`
puis chargé comme de vrais assets. Quatre règles portent tout le reste :

1. **1 pixel d'art = 2 unités de monde**, agrandissement entier uniquement.
2. **`palette.json` est la seule source de couleurs** — le jeu et le générateur
   lisent le même fichier.
3. **`artTheme.ts` est le seul pont entre une donnée de niveau et un asset.**
   `LevelView` ne connaît aucun nom de fichier.
4. **`animations.ts` est le seul endroit qui découpe une planche.** Taille de
   frame, indices, cadence, boucle : tout s'y déclare, `BootScene` déroule les
   tables, et aucune scène ne crée d'animation.

Le détail (intention, palette, orientations, cycles de marche, retours visuels,
limites) vit dans [`docs/art-direction-v0.9.md`](docs/art-direction-v0.9.md).

### Animation des personnages (V0.9 étape 2)

Une planche par rôle : **8 poses × 3 orientations**, frames de 64 × 64. La
variante latérale n'est dessinée qu'une fois — la gauche est un `flipX`.

Deux décisions qui expliquent la forme du code :

- **L'état d'animation vit sur le sprite** (`setData`), pas dans une table de
  la scène. Phaser réutilise l'instance de scène : un `Map` de sprites
  survivrait d'une partie à l'autre et pointerait vers des objets détruits.
- **On ne rejoue une animation que si sa clé change.** Appeler `play()` chaque
  frame la redémarrerait indéfiniment sur sa première image.

L'orientation se déduit de la **vitesse**, jamais de la direction du cône de
vision — et elle est conservée à l'arrêt : un PNJ qui se retournerait tout seul
vers le joueur donnerait une information de gameplay fausse.

### Un thème par niveau (V0.9 étape 3)

Un `LevelDef` déclare `theme: 'office' | 'exec' | 'parking'`. Ce seul mot
choisit, dans `artTheme.ts`, le sol, les matières de chaque type d'obstacle et
la vignette du menu. Aucun niveau ne cite un nom de fichier, et donner une
identité à un quatrième étage ne demandera qu'une entrée de plus.

## L'accueil (V0.10.2)

L'écran d'accueil est le seul endroit du projet dessiné **en élévation**, et
c'est délibéré : le jeu se joue de dessus, mais une vue de dessus donne un
plan, et un menu doit donner envie avant d'informer. La bible graphique
autorise au menu un cadrage plus cinématographique ; elle ne l'autorise pas à
changer de palette, et il n'y en a qu'une.

Le partage suit celui d'un niveau : `MenuStage` est le `LevelView` de
l'accueil. D'un côté ce qui se dessine, de l'autre ce qui se décide. La scène
ne sait pas qu'il y a une machine à café ; elle sait qu'il y a une pièce, et
lui demande de vivre.

- **Le décor est UNE image** (`menu-room`, 390 × 844, 6 Ko), cuite hors ligne.
  Ce qui bouge est découpé en petites planches posées par-dessus.
- **La composition est une donnée** : `MENU_STAGE` dans `artTheme.ts` déclare
  où se pose chaque habitant, l'horloge, les néons, la vapeur et la flaque de
  lumière. `MenuStage` déroule cette table, il n'invente aucune coordonnée —
  même règle que pour un niveau.
- **Les habitants sont les personnages du jeu**, recadrés au buste au-dessus
  du plateau : le menu doit montrer les gens qu'on va croiser.
- **L'horloge murale donne l'heure réelle**, à la seconde. C'est le détail qui
  fait regarder deux fois.
- **L'interface a sa propre profondeur** (`DEPTH.menuUi`). Sans elle, un
  collègue qui tape à la machine passe devant le panneau des réglages.

Ouverture : le décor apparaît, vit seul le temps qu'on le remarque
(`MENU_INTRO_HOLD_MS`), puis l'interface monte par vagues. En mouvement
réduit, tout est là d'emblée, et l'on coupe le vacillement des néons, les
poussières, la vapeur et la pulsation de lumière ; les personnages, eux,
continuent de respirer à 1,4 à 5 images par seconde — le réglage promet la fin
des flashs, pas un menu mort.

## La navigation des PNJ (V0.10.1)

`NavGrid` est une **grille**, pas un navmesh. Les niveaux font 500 × 2200
unités et tous les obstacles sont des rectangles alignés : à 25 unités par
cellule, un niveau tient dans 1 760 cases, qu'un parcours en largeur d'abord
traverse en moins d'une milliseconde. Un navmesh serait plus élégant et
complètement disproportionné.

Trois choix portent le reste :

1. **Une marge de dégagement autour de chaque obstacle** (`NAV_CLEARANCE`).
   Un chemin qui passe pile sur l'arête met le PNJ en butée contre le moteur
   physique — c'est exactement ce qui bloquait les PNJ du niveau 3 contre les
   voitures.
2. **Un lissage par ligne de vue** : tout point de passage que l'on peut
   sauter en ligne droite disparaît. Sans lui, le PNJ suit l'escalier de la
   grille et titube.
3. **Le tirage vient du `Prng` du niveau.** Une destination est prise au
   hasard dans la `roam` du PNJ — sa zone de déplacement, déclarée dans la
   donnée — donc la ronde vit sans jamais cesser d'être reproductible : le
   Défi du jour rejoue à l'identique.

Un changement d'état invalide toujours le chemin : après une poursuite, une
fouille ou une distraction, le PNJ repart proprement. L'ouverture d'une porte
reconstruit la grille à partir des obstacles encore solides, plutôt que de
« déboucher » le rectangle de la porte : sa marge est partagée avec le mur
voisin, et la rouvrir à la main laisserait soit un bouchon, soit un trou.

### Éclairage du parking

Un voile de nuit, puis des **halos additifs** aux points déclarés dans
`ambient.lights`. Un seul sprite de dégradé, redimensionné à la volée : aucune
texture fabriquée à l'exécution, aucun shader, rien qui coûte sur un téléphone.

Depuis la V0.10.1 la nuit est aussi une **mécanique**, mais uniquement de
lisibilité : le décor reste visible — on doit pouvoir circuler — tandis que les
éléments de jeu (PNJ, objets, indices) voient leur opacité suivre la distance
au joueur (`ambient.revealRadius`, `ambient.hiddenAlpha`). Le cône de vision,
lui, garde un plancher (`CONE_NIGHT_FLOOR`) : le porteur se noie dans le noir,
son faisceau reste perceptible, sinon la nuit devient injuste plutôt que tendue.

**Ni les lampes ni ce voile ne disent quoi que ce soit sur le gameplay.**
`NpcController`, `geometry.ts` et la détection ne lisent jamais `ambient` :
une zone plus claire n'est pas plus dangereuse, et un PNJ effacé vous voit
exactement comme avant. En faire une mécanique de détection serait une décision
de game design, pas une passe graphique.

**Le rendu n'a pas le droit de toucher au gameplay.** Un obstacle crée
toujours le rectangle de collision exact de la V0.8 ; il est simplement rendu
invisible, et l'habillage est dessiné par-dessus. C'est ce qui garantit qu'une
refonte visuelle ne déplace pas un mur d'un pixel.

Corollaire pour les animations : **aucune règle n'attend la fin d'une
animation.** Quand une porte s'ouvre, sa collision disparaît immédiatement ;
seul le battant prend 320 ms à s'effacer. Même chose pour la célébration de
sortie : l'état passe à « terminé » — donc l'horloge se fige et le score est
calculé — AVANT que le moindre effet ne démarre. Le délai ne retarde que le
changement d'écran.

**Trois tests d'hygiène** gardent la couche visuelle propre (`tests/art.test.ts`) :
aucune couleur écrite en dur dans `src/scenes/` ou `src/ui/`, aucun nom d'asset
cité dans une scène, aucun PNG orphelin dans `public/assets/`.

## Le format `LevelDef`

Voir `src/game/types.ts` pour le contrat exact. En résumé :

| Champ | Rôle |
| --- | --- |
| `size`, `spawn`, `ambient` | dimensions, départ, ambiance (`darkness`, `revealRadius`, `hiddenAlpha` pour la nuit) |
| `obstacles` | rectangles **définis par leur centre** ; `kind` choisit le style, `lock` en fait une porte |
| `decor` | purement cosmétique : plantes, zones, étiquettes, accessoires de bureau |
| `npcs` | `patrol` (cyclique) + `roam` (zone de déplacement), ou `sweep` pour une caméra fixe ; `visionRange` et `visionHalfAngleDeg` affinent le cône |
| `items` | deux au maximum : l'inventaire n'a que deux poches |
| `hidingSpots` | `door` (où l'on entre) et `exit` (où l'on ressort) |
| `triggers` | zones `dialogue` ou `exit` |
| `dialogues` | choix probabilistes ; `rewardMinutes` négatif = temps gagné |
| `tutorials` | conditions déclaratives (`after`, `nearPoint`, `beyondY`, `itemPending`…) |
| `clock`, `stars` | départ, heure fatidique, seuils d'étoiles |

## Le validateur

Le format data-driven déplace les fautes de frappe du compilateur vers l'exécution. `validateLevel()` remet le filet et tourne sur **chaque niveau livré** dans la suite de tests :

- départ ou objet dans un mur, point de ronde inatteignable ;
- porte verrouillée par une clé absente du niveau ;
- seuils d'étoiles incohérents ou hors du temps disponible ;
- aucune sortie, dialogue fantôme, dialogue sans issue sans objet ;
- **choix de dialogue strictement dominé** — coût moyen supérieur et aucun gain possible : un joueur qui compte ne le prendra jamais, c'est un tiers d'écran mort.

## Décisions et pièges

**Zéro allocation par frame.** `buildVisionPolygon` écrit dans un tableau préalloué et `NpcController.update()` renvoie une instance **réutilisée**. Il faut la consommer immédiatement, jamais la stocker ni la comparer à un appel précédent — un test le vérifie.

**Broad-phase avant raycast.** `cullBlockers` rejette par cercle englobant les obstacles hors de portée avant tout test fin.

**Le gabarit 64 × 64 des personnages est imposé par la physique.**
`Body.setCircle()` conserve l'offset (0,0) du corps : le cercle de collision
est positionné à partir des dimensions de la FRAME. Passer les personnages en
planches d'animation n'a donc rien déplacé — les frames font toujours 64 × 64,
et un test le verrouille.

**Phaser réutilise l'instance de scène.** `create()` rejoue, mais **pas** les initialiseurs de champs de classe. Tout état par partie doit être remis à zéro explicitement en tête de `create()`. Ce piège a causé un crash réel (des `Text` détruits conservés dans un tableau), attrapé par `npm run smoke`.

**Aucun fichier audio.** Tout est synthétisé (oscillateurs et bruit filtré), dans la même logique que les textures procédurales : rien à charger, rien au bundle. Le contexte n'est débloqué qu'au premier geste, contrainte iOS.

**Le bundle Phaser ne se tree-shake pas.** Phaser 4.2.1 livre un ESM pré-bundlé sans `sideEffects: false` : mesuré, un import nommé (`import { Scale } from 'phaser'`) économise **6 octets** sur 1,4 Mo. La seule optimisation utile est le `manualChunks` qui l'isole, pour qu'il reste en cache navigateur entre deux déploiements. Le budget (`npm run budget`) surveille surtout le chunk applicatif.

**L'anti-exploit de la pause.** Geler l'horloge à volonté fausserait le seul score qui compte. La pause manuelle coûte +1 minute ; la mise en arrière-plan est gratuite, parce qu'un appel entrant n'est pas de la triche.

## Intégration continue

- `ci.yml` (branches et PR) : lint, format, typage, tests, build, budget, puis test de fumée dans Chromium.
- `deploy.yml` (`main`) : mêmes garde-fous, puis déploiement GitHub Pages. `cancel-in-progress: false` — un déploiement interrompu en vol laisse le site dans un état incertain.

Le test de fumée est le seul à voir les pièges du moteur ; il en a déjà attrapé deux. Une prévisualisation par PR (déploiement de chaque branche sur un sous-chemin Pages) reste à faire pour tester sur un vrai téléphone avant fusion.

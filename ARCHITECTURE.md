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
│   ├── geometry.ts    raycast AABB, cônes de vision
│   ├── validateLevel.ts  filet de sécurité du format data-driven
│   └── session.ts     état partagé entre scènes
├── systems/         règles pures, sans Phaser
│   ├── NpcController.ts   machine à états (ronde / poursuite / fouille / diversion)
│   ├── Inventory.ts       deux poches
│   ├── TutorialDirector.ts table de conditions
│   └── GhostRecorder.ts   enregistrement et relecture du record
├── levels/          level01.ts, level02.ts, level03.ts — du contenu
├── ui/theme.ts      fabrique de textes et de boutons (échelle d'accessibilité)
└── scenes/
    ├── BootScene.ts    textures procédurales, une seule fois
    ├── MenuScene.ts    accueil, niveaux, réglages
    ├── LevelScene.ts   orchestration et règles
    ├── LevelView.ts    tout le dessin d'un niveau
    ├── UiScene.ts      HUD et contrôles, en surimpression
    └── ResultScene.ts  score détaillé
```

Règle de dépendance : `core/` et `systems/` **n'importent jamais Phaser**. C'est ce qui rend 111 tests unitaires possibles sans navigateur.

## Le format `LevelDef`

Voir `src/game/types.ts` pour le contrat exact. En résumé :

| Champ | Rôle |
| --- | --- |
| `size`, `spawn`, `ambient` | dimensions, départ, ambiance (`darkness` pour la nuit) |
| `obstacles` | rectangles **définis par leur centre** ; `kind` choisit le style, `lock` en fait une porte |
| `decor` | purement cosmétique : plantes, zones, étiquettes, accessoires de bureau |
| `npcs` | `patrol` (cyclique), ou `sweep` pour une caméra fixe qui balaie |
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

**Phaser réutilise l'instance de scène.** `create()` rejoue, mais **pas** les initialiseurs de champs de classe. Tout état par partie doit être remis à zéro explicitement en tête de `create()`. Ce piège a causé un crash réel (des `Text` détruits conservés dans un tableau), attrapé par `npm run smoke`.

**Aucun fichier audio.** Tout est synthétisé (oscillateurs et bruit filtré), dans la même logique que les textures procédurales : rien à charger, rien au bundle. Le contexte n'est débloqué qu'au premier geste, contrainte iOS.

**Le bundle Phaser ne se tree-shake pas.** Phaser 4.2.1 livre un ESM pré-bundlé sans `sideEffects: false` : mesuré, un import nommé (`import { Scale } from 'phaser'`) économise **6 octets** sur 1,4 Mo. La seule optimisation utile est le `manualChunks` qui l'isole, pour qu'il reste en cache navigateur entre deux déploiements. Le budget (`npm run budget`) surveille surtout le chunk applicatif.

**L'anti-exploit de la pause.** Geler l'horloge à volonté fausserait le seul score qui compte. La pause manuelle coûte +1 minute ; la mise en arrière-plan est gratuite, parce qu'un appel entrant n'est pas de la triche.

## Intégration continue

- `ci.yml` (branches et PR) : lint, format, typage, tests, build, budget, puis test de fumée dans Chromium.
- `deploy.yml` (`main`) : mêmes garde-fous, puis déploiement GitHub Pages. `cancel-in-progress: false` — un déploiement interrompu en vol laisse le site dans un état incertain.

Le test de fumée est le seul à voir les pièges du moteur ; il en a déjà attrapé deux. Une prévisualisation par PR (déploiement de chaque branche sur un sous-chemin Pages) reste à faire pour tester sur un vrai téléphone avant fusion.

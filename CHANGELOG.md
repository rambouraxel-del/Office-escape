# Journal des versions

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

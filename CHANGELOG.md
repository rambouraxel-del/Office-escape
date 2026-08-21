# Journal des versions

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

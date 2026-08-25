# Office Escape — repères pour un agent

Jeu web 2D d'infiltration mobile. Phaser 4 · TypeScript strict · Vite.
Lire `ARCHITECTURE.md` avant toute modification structurelle.

## Règles non négociables

- **`src/core/` et `src/systems/` n'importent jamais Phaser.** C'est ce qui rend la logique testable sans navigateur.
- **Un niveau est une donnée** (`LevelDef`, `src/game/types.ts`), jamais du code. Ne jamais coder en dur des coordonnées de niveau dans une scène.
- **Aucun texte visible en dur dans une scène** : interface dans `src/core/strings.ts`, contenu dans le fichier du niveau.
- **Aucun `Math.random()` dans le gameplay** : passer par `Prng` (le Défi du jour doit rester reproductible).
- **Aucun accès direct à `localStorage`** : passer par `Save`.
- **Phaser réutilise l'instance de scène** : les initialiseurs de champs ne rejouent pas entre deux parties. Remettre l'état à zéro en tête de `create()`. Ce piège a déjà causé un crash.
- Les objets renvoyés par `NpcController.update()` et `buildVisionPolygon()` sont **réutilisés d'une frame à l'autre** : les consommer immédiatement.
- **Aucune couleur en dur** : tout passe par `src/game/palette.json`. Aucun nom d'asset dans une scène : tout passe par `src/game/artTheme.ts`.
- **Aucune animation créée dans une scène** : planches, frames et cadences se déclarent dans `src/game/animations.ts`, que `BootScene` déroule. Ne jamais appeler `play()` à chaque frame — passer par `src/scenes/animate.ts`, qui ne rejoue que si la clé change.
- **Aucune règle de jeu n'attend une animation** : une porte perd sa collision à l'instant où on l'ouvre ; seul son habillage prend le temps de s'effacer.
- **1 pixel d'art = 2 unités de monde**, agrandissement entier uniquement. Les sprites se régénèrent avec `npm run art`.
- **Les FRAMES de personnage font 64 × 64, obligatoirement** : `Body.setCircle()` positionne le cercle de collision à partir des dimensions de la frame. Un test le verrouille.
- **Le rendu ne touche jamais au gameplay** : un obstacle garde son rectangle de collision d'origine, rendu invisible, et l'habillage se dessine par-dessus.

## Vérifier

```bash
npm run verify   # lint + typage + tests + build + budget
npm run smoke    # parcours réel dans Chromium (après build)
npm run art      # régénère les sprites après modification de tools/art/
```

Direction artistique : `docs/art-direction-v0.9.md`.

Un changement de gameplay sans test dans `tests/` est incomplet. Un changement de scène non passé au `smoke` est non vérifié.

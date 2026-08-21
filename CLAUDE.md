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

## Vérifier

```bash
npm run verify   # lint + typage + tests + build + budget
npm run smoke    # parcours réel dans Chromium (après build)
```

Un changement de gameplay sans test dans `tests/` est incomplet. Un changement de scène non passé au `smoke` est non vérifié.

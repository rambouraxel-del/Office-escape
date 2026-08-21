# Contribuer

## Flux

Le dépôt travaillait en commits directs sur `main`. Désormais :

1. une branche par changement (`feat/…`, `fix/…`) ;
2. `npm run verify` en local avant de pousser ;
3. une pull request — `ci.yml` doit être vert ;
4. fusion dans `main`, ce qui déclenche le déploiement.

## Avant de pousser

```bash
npm run verify     # lint + typage + tests + build + budget
npm run smoke      # parcours du jeu dans un vrai Chromium (après build)
```

## Conventions

- **`core/` et `systems/` n'importent jamais Phaser.** C'est ce qui garde le jeu testable.
- **Aucun texte visible en dur dans une scène** : interface dans `src/core/strings.ts`, contenu dans le fichier de son niveau.
- **Aucune règle de jeu dans `LevelView`** : elle ne fait que dessiner.
- **Aucun `Math.random()` dans le gameplay** : passer par `Prng`, sinon le Défi du jour n'est plus reproductible.
- **Aucun accès direct à `localStorage`** : passer par `Save`.
- Toute nouvelle constante de game feel va dans `src/game/constants.ts`.
- Remettre à zéro l'état par partie en tête de `create()` : Phaser réutilise l'instance de scène.

## Ajouter un niveau

1. Créer `src/levels/levelNN.ts` en suivant `LevelDef` (`src/game/types.ts`).
2. L'ajouter à `LEVELS` dans `src/levels/index.ts`.
3. `npm run test` : le validateur vérifie qu'il est jouable et signale les choix de dialogue dominés.
4. `npm run dev` pour l'essayer, `npm run smoke` pour vérifier qu'il ne casse rien.

Deux objets au maximum par niveau : l'inventaire n'a que deux poches, et un test le vérifie.

## Régénérer les icônes

`npm run icons` — encodeur PNG sans dépendance, dans `tools/make-icons.mjs`.

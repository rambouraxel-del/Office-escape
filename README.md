# Office Escape

Jeu web 2D d'infiltration/puzzle **mobile-first** en **pixel art** : quitter le bureau avant les heures sup.
Phaser 4 · TypeScript · Vite. Trois niveaux ; tous les visuels et tous les sons sont produits par le code.

**→ [Jouer](https://rambouraxel-del.github.io/Office-escape/)**

## Démarrer

```bash
npm install
npm run dev        # serveur de développement
```

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur Vite avec rechargement à chaud |
| `npm run check` | typage TypeScript (`tsc --noEmit`) |
| `npm run lint` | oxlint |
| `npm run format` | Prettier (`format:check` en CI) |
| `npm run test` | tests unitaires Vitest |
| `npm run build` | typage + build de production dans `dist/` |
| `npm run budget` | budget de poids du bundle (après `build`) |
| `npm run smoke` | parcourt le jeu dans un vrai Chromium (après `build`) |
| `npm run art` | régénère les sprites pixel art dans `public/assets/` |
| `npm run icons` | régénère les icônes PWA |
| `npm run verify` | tout l'enchaînement ci-dessus |

Node 22 recommandé. `npm ci` en intégration continue : le `package-lock.json` est versionné.

## Le jeu

Il est 17 h. Entre toi et la sortie : des collègues qui patrouillent, un boss, des caméras, un vigile — et une horloge qui avance (5 secondes réelles = 1 minute de bureau).

- **Se déplacer** : joystick tactile, ou ZQSD / WASD / flèches.
- **Courir** : bouton `COURIR` maintenu avec un second doigt, ou `Maj`. Plus rapide, mais le cône de vision des autres s'allonge et la détection s'accélère.
- **Interagir** : bouton contextuel, ou `Espace` — se cacher, ramasser, ouvrir une porte.
- **Utiliser un objet** : toucher une poche du HUD, ou `1` / `2`.
- **Pause** : bouton `II` ou `Échap`. Elle gèle l'horloge mais coûte **+1 minute** — le score reste honnête.

**Détection** : suspicion à 2 s dans le champ de vision, alerte puis poursuite, interception à 4 s. Hors de vue, la jauge redescend ; un poursuivant va d'abord **fouiller ta dernière position connue** avant de reprendre sa ronde. Se cacher n'annule plus la traque, ça la déplace.

**Score en trois axes** — chrono, discrétion (jamais repéré, peu de frayeurs) et collecte. Rejouer plus vite n'est plus la seule raison de rejouer. Le record d'un niveau enregistre aussi un **fantôme**, rejoué à la partie suivante.

**Défi du jour** : même niveau et même graine pour tout le monde, tirés de la date.

**Objets** : 🍩 donut et ☕ café (monnaie d'échange sociale en dialogue, le café accélère aussi), 🪪 badge (ouvre les portes verrouillées), 📄 rapport (lâché, il attire les rondes ailleurs). Deux poches, pas une de plus.

**Réglages** : son, vibrations, animations réduites, mode daltonien (hachures sur les cônes en alerte), taille du texte, joystick à gauche ou à droite.

Installable comme application (PWA) et jouable hors ligne après le premier chargement.

## Ajouter un niveau

Un niveau est une **donnée**, pas du code :

```ts
// src/levels/level04.ts
export const LEVEL_04: LevelDef = { id: 'level-04', obstacles: [...], npcs: [...], ... };
```

Puis l'ajouter à `src/levels/index.ts`. `LevelScene` l'interprète tel quel, et les tests valident automatiquement qu'il est jouable (départ hors des murs, rondes atteignables, objets accessibles, sortie existante, choix de dialogue non dominés…).

## Direction artistique

Pixel art, bureau de dessin animé vu de dessus, chaleureux et caricatural.
Les sprites sont écrits en ASCII dans `tools/art/` et cuits en PNG par
`npm run art` — un graphiste peut remplacer n'importe quel fichier de
`public/assets/` sans toucher au code.

Règles, palette et limites : [`docs/art-direction-v0.9.md`](docs/art-direction-v0.9.md).

Détails du format et de l'architecture : [`ARCHITECTURE.md`](ARCHITECTURE.md).
Comment contribuer : [`CONTRIBUTING.md`](CONTRIBUTING.md).
Historique des versions : [`CHANGELOG.md`](CHANGELOG.md).

## Licence

MIT — voir [`LICENSE`](LICENSE).

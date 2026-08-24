# Direction artistique — V0.9

Document court et exploitable. Il fixe ce qui est **non négociable** pour que
tout ce qui sera ajouté au jeu reste cohérent avec le niveau 1.

## 1. Intention

**Un bureau de dessin animé, vu de dessus, chaleureux et un peu ridicule.**

Trois mots pour trancher un arbitrage :

1. **Lisible** avant tout. Sur un écran de téléphone tenu à bout de bras, on
   doit distinguer un rôle et un danger en une fraction de seconde.
2. **Chaleureux**. Palette de bois, crème et laine ; jamais le gris-bleu froid
   du bureau réaliste. On fuit un lieu sympathique, c'est ce qui rend la fuite
   drôle.
3. **Caricatural**. Les personnages sont des types sociaux, pas des portraits.

Ce qui est **exclu** : réalisme, ombres portées longues, dégradés, isométrie,
perspective 3/4, texte décoratif illisible.

## 2. La règle de la vue

- Le **décor** est en vue de dessus **strictement orthogonale**. Aucun mur ne
  montre sa face, aucun meuble n'a de fuyante. Le volume se suggère uniquement
  par une **arête supérieure claire** et une **base assombrie** de 1 pixel.
- Les **personnages sont dessinés de face**. C'est la convention des jeux 2D
  top-down, et la seule qui laisse lire une expression. Un crâne vu de dessus
  n'a ni yeux ni bouche : impossible de caricaturer.

Cette combinaison — décor de dessus, personnages de face — est la signature
visuelle du jeu. Ne pas la mélanger avec de l'isométrie.

## 3. Échelle : la règle la plus importante

> **1 pixel d'art = 2 unités de monde.**

Tout est dessiné à sa résolution native puis agrandi **×2, jamais autrement**.
Un agrandissement non entier interpole les pixels et détruit le style ; le
générateur refuse d'ailleurs tout facteur non entier.

| Élément | Grille source | Taille en jeu |
| --- | --- | --- |
| Motif de matière (sol, bois, mur…) | 16 × 16 | 32 × 32 |
| Personnage | 24 × 24 dans un cadre de 32 × 32 | **64 × 64 — imposé** |
| Objet ramassable | 16 × 16 | 32 × 32 |
| Chiffre d'horloge | 8 × 12 | 16 × 24 |
| Trait de contour | 1 | 2 |

> ⚠️ **Le cadre de 64 × 64 des personnages est imposé par la physique.**
> `Body.setCircle()` conserve l'offset (0,0) du corps : le cercle de collision
> est positionné à partir des dimensions de la texture. Changer ce cadre
> déplacerait toutes les collisions du jeu.

## 4. Palette

Source de vérité unique : **`src/game/palette.json`**, lue à la fois par le jeu
(`src/game/palette.ts`) et par le générateur de sprites (`tools/art/`).
**Aucune valeur hexadécimale ne doit apparaître ailleurs.**

| Rôle | Clés | Usage |
| --- | --- | --- |
| Trait | `ink`, `inkSoft` | Contour de tout ce qui est solide. Presque noir, mais chaud. |
| Papier | `paper`, `paperDim` | Panneaux d'interface, feuilles, chemises. |
| Sol | `floorLight/Mid/Dark`, `floorSeam` | Moquette du bureau. |
| Tapis | `carpetStart`, `carpetExit`, `carpetAlcove` | Zones nommées : départ, sortie, détour. |
| Cloisons | `wallTop/Light/Mid/Dark` | Murs et séparations. |
| Bois | `woodLight/Mid/Dark` | Bureaux, portes. |
| Métal / béton | `metal*`, `stone*` | Armoires, piliers, matériel. |
| Rôles | `teal` (joueur), `coral` (collègue), `plum` (boss), `blue` (stagiaire), `navy` (vigile) | Une teinte par rôle, jamais réutilisée ailleurs. |
| Alerte | `gold` (vigilance), `alert` (repéré) | **Réservées à la détection.** Rien d'autre dans le jeu n'a le droit d'être rouge vif. |
| Interface | `hudPanel`, `hudEdge`, `hudInset` | Bandeau, cadres, incrustations. |

**Règle de réserve** : `gold` et `alert` appartiennent au système de détection.
Un décor doré attirerait l'œil sur une fausse alerte.

## 5. Lisibilité mobile

1. **Silhouette d'abord.** Un rôle doit se reconnaître en noir sur blanc. Le
   boss et le vigile sont plus larges ; le stagiaire porte un casque ; le
   collègue, de grosses lunettes rondes. La couleur ne fait que confirmer.
2. **Contour systématique.** Tout élément posé sur le sol porte un trait
   `ink` de 1 pixel. Sans lui, rien ne se détache à petite taille.
3. **Trois plans de valeur.** Sol clair → mobilier moyen → personnages et
   traits sombres. Un personnage ne doit jamais avoir la valeur de son fond.
4. **Grain discret.** Les motifs de sol sont volontairement peu contrastés :
   le sol meuble l'espace, il ne concurrence ni les personnages ni les cônes.
5. **Pas de détail sous 2 pixels.** Ce qui mesure un seul pixel disparaît sur
   un écran de téléphone.
6. **L'accessibilité prime sur le style** : en mode daltonien, un cône en
   alerte reçoit des hachures — la teinte seule ne suffit jamais.

## 6. Personnages

- Gabarit **24 × 24** : tête très large (≈ la moitié de la hauteur), corps
  trapu, jambes courtes. Proportions « chibi », adultes ridicules.
- **Un accessoire signature par rôle**, dessiné par-dessus la silhouette :
  lunettes, moustache, casquette, casque audio, badge, cravate.
- Les accessoires s'accrochent à des **repères anatomiques calculés**
  (`anatomyOf`), jamais à des coordonnées en dur : une frange plus haute
  décalerait sinon les lunettes sur le col.
- Ombre au sol : deux lignes d'`ink` très transparentes. Elle ancre le
  personnage sans introduire de perspective.
- Visage minimal : deux yeux de 2 pixels, une bouche de 4. C'est suffisant, et
  au-delà ça devient illisible.

## 7. Décor

- Les obstacles d'un niveau sont des **rectangles de taille arbitraire** : on
  ne peut pas les couvrir de sprites fixes. Chaque matière est donc un
  **motif raccordable** étiré en `TileSprite`, plus une bordure dessinée.
- Habillage systématique d'un meuble, dans l'ordre :
  1. ombre portée décalée de 1 pixel d'art ;
  2. remplissage par le motif de matière, **aligné sur une grille de monde
     commune** pour que deux meubles voisins ne montrent pas de rupture ;
  3. arête supérieure claire et base sombre ;
  4. contour `ink` ;
  5. incrustation centrale pour les armoires et piliers ;
  6. accessoires posés dessus (écran, tasse, dossiers).
- Le sol de base est un seul `TileSprite` couvrant le niveau. Les **zones**
  (départ, sortie, alcôve) sont des tapis déclarés **dans la donnée du
  niveau** (`material`), jamais une couleur codée en dur.
- Le décor doit être **habité** : chaises dépareillées, tasses, plantes. Un
  bureau vide n'est pas drôle.

## 8. Interface

- Panneaux et boutons en **9 tranches** (`nineslice`) : les coins gardent leur
  taille, seul le centre s'étire. Un panneau de n'importe quelle dimension
  reste net.
- Trois habillages de bouton : `ui-button` (action principale, turquoise),
  `ui-button-warm` (choix risqué ou destructif, corail), `ui-button-muted`
  (secondaire, ardoise).
- Retour tactile : le bouton s'enfonce d'exactement 1 pixel d'art.
- **L'horloge a sa propre police dessinée** (`PixelClock`). C'est l'information
  la plus regardée du jeu : elle seule justifie une fonte sur mesure.
- **Le reste de l'interface garde la police système.** Choix assumé : une
  fonte pixel complète avec accents français serait illisible à petite taille
  et coûterait cher pour un gain douteux. Voir les limites (§10).

## 9. Cohérence : les sept règles

1. **1 pixel d'art = 2 unités de monde.** Agrandissement entier uniquement.
2. **Aucune couleur hors de `palette.json`.**
3. **`gold` et `alert` sont réservés à la détection.**
4. **Tout solide porte un contour `ink` de 1 pixel.**
5. **Décor de dessus strict, personnages de face.**
6. **Le cadre des personnages reste 64 × 64.**
7. **Un niveau reste une donnée** : une matière de sol se déclare dans le
   `LevelDef`, jamais dans une scène.

## 10. Limites assumées de l'étape 1

- **Pas d'animation.** Les personnages sont des poses fixes ; aucun cycle de
  marche, aucune orientation selon la direction. C'est le premier chantier de
  l'étape suivante.
- **Police système pour tout sauf l'horloge** (voir §8).
- **Un PNG par sprite**, pas d'atlas : 41 fichiers, ~30 Ko au total. Le
  regroupement en atlas n'a de sens qu'à partir de quelques centaines
  d'assets.
- **Niveaux 2 et 3 non retravaillés.** Ils héritent automatiquement des
  nouvelles matières et des nouveaux personnages — donc ils ne sont pas
  cassés — mais leur décor n'a pas été composé pour le pixel art.
- **Éclairage sommaire** au niveau 3 : un voile sombre et un halo additif, pas
  de vraie occlusion lumineuse.

## 11. Comment produire un asset

```bash
npm run art        # régénère tout public/assets/ depuis tools/art/
```

Les sprites sont écrits en **ASCII lisible** dans `tools/art/` : une grille de
caractères et une légende qui relie chaque caractère à la palette. Le
générateur vérifie que les lignes ont toutes la même longueur et refuse les
couleurs absentes de la palette.

Un graphiste qui préfère son propre outil peut **remplacer n'importe quel PNG**
de `public/assets/` sans toucher au code, tant qu'il respecte les dimensions du
tableau du §3.

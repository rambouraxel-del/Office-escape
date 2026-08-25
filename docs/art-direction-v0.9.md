# Direction artistique — V0.9

> Étape 1 : identité visuelle et niveau 1 vitrine.
> Étape 2 : assets de production, animations et retours visuels (§ 6 bis, 7 bis, 8 bis).
> **Étape 3 : trois identités de niveau, éclairage, interface définitive**
> (§ 4 bis, 7 ter, 8 ter).

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

**Trois orientations, pas quatre** (étape 2) :

| Orientation | Ce qu'on voit | Quand |
| --- | --- | --- |
| `down` | le visage complet | déplacement vers le bas, et par défaut |
| `side` | tête **tournée**, jamais de profil strict | déplacement latéral ; miroir pour la gauche |
| `up` | l'arrière du crâne, entièrement en cheveux | déplacement vers le haut |

La variante latérale garde la **même masse de tête** que la vue de face : les
cheveux glissent vers l'arrière, le visage vers l'avant, les deux yeux restent
visibles. Un vrai profil ferait perdre un œil et les lunettes, donc la
caricature — et le personnage semblerait changer de taille en tournant. Un seul
côté est dessiné : la gauche est un `flipX`, ce qui divise par deux le nombre de
frames à maintenir.

## 3. Échelle : la règle la plus importante

> **1 pixel d'art = 2 unités de monde.**

Tout est dessiné à sa résolution native puis agrandi **×2, jamais autrement**.
Un agrandissement non entier interpole les pixels et détruit le style ; le
générateur refuse d'ailleurs tout facteur non entier.

| Élément | Grille source | Taille en jeu |
| --- | --- | --- |
| Motif de matière (sol, bois, mur…) | 16 × 16 | 32 × 32 |
| Personnage (une frame) | 32 × 32, silhouette dans 16 × 26 | **64 × 64 — imposé** |
| Objet ramassable, porte, effet | 16 × 16 | 32 × 32 |
| Chiffre d'horloge | 8 × 12 | 16 × 24 |
| Trait de contour | 1 | 2 |

Un accessoire libre (plante, imprimante, carton…) n'a pas de gabarit fixe :
il est dessiné à sa taille naturelle puis cuit ×2. Seules les **planches
d'animation** exigent une frame carrée, parce que Phaser les découpe à pas
constant.

> ⚠️ **La frame de 64 × 64 des personnages est imposée par la physique.**
> `Body.setCircle()` conserve l'offset (0,0) du corps : le cercle de collision
> est positionné à partir des dimensions de la FRAME. Changer ce gabarit
> déplacerait toutes les collisions du jeu. Un test le verrouille.
>
> Corollaire assumé : le cercle de collision n'est pas centré sur le
> personnage dessiné. C'est le comportement de la V0.8, donc du gameplay
> réglé et testé — le rendu ne le corrige pas, il fait avec.

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

La seule exception assumée est la **caméra de surveillance** : sa diode
d'enregistrement est rouge parce qu'elle EST un détecteur. Un extincteur, lui,
est peint en `coral` — le rouge du décor n'est jamais celui du danger.

## 4 bis. Familles ajoutées à l'étape 3

| Famille | Clés | Où |
| --- | --- | --- |
| Marbre | `marbleLight/Mid/Seam` | Sol et piliers de l'étage direction |
| Moquette de cadres | `carpetExec`, `carpetExecDark` | Tapis de couloir du niveau 2 |
| Laiton | `brass` | Arêtes, cadres, trophées, étoiles de score |
| Béton | `concreteLight/Mid/Dark` | Murs et piliers du parking |
| Bitume | `asphaltLight/Mid/Dark/Seam` | Sol du parking, places |
| Marquage | `paintLine` | Places de parking. **Le rectangle peint EST la signalétique.** |
| Lumière | `lampGlow`, `neonTube`, `neonDim` | Halos et néons du niveau 3 |
| Caoutchouc | `rubber` | Pneus, roues |
| Tons d'interface | `hudMuted`, `inkFaint`, `stateOk`, `stateIdle`, `alertSoft`, `success`, `info`, `headingWarm` | Hiérarchie de lecture des panneaux |

**Le laiton n'est pas de l'or.** `brass` est plus sombre et moins saturé que
`gold` : il habille sans jamais se faire passer pour une alerte.

**Aucune scène n'écrit une couleur.** Elle choisit un RÔLE dans `TEXT`,
`STATE_TEXT` ou `WORLD_TEXT` (`artTheme.ts`). Un test relit les sources de
`src/scenes/` et `src/ui/` et refuse la moindre valeur hexadécimale.

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

- Gabarit **24 × 26 dans une frame de 32 × 32** : tête très large (≈ la moitié de la hauteur), corps
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
- **La tête est écrite en ASCII, le corps est paramétrique.** La tête ne change
  jamais d'une pose à l'autre : elle reste donc une grille de caractères
  lisible. Le buste et les jambes, eux, bougent à chaque frame : les écrire à
  la main en huit exemplaires serait ingérable et se désynchroniserait.

## 6 bis. Animation

**Une planche par rôle, huit colonnes × trois lignes.**

```
             col 0-1     col 2-5        col 6-7
ligne 0  ┃   repos       marche         sursaut     ┃ face
ligne 1  ┃   repos       marche         sursaut     ┃ tournée (droite)
ligne 2  ┃   repos       marche         sursaut     ┃ dos
```

| État | Frames | Cadence | Boucle |
| --- | --- | --- | --- |
| `idle` | 2 | 2 i/s | oui |
| `walk` | 4 | 8 i/s | oui |
| `run` | **les mêmes 4** | 14 i/s | oui |
| `react` | 2 | 7 i/s | oui, pendant 520 ms |

**Pourquoi la course ne dessine pas ses propres frames.** Quatre poses bien
rythmées jouées plus vite se lisent comme une course. Un second cycle
doublerait la surface de texture et le travail de maintenance pour un gain
qu'on ne voit pas à 24 pixels de haut.

**Les trois principes du cycle de marche**, tous appliqués dans
`tools/art/characters.mjs` :

1. **Les pieds restent au sol.** C'est le corps qui monte d'un pixel sur les
   frames de passage ; la jambe s'allonge d'autant. L'inverse donne un
   personnage qui sautille.
2. **La jambe avancée descend d'un pixel de plus.** C'est le seul indice de
   pas dont on dispose de face.
3. **La main avancée occupe deux lignes.** Un balancement d'un seul pixel est
   invisible en mouvement.

**Règles d'usage, côté code :**

- Une animation ne se **rejoue que si elle change**. Appeler `play()` à chaque
  frame la bloquerait sur sa première image.
- L'orientation se déduit de la **vitesse**, jamais de la direction du cône :
  un vigile qui balaie du regard ne marche pas de côté.
- **À l'arrêt, l'orientation est conservée.** Un PNJ immobile qui se
  retournerait vers le joueur donnerait une information de gameplay fausse.

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
  (départ, sortie, alcôve, moquette de direction, place de parking) sont des
  tapis déclarés **dans la donnée du niveau** (`material`), jamais une couleur
  codée en dur.
- Le décor doit être **habité** : chaises dépareillées, tasses, plantes. Un
  bureau vide n'est pas drôle.

## 7 ter. Une identité par niveau

Un `LevelDef` déclare un `theme`. Ce seul mot choisit le sol, les matières de
chaque type d'obstacle et la vignette du menu. **Aucun niveau ne cite un nom de
fichier.**

| Thème | Sol | Murs & piliers | Meubles | Ce qu'on doit ressentir |
| --- | --- | --- | --- | --- |
| `office` | moquette crème | cloisons bleues | bois | chaleureux, vivant, un peu bordélique |
| `exec` | marbre à dalles | marbre et métal | bois à arête de laiton | propre, organisé, légèrement premium |
| `parking` | bitume | béton brut | **les armoires deviennent des voitures** | sombre, minéral, nocturne |

Le reste — personnages, objets, portes, cônes, bulles, HUD — est **identique
partout**. C'est ce qui fait qu'on reconnaît le jeu d'un étage à l'autre, et
qu'un système interactif ne se réapprend jamais.

## 7 quater. Lumière (niveau 3)

- Un **voile** de nuit sur tout le niveau (`ambient.darkness`).
- Des **halos additifs** aux points déclarés dans `ambient.lights`, plus un
  halo porté par le joueur. Un seul sprite de dégradé, redimensionné : aucune
  texture fabriquée à l'exécution, aucun shader.
- Chaque lampe a son **néon visible** au plafond, au même endroit : on doit
  voir d'où vient la lumière.

> ⚠️ **La lumière ne dit rien sur le gameplay.** `NpcController`, les cônes de
> vision et la détection ne consultent JAMAIS `ambient.lights`. Une zone plus
> claire n'est pas plus dangereuse. C'est du rendu ; en faire une mécanique
> demanderait une décision de game design, pas une passe graphique.

## 7 bis. Objets interactifs et retours visuels

Le principe : **un feedback n'existe que s'il ne concurrence pas les cônes de
vision.** Le jeu ne doit pas virer au sapin de Noël.

| Élément | Retour | Pourquoi |
| --- | --- | --- |
| Objet ramassable | reflet diagonal en 4 frames, **généré** par `sheen()` | un objet ajouté demain hérite de l'animation sans dessin |
| Ramassage | éclat de 4 frames, puis vol de l'objet vers la poche du HUD | on voit *où* va ce qu'on ramasse |
| Porte | 4 frames, du battant fermé à l'embrasure vide | une porte ne doit pas disparaître d'un coup |
| Cachette, porte verrouillée | halo turquoise qui respire, très pâle | dire « ici, quelque chose » sans dire quoi |
| PNJ méfiant | bulle « ? » dorée | |
| PNJ alerté | bulle « ! » rouge **et** bras levés | deux signaux valent mieux qu'un |
| PNJ qui fouille | bulle « … » | |

**Le vol de l'objet s'accroche à l'écran, pas au monde.** La caméra continue de
défiler pendant les 300 ms du trajet : une cible en coordonnées de monde
manquerait la poche de plusieurs dizaines de pixels.

**Les bulles remplacent l'étiquette texte** de l'étape 1. Une glyphe se lit plus
vite qu'un mot, et se distingue par sa **forme** — donc aussi en mode daltonien.
La jauge de détection, elle, reste : c'est de l'information de gameplay.

**La collision d'une porte disparaît d'un coup**, au moment exact où le joueur
l'ouvre ; seul l'habillage prend le temps de s'ouvrir. Le gameplay ne dépend
jamais d'une durée d'animation.

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

## 8 ter. L'interface, version définitive

- **Un seul bandeau** en haut : titre, niveau, horloge, état, pause et les deux
  poches. L'étape 2 en avait trois, qui flottaient séparément et mangeaient le
  haut du terrain.
- **L'horloge occupe le coin le plus stable de l'écran** et rien ne vient
  jamais s'y superposer. Sur l'écran de fin, elle passe en ×2 et devient
  l'élément dominant : c'est la phrase que le joueur racontera.
- Les commandes restent dans les deux coins bas — joystick d'un côté, course et
  interaction de l'autre, côté réglable. Aucun élément d'information n'y
  descend.
- Les messages contextuels apparaissent **au-dessus des commandes**, jamais au
  milieu du terrain.
- Panneaux modaux : bandeau de titre en incrustation, puce de conséquence sous
  chaque choix, arrivée en fondu de 160 ms.
- **Transitions** : 190 ms à l'entrée d'une scène, 150 ms à la sortie. Plus
  long, sur mobile, se ressent comme une latence.

## 8 bis. Conventions de planche

- Une planche est une **bande ou une grille de frames CARRÉES** de taille
  constante : `load.spritesheet` découpe à pas fixe et ne signale rien s'il
  tombe à côté. Un sprite plus petit est centré dans sa frame par le
  générateur (`ITEM_FRAME`), jamais rogné.
- **Tout se déclare dans `src/game/animations.ts`** : taille de frame, nombre
  de frames, indices, cadence, boucle. `BootScene` déroule ces tables ; aucune
  scène ne crée d'animation ni ne connaît un découpage.
- Les tests vérifient que chaque PNG livré contient **exactement** le nombre de
  frames annoncé, et qu'aucune animation ne pointe hors bornes.
- Dossiers : `characters/`, `tiles/`, `props/`, `fx/`, `ui/`. Une planche
  d'effet va dans `fx/`, jamais dans `props/`.

## 9. Cohérence : les sept règles

1. **1 pixel d'art = 2 unités de monde.** Agrandissement entier uniquement.
2. **Aucune couleur hors de `palette.json`.**
3. **`gold` et `alert` sont réservés à la détection.**
4. **Tout solide porte un contour `ink` de 1 pixel.**
5. **Décor de dessus strict, personnages de face.**
6. **Le cadre des personnages reste 64 × 64.**
7. **Un niveau reste une donnée** : une matière de sol se déclare dans le
   `LevelDef`, jamais dans une scène.
8. **Une animation se déclare dans `animations.ts`**, jamais dans une scène.
9. **`gold` et `alert` restent réservés** — y compris pour les bulles, qui
   font justement partie du système de détection.

## 10. Limites assumées de l'étape 3

- **Pas d'occlusion lumineuse.** Un halo traverse les piliers : la lumière est
  un dégradé posé par-dessus, pas un calcul de visibilité. Faire mieux
  coûterait un masque par frame, pour un gain que la nuit du parking ne rend
  pas visible.
- **Pas d'animation d'attente ni de dialogue.** Un PNJ arrêté respire, mais ne
  regarde pas sa montre ; l'interlocuteur ne gesticule pas quand il parle.
- **Pas de transition entre orientations.** Le personnage change de ligne d'un
  coup, sans frame de rotation. À cette taille, personne ne le voit.
- **La silhouette tournée reste proche de la vue de face** : les deux vues se
  distinguent par la coiffure et les accessoires, pas par une vraie rotation
  des épaules. Assumé — c'est le prix de la lisibilité du visage.
- **Les voitures du parking sont des rectangles habillés**, pas des sprites de
  voiture : ce sont des obstacles de taille arbitraire, donc une matière et un
  toit vitré, jamais une silhouette dessinée.
- **Police système pour tout sauf l'horloge** (voir §8).
- **Un PNG par planche, pas d'atlas** : 78 fichiers, 56 Ko au total (dont
  19 Ko pour le seul diorama du menu). Le regroupement en atlas n'a de sens
  qu'à partir de quelques centaines d'assets.
- **Les seuils d'étoiles des niveaux 2 et 3 restent des estimations.** Ce n'est
  pas du graphisme, mais ça se voit sur l'écran de fin.

## 11. Comment produire un asset

```bash
npm run art        # régénère tout public/assets/ depuis tools/art/
```

Les sprites sont écrits en **ASCII lisible** dans `tools/art/` : une grille de
caractères et une légende qui relie chaque caractère à la palette. Le
générateur vérifie que les lignes ont toutes la même longueur et refuse les
couleurs absentes de la palette.

| Fichier | Contenu |
| --- | --- |
| `characters.mjs` | les six rôles, leurs poses et leurs accessoires |
| `tiles.mjs` | motifs de matière raccordables |
| `props.mjs` | accessoires, objets ramassables, porte animée |
| `fx.mjs` | bulles d'émotion, éclat de ramassage, halo d'interaction |
| `ui.mjs` | panneaux, boutons, chiffres d'horloge |
| `menu.mjs` | diorama du menu, composé des mêmes sprites |

**Ajouter un personnage** : une entrée dans `CHARACTERS` (couleurs + accessoire
signature), une clé dans `CHARACTER_SHEETS` et `CHARACTER_TEXTURES`. Les huit
poses, les trois orientations et les quatre animations sont générées et
déclarées automatiquement.

**Ajouter un accessoire de décor** : un sprite dans `PROPS`, une valeur dans
`PropKind`, une entrée dans `PROP_TEXTURES` et `IMAGE_MANIFEST`. Il devient
posable dans n'importe quel `LevelDef` sans toucher à une scène.

Un graphiste qui préfère son propre outil peut **remplacer n'importe quel PNG**
de `public/assets/` sans toucher au code, tant qu'il respecte les dimensions du
tableau du §3.

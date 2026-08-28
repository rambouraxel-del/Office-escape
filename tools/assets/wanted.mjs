/**
 * Fiches des assets qu'il reste à fournir.
 *
 * Chaque entrée correspond à un `ASSET_TODO:` posé dans le code. Le script
 * `npm run assets:report` recoupe les deux : un tag sans fiche, ou une fiche
 * sans tag, se voit immédiatement.
 *
 * Les tailles sont données EN PIXELS DE LA PLANCHE FOURNIE, c'est-à-dire au
 * double de l'échelle du jeu — comme le lot V0.11, que l'import réduit d'un
 * facteur 2. C'est la convention à respecter pour les prochaines livraisons.
 *
 * V0.12 — la liste a fondu. Elle ne décrit plus un catalogue de mobilier mais
 * le strict nécessaire : les MATIÈRES qui distinguent les trois niveaux, et un
 * seul accessoire par FONCTION de pièce. Les fiches supprimées (réceptionniste,
 * stagiaire, agent d'entretien, poste de travail portrait) l'ont été en
 * modifiant les niveaux pour qu'ils réutilisent l'existant, pas en dessinant.
 */
export const WANTED = [
  {
    name: 'mur_top_down_raccordable',
    title: 'Mur raccordable vu de dessus (3 variantes)',
    category: 'architecture',
    usage:
      'les trois niveaux — tous les murs, cloisons et piliers ; le jeu de murs fourni en V0.11 est en élévation et suppose un auto-tuilage',
    size: 'par variante : un motif carré raccordable de 128 × 128, plus une arête haute de 128 × 32',
    view: 'dessus strict, comme les sols fournis',
    description:
      'le moteur habille des RECTANGLES de taille arbitraire en étirant un motif : il lui faut une matière raccordable, pas des segments d’angle. Une tuile de corps plus une bande d’arête suffisent — le contour et l’ombre portée sont dessinés par le jeu. Trois variantes, une par thème : plâtre clair (bureau), marbre (direction), béton (parking). C’est le poste qui change le plus l’allure du jeu pour le moins d’assets.',
    animation: 'aucune',
    priority: 'haute'
  },
  {
    name: 'char_collegue_bavard',
    title: 'Collègue bavard',
    category: 'personnage',
    usage: 'niveau 1 — interlocuteur du dialogue ; utilise pour l’instant la planche RH',
    size: '768 × 384 (6 colonnes × 3 lignes de 128 × 128)',
    view: 'dessus 3/4, même convention que le lot V0.11 : colonnes 0-1 face, 2-3 dos, 4-5 profil vers la DROITE',
    description:
      'collègue exubérant, chemise claire, bouche ouverte en permanence, gestuelle large ; c’est le seul PNJ qu’on aborde volontairement, il doit donner envie de lui parler',
    animation: '3 lignes = repos, marche, réaction',
    priority: 'haute'
  },
  {
    name: 'voiture_top_down',
    title: 'Voiture garée, vue de dessus',
    category: 'mobilier',
    usage:
      'niveau 3 — les seize véhicules du parking ; ils sont aujourd’hui habillés d’un simple motif de carrosserie étiré',
    size: '240 × 140 (le rectangle de collision fait 120 × 70 unités de jeu)',
    view: 'dessus strict, capot vers la GAUCHE',
    description:
      'une berline banale, garée : toit, pare-brise, lunette arrière, deux rétroviseurs. Les places sont perpendiculaires à l’allée centrale, d’où le format paysage : le jeu retourne la planche pour la rangée d’en face. Une seule voiture suffit — elle est répétée six fois. Si deux teintes sont faciles à livrer, elles casseront la répétition ; ce n’est pas indispensable.',
    animation: 'aucune',
    priority: 'haute'
  },
  {
    name: 'camera_surveillance',
    title: 'Caméra de surveillance',
    category: 'mobilier',
    usage: 'niveau 2 — les deux caméras à balayage ; c’est un PNJ, pas un décor',
    size: '96 × 96 par frame, planche de 2 frames (192 × 96)',
    view: 'dessus 3/4, objectif vers le BAS',
    description:
      'caméra fixée au plafond, corps sombre, objectif clair, diode d’enregistrement. Le jeu la fait pivoter : le sprite doit rester lisible sous n’importe quel angle.',
    animation: '2 frames : diode éteinte, diode allumée',
    priority: 'haute'
  },
  {
    name: 'distributeur',
    title: 'Distributeur automatique',
    category: 'mobilier',
    usage: 'niveau 1 (coin pause) et niveau 3 (hall d’ascenseurs) — le prop signature du coin pause',
    size: '112 × 144 (le gabarit généré actuel, 56 × 40, est volontairement sous-dimensionné)',
    view: 'dessus 3/4, façade vers le BAS',
    description: 'grande vitrine éclairée, rangées de produits, fente de retrait ; c’est lui qui dit « on peut souffler ici »',
    animation: 'aucune',
    priority: 'moyenne'
  },
  {
    name: 'wc_top_down',
    title: 'Cuvette de WC',
    category: 'mobilier',
    usage: 'niveau 1 — les deux cabines des toilettes',
    size: '64 × 96',
    view: 'dessus strict, réservoir vers le HAUT',
    description: 'cuvette blanche, abattant, réservoir ; sobre, sans détail comique',
    animation: 'aucune',
    priority: 'moyenne'
  },
  {
    name: 'lavabo_top_down',
    title: 'Lavabo',
    category: 'mobilier',
    usage: 'niveau 1 — le lavabo des toilettes',
    size: '96 × 64',
    view: 'dessus strict, robinet vers le HAUT',
    description: 'vasque blanche encastrée, robinet chromé ; même famille de blancs que la cuvette',
    animation: 'aucune',
    priority: 'moyenne'
  },
  {
    name: 'tableau_blanc',
    title: 'Tableau blanc',
    category: 'mobilier',
    usage: 'niveaux 1 et 2 — le prop signature de la salle de réunion',
    size: '160 × 48',
    view: 'dessus 3/4, adossé à un mur, vu depuis la salle',
    description: 'tableau blanc mural, réglette de feutres, quelques traces de schéma effacé',
    animation: 'aucune',
    priority: 'moyenne'
  },
  {
    name: 'baie_serveur',
    title: 'Baie de serveurs',
    category: 'mobilier',
    usage: 'niveaux 2 et 3 — le prop signature du local technique',
    size: '96 × 128',
    view: 'dessus 3/4, façade vers le BAS',
    description: 'armoire noire, façades ajourées, nappes de diodes ; deux exemplaires côte à côte suffisent à faire un local',
    animation: 'aucune',
    priority: 'moyenne'
  },
  {
    name: 'lecteur_badge',
    title: 'Lecteur de badge',
    category: 'mobilier',
    usage: 'niveau 2 (porte à badge) et niveau 3 (porte de l’ascenseur) — c’est de l’INFORMATION de gameplay',
    size: '48 × 64',
    view: 'dessus 3/4, adossé au mur',
    description:
      'boîtier mural, surface de lecture, diode. Le joueur doit comprendre au premier regard qu’il lui faut un badge : ce sprite porte une règle du jeu, pas une décoration.',
    animation: 'aucune',
    priority: 'moyenne'
  },
  {
    name: 'objets_gameplay',
    title: 'Les quatre objets ramassables',
    category: 'objet',
    usage: 'les trois niveaux — donut, café, badge, rapport ; ce sont les seuls objets qu’on ramasse',
    size: '4 planches de 256 × 64 (4 frames de 64 × 64)',
    view: 'dessus 3/4, posés au sol',
    description:
      'donut glacé, gobelet de café, badge d’accès, rapport relié. Ils doivent se distinguer d’un coup d’œil dans le noir du niveau 3 — c’est le seul endroit du jeu où une couleur vive est justifiée.',
    animation: '4 frames : un reflet qui balaie l’objet, en boucle lente',
    priority: 'moyenne'
  },
  {
    name: 'plante_bureau',
    title: 'Plante verte',
    category: 'mobilier',
    usage: 'niveaux 1 et 2 — la respiration des couloirs, posée douze fois',
    size: '64 × 80',
    view: 'dessus 3/4',
    description: 'plante en pot, feuillage large ; un seul modèle, répété',
    animation: 'aucune',
    priority: 'faible'
  },
  {
    name: 'signaletique',
    title: 'Signalétique : panneau de sortie, tube néon, cône',
    category: 'mobilier',
    usage: 'les trois niveaux — sorties, éclairage du parking, balisage du local technique',
    size: 'panneau 80 × 32, néon 192 × 96 (planche de 2 frames de 96 × 96), cône 48 × 48',
    view: 'panneau et néon accrochés en hauteur, cône vu de dessus',
    description:
      'trois pièces plates, presque des pictogrammes. Elles fonctionnent correctement en généré : à ne livrer que si le reste est fait.',
    animation: 'néon : 2 frames, une frange qui s’éteint',
    priority: 'faible'
  }
];

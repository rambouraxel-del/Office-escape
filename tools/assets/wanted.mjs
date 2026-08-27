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
 */
export const WANTED = [
  {
    name: 'char_stagiaire',
    title: 'Stagiaire',
    category: 'personnage',
    usage: 'niveaux 2 et 3 — PNJ « STAGIAIRE » ; utilise pour l’instant la planche du technicien informatique',
    size: '768 × 384 (6 colonnes × 3 lignes de 128 × 128)',
    view: 'dessus 3/4, même convention que le lot V0.11 : colonnes 0-1 face, 2-3 dos, 4-5 profil vers la DROITE',
    description:
      'jeune stagiaire, casque audio sur les oreilles, sweat à capuche bleu, allure décontractée ; la silhouette doit se distinguer du technicien informatique au premier coup d’œil',
    animation: '3 lignes = repos, marche, réaction (bouche ouverte de face)',
    priority: 'haute'
  },
  {
    name: 'char_collegue_bavard',
    title: 'Collègue bavard',
    category: 'personnage',
    usage: 'niveau 1 — interlocuteur du dialogue ; utilise pour l’instant la planche RH',
    size: '768 × 384 (6 colonnes × 3 lignes de 128 × 128)',
    view: 'dessus 3/4, même convention que le lot V0.11',
    description:
      'collègue exubérant, chemise claire, bouche ouverte en permanence, gestuelle large ; c’est le seul PNJ qu’on aborde volontairement, il doit donner envie de lui parler',
    animation: '3 lignes = repos, marche, réaction',
    priority: 'haute'
  },
  {
    name: 'char_receptionniste',
    title: 'Réceptionniste',
    category: 'personnage',
    usage: 'archétype déclaré, pas encore posé dans un niveau ; utilise la planche RH',
    size: '768 × 384 (6 colonnes × 3 lignes de 128 × 128)',
    view: 'dessus 3/4, même convention que le lot V0.11',
    description: 'accueil, chemisier prune, sourire de façade, badge visible',
    animation: '3 lignes = repos, marche, réaction',
    priority: 'faible'
  },
  {
    name: 'char_agent_entretien',
    title: 'Agent d’entretien',
    category: 'personnage',
    usage: 'archétype déclaré, pas encore posé dans un niveau ; utilise la planche du vigile',
    size: '768 × 384 (6 colonnes × 3 lignes de 128 × 128)',
    view: 'dessus 3/4, même convention que le lot V0.11',
    description: 'tenue de travail bleue, casquette, carrure large ; complète le local ménage du niveau 3',
    animation: '3 lignes = repos, marche, réaction',
    priority: 'faible'
  },
  {
    name: 'mur_top_down_raccordable',
    title: 'Mur raccordable vu de dessus',
    category: 'architecture',
    usage:
      'les trois niveaux — tous les murs, cloisons et piliers ; le jeu de murs fourni en V0.11 est en élévation et suppose un auto-tuilage',
    size: 'un motif carré raccordable de 128 × 128, plus une arête haute de 128 × 32',
    view: 'dessus strict, comme les sols fournis',
    description:
      'le moteur habille des RECTANGLES de taille arbitraire en étirant un motif : il lui faut une matière raccordable, pas des segments d’angle. Une seule tuile de corps plus une bande d’arête suffisent — le contour et l’ombre portée sont dessinés par le jeu. Trois variantes : plâtre clair (bureau), marbre (direction), béton (parking)',
    animation: 'aucune',
    priority: 'haute'
  },
  {
    name: 'poste_de_travail_portrait',
    title: 'Poste de travail, orientation portrait',
    category: 'mobilier',
    usage: 'niveaux 1 et 2 — les six bureaux dont le rectangle de collision est vertical (90 × 105 unités)',
    size: '192 × 256 (le poste fourni est son symétrique : 256 × 192)',
    view: 'dessus 3/4, identique à desk-standard.png',
    description:
      'le même bureau équipé que desk-standard.png, mais dans le sens de la hauteur : écran, clavier, tasse, parapheur. Sans lui, ces six bureaux gardent des accessoires épars et rompent l’unité visuelle des postes',
    animation: 'aucune',
    priority: 'moyenne'
  }
];

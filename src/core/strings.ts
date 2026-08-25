/**
 * Tous les textes d'interface.
 *
 * Rassemblés ici pour rendre une traduction possible : aucune chaîne visible ne
 * doit être écrite en dur dans une scène. Les textes de CONTENU (niveaux,
 * dialogues) vivent avec leur niveau dans `src/levels/`.
 */
export const FR = {
  app: {
    title: 'OFFICE ESCAPE',
    tagline: 'Rentrer chez soi est un sport de combat.'
  },
  menu: {
    play: 'QUITTER LE BUREAU  →',
    daily: '📅  DÉFI DU JOUR',
    levels: 'NIVEAUX',
    settings: 'RÉGLAGES',
    back: '← RETOUR',
    reset: 'RÉINITIALISER LA PROGRESSION',
    resetDone: 'Progression et records effacés.',
    locked: '🔒 Termine le niveau précédent',
    record: 'Record',
    noRecord: 'Aucun record',
    dailySeed: 'Seed du jour',
    dailyDone: 'Défi du jour terminé',
    starTargets: 'Objectifs',
    pitch: 'Trois niveaux. Une seule envie : partir.'
  },
  settings: {
    title: 'RÉGLAGES',
    sound: 'Sons',
    motion: 'Animations réduites',
    colorBlind: 'Mode daltonien',
    textScale: 'Taille du texte',
    joystick: 'Joystick',
    vibrations: 'Vibrations',
    on: 'ACTIVÉ',
    off: 'COUPÉ',
    left: 'GAUCHE',
    right: 'DROITE',
    hintColorBlind: 'Hachures sur les cônes en alerte.',
    hintMotion: 'Supprime flashs et secousses de caméra.'
  },
  hud: {
    pause: 'II',
    empty: '—',
    discreet: 'DISCRET',
    scanning: 'REPÉRAGE…',
    chase: 'POURSUITE',
    hidden: 'CACHÉ',
    dialogue: 'DISCUSSION',
    paused: 'PAUSE',
    search: 'FOUILLE'
  },
  controls: {
    run: '➜\nCOURIR',
    enter: 'ENTRER',
    leave: 'SORTIR',
    pick: 'RAMASSER',
    open: 'OUVRIR',
    use: 'UTILISER'
  },
  pause: {
    title: 'PAUSE',
    body: 'Patrouilles arrêtées.\nChaque pause manuelle coûte +1 minute.',
    resume: 'REPRENDRE',
    quit: 'ABANDONNER',
    autoBody: 'Partie suspendue : l’application était en arrière-plan.\nAucune pénalité.'
  },
  toasts: {
    hiddenOn: 'Tu es caché. Le temps continue.',
    hiddenBlocked: 'Attends : le passage est bloqué !',
    hiddenOff: 'La voie est libre.',
    inventoryFull: 'Poches pleines : utilise un objet d’abord.',
    doorLocked: 'Porte verrouillée. Il te faut un badge.',
    doorOpened: 'Badge accepté. La porte s’ouvre.',
    exitOpen: 'La sortie est libre !',
    pausePenalty: 'Pause : +1 minute.',
    ghostOn: 'Ton record précédent court avec toi.'
  },
  items: {
    donut: { name: 'Donut', icon: '🍩', use: 'Monnaie d’échange sociale.' },
    coffee: { name: 'Café', icon: '☕', use: 'Accélère pendant 15 secondes.' },
    badge: { name: 'Badge', icon: '🔑', use: 'Ouvre les portes verrouillées.' },
    report: { name: 'Rapport', icon: '📄', use: 'À lâcher pour attirer l’attention.' }
  },
  itemFeedback: {
    picked: (name: string, count: number, total: number) => `${name} récupéré · ${count}/${total} poche(s)`,
    coffee: 'Café avalé : 15 secondes de vitesse.',
    report: 'Rapport lâché : ils vont aller voir.',
    badgeKept: 'Le badge reste dans ta poche.'
  },
  result: {
    escaped: 'SORTIE',
    intercepted: 'INTERCEPTÉ !',
    overtime: 'HEURES SUP !',
    overtimeBody:
      'Le bureau est vide. Même l’équipe de ménage est partie.\nIl est vraiment temps de rentrer.',
    retry: 'RECOMMENCER',
    next: 'NIVEAU SUIVANT  →',
    menu: 'MENU',
    replay: 'REJOUER',
    newRecord: 'NOUVEAU RECORD !',
    scoreTime: 'Chrono',
    scoreStealth: 'Discrétion',
    scoreCollection: 'Collecte',
    scoreTotal: 'TOTAL',
    abandoned: 'Tu es remonté à ton bureau.\nLa journée n’était pas finie, finalement.',
    caughtByVision: (npc: string, at: string) => `${npc} t’a repéré à ${at}.`,
    caughtByContact: (npc: string, at: string) => `Tu as bousculé ${npc} à ${at}.`
  },
  tutorial: {
    close: 'Touchez la bulle pour fermer'
  },
  dialogue: {
    freeze: 'Le temps est arrêté pendant le dialogue.',
    win: 'ÇA PASSE !',
    lose: 'AÏE…',
    continue: 'CONTINUER',
    /** Le choix exige un objet que le joueur n'a pas. */
    requires: (item: string) => `${item} requis`,
    /** Conséquence lisible d'un choix, une fois joué. */
    gain: (minutes: number) => `−${Math.abs(minutes)} min`,
    cost: (minutes: number) => `+${minutes} min`,
    neutral: 'Aucune minute perdue'
  }
} as const;

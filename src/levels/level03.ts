import type { LevelDef } from '../game/types';

/**
 * Niveau 3 — le parking, de nuit.
 * Nouvelles mécaniques : obscurité (le joueur porte sa propre lumière), vigile
 * à lampe torche (cône long et étroit) et rapport à lâcher comme diversion.
 */
export const LEVEL_03: LevelDef = {
  id: 'level-03',
  name: 'LE PARKING',
  subtitle: 'MISSION 03  •  21 H, IL FAIT NUIT',
  briefing:
    'Ta voiture est au fond du niveau −2.\nUn vigile fait sa ronde à la lampe.\n\nObscurité · Diversion · Ne traîne pas',
  size: { w: 500, h: 2200 },
  theme: 'parking',
  // Éclairage : un voile de nuit plus dense qu'en V0.9.1, percé par des néons
  // FIXES. Ces lampes sont PUREMENT visuelles — la détection ne les consulte
  // jamais, sinon ce serait une mécanique, pas un rendu.
  ambient: {
    // Le décor reste LISIBLE : on doit voir où l'on met les pieds. Ce sont les
    // PNJ, les objets et les indices qui disparaissent hors du halo.
    darkness: 0.58,
    revealRadius: 210,
    hiddenAlpha: 0.1,
    lights: [
      { x: 250, y: 2010, radius: 210 },
      { x: 250, y: 1450, radius: 230 },
      { x: 250, y: 950, radius: 230 },
      { x: 250, y: 450, radius: 210 },
      { x: 90, y: 1720, radius: 150, intensity: 0.5 },
      { x: 430, y: 1180, radius: 150, intensity: 0.5 },
      { x: 90, y: 620, radius: 150, intensity: 0.5 },
      { x: 250, y: 120, radius: 240, intensity: 0.9 }
    ]
  },
  spawn: { x: 250, y: 2060 },

  obstacles: [
    { x: 21, y: 1100, w: 42, h: 2200, kind: 'wall' },
    { x: 479, y: 1100, w: 42, h: 2200, kind: 'wall' },
    { x: 250, y: 20, w: 500, h: 40, kind: 'wall' },
    { x: 250, y: 2180, w: 500, h: 40, kind: 'wall' },

    { x: 95, y: 1900, w: 120, h: 70, kind: 'cabinet' },
    { x: 405, y: 1900, w: 120, h: 70, kind: 'cabinet' },
    { x: 250, y: 1700, w: 90, h: 150, kind: 'pillar' },

    { x: 77, y: 1330, w: 105, h: 190, kind: 'cabinet', label: 'ESCALIER' },
    { x: 420, y: 1450, w: 120, h: 70, kind: 'cabinet' },

    { x: 120, y: 1080, w: 90, h: 150, kind: 'pillar' },
    { x: 380, y: 1080, w: 90, h: 150, kind: 'pillar' },

    { x: 90, y: 820, w: 120, h: 70, kind: 'cabinet' },
    { x: 410, y: 820, w: 120, h: 70, kind: 'cabinet' },
    { x: 250, y: 620, w: 90, h: 150, kind: 'pillar' },

    { x: 95, y: 165, w: 150, h: 30, kind: 'wall' },
    { x: 405, y: 165, w: 150, h: 30, kind: 'wall' }
  ],

  decor: [
    { kind: 'zone', x: 250, y: 2075, w: 300, h: 110, material: 'neutral', text: 'ASCENSEUR' },
    { kind: 'zone', x: 250, y: 92, w: 286, h: 108, material: 'exit', text: 'TA VOITURE  ↑' },

    // Places matérialisées : le rectangle peint EST la signalétique. Occupées
    // là où le niveau pose déjà une voiture, vides ailleurs.
    { kind: 'zone', x: 95, y: 1900, w: 136, h: 92, material: 'bay' },
    { kind: 'zone', x: 405, y: 1900, w: 136, h: 92, material: 'bay' },
    { kind: 'zone', x: 420, y: 1450, w: 136, h: 92, material: 'bay' },
    { kind: 'zone', x: 90, y: 820, w: 136, h: 92, material: 'bay' },
    { kind: 'zone', x: 410, y: 820, w: 136, h: 92, material: 'bay' },
    { kind: 'zone', x: 405, y: 1250, w: 136, h: 92, material: 'bay' },
    { kind: 'zone', x: 95, y: 1600, w: 136, h: 92, material: 'bay' },
    { kind: 'zone', x: 405, y: 600, w: 136, h: 92, material: 'bay' },

    { kind: 'prop', x: 250, y: 44, prop: 'exitSign' },
    { kind: 'text', x: 250, y: 1490, text: 'NIVEAU −1', size: 13, tone: 'cool' },
    { kind: 'text', x: 250, y: 960, text: 'NIVEAU −2', size: 13, tone: 'cool' },
    { kind: 'text', x: 250, y: 400, text: 'RAMPE DE SORTIE', size: 12, tone: 'cool' },
    { kind: 'text', x: 95, y: 1962, text: 'A-04', size: 10, tone: 'quiet' },
    { kind: 'text', x: 405, y: 1962, text: 'A-05', size: 10, tone: 'quiet' },
    { kind: 'text', x: 95, y: 1662, text: 'A-11', size: 10, tone: 'quiet' },
    { kind: 'text', x: 405, y: 1312, text: 'B-02', size: 10, tone: 'quiet' },
    { kind: 'text', x: 405, y: 662, text: 'C-07', size: 10, tone: 'quiet' },

    // Néons du plafond : ils marquent les mêmes points que les lampes de
    // `ambient.lights`, pour qu'on VOIE d'où vient la lumière.
    { kind: 'prop', x: 250, y: 2010, prop: 'neon' },
    { kind: 'prop', x: 250, y: 1450, prop: 'neon' },
    { kind: 'prop', x: 250, y: 950, prop: 'neon' },
    { kind: 'prop', x: 250, y: 450, prop: 'neon' },

    { kind: 'prop', x: 95, y: 166, prop: 'parkingSign' },
    { kind: 'prop', x: 405, y: 166, prop: 'parkingSign' },
    { kind: 'prop', x: 250, y: 1610, prop: 'extinguisher' },
    { kind: 'prop', x: 120, y: 990, prop: 'extinguisher' },
    { kind: 'prop', x: 380, y: 990, prop: 'extinguisher' },

    { kind: 'prop', x: 196, y: 1520, prop: 'cone' },
    { kind: 'prop', x: 304, y: 1210, prop: 'cone' },
    { kind: 'prop', x: 196, y: 320, prop: 'cone' },
    { kind: 'prop', x: 56, y: 2054, prop: 'barrier' },
    { kind: 'prop', x: 444, y: 2054, prop: 'barrier' },
    { kind: 'prop', x: 444, y: 1780, prop: 'bike' },
    { kind: 'prop', x: 56, y: 1010, prop: 'cart' },
    { kind: 'prop', x: 56, y: 1740, prop: 'crate' },
    { kind: 'prop', x: 444, y: 1150, prop: 'crate' },
    { kind: 'prop', x: 56, y: 600, prop: 'tire' },
    { kind: 'prop', x: 444, y: 880, prop: 'tire' },
    { kind: 'prop', x: 56, y: 300, prop: 'trash' },
    { kind: 'prop', x: 444, y: 420, prop: 'boxes' },

    // Deux plantes oubliées près de l'ascenseur : le seul geste chaleureux du
    // niveau, et il est raté.
    { kind: 'prop', x: 55, y: 1880, prop: 'cactus' },
    { kind: 'prop', x: 444, y: 1620, prop: 'cactus' }
  ],

  npcs: [
    {
      id: 'guard',
      label: 'VIGILE',
      archetype: 'guard',
      patrol: [
        { x: 250, y: 1500 },
        { x: 250, y: 400 },
        { x: 420, y: 400 },
        { x: 420, y: 1500 }
      ],
      // Le vigile couvre la moitié droite du parking et la rampe.
      roam: { x: 320, y: 950, w: 300, h: 1180 },
      patrolSpeed: 92,
      chaseSpeed: 150,
      // Lampe torche : loin, très étroit. Contournable si on l'observe.
      visionRange: 330,
      visionHalfAngleDeg: 14
    },
    {
      id: 'late-colleague',
      label: 'COLLÈGUE TARDIF',
      archetype: 'colleague',
      patrol: [
        { x: 120, y: 1850 },
        { x: 120, y: 1200 }
      ],
      roam: { x: 150, y: 1520, w: 180, h: 660 },
      patrolSpeed: 74,
      chaseSpeed: 112,
      visionRange: 200,
      visionHalfAngleDeg: 24
    },
    {
      id: 'cleaner',
      label: 'AGENT D’ENTRETIEN',
      archetype: 'intern',
      patrol: [
        { x: 250, y: 300 },
        { x: 120, y: 300 },
        { x: 120, y: 700 },
        { x: 250, y: 700 }
      ],
      roam: { x: 190, y: 500, w: 220, h: 440 },
      patrolSpeed: 68,
      chaseSpeed: 104,
      visionRange: 195,
      visionHalfAngleDeg: 24
    }
  ],

  items: [
    { id: 'report', at: { x: 250, y: 1560 } },
    { id: 'coffee', at: { x: 420, y: 1700 } }
  ],

  hidingSpots: [{ id: 'stairs', door: { x: 140, y: 1330 }, exit: { x: 172, y: 1330 }, label: 'ESCALIER' }],

  triggers: [
    { id: 'watchman', kind: 'dialogue', zone: { x: 250, y: 290, w: 460, h: 110 }, payload: 'watchman' },
    { id: 'exit', kind: 'exit', zone: { x: 250, y: 90, w: 460, h: 110 }, requiresDialoguesResolved: true }
  ],

  dialogues: [
    {
      id: 'watchman',
      speaker: 'CHEF DE SÉCURITÉ',
      speakerAfter: 'CHEF DE SÉCURITÉ APAISÉ',
      heading: '« On ferme, vous savez. »',
      body: 'Il note les départs sur un carnet.\nChoisis ta sortie :',
      choices: [
        {
          id: 'coffee',
          title: '☕  Lui tendre le café',
          detail: '100 % · aucune pénalité',
          requiresItem: 'coffee',
          successChance: 1,
          penaltyMinutes: 0,
          rewardMinutes: 0,
          successText: '« Vous, vous comprenez la vie. »\nIl lève la barrière.',
          failureText: ''
        },
        {
          id: 'sign',
          title: 'Signer le carnet sans discuter',
          detail: '80 % · échec : +9 min',
          successChance: 0.8,
          penaltyMinutes: 9,
          rewardMinutes: 0,
          successText: 'Signature, poignée de main, terminé.\nAucune minute perdue.',
          failureText: 'Le stylo ne marche pas. Puis la page. Puis l’anecdote.\n+9 minutes.'
        },
        {
          id: 'bluff',
          title: '« Je suis déjà parti à 18 h »',
          detail: '40 % · réussite : −5 min · échec : +20 min',
          successChance: 0.4,
          penaltyMinutes: 20,
          rewardMinutes: -5,
          successText: 'Il raye la ligne. Officiellement, tu n’étais pas là.\n5 minutes gagnées !',
          failureText: 'Il consulte les caméras. Longuement.\n+20 minutes.'
        }
      ]
    }
  ],

  tutorials: [
    {
      id: 'dark',
      text: 'Il fait noir : tu ne vois que ton halo, eux aussi.',
      anchor: 'player',
      when: { movedFromSpawn: 60 }
    },
    {
      id: 'report',
      text: 'Ramasse le rapport : lâché, il attire les rondes ailleurs.',
      anchor: { x: 250, y: 1440 },
      when: { after: 'dark', itemPending: 'report', nearPoint: { at: { x: 250, y: 1560 }, radius: 200 } }
    },
    {
      id: 'use',
      text: 'Touche une poche du HUD pour utiliser l’objet.',
      anchor: 'player',
      when: { after: 'report', hasItem: 'report' }
    }
  ],

  clock: { startHour: 21, startMinute: 0, msPerMinute: 5000, failAtHour: 26 },
  stars: [26, 40, 58]
};

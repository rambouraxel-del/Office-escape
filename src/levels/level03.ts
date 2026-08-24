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
  ambient: { darkness: 0.66, floor: 0x3a3f4a, floorAlt: 0x333844 },
  spawn: { x: 250, y: 2060 },

  obstacles: [
    { x: 21, y: 1100, w: 42, h: 2200, kind: 'wall' },
    { x: 479, y: 1100, w: 42, h: 2200, kind: 'wall' },
    { x: 250, y: 20, w: 500, h: 40, kind: 'wall' },
    { x: 250, y: 2180, w: 500, h: 40, kind: 'wall' },

    { x: 95, y: 1900, w: 120, h: 70, kind: 'cabinet', label: 'VOITURE' },
    { x: 405, y: 1900, w: 120, h: 70, kind: 'cabinet', label: 'VOITURE' },
    { x: 250, y: 1700, w: 90, h: 150, kind: 'pillar' },

    { x: 77, y: 1330, w: 105, h: 190, kind: 'cabinet', label: 'ESCALIER' },
    { x: 420, y: 1450, w: 120, h: 70, kind: 'cabinet', label: 'VOITURE' },

    { x: 120, y: 1080, w: 90, h: 150, kind: 'pillar' },
    { x: 380, y: 1080, w: 90, h: 150, kind: 'pillar' },

    { x: 90, y: 820, w: 120, h: 70, kind: 'cabinet', label: 'VOITURE' },
    { x: 410, y: 820, w: 120, h: 70, kind: 'cabinet', label: 'VOITURE' },
    { x: 250, y: 620, w: 90, h: 150, kind: 'pillar' },

    { x: 95, y: 165, w: 150, h: 30, kind: 'wall' },
    { x: 405, y: 165, w: 150, h: 30, kind: 'wall' }
  ],

  decor: [
    { kind: 'zone', x: 250, y: 2075, w: 300, h: 110, material: 'neutral', text: 'ASCENSEUR' },
    { kind: 'zone', x: 250, y: 92, w: 286, h: 108, material: 'exit', text: 'TA VOITURE  ↑' },
    { kind: 'text', x: 250, y: 1560, text: 'NIVEAU −1', size: 13, color: 0x8a93a3 },
    { kind: 'text', x: 250, y: 960, text: 'NIVEAU −2', size: 13, color: 0x8a93a3 },
    { kind: 'text', x: 250, y: 400, text: 'RAMPE DE SORTIE', size: 12, color: 0x9b8b78 },
    { kind: 'plant', x: 55, y: 1600, scale: 0.7 },
    { kind: 'plant', x: 448, y: 700, scale: 0.7 }
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
      patrolSpeed: 92,
      chaseSpeed: 150,
      // Lampe torche : très loin, très étroit. Contournable si on l'observe.
      visionRange: 430,
      visionHalfAngleDeg: 17
    },
    {
      id: 'late-colleague',
      label: 'COLLÈGUE TARDIF',
      archetype: 'colleague',
      patrol: [
        { x: 120, y: 1850 },
        { x: 120, y: 1200 }
      ],
      patrolSpeed: 74,
      chaseSpeed: 112,
      visionRange: 260,
      visionHalfAngleDeg: 30
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
      patrolSpeed: 68,
      chaseSpeed: 104,
      visionRange: 250,
      visionHalfAngleDeg: 33
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
          color: 0x7a5a44,
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
          color: 0x4f7f96,
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
          color: 0x8a5949,
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

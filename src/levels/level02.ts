import type { LevelDef } from '../game/types';

/**
 * Niveau 2 — l'étage direction.
 * Nouvelles mécaniques : caméras à balayage (vision sans déplacement) et
 * porte verrouillée exigeant le badge. Le café arrive comme consommable.
 */
export const LEVEL_02: LevelDef = {
  id: 'level-02',
  name: 'L’ÉTAGE DIRECTION',
  subtitle: 'MISSION 02  •  18 H, TOUJOURS LÀ',
  briefing:
    'Réunion interminable au 4e étage.\nUn badge traîne. Une porte le réclame.\n\nCaméras · Badge · Ne cours pas',
  size: { w: 500, h: 2000 },
  ambient: { floor: 0xe9eef2, floorAlt: 0xdde5ea },
  spawn: { x: 250, y: 1900 },

  obstacles: [
    { x: 21, y: 1000, w: 42, h: 2000, kind: 'wall' },
    { x: 479, y: 1000, w: 42, h: 2000, kind: 'wall' },
    { x: 250, y: 20, w: 500, h: 40, kind: 'wall' },
    { x: 250, y: 1980, w: 500, h: 40, kind: 'wall' },

    { x: 85, y: 1880, w: 90, h: 100, kind: 'desk' },
    { x: 415, y: 1880, w: 90, h: 100, kind: 'desk' },
    { x: 106, y: 1740, w: 170, h: 32, kind: 'partition' },
    { x: 394, y: 1740, w: 170, h: 32, kind: 'partition' },

    { x: 77, y: 1480, w: 105, h: 200, kind: 'cabinet', label: 'COPIES' },
    { x: 420, y: 1380, w: 90, h: 100, kind: 'desk' },
    { x: 80, y: 1180, w: 110, h: 80, kind: 'desk' },

    { x: 250, y: 1000, w: 160, h: 180, kind: 'pillar', label: 'RÉUNION' },

    { x: 110, y: 760, w: 180, h: 34, kind: 'wall' },
    { x: 390, y: 760, w: 180, h: 34, kind: 'wall' },
    { x: 250, y: 760, w: 100, h: 34, kind: 'door', lock: 'badge', label: 'BADGE', id: 'exec-door' },

    { x: 77, y: 520, w: 110, h: 80, kind: 'desk' },
    { x: 423, y: 520, w: 110, h: 80, kind: 'desk' },
    { x: 95, y: 165, w: 150, h: 30, kind: 'wall' },
    { x: 405, y: 165, w: 150, h: 30, kind: 'wall' }
  ],

  decor: [
    { kind: 'zone', x: 250, y: 1915, w: 316, h: 110, material: 'start', text: 'ASCENSEUR' },
    { kind: 'zone', x: 250, y: 92, w: 286, h: 108, material: 'exit', text: 'ESCALIER  ↑' },
    { kind: 'zone', x: 425, y: 1180, w: 100, h: 120, material: 'alcove' },
    { kind: 'text', x: 425, y: 1250, text: 'VESTIAIRE', size: 11, color: 0x7c6d88 },
    { kind: 'text', x: 250, y: 1640, text: 'OPEN SPACE', size: 13, color: 0x8b9aa5 },
    { kind: 'text', x: 250, y: 880, text: 'ZONE SURVEILLÉE', size: 14, color: 0x806f83 },
    { kind: 'text', x: 250, y: 700, text: 'ACCÈS DIRECTION', size: 12, color: 0x9b6b55 },
    { kind: 'text', x: 250, y: 330, text: 'COULOIR DES CADRES', size: 12, color: 0x8b9aa5 },
    { kind: 'deskProps', x: 85, y: 1880, side: -1 },
    { kind: 'deskProps', x: 415, y: 1880, side: 1 },
    { kind: 'deskProps', x: 420, y: 1380, side: 1 },
    { kind: 'deskProps', x: 80, y: 1180, side: -1 },
    { kind: 'deskProps', x: 77, y: 520, side: -1 },
    { kind: 'deskProps', x: 423, y: 520, side: 1 },
    { kind: 'plant', x: 52, y: 1620, scale: 0.8 },
    { kind: 'plant', x: 448, y: 900, scale: 0.75 },
    { kind: 'plant', x: 55, y: 340, scale: 0.78 }
  ],

  npcs: [
    {
      id: 'cam-open-space',
      label: 'CAMÉRA',
      archetype: 'camera',
      patrol: [{ x: 445, y: 1660 }],
      sweep: { from: 130, to: 220, periodMs: 5200 },
      visionRange: 330,
      visionHalfAngleDeg: 22
    },
    {
      id: 'cam-vestiaire',
      label: 'CAMÉRA',
      archetype: 'camera',
      patrol: [{ x: 445, y: 1090 }],
      sweep: { from: 100, to: 175, periodMs: 4200 },
      visionRange: 300,
      visionHalfAngleDeg: 20
    },
    {
      id: 'boss',
      label: 'BOSS',
      archetype: 'boss',
      patrol: [
        { x: 110, y: 880 },
        { x: 390, y: 880 },
        { x: 390, y: 1120 },
        { x: 110, y: 1120 }
      ],
      patrolSpeed: 76,
      chaseSpeed: 132,
      visionRange: 340,
      visionHalfAngleDeg: 36
    },
    {
      id: 'intern',
      label: 'STAGIAIRE',
      archetype: 'intern',
      patrol: [
        { x: 150, y: 420 },
        { x: 350, y: 420 },
        { x: 350, y: 640 },
        { x: 150, y: 640 }
      ],
      patrolSpeed: 96,
      chaseSpeed: 124,
      visionRange: 270,
      visionHalfAngleDeg: 28
    }
  ],

  items: [
    { id: 'badge', at: { x: 425, y: 1180 } },
    { id: 'coffee', at: { x: 80, y: 620 } }
  ],

  hidingSpots: [{ id: 'copies', door: { x: 138, y: 1480 }, exit: { x: 170, y: 1480 }, label: 'COPIES' }],

  triggers: [
    { id: 'hr', kind: 'dialogue', zone: { x: 250, y: 290, w: 460, h: 110 }, payload: 'hr' },
    { id: 'exit', kind: 'exit', zone: { x: 250, y: 90, w: 460, h: 110 }, requiresDialoguesResolved: true }
  ],

  dialogues: [
    {
      id: 'hr',
      speaker: 'RH',
      speakerAfter: 'RH SATISFAITE',
      heading: '« Deux minutes ! »',
      body: 'Les RH veulent « juste caler un point ».\nChoisis ta sortie :',
      choices: [
        {
          id: 'coffee',
          title: '☕  Lui offrir ton café',
          detail: '100 % · aucune pénalité',
          color: 0x7a5a44,
          requiresItem: 'coffee',
          successChance: 1,
          penaltyMinutes: 0,
          rewardMinutes: 0,
          successText: '« Tu me sauves la vie. »\nElle te laisse filer.',
          failureText: ''
        },
        {
          id: 'calendar',
          title: '« Je te mets ça dans l’agenda »',
          detail: '75 % · échec : +12 min',
          color: 0x4f7f96,
          successChance: 0.75,
          penaltyMinutes: 12,
          rewardMinutes: 0,
          successText: 'Créneau posé jeudi. Tu es libre.\nAucune minute perdue.',
          failureText: '« Autant le faire maintenant. »\n+12 minutes.'
        },
        {
          id: 'stairs',
          title: 'Prendre l’escalier sans répondre',
          detail: '45 % · réussite : −4 min · échec : +18 min',
          color: 0x8a5949,
          successChance: 0.45,
          penaltyMinutes: 18,
          rewardMinutes: -4,
          successText: 'Deux étages avalés en silence.\n4 minutes gagnées !',
          failureText: 'Elle t’attendait en bas.\n+18 minutes.'
        }
      ]
    }
  ],

  tutorials: [
    {
      id: 'camera',
      text: 'Une caméra balaie la zone : attends qu’elle regarde ailleurs.',
      anchor: { x: 250, y: 1600 },
      when: { beyondY: 1720 }
    },
    {
      id: 'badge',
      text: 'Le badge du vestiaire ouvre la porte de la direction.',
      anchor: { x: 300, y: 1120 },
      when: { after: 'camera', itemPending: 'badge', nearPoint: { at: { x: 425, y: 1180 }, radius: 190 } }
    },
    {
      id: 'door',
      text: 'Approche-toi de la porte et appuie sur OUVRIR.',
      anchor: { x: 250, y: 850 },
      when: { after: 'badge', hasItem: 'badge', nearPoint: { at: { x: 250, y: 760 }, radius: 200 } }
    }
  ],

  clock: { startHour: 18, startMinute: 0, msPerMinute: 5000, failAtHour: 23 },
  stars: [24, 36, 52]
};

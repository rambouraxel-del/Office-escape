import { COLORS } from '../game/constants';
import type { LevelDef } from '../game/types';

/**
 * Niveau 1 — reprise fidèle du couloir de la V0.7, exprimé en données.
 * Sert de référence : si un niveau doit rester jouable à l'identique, c'est
 * celui-ci.
 */
export const LEVEL_01: LevelDef = {
  id: 'level-01',
  name: 'LA GRANDE SORTIE',
  subtitle: 'MISSION 01  •  ENFIN 17 H',
  briefing:
    'Échappe-toi du bureau sans te faire\nretenir par tes collègues.\n\nObserve · Cache-toi · Choisis vite',
  size: { w: 500, h: 2200 },
  spawn: { x: 250, y: 2050 },
  ambient: { floor: COLORS.floor, floorAlt: COLORS.floorAlt },

  obstacles: [
    { x: 21, y: 1100, w: 42, h: 2200, kind: 'wall' },
    { x: 479, y: 1100, w: 42, h: 2200, kind: 'wall' },
    { x: 250, y: 20, w: 500, h: 40, kind: 'wall' },
    { x: 250, y: 2180, w: 500, h: 40, kind: 'wall' },

    { x: 106, y: 1900, w: 170, h: 35, kind: 'wall' },
    { x: 394, y: 1900, w: 170, h: 35, kind: 'wall' },
    { x: 85, y: 2030, w: 90, h: 105, kind: 'desk' },
    { x: 415, y: 2030, w: 90, h: 105, kind: 'desk' },

    { x: 77, y: 1580, w: 105, h: 230, kind: 'cabinet', label: 'WC' },

    { x: 420, y: 1500, w: 90, h: 110, kind: 'desk' },
    { x: 80, y: 1245, w: 110, h: 75, kind: 'desk' },

    { x: 250, y: 860, w: 150, h: 190, kind: 'pillar', label: 'ARCHIVES' },

    { x: 77, y: 560, w: 110, h: 80, kind: 'desk' },
    { x: 423, y: 560, w: 110, h: 80, kind: 'desk' },
    { x: 95, y: 165, w: 150, h: 30, kind: 'wall' },
    { x: 405, y: 165, w: 150, h: 30, kind: 'wall' }
  ],

  decor: [
    { kind: 'zone', x: 250, y: 2075, w: 316, h: 124, material: 'start', text: 'TON BUREAU' },
    { kind: 'zone', x: 250, y: 92, w: 286, h: 108, material: 'exit', text: 'SORTIE  ↑' },
    { kind: 'zone', x: 92, y: 470, w: 116, h: 100, material: 'alcove' },
    { kind: 'prop', x: 250, y: 44, prop: 'exitSign' },
    { kind: 'text', x: 92, y: 525, text: 'ALCÔVE', size: 11, color: 0x8a6a4c },
    { kind: 'text', x: 250, y: 1862, text: 'OBJECTIF  •  RENTRER CHEZ TOI', size: 12, color: 0x8a6a4c },
    { kind: 'text', x: 250, y: 1780, text: 'COULOIR PRINCIPAL', size: 12, color: 0x9c8874 },
    { kind: 'text', x: 250, y: 1160, text: 'ZONE DU BOSS', size: 13, color: 0x6e5a72 },
    { kind: 'text', x: 250, y: 340, text: 'DERNIER OBSTACLE', size: 12, color: 0x8a5a45 },
    { kind: 'deskProps', x: 85, y: 2030, side: -1 },
    { kind: 'deskProps', x: 415, y: 2030, side: 1 },
    { kind: 'deskProps', x: 420, y: 1500, side: 1 },
    { kind: 'deskProps', x: 80, y: 1245, side: -1 },
    { kind: 'deskProps', x: 77, y: 560, side: -1 },
    { kind: 'deskProps', x: 423, y: 560, side: 1 },
    { kind: 'prop', x: 150, y: 2030, prop: 'chair' },
    { kind: 'prop', x: 350, y: 2030, prop: 'chair' },
    { kind: 'prop', x: 355, y: 1500, prop: 'chair' },
    { kind: 'prop', x: 145, y: 1245, prop: 'chair' },
    { kind: 'prop', x: 142, y: 560, prop: 'chair' },
    { kind: 'prop', x: 358, y: 560, prop: 'chair' },
    { kind: 'plant', x: 52, y: 1815 },
    { kind: 'plant', x: 445, y: 1370 },
    { kind: 'plant', x: 55, y: 1040 },
    { kind: 'plant', x: 444, y: 350 },
    { kind: 'plant', x: 448, y: 1815 },
    { kind: 'plant', x: 55, y: 690 }
  ],

  npcs: [
    {
      id: 'colleague',
      label: 'COLLÈGUE',
      archetype: 'colleague',
      patrol: [
        { x: 250, y: 1320 },
        { x: 250, y: 1790 }
      ]
    },
    {
      id: 'boss',
      label: 'BOSS',
      archetype: 'boss',
      patrol: [
        { x: 105, y: 680 },
        { x: 395, y: 680 },
        { x: 395, y: 1040 },
        { x: 105, y: 1040 }
      ],
      patrolSpeed: 72,
      chaseSpeed: 128,
      visionRange: 340,
      visionHalfAngleDeg: 36
    }
  ],

  items: [{ id: 'donut', at: { x: 92, y: 470 } }],

  hidingSpots: [{ id: 'wc', door: { x: 138, y: 1580 }, exit: { x: 168, y: 1580 }, label: 'WC' }],

  triggers: [
    { id: 'chatty', kind: 'dialogue', zone: { x: 250, y: 300, w: 460, h: 120 }, payload: 'chatty' },
    { id: 'exit', kind: 'exit', zone: { x: 250, y: 90, w: 460, h: 110 }, requiresDialoguesResolved: true }
  ],

  dialogues: [
    {
      id: 'chatty',
      speaker: 'COLLÈGUE BAVARD',
      speakerAfter: 'COLLÈGUE RAVI',
      heading: '« Tu pars déjà ? »',
      body: 'Le collègue bloque le passage.\nChoisis comment t’en sortir :',
      choices: [
        {
          id: 'donut',
          title: '🍩  Lui donner le donut',
          detail: '100 % · aucune pénalité',
          color: 0xb96876,
          requiresItem: 'donut',
          successChance: 1,
          penaltyMinutes: 0,
          rewardMinutes: 0,
          successText: '« Oh, un donut ! À demain ! »\nAucune minute perdue.',
          failureText: ''
        },
        {
          id: 'polite',
          title: '« Désolé, je suis pressé »',
          detail: '70 % · échec : +10 min',
          color: 0x4f7f96,
          successChance: 0.7,
          penaltyMinutes: 10,
          rewardMinutes: 0,
          successText: 'Il comprend et te laisse passer.\nAucune minute perdue.',
          failureText: 'Il te raconte quand même sa journée.\n+10 minutes.'
        },
        {
          id: 'ignore',
          title: 'Filer sans un mot',
          detail: '50 % · réussite : −3 min · échec : +15 min',
          color: 0x8a5949,
          successChance: 0.5,
          penaltyMinutes: 15,
          // Le seul choix qui peut FAIRE GAGNER du temps : un pari assumé,
          // rationnel quand on est à une minute d'un seuil d'étoile.
          rewardMinutes: -3,
          successText: 'Tu es déjà dans l’ascenseur.\n3 minutes gagnées !',
          failureText: 'Il te rattrape près de la porte.\n+15 minutes.'
        }
      ]
    }
  ],

  tutorials: [
    { id: 'move', text: 'Utilise le joystick pour avancer.', anchor: 'player', when: {} },
    {
      id: 'run',
      text: 'Maintiens COURIR avec un second doigt.',
      anchor: 'player',
      when: { after: 'move', movedFromSpawn: 50 }
    },
    {
      id: 'visibility',
      text: 'Courir te rend plus visible.',
      anchor: 'player',
      when: { after: 'run', hasRun: true }
    },
    {
      id: 'hide',
      text: 'Approche-toi puis entre pour te cacher.',
      anchor: { x: 205, y: 1470 },
      when: { after: 'visibility', nearPoint: { at: { x: 138, y: 1580 }, radius: 150 } }
    },
    {
      id: 'pillar',
      text: 'Contourne le pilier pour couper la vue du boss.',
      anchor: { x: 250, y: 710 },
      when: { after: 'hide', beyondY: 1250 }
    },
    {
      id: 'donut',
      text: 'Approche-toi et ramasse le donut.',
      anchor: { x: 217, y: 395 },
      when: { after: 'pillar', itemPending: 'donut', nearPoint: { at: { x: 92, y: 470 }, radius: 145 } }
    }
  ],

  clock: { startHour: 17, startMinute: 0, msPerMinute: 5000, failAtHour: 22 },
  stars: [20, 30, 45]
};

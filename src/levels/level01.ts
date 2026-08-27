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
  theme: 'office',

  // V0.11 — RÈGLE DE LA PASSE GRAPHIQUE : aucun rectangle de collision n'a
  // bougé. Seule la NATURE d'un obstacle change (`kind`), ce qui rhabille une
  // pièce sans déplacer un mur d'une unité, plus du décor sans collision.
  obstacles: [
    { x: 21, y: 1100, w: 42, h: 2200, kind: 'wall' },
    { x: 479, y: 1100, w: 42, h: 2200, kind: 'wall' },
    { x: 250, y: 20, w: 500, h: 40, kind: 'wall' },
    { x: 250, y: 2180, w: 500, h: 40, kind: 'wall' },

    { x: 106, y: 1900, w: 170, h: 35, kind: 'partition' },
    { x: 394, y: 1900, w: 170, h: 35, kind: 'partition' },
    { x: 85, y: 2030, w: 90, h: 105, kind: 'reception' },
    { x: 415, y: 2030, w: 90, h: 105, kind: 'reception' },

    // Sanitaires : faïence au sol, cabines et lavabo posés dessus. Aucune
    // étiquette — la pièce doit se reconnaître, pas se lire.
    { x: 77, y: 1580, w: 105, h: 230, kind: 'restroom' },

    { x: 420, y: 1500, w: 90, h: 110, kind: 'bench' },
    { x: 80, y: 1245, w: 110, h: 75, kind: 'bench' },

    { x: 250, y: 860, w: 150, h: 190, kind: 'pillar', label: 'ARCHIVES' },

    { x: 77, y: 560, w: 110, h: 80, kind: 'meeting' },
    { x: 423, y: 560, w: 110, h: 80, kind: 'meeting' },
    { x: 95, y: 165, w: 150, h: 30, kind: 'wall' },
    { x: 405, y: 165, w: 150, h: 30, kind: 'wall' }
  ],

  decor: [
    { kind: 'zone', x: 250, y: 2075, w: 316, h: 124, material: 'start' },
    { kind: 'zone', x: 250, y: 92, w: 286, h: 108, material: 'exit', text: 'SORTIE  ↑' },
    { kind: 'zone', x: 92, y: 470, w: 116, h: 100, material: 'lounge' },
    { kind: 'prop', x: 250, y: 44, prop: 'exitSign' },
    { kind: 'prop', x: 77, y: 1524, prop: 'stall' },
    { kind: 'prop', x: 77, y: 1614, prop: 'stall' },
    { kind: 'prop', x: 56, y: 1490, prop: 'toilet' },
    { kind: 'prop', x: 56, y: 1580, prop: 'toilet' },
    { kind: 'prop', x: 62, y: 1664, prop: 'sink' },
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
    { kind: 'plant', x: 55, y: 690 },
    // Petits objets de bureau : purement cosmétiques, aucune collision. Ils
    // ponctuent les longues portions de couloir sans encombrer le passage.
    { kind: 'prop', x: 160, y: 1950, prop: 'trash' },
    { kind: 'prop', x: 336, y: 1950, prop: 'boxes' },
    { kind: 'prop', x: 62, y: 1740, prop: 'books' },
    { kind: 'prop', x: 444, y: 1690, prop: 'cooler' },
    { kind: 'prop', x: 444, y: 1560, prop: 'cactus' },
    { kind: 'prop', x: 152, y: 1180, prop: 'lamp' },
    { kind: 'prop', x: 66, y: 900, prop: 'printer' },
    { kind: 'prop', x: 444, y: 1000, prop: 'cactus' },
    { kind: 'prop', x: 250, y: 430, prop: 'books' },
    { kind: 'prop', x: 444, y: 470, prop: 'cactus' },
    { kind: 'prop', x: 84, y: 262, prop: 'boxes' },
    { kind: 'prop', x: 420, y: 262, prop: 'trash' },

    // ── V0.11 : chaque zone du plateau reçoit ce qui la nomme.

    // Accueil : tapis d'entrée, portemanteau, horloge et panneau d'affichage.
    { kind: 'zone', x: 250, y: 1955, w: 300, h: 90, material: 'hall' },
    { kind: 'prop', x: 250, y: 1985, prop: 'mat' },
    { kind: 'prop', x: 155, y: 1962, prop: 'coatRack' },
    { kind: 'prop', x: 140, y: 1900, prop: 'wallClock' },
    { kind: 'prop', x: 345, y: 1958, prop: 'corkboard' },
    { kind: 'prop', x: 118, y: 2030, prop: 'laptop' },

    // Sanitaires : le plan de lavabos et l'urinoir complètent les cabines.
    { kind: 'prop', x: 77, y: 1662, prop: 'sinkCounter' },
    { kind: 'prop', x: 104, y: 1476, prop: 'urinal' },
    { kind: 'prop', x: 148, y: 1690, prop: 'wetFloor' },
    { kind: 'prop', x: 148, y: 1745, prop: 'mop' },

    // Coin pause, côté droit : distributeur, micro-ondes, frigo, tri.
    { kind: 'zone', x: 434, y: 1680, w: 108, h: 210, material: 'kitchen' },
    { kind: 'prop', x: 442, y: 1780, prop: 'vending' },
    { kind: 'prop', x: 442, y: 1620, prop: 'microwave' },
    { kind: 'prop', x: 442, y: 1490, prop: 'fridge' },
    { kind: 'prop', x: 396, y: 1806, prop: 'recycling' },

    // Coin détente de l'alcôve : c'est là qu'on se cache, autant y être bien.
    { kind: 'prop', x: 92, y: 442, prop: 'sofa' },
    { kind: 'prop', x: 92, y: 498, prop: 'coffeeTable' },

    // Archives : les classeurs debout autour du bloc central.
    { kind: 'prop', x: 250, y: 742, prop: 'binder' },
    { kind: 'prop', x: 250, y: 978, prop: 'binder' },
    { kind: 'prop', x: 166, y: 860, prop: 'boxes' },

    // Salle de réunion, en haut : le tableau blanc suffit à la nommer.
    { kind: 'zone', x: 250, y: 620, w: 300, h: 170, material: 'meeting' },
    { kind: 'prop', x: 250, y: 552, prop: 'whiteboard' },
    { kind: 'prop', x: 250, y: 660, prop: 'coffeeTable' },
    { kind: 'prop', x: 178, y: 660, prop: 'armchair' },
    { kind: 'prop', x: 322, y: 660, prop: 'armchair' }
  ],

  npcs: [
    {
      id: 'colleague',
      label: 'COLLÈGUE',
      archetype: 'colleague',
      patrol: [
        { x: 250, y: 1320 },
        { x: 250, y: 1790 }
      ],
      // Le collègue reste dans le couloir : il ne va jamais fouiner derrière
      // les bureaux, mais il ne repasse pas non plus deux fois sur la même
      // ligne.
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
      visionRange: 250,
      visionHalfAngleDeg: 26
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

  clock: { startHour: 17, startMinute: 0, failAtHour: 22 },
  stars: [20, 30, 45]
};

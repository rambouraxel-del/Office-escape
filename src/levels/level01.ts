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

  // V0.12 — six rectangles ont bougé, et seulement six : les bureaux étaient
  // en PORTRAIT (90 × 105), ce qui aurait exigé une planche de poste de travail
  // dédiée. Ils sont passés en PAYSAGE (116 × 78), le format du poste FOURNI.
  // C'est un asset de moins à faire dessiner, et les six bureaux du jeu se
  // ressemblent enfin. Tout le reste du level design est intact.
  obstacles: [
    { x: 21, y: 1100, w: 42, h: 2200, kind: 'wall' },
    { x: 479, y: 1100, w: 42, h: 2200, kind: 'wall' },
    { x: 250, y: 20, w: 500, h: 40, kind: 'wall' },
    { x: 250, y: 2180, w: 500, h: 40, kind: 'wall' },

    { x: 106, y: 1900, w: 170, h: 35, kind: 'partition' },
    { x: 394, y: 1900, w: 170, h: 35, kind: 'partition' },
    { x: 105, y: 2035, w: 116, h: 78, kind: 'desk' },
    { x: 395, y: 2035, w: 116, h: 78, kind: 'desk' },

    // Sanitaires : faïence au sol, cabines et lavabo posés dessus. Aucune
    // étiquette — la pièce doit se reconnaître, pas se lire.
    { x: 77, y: 1580, w: 105, h: 230, kind: 'restroom' },

    { x: 400, y: 1500, w: 116, h: 78, kind: 'desk' },
    { x: 100, y: 1245, w: 116, h: 78, kind: 'desk' },

    { x: 250, y: 860, w: 150, h: 190, kind: 'cabinet', label: 'ARCHIVES' },

    { x: 100, y: 560, w: 116, h: 78, kind: 'desk' },
    { x: 400, y: 560, w: 116, h: 78, kind: 'desk' },
    { x: 95, y: 165, w: 150, h: 30, kind: 'wall' },
    { x: 405, y: 165, w: 150, h: 30, kind: 'wall' }
  ],

  // V0.12 — le décor tient en dix types de props. Une zone se lit à son SOL
  // et à un gros meuble répété, pas à une collection d'objets uniques.
  decor: [
    { kind: 'zone', x: 250, y: 2075, w: 316, h: 124, material: 'start' },
    { kind: 'zone', x: 250, y: 92, w: 286, h: 108, material: 'exit', text: 'SORTIE  ↑' },
    { kind: 'prop', x: 250, y: 44, prop: 'exitSign' },

    // ── Accueil : le dallage clair et deux postes suffisent à dire « entrée ».
    { kind: 'zone', x: 250, y: 1955, w: 300, h: 90, material: 'hall' },
    { kind: 'prop', x: 105, y: 2035, prop: 'workstation' },
    { kind: 'prop', x: 395, y: 2035, prop: 'workstation' },
    { kind: 'prop', x: 180, y: 2035, prop: 'chair' },
    { kind: 'prop', x: 320, y: 2035, prop: 'chair' },
    { kind: 'plant', x: 52, y: 1930 },
    { kind: 'plant', x: 448, y: 1930 },

    // ── Sanitaires : la faïence porte la pièce, deux props la nomment.
    { kind: 'prop', x: 60, y: 1510, prop: 'toilet' },
    { kind: 'prop', x: 60, y: 1600, prop: 'toilet' },
    { kind: 'prop', x: 100, y: 1670, prop: 'sink' },

    // ── Open space : le MÊME poste, répété. C'est la répétition qui fait lire
    // l'open space, pas la variété.
    { kind: 'prop', x: 100, y: 1245, prop: 'workstation' },
    { kind: 'prop', x: 400, y: 1500, prop: 'workstation' },
    { kind: 'prop', x: 175, y: 1245, prop: 'chair' },
    { kind: 'prop', x: 325, y: 1500, prop: 'chair' },
    { kind: 'prop', x: 100, y: 1180, prop: 'monitor' },
    { kind: 'prop', x: 400, y: 1435, prop: 'monitor' },
    { kind: 'plant', x: 55, y: 1040 },
    { kind: 'plant', x: 445, y: 1370 },

    // ── Coin pause : un distributeur, et c'est dit.
    { kind: 'zone', x: 410, y: 1720, w: 90, h: 180, material: 'kitchen' },
    { kind: 'prop', x: 412, y: 1720, prop: 'vending' },
    { kind: 'prop', x: 412, y: 1640, prop: 'mug' },

    // ── Archives : trois boîtes autour du bloc, rien d'autre.
    { kind: 'prop', x: 250, y: 742, prop: 'filebox' },
    { kind: 'prop', x: 250, y: 978, prop: 'filebox' },
    { kind: 'prop', x: 166, y: 860, prop: 'filebox' },

    // ── Salle de réunion : le tableau blanc, deux postes, deux chaises.
    { kind: 'zone', x: 250, y: 620, w: 300, h: 170, material: 'meeting' },
    { kind: 'prop', x: 250, y: 540, prop: 'whiteboard' },
    { kind: 'prop', x: 100, y: 560, prop: 'workstation' },
    { kind: 'prop', x: 400, y: 560, prop: 'workstation' },
    { kind: 'prop', x: 175, y: 630, prop: 'chair' },
    { kind: 'prop', x: 325, y: 630, prop: 'chair' },
    { kind: 'prop', x: 250, y: 700, prop: 'sticky' },

    // ── Alcôve du donut : parquet, une plante, un agrafeuse oublié.
    { kind: 'zone', x: 92, y: 470, w: 116, h: 100, material: 'parquet' },
    { kind: 'plant', x: 55, y: 690 },
    { kind: 'prop', x: 92, y: 430, prop: 'stapler' },
    { kind: 'plant', x: 444, y: 350 }
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

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
  theme: 'exec',
  spawn: { x: 250, y: 1900 },

  // V0.11 — aucun rectangle de collision n'a bougé : seule la NATURE des
  // obstacles change, plus du décor sans collision.
  //
  // La cloison de la porte à badge RESTE un mur plein. La passer en paroi
  // vitrée aurait été plus joli, mais une vitre qui arrête les regards est un
  // mensonge, et la rendre traversante aurait laissé les PNJ voir de l'autre
  // côté : c'est une décision de game design, pas une passe graphique.
  obstacles: [
    { x: 21, y: 1000, w: 42, h: 2000, kind: 'wall' },
    { x: 479, y: 1000, w: 42, h: 2000, kind: 'wall' },
    { x: 250, y: 20, w: 500, h: 40, kind: 'wall' },
    { x: 250, y: 1980, w: 500, h: 40, kind: 'wall' },

    { x: 85, y: 1880, w: 90, h: 100, kind: 'reception' },
    { x: 415, y: 1880, w: 90, h: 100, kind: 'reception' },
    { x: 106, y: 1740, w: 170, h: 32, kind: 'partition' },
    { x: 394, y: 1740, w: 170, h: 32, kind: 'partition' },

    { x: 77, y: 1480, w: 105, h: 200, kind: 'cabinet', label: 'COPIES' },
    { x: 420, y: 1380, w: 90, h: 100, kind: 'bench' },
    { x: 80, y: 1180, w: 110, h: 80, kind: 'bench' },

    { x: 250, y: 1000, w: 160, h: 180, kind: 'meeting', label: 'RÉUNION' },

    { x: 110, y: 760, w: 180, h: 34, kind: 'wall' },
    { x: 390, y: 760, w: 180, h: 34, kind: 'wall' },
    { x: 250, y: 760, w: 100, h: 34, kind: 'door', lock: 'badge', label: 'BADGE', id: 'exec-door' },

    { x: 77, y: 520, w: 110, h: 80, kind: 'meeting' },
    { x: 423, y: 520, w: 110, h: 80, kind: 'meeting' },
    { x: 95, y: 165, w: 150, h: 30, kind: 'wall' },
    { x: 405, y: 165, w: 150, h: 30, kind: 'wall' }
  ],

  decor: [
    { kind: 'zone', x: 250, y: 1915, w: 316, h: 110, material: 'start', text: 'ASCENSEUR' },
    { kind: 'zone', x: 250, y: 92, w: 286, h: 108, material: 'exit', text: 'ESCALIER  ↑' },
    { kind: 'zone', x: 425, y: 1180, w: 100, h: 120, material: 'lounge' },
    // Tapis de couloir : c'est lui qui dit « on est passé côté direction ».
    // Il commence exactement à la porte à badge et monte jusqu'à l'escalier.
    { kind: 'zone', x: 250, y: 440, w: 150, h: 560, material: 'exec' },
    { kind: 'zone', x: 250, y: 1290, w: 130, h: 380, material: 'exec' },
    { kind: 'prop', x: 250, y: 44, prop: 'exitSign' },

    // ── V0.11 : l'étage se lit pièce par pièce.

    // Hall d'ascenseurs : dallage clair, tapis, portemanteau, horloge.
    { kind: 'zone', x: 250, y: 1800, w: 300, h: 80, material: 'hall' },
    { kind: 'prop', x: 250, y: 1820, prop: 'mat' },
    { kind: 'prop', x: 158, y: 1740, prop: 'wallClock' },
    { kind: 'prop', x: 340, y: 1740, prop: 'corkboard' },
    { kind: 'prop', x: 118, y: 1880, prop: 'monitor' },
    { kind: 'prop', x: 52, y: 1912, prop: 'stapler' },

    // Point de sécurité, juste avant la porte à badge : portique et lecteur.
    { kind: 'prop', x: 250, y: 830, prop: 'turnstile' },
    { kind: 'prop', x: 196, y: 762, prop: 'reader' },
    { kind: 'prop', x: 250, y: 890, prop: 'hazardTape' },

    // Salle de réunion centrale : tableau blanc et fauteuils autour de la table.
    { kind: 'zone', x: 250, y: 1000, w: 260, h: 260, material: 'meeting' },
    { kind: 'prop', x: 250, y: 880, prop: 'whiteboard' },
    { kind: 'prop', x: 168, y: 1000, prop: 'armchair' },
    { kind: 'prop', x: 332, y: 1000, prop: 'armchair' },

    // Local informatique, derrière la salle de copies : baies et sol technique.
    { kind: 'zone', x: 430, y: 1620, w: 96, h: 200, material: 'tech' },
    { kind: 'prop', x: 438, y: 1560, prop: 'server' },
    { kind: 'prop', x: 438, y: 1660, prop: 'server' },
    { kind: 'prop', x: 438, y: 1730, prop: 'reader' },

    // Coin détente de l'alcôve, côté direction.
    { kind: 'prop', x: 428, y: 1152, prop: 'sofa' },
    { kind: 'prop', x: 428, y: 1212, prop: 'coffeeTable' },

    // Salle de copies : les classeurs qui vont avec.
    { kind: 'prop', x: 148, y: 1420, prop: 'filebox' },
    { kind: 'prop', x: 148, y: 1540, prop: 'recycling' },


    { kind: 'deskProps', x: 85, y: 1880, side: -1 },
    { kind: 'deskProps', x: 415, y: 1880, side: 1 },
    { kind: 'deskProps', x: 420, y: 1380, side: 1 },
    { kind: 'prop', x: 80, y: 1180, prop: 'workstation' },
    { kind: 'prop', x: 77, y: 520, prop: 'workstation' },
    { kind: 'prop', x: 423, y: 520, prop: 'workstation' },

    // Fauteuils plutôt que chaises : la carrure du mobilier suffit à faire
    // comprendre qu'on a changé d'étage.
    { kind: 'prop', x: 152, y: 1880, prop: 'armchair' },
    { kind: 'prop', x: 348, y: 1880, prop: 'armchair' },
    { kind: 'prop', x: 352, y: 1380, prop: 'armchair' },
    { kind: 'prop', x: 150, y: 1180, prop: 'armchair' },
    { kind: 'prop', x: 145, y: 520, prop: 'armchair' },
    { kind: 'prop', x: 355, y: 520, prop: 'armchair' },

    // Cadres accrochés au mur : le portrait du fondateur, en trois exemplaires.
    { kind: 'prop', x: 95, y: 166, prop: 'frame' },
    { kind: 'prop', x: 405, y: 166, prop: 'frame' },
    { kind: 'prop', x: 140, y: 760, prop: 'frame' },
    { kind: 'prop', x: 360, y: 760, prop: 'frame' },

    { kind: 'prop', x: 58, y: 1640, prop: 'award' },
    { kind: 'prop', x: 444, y: 1640, prop: 'award' },
    { kind: 'prop', x: 58, y: 330, prop: 'vase' },
    { kind: 'prop', x: 446, y: 330, prop: 'vase' },
    { kind: 'prop', x: 444, y: 1520, prop: 'machine' },
    { kind: 'prop', x: 62, y: 980, prop: 'printer' },
    { kind: 'prop', x: 444, y: 980, prop: 'cooler' },
    { kind: 'prop', x: 60, y: 1830, prop: 'books' },
    { kind: 'prop', x: 444, y: 1830, prop: 'books' },
    { kind: 'prop', x: 160, y: 1640, prop: 'trash' },
    { kind: 'prop', x: 340, y: 1640, prop: 'trash' },
    { kind: 'prop', x: 60, y: 620, prop: 'phone' },

    { kind: 'plant', x: 52, y: 1450 },
    { kind: 'plant', x: 448, y: 900 },
    { kind: 'plant', x: 55, y: 420 },
    { kind: 'plant', x: 448, y: 200 }
  ],

  npcs: [
    {
      id: 'cam-open-space',
      label: 'CAMÉRA',
      archetype: 'camera',
      patrol: [{ x: 445, y: 1660 }],
      // Balayage lent, avec un temps d'arrêt franc en bout de course : c'est
      // cette pause qu'on observe et qu'on attend pour passer.
      sweep: { from: 130, to: 220, degPerSecond: 24, holdMs: 1800 },
      visionRange: 200,
      visionHalfAngleDeg: 11
    },
    {
      id: 'cam-vestiaire',
      label: 'CAMÉRA',
      archetype: 'camera',
      patrol: [{ x: 445, y: 1090 }],
      sweep: { from: 100, to: 175, degPerSecond: 28, holdMs: 1400 },
      visionRange: 190,
      visionHalfAngleDeg: 11
    },
    {
      id: 'boss',
      label: 'BOSS',
      archetype: 'boss',
      // Le boss fait les cent pas devant la porte à badge. Son ancienne boucle
      // rectangulaire passait à dix unités du pilier central : le PNJ frottait,
      // le contournement le déportait, et le circuit devenait illisible. Un
      // va-et-vient franc dit la même chose et s'apprend en une passe.
      patrol: [
        { x: 110, y: 850 },
        { x: 390, y: 850 }
      ],
      patrolSpeed: 76,
      chaseSpeed: 132,
      visionRange: 250,
      visionHalfAngleDeg: 26
    },
    {
      id: 'intern',
      label: 'STAGIAIRE',
      archetype: 'intern',
      // Boucle resserrée entre les deux bureaux de l'étage : l'ancienne rasait
      // le poste de droite, et le stagiaire s'en écartait sans raison visible.
      patrol: [
        { x: 180, y: 420 },
        { x: 320, y: 420 },
        { x: 320, y: 640 },
        { x: 180, y: 640 }
      ],
      patrolSpeed: 96,
      chaseSpeed: 124,
      visionRange: 205,
      visionHalfAngleDeg: 21
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

  clock: { startHour: 18, startMinute: 0, failAtHour: 23 },
  stars: [24, 36, 52]
};

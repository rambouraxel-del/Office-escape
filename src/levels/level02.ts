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

  // V0.12 — comme au niveau 1, les six bureaux passent du portrait au paysage
  // pour réutiliser le poste de travail FOURNI. Aucun autre rectangle ne bouge.
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

    { x: 105, y: 1885, w: 116, h: 78, kind: 'desk' },
    { x: 395, y: 1885, w: 116, h: 78, kind: 'desk' },
    { x: 106, y: 1740, w: 170, h: 32, kind: 'partition' },
    { x: 394, y: 1740, w: 170, h: 32, kind: 'partition' },

    { x: 77, y: 1480, w: 105, h: 200, kind: 'cabinet', label: 'COPIES' },
    { x: 400, y: 1380, w: 116, h: 78, kind: 'desk' },
    { x: 100, y: 1180, w: 116, h: 78, kind: 'desk' },

    { x: 250, y: 1000, w: 160, h: 180, kind: 'meeting', label: 'RÉUNION' },

    { x: 110, y: 760, w: 180, h: 34, kind: 'wall' },
    { x: 390, y: 760, w: 180, h: 34, kind: 'wall' },
    { x: 250, y: 760, w: 100, h: 34, kind: 'door', lock: 'badge', label: 'BADGE', id: 'exec-door' },

    { x: 100, y: 520, w: 116, h: 78, kind: 'desk' },
    { x: 400, y: 520, w: 116, h: 78, kind: 'desk' },
    { x: 95, y: 165, w: 150, h: 30, kind: 'wall' },
    { x: 405, y: 165, w: 150, h: 30, kind: 'wall' }
  ],

  // V0.12 — mêmes meubles qu'au niveau 1. Ce qui change d'étage, ce sont les
  // MATIÈRES (marbre, laiton), le tapis de couloir et la sécurité.
  decor: [
    { kind: 'zone', x: 250, y: 1915, w: 316, h: 110, material: 'start', text: 'ASCENSEUR' },
    { kind: 'zone', x: 250, y: 92, w: 286, h: 108, material: 'exit', text: 'ESCALIER  ↑' },
    { kind: 'prop', x: 250, y: 44, prop: 'exitSign' },

    // Tapis de couloir : c'est lui qui dit « on est passé côté direction ».
    { kind: 'zone', x: 250, y: 440, w: 150, h: 560, material: 'exec' },
    { kind: 'zone', x: 250, y: 1290, w: 130, h: 380, material: 'exec' },

    // ── Hall d'ascenseurs.
    { kind: 'zone', x: 250, y: 1800, w: 300, h: 80, material: 'hall' },
    { kind: 'prop', x: 105, y: 1885, prop: 'workstation' },
    { kind: 'prop', x: 395, y: 1885, prop: 'workstation' },
    { kind: 'prop', x: 180, y: 1885, prop: 'chair' },
    { kind: 'prop', x: 320, y: 1885, prop: 'chair' },
    { kind: 'plant', x: 52, y: 1800 },
    { kind: 'plant', x: 448, y: 1800 },

    // ── Bureaux de l'étage : le même poste qu'en bas, en marbre et laiton.
    { kind: 'prop', x: 100, y: 1180, prop: 'workstation' },
    { kind: 'prop', x: 400, y: 1380, prop: 'workstation' },
    { kind: 'prop', x: 175, y: 1180, prop: 'chair' },
    { kind: 'prop', x: 325, y: 1380, prop: 'chair' },
    { kind: 'prop', x: 100, y: 520, prop: 'workstation' },
    { kind: 'prop', x: 400, y: 520, prop: 'workstation' },
    { kind: 'prop', x: 175, y: 590, prop: 'chair' },
    { kind: 'prop', x: 325, y: 590, prop: 'chair' },

    // ── Salle de copies : des boîtes d'archives, rien de plus.
    { kind: 'prop', x: 148, y: 1420, prop: 'filebox' },
    { kind: 'prop', x: 148, y: 1540, prop: 'filebox' },

    // ── Porte à badge : le lecteur EST l'information de gameplay.
    { kind: 'prop', x: 196, y: 762, prop: 'reader' },
    { kind: 'prop', x: 304, y: 762, prop: 'reader' },

    // ── Salle de réunion centrale.
    { kind: 'zone', x: 250, y: 1000, w: 260, h: 260, material: 'meeting' },
    { kind: 'prop', x: 250, y: 880, prop: 'whiteboard' },
    { kind: 'prop', x: 168, y: 1000, prop: 'chair' },
    { kind: 'prop', x: 332, y: 1000, prop: 'chair' },

    // ── Local informatique : sol technique et deux baies.
    { kind: 'zone', x: 408, y: 1620, w: 90, h: 200, material: 'tech' },
    { kind: 'prop', x: 410, y: 1570, prop: 'server' },
    { kind: 'prop', x: 410, y: 1670, prop: 'server' },

    // ── Coin détente de l'alcôve.
    { kind: 'zone', x: 408, y: 1180, w: 90, h: 120, material: 'lounge' },
    { kind: 'prop', x: 410, y: 1180, prop: 'monitor' },
    { kind: 'plant', x: 448, y: 940 },
    { kind: 'plant', x: 52, y: 940 },
    { kind: 'plant', x: 52, y: 300 },
    { kind: 'plant', x: 448, y: 300 }
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
      archetype: 'tech',
      // V0.12 — les postes de travail sont passés en paysage et touchent
      // désormais les deux murs : la boucle se resserre sur le tapis central,
      // qui la rend d'ailleurs plus lisible qu'avant.
      patrol: [
        { x: 210, y: 420 },
        { x: 290, y: 420 },
        { x: 290, y: 640 },
        { x: 210, y: 640 }
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

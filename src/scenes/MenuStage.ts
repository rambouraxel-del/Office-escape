import Phaser from 'phaser';
import { MENU_ROOM, MENU_STAGE, FX_TEXTURES } from '../game/artTheme';
import { menuAnimKey } from '../game/animations';
import { DEPTH, VIEW_HEIGHT, VIEW_WIDTH } from '../game/constants';
import { PALETTE } from '../game/palette';
import { SettingsStore } from '../core/settings';

/**
 * Le décor VIVANT de l'accueil.
 *
 * Séparé de `MenuScene` pour la même raison que `LevelView` est séparé de
 * `LevelScene` : d'un côté ce qui se dessine, de l'autre ce qui se décide. La
 * scène ne sait pas qu'il y a une machine à café ; elle sait qu'il y a une
 * pièce, et lui demande de vivre.
 *
 * Aucune position n'est inventée ici : tout vient de `MENU_STAGE`.
 *
 * Mouvement réduit : on garde les personnages, qui respirent à 1,4 à 5 images
 * par seconde et ne clignotent pas ; on coupe le vacillement du néon, les
 * poussières, la vapeur et la pulsation de lumière. Le réglage promet la fin
 * des flashs et des mouvements parasites, pas un menu mort.
 */

/** Périodes des micro-animations, en millisecondes. */
const NEON_FLICKER_MS = 5200;
const STEAM_MS = 2600;
const GLOW_PULSE_MS = 4200;
const MOTE_MS = 9000;

/** Une seconde d'horloge, en millisecondes. L'aiguille avance par à-coups. */
const TICK_MS = 1000;

export class MenuStage {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly hands: Phaser.GameObjects.Rectangle[] = [];
  private nextTick = 0;

  constructor(private readonly scene: Phaser.Scene) {}

  /** Monte la pièce et la met en mouvement. Appelé une fois par `create()`. */
  build(): void {
    const calm = SettingsStore.get().reducedMotion;

    this.scene.add
      .image(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, MENU_ROOM)
      .setDepth(DEPTH.floor)
      .setScrollFactor(0);

    this.buildGlow(calm);
    this.buildActors();
    this.buildClock();
    this.buildNeons(calm);
    if (!calm) {
      this.buildSteam();
      this.buildMotes();
    }
  }

  /** Flaque du couchant : elle respire, très lentement. */
  private buildGlow(calm: boolean): void {
    const { x, y, w, h } = MENU_STAGE.glow;
    const glow = this.scene.add
      .image(x, y, FX_TEXTURES.light)
      .setDisplaySize(w, h)
      .setTint(PALETTE.duskGlow)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.16)
      .setDepth(DEPTH.floor + 1);
    this.objects.push(glow);
    if (calm) return;
    this.scene.tweens.add({
      targets: glow,
      alpha: 0.26,
      duration: GLOW_PULSE_MS,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /** Les habitants : chacun démarre sur une frame différente. */
  private buildActors(): void {
    MENU_STAGE.actors.forEach((actor) => {
      // Origine en bas : `y` est une ligne d'APPUI, donc un sprite plus haut
      // ne s'enfonce pas dans le plateau, il dépasse au-dessus.
      const sprite = this.scene.add
        .sprite(actor.x, actor.y, actor.sheet)
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.item);
      sprite.play(menuAnimKey(actor.sheet));
      // Sans décalage, tout le bureau tape sur le clavier à l'unisson.
      sprite.anims.setProgress(actor.offset / MENU_STAGE.actors.length);
      this.objects.push(sprite);
    });
  }

  /**
   * L'horloge murale donne l'heure RÉELLE. C'est le détail qui fait qu'on
   * regarde deux fois : le bureau du menu est à la même heure que le joueur.
   */
  private buildClock(): void {
    const { x, y, hourHand, minuteHand, secondHand } = MENU_STAGE.clock;
    const build = (length: number, thickness: number, color: number) => {
      const hand = this.scene.add
        .rectangle(x, y, thickness, length, color)
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.item + 1);
      this.objects.push(hand);
      this.hands.push(hand);
      return hand;
    };
    build(hourHand, 3, PALETTE.ink);
    build(minuteHand, 2, PALETTE.inkSoft);
    build(secondHand, 1, PALETTE.alert);
    this.scene.add.rectangle(x, y, 3, 3, PALETTE.ink).setDepth(DEPTH.item + 2);
    this.tickClock();
  }

  /** Rampe de néons : un vacillement rare, jamais un clignotement. */
  private buildNeons(calm: boolean): void {
    MENU_STAGE.neons.forEach((neon, index) => {
      const halo = this.scene.add
        .rectangle(neon.x, neon.y, neon.w, neon.h, PALETTE.lampGlow, 0.22)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(DEPTH.floor + 1);
      this.objects.push(halo);
      if (calm) return;
      this.scene.tweens.add({
        targets: halo,
        alpha: 0.42,
        duration: NEON_FLICKER_MS + index * 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  /** Vapeur de la machine à café : trois bouffées décalées. */
  private buildSteam(): void {
    const { x, y } = MENU_STAGE.steam;
    for (let index = 0; index < 3; index += 1) {
      const puff = this.scene.add
        .rectangle(x + index * 4 - 4, y, 3, 3, PALETTE.paper, 0.4)
        .setDepth(DEPTH.item);
      this.objects.push(puff);
      this.scene.tweens.add({
        targets: puff,
        y: y - 26,
        alpha: 0,
        duration: STEAM_MS,
        repeat: -1,
        delay: index * (STEAM_MS / 3),
        ease: 'Sine.easeOut'
      });
    }
  }

  /** Poussières dans la lumière de la baie. Le luxe discret d'un décor. */
  private buildMotes(): void {
    const { x, y, w, h, count } = MENU_STAGE.motes;
    for (let index = 0; index < count; index += 1) {
      // Réparties à la main plutôt qu'au hasard : le menu n'a pas de `Prng`,
      // et une poussière n'a rien à gagner à être imprévisible.
      const startX = x + (w * ((index * 5) % count)) / count;
      const startY = y + (h * ((index * 3) % count)) / count;
      const mote = this.scene.add
        .rectangle(startX, startY, 2, 2, PALETTE.lampGlow, 0.5)
        .setDepth(DEPTH.item);
      this.objects.push(mote);
      this.scene.tweens.add({
        targets: mote,
        x: startX + 18 - index * 4,
        y: startY - 24,
        alpha: 0.1,
        duration: MOTE_MS + index * 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  /** Aiguilles remises à l'heure. Appelé à chaque seconde entamée. */
  private tickClock(): void {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;
    const angles = [(hours / 12) * 360, (minutes / 60) * 360, (seconds / 60) * 360];
    this.hands.forEach((hand, index) => hand.setAngle(angles[index]));
  }

  update(time: number): void {
    if (time < this.nextTick) return;
    this.nextTick = time + TICK_MS;
    this.tickClock();
  }

  /** Les objets du décor, pour les faire entrer en même temps que la scène. */
  get fadeables(): readonly Phaser.GameObjects.GameObject[] {
    return this.objects;
  }
}

import { SettingsStore } from './settings';

export type SoundId = 'step' | 'suspicion' | 'alert' | 'pickup' | 'door' | 'tick' | 'win' | 'fail' | 'ui';

/**
 * Audio 100 % synthétisé (Web Audio), sans un seul fichier.
 *
 * Cohérent avec les textures procédurales du projet : aucun asset à charger,
 * aucun octet ajouté au bundle. Le contexte est débloqué au premier geste,
 * contrainte iOS oblige.
 */
class AudioManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientNodes: OscillatorNode[] = [];
  private lastStepAt = 0;
  private unlocked = false;

  /** À appeler depuis un geste utilisateur (pointerdown / keydown). */
  unlock(): void {
    if (this.unlocked) return;
    try {
      const Ctor =
        globalThis.AudioContext ??
        (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.context = new Ctor();
      this.master = this.context.createGain();
      this.master.gain.value = SettingsStore.get().muted ? 0 : 0.5;
      this.master.connect(this.context.destination);
      this.unlocked = true;
    } catch {
      this.context = null;
    }
    void this.context?.resume();
  }

  setMuted(muted: boolean): void {
    if (!this.master || !this.context) return;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.context.currentTime, 0.05);
  }

  private envelope(duration: number, peak: number): GainNode | null {
    if (!this.context || !this.master) return null;
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    gain.connect(this.master);
    return gain;
  }

  private tone(
    frequency: number,
    duration: number,
    peak: number,
    type: OscillatorType = 'sine',
    slideTo?: number
  ): void {
    const gain = this.envelope(duration, peak);
    if (!gain || !this.context) return;
    const oscillator = this.context.createOscillator();
    oscillator.type = type;
    const now = this.context.currentTime;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (slideTo !== undefined) oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    oscillator.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  private noise(duration: number, peak: number, filterHz: number): void {
    const gain = this.envelope(duration, peak);
    if (!gain || !this.context) return;
    const frames = Math.floor(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, Math.max(1, frames), this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterHz;
    source.connect(filter).connect(gain);
    source.start();
  }

  play(id: SoundId): void {
    if (!this.context || SettingsStore.get().muted) return;

    switch (id) {
      case 'step': {
        // Les pas sont limités : sinon ils saturent à 60 fps.
        const now = this.context.currentTime;
        if (now - this.lastStepAt < 0.26) return;
        this.lastStepAt = now;
        this.noise(0.07, 0.09, 950);
        break;
      }
      case 'suspicion':
        this.tone(520, 0.16, 0.12, 'triangle', 700);
        break;
      case 'alert':
        this.tone(300, 0.16, 0.2, 'sawtooth', 720);
        globalThis.setTimeout(() => this.tone(720, 0.22, 0.18, 'sawtooth', 420), 130);
        break;
      case 'pickup':
        this.tone(880, 0.1, 0.16, 'sine', 1320);
        globalThis.setTimeout(() => this.tone(1320, 0.12, 0.12), 90);
        break;
      case 'door':
        this.noise(0.22, 0.13, 320);
        break;
      case 'tick':
        this.tone(1500, 0.04, 0.07, 'square');
        break;
      case 'win':
        [523, 659, 784, 1046].forEach((frequency, index) => {
          globalThis.setTimeout(() => this.tone(frequency, 0.24, 0.16, 'triangle'), index * 110);
        });
        break;
      case 'fail':
        [440, 330, 247].forEach((frequency, index) => {
          globalThis.setTimeout(() => this.tone(frequency, 0.3, 0.18, 'sawtooth'), index * 130);
        });
        break;
      case 'ui':
        this.tone(660, 0.06, 0.09, 'square');
        break;
    }
  }

  /** Nappe d'ambiance discrète, coupée hors partie. */
  startAmbient(): void {
    if (!this.context || !this.master || this.ambientGain) return;
    this.ambientGain = this.context.createGain();
    this.ambientGain.gain.value = 0;
    this.ambientGain.connect(this.master);
    this.ambientGain.gain.setTargetAtTime(0.05, this.context.currentTime, 1.5);

    [55, 82.5].forEach((frequency) => {
      const oscillator = this.context!.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(this.ambientGain!);
      oscillator.start();
      this.ambientNodes.push(oscillator);
    });
  }

  stopAmbient(): void {
    if (!this.context || !this.ambientGain) return;
    this.ambientGain.gain.setTargetAtTime(0, this.context.currentTime, 0.3);
    const nodes = this.ambientNodes;
    const gain = this.ambientGain;
    this.ambientNodes = [];
    this.ambientGain = null;
    globalThis.setTimeout(() => {
      nodes.forEach((node) => {
        try {
          node.stop();
        } catch {
          /* déjà arrêté */
        }
      });
      gain.disconnect();
    }, 900);
  }
}

export const Audio = new AudioManager();

/** Vibration optionnelle, absente sur iOS Safari. */
export function vibrate(pattern: number | number[]): void {
  if (!SettingsStore.get().vibrations) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* facultatif */
  }
}

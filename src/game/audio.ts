/**
 * Motor de audio WebAudio: efectos retro-barrocos y música procedimental
 * inspirada en los clásicos de 8 bits (estilo Alex Kidd) con timbre de clave y laúd.
 */

export type MusicTrack = "none" | "salamanca" | "avila" | "mar" | "corral" | "indice" | "boss";

const NOTE: Record<string, number> = {
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.0, G3: 196.0, Gs3: 207.65, A3: 220.0, Bb3: 233.08, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.0, Gs4: 415.3, A4: 440.0, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, A5: 880.0,
};

interface Song {
  bpm: number;
  lead: (string | null)[];
  bass: (string | null)[];
}

const SONGS: Record<Exclude<MusicTrack, "none">, Song> = {
  salamanca: {
    bpm: 142,
    lead: [
      "D4", "Fs4", "A4", "D5", "Cs5", "A4", "B4", "G4",
      "A4", null, "Fs4", "G4", "A4", "B4", "A4", null,
      "D5", "Cs5", "B4", "A4", "G4", "Fs4", "E4", "Fs4",
      "G4", "A4", "Fs4", "E4", "D4", null, "A4", null,
    ],
    bass: [
      "D3", null, "A3", null, "D3", null, "G3", null,
      "D3", null, "A3", null, "D3", "E3", "Fs3", "A3",
      "G3", null, "D3", null, "E3", null, "A3", null,
      "G3", "A3", "D3", "A3", "D3", null, "A3", null,
    ],
  },
  avila: {
    bpm: 136,
    lead: [
      "D4", null, "F4", "A4", "G4", "F4", "E4", "D4",
      "C4", "E4", "G4", null, "F4", "E4", "D4", null,
      "A4", "A4", "Bb4", "A4", "G4", "F4", "E4", "G4",
      "F4", "E4", "D4", "Cs4", "D4", null, null, null,
    ],
    bass: [
      "D3", null, "D3", "A3", "D3", null, "A3", null,
      "C3", null, "G3", null, "D3", null, "A3", null,
      "F3", null, "C3", null, "G3", null, "A3", null,
      "Bb3", null, "A3", null, "D3", null, "A3", null,
    ],
  },
  mar: {
    bpm: 150,
    lead: [
      "G4", "B4", "D5", null, "E5", "D5", "B4", "G4",
      "A4", "C5", "B4", "A4", "G4", "Fs4", "D4", null,
      "G4", "B4", "D5", "G5", "Fs5", "E5", "D5", "B4",
      "C5", "B4", "A4", "Fs4", "G4", null, "D4", null,
    ],
    bass: [
      "G3", null, "D3", null, "C3", null, "G3", null,
      "D3", null, "A3", null, "D3", null, "Fs3", "A3",
      "G3", null, "B3", null, "C3", null, "G3", null,
      "C3", "D3", "D3", "Fs3", "G3", null, "D3", null,
    ],
  },
  corral: {
    bpm: 144,
    lead: [
      "A4", "C5", "B4", "A4", "Gs4", "A4", "B4", "E4",
      "C5", "D5", "E5", null, "D5", "C5", "B4", null,
      "E5", "D5", "C5", "B4", "A4", "G4", "F4", "E4",
      "D4", "F4", "E4", "Gs4", "A4", null, "E4", null,
    ],
    bass: [
      "A3", null, "E3", null, "E3", null, "Gs3", null,
      "A3", null, "E3", null, "G3", null, "E3", null,
      "C3", null, "G3", null, "F3", null, "C3", null,
      "D3", null, "E3", null, "A3", null, "E3", null,
    ],
  },
  indice: {
    bpm: 158,
    lead: [
      "E4", "G4", "B4", "E5", "D5", "B4", "C5", "A4",
      "B4", null, "G4", "A4", "B4", "Fs4", "G4", "E4",
      "C5", "B4", "A4", "G4", "Fs4", "G4", "A4", "B4",
      "E5", "D5", "B4", "A4", "B4", null, "E4", null,
    ],
    bass: [
      "E3", "E3", "B3", null, "C3", "C3", "G3", null,
      "B3", null, "E3", null, "B3", null, "E3", null,
      "C3", null, "A3", null, "D3", null, "B3", null,
      "C3", "D3", "E3", "B3", "E3", null, "B3", null,
    ],
  },
  boss: {
    bpm: 174,
    lead: [
      "E4", "E4", "G4", "A4", "Bb4", "A4", "G4", "E4",
      "D4", "E4", "G4", "B4", "A4", "G4", "Fs4", null,
      "E5", "Eb5", "D5", "C5", "B4", "A4", "G4", "Fs4",
      "E4", "G4", "B4", "Eb5", "E5", null, "B4", null,
    ],
    bass: [
      "E3", "E3", "E3", "G3", "E3", "E3", "D3", "E3",
      "C3", "C3", "D3", "D3", "B3", "A3", "G3", "Fs3",
      "E3", "E3", "G3", "A3", "B3", "B3", "A3", "G3",
      "C3", "D3", "B3", "B3", "E3", "B3", "E3", null,
    ],
  },
};

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;

  muted = false;
  private track: MusicTrack = "none";
  private stepIdx = 0;
  private timer: number | null = null;
  private musicPaused = false;

  unlock(): void {
    try {
      if (!this.ctx) {
        const AC: typeof AudioContext | undefined =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.55;

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.85;
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.24;

        const comp = this.ctx.createDynamicsCompressor();
        this.sfxGain.connect(this.master);
        this.bgmGain.connect(this.master);
        this.master.connect(comp);
        comp.connect(this.ctx.destination);

        const len = Math.floor(this.ctx.sampleRate * 0.45);
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.02);
    }
  }

  playMusic(track: MusicTrack): void {
    if (this.track === track && this.timer !== null) {
      this.musicPaused = false;
      return;
    }
    this.stopMusic();
    this.track = track;
    this.musicPaused = false;
    this.stepIdx = 0;
    if (track === "none") return;
    const song = SONGS[track];
    const stepMs = (60 / song.bpm / 2) * 1000; // corcheas
    const tick = () => {
      if (this.track !== track) return;
      if (!this.musicPaused && !this.muted && this.ctx && this.ctx.state === "running") {
        const i = this.stepIdx % song.lead.length;
        const l = song.lead[i];
        const b = song.bass[i];
        if (l && NOTE[l]) this.bgmNote(NOTE[l], 0.14, 0.22, "square");
        if (b && NOTE[b]) this.bgmNote(NOTE[b], 0.19, 0.28, "triangle");
        this.stepIdx++;
      }
    };
    tick();
    this.timer = window.setInterval(tick, stepMs);
  }

  pauseMusic(paused: boolean): void {
    this.musicPaused = paused;
  }

  stopMusic(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.track = "none";
  }

  private bgmNote(freq: number, dur: number, vol: number, type: OscillatorType): void {
    const ctx = this.ctx;
    if (!ctx || !this.bgmGain) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filt = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(type === "square" ? 1900 : 800, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(filt);
    filt.connect(g);
    g.connect(this.bgmGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private tone(freq: number, freqEnd: number, dur: number, vol: number, type: OscillatorType = "square", when = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain || this.muted) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t + dur);
    f.type = "lowpass";
    f.frequency.setValueAtTime(3800, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(f);
    f.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol: number, from: number, to: number, when = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain || !this.noiseBuf || this.muted) return;
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 0.9;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(60, to), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxGain);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  jump(): void {
    this.tone(240, 560, 0.14, 0.22, "square");
  }

  land(): void {
    this.noise(0.05, 0.08, 400, 140);
  }

  strike(): void {
    this.noise(0.09, 0.18, 2200, 700);
    this.tone(420, 190, 0.08, 0.16, "sawtooth");
  }

  wave(): void {
    this.tone(520, 960, 0.13, 0.16, "triangle");
    this.noise(0.11, 0.12, 3400, 1200);
  }

  blockBreak(): void {
    this.noise(0.16, 0.28, 1200, 220);
    this.tone(180, 75, 0.14, 0.26, "square");
  }

  blockBump(): void {
    this.tone(220, 340, 0.09, 0.2, "triangle");
  }

  coin(): void {
    this.tone(659.25, 659.25, 0.07, 0.2, "square", 0);
    this.tone(987.77, 987.77, 0.16, 0.2, "square", 0.055);
  }

  powerup(): void {
    const ns = [392, 493.88, 587.33, 783.99, 987.77];
    ns.forEach((n, i) => this.tone(n, n, 0.14, 0.2, "square", i * 0.055));
  }

  portrait(): void {
    const ns = [440, 554.37, 659.25, 880, 659.25, 880, 1108.73];
    ns.forEach((n, i) => this.tone(n, n, 0.24, 0.2, "sawtooth", i * 0.065));
  }

  checkpoint(): void {
    const ns = [523.25, 659.25, 783.99, 1046.5];
    ns.forEach((n, i) => this.tone(n, n, 0.2, 0.2, "triangle", i * 0.07));
  }

  enemyHit(): void {
    this.tone(320, 120, 0.11, 0.24, "sawtooth");
    this.noise(0.08, 0.16, 1500, 400);
  }

  enemyDefeat(): void {
    this.tone(240, 520, 0.1, 0.22, "square");
    this.noise(0.14, 0.22, 1600, 320);
  }

  bossHit(): void {
    this.tone(160, 70, 0.18, 0.32, "sawtooth");
    this.noise(0.16, 0.28, 1200, 260);
  }

  bossDefeat(): void {
    for (let i = 0; i < 6; i++) {
      this.noise(0.18, 0.26, 1400 - i * 120, 180, i * 0.12);
      this.tone(260 + i * 70, 140 + i * 50, 0.16, 0.2, "square", i * 0.12);
    }
  }

  skullTrap(): void {
    this.tone(320, 160, 0.16, 0.22, "sawtooth", 0);
    this.tone(280, 110, 0.2, 0.22, "sawtooth", 0.12);
  }

  hurt(): void {
    this.tone(220, 82, 0.26, 0.34, "sawtooth");
    this.noise(0.22, 0.26, 1400, 240);
  }

  stageClear(): void {
    const ns = [392, 493.88, 587.33, 783.99, 659.25, 783.99, 987.77, 1174.66];
    ns.forEach((n, i) => this.tone(n, n, 0.26, 0.22, "square", i * 0.08));
  }

  gameOver(): void {
    const ns = [392, 369.99, 349.23, 329.63, 293.66];
    ns.forEach((n, i) => this.tone(n, n * 0.98, 0.35, 0.22, "sawtooth", i * 0.14));
  }

  mapStep(): void {
    this.tone(440, 520, 0.06, 0.12, "triangle");
  }

  ui(): void {
    this.tone(523.25, 587.33, 0.08, 0.14, "triangle");
  }
}

export const sfx = new Sfx();

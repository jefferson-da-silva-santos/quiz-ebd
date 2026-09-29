/** Sons sintetizados com WebAudio — zero arquivos de áudio, latência mínima. */

type Cue = 'tick' | 'land' | 'drum' | 'win' | 'lose' | 'tap';

let ctx: AudioContext | null = null;
let enabled = true;

export const setSoundEnabled = (on: boolean): void => {
  enabled = on;
};

const audio = (): AudioContext | null => {
  if (!enabled || typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};

const tone = (ac: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, gain: number): void => {
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
};

export const play = (cue: Cue): void => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  switch (cue) {
    case 'tick':
      tone(ac, 1500, t, 0.035, 'square', 0.035);
      break;
    case 'tap':
      tone(ac, 660, t, 0.06, 'triangle', 0.06);
      break;
    case 'land':
      tone(ac, 523.25, t, 0.18, 'triangle', 0.12);
      tone(ac, 783.99, t + 0.09, 0.32, 'triangle', 0.12);
      break;
    case 'drum':
      for (let i = 0; i < 14; i++) tone(ac, 110 + (i % 2) * 8, t + i * 0.055, 0.05, 'sawtooth', 0.02 + i * 0.002);
      break;
    case 'win':
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, f, t + i * 0.09, 0.45, 'triangle', 0.11));
      break;
    case 'lose':
      tone(ac, 311.13, t, 0.28, 'sawtooth', 0.06);
      tone(ac, 233.08, t + 0.22, 0.5, 'sawtooth', 0.06);
      break;
  }
};

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

const cache = new Map<string, HTMLAudioElement>();

function getAudio(src: string): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  let el = cache.get(src);
  if (!el) {
    el = new Audio(src);
    el.preload = "auto";
    cache.set(src, el);
  }
  return el;
}

function playSample(src: string, volume = 1) {
  if (!enabled) return;
  const base = getAudio(src);
  if (!base) return;
  const el = base.cloneNode() as HTMLAudioElement;
  el.volume = Math.min(1, Math.max(0, volume));
  el.play().catch(() => {
    // autoplay restrictions or missing file: stay silent
  });
}

function blip(freq: number, dur: number, type: OscillatorType, gain: number, when = 0) {
  const ac = getCtx();
  if (!ac || !enabled) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ac.currentTime + when;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function playTick() {
  playSample("/assets/sounds/tick.wav", 0.5);
}

export function playClick() {
  blip(600, 0.06, "triangle", 0.05);
}

export function playOpen() {
  playSample("/assets/sounds/start.wav", 0.9);
}

const WIN_SOUNDS: Record<string, string> = {
  milspec: "/assets/sounds/milspec.wav",
  restricted: "/assets/sounds/restricted.wav",
  classified: "/assets/sounds/classified.wav",
  covert: "/assets/sounds/covert.wav",
  rare: "/assets/sounds/ancient.wav",
};

export function playWin(rarity: string) {
  const src = WIN_SOUNDS[rarity];
  if (src) {
    playSample(src, 1);
  } else {
    blip(440, 0.3, "triangle", 0.09);
    blip(554, 0.35, "triangle", 0.09, 0.09);
  }
}

export function playSell() {
  blip(880, 0.12, "sine", 0.07);
  blip(1175, 0.15, "sine", 0.07, 0.08);
}

export function playLose() {
  blip(330, 0.18, "triangle", 0.08);
  blip(220, 0.28, "triangle", 0.08, 0.14);
}

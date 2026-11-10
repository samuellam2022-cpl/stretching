/**
 * Hold timer for a stretch. Counts down holdSeconds, and for per-side stretches
 * runs a short "switch sides" pause and a second countdown.
 */

const SWITCH_SECONDS = 5;
const RING = 2 * Math.PI * 54; // circumference of the SVG ring (r = 54)

type Phase = { label: string; seconds: number; kind: 'hold' | 'switch' };

let interval: number | undefined;
let wakeLock: { release(): Promise<void> } | null = null;
let audio: AudioContext | null = null;

function beep(freq = 880, ms = 180): void {
  try {
    audio ??= new AudioContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + ms / 1000);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + ms / 1000);
  } catch {
    /* audio not available */
  }
}

async function keepAwake(on: boolean): Promise<void> {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) {
      wakeLock = await (navigator as Navigator & {
        wakeLock: { request(t: 'screen'): Promise<{ release(): Promise<void> }> };
      }).wakeLock.request('screen');
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    /* not supported or denied */
  }
}

export function stopTimer(): void {
  if (interval !== undefined) window.clearInterval(interval);
  interval = undefined;
  void keepAwake(false);
}

export function startTimer(root: HTMLElement, holdSeconds: number, perSide: boolean): void {
  stopTimer();
  const phases: Phase[] = perSide
    ? [
        { label: 'First side', seconds: holdSeconds, kind: 'hold' },
        { label: 'Switch sides', seconds: SWITCH_SECONDS, kind: 'switch' },
        { label: 'Second side', seconds: holdSeconds, kind: 'hold' },
      ]
    : [{ label: 'Hold', seconds: holdSeconds, kind: 'hold' }];

  const timeEl = root.querySelector<HTMLElement>('[data-timer-time]')!;
  const labelEl = root.querySelector<HTMLElement>('[data-timer-label]')!;
  const ring = root.querySelector<SVGCircleElement>('[data-timer-ring]')!;
  const btn = root.querySelector<HTMLButtonElement>('[data-timer-toggle]')!;

  let index = 0;
  let endAt = 0;

  const startPhase = () => {
    const p = phases[index];
    endAt = Date.now() + p.seconds * 1000;
    labelEl.textContent = p.label;
    root.dataset.kind = p.kind;
  };

  const tick = () => {
    const p = phases[index];
    const left = Math.max(0, endAt - Date.now());
    const secs = Math.ceil(left / 1000);
    timeEl.textContent = String(secs);
    ring.style.strokeDashoffset = String(RING * (1 - left / (p.seconds * 1000)));
    if (left <= 0) {
      index += 1;
      if (index < phases.length) {
        beep(660);
        startPhase();
      } else {
        beep(990, 400);
        stopTimer();
        labelEl.textContent = 'Done – nice work!';
        timeEl.textContent = '✓';
        root.dataset.kind = 'done';
        btn.textContent = 'Start again';
        btn.dataset.running = 'false';
      }
    }
  };

  root.dataset.active = 'true';
  btn.textContent = 'Stop';
  btn.dataset.running = 'true';
  beep(660, 80);
  void keepAwake(true);
  startPhase();
  tick();
  interval = window.setInterval(tick, 100);
}

export function resetTimerUI(root: HTMLElement, holdSeconds: number): void {
  stopTimer();
  root.dataset.kind = 'idle';
  root.querySelector<HTMLElement>('[data-timer-time]')!.textContent = String(holdSeconds);
  root.querySelector<HTMLElement>('[data-timer-label]')!.textContent = 'Ready';
  root.querySelector<SVGCircleElement>('[data-timer-ring]')!.style.strokeDashoffset = '0';
  const btn = root.querySelector<HTMLButtonElement>('[data-timer-toggle]')!;
  btn.textContent = 'Start timer';
  btn.dataset.running = 'false';
}

export const RING_LENGTH = RING;

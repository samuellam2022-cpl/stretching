import { t } from './i18n';

/**
 * Hold timer for a stretch: holdSeconds × sets, and for per-side stretches each
 * side is its own timed step (right, left, right, left…), with a short pause to
 * switch sides and a rest between sets.
 */

const SWITCH_SECONDS = 5;
const REST_SECONDS = 10;
const RING = 2 * Math.PI * 54; // circumference of the SVG ring (r = 54)
export const RING_LENGTH = RING;

export interface TimerPlan {
  holdSeconds: number;
  sets: number;
  perSide: boolean;
}

export interface Segment {
  set: number;
  side?: 'R' | 'L';
}

/** The timed steps of a stretch, in order. */
export function segmentsOf(plan: TimerPlan): Segment[] {
  const out: Segment[] = [];
  for (let set = 1; set <= plan.sets; set++) {
    if (plan.perSide) out.push({ set, side: 'R' }, { set, side: 'L' });
    else out.push({ set });
  }
  return out;
}

export const segmentLabel = (s: Segment): string =>
  s.side ? t('segSide', { side: t(s.side === 'R' ? 'sideR' : 'sideL'), n: s.set }) : t('setN', { n: s.set });

type Phase = { label: string; seconds: number; kind: 'hold' | 'switch' | 'rest'; seg: number };

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

function markSegments(root: HTMLElement, current: number, doneBelow: number): void {
  root.querySelectorAll<HTMLElement>('[data-seg]').forEach((el) => {
    const i = Number(el.dataset.seg);
    el.dataset.state = i < doneBelow ? 'done' : i === current ? 'current' : 'todo';
  });
}

/** Start the timer, optionally from a later step (e.g. the left side of set 1). */
export function startTimer(root: HTMLElement, plan: TimerPlan, fromSegment = 0): void {
  stopTimer();
  const segs = segmentsOf(plan);
  const phases: Phase[] = [];
  segs.forEach((s, i) => {
    if (i < fromSegment) return;
    if (i > fromSegment) {
      const prev = segs[i - 1];
      phases.push(
        prev.set === s.set
          ? { label: t('timerSwitch'), seconds: SWITCH_SECONDS, kind: 'switch', seg: i }
          : { label: t('timerRest'), seconds: REST_SECONDS, kind: 'rest', seg: i },
      );
    }
    phases.push({ label: segmentLabel(s), seconds: plan.holdSeconds, kind: 'hold', seg: i });
  });

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
    root.dataset.kind = p.kind === 'hold' ? 'hold' : 'switch';
    markSegments(root, p.kind === 'hold' ? p.seg : -1, p.seg);
  };

  const tick = () => {
    const p = phases[index];
    const left = Math.max(0, endAt - Date.now());
    timeEl.textContent = String(Math.ceil(left / 1000));
    ring.style.strokeDashoffset = String(RING * (1 - left / (p.seconds * 1000)));
    if (left <= 0) {
      index += 1;
      if (index < phases.length) {
        beep(660);
        startPhase();
      } else {
        beep(990, 400);
        stopTimer();
        labelEl.textContent = t('timerDone');
        timeEl.textContent = '✓';
        root.dataset.kind = 'done';
        markSegments(root, -1, segs.length);
        btn.textContent = t('timerAgain');
        btn.dataset.running = 'false';
      }
    }
  };

  btn.textContent = t('timerStop');
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
  root.querySelector<HTMLElement>('[data-timer-label]')!.textContent = t('timerReady');
  root.querySelector<SVGCircleElement>('[data-timer-ring]')!.style.strokeDashoffset = '0';
  markSegments(root, -1, 0);
  const btn = root.querySelector<HTMLButtonElement>('[data-timer-toggle]')!;
  btn.textContent = t('timerStart');
  btn.dataset.running = 'false';
}

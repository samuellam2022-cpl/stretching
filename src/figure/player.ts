import type { Pt } from './engine';
import { arrowSvg, DEFAULT_W, frame, sceneViewBox, type Scene, type SceneMuscles } from './scene';

/** Full cycle length: start → end → start. */
const CYCLE_MS = 3000;

/** 0 → 1 → 0 over one cycle, pausing briefly at each end, with smooth easing. */
export function cycleT(ms: number): number {
  const u = (ms % CYCLE_MS) / CYCLE_MS;
  const ease = (x: number) => (1 - Math.cos(Math.PI * x)) / 2;
  if (u < 0.1) return 0;
  if (u < 0.5) return ease((u - 0.1) / 0.4);
  if (u < 0.6) return 1;
  return 1 - ease((u - 0.6) / 0.4);
}

export interface DemoLabel {
  /** Muscle id. */
  id: string;
  level: 'primary' | 'secondary';
  /** Name in the current language, and in the other language. */
  title: string;
  sub: string;
  /** "Primary" / "主要" etc. */
  levelText: string;
}

/** Everything needed to draw one stretch demo. */
export interface Demo {
  scene: Scene;
  muscles: SceneMuscles;
  labels: DemoLabel[];
  /** Caption for the movement arrow, in the current language. */
  arrowText: string;
  /** Accessible description. */
  aria: string;
}

const ROW_H = 30;
const BOX_H = 25;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const r1 = (n: number) => Math.round(n * 10) / 10;
/** Rough text width: CJK glyphs are square, Latin ones a little over half as wide. */
const textW = (s: string, size: number) => [...s].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e7f ? size : size * 0.56), 0);

interface Box extends DemoLabel {
  x: number;
  y: number;
  w: number;
}

/** Put label boxes in rows above the picture, each as close as possible to its muscle. */
function layoutLabels(demo: Demo, anchors: Record<string, Pt>, w: number, top: number): { boxes: Box[]; band: number } {
  const items = demo.labels
    .filter((l) => anchors[l.id])
    .map((l) => ({
      ...l,
      ax: anchors[l.id].x,
      w: Math.max(textW(l.title, 9.5) + textW(l.levelText, 6.5) + 14, textW(l.sub, 7.2)) + 10,
    }))
    .sort((a, b) => a.ax - b.ax);
  if (!items.length) return { boxes: [], band: 0 };
  const total = items.reduce((sum, i) => sum + i.w + 4, 0);
  const rows = Math.max(1, Math.ceil(total / (w - 6)));
  const boxes: Box[] = [];
  for (let r = 0; r < rows; r++) {
    const row = items.filter((_, i) => i % rows === r);
    // Start centred on the muscle, then push apart and keep inside the picture.
    const want = row.map((i) => i.ax - i.w / 2);
    const xs = [...want];
    const spread = () => {
      for (let i = 0; i < row.length; i++) xs[i] = Math.max(i ? xs[i - 1] + row[i - 1].w + 4 : 3, xs[i]);
      for (let i = row.length - 1; i >= 0; i--) xs[i] = Math.min(i < row.length - 1 ? xs[i + 1] - row[i].w - 4 : w - 3 - row[i].w, xs[i]);
    };
    spread();
    // Pushing boxes apart drifts the group to the right; slide it back so it sits over its muscles.
    const drift = xs.reduce((sum, x, i) => sum + (x - want[i]), 0) / row.length;
    for (let i = 0; i < row.length; i++) xs[i] -= drift;
    spread();
    row.forEach((it, i) => boxes.push({ ...it, x: xs[i], y: top - (rows - r) * ROW_H + 2 }));
  }
  return { boxes, band: rows * ROW_H + 2 };
}

function boxSvg(b: Box): string {
  const pillW = textW(b.levelText, 6.5) + 6;
  return (
    `<g class="demo-label demo-label-${b.level}">` +
    `<rect class="demo-label-box" x="${r1(b.x)}" y="${r1(b.y)}" width="${r1(b.w)}" height="${BOX_H}" rx="5"/>` +
    `<text class="demo-label-title" x="${r1(b.x + 5)}" y="${r1(b.y + 11)}">${esc(b.title)}</text>` +
    `<rect class="demo-label-pill" x="${r1(b.x + b.w - pillW - 4)}" y="${r1(b.y + 3.5)}" width="${r1(pillW)}" height="9.5" rx="4.75"/>` +
    `<text class="demo-label-level" x="${r1(b.x + b.w - pillW / 2 - 4)}" y="${r1(b.y + 10.6)}" text-anchor="middle">${esc(b.levelText)}</text>` +
    `<text class="demo-label-sub" x="${r1(b.x + 5)}" y="${r1(b.y + 20.5)}">${esc(b.sub)}</text>` +
    `</g>`
  );
}

const leaders = (boxes: Box[], anchors: Record<string, Pt>): string =>
  boxes
    .map((b) => {
      const a = anchors[b.id];
      if (!a) return '';
      const x = Math.max(b.x + 6, Math.min(b.x + b.w - 6, a.x));
      return (
        `<path class="demo-leader demo-leader-${b.level}" d="M${r1(x)} ${r1(b.y + BOX_H)}L${r1(a.x)} ${r1(a.y)}"/>` +
        `<circle class="demo-leader-dot demo-leader-${b.level}" cx="${r1(a.x)}" cy="${r1(a.y)}" r="2"/>`
      );
    })
    .join('');

interface Prepared {
  open: string;
  boxes: Box[];
  staticSvg: string;
}

function prepare(demo: Demo): Prepared {
  const w = demo.scene.w ?? DEFAULT_W;
  const vb = sceneViewBox(demo.scene);
  const { boxes, band } = layoutLabels(demo, frame(demo.scene, 1, demo.muscles).anchors, w, vb.y);
  return {
    open: `<svg class="demo-svg" viewBox="0 ${vb.y - band} ${w} ${vb.h + band}" role="img" aria-label="${esc(demo.aria)}">`,
    boxes,
    staticSvg: arrowSvg(demo.scene, esc(demo.arrowText)) + boxes.map(boxSvg).join(''),
  };
}

/** A complete, static SVG of the demo at time t (used by the dev gallery). */
export function svgFor(demo: Demo, t: number): string {
  const pre = prepare(demo);
  const fr = frame(demo.scene, t, demo.muscles);
  return `${pre.open}<g>${fr.svg}</g><g>${leaders(pre.boxes, fr.anchors)}</g>${pre.staticSvg}</svg>`;
}

/**
 * Show the demo in el. Animates between start and end poses, or shows the end
 * pose only when the phone's "Reduce Motion" setting is on.
 * Returns a function that stops the animation.
 */
export function mountDemo(el: HTMLElement, demo: Demo): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pre = prepare(demo);
  el.innerHTML = `${pre.open}<g data-frame></g><g data-leaders></g>${pre.staticSvg}</svg>`;
  const frameG = el.querySelector<SVGGElement>('[data-frame]')!;
  const leaderG = el.querySelector<SVGGElement>('[data-leaders]')!;
  let raf = 0;
  let last = -1;
  let start = 0;

  const paint = (t: number) => {
    const fr = frame(demo.scene, t, demo.muscles);
    frameG.innerHTML = fr.svg;
    leaderG.innerHTML = leaders(pre.boxes, fr.anchors);
    last = t;
  };

  const loop = (now: number) => {
    if (!start) start = now;
    const t = cycleT(now - start);
    if (Math.abs(t - last) > 0.003) paint(t);
    raf = requestAnimationFrame(loop);
  };

  const apply = () => {
    cancelAnimationFrame(raf);
    if (mq.matches) {
      paint(1);
      el.dataset.motion = 'reduced';
    } else {
      el.dataset.motion = 'on';
      start = 0;
      last = -1;
      raf = requestAnimationFrame(loop);
    }
  };
  apply();
  mq.addEventListener('change', apply);

  return () => {
    cancelAnimationFrame(raf);
    mq.removeEventListener('change', apply);
  };
}

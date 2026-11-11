import { DEFAULT_W, renderScene, sceneViewBox, type Scene } from './scene';

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

export const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function svgFor(scene: Scene, t: number, label = ''): string {
  const w = scene.w ?? DEFAULT_W;
  const vb = sceneViewBox(scene);
  return `<svg class="demo-svg" viewBox="0 ${vb.y} ${w} ${vb.h}" role="img" aria-label="${label}"><g data-frame>${renderScene(scene, t)}</g></svg>`;
}

/**
 * Show the scene in el. Animates between start and end poses, or shows the end
 * pose only when the phone's "Reduce Motion" setting is on.
 * Returns a function that stops the animation.
 */
export function mountDemo(el: HTMLElement, scene: Scene, label: string): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  el.innerHTML = svgFor(scene, mq.matches ? 1 : 0, label);
  const frame = el.querySelector<SVGGElement>('[data-frame]')!;
  let raf = 0;
  let last = -1;
  let start = 0;

  const loop = (now: number) => {
    if (!start) start = now;
    const t = cycleT(now - start);
    if (Math.abs(t - last) > 0.003) {
      frame.innerHTML = renderScene(scene, t);
      last = t;
    }
    raf = requestAnimationFrame(loop);
  };

  const apply = () => {
    cancelAnimationFrame(raf);
    if (mq.matches) {
      frame.innerHTML = renderScene(scene, 1);
      el.dataset.motion = 'reduced';
    } else {
      el.dataset.motion = 'on';
      start = 0;
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

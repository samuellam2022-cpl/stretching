import { lerpPose, renderActor, type Ground, type Highlight, type Joints, type Pose, type Pt, type Role } from './engine';

export interface Actor {
  role?: Role;
  /** Mirror the figure so it faces left. */
  flip?: boolean;
  ground?: Ground;
  from: Pose;
  /** End pose; if omitted the figure stays still. */
  to?: Pose;
  /** Muscles being stretched, drawn in red. */
  muscles?: Highlight[];
}

export interface PropCtx {
  /** Joints of each actor for the current frame. */
  j: Joints[];
  floor: number;
  w: number;
  h: number;
}
export type Prop = (ctx: PropCtx) => string;

export interface Scene {
  w?: number;
  h?: number;
  /** y of the floor line; false = no floor (e.g. a view from above). */
  floor?: number | false;
  /** Drawn behind the figures (walls, chairs, balls…). */
  back?: Prop[];
  /** Drawn in front of the figures (straps, towels…). */
  front?: Prop[];
  /** Drawn first; partners usually go before the main figure if they are behind it. */
  actors: Actor[];
}

export const DEFAULT_W = 320;
export const DEFAULT_H = 210;
export const DEFAULT_FLOOR = 198;

/** Render one frame. t = 0 → start pose, 1 → end pose. */
export function renderScene(scene: Scene, t: number): string {
  return frame(scene, t).svg;
}

/**
 * Visible vertical range of the scene: from just above the highest point any
 * figure reaches during the animation down to the bottom, so lying-down
 * stretches don't leave a big empty area above them.
 */
export function sceneViewBox(scene: Scene): { y: number; h: number } {
  const h = scene.h ?? DEFAULT_H;
  if (scene.floor === false) return { y: 0, h };
  let top = Infinity;
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    for (const j of frame(scene, t).joints) for (const p of Object.values(j)) top = Math.min(top, p.y);
  }
  const y = Math.max(0, Math.min(h - 100, Math.floor(top - 22)));
  return { y, h: h - y };
}

function frame(scene: Scene, t: number): { svg: string; joints: Joints[] } {
  const w = scene.w ?? DEFAULT_W;
  const h = scene.h ?? DEFAULT_H;
  const floor = scene.floor === false ? h + 1000 : scene.floor ?? DEFAULT_FLOOR;
  const joints: Joints[] = [];
  const actorSvg: string[] = [];
  // Resolve actors in order so later actors can reach earlier ones' joints.
  // Actors referencing a later actor are resolved in a second pass.
  for (let pass = 0; pass < 2; pass++) {
    scene.actors.forEach((a, i) => {
      const pose = a.to ? lerpPose(a.from, a.to, t) : a.from;
      const frame = renderActor(pose, a.role ?? 'main', {
        ground: a.ground,
        floor,
        flip: a.flip,
        muscles: a.muscles,
        others: joints,
      });
      joints[i] = frame.joints;
      actorSvg[i] = frame.svg;
    });
  }
  const ctx: PropCtx = { j: joints, floor, w, h };
  const floorLine = scene.floor === false ? '' : `<rect class="floor" x="0" y="${floor}" width="${w}" height="${h - floor}"/>`;
  const svg =
    floorLine +
    (scene.back ?? []).map((p) => p(ctx)).join('') +
    actorSvg.join('') +
    (scene.front ?? []).map((p) => p(ctx)).join('');
  return { svg, joints };
}

// ---------- props ----------

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Resolve "0.handR" style references (with optional offset) to a point. */
export function pt(ctx: PropCtx, ref: string | Pt, dx = 0, dy = 0): Pt {
  if (typeof ref !== 'string') return { x: ref.x + dx, y: ref.y + dy };
  const [who, joint] = ref.split('.');
  const p = ctx.j[Number(who)]?.[joint] ?? { x: 0, y: 0 };
  return { x: p.x + dx, y: p.y + dy };
}

export const wall =
  (x: number, side: 'left' | 'right' = 'left'): Prop =>
  ({ floor }) =>
    side === 'left'
      ? `<rect class="prop" x="${x - 14}" y="0" width="14" height="${floor}"/>`
      : `<rect class="prop" x="${x}" y="0" width="14" height="${floor}"/>`;

/** A stool whose seat sits under the given actor's pelvis. */
export const stool =
  (actor = 0, width = 44, dx = 0): Prop =>
  (ctx) => {
    const p = pt(ctx, `${actor}.pelvis`);
    const top = p.y + 9;
    const x = p.x - width / 2 + dx;
    const legH = ctx.floor - top - 5;
    return (
      `<rect class="prop" x="${r1(x)}" y="${r1(top)}" width="${width}" height="6" rx="2"/>` +
      `<rect class="prop-dark" x="${r1(x + 4)}" y="${r1(top + 6)}" width="5" height="${r1(legH)}"/>` +
      `<rect class="prop-dark" x="${r1(x + width - 9)}" y="${r1(top + 6)}" width="5" height="${r1(legH)}"/>`
    );
  };

export const block =
  (x: number, w: number, h: number, cls = 'prop-accent'): Prop =>
  ({ floor }) =>
    `<rect class="${cls}" x="${x}" y="${floor - h}" width="${w}" height="${h}" rx="3"/>`;

export const step =
  (x: number, w: number, h: number): Prop =>
  ({ floor }) =>
    `<rect class="prop" x="${x}" y="${floor - h}" width="${w}" height="${h}" rx="2"/>`;

export const ball =
  (x: number, r: number): Prop =>
  ({ floor }) =>
    `<circle class="prop-accent" cx="${x}" cy="${floor - r}" r="${r}"/>` +
    `<path class="prop-line" d="M${x - r * 0.75} ${floor - r * 1.35} Q${x} ${floor - r * 0.7} ${x + r * 0.75} ${floor - r * 1.35}" />`;

export const roller =
  (x: number, r: number): Prop =>
  ({ floor }) =>
    `<circle class="prop-accent" cx="${x}" cy="${floor - r}" r="${r}"/>` +
    `<circle class="prop-line" cx="${x}" cy="${floor - r}" r="${r * 0.45}"/>`;

/** A mat seen from above (for figures drawn from above). */
export const mat =
  (x: number, y: number, w: number, h: number): Prop =>
  () =>
    `<rect class="mat" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>`;

/** Strap or towel through a list of points (joint refs or fixed points). */
export const strap =
  (points: (string | [string, number, number] | Pt)[], cls: 'strap' | 'towel' = 'strap'): Prop =>
  (ctx) => {
    const ps = points.map((p) => (Array.isArray(p) ? pt(ctx, p[0], p[1], p[2]) : pt(ctx, p)));
    const d = ps.map((p, i) => `${i ? 'L' : 'M'}${r1(p.x)} ${r1(p.y)}`).join('');
    return `<path class="${cls}" d="${d}"/>`;
  };

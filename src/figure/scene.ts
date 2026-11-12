import { lerpPose, renderActor, type Ground, type Highlight, type Joints, type MuscleLevel, type Pose, type Pt, type Role } from './engine';
import { defaultHighlights, type HighlightSpec } from './muscleMap';

export interface Actor {
  role?: Role;
  /** Mirror the figure so it faces left. */
  flip?: boolean;
  ground?: Ground;
  from: Pose;
  /** End pose; if omitted the figure stays still. */
  to?: Pose;
}

export interface PropCtx {
  /** Joints of each actor for the current frame. */
  j: Joints[];
  floor: number;
  w: number;
  h: number;
}
export type Prop = (ctx: PropCtx) => string;

/** A movement cue: an arrow following a joint from the start pose to the end pose, with a caption. */
export interface Arrow {
  /** Joint to follow, e.g. "heelR". */
  joint: string;
  /** Which actor the joint belongs to (default: the main figure). */
  actor?: number;
  label: { en: string; zh: string };
  /** Shift the arrow away from the body. */
  dx?: number;
  dy?: number;
  /** How much the arrow bows (fraction of its length; sign picks the side). */
  curve?: number;
  /** Shift the caption. */
  tx?: number;
  ty?: number;
}

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
  /** Which side of the body is being stretched (default "R" = the near side in side view). */
  limb?: 'R' | 'L';
  /** Where a muscle's overlay goes, when the default position for that muscle doesn't fit this pose. */
  hl?: Record<string, HighlightSpec[]>;
  arrow?: Arrow;
}

/** Muscle ids of the stretch shown in the scene. */
export interface SceneMuscles {
  primary: string[];
  secondary: string[];
}

export const DEFAULT_W = 320;
export const DEFAULT_H = 210;
export const DEFAULT_FLOOR = 198;

export interface Frame {
  svg: string;
  joints: Joints[];
  /** Centre of each muscle overlay, by muscle id. */
  anchors: Record<string, Pt>;
}

/** Render one frame. t = 0 → start pose, 1 → end pose. */
export function renderScene(scene: Scene, t: number, muscles?: SceneMuscles): string {
  return frame(scene, t, muscles).svg;
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
  top -= 22;
  // Leave room for the movement arrow and its caption too.
  const g = arrowGeom(scene);
  if (g) top = Math.min(top, g.s.y - 6, g.c.y - 4, g.e.y - 6, g.text.y - 9);
  const y = Math.max(-20, Math.min(h - 100, Math.floor(top)));
  return { y, h: h - y };
}

const mainIndex = (scene: Scene): number => Math.max(0, scene.actors.findIndex((a) => (a.role ?? 'main') === 'main'));

function highlightsFor(scene: Scene, muscles?: SceneMuscles): Highlight[] {
  if (!muscles) return [];
  const view = scene.actors[mainIndex(scene)].from.view ?? 'side';
  const out: Highlight[] = [];
  const addAll = (ids: string[], level: MuscleLevel) => {
    for (const id of ids) {
      const specs = scene.hl?.[id] ?? defaultHighlights(id, view, scene.limb ?? 'R');
      for (const sp of specs) out.push({ ...sp, muscle: id, level });
    }
  };
  // Secondary first so primary muscles are drawn on top where they overlap.
  addAll(muscles.secondary, 'secondary');
  addAll(muscles.primary, 'primary');
  return out;
}

export function frame(scene: Scene, t: number, muscles?: SceneMuscles): Frame {
  const w = scene.w ?? DEFAULT_W;
  const h = scene.h ?? DEFAULT_H;
  const floor = scene.floor === false ? h + 1000 : scene.floor ?? DEFAULT_FLOOR;
  const joints: Joints[] = [];
  const actorSvg: string[] = [];
  let anchors: Record<string, Pt> = {};
  const main = mainIndex(scene);
  const hls = highlightsFor(scene, muscles);
  // Resolve actors in order so later actors can reach earlier ones' joints.
  // Actors referencing a later actor are resolved in a second pass.
  for (let pass = 0; pass < 2; pass++) {
    scene.actors.forEach((a, i) => {
      const pose = a.to ? lerpPose(a.from, a.to, t) : a.from;
      const fr = renderActor(pose, a.role ?? 'main', {
        ground: a.ground,
        floor,
        flip: a.flip,
        muscles: i === main ? hls : undefined,
        others: joints,
      });
      joints[i] = fr.joints;
      actorSvg[i] = fr.svg;
      if (i === main) anchors = fr.anchors;
    });
  }
  const ctx: PropCtx = { j: joints, floor, w, h };
  const floorLine = scene.floor === false ? '' : `<rect class="floor" x="0" y="${floor}" width="${w}" height="${h - floor}"/>`;
  const svg =
    floorLine +
    (scene.back ?? []).map((p) => p(ctx)).join('') +
    actorSvg.join('') +
    (scene.front ?? []).map((p) => p(ctx)).join('');
  return { svg, joints, anchors };
}

interface ArrowGeom {
  s: Pt;
  c: Pt;
  e: Pt;
  /** Base of the arrow head. */
  hb: Pt;
  /** Unit tangent at the end. */
  u: Pt;
  /** Caption position. */
  text: Pt;
}

function arrowGeom(scene: Scene): ArrowGeom | null {
  const a = scene.arrow;
  if (!a) return null;
  const who = a.actor ?? mainIndex(scene);
  const p0 = frame(scene, 0).joints[who]?.[a.joint];
  const p1 = frame(scene, 1).joints[who]?.[a.joint];
  if (!p0 || !p1) return null;
  const s = { x: p0.x + (a.dx ?? 0), y: p0.y + (a.dy ?? 0) };
  const e = { x: p1.x + (a.dx ?? 0), y: p1.y + (a.dy ?? 0) };
  const len = Math.hypot(e.x - s.x, e.y - s.y);
  if (len < 5) return null;
  const nx = -(e.y - s.y) / len;
  const ny = (e.x - s.x) / len;
  const k = (a.curve ?? 0.22) * len;
  const c = { x: (s.x + e.x) / 2 + nx * k, y: (s.y + e.y) / 2 + ny * k };
  const tx = e.x - c.x;
  const ty = e.y - c.y;
  const tl = Math.hypot(tx, ty) || 1;
  const u = { x: tx / tl, y: ty / tl };
  const hb = { x: e.x - u.x * 7, y: e.y - u.y * 7 };
  const mid = { x: 0.25 * s.x + 0.5 * c.x + 0.25 * e.x, y: 0.25 * s.y + 0.5 * c.y + 0.25 * e.y };
  const sign = Math.sign(k || 1);
  return { s, c, e, hb, u, text: { x: mid.x + nx * 10 * sign + (a.tx ?? 0), y: mid.y + ny * 10 * sign + (a.ty ?? 0) } };
}

/** Static arrow from where the joint starts to where it ends, plus a caption. */
export function arrowSvg(scene: Scene, caption: string): string {
  const g = arrowGeom(scene);
  if (!g) return '';
  const { s, c, e, hb, u, text } = g;
  const head = `M${r1(e.x)} ${r1(e.y)}L${r1(hb.x - u.y * 3.6)} ${r1(hb.y + u.x * 3.6)}L${r1(hb.x + u.y * 3.6)} ${r1(hb.y - u.x * 3.6)}Z`;
  return (
    `<path class="demo-arrow" d="M${r1(s.x)} ${r1(s.y)}Q${r1(c.x)} ${r1(c.y)} ${r1(hb.x)} ${r1(hb.y)}"/>` +
    `<path class="demo-arrow-head" d="${head}"/>` +
    `<text class="demo-arrow-text" x="${r1(text.x)}" y="${r1(text.y)}" text-anchor="middle" dominant-baseline="middle">${caption}</text>`
  );
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

/**
 * A small 2D figure renderer for the stretch demos.
 *
 * A pose is a set of joint angles. Every angle is an absolute direction in
 * degrees: 0 = pointing down, 90 = pointing right (the way the figure faces),
 * 180 = up, -90 = left. dir(a) = (sin a, cos a) in SVG coordinates (y down).
 *
 * The body is drawn with proper widths (tapered limbs, a shaped torso, head
 * and neck) in roughly adult proportions: about 170 units tall standing.
 */

export type ViewKind = 'side' | 'front';
/** [upper segment, lower segment, hand/foot]. Hand/foot is optional. */
export type Limb = [number, number, number?];

/**
 * A joint position to reach: "self.kneeR" (this figure), "0.elbowL" (actor 0 in
 * the scene), or a fixed point. dx/dy shift the target.
 */
export type Target = string | Pt;
/** Place the wrist/ankle on a target with 2-bone IK. bend picks which way the elbow/knee points. */
export interface IK {
  ik: Target;
  bend?: 1 | -1;
  /** Absolute angle of the hand/foot; defaults to following the forearm/shin. */
  end?: number;
  dx?: number;
  dy?: number;
}
export type LimbSpec = Limb | IK;
export const isIK = (l: LimbSpec | undefined): l is IK => !!l && !Array.isArray(l);

export type ScaleKey = `${'upperArm' | 'forearm' | 'thigh' | 'shin'}${'R' | 'L'}`;

export interface Pose {
  /** "side" = seen from the person's right; "front" = facing the viewer (or seen from above when lying). */
  view?: ViewKind;
  /** Pelvis position. y is ignored when the actor is auto-grounded. */
  x: number;
  y?: number;
  /** Direction from pelvis to the base of the neck (180 = upright). */
  torso: number;
  /** Spine curve in degrees: + rounds the back (flexion), − arches it (extension). */
  bend?: number;
  neck?: number;
  head?: number;
  /** Near (right) side in side view. */
  armR: LimbSpec;
  armL?: LimbSpec;
  legR: LimbSpec;
  legL?: LimbSpec;
  /** Foreshortening, e.g. { thighR: 0.4 } for a thigh pointing at the viewer. */
  scale?: Partial<Record<ScaleKey, number>>;
  /** Front view only: "back" = seen from behind (hair covers the head, no face). */
  facing?: 'front' | 'back';
  /** Draw the arms behind the torso/legs (e.g. hands behind the back). */
  armsBehind?: boolean;
  /** Front view: draw the left arm over the right one. */
  leftArmFront?: boolean;
  /** Draw the near arm behind the near leg (e.g. hugging a knee from outside). */
  nearArmBehindLeg?: boolean;
}

export type Pt = { x: number; y: number };
export type Joints = Record<string, Pt>;

/** Where to place the figure vertically. */
export type Ground =
  | 'auto' // lowest part of the body rests on the floor
  | 'pose' // use the (animated) pose.y as the pelvis y
  | number // pelvis y
  | { joint: string; y: number }; // a given joint sits at y

export type PartName =
  | 'neck'
  | 'head'
  | 'torso'
  | 'glutes'
  | 'gluteMed'
  | 'piriformis'
  | `${'upperArm' | 'forearm' | 'thigh' | 'shin' | 'foot'}${'R' | 'L'}`;

export type MuscleLevel = 'primary' | 'secondary';

export interface Highlight {
  /** Muscle id this overlay belongs to (used for labels) and whether it is a primary or secondary muscle. */
  muscle?: string;
  level?: MuscleLevel;
  part: PartName;
  /** 1 = front of the segment, −1 = back, 0 = centre. In front view: + is screen-right for vertical parts. */
  side?: number;
  /** Portion of the segment (0 = start, 1 = end). */
  from?: number;
  to?: number;
}

export type Role = 'main' | 'partner';

// ---------- proportions ----------

const L = {
  spine: 52,
  neck: 9,
  head: 10.5,
  upperArm: 30,
  forearm: 26,
  hand: 9,
  thigh: 43,
  shin: 41,
  foot: 13,
  shoulderDrop: 5,
  shoulderHalf: 16.5,
  hipHalf: 8.5,
};

const R = {
  upperArm: [5.9, 4.4],
  forearm: [4.4, 3.1],
  hand: [3.1, 2.4],
  thigh: [9.9, 6.4],
  shin: [6.5, 4.1],
  foot: [3.9, 2.4],
  neck: [4.6, 4.6],
} as const;

// Torso half-widths along the spine: [fraction, front, back] (side view) / [fraction, half] (front view).
const TORSO_SIDE: [number, number, number][] = [
  [0, 10.5, 12.5],
  [0.38, 9.6, 8.8],
  [0.72, 13, 10.4],
  [0.93, 10, 9.4],
  [1, 6, 6.5],
];
const TORSO_FRONT: [number, number][] = [
  [0, 16.5],
  [0.38, 13],
  [0.72, 16.5],
  [0.93, 17.5],
  [1, 7],
];

// ---------- math ----------

const rad = (d: number) => (d * Math.PI) / 180;
export const dir = (a: number): Pt => ({ x: Math.sin(rad(a)), y: Math.cos(rad(a)) });
const add = (p: Pt, v: Pt, k = 1): Pt => ({ x: p.x + v.x * k, y: p.y + v.y * k });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
/** Normal pointing to the "front" of a segment pointing along d (for a downward limb, front = +x). */
const frontOf = (d: Pt, sign: number): Pt => ({ x: d.y * sign, y: -d.x * sign });
const f1 = (n: number) => Math.round(n * 10) / 10;

// ---------- shapes ----------

type Material = 'skin' | 'shirt' | 'pants' | 'shoe' | 'hair' | 'eye';

interface Shape {
  /** What the shape is made of – decides its colour. */
  mat?: Material;
  d: string;
  /** For grounding: points with a radius that bound the shape. */
  bounds: { p: Pt; r: number }[];
}

function capsule(a: Pt, b: Pt, ra: number, rb: number): Shape {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 0.001;
  const ux = dx / len;
  const uy = dy / len;
  // Tangent angle offset for circles of different radii.
  const s = Math.max(-1, Math.min(1, (ra - rb) / len));
  const c = Math.sqrt(1 - s * s);
  // Normal rotated toward the larger end.
  const n1 = { x: -uy * c + ux * s, y: ux * c + uy * s };
  const n2 = { x: uy * c + ux * s, y: -ux * c + uy * s };
  const a1 = add(a, n1, ra);
  const b1 = add(b, n1, rb);
  const b2 = add(b, n2, rb);
  const a2 = add(a, n2, ra);
  const d =
    `M${f1(a1.x)} ${f1(a1.y)}L${f1(b1.x)} ${f1(b1.y)}` +
    `A${f1(rb)} ${f1(rb)} 0 0 0 ${f1(b2.x)} ${f1(b2.y)}` +
    `L${f1(a2.x)} ${f1(a2.y)}` +
    `A${f1(ra)} ${f1(ra)} 0 1 0 ${f1(a1.x)} ${f1(a1.y)}Z`;
  return { d, bounds: [{ p: a, r: ra }, { p: b, r: rb }] };
}

/** Smooth closed path through points (Catmull-Rom → cubic Bézier). */
function smoothClosed(pts: Pt[]): string {
  const n = pts.length;
  let d = `M${f1(pts[0].x)} ${f1(pts[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C${f1(c1.x)} ${f1(c1.y)} ${f1(c2.x)} ${f1(c2.y)} ${f1(p2.x)} ${f1(p2.y)}`;
  }
  return d + 'Z';
}

function ellipse(c: Pt, along: Pt, rAlong: number, rAcross: number): Shape {
  const angle = (Math.atan2(along.y, along.x) * 180) / Math.PI;
  // Encoded as "E cx,cy,rx,ry,angle" and turned into an <ellipse> by shapeToSvg.
  return {
    d: `E${f1(c.x)},${f1(c.y)},${f1(rAlong)},${f1(rAcross)},${f1(angle)}`,
    bounds: [{ p: c, r: Math.max(rAlong, rAcross) }],
  };
}

function shapeToSvg(s: Shape, cls: string): string {
  if (!s.d) return '';
  if (s.d.startsWith('E')) {
    const [cx, cy, rx, ry, ang] = s.d.slice(1).split(',');
    return `<ellipse class="${cls}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${ang} ${cx} ${cy})"/>`;
  }
  return `<path class="${cls}" d="${s.d}"/>`;
}

// ---------- skeleton ----------

interface Segment {
  a: Pt;
  b: Pt;
  ra: number;
  rb: number;
  /** +1 if "front" = frontOf(d, +1) */
  frontSign: number;
}

interface Built {
  joints: Joints;
  parts: Record<string, Shape[]>;
  segs: Partial<Record<PartName, Segment>>;
  spine: { pts: Pt[]; dirs: Pt[]; front: number[]; back: number[] };
  view: ViewKind;
}

interface Resolved extends Pose {
  armR: Limb;
  armL?: Limb;
  legR: Limb;
  legL?: Limb;
}

function build(p: Resolved): Built {
  const view = p.view ?? 'side';
  const front = view === 'front';
  const pelvis: Pt = { x: p.x, y: p.y ?? 0 };
  const bend = p.bend ?? 0;

  // Spine as a gently curved chain.
  const N = 6;
  const spinePts: Pt[] = [pelvis];
  const spineDirs: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const a = p.torso + bend * (0.5 - (i + 0.5) / N);
    const d = dir(a);
    spineDirs.push(d);
    spinePts.push(add(spinePts[i], d, L.spine / N));
  }
  spineDirs.push(spineDirs[N - 1]);
  const neckBase = spinePts[N];
  const topDir = spineDirs[N - 1];
  const torsoFrontN = frontOf(topDir, -1);

  const sample = (table: number[][], f: number, col: number) => {
    for (let i = 1; i < table.length; i++) {
      if (f <= table[i][0]) {
        const t = (f - table[i - 1][0]) / (table[i][0] - table[i - 1][0]);
        return lerp(table[i - 1][col], table[i][col], t);
      }
    }
    return table[table.length - 1][col];
  };
  const frontW: number[] = [];
  const backW: number[] = [];
  spinePts.forEach((_, i) => {
    const f = i / N;
    frontW.push(front ? sample(TORSO_FRONT, f, 1) : sample(TORSO_SIDE, f, 1));
    backW.push(front ? sample(TORSO_FRONT, f, 1) : sample(TORSO_SIDE, f, 2));
  });

  const outline: Pt[] = [];
  const back: Pt[] = [];
  spinePts.forEach((pt, i) => {
    const d = spineDirs[Math.min(i, N - 1)];
    const n = frontOf(d, -1);
    outline.push(add(pt, n, frontW[i]));
    back.push(add(pt, n, -backW[i]));
  });
  const bottom = add(pelvis, spineDirs[0], front ? -7 : -8);
  const torsoPts = [bottom, ...outline, ...back.reverse()];
  const torsoShape: Shape = {
    d: smoothClosed(torsoPts),
    bounds: [...torsoPts.map((pt) => ({ p: pt, r: 1 }))],
  };

  // Neck & head
  const neckDir = dir(p.neck ?? p.torso - bend / 2);
  const headDir = dir(p.head ?? p.neck ?? p.torso - bend / 2);
  const neckStart = add(neckBase, topDir, -3);
  const neckTop = add(neckBase, neckDir, L.neck);
  const headC = add(neckTop, headDir, L.head);
  const headFront = frontOf(headDir, -1);

  // Shoulders & hips
  const lateral = frontOf(topDir, -1); // in front view this is screen-right when upright
  const shoulderBase = add(neckBase, topDir, -L.shoulderDrop);
  const shoulderR = front ? add(shoulderBase, lateral, -L.shoulderHalf) : add(shoulderBase, torsoFrontN, -1);
  const shoulderL = front ? add(shoulderBase, lateral, L.shoulderHalf) : shoulderR;
  const pelvisLat = frontOf(spineDirs[0], -1);
  const hipR = front ? add(pelvis, pelvisLat, -L.hipHalf) : pelvis;
  const hipL = front ? add(pelvis, pelvisLat, L.hipHalf) : pelvis;

  const joints: Joints = { pelvis, neckBase, neckTop, head: headC, hipR, hipL, shoulderR, shoulderL };
  joints.chest = spinePts[Math.round(N * 0.72)];
  joints.waist = spinePts[Math.round(N * 0.38)];
  const parts: Record<string, Shape[]> = {};
  const segs: Built['segs'] = {};

  const limb = (side: 'R' | 'L', kind: 'arm' | 'leg', angles: Limb) => {
    const [ua, la, ea] = angles;
    const isArm = kind === 'arm';
    const root = isArm ? (side === 'R' ? shoulderR : shoulderL) : side === 'R' ? hipR : hipL;
    const d1 = dir(ua);
    const d2 = dir(la);
    const sc = p.scale ?? {};
    const len1 = (isArm ? L.upperArm : L.thigh) * (sc[`${isArm ? 'upperArm' : 'thigh'}${side}`] ?? 1);
    const len2 = (isArm ? L.forearm : L.shin) * (sc[`${isArm ? 'forearm' : 'shin'}${side}`] ?? 1);
    const mid = add(root, d1, len1);
    const end = add(mid, d2, len2);
    const r1 = isArm ? R.upperArm : R.thigh;
    const r2 = isArm ? R.forearm : R.shin;
    const n1 = isArm ? `upperArm${side}` : `thigh${side}`;
    const n2 = isArm ? `forearm${side}` : `shin${side}`;
    const shapes: Shape[] = isArm
      ? [
          { ...capsule(root, mid, r1[0], r1[1]), mat: 'skin' },
          { ...capsule(mid, end, r2[0], r2[1]), mat: 'skin' },
          // short sleeve over the top of the upper arm
          { ...capsule(root, lerpPt(root, mid, 0.58), r1[0] + 0.7, lerp(r1[0], r1[1], 0.58) + 0.7), mat: 'shirt' },
        ]
      : [
          { ...capsule(root, mid, r1[0], r1[1]), mat: 'pants' },
          { ...capsule(mid, end, r2[0], r2[1]), mat: 'pants' },
        ];
    segs[n1 as PartName] = { a: root, b: mid, ra: r1[0], rb: r1[1], frontSign: 1 };
    segs[n2 as PartName] = { a: mid, b: end, ra: r2[0], rb: r2[1], frontSign: 1 };
    if (isArm) {
      const hd = dir(ea ?? la);
      const tip = add(end, hd, L.hand);
      shapes.push({ ...capsule(add(end, hd, 1.5), tip, R.hand[0], R.hand[1]), mat: 'skin' });
      joints[`elbow${side}`] = mid;
      joints[`wrist${side}`] = end;
      joints[`hand${side}`] = add(end, hd, L.hand * 0.6);
      joints[`fingers${side}`] = tip;
    } else {
      let toe: Pt;
      let heel: Pt;
      if (front) {
        const fd = dir(ea ?? la);
        heel = add(end, fd, 1);
        toe = add(end, fd, 7);
        shapes.push({ ...capsule(heel, toe, 4.3, 3.6), mat: 'shoe' });
      } else {
        const fd = dir(ea ?? la + 90);
        const sole = frontOf(fd, 1); // points "down" through the sole when foot is flat
        heel = add(add(end, fd, -2.5), sole, -1.2);
        toe = add(add(end, fd, L.foot), sole, -2.2);
        shapes.push({ ...capsule(heel, toe, R.foot[0], R.foot[1]), mat: 'shoe' });
        segs[`foot${side}` as PartName] = { a: heel, b: toe, ra: R.foot[0], rb: R.foot[1], frontSign: 1 };
      }
      joints[`knee${side}`] = mid;
      joints[`ankle${side}`] = end;
      joints[`toe${side}`] = toe;
      joints[`heel${side}`] = heel;
    }
    parts[`${kind}${side}`] = shapes;
  };

  limb('R', 'arm', p.armR);
  limb('L', 'arm', p.armL ?? p.armR);
  limb('R', 'leg', p.legR);
  limb('L', 'leg', p.legL ?? p.legR);

  torsoShape.mat = 'shirt';
  parts.torso = [torsoShape];
  parts.neck = [{ ...capsule(neckStart, neckTop, R.neck[0], R.neck[1]), mat: 'skin' }];
  // Head: skin, then hair and eyes placed in the head's own frame (a = across/front, u = up).
  const hp = (a: number, u: number): Pt => add(add(headC, headFront, a), headDir, u);
  const poly = (pts: [number, number][], mat: Material): Shape => ({ d: smoothClosed(pts.map(([a, u]) => hp(a, u))), bounds: [], mat });
  const dot = (a: number, u: number): Shape => ({ ...ellipse(hp(a, u), headDir, 1.25, 1.05), mat: 'eye', bounds: [] });
  const headShapes: Shape[] = [{ ...ellipse(headC, headDir, 11.2, 9.4), mat: 'skin' }];
  if (!front) {
    headShapes.push({ ...capsule(hp(7.8, -3), hp(9.9, -4.6), 1.7, 1.3), mat: 'skin' }); // nose
    headShapes.push(
      poly([[6.2, 8.4], [1.5, 11.9], [-5, 11.2], [-9.6, 6.5], [-10.3, -0.5], [-8.4, -7], [-5.2, -8.6], [-5.6, -2.5], [-3.4, 3.6], [2.2, 7]], 'hair'),
    );
    headShapes.push(dot(5.6, 0.8));
  } else if (p.facing === 'back') {
    headShapes.push(
      poly([[-9.9, 1], [-9, 7.2], [-5, 11.2], [0, 12.2], [5, 11.2], [9, 7.2], [9.9, 1], [9.2, -5], [5.5, -9], [0, -10], [-5.5, -9], [-9.2, -5]], 'hair'),
    );
  } else {
    headShapes.push(
      poly([[-9.9, 0.5], [-9, 7.2], [-5, 11.2], [0, 12.2], [5, 11.2], [9, 7.2], [9.9, 0.5], [8.2, 4.4], [4.2, 7.6], [0, 8.3], [-4.2, 7.6], [-8.2, 4.4]], 'hair'),
    );
    headShapes.push(dot(-3.5, -0.2), dot(3.5, -0.2));
  }
  parts.head = headShapes;
  segs.neck = { a: neckStart, b: neckTop, ra: R.neck[0], rb: R.neck[1], frontSign: -1 };
  segs.head = { a: add(headC, headDir, -10), b: add(headC, headDir, 8), ra: 9, rb: 9, frontSign: -1 };

  return {
    joints,
    parts,
    segs,
    spine: { pts: spinePts, dirs: spineDirs, front: frontW, back: backW },
    view,
  };
}

// ---------- pose interpolation ----------

type Num = number | undefined;
function lerpNum(a: Num, b: Num, t: number): Num {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return lerp(a, b, t);
}
function lerpTarget(a: Target, b: Target, t: number): Target {
  if (typeof a === 'string' || typeof b === 'string') return t < 0.5 ? a : b;
  return lerpPt(a, b, t);
}
function lerpLimb(a: LimbSpec | undefined, b: LimbSpec | undefined, t: number): LimbSpec | undefined {
  if (!a) return b;
  if (!b) return a;
  if (isIK(a) && isIK(b)) {
    return {
      ik: lerpTarget(a.ik, b.ik, t),
      bend: t < 0.5 ? a.bend : b.bend,
      end: lerpNum(a.end, b.end, t),
      dx: lerp(a.dx ?? 0, b.dx ?? 0, t),
      dy: lerp(a.dy ?? 0, b.dy ?? 0, t),
    };
  }
  if (isIK(a) || isIK(b)) return t < 0.5 ? a : b;
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerpNum(a[2], b[2], t)] as Limb;
}

/** Fill in implied values so both poses can be interpolated field by field. */
function withDefaults(p: Pose): Pose {
  const neck = p.neck ?? p.torso - (p.bend ?? 0) / 2;
  return { ...p, bend: p.bend ?? 0, neck, head: p.head ?? neck, armL: p.armL ?? p.armR, legL: p.legL ?? p.legR };
}

export function lerpPose(a0: Pose, b0: Pose, t: number): Pose {
  const a = withDefaults(a0);
  const b = withDefaults(b0);
  return {
    ...a,
    x: lerp(a.x, b.x, t),
    y: lerpNum(a.y, b.y, t),
    torso: lerp(a.torso, b.torso, t),
    bend: lerpNum(a.bend ?? 0, b.bend ?? 0, t),
    neck: lerpNum(a.neck, b.neck, t),
    head: lerpNum(a.head, b.head, t),
    armR: lerpLimb(a.armR, b.armR, t)!,
    armL: lerpLimb(a.armL, b.armL, t),
    legR: lerpLimb(a.legR, b.legR, t)!,
    legL: lerpLimb(a.legL, b.legL, t),
    scale: lerpScale(a.scale, b.scale, t),
  };
}

function lerpScale(a: Pose['scale'], b: Pose['scale'], t: number): Pose['scale'] {
  if (!a && !b) return undefined;
  const out: Pose['scale'] = {};
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]) as Set<ScaleKey>;
  for (const k of keys) out[k] = lerp(a?.[k] ?? 1, b?.[k] ?? 1, t);
  return out;
}

// ---------- rendering ----------

export interface ActorFrame {
  svg: string;
  joints: Joints;
  /** Centre of each highlighted muscle (by muscle id), for label leader lines. */
  anchors: Record<string, Pt>;
}

const toDeg = (v: Pt) => (Math.atan2(v.x, v.y) * 180) / Math.PI;

/** Two-bone IK: returns [upper, lower] absolute angles reaching from root toward target. */
function solveIK(root: Pt, target: Pt, a: number, b: number, bend: number): [number, number] {
  const dx = target.x - root.x;
  const dy = target.y - root.y;
  const d = Math.max(Math.abs(a - b) + 0.01, Math.min(a + b - 0.01, Math.hypot(dx, dy)));
  const base = toDeg({ x: dx, y: dy });
  const cosA = (a * a + d * d - b * b) / (2 * a * d);
  const alpha = (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI;
  const upper = base + bend * alpha;
  const elbow = add(root, dir(upper), a);
  const reach = add(root, dir(base), d);
  return [upper, toDeg({ x: reach.x - elbow.x, y: reach.y - elbow.y })];
}

export interface RenderOpts {
  ground?: Ground;
  floor: number;
  flip?: boolean;
  muscles?: Highlight[];
  /** Joints of actors already drawn in this scene (world coordinates). */
  others?: Joints[];
}

const LIMB_KEYS = ['armR', 'armL', 'legR', 'legL'] as const;

/** Build the actor, solve IK, place it on the ground, optionally mirror it; return SVG + joint positions. */
export function renderActor(pose: Pose, role: Role, opts: RenderOpts): ActorFrame {
  const ground = opts.ground ?? 'auto';
  const flipX = opts.flip ? pose.x : undefined;
  const toLocal = (pt: Pt): Pt => (flipX !== undefined ? { x: 2 * flipX - pt.x, y: pt.y } : pt);

  // Start with neutral angles for IK limbs, then refine.
  const resolved: Resolved = {
    ...pose,
    armR: isIK(pose.armR) ? [0, 0] : pose.armR,
    armL: isIK(pose.armL) ? [0, 0] : pose.armL,
    legR: isIK(pose.legR) ? [0, 0] : pose.legR,
    legL: isIK(pose.legL) ? [0, 0] : pose.legL,
  };
  if (!pose.armL && isIK(pose.armR)) resolved.armL = undefined;
  if (!pose.legL && isIK(pose.legR)) resolved.legL = undefined;

  let b!: Built;
  const hasIK = LIMB_KEYS.some((k) => isIK(pose[k]));
  for (let pass = 0; pass < (hasIK ? 3 : 1); pass++) {
    b = build({ ...resolved, y: 0 });
    let dy = 0;
    if (ground === 'auto') {
      let maxY = -Infinity;
      for (const shapes of Object.values(b.parts))
        for (const sh of shapes) for (const bd of sh.bounds) maxY = Math.max(maxY, bd.p.y + bd.r);
      dy = opts.floor - maxY;
    } else if (ground === 'pose') {
      dy = pose.y ?? 0;
    } else if (typeof ground === 'number') {
      dy = ground;
    } else {
      dy = ground.y - (b.joints[ground.joint]?.y ?? 0);
    }
    resolved.y = dy;
    b = build(resolved);
    if (!hasIK || pass === 2) break;

    for (const key of LIMB_KEYS) {
      const spec = pose[key];
      if (!isIK(spec)) continue;
      const side = key.endsWith('R') ? 'R' : 'L';
      const isArm = key.startsWith('arm');
      let target: Pt | undefined;
      if (typeof spec.ik === 'string') {
        const [who, joint] = spec.ik.split('.');
        if (who === 'self') target = b.joints[joint];
        else {
          const w = opts.others?.[Number(who)]?.[joint];
          if (w) target = toLocal(w);
        }
      } else target = toLocal(spec.ik);
      if (!target) continue;
      target = { x: target.x + (flipX !== undefined ? -(spec.dx ?? 0) : spec.dx ?? 0), y: target.y + (spec.dy ?? 0) };
      const root = b.joints[isArm ? `shoulder${side}` : `hip${side}`];
      const sc = pose.scale ?? {};
      const la = (isArm ? L.upperArm : L.thigh) * (sc[`${isArm ? 'upperArm' : 'thigh'}${side}`] ?? 1);
      const lb = (isArm ? L.forearm : L.shin) * (sc[`${isArm ? 'forearm' : 'shin'}${side}`] ?? 1);
      const [u, l] = solveIK(root, target, la, lb, spec.bend ?? 1);
      resolved[key] = [u, l, spec.end];
    }
  }

  const pre = role === 'main' ? 'fig' : 'fig-p';
  const anchors: Record<string, Pt> = {};

  // Each body part is drawn twice: a thin background-coloured outline of the whole part,
  // then the fills (skin, shirt, trousers…). Overlapping parts (an arm in front of the torso)
  // stay readable while a part has no seams at its own joints.
  const draw = (key: string, far = false) => {
    const shapes = b.parts[key] ?? [];
    const outline = shapes.filter((sh) => sh.mat !== 'eye' && sh.mat !== 'hair').map((sh) => shapeToSvg(sh, 'fig-o')).join('');
    return outline + shapes.map((sh) => shapeToSvg(sh, `${pre}-${sh.mat ?? 'skin'}${far ? ' far' : ''}`)).join('');
  };
  const TORSO_PARTS = ['torso', 'glutes', 'gluteMed', 'piriformis'];
  const hl = (keys: string[]) =>
    (opts.muscles ?? [])
      .filter((h) => keys.includes(h.part) || (keys[0] === 'torso' && TORSO_PARTS.includes(h.part)))
      .map((h) => {
        const r = highlightSvg(b, h);
        if (h.muscle && r.anchor && !anchors[h.muscle]) anchors[h.muscle] = r.anchor;
        return r.svg;
      })
      .join('');

  const front = b.view === 'front';
  const armR = draw('armR') + hl(['upperArmR', 'forearmR']);
  const armL = draw('armL', !front) + hl(['upperArmL', 'forearmL']);
  const legR = draw('legR') + hl(['thighR', 'shinR', 'footR']);
  const legL = draw('legL', !front) + hl(['thighL', 'shinL', 'footL']);
  const torso = draw('torso') + hl(['torso']);
  const head = draw('neck') + hl(['neck']) + draw('head') + hl(['head']);

  let body: string;
  if (front) {
    const arms = pose.leftArmFront ? armR + armL : armL + armR;
    body = pose.armsBehind ? arms + legL + legR + torso + head : legL + legR + torso + head + arms;
  } else if (pose.armsBehind) {
    body = armL + armR + legL + torso + head + legR;
  } else if (pose.nearArmBehindLeg) {
    body = armL + legL + torso + head + armR + legR;
  } else {
    body = armL + legL + torso + head + legR + armR;
  }

  const joints = b.joints;
  if (flipX !== undefined) {
    for (const j of Object.values(joints)) j.x = 2 * flipX - j.x;
    for (const j of Object.values(anchors)) j.x = 2 * flipX - j.x;
    body = `<g transform="translate(${f1(2 * flipX)} 0) scale(-1 1)">${body}</g>`;
  }
  return { svg: body, joints, anchors };
}

function highlightSvg(b: Built, h: Highlight): { svg: string; anchor?: Pt } {
  const from = h.from ?? 0.15;
  const to = h.to ?? 0.85;
  const side = h.side ?? 0;
  const cls = `mus mus-${h.level ?? 'primary'}`;
  const mid = (p: Pt, q: Pt): Pt => lerpPt(p, q, 0.5);
  if (h.part === 'glutes' || h.part === 'gluteMed' || h.part === 'piriformis') {
    const pel = b.spine.pts[0];
    const up = b.spine.dirs[0];
    const n = frontOf(up, -1);
    const isFront = b.view === 'front';
    // [toward the back, up along the spine, radius]
    const spec = {
      glutes: [isFront ? 0 : -5.5, -1.5, isFront ? 9 : 7.8],
      gluteMed: [isFront ? side * 9 : -4, 6.5, isFront ? 5.5 : 5.2],
      piriformis: [isFront ? side * 5 : -6.5, 0.5, 4.4],
    }[h.part];
    const c = add(add(pel, n, spec[0]), up, spec[1]);
    return { svg: `<circle class="${cls}" cx="${f1(c.x)}" cy="${f1(c.y)}" r="${spec[2]}"/>`, anchor: c };
  }
  if (h.part === 'torso') {
    const { pts, dirs, front, back } = b.spine;
    const n = pts.length - 1;
    const at = (f: number) => {
      const x = f * n;
      const i = Math.min(n - 1, Math.floor(x));
      const t = x - i;
      const p = lerpPt(pts[i], pts[i + 1], t);
      const d = dirs[i];
      const w = side >= 0 ? lerp(front[i], front[i + 1], t) : lerp(back[i], back[i + 1], t);
      const nn = frontOf(d, -1);
      const narrow = Math.abs(side) > 0 && Math.abs(side) < 1 ? 0.36 : side === 0 ? 0.55 : 0.5;
      return { c: add(p, nn, side * w * 0.45), r: Math.max(2.5, w * narrow) };
    };
    const a = at(from);
    const m = at((from + to) / 2);
    const z = at(to);
    return {
      svg: `<path class="${cls}" d="${capsule(a.c, m.c, a.r, m.r).d}"/>` + `<path class="${cls}" d="${capsule(m.c, z.c, m.r, z.r).d}"/>`,
      anchor: m.c,
    };
  }
  const s = b.segs[h.part];
  if (!s) return { svg: '' };
  const a = lerpPt(s.a, s.b, from);
  const z = lerpPt(s.a, s.b, to);
  const d = { x: s.b.x - s.a.x, y: s.b.y - s.a.y };
  const len = Math.hypot(d.x, d.y) || 1;
  const u = { x: d.x / len, y: d.y / len };
  const n = frontOf(u, s.frontSign);
  const ra = lerp(s.ra, s.rb, from);
  const rz = lerp(s.ra, s.rb, to);
  const k = side === 0 ? 0.62 : 0.5;
  const off = side * 0.42;
  const pa = add(a, n, off * ra);
  const pz = add(z, n, off * rz);
  return { svg: `<path class="${cls}" d="${capsule(pa, pz, ra * k, rz * k).d}"/>`, anchor: mid(pa, pz) };
}

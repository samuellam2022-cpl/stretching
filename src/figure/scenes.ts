/**
 * Demo animation for each stretch, keyed by the stretch id in stretches.json.
 *
 * Angles are absolute directions in degrees: 0 = down, 90 = forward (the way
 * the figure faces), 180 = up, -90 = backward. See engine.ts for details.
 * A stretch without an entry here simply shows no animation.
 */
import type { Pose } from './engine';
import { ball, mat, pt, roller, step, stool, strap, wall, type Prop, type Scene } from './scene';

// ---------- reusable poses ----------

const STAND: Pose = { x: 160, torso: 180, armR: [4, 10, 12], armL: [-4, 4, 6], legR: [2, 0], legL: [-3, -2] };
const STAND_FRONT: Pose = {
  view: 'front',
  x: 160,
  torso: 180,
  armR: [-7, -3],
  armL: [7, 3],
  legR: [-3, -1],
  legL: [3, 1],
};
const SIT_FRONT: Pose = {
  ...STAND_FRONT,
  legR: [-62, -6],
  legL: [62, 6],
  armR: [-6, 30, 30],
  armL: [6, -30, -30],
  scale: { thighR: 0.5, thighL: 0.5 },
};
const SIT_STOOL: Pose = { x: 150, torso: 180, armR: [10, 60, 70], armL: [8, 58, 68], legR: [90, 0], legL: [88, -2] };
/** Lying on the back, head to the left. */
const SUPINE: Pose = { x: 175, torso: -90, neck: -92, head: -96, armR: [86, 90, 90], armL: [88, 90, 90], legR: [90, 90], legL: [91, 91] };
const SUPINE_KNEES: Pose = { ...SUPINE, legR: [140, 40, 90], legL: [142, 38, 90] };
/** Lying face down, head to the right. */
const PRONE: Pose = {
  x: 150,
  torso: 90,
  neck: 92,
  head: 80,
  armR: [70, -105, -100],
  armL: [72, -100, -100],
  legR: [-90, -90, -80],
  legL: [-91, -91, -80],
};
const LONG_SIT: Pose = { x: 120, torso: 180, armR: [-15, -10, 80], armL: [-18, -12, 80], legR: [90, 90, 180], legL: [91, 91, 180] };
const QUADRUPED: Pose = { x: 130, torso: 95, neck: 100, head: 95, armR: [2, 2, 90], armL: [0, 0, 90], legR: [0, -90, -90], legL: [-2, -90, -90] };
const KNEEL_TALL: Pose = { x: 0, torso: 175, armR: [10, 20], armL: [8, 18], legR: [0, -90, -90], legL: [2, -88, -90] };

/** A handrail post standing on the step. */
const rail =
  (x: number, base: number, top: number): Prop =>
  () =>
    `<rect class="prop-dark" x="${x}" y="${top}" width="6" height="${base - top}" rx="3"/>`;

const at = (p: Pose, x: number, extra: Partial<Pose> = {}): Pose => ({ ...p, x, ...extra });

/** A block that always sits under the given joint (e.g. under the hip in pigeon pose). */
const blockUnder =
  (ref: string, w: number, top: number): Prop =>
  (ctx) => {
    const p = pt(ctx, ref);
    return `<rect class="prop-accent" x="${p.x - w / 2}" y="${p.y + top}" width="${w}" height="${ctx.floor - p.y - top}" rx="3"/>`;
  };

// ---------- scenes ----------

export const SCENES: Record<string, Scene> = {
  // ===== Neck =====
  'neck-side-bend': {
    actors: [
      {
        from: STAND_FRONT,
        to: { ...STAND_FRONT, neck: 203, head: 214, armR: { ik: 'self.head', dx: 9, dy: -6, bend: 1, end: 120 } },
        muscles: [
          { part: 'neck', side: 1, from: 0, to: 1 },
          { part: 'torso', side: 1, from: 0.86, to: 0.99 },
        ],
      },
    ],
  },
  'neck-levator-scapulae': {
    actors: [
      {
        from: at(SIT_STOOL, 150),
        to: { ...SIT_STOOL, neck: 152, head: 140, armR: { ik: 'self.head', dx: -5, dy: -8, bend: -1, end: 120 }, scale: { upperArmR: 0.75, forearmR: 0.6 } },
        muscles: [
          { part: 'neck', side: -1, from: 0, to: 1 },
          { part: 'torso', side: -1, from: 0.82, to: 0.98 },
        ],
      },
    ],
    back: [stool(0)],
  },
  'neck-partner-side-stretch': {
    actors: [
      {
        role: 'partner',
        from: { ...STAND_FRONT, x: 196, armL: [12, 20], armR: { ik: '1.shoulderL', dx: 2, dy: -5, bend: 1, end: -110 } },
      },
      {
        from: SIT_FRONT,
        to: { ...SIT_FRONT, neck: 203, head: 214 },
        muscles: [
          { part: 'neck', side: 1, from: 0, to: 1 },
          { part: 'torso', side: 1, from: 0.86, to: 0.99 },
        ],
      },
    ],
    back: [stool(1, 76)],
  },
  'neck-towel-chin-tuck': {
    actors: [
      {
        from: { ...SIT_STOOL, armR: { ik: 'self.neckTop', dx: 22, dy: 6, bend: -1, end: 150 }, armL: { ik: 'self.neckTop', dx: 22, dy: 8, bend: -1, end: 150 } },
        to: { ...SIT_STOOL, neck: 196, head: 176, x: 147, armR: { ik: 'self.neckTop', dx: 22, dy: 6, bend: -1, end: 150 }, armL: { ik: 'self.neckTop', dx: 22, dy: 8, bend: -1, end: 150 } },
        muscles: [{ part: 'neck', side: -1, from: 0.35, to: 1 }],
      },
    ],
    back: [stool(0)],
    front: [strap(['0.handR', ['0.neckTop', -6, 2]], 'towel')],
  },

  // ===== Shoulders =====
  'shoulders-cross-body': {
    actors: [
      {
        from: STAND_FRONT,
        to: { ...STAND_FRONT, leftArmFront: true, armR: [76, 84, 86], armL: { ik: 'self.elbowR', dx: -14, dy: 3, bend: -1, end: 200 } },
        muscles: [{ part: 'upperArmR', side: 0, from: 0, to: 0.45 }],
      },
    ],
  },
  'shoulders-wall-chest': {
    actors: [
      {
        from: { ...STAND, x: 112, armR: { ik: { x: 60, y: 66 }, bend: 1, end: -95 } },
        to: { ...STAND, x: 124, torso: 176, bend: -8, armR: { ik: { x: 60, y: 66 }, bend: 1, end: -95 } },
        muscles: [
          { part: 'torso', side: 1, from: 0.6, to: 0.92 },
          { part: 'upperArmR', side: 1, from: 0, to: 0.4 },
        ],
      },
    ],
    back: [wall(60)],
  },
  'shoulders-partner-chest-opener': {
    actors: [
      {
        role: 'partner',
        from: { ...STAND, x: 108, torso: 178, armR: { ik: '1.elbowR', dx: -2, bend: -1, end: 90 }, armL: { ik: '1.elbowL', dx: -2, bend: -1, end: 90 } },
      },
      {
        from: { ...SIT_STOOL, x: 165, armR: { ik: 'self.head', dx: -9, dy: -3, bend: -1 }, armL: { ik: 'self.head', dx: -9, dy: -1, bend: -1 }, scale: { upperArmR: 0.75, upperArmL: 0.75, forearmR: 0.8, forearmL: 0.8 } },
        to: { ...SIT_STOOL, x: 165, bend: -6, armR: { ik: 'self.head', dx: -9, dy: -3, bend: -1 }, armL: { ik: 'self.head', dx: -9, dy: -1, bend: -1 }, scale: { upperArmR: 0.45, upperArmL: 0.45, forearmR: 0.6, forearmL: 0.6 } },
        muscles: [
          { part: 'torso', side: 1, from: 0.6, to: 0.92 },
          { part: 'upperArmR', side: 1, from: 0, to: 0.5 },
        ],
      },
    ],
    back: [stool(1)],
  },
  // Seen from behind (the figure has no face, so the front view doubles as a back view).
  'shoulders-towel-overhead': {
    actors: [
      {
        from: { ...STAND_FRONT, armR: [196, 48, 40], armL: { ik: 'self.waist', dx: 2, dy: -6, bend: 1, end: 195 } },
        to: { ...STAND_FRONT, armR: [186, 24, 15], armL: { ik: 'self.waist', dx: 2, dy: 8, bend: 1, end: 190 }, scale: { upperArmR: 0.8 } },
        muscles: [
          { part: 'upperArmR', side: 0, from: 0.1, to: 0.9 },
          { part: 'torso', side: -1, from: 0.55, to: 0.88 },
        ],
      },
    ],
    front: [strap(['0.handR', '0.handL'], 'towel')],
  },

  // ===== Back =====
  'back-cat-cow': {
    actors: [
      {
        from: { ...QUADRUPED, bend: -40, neck: 122, head: 130 },
        to: { ...QUADRUPED, bend: 62, neck: 60, head: 30 },
        muscles: [{ part: 'torso', side: -1, from: 0.1, to: 0.9 }],
      },
    ],
  },
  'back-childs-pose': {
    actors: [
      {
        from: { ...QUADRUPED, x: 120, armR: { ik: { x: 158, y: 195 }, bend: 1, end: 90 }, armL: { ik: { x: 162, y: 195 }, bend: 1, end: 90 } },
        to: { ...QUADRUPED, x: 100, torso: 70, bend: 14, neck: 58, head: 48, legR: [60, -90, -90], legL: [58, -90, -90], armR: { ik: { x: 214, y: 195 }, bend: 1, end: 90 }, armL: { ik: { x: 218, y: 195 }, bend: 1, end: 90 } },
        muscles: [{ part: 'torso', side: -1, from: 0.1, to: 0.92 }],
      },
    ],
  },
  'back-partner-lat-pull': {
    actors: [
      {
        from: { ...STAND, x: 105, armR: { ik: { x: 160, y: 80 }, bend: -1, end: 90 }, armL: { ik: { x: 160, y: 82 }, bend: -1, end: 90 } },
        to: { ...STAND, x: 92, torso: 160, bend: 30, neck: 150, head: 140, legR: [55, -25], legL: [53, -27], armR: { ik: { x: 160, y: 98 }, bend: -1, end: 90 }, armL: { ik: { x: 160, y: 100 }, bend: -1, end: 90 } },
        muscles: [{ part: 'torso', side: -1, from: 0.45, to: 0.95 }],
      },
      {
        role: 'partner',
        flip: true,
        from: { ...STAND, x: 215, armR: { ik: { x: 160, y: 80 }, bend: -1, end: 90 }, armL: { ik: { x: 160, y: 82 }, bend: -1, end: 90 } },
        to: { ...STAND, x: 228, torso: 160, bend: 30, neck: 150, head: 140, legR: [55, -25], legL: [53, -27], armR: { ik: { x: 160, y: 98 }, bend: -1, end: 90 }, armL: { ik: { x: 160, y: 100 }, bend: -1, end: 90 } },
      },
    ],
  },
  'back-foam-roller-extension': {
    actors: [
      {
        from: { x: 175, torso: 200, bend: 12, neck: 196, head: 192, legR: [125, 35, 90], legL: [123, 33, 90], armR: { ik: 'self.head', dx: -8, dy: -2, bend: -1 }, armL: { ik: 'self.head', dx: -8, bend: -1 }, scale: { upperArmR: 0.7, upperArmL: 0.7 } },
        to: { x: 175, torso: 238, bend: -28, neck: 248, head: 252, legR: [125, 35, 90], legL: [123, 33, 90], armR: { ik: 'self.head', dx: -8, dy: -2, bend: -1 }, armL: { ik: 'self.head', dx: -8, bend: -1 }, scale: { upperArmR: 0.7, upperArmL: 0.7 } },
        muscles: [{ part: 'torso', side: 1, from: 0.4, to: 0.92 }],
      },
    ],
    back: [roller(134, 13)],
  },

  // ===== Lower back =====
  'lower-back-knee-to-chest': {
    actors: [
      {
        from: SUPINE_KNEES,
        to: { ...SUPINE_KNEES, legR: [222, 108, 175], armR: { ik: 'self.kneeR', dx: 7, dy: 4, bend: 1 }, armL: { ik: 'self.kneeR', dx: 5, dy: 6, bend: 1 } },
        muscles: [
          { part: 'torso', side: -1, from: 0.05, to: 0.45 },
          { part: 'glutes' },
        ],
      },
    ],
  },
  'lower-back-supine-twist': {
    floor: false,
    actors: [
      {
        ground: 105,
        from: { view: 'front', x: 165, torso: -90, armR: [0, 0], armL: [180, 180], legR: [90, 90], legL: [90, 90], scale: { thighR: 0.55, thighL: 0.55, shinR: 0.55, shinL: 0.55 } },
        to: { view: 'front', x: 165, torso: -90, head: -70, neck: -85, armR: [0, 0], armL: [180, 180], legR: [35, 118], legL: [48, 118], scale: { thighR: 0.95, thighL: 0.95, shinR: 0.9, shinL: 0.9 } },
        muscles: [
          { part: 'torso', side: 1, from: 0.05, to: 0.6 },
        ],
      },
    ],
    back: [mat(40, 40, 250, 130)],
  },
  'lower-back-partner-knee-hug': {
    actors: [
      {
        from: { ...SUPINE, legR: [205, 100, 165], legL: [207, 102, 165], armR: { ik: 'self.kneeR', dx: 6, dy: 4 }, armL: { ik: 'self.kneeL', dx: 4, dy: 6 } },
        to: { ...SUPINE, legR: [222, 112, 180], legL: [224, 114, 180], armR: { ik: 'self.kneeR', dx: 6, dy: 4 }, armL: { ik: 'self.kneeL', dx: 4, dy: 6 } },
        muscles: [
          { part: 'torso', side: -1, from: 0.05, to: 0.45 },
          { part: 'glutes' },
        ],
      },
      {
        role: 'partner',
        flip: true,
        from: { ...KNEEL_TALL, x: 232, torso: 150, neck: 140, head: 130, armR: { ik: '0.kneeR', dx: 12, dy: -4, bend: -1 }, armL: { ik: '0.kneeR', dx: 16, dy: 0, bend: -1 } },
        to: { ...KNEEL_TALL, x: 228, torso: 142, neck: 132, head: 122, armR: { ik: '0.kneeR', dx: 12, dy: -4, bend: -1 }, armL: { ik: '0.kneeR', dx: 16, dy: 0, bend: -1 } },
      },
    ],
  },
  'lower-back-ball-drape': {
    actors: [
      {
        from: { ...KNEEL_TALL, x: 110, torso: 168, armR: { ik: { x: 150, y: 140 } }, armL: { ik: { x: 152, y: 142 } } },
        to: { ...KNEEL_TALL, x: 115, torso: 95, bend: 55, neck: 40, head: 20, armR: { ik: { x: 246, y: 194 }, bend: -1, end: 90 }, armL: { ik: { x: 250, y: 194 }, bend: -1, end: 90 } },
        muscles: [{ part: 'torso', side: -1, from: 0.05, to: 0.7 }],
      },
    ],
    back: [ball(168, 30)],
  },

  // ===== Hips =====
  'hips-figure-four': {
    actors: [
      {
        from: { ...SUPINE_KNEES, legR: { ik: 'self.kneeL', dx: 0, dy: -7, bend: 1, end: 175 }, scale: { thighR: 0.8 } },
        to: { ...SUPINE_KNEES, legL: [212, 108, 190], legR: { ik: 'self.kneeL', dx: 0, dy: -7, bend: 1, end: 175 }, armR: { ik: 'self.kneeL', dx: -14, dy: 4 }, armL: { ik: 'self.kneeL', dx: -12, dy: 6 }, scale: { thighR: 0.8 } },
        muscles: [{ part: 'glutes' }, { part: 'thighR', side: -1, from: 0, to: 0.4 }],
      },
    ],
  },
  'hips-kneeling-hip-flexor': {
    actors: [
      {
        from: { x: 150, torso: 180, legR: [0, -90, -90], legL: [90, 0, 90], armR: { ik: 'self.kneeL', dx: -4, dy: -7 }, armL: { ik: 'self.kneeL', dx: -2, dy: -8 } },
        to: { x: 166, torso: 182, legR: [-24, -90, -90], legL: [72, -14, 90], armR: { ik: 'self.kneeL', dx: -4, dy: -7 }, armL: { ik: 'self.kneeL', dx: -2, dy: -8 } },
        muscles: [{ part: 'thighR', side: 1, from: 0, to: 0.6 }],
      },
    ],
  },
  'hips-partner-butterfly': {
    actors: [
      {
        from: { x: 112, torso: 180, legR: [128, 30, 120], legL: [130, 32, 120], armR: { ik: 'self.ankleR', dy: -3, bend: -1 }, armL: { ik: 'self.ankleL', dy: -3, bend: -1 }, scale: { thighR: 0.8, thighL: 0.8, shinR: 0.75, shinL: 0.75 } },
        to: { x: 112, torso: 180, legR: [104, 52, 115], legL: [106, 54, 115], armR: { ik: 'self.ankleR', dy: -3, bend: -1 }, armL: { ik: 'self.ankleL', dy: -3, bend: -1 }, scale: { thighR: 0.8, thighL: 0.8, shinR: 0.75, shinL: 0.75 } },
        muscles: [{ part: 'thighR', side: 0, from: 0.2, to: 0.9 }],
      },
      {
        role: 'partner',
        flip: true,
        from: { ...KNEEL_TALL, x: 210, torso: 150, neck: 140, head: 128, armR: { ik: '0.kneeR', dx: 2, dy: -6, bend: -1, end: 80 }, armL: { ik: '0.kneeR', dx: 4, dy: -6, bend: -1, end: 80 } },
        to: { ...KNEEL_TALL, x: 210, torso: 140, neck: 130, head: 118, armR: { ik: '0.kneeR', dx: 2, dy: -6, bend: -1, end: 80 }, armL: { ik: '0.kneeR', dx: 4, dy: -6, bend: -1, end: 80 } },
      },
    ],
  },
  'hips-supported-pigeon': {
    actors: [
      {
        from: { x: 150, torso: 180, legR: [82, -35, -60], legL: [-78, -90, -92], armR: { ik: { x: 182, y: 194 }, end: 90 }, armL: { ik: { x: 186, y: 194 }, end: 90 }, scale: { shinR: 0.5 } },
        to: { x: 150, torso: 110, bend: 15, neck: 100, head: 85, legR: [82, -35, -60], legL: [-78, -90, -92], armR: { ik: { x: 228, y: 192 }, bend: -1, end: 90 }, armL: { ik: { x: 232, y: 192 }, bend: -1, end: 90 }, scale: { shinR: 0.5 } },
        muscles: [{ part: 'glutes' }, { part: 'thighL', side: 1, from: 0, to: 0.4 }],
      },
    ],
    back: [blockUnder('0.pelvis', 30, 10)],
  },

  // ===== Front of thigh =====
  'front-thigh-standing-quad': {
    actors: [
      {
        from: { ...STAND, x: 150, legR: [6, -95, -10], armR: { ik: 'self.ankleR', dy: -2, bend: 1, end: -100 }, armL: { ik: { x: 228, y: 82 }, bend: -1, end: 180 } },
        to: { ...STAND, x: 150, legR: [-6, 178, 270], armR: { ik: 'self.ankleR', dy: -2, bend: 1, end: -100 }, armL: { ik: { x: 228, y: 82 }, bend: -1, end: 180 } },
        muscles: [{ part: 'thighR', side: 1, from: 0.05, to: 0.9 }],
      },
    ],
    back: [wall(230, 'right')],
  },
  'front-thigh-side-lying-quad': {
    floor: false,
    actors: [
      {
        ground: 110,
        from: { x: 165, torso: -90, neck: -92, head: -96, armL: [-96, -92, -92], armR: { ik: 'self.ankleR', dy: 2, bend: -1 }, legR: [88, -75, -150], legL: [90, 90] },
        to: { x: 165, torso: -90, neck: -92, head: -96, armL: [-96, -92, -92], armR: { ik: 'self.ankleR', dy: 2, bend: -1 }, legR: [78, -100, -170], legL: [90, 90] },
        muscles: [{ part: 'thighR', side: 1, from: 0.05, to: 0.9 }],
      },
    ],
    back: [mat(20, 60, 280, 100)],
  },
  'front-thigh-partner-prone': {
    actors: [
      {
        role: 'partner',
        from: { ...KNEEL_TALL, x: 120, torso: 165, neck: 160, head: 150, armR: { ik: '1.ankleR', dy: -2, bend: -1 }, armL: { ik: '1.ankleR', dx: 4, dy: 2, bend: -1 } },
        to: { ...KNEEL_TALL, x: 122, torso: 160, neck: 155, head: 145, armR: { ik: '1.ankleR', dy: -2, bend: -1 }, armL: { ik: '1.ankleR', dx: 4, dy: 2, bend: -1 } },
      },
      {
        from: { ...PRONE, x: 165, legR: [-90, -110, -90] },
        to: { ...PRONE, x: 165, legR: [-92, 155, 245] },
        muscles: [{ part: 'thighR', side: 1, from: 0.05, to: 0.9 }],
      },
    ],
  },
  'front-thigh-strap-quad': {
    actors: [
      {
        from: { ...PRONE, x: 160, neck: 100, head: 95, legR: [-90, -100, -90], armR: [-150, -105, -100], armL: [72, -100, -100] },
        to: { ...PRONE, x: 160, neck: 100, head: 95, legR: [-92, 160, 250], armR: [-160, -120, -115], armL: [72, -100, -100] },
        muscles: [{ part: 'thighR', side: 1, from: 0.05, to: 0.9 }],
      },
    ],
    front: [strap(['0.handR', ['0.ankleR', 0, -2]])],
  },

  // ===== Back of thigh =====
  'back-thigh-seated-single-leg': {
    actors: [
      {
        from: { ...LONG_SIT, legL: [70, -110, -40], armR: { ik: 'self.kneeR', dx: -6, dy: -6 }, armL: { ik: 'self.kneeR', dx: -10, dy: -5 }, scale: { thighL: 0.8, shinL: 0.7 } },
        to: { ...LONG_SIT, torso: 128, bend: 14, neck: 120, head: 108, legL: [70, -110, -40], armR: { ik: 'self.ankleR', dx: -2, dy: -4 }, armL: { ik: 'self.ankleR', dx: -6, dy: -3 }, scale: { thighL: 0.8, shinL: 0.7 } },
        muscles: [
          { part: 'thighR', side: -1, from: 0.1, to: 0.95 },
          { part: 'shinR', side: -1, from: 0.05, to: 0.5 },
        ],
      },
    ],
  },
  'back-thigh-standing-heel': {
    actors: [
      {
        from: { ...STAND, x: 150, torso: 178, legR: [28, 28, 150], legL: [-6, -10], armR: { ik: 'self.kneeL', dx: 6, dy: -14 }, armL: { ik: 'self.kneeL', dx: 6, dy: -12 } },
        to: { ...STAND, x: 142, torso: 128, neck: 125, head: 120, legR: [36, 36, 158], legL: [-14, -22], armR: { ik: 'self.kneeL', dx: 8, dy: -10 }, armL: { ik: 'self.kneeL', dx: 8, dy: -8 } },
        muscles: [{ part: 'thighR', side: -1, from: 0.1, to: 0.95 }],
      },
    ],
  },
  'back-thigh-partner-lying': {
    actors: [
      {
        from: { ...SUPINE, x: 140, legR: [108, 108, 198] },
        to: { ...SUPINE, x: 140, legR: [165, 165, 255] },
        muscles: [
          { part: 'thighR', side: -1, from: 0.1, to: 0.95 },
          { part: 'shinR', side: -1, from: 0.05, to: 0.5 },
        ],
      },
      {
        role: 'partner',
        flip: true,
        from: { ...KNEEL_TALL, x: 255, torso: 165, armR: { ik: '0.ankleR', dx: 2, dy: 4, bend: -1 }, armL: { ik: '0.kneeR', dx: 0, dy: -6, bend: -1 } },
        to: { ...KNEEL_TALL, x: 235, torso: 172, armR: { ik: '0.ankleR', dx: 2, dy: 4, bend: -1 }, armL: { ik: '0.kneeR', dx: 0, dy: -6, bend: -1 } },
      },
    ],
  },
  'back-thigh-strap-lying': {
    actors: [
      {
        from: { ...SUPINE, x: 160, legR: [115, 115, 205], armR: [150, 150, 150], armL: [148, 148, 150] },
        to: { ...SUPINE, x: 160, legR: [168, 168, 258], armR: [160, 162, 162], armL: [158, 160, 162] },
        muscles: [
          { part: 'thighR', side: -1, from: 0.1, to: 0.95 },
          { part: 'shinR', side: -1, from: 0.05, to: 0.5 },
        ],
      },
    ],
    front: [strap(['0.handR', ['0.toeR', 0, -2]])],
  },

  // ===== Calves =====
  'calves-wall-straight': {
    actors: [
      {
        ground: 'pose',
        from: { ...STAND, x: 140, y: 110, legR: { ik: { x: 100, y: 190 }, bend: 1, end: 90 }, legL: { ik: { x: 172, y: 190 }, bend: -1, end: 90 }, armR: { ik: { x: 212, y: 72 }, bend: -1, end: 180 }, armL: { ik: { x: 212, y: 75 }, bend: -1, end: 180 } },
        to: { ...STAND, x: 152, y: 112, torso: 165, legR: { ik: { x: 100, y: 190 }, bend: 1, end: 90 }, legL: { ik: { x: 172, y: 190 }, bend: -1, end: 90 }, armR: { ik: { x: 212, y: 72 }, bend: -1, end: 180 }, armL: { ik: { x: 212, y: 75 }, bend: -1, end: 180 } },
        muscles: [{ part: 'shinR', side: -1, from: 0.05, to: 0.6 }],
      },
    ],
    back: [wall(214, 'right')],
  },
  'calves-wall-bent-knee': {
    actors: [
      {
        ground: 'pose',
        from: { ...STAND, x: 150, y: 110, legR: { ik: { x: 122, y: 190 }, bend: -1, end: 90 }, legL: { ik: { x: 172, y: 190 }, bend: -1, end: 90 }, armR: { ik: { x: 212, y: 75 }, bend: -1, end: 180 }, armL: { ik: { x: 212, y: 78 }, bend: -1, end: 180 } },
        to: { ...STAND, x: 150, y: 124, torso: 175, legR: { ik: { x: 122, y: 190 }, bend: -1, end: 90 }, legL: { ik: { x: 172, y: 190 }, bend: -1, end: 90 }, armR: { ik: { x: 212, y: 75 }, bend: -1, end: 180 }, armL: { ik: { x: 212, y: 78 }, bend: -1, end: 180 } },
        muscles: [{ part: 'shinR', side: -1, from: 0.4, to: 0.95 }],
      },
    ],
    back: [wall(214, 'right')],
  },
  'calves-partner-seated': {
    actors: [
      {
        from: { ...LONG_SIT, x: 105, torso: 190, armR: { ik: { x: 82, y: 194 }, end: -90 }, armL: { ik: { x: 78, y: 194 }, end: -90 }, legR: [90, 90, 172] },
        to: { ...LONG_SIT, x: 105, torso: 190, armR: { ik: { x: 82, y: 194 }, end: -90 }, armL: { ik: { x: 78, y: 194 }, end: -90 }, legR: [90, 90, 200] },
        muscles: [{ part: 'shinR', side: -1, from: 0.05, to: 0.9 }],
      },
      {
        role: 'partner',
        flip: true,
        from: { ...KNEEL_TALL, x: 212, torso: 160, armR: { ik: '0.toeR', dx: 3, dy: 0, bend: -1, end: -90 }, armL: { ik: '0.heelR', dx: 2, dy: 4, bend: -1, end: -90 } },
        to: { ...KNEEL_TALL, x: 212, torso: 155, armR: { ik: '0.toeR', dx: 3, dy: 0, bend: -1, end: -90 }, armL: { ik: '0.heelR', dx: 2, dy: 4, bend: -1, end: -90 } },
      },
    ],
  },
  'calves-step-drop': {
    actors: [
      {
        ground: { joint: 'toeR', y: 198 - 24 - 2.5 },
        from: { ...STAND, x: 125, legR: [2, 0, 85], legL: [0, -2, 85], armR: { ik: { x: 178, y: 92 }, bend: -1, end: 180 }, armL: { ik: { x: 178, y: 95 }, bend: -1, end: 180 } },
        to: { ...STAND, x: 125, legR: [2, 0, 130], legL: [0, -2, 130], armR: { ik: { x: 178, y: 92 }, bend: -1, end: 180 }, armL: { ik: { x: 178, y: 95 }, bend: -1, end: 180 } },
        muscles: [{ part: 'shinR', side: -1, from: 0.05, to: 0.95 }],
      },
    ],
    back: [step(130, 110, 24), rail(182, 198 - 24, 70)],
  },
};

export const sceneFor = (id: string): Scene | undefined => SCENES[id];

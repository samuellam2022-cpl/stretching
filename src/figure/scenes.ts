/**
 * Demo animation for each stretch, keyed by the stretch id in stretches.json.
 *
 * Angles are absolute directions in degrees: 0 = down, 90 = forward (the way
 * the figure faces), 180 = up, -90 = backward. See engine.ts for details.
 * A stretch without an entry here simply shows no animation.
 */
import type { IK, Pose } from './engine';
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
      },
    ],
  },
  'neck-levator-scapulae': {
    actors: [
      {
        from: at(SIT_STOOL, 150),
        to: { ...SIT_STOOL, neck: 152, head: 140, armR: { ik: 'self.head', dx: -5, dy: -8, bend: -1, end: 120 }, scale: { upperArmR: 0.75, forearmR: 0.6 } },
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
      },
    ],
    back: [stool(1, 76)],
  },

  // ===== Shoulders =====
  'shoulders-cross-body': {
    actors: [
      {
        from: STAND_FRONT,
        to: { ...STAND_FRONT, leftArmFront: true, armR: [76, 84, 86], armL: { ik: 'self.elbowR', dx: -14, dy: 3, bend: -1, end: 200 } },
      },
    ],
  },
  'shoulders-wall-chest': {
    actors: [
      {
        from: { ...STAND, x: 112, armR: { ik: { x: 60, y: 66 }, bend: 1, end: -95 } },
        to: { ...STAND, x: 124, torso: 176, bend: -8, armR: { ik: { x: 60, y: 66 }, bend: 1, end: -95 } },
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
      },
    ],
  },
  'back-childs-pose': {
    actors: [
      {
        from: { ...QUADRUPED, x: 120, armR: { ik: { x: 158, y: 195 }, bend: 1, end: 90 }, armL: { ik: { x: 162, y: 195 }, bend: 1, end: 90 } },
        to: { ...QUADRUPED, x: 100, torso: 70, bend: 14, neck: 58, head: 48, legR: [60, -90, -90], legL: [58, -90, -90], armR: { ik: { x: 214, y: 195 }, bend: 1, end: 90 }, armL: { ik: { x: 218, y: 195 }, bend: 1, end: 90 } },
      },
    ],
  },
  'back-partner-lat-pull': {
    actors: [
      {
        from: { ...STAND, x: 105, armR: { ik: { x: 160, y: 80 }, bend: -1, end: 90 }, armL: { ik: { x: 160, y: 82 }, bend: -1, end: 90 } },
        to: { ...STAND, x: 92, torso: 160, bend: 30, neck: 150, head: 140, legR: [55, -25], legL: [53, -27], armR: { ik: { x: 160, y: 98 }, bend: -1, end: 90 }, armL: { ik: { x: 160, y: 100 }, bend: -1, end: 90 } },
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
      },
    ],
    back: [mat(40, 40, 250, 130)],
  },
  'lower-back-partner-knee-hug': {
    actors: [
      {
        from: { ...SUPINE, legR: [205, 100, 165], legL: [207, 102, 165], armR: { ik: 'self.kneeR', dx: 6, dy: 4 }, armL: { ik: 'self.kneeL', dx: 4, dy: 6 } },
        to: { ...SUPINE, legR: [222, 112, 180], legL: [224, 114, 180], armR: { ik: 'self.kneeR', dx: 6, dy: 4 }, armL: { ik: 'self.kneeL', dx: 4, dy: 6 } },
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
      },
    ],
  },
  'hips-kneeling-hip-flexor': {
    actors: [
      {
        from: { x: 150, torso: 180, legR: [0, -90, -90], legL: [90, 0, 90], armR: { ik: 'self.kneeL', dx: -4, dy: -7 }, armL: { ik: 'self.kneeL', dx: -2, dy: -8 } },
        to: { x: 166, torso: 182, legR: [-24, -90, -90], legL: [72, -14, 90], armR: { ik: 'self.kneeL', dx: -4, dy: -7 }, armL: { ik: 'self.kneeL', dx: -2, dy: -8 } },
      },
    ],
  },
  'hips-partner-butterfly': {
    actors: [
      {
        from: { x: 112, torso: 180, legR: [128, 30, 120], legL: [130, 32, 120], armR: { ik: 'self.ankleR', dy: -3, bend: -1 }, armL: { ik: 'self.ankleL', dy: -3, bend: -1 }, scale: { thighR: 0.8, thighL: 0.8, shinR: 0.75, shinL: 0.75 } },
        to: { x: 112, torso: 180, legR: [104, 52, 115], legL: [106, 54, 115], armR: { ik: 'self.ankleR', dy: -3, bend: -1 }, armL: { ik: 'self.ankleL', dy: -3, bend: -1 }, scale: { thighR: 0.8, thighL: 0.8, shinR: 0.75, shinL: 0.75 } },
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
      },
    ],
  },
  'front-thigh-strap-quad': {
    actors: [
      {
        from: { ...PRONE, x: 160, neck: 100, head: 95, legR: [-90, -100, -90], armR: [-150, -105, -100], armL: [72, -100, -100] },
        to: { ...PRONE, x: 160, neck: 100, head: 95, legR: [-92, 160, 250], armR: [-160, -120, -115], armL: [72, -100, -100] },
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
      },
    ],
  },
  'back-thigh-standing-heel': {
    actors: [
      {
        from: { ...STAND, x: 150, torso: 178, legR: [28, 28, 150], legL: [-6, -10], armR: { ik: 'self.kneeL', dx: 6, dy: -14 }, armL: { ik: 'self.kneeL', dx: 6, dy: -12 } },
        to: { ...STAND, x: 142, torso: 128, neck: 125, head: 120, legR: [36, 36, 158], legL: [-14, -22], armR: { ik: 'self.kneeL', dx: 8, dy: -10 }, armL: { ik: 'self.kneeL', dx: 8, dy: -8 } },
      },
    ],
  },
  'back-thigh-partner-lying': {
    actors: [
      {
        from: { ...SUPINE, x: 140, legR: [108, 108, 198] },
        to: { ...SUPINE, x: 140, legR: [165, 165, 255] },
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
      },
    ],
    back: [wall(214, 'right')],
  },
  'calves-partner-seated': {
    actors: [
      {
        from: { ...LONG_SIT, x: 105, torso: 190, armR: { ik: { x: 82, y: 194 }, end: -90 }, armL: { ik: { x: 78, y: 194 }, end: -90 }, legR: [90, 90, 172] },
        to: { ...LONG_SIT, x: 105, torso: 190, armR: { ik: { x: 82, y: 194 }, end: -90 }, armL: { ik: { x: 78, y: 194 }, end: -90 }, legR: [90, 90, 200] },
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
      },
    ],
    back: [step(130, 110, 24), rail(182, 198 - 24, 70)],
  },
};

// ---------- stretches added for the muscle-first app ----------

const IKP = (x: number, y: number, extra: Partial<IK> = {}): IK => ({ ik: { x, y }, ...extra });
const IKJ = (joint: string, extra: Partial<IK> = {}): IK => ({ ik: joint, ...extra });

/** A doorframe / post seen edge-on. */
const post =
  (x: number, w = 8): Prop =>
  ({ floor }) =>
    `<rect class="prop" x="${x}" y="0" width="${w}" height="${floor}"/>`;

/** A sofa or bench seen from the side: seat block with a back. */
const sofa =
  (x: number, w: number, seatH: number): Prop =>
  ({ floor }) =>
    `<rect class="prop-dark" x="${x}" y="${floor - seatH - 34}" width="14" height="${seatH + 34}" rx="4"/>` +
    `<rect class="prop" x="${x}" y="${floor - seatH}" width="${w}" height="${seatH}" rx="5"/>`;

const SIT_FLOOR_KNEES: Pose = { x: 150, torso: 190, armR: [-20, -15, -90], armL: [-22, -17, -90], legR: [128, 38, 90], legL: [130, 36, 90] };
const TOP_LYING: Pose = { view: 'front', x: 110, torso: -90, armR: [80, 85], armL: [100, 95], legR: [90, 90], legL: [90, 90] };

const ADDED: Record<string, Scene> = {
  // ===== Neck =====
  'neck-anchored-side-bend': {
    limb: 'L',
    actors: [
      {
        from: { ...SIT_FRONT, armL: [2, 0, 0] },
        to: { ...SIT_FRONT, armL: [-4, -2, 0], torso: 184, neck: 204, head: 215 },
      },
    ],
    back: [stool(0, 76)],
    arrow: { joint: 'head', label: { en: 'Ear toward shoulder', zh: '耳仔側向膊頭' }, dy: -18, curve: -0.35, tx: -52, ty: 2 },
  },
  'neck-scalene-look-up': {
    limb: 'L',
    actors: [
      {
        from: { ...STAND_FRONT, leftArmFront: true, armR: IKJ('self.shoulderL', { dx: -9, dy: 5, bend: 1, end: 100 }), armL: IKJ('self.shoulderL', { dx: -7, dy: 8, bend: -1, end: -100 }) },
        to: { ...STAND_FRONT, leftArmFront: true, neck: 200, head: 208, armR: IKJ('self.shoulderL', { dx: -9, dy: 5, bend: 1, end: 100 }), armL: IKJ('self.shoulderL', { dx: -7, dy: 8, bend: -1, end: -100 }) },
      },
    ],
    arrow: { joint: 'head', label: { en: 'Tilt away, look up', zh: '側頭再微微望上' }, dy: -18, curve: -0.35, tx: -56, ty: 2 },
  },
  'neck-partner-levator': {
    actors: [
      { role: 'partner', from: { ...STAND, x: 112, armR: IKJ('1.shoulderR', { dx: -2, dy: -7, bend: -1, end: 60 }) } },
      {
        from: at(SIT_STOOL, 165),
        to: { ...SIT_STOOL, x: 165, neck: 152, head: 138 },
      },
    ],
    back: [stool(1)],
    arrow: { joint: 'head', label: { en: 'Chin toward armpit', zh: '下巴收向腋下' }, dx: 18, dy: -6, curve: 0.35, tx: 44, ty: 4 },
  },
  'neck-chair-levator': {
    actors: [
      {
        from: { ...SIT_STOOL, armL: IKJ('self.pelvis', { dx: -14, dy: 9, bend: -1 }) },
        to: { ...SIT_STOOL, neck: 152, head: 140, armL: IKJ('self.pelvis', { dx: -14, dy: 9, bend: -1 }), armR: IKJ('self.head', { dx: -5, dy: -8, bend: -1, end: 120 }), scale: { upperArmR: 0.75, forearmR: 0.6 } },
      },
    ],
    back: [stool(0)],
    arrow: { joint: 'head', label: { en: 'Chin toward armpit', zh: '下巴收向腋下' }, dx: 18, dy: -6, curve: 0.35, tx: 44, ty: 4 },
  },

  // ===== Shoulders / chest =====
  'shoulders-behind-back-clasp': {
    actors: [
      {
        from: { ...STAND, armR: [-14, -10, -10], armL: [-16, -12, -12] },
        to: { ...STAND, bend: -8, armR: [-58, -54, -54], armL: [-60, -56, -56] },
      },
    ],
    arrow: { joint: 'fingersR', label: { en: 'Lift clasped hands', zh: '扣住雙手向上提' }, dx: -8, curve: 0.25, tx: -22 },
  },
  'shoulders-partner-cross-body': {
    actors: [
      { role: 'partner', from: { ...STAND_FRONT, x: 214, armR: IKJ('1.elbowR', { dx: 4, dy: 2, bend: -1, end: -80 }), armL: [8, 4] } },
      {
        from: { ...STAND_FRONT, x: 140, armR: [58, 72, 74] },
        to: { ...STAND_FRONT, x: 140, armR: [78, 86, 86] },
      },
    ],
    arrow: { joint: 'wristR', actor: 1, label: { en: 'Arm drawn across chest', zh: '手臂拉過胸前' }, dy: -12, curve: -0.3, tx: -6, ty: -6 },
  },
  'back-thread-the-needle': {
    actors: [
      {
        from: QUADRUPED,
        to: { ...QUADRUPED, torso: 70, bend: 8, neck: 62, head: 50, armL: [35, 110, 90], armR: [78, 86, 86], scale: { upperArmR: 0.7, forearmR: 0.8 } },
      },
    ],
    hl: {
      'posterior-deltoid': [{ part: 'upperArmR', side: -1, from: 0, to: 0.5 }],
    },
    arrow: { joint: 'shoulderR', label: { en: 'Shoulder to the floor', zh: '膊頭落地' }, dx: 16, dy: -12, curve: 0.25 },
  },
  'shoulders-sleeper': {
    floor: false,
    actors: [
      {
        ground: 118,
        from: { x: 175, torso: -90, neck: -92, head: -96, armR: [180, 150, 150], armL: IKJ('self.wristR', { bend: 1 }), legR: [80, 55], legL: [84, 60], scale: { forearmR: 0.4 } },
        to: { x: 175, torso: -90, neck: -92, head: -96, armR: [180, 92, 92], armL: IKJ('self.wristR', { bend: 1 }), legR: [80, 55], legL: [84, 60], scale: { forearmR: 0.95 } },
      },
    ],
    back: [mat(20, 40, 280, 130)],
    hl: {
      'rotator-cuff': [{ part: 'torso', side: -1, from: 0.72, to: 0.92 }],
      'posterior-deltoid': [{ part: 'upperArmR', side: 1, from: 0, to: 0.4 }],
    },
    arrow: { joint: 'wristR', label: { en: 'Forearm toward the floor', zh: '前臂壓向地面' }, dy: -10, curve: -0.3 },
  },
  'shoulders-doorframe-rotation': {
    actors: [
      {
        from: { ...STAND, x: 128, armR: [92, 180, 180], legR: [4, 0], legL: [-4, -2] },
        to: { ...STAND, x: 170, torso: 178, armR: [-72, 180, 180], legR: [-16, -24, 70], legL: [14, 4] },
      },
    ],
    back: [post(154)],
    arrow: { joint: 'chest', label: { en: 'Step through, chest forward', zh: '踏前，胸口向前' }, dy: 24, curve: 0.2, ty: 8 },
  },

  // ===== Arms =====
  'arms-wall-biceps': {
    actors: [
      {
        from: { ...STAND, x: 114, armR: IKP(60, 76, { bend: 1, end: -95 }) },
        to: { ...STAND, x: 126, torso: 176, bend: -6, armR: IKP(60, 76, { bend: 1, end: -95 }) },
      },
    ],
    back: [wall(60)],
    arrow: { joint: 'chest', label: { en: 'Turn away from the wall', zh: '身體轉離牆' }, dx: 14, dy: -6, curve: -0.2, tx: 30 },
  },
  'arms-floor-biceps': {
    actors: [
      {
        from: { ...SIT_FLOOR_KNEES, x: 140, torso: 188, armR: IKP(112, 193, { bend: 1, end: -90 }), armL: IKP(108, 193, { bend: 1, end: -90 }) },
        to: { ...SIT_FLOOR_KNEES, x: 160, torso: 200, armR: IKP(112, 193, { bend: 1, end: -90 }), armL: IKP(108, 193, { bend: 1, end: -90 }), legR: [140, 55, 90], legL: [142, 53, 90] },
      },
    ],
    arrow: { joint: 'pelvis', label: { en: 'Slide hips forward', zh: '臀部向前滑' }, dy: -22, curve: -0.3 },
  },
  'arms-partner-biceps': {
    actors: [
      { role: 'partner', from: { ...STAND, x: 100, armR: IKJ('1.wristR', { bend: -1 }), armL: IKJ('1.wristL', { bend: -1 }) } },
      {
        from: { ...STAND, x: 178, armR: [-22, -20, -20], armL: [-24, -22, -22] },
        to: { ...STAND, x: 178, armR: [-64, -62, -62], armL: [-66, -64, -64] },
      },
    ],
    arrow: { joint: 'wristR', actor: 1, label: { en: 'Arms lifted back and up', zh: '雙手向後上方提' }, dx: 4, dy: 12, curve: -0.3, ty: 10 },
  },
  'arms-overhead-triceps': {
    actors: [
      {
        from: { ...STAND_FRONT, facing: 'back', leftArmFront: true, armR: [200, 50, 40], armL: IKJ('self.elbowR', { dx: 2, dy: 2, bend: 1, end: 200 }) },
        to: { ...STAND_FRONT, facing: 'back', leftArmFront: true, armR: [184, 26, 15], armL: IKJ('self.elbowR', { dx: 2, dy: 2, bend: 1, end: 200 }), scale: { upperArmR: 0.85 } },
      },
    ],
    hl: {
      triceps: [{ part: 'upperArmR', side: 0, from: 0.15, to: 0.95 }],
    },
    arrow: { joint: 'elbowR', label: { en: 'Elbow toward the midline', zh: '手踭拉向中間' }, dy: -14, curve: -0.3, tx: -20 },
  },
  'arms-partner-triceps': {
    actors: [
      { role: 'partner', from: { ...STAND, x: 108, armR: IKJ('1.elbowR', { dx: -3, bend: -1 }), armL: IKJ('1.wristR', { dx: -3, bend: -1 }) } },
      {
        from: { ...SIT_STOOL, x: 168, armR: [160, -10, -10] },
        to: { ...SIT_STOOL, x: 168, armR: [186, -22, -18] },
      },
    ],
    back: [stool(1)],
    arrow: { joint: 'elbowR', actor: 1, label: { en: 'Elbow eased back', zh: '手踭輕輕向後' }, dy: -12, curve: 0.3, tx: 26 },
  },
  'arms-wrist-flexor': {
    actors: [
      {
        from: { ...STAND, armR: [88, 90, 25], armL: IKJ('self.fingersR', { bend: -1 }) },
        to: { ...STAND, armR: [88, 90, -40], armL: IKJ('self.fingersR', { bend: -1 }) },
      },
    ],
    arrow: { joint: 'fingersR', label: { en: 'Fingers back toward you', zh: '手指拉向自己' }, dy: 12, curve: 0.3, ty: 10 },
  },
  'arms-kneeling-wrist-flexor': {
    actors: [
      {
        from: { ...QUADRUPED, armR: IKP(184, 193, { bend: 1, end: -90 }), armL: IKP(188, 193, { bend: 1, end: -90 }) },
        to: { ...QUADRUPED, x: 110, torso: 98, legR: [30, -90, -90], legL: [28, -90, -90], armR: IKP(184, 193, { bend: 1, end: -90 }), armL: IKP(188, 193, { bend: 1, end: -90 }) },
      },
    ],
    arrow: { joint: 'pelvis', label: { en: 'Sit hips back', zh: '臀部向後坐' }, dy: -22, curve: 0.3 },
  },
  'arms-wall-wrist-flexor': {
    actors: [
      {
        from: { ...STAND, x: 150, armR: IKP(211, 108, { bend: 1, end: 0 }) },
        to: { ...STAND, x: 163, torso: 172, armR: IKP(211, 108, { bend: 1, end: 0 }) },
      },
    ],
    back: [wall(214, 'right')],
    arrow: { joint: 'chest', label: { en: 'Lean toward the wall', zh: '身體向牆挨' }, dx: -30, dy: 6, curve: -0.3, tx: -26, ty: -4 },
  },

  // ===== Upper back / core =====
  'core-standing-side-reach': {
    actors: [
      {
        from: { ...STAND_FRONT, armR: [186, 182, 182], armL: [34, -42, -42] },
        to: { ...STAND_FRONT, torso: 166, bend: 22, armR: [150, 138, 138], armL: [34, -42, -42] },
      },
    ],
    arrow: { joint: 'head', label: { en: 'Reach up and over', zh: '向上伸再向側面彎' }, dx: 22, dy: 4, curve: -0.3, tx: 44, ty: 12 },
  },
  'back-self-hug': {
    actors: [
      {
        from: { ...SIT_STOOL, armR: IKJ('self.neckBase', { dx: 4, dy: 8, bend: -1, end: 200 }), armL: IKJ('self.neckBase', { dx: 6, dy: 12, bend: -1, end: 200 }) },
        to: { ...SIT_STOOL, bend: 40, neck: 158, head: 140, armR: IKJ('self.neckBase', { dx: 4, dy: 8, bend: -1, end: 200 }), armL: IKJ('self.neckBase', { dx: 6, dy: 12, bend: -1, end: 200 }) },
      },
    ],
    back: [stool(0)],
    arrow: { joint: 'head', label: { en: 'Round the upper back', zh: '拱起上背' }, dx: -24, dy: 4, curve: 0.3, tx: -30, ty: 4 },
  },
  'core-cobra': {
    actors: [
      {
        ground: 186,
        from: { ...PRONE, x: 140, armR: IKP(196, 193, { bend: -1, end: 90 }), armL: IKP(200, 193, { bend: -1, end: 90 }) },
        to: { ...PRONE, x: 140, torso: 132, bend: -46, neck: 165, head: 170, armR: IKP(196, 193, { bend: -1, end: 90 }), armL: IKP(200, 193, { bend: -1, end: 90 }) },
      },
    ],
    arrow: { joint: 'head', label: { en: 'Press the chest up', zh: '撐起胸口' }, dx: 18, curve: 0.3 },
  },
  'core-ball-back-extension': {
    actors: [
      {
        ground: 156,
        from: { x: 182, torso: 212, bend: -8, neck: 205, head: 200, armR: IKJ('self.chest', { dx: 10, dy: -2, bend: 1 }), armL: IKJ('self.chest', { dx: 8, dy: 0, bend: 1 }), legR: [112, 20, 90], legL: [114, 18, 90] },
        to: { x: 182, torso: 250, bend: -50, neck: 268, head: 275, armR: [-112, -118, -118], armL: [-116, -122, -122], legR: [112, 20, 90], legL: [114, 18, 90] },
      },
    ],
    back: [ball(152, 31)],
    arrow: { joint: 'fingersR', label: { en: 'Lean back, reach overhead', zh: '向後挨，雙手伸過頭' }, dy: -10, curve: 0.3, tx: 20 },
  },
  'core-partner-side-stretch': {
    actors: [
      {
        role: 'partner',
        from: { ...STAND_FRONT, x: 198, armR: IKP(160, 128, { bend: 1 }), armL: IKP(160, 22, { bend: 1 }) },
        to: { ...STAND_FRONT, x: 212, torso: 200, bend: 26, armR: IKP(160, 132, { bend: 1 }), armL: IKP(160, 34, { bend: 1 }) },
      },
      {
        from: { ...STAND_FRONT, x: 122, armL: IKP(160, 128, { bend: -1 }), armR: IKP(160, 22, { bend: -1 }) },
        to: { ...STAND_FRONT, x: 108, torso: 160, bend: -26, armL: IKP(160, 132, { bend: -1 }), armR: IKP(160, 34, { bend: -1 }) },
      },
    ],
    arrow: { joint: 'pelvis', actor: 1, label: { en: 'Hips lean away', zh: '髖部向外推' }, dx: -22, curve: 0.2, tx: -8, ty: 14 },
  },
  'lower-back-seated-side-bend': {
    actors: [
      {
        from: { ...STAND_FRONT, armR: [186, 182, 182], armL: [18, 8, 0], legR: [-78, 62, 80], legL: [78, -62, -80], scale: { thighR: 0.85, thighL: 0.85, shinR: 0.7, shinL: 0.7 } },
        to: { ...STAND_FRONT, torso: 164, bend: 24, armR: [148, 136, 136], armL: [30, 14, 0], legR: [-78, 62, 80], legL: [78, -62, -80], scale: { thighR: 0.85, thighL: 0.85, shinR: 0.7, shinL: 0.7 } },
      },
    ],
    arrow: { joint: 'fingersR', label: { en: 'Reach over to the side', zh: '舉手向側面彎' }, dy: -8, curve: -0.3 },
  },

  // ===== Glutes =====
  'glutes-supine-cross-knee': {
    actors: [
      {
        from: { ...SUPINE, x: 160, legR: [150, 55, 140], armR: IKJ('self.kneeR', { dx: 2, dy: 6 }), armL: IKJ('self.kneeR', { dx: 0, dy: 8 }) },
        to: { ...SUPINE, x: 160, legR: [218, 112, 180], armR: IKJ('self.kneeR', { dx: 2, dy: 6 }), armL: IKJ('self.kneeR', { dx: 0, dy: 8 }), scale: { thighR: 0.85 } },
      },
    ],
    arrow: { joint: 'kneeR', label: { en: 'Knee to opposite shoulder', zh: '膝頭拉向對面膊頭' }, dy: -14, curve: 0.3 },
  },
  'glutes-seated-twist': {
    actors: [
      {
        from: { ...LONG_SIT, x: 130, legR: [128, 42, 90], armR: IKP(108, 193, { bend: 1, end: -90 }), armL: IKJ('self.kneeR', { dx: 4, dy: 4, bend: -1 }) },
        to: { ...LONG_SIT, x: 130, torso: 182, legR: [150, 28, 90], armR: IKP(108, 193, { bend: 1, end: -90 }), armL: IKJ('self.kneeR', { dx: 4, dy: 4, bend: -1 }) },
      },
    ],
    arrow: { joint: 'kneeR', label: { en: 'Hug the knee in', zh: '膝頭抱向胸口' }, dx: 12, dy: -12, curve: 0.3, tx: 20 },
  },
  'glutes-partner-cross-knee': {
    actors: [
      {
        from: { ...SUPINE, x: 140, legR: [158, 62, 150] },
        to: { ...SUPINE, x: 140, legR: [216, 110, 180], scale: { thighR: 0.85 } },
      },
      {
        role: 'partner',
        flip: true,
        from: { ...KNEEL_TALL, x: 226, torso: 152, neck: 142, head: 132, armR: IKJ('0.kneeR', { dx: 6, dy: -4, bend: -1 }), armL: IKJ('0.kneeR', { dx: 10, dy: 0, bend: -1 }) },
        to: { ...KNEEL_TALL, x: 214, torso: 140, neck: 130, head: 120, armR: IKJ('0.kneeR', { dx: 6, dy: -4, bend: -1 }), armL: IKJ('0.kneeR', { dx: 10, dy: 0, bend: -1 }) },
      },
    ],
    arrow: { joint: 'kneeR', actor: 0, label: { en: 'Knee guided across', zh: '膝頭推向對面膊頭' }, dy: -16, curve: 0.3 },
  },
  'glutes-chair-figure-four': {
    actors: [
      {
        from: { ...SIT_STOOL, legR: IKJ('self.kneeL', { dx: 2, dy: -8, bend: 1, end: 60 }), armR: IKJ('self.ankleR', { dx: -4, dy: -4, bend: -1 }), armL: IKJ('self.kneeL', { dx: -8, dy: -8, bend: -1 }), scale: { thighR: 0.8 } },
        to: { ...SIT_STOOL, torso: 148, neck: 146, head: 142, legR: IKJ('self.kneeL', { dx: 2, dy: -8, bend: 1, end: 60 }), armR: IKJ('self.ankleR', { dx: -4, dy: -4, bend: -1 }), armL: IKJ('self.kneeL', { dx: -8, dy: -8, bend: -1 }), scale: { thighR: 0.8 } },
      },
    ],
    back: [stool(0)],
    arrow: { joint: 'head', label: { en: 'Lean chest forward', zh: '上身向前傾' }, dy: -18, curve: -0.25 },
  },

  // ===== Hips =====
  'hips-couch-stretch': {
    actors: [
      {
        from: { x: 150, torso: 138, neck: 140, head: 140, legR: [-22, 176, 268], legL: [84, -2, 90], armR: IKJ('self.kneeL', { dx: -2, dy: -8 }), armL: IKJ('self.kneeL', { dx: 0, dy: -6 }) },
        to: { x: 150, torso: 180, legR: [-22, 176, 268], legL: [84, -2, 90], armR: IKJ('self.kneeL', { dx: -2, dy: -8 }), armL: IKJ('self.kneeL', { dx: 0, dy: -6 }) },
      },
    ],
    back: [sofa(74, 56, 44)],
    arrow: { joint: 'head', label: { en: 'Lift the chest upright', zh: '慢慢挺直上身' }, dx: 16, curve: -0.3, tx: 22 },
  },
  'hips-standing-lunge': {
    actors: [
      {
        from: { ...STAND, x: 150, armR: IKJ('self.pelvis', { dx: 4, dy: -12, bend: -1 }), armL: IKJ('self.pelvis', { dx: 6, dy: -12, bend: -1 }), legR: [-26, -38, 55], legL: [26, 8] },
        to: { ...STAND, x: 164, torso: 182, armR: IKJ('self.pelvis', { dx: 4, dy: -12, bend: -1 }), armL: IKJ('self.pelvis', { dx: 6, dy: -12, bend: -1 }), legR: [-40, -50, 45], legL: [34, -8] },
      },
    ],
    arrow: { joint: 'pelvis', label: { en: 'Tuck and shift hips forward', zh: '收尾龍骨，髖部向前推' }, dx: 20, dy: 6, curve: 0.2, tx: 46, ty: 8 },
  },
  'hips-standing-cross-lean': {
    actors: [
      {
        from: { ...STAND_FRONT, armR: [186, 182, 182], legR: [16, 12], legL: [-6, -4] },
        to: { ...STAND_FRONT, x: 150, torso: 164, bend: 20, armR: [152, 140, 140], legR: [22, 18], legL: [-12, -10] },
      },
    ],
    arrow: { joint: 'pelvis', label: { en: 'Push the hip out', zh: '髖部向外推' }, dx: -26, curve: 0.2, tx: -14, ty: 12 },
  },
  'hips-wall-tfl-lean': {
    actors: [
      {
        from: { ...STAND_FRONT, x: 150, armR: IKP(98, 78, { bend: 1, end: 180 }), legR: [16, 12], legL: [-6, -4] },
        to: { ...STAND_FRONT, x: 134, torso: 166, armR: IKP(98, 78, { bend: 1, end: 180 }), legR: [26, 22], legL: [-18, -16] },
      },
    ],
    back: [wall(92)],
    arrow: { joint: 'pelvis', label: { en: 'Hip sinks toward the wall', zh: '髖部向牆沉' }, dy: 22, curve: -0.2, ty: 12 },
  },
  'hips-partner-adduction': {
    floor: false,
    actors: [
      {
        ground: 112,
        from: { ...TOP_LYING, x: 92 },
        to: { ...TOP_LYING, x: 92, legR: [114, 114] },
      },
      {
        role: 'partner',
        ground: 112,
        from: { view: 'front', facing: 'back', x: 296, torso: -90, armR: IKJ('0.ankleR', { dx: 6, bend: 1 }), armL: IKJ('0.ankleR', { dx: 8, dy: 3, bend: -1 }), legR: [90, 90], legL: [90, 90], scale: { thighR: 0.3, thighL: 0.3, shinR: 0.2, shinL: 0.2 } },
      },
    ],
    back: [mat(16, 40, 290, 144)],
    arrow: { joint: 'ankleR', actor: 0, label: { en: 'Leg drawn across', zh: '伸直腳拉過另一邊' }, dx: -34, curve: 0.2, tx: -4, ty: 34 },
  },

  // ===== Thighs / calves =====
  'thighs-seated-straddle': {
    actors: [
      {
        from: { ...LONG_SIT, x: 118, legR: [84, 84, 174], legL: [97, 97, 187], armR: IKP(170, 193, { bend: -1, end: 90 }), armL: IKP(174, 193, { bend: -1, end: 90 }), scale: { thighR: 0.78, thighL: 0.78, shinR: 0.78, shinL: 0.78 } },
        to: { ...LONG_SIT, x: 118, torso: 128, bend: 10, neck: 122, head: 112, legR: [84, 84, 174], legL: [97, 97, 187], armR: IKP(200, 193, { bend: -1, end: 90 }), armL: IKP(204, 193, { bend: -1, end: 90 }), scale: { thighR: 0.78, thighL: 0.78, shinR: 0.78, shinL: 0.78 } },
      },
    ],
    hl: {
      adductors: [{ part: 'thighR', side: 0.2, from: 0.08, to: 0.8 }],
      hamstrings: [{ part: 'thighR', side: -1, from: 0.2, to: 0.95 }],
    },
    arrow: { joint: 'head', label: { en: 'Hinge forward from the hips', zh: '由髖部向前摺' }, dy: -16, curve: -0.25 },
  },
  'thighs-side-lunge': {
    actors: [
      {
        ground: 'pose',
        from: { ...STAND_FRONT, x: 160, y: 112, legR: IKP(118, 190, { bend: -1, end: 0 }), legL: IKP(202, 190, { bend: 1, end: 0 }), armR: IKJ('self.kneeL', { dx: -6, dy: -10, bend: 1 }), armL: IKJ('self.kneeL', { dx: 0, dy: -12, bend: -1 }) },
        to: { ...STAND_FRONT, x: 184, y: 132, torso: 176, legR: IKP(118, 190, { bend: -1, end: 0 }), legL: IKP(202, 190, { bend: 1, end: 0 }), armR: IKJ('self.kneeL', { dx: -6, dy: -10, bend: 1 }), armL: IKJ('self.kneeL', { dx: 0, dy: -12, bend: -1 }) },
      },
    ],
    arrow: { joint: 'pelvis', label: { en: 'Shift weight over the bent knee', zh: '重心移向屈膝嗰邊' }, dy: 30, curve: -0.2, ty: 12 },
  },
  'calves-kneeling-soleus': {
    actors: [
      {
        from: { x: 150, torso: 178, legL: [0, -90, -90], legR: [90, 0, 90], armR: IKJ('self.kneeR', { dx: -4, dy: -7 }), armL: IKJ('self.kneeR', { dx: -2, dy: -8 }) },
        to: { x: 163, torso: 166, legL: [-16, -90, -90], legR: [72, -22, 90], armR: IKJ('self.kneeR', { dx: -4, dy: -7 }), armL: IKJ('self.kneeR', { dx: -2, dy: -8 }) },
      },
    ],
    arrow: { joint: 'kneeR', label: { en: 'Knee forward over the toes', zh: '膝頭推過腳趾' }, dy: -16, curve: -0.3, tx: 20 },
  },
};

Object.assign(SCENES, ADDED);

// ---------- cues and overlay tweaks for the original stretches ----------

const TWEAKS: Record<string, Partial<Scene> & { facing?: 'back' }> = {
  'neck-side-bend': { limb: 'L', arrow: { joint: 'head', label: { en: 'Ear toward shoulder', zh: '耳仔側向膊頭' }, dy: -18, curve: -0.35, tx: -52, ty: 2 } },
  'neck-levator-scapulae': { arrow: { joint: 'head', label: { en: 'Chin toward armpit', zh: '下巴收向腋下' }, dx: 18, dy: -6, curve: 0.35, tx: 44, ty: 4 } },
  'neck-partner-side-stretch': { limb: 'L', arrow: { joint: 'head', actor: 1, label: { en: 'Ear toward shoulder', zh: '耳仔側向膊頭' }, dx: -6, dy: -18, curve: -0.35, tx: -54, ty: 2 } },
  'shoulders-cross-body': { arrow: { joint: 'wristR', label: { en: 'Draw the arm across', zh: '手臂拉過胸前' }, dx: -26, dy: -6, curve: -0.35, tx: -34 } },
  'shoulders-wall-chest': { arrow: { joint: 'chest', label: { en: 'Turn away from the wall', zh: '身體轉離牆' }, dx: 14, dy: -6, curve: -0.2, tx: 30 } },
  'shoulders-partner-chest-opener': { arrow: { joint: 'elbowR', actor: 1, label: { en: 'Elbows drawn back', zh: '手踭向後拉' }, dy: -12, curve: 0.3, tx: 24 } },
  'shoulders-towel-overhead': {
    facing: 'back',
    hl: {
      triceps: [{ part: 'upperArmR', side: 0, from: 0.15, to: 0.95 }],
      'rotator-cuff': [{ part: 'torso', side: 0.75, from: 0.72, to: 0.9 }],
      'latissimus-dorsi': [{ part: 'torso', side: -0.85, from: 0.4, to: 0.8 }],
    },
    arrow: { joint: 'handL', label: { en: 'Pull the towel down', zh: '將毛巾向下拉' }, dx: 22, curve: -0.2, tx: 26 },
  },
  'back-cat-cow': { arrow: { joint: 'waist', label: { en: 'Round the back up', zh: '背向上拱起' }, dy: -18, curve: 0.2, ty: -6 } },
  'back-childs-pose': { arrow: { joint: 'pelvis', label: { en: 'Hips back to heels', zh: '臀部坐向腳跟' }, dy: -22, curve: 0.3 } },
  'back-partner-lat-pull': { arrow: { joint: 'pelvis', label: { en: 'Sit hips back', zh: '臀部向後坐' }, dx: -16, curve: 0.3, tx: -16 } },
  'back-foam-roller-extension': { arrow: { joint: 'head', label: { en: 'Lean back over the roller', zh: '向後挨過滾筒' }, dy: -16, curve: 0.3 } },
  'lower-back-knee-to-chest': { arrow: { joint: 'kneeR', label: { en: 'Knee to chest', zh: '膝頭拉向胸口' }, dy: -14, curve: 0.3 } },
  'lower-back-supine-twist': { limb: 'L', arrow: { joint: 'kneeR', label: { en: 'Knees drop to one side', zh: '膝頭倒向一邊' }, dx: 16, curve: -0.2, tx: 30 } },
  'lower-back-partner-knee-hug': { arrow: { joint: 'kneeR', label: { en: 'Knees toward chest', zh: '膝頭推向胸口' }, dy: -16, curve: 0.3 } },
  'lower-back-ball-drape': { arrow: { joint: 'head', label: { en: 'Drape over the ball', zh: '伏喺球上放鬆' }, dx: 14, dy: -10, curve: -0.3 } },
  'hips-figure-four': { arrow: { joint: 'kneeL', label: { en: 'Draw the thigh in', zh: '大腿拉向自己' }, dx: 14, dy: -12, curve: 0.3, tx: 20 } },
  'hips-kneeling-hip-flexor': { arrow: { joint: 'pelvis', label: { en: 'Hips forward', zh: '髖部向前推' }, dx: -34, dy: -4, curve: -0.3, tx: -16, ty: -6 } },
  'hips-partner-butterfly': { arrow: { joint: 'kneeR', label: { en: 'Knees toward the floor', zh: '膝頭向地面壓' }, dx: -6, dy: -18, curve: 0.3, tx: -30 } },
  'hips-supported-pigeon': {
    hl: { iliopsoas: [{ part: 'thighL', side: 1, from: 0, to: 0.35 }] },
    arrow: { joint: 'head', label: { en: 'Fold forward', zh: '上身向前俯' }, dy: -16, curve: -0.3 },
  },
  'front-thigh-standing-quad': { arrow: { joint: 'heelR', label: { en: 'Heel toward buttock', zh: '腳跟拉向臀部' }, dx: -14, curve: -0.3, tx: -34 } },
  'front-thigh-side-lying-quad': { arrow: { joint: 'heelR', label: { en: 'Heel toward buttock', zh: '腳跟拉向臀部' }, dy: 16, curve: -0.3, ty: 8 } },
  'front-thigh-partner-prone': { arrow: { joint: 'heelR', actor: 1, label: { en: 'Heel toward buttock', zh: '腳跟推向臀部' }, dx: -10, dy: -8, curve: 0.3, tx: -34 } },
  'front-thigh-strap-quad': { arrow: { joint: 'heelR', label: { en: 'Heel toward buttock', zh: '腳跟拉向臀部' }, dx: -10, dy: -8, curve: 0.3, tx: -34 } },
  'back-thigh-seated-single-leg': { arrow: { joint: 'head', label: { en: 'Hinge forward from the hips', zh: '由髖部向前摺' }, dy: -16, curve: -0.25 } },
  'back-thigh-standing-heel': { arrow: { joint: 'head', label: { en: 'Hinge forward, back flat', zh: '由髖部向前摺，背平直' }, dy: -16, curve: -0.25 } },
  'back-thigh-partner-lying': { arrow: { joint: 'ankleR', actor: 0, label: { en: 'Straight leg raised', zh: '伸直腳慢慢抬高' }, dx: -12, dy: -10, curve: 0.25, tx: -36 } },
  'back-thigh-strap-lying': { arrow: { joint: 'ankleR', label: { en: 'Raise the straight leg', zh: '伸直腳拉高' }, dx: 16, curve: -0.25, tx: 34 } },
  'calves-wall-straight': { arrow: { joint: 'pelvis', label: { en: 'Lean in, heel down', zh: '向牆挨，腳跟貼地' }, dy: 34, dx: -30, curve: 0.2, ty: 44, tx: -10 } },
  'calves-wall-bent-knee': { arrow: { joint: 'pelvis', label: { en: 'Bend knees, heel down', zh: '屈膝下沉，腳跟貼地' }, dx: -34, curve: 0.2, tx: -30 } },
  'calves-partner-seated': { arrow: { joint: 'toeR', actor: 0, label: { en: 'Foot pressed toward shin', zh: '腳掌推向小腿' }, dy: -14, curve: 0.4, ty: -8 } },
  'calves-step-drop': { arrow: { joint: 'heelR', label: { en: 'Heels sink below the step', zh: '腳跟沉落梯級以下' }, dx: -12, curve: 0.2, tx: -40 } },
};

for (const [id, tweak] of Object.entries(TWEAKS)) {
  const scene = SCENES[id];
  if (!scene) continue;
  const { facing, ...rest } = tweak;
  Object.assign(scene, rest);
  if (facing) {
    for (const a of scene.actors) {
      a.from = { ...a.from, facing };
      if (a.to) a.to = { ...a.to, facing };
    }
  }
}

export const sceneFor = (id: string): Scene | undefined => SCENES[id];

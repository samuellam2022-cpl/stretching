/**
 * Where each muscle's coloured overlay goes on the demo figure, by default.
 * A scene can override this per muscle with `hl` when the pose needs it.
 */
import type { Highlight, ViewKind } from './engine';

export type HighlightSpec = Omit<Highlight, 'muscle' | 'level'>;

type Limb = 'R' | 'L';

/** Side view: the stretched limb is `limb`; front/back = +1/−1 on each segment. */
function sideView(id: string, limb: Limb): HighlightSpec[] {
  const arm = `upperArm${limb}` as const;
  const fore = `forearm${limb}` as const;
  const thigh = `thigh${limb}` as const;
  const shin = `shin${limb}` as const;
  switch (id) {
    case 'upper-trapezius':
      return [
        { part: 'neck', side: -1, from: 0, to: 1 },
        { part: 'torso', side: -1, from: 0.88, to: 1 },
      ];
    case 'levator-scapulae':
      return [{ part: 'neck', side: -0.6, from: 0.1, to: 1 }];
    case 'scalenes':
      return [{ part: 'neck', side: 0.5, from: 0, to: 0.85 }];
    case 'anterior-deltoid':
      return [{ part: arm, side: 1, from: 0, to: 0.36 }];
    case 'posterior-deltoid':
      return [{ part: arm, side: -1, from: 0, to: 0.36 }];
    case 'rotator-cuff':
      return [{ part: 'torso', side: -1, from: 0.74, to: 0.92 }];
    case 'pectoralis-major':
      return [{ part: 'torso', side: 1, from: 0.62, to: 0.9 }];
    case 'biceps':
      return [{ part: arm, side: 1, from: 0.32, to: 0.92 }];
    case 'triceps':
      return [{ part: arm, side: -1, from: 0.32, to: 0.95 }];
    case 'forearm-flexors':
      return [{ part: fore, side: 1, from: 0.08, to: 0.8 }];
    case 'latissimus-dorsi':
      return [{ part: 'torso', side: -1, from: 0.42, to: 0.8 }];
    case 'rhomboids':
      return [{ part: 'torso', side: -1, from: 0.7, to: 0.9 }];
    case 'erector-spinae':
      return [{ part: 'torso', side: -1, from: 0.06, to: 0.68 }];
    case 'quadratus-lumborum':
      return [{ part: 'torso', side: -0.5, from: 0.08, to: 0.34 }];
    case 'abdominals':
      return [{ part: 'torso', side: 1, from: 0.1, to: 0.58 }];
    case 'obliques':
      return [{ part: 'torso', side: 0.3, from: 0.14, to: 0.52 }];
    case 'gluteus-maximus':
      return [{ part: 'glutes' }];
    case 'gluteus-medius':
      return [{ part: 'gluteMed' }];
    case 'piriformis':
      return [{ part: 'piriformis' }];
    case 'iliopsoas':
      return [
        { part: 'torso', side: 1, from: 0, to: 0.2 },
        { part: thigh, side: 1, from: 0, to: 0.22 },
      ];
    case 'tfl':
      return [{ part: thigh, side: 0.3, from: 0, to: 0.9 }];
    case 'quadriceps':
      return [{ part: thigh, side: 1, from: 0.1, to: 0.92 }];
    case 'adductors':
      return [{ part: thigh, side: -0.2, from: 0.08, to: 0.72 }];
    case 'hamstrings':
      return [{ part: thigh, side: -1, from: 0.1, to: 0.95 }];
    case 'gastrocnemius':
      return [{ part: shin, side: -1, from: 0.04, to: 0.55 }];
    case 'soleus':
      return [{ part: shin, side: -1, from: 0.42, to: 0.92 }];
    default:
      return [];
  }
}

/** Front (or back) view: the stretched side is `limb`; s = −1 for the person's right (screen left). */
function frontView(id: string, limb: Limb): HighlightSpec[] {
  const s = limb === 'R' ? -1 : 1;
  const arm = `upperArm${limb}` as const;
  const fore = `forearm${limb}` as const;
  const thigh = `thigh${limb}` as const;
  const shin = `shin${limb}` as const;
  switch (id) {
    case 'upper-trapezius':
      return [
        { part: 'neck', side: s, from: 0, to: 1 },
        { part: 'torso', side: s, from: 0.87, to: 0.99 },
      ];
    case 'levator-scapulae':
      return [{ part: 'neck', side: s * 0.5, from: 0.2, to: 1 }];
    case 'scalenes':
      return [{ part: 'neck', side: s * 0.7, from: 0, to: 0.75 }];
    case 'anterior-deltoid':
    case 'posterior-deltoid':
      return [{ part: arm, side: 0, from: 0, to: 0.4 }];
    case 'rotator-cuff':
      return [{ part: 'torso', side: s * 0.75, from: 0.72, to: 0.9 }];
    case 'pectoralis-major':
      return [{ part: 'torso', side: s * 0.6, from: 0.64, to: 0.9 }];
    case 'biceps':
    case 'triceps':
      return [{ part: arm, side: 0, from: 0.32, to: 0.92 }];
    case 'forearm-flexors':
      return [{ part: fore, side: 0, from: 0.08, to: 0.8 }];
    case 'latissimus-dorsi':
      return [{ part: 'torso', side: s * 0.85, from: 0.4, to: 0.8 }];
    case 'rhomboids':
      return [{ part: 'torso', side: s * 0.4, from: 0.7, to: 0.9 }];
    case 'erector-spinae':
      return [
        { part: 'torso', side: -0.25, from: 0.06, to: 0.7 },
        { part: 'torso', side: 0.25, from: 0.06, to: 0.7 },
      ];
    case 'quadratus-lumborum':
      return [{ part: 'torso', side: s * 0.6, from: 0.08, to: 0.34 }];
    case 'abdominals':
      return [{ part: 'torso', side: 0, from: 0.1, to: 0.58 }];
    case 'obliques':
      return [{ part: 'torso', side: s * 0.85, from: 0.14, to: 0.52 }];
    case 'gluteus-maximus':
      return [{ part: 'glutes' }];
    case 'gluteus-medius':
      return [{ part: 'gluteMed', side: s }];
    case 'piriformis':
      return [{ part: 'piriformis', side: s }];
    case 'iliopsoas':
      return [
        { part: 'torso', side: s * 0.5, from: 0, to: 0.18 },
        { part: thigh, side: 0, from: 0, to: 0.2 },
      ];
    case 'tfl':
      return [{ part: thigh, side: s * 0.9, from: 0, to: 0.9 }];
    case 'quadriceps':
    case 'hamstrings':
      return [{ part: thigh, side: 0, from: 0.1, to: 0.92 }];
    case 'adductors':
      return [{ part: thigh, side: -s * 0.8, from: 0.05, to: 0.7 }];
    case 'gastrocnemius':
      return [{ part: shin, side: 0, from: 0.04, to: 0.55 }];
    case 'soleus':
      return [{ part: shin, side: 0, from: 0.42, to: 0.92 }];
    default:
      return [];
  }
}

export function defaultHighlights(id: string, view: ViewKind, limb: Limb): HighlightSpec[] {
  return view === 'front' ? frontView(id, limb) : sideView(id, limb);
}

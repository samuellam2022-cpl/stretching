/**
 * The 2D body map: front and back outlines divided into tappable regions,
 * plus the shape of each muscle for its small location picture.
 *
 * Coordinates: a 200 × 420 box, body centred on x = 100. Shapes are drawn for
 * the left half of the picture and mirrored, unless they sit on the midline.
 */
import type { MapView } from './types';

type P = [number, number];

const mirror = (pts: P[]): P[] => pts.map(([x, y]) => [200 - x, y]);
const path = (pts: P[]): string => `M${pts.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
/** Both sides of the body. */
const both = (pts: P[]): string => path(pts) + path(mirror(pts));

interface RegionShape {
  id: string;
  d: string;
}

// Shared between front and back.
const NECK = path([[92, 54], [108, 54], [109, 66], [120, 74], [80, 74], [91, 66]]);
const SHOULDER = both([[80, 74], [66, 76], [56, 82], [51, 94], [52, 108], [60, 104], [66, 94], [74, 86]]);
const ARM = both([[52, 108], [60, 104], [64, 112], [63, 128], [58, 150], [55, 172], [50, 200], [46, 232], [38, 230], [40, 198], [43, 170], [46, 140]]);
const LOWER_LEG = both([[67, 330], [89, 330], [90, 350], [86, 385], [74, 385], [66, 352]]);

const FRONT: RegionShape[] = [
  { id: 'neck', d: NECK },
  { id: 'shoulders', d: SHOULDER },
  { id: 'arms', d: ARM },
  { id: 'chest', d: path([[80, 74], [74, 86], [66, 94], [64, 112], [70, 128], [100, 132], [130, 128], [136, 112], [134, 94], [126, 86], [120, 74]]) },
  { id: 'core', d: path([[70, 128], [100, 132], [130, 128], [129, 150], [128, 172], [132, 188], [100, 194], [68, 188], [72, 172], [71, 150]]) },
  { id: 'hips', d: path([[68, 188], [100, 194], [132, 188], [138, 206], [122, 218], [100, 226], [78, 218], [62, 206]]) },
  { id: 'front-thigh', d: both([[62, 206], [78, 218], [86, 224], [88, 250], [86, 290], [84, 312], [66, 312], [60, 285], [57, 245], [58, 220]]) },
  { id: 'inner-thigh', d: both([[86, 224], [100, 226], [98, 250], [94, 285], [90, 312], [84, 312], [86, 290], [88, 250]]) },
  { id: 'calves', d: LOWER_LEG },
];

const BACK: RegionShape[] = [
  { id: 'neck', d: NECK },
  { id: 'shoulders', d: SHOULDER },
  { id: 'arms', d: ARM },
  { id: 'upper-back', d: path([[80, 74], [74, 86], [66, 94], [64, 112], [68, 140], [72, 160], [100, 164], [128, 160], [132, 140], [136, 112], [134, 94], [126, 86], [120, 74]]) },
  { id: 'lower-back', d: path([[72, 160], [100, 164], [128, 160], [128, 176], [132, 192], [100, 196], [68, 192], [72, 176]]) },
  { id: 'glutes', d: path([[68, 192], [100, 196], [132, 192], [140, 214], [137, 236], [100, 240], [63, 236], [60, 214]]) },
  { id: 'back-thigh', d: both([[63, 236], [100, 240], [98, 255], [94, 285], [90, 312], [66, 312], [60, 285], [57, 250]]) },
  { id: 'calves', d: LOWER_LEG },
];

// Parts of the outline that are not regions: knees, hands, feet.
const EXTRAS =
  both([[66, 312], [90, 312], [89, 330], [67, 330]]) +
  both([[74, 385], [86, 385], [89, 398], [70, 400], [67, 394]]) +
  both([[38, 230], [46, 232], [47, 246], [43, 258], [36, 256], [34, 244]]);

function head(view: MapView): string {
  const skin = '<ellipse class="map-skin" cx="100" cy="36" rx="16.5" ry="20.5"/>';
  if (view === 'back') {
    return skin + '<path class="map-hair" d="M83 34C82 18 92 13 100 13C108 13 118 18 117 34C117 44 113 51 108 54L92 54C87 51 83 44 83 34Z"/>';
  }
  return (
    skin +
    '<path class="map-hair" d="M83.5 33C82 18 92 13.5 100 13.5C108 13.5 118 18 116.5 33C114 26 108 23 100 23C92 23 86 26 83.5 33Z"/>' +
    '<circle class="map-eye" cx="93.5" cy="37" r="1.7"/><circle class="map-eye" cx="106.5" cy="37" r="1.7"/>'
  );
}

/** Region shapes for one side of the map. */
export const regionShapes = (view: MapView): RegionShape[] => (view === 'front' ? FRONT : BACK);

/** The interactive body map. Regions carry data-region; the selected one gets the "sel" class. */
export function bodyMapSvg(view: MapView, selected: string | undefined, label: (regionId: string) => string, aria: string): string {
  const regions = regionShapes(view)
    .map(
      (r) =>
        `<path class="map-region${r.id === selected ? ' sel' : ''}" data-region="${r.id}" role="button" tabindex="0" aria-label="${label(r.id)}" aria-pressed="${r.id === selected}" d="${r.d}"/>`,
    )
    .join('');
  return `<svg class="bodymap" viewBox="0 0 200 412" role="group" aria-label="${aria}">${head(view)}<path class="map-extra" d="${EXTRAS}"/>${regions}</svg>`;
}

// ---------- muscle location pictures ----------

interface MuscleShape {
  /** One side of the body; mirrored automatically. */
  pts: P[];
}

const MUSCLES: Record<string, MuscleShape[]> = {
  // back
  'upper-trapezius': [{ pts: [[93, 56], [100, 55], [100, 90], [84, 80], [66, 77], [80, 72], [91, 66]] }],
  'levator-scapulae': [{ pts: [[92, 58], [96, 60], [86, 90], [80, 88]] }],
  'posterior-deltoid': [{ pts: [[66, 77], [56, 83], [52, 95], [54, 106], [62, 100], [68, 90], [72, 82]] }],
  'rotator-cuff': [{ pts: [[70, 90], [88, 92], [90, 112], [80, 122], [68, 114]] }],
  triceps: [{ pts: [[52, 108], [60, 106], [60, 130], [56, 152], [47, 150], [48, 128]] }],
  'latissimus-dorsi': [{ pts: [[66, 112], [84, 124], [98, 150], [98, 186], [84, 180], [72, 160]] }],
  rhomboids: [{ pts: [[98, 82], [98, 118], [88, 112], [84, 90]] }],
  'erector-spinae': [{ pts: [[91, 100], [98, 100], [98, 196], [90, 194], [89, 150]] }],
  'quadratus-lumborum': [{ pts: [[78, 164], [89, 166], [89, 190], [74, 188]] }],
  'gluteus-maximus': [{ pts: [[70, 204], [98, 200], [98, 238], [72, 238], [62, 222]] }],
  'gluteus-medius': [{ pts: [[62, 196], [84, 194], [80, 208], [62, 212]] }],
  piriformis: [{ pts: [[74, 212], [96, 208], [96, 215], [74, 220]] }],
  hamstrings: [{ pts: [[64, 242], [96, 244], [92, 306], [70, 306], [60, 280]] }],
  gastrocnemius: [{ pts: [[68, 332], [89, 332], [88, 356], [70, 356]] }],
  soleus: [{ pts: [[70, 356], [88, 356], [85, 382], [75, 382]] }],
  // front
  scalenes: [{ pts: [[88, 58], [93, 58], [90, 74], [82, 74]] }],
  'anterior-deltoid': [{ pts: [[72, 78], [66, 77], [56, 83], [52, 95], [54, 106], [62, 100], [68, 90]] }],
  'pectoralis-major': [{ pts: [[98, 80], [98, 126], [80, 128], [66, 112], [67, 96], [76, 84]] }],
  biceps: [{ pts: [[53, 110], [62, 108], [62, 130], [58, 152], [48, 150], [49, 128]] }],
  'forearm-flexors': [{ pts: [[48, 158], [57, 160], [52, 198], [47, 228], [40, 226], [42, 196]] }],
  abdominals: [{ pts: [[90, 132], [100, 132], [100, 192], [90, 190]] }],
  obliques: [{ pts: [[72, 134], [88, 136], [88, 186], [70, 184], [73, 160]] }],
  iliopsoas: [{ pts: [[84, 186], [94, 192], [94, 232], [86, 226]] }],
  tfl: [{ pts: [[60, 200], [70, 198], [68, 224], [63, 300], [59, 300], [58, 226]] }],
  quadriceps: [{ pts: [[62, 222], [86, 228], [86, 290], [82, 308], [68, 308], [59, 280]] }],
  adductors: [{ pts: [[88, 228], [99, 228], [96, 275], [90, 298], [88, 262]] }],
};

/**
 * Small picture showing where a muscle is: the body outline, zoomed to the
 * muscle's area, with the muscle in red.
 */
export function muscleThumbSvg(muscleId: string, view: MapView, aria = ''): string {
  const shapes = MUSCLES[muscleId] ?? [];
  const all = shapes.flatMap((s) => [...s.pts, ...mirror(s.pts)]);
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const cy = all.length ? (Math.min(...ys) + Math.max(...ys)) / 2 : 200;
  // A square window centred on the body, tall enough for the muscle with some context.
  const size = Math.max(110, all.length ? Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) + 56 : 400);
  const y0 = Math.max(4, Math.min(412 - size, cy - size / 2));
  const body = regionShapes(view)
    .map((r) => `<path class="map-thumb-body" d="${r.d}"/>`)
    .join('');
  const muscle = shapes.map((s) => `<path class="map-muscle" d="${both(s.pts)}"/>`).join('');
  return `<svg class="muscle-thumb" viewBox="${100 - size / 2} ${y0} ${size} ${size}" ${aria ? `role="img" aria-label="${aria}"` : 'aria-hidden="true"'}>${head(view)}<path class="map-thumb-body" d="${EXTRAS}"/>${body}${muscle}</svg>`;
}

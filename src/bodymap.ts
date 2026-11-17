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
  /** Set when the area is one muscle group (tapping opens that group) rather than a whole region. */
  group?: string;
  /** Drawn as part of the body but not tappable (like knees and hands). */
  inert?: boolean;
}

// Shared between front and back.
const NECK = path([[92, 54], [108, 54], [109, 66], [120, 74], [80, 74], [91, 66]]);
const SHOULDER = both([[80, 74], [66, 76], [56, 82], [51, 94], [52, 108], [60, 104], [66, 94], [74, 86]]);
const ARM = both([[52, 108], [60, 104], [64, 112], [63, 128], [58, 150], [55, 172], [50, 200], [46, 232], [38, 230], [40, 198], [43, 170], [46, 140]]);
const LOWER_LEG = both([[67, 330], [89, 330], [90, 350], [86, 385], [74, 385], [66, 352]]);

/**
 * Thigh, left leg as drawn (the person's right leg on the front view); mirrored
 * for the other leg. The three front areas and the back area tile the old thigh
 * outline exactly, so nothing overlaps and nothing is left over, except the
 * medial strip on the back (see below).
 *
 * Units: 1 unit is roughly 0.4 cm (thigh length about 106 units for about 42 cm).
 * Boundaries follow surface landmarks, approximately:
 *  - Lateral thigh (front): tensor fasciae latae, a belly about 12 units wide just
 *    below the hip bone, narrowing into the iliotibial band, a strip about 7 units
 *    wide down the outer thigh. The band lies over vastus lateralis.
 *    Sartorius is NOT drawn: it crosses diagonally over the quadriceps, so a
 *    separate area would split the quadriceps. It is on the Lateral thigh group page.
 *  - Adductors (front): the surface-visible adductors only. Adductor longus is a
 *    triangular belly (about 14 units wide at the top, the medial border of the
 *    femoral triangle); gracilis is the most superficial and most medial adductor
 *    and runs the full length of the thigh to the medial tibia, so the area ends as
 *    a thin strip (about 4 units) along the inner edge down to the knee.
 *    Adductor brevis and most of adductor magnus lie deep to these, and pectineus
 *    is the floor of the femoral triangle, so none of them is drawn: they are on
 *    the group page. Vastus medialis (quadriceps) lies lateral to the strip.
 *  - Quadriceps (front): the rest of the front of the thigh, down to the knee.
 *    Rectus femoris, vastus lateralis and vastus medialis show on the surface;
 *    vastus intermedius lies underneath them.
 *  - Hamstrings (back): from the gluteal fold to the knee. The medial strip beside
 *    them (gracilis and the upper adductor magnus) is deliberately not tappable:
 *    its edge with semitendinosus is not clear on a flat figure, and the data lists
 *    Adductors as a front-view group. Adductors stays one tap away in the chips.
 *  - The iliotibial band is not drawn on the back: only its edge is visible there.
 *  - Hip flexors (iliacus, psoas) are deep and have no area; they are in the chips.
 */
const THIGH_FRONT_OUTLINE: P[] = [[62, 206], [78, 218], [86, 224], [100, 226], [98, 250], [94, 285], [90, 312], [66, 312], [60, 285], [57, 245], [58, 220]];
const THIGH_LATERAL: P[] = [[62, 206], [72, 213.5], [70, 225], [68, 240], [64.5, 255], [66, 285], [71, 312], [66, 312], [60, 285], [57, 245], [58, 220]];
const THIGH_QUADRICEPS: P[] = [[72, 213.5], [78, 218], [86, 224], [87, 238], [88.8, 252], [89.8, 266], [90.2, 280], [88.4, 296], [86, 312], [71, 312], [66, 285], [64.5, 255], [68, 240], [70, 225]];
const THIGH_ADDUCTORS: P[] = [[86, 224], [100, 226], [98, 250], [94, 285], [90, 312], [86, 312], [88.4, 296], [90.2, 280], [89.8, 266], [88.8, 252], [87, 238]];
const THIGH_BACK_OUTLINE: P[] = [[63, 236], [100, 240], [98, 255], [94, 285], [90, 312], [66, 312], [60, 285], [57, 250]];
const THIGH_HAMSTRINGS: P[] = [[63, 236], [95, 239.46], [92.5, 255], [90.5, 270], [90, 285], [90, 298], [90, 312], [66, 312], [60, 285], [57, 250]];
const THIGH_BACK_MEDIAL_STRIP: P[] = [[95, 239.46], [100, 240], [98, 255], [94, 285], [90, 312], [90, 298], [90, 285], [90.5, 270], [92.5, 255]];

/** Exposed so the map's geometry can be checked (tiling, sizes) without rendering. */
export const THIGH_GEOMETRY = {
  frontOutline: THIGH_FRONT_OUTLINE,
  backOutline: THIGH_BACK_OUTLINE,
  front: { 'lateral-thigh': THIGH_LATERAL, quadriceps: THIGH_QUADRICEPS, adductors: THIGH_ADDUCTORS },
  back: { hamstrings: THIGH_HAMSTRINGS },
  backMedialStrip: THIGH_BACK_MEDIAL_STRIP,
};

const FRONT: RegionShape[] = [
  { id: 'neck', d: NECK },
  { id: 'shoulders', d: SHOULDER },
  { id: 'arms', d: ARM },
  { id: 'chest', d: path([[80, 74], [74, 86], [66, 94], [64, 112], [70, 128], [100, 132], [130, 128], [136, 112], [134, 94], [126, 86], [120, 74]]) },
  { id: 'core', d: path([[70, 128], [100, 132], [130, 128], [129, 150], [128, 172], [132, 188], [100, 194], [68, 188], [72, 172], [71, 150]]) },
  { id: 'hips', d: path([[68, 188], [100, 194], [132, 188], [138, 206], [122, 218], [100, 226], [78, 218], [62, 206]]) },
  { id: 'lateral-thigh', group: 'lateral-thigh', d: both(THIGH_LATERAL) },
  { id: 'quadriceps', group: 'quadriceps', d: both(THIGH_QUADRICEPS) },
  { id: 'adductors', group: 'adductors', d: both(THIGH_ADDUCTORS) },
  { id: 'calves', d: LOWER_LEG },
];

const BACK: RegionShape[] = [
  { id: 'neck', d: NECK },
  { id: 'shoulders', d: SHOULDER },
  { id: 'arms', d: ARM },
  { id: 'upper-back', d: path([[80, 74], [74, 86], [66, 94], [64, 112], [68, 140], [72, 160], [100, 164], [128, 160], [132, 140], [136, 112], [134, 94], [126, 86], [120, 74]]) },
  { id: 'lower-back', d: path([[72, 160], [100, 164], [128, 160], [128, 176], [132, 192], [100, 196], [68, 192], [72, 176]]) },
  { id: 'glutes', d: path([[68, 192], [100, 196], [132, 192], [140, 214], [137, 236], [100, 240], [63, 236], [60, 214]]) },
  { id: 'hamstrings', group: 'hamstrings', d: both(THIGH_HAMSTRINGS) },
  { id: 'thigh-medial-back', inert: true, d: both(THIGH_BACK_MEDIAL_STRIP) },
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

/**
 * The map is drawn in finer areas than the muscles.json regions (e.g. three
 * thigh areas, upper and lower back). Each area opens one region.
 */
const AREA_REGION: Record<string, string> = {
  neck: 'neck',
  shoulders: 'shoulder',
  arms: 'arm',
  chest: 'chest',
  core: 'core',
  'upper-back': 'back',
  'lower-back': 'back',
  hips: 'hip',
  glutes: 'hip',
  'lateral-thigh': 'thigh',
  quadriceps: 'thigh',
  adductors: 'thigh',
  hamstrings: 'thigh',
  calves: 'lower-leg',
};

/** Which muscles.json region a map area opens. */
export const regionOfArea = (areaId: string): string => AREA_REGION[areaId] ?? areaId;

/** Sides of the body map on which a region has a tappable area. */
export const regionViews = (regionId: string): MapView[] =>
  (['front', 'back'] as MapView[]).filter((v) => regionShapes(v).some((r) => !r.inert && regionOfArea(r.id) === regionId));

/**
 * Groups offered as chips under the map, for groups that are small, deep or
 * partly hidden on that side. (Thigh pilot: other regions still open by region.)
 */
export const groupChips = (view: MapView): string[] =>
  view === 'front' ? ['quadriceps', 'adductors', 'lateral-thigh', 'hip-flexors'] : ['hamstrings', 'adductors', 'lateral-thigh'];

/** The interactive body map. Areas carry data-region (a muscles.json region id) or data-group (a muscle group id); the selected region's areas get the "sel" class. */
export function bodyMapSvg(
  view: MapView,
  selected: string | undefined,
  label: (regionId: string) => string,
  aria: string,
  groupLabel: (groupId: string) => string,
): string {
  const areas = regionShapes(view)
    .map((r) => {
      if (r.inert) return `<path class="map-extra" aria-hidden="true" d="${r.d}"/>`;
      const region = regionOfArea(r.id);
      const sel = region === selected;
      const target = r.group ? `data-group="${r.group}"` : `data-region="${region}"`;
      const name = r.group ? groupLabel(r.group) : label(region);
      return `<path class="map-region${sel ? ' sel' : ''}" ${target} role="button" tabindex="0" aria-label="${name}" d="${r.d}"/>`;
    })
    .join('');
  // Cropped to the body so the map can be drawn large on a phone.
  return `<svg class="bodymap" viewBox="28 8 144 396" role="group" aria-label="${aria}">${head(view)}<path class="map-extra" d="${EXTRAS}"/>${areas}</svg>`;
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

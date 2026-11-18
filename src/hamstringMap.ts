/**
 * Hamstrings pilot: a schematic, original drawing of the BACK of the RIGHT thigh
 * with the three hamstring muscles as separate tappable shapes.
 *
 * Orientation (posterior view of the right leg): the viewer's left is medial
 * (towards the midline), the viewer's right is lateral (outer side).
 *
 * What the shapes represent (simplified, not to scale):
 *  - Biceps femoris: the lateral hamstring. Long head starts at the ischial
 *    tuberosity (sit bone), runs obliquely outwards and ends on the fibular
 *    head (outer side below the knee). The short head is deeper and is not drawn
 *    separately.
 *  - Semitendinosus: superficial, medial-central. Starts at the same sit bone, has
 *    a muscle belly in the upper half and a long thin tendon in the lower half that
 *    ends on the inner side of the shin below the knee.
 *  - Semimembranosus: medial and DEEPER, partly under the semitendinosus. Only its
 *    medial part is visible from behind, so it is drawn first and the
 *    semitendinosus overlaps it. Ends on the back-inner side of the shin bone.
 * The gap between the lateral and medial tendons above the knee is the upper
 * border of the popliteal fossa (the hollow behind the knee).
 */
import { getMuscle } from './data';
import { loc, t } from './i18n';

type P = [number, number];

/** Closed smooth curve through the points (Catmull-Rom converted to cubic Béziers). */
function smooth(pts: P[]): string {
  const n = pts.length;
  const at = (i: number): P => pts[(i + n) % n];
  let d = `M${at(0)[0]} ${at(0)[1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d + 'Z';
}

const THIGH = smooth([
  [100, 36], [103, 120], [108, 200], [113, 260], [120, 322], [124, 372],
  [200, 372], [206, 322], [213, 260], [219, 200], [222, 120], [224, 38],
]);

interface HamMuscle {
  id: string;
  d: string;
  /** Where the label line ends, inside the muscle's visible area. */
  dot: P;
  /** Label position: x, y and which way the text runs from x. */
  label: { x: number; y: number; anchor: 'start' | 'middle' | 'end' };
}

/** Drawing order matters: semimembranosus (deeper) first, semitendinosus over it. */
export const HAMSTRING_MUSCLES: HamMuscle[] = [
  {
    id: 'semimembranosus',
    d: smooth([
      [114, 50], [132, 42], [146, 48], [154, 110], [158, 180], [155, 240], [150, 290], [142, 330], [138, 348],
      [130, 348], [124, 330], [128, 290], [126, 250], [121, 200], [116, 150], [113, 100],
    ]),
    dot: [132, 230],
    label: { x: 98, y: 234, anchor: 'end' },
  },
  {
    id: 'semitendinosus',
    d: smooth([
      [128, 48], [142, 43], [154, 50], [162, 110], [165, 170], [160, 215], [156, 260], [152, 310], [147, 346],
      [140, 346], [142, 300], [145, 255], [144, 215], [138, 170], [131, 110], [126, 70],
    ]),
    dot: [138, 92],
    label: { x: 138, y: 22, anchor: 'middle' },
  },
  {
    id: 'biceps-femoris',
    d: smooth([
      [152, 50], [160, 45], [182, 90], [198, 140], [208, 200], [211, 260], [209, 305], [203, 332], [198, 344],
      [190, 344], [188, 320], [181, 285], [172, 240], [168, 190], [166, 140], [162, 92], [156, 64],
    ]),
    dot: [190, 200],
    label: { x: 236, y: 204, anchor: 'start' },
  },
];

export const HAMSTRING_IDS = HAMSTRING_MUSCLES.map((m) => m.id);

/** "Biceps femoris (long / short head)" → "Biceps femoris". Label text only. */
const shortName = (id: string): string => {
  const m = getMuscle(id);
  return m ? loc(m.name).replace(/\s*[（(].*$/, '').trim() : id;
};

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** The picture. `selected` is a muscle id or undefined. Tapping a shape is handled in main.ts via data-pick-muscle. */
export function hamstringMapSvg(selected?: string): string {
  const shapes = HAMSTRING_MUSCLES.map((m) => {
    const name = getMuscle(m.id) ? loc(getMuscle(m.id)!.name) : m.id;
    const on = m.id === selected;
    return `<path class="ham-muscle" data-pick-muscle="${m.id}" data-m="${m.id}" d="${m.d}" role="button" tabindex="0" aria-pressed="${on}" aria-label="${esc(name)}"${on ? ' data-on="true"' : ''}/>`;
  }).join('');

  const labels = HAMSTRING_MUSCLES.map((m) => {
    const lineFrom: P = m.label.anchor === 'middle' ? [m.label.x, m.label.y + 5] : [m.label.anchor === 'end' ? m.label.x + 4 : m.label.x - 4, m.label.y - 4];
    return `<g class="ham-label" aria-hidden="true">
      <line x1="${lineFrom[0]}" y1="${lineFrom[1]}" x2="${m.dot[0]}" y2="${m.dot[1]}"/>
      <circle cx="${m.dot[0]}" cy="${m.dot[1]}" r="3"/>
      <text x="${m.label.x}" y="${m.label.y}" text-anchor="${m.label.anchor}">${esc(shortName(m.id))}</text>
    </g>`;
  }).join('');

  return `<svg class="ham-map" viewBox="-16 0 352 392" role="group" aria-label="${esc(t('hamMapAria'))}"${selected ? ' data-has-selection="true"' : ''}>
    <path class="ham-thigh" d="${THIGH}"/>
    ${shapes}
    ${labels}
    <text class="ham-side" x="-10" y="14" text-anchor="start" aria-hidden="true">${esc(t('hamMedial'))}</text>
    <text class="ham-side" x="330" y="14" text-anchor="end" aria-hidden="true">${esc(t('hamLateral'))}</text>
  </svg>`;
}

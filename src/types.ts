/** Text in both languages. "zh" is Traditional Chinese (Hong Kong). */
export interface Localized {
  en: string;
  zh: string;
}

/** How the stretch is done. */
export type StretchType = 'solo' | 'partner' | 'equipment';

export type MapView = 'front' | 'back';

/** A tappable area of the body map, e.g. "neck". */
export interface Region {
  id: string;
  name: Localized;
  /** Which side(s) of the body map show this region. */
  views: MapView[];
}

export interface Muscle {
  id: string;
  /** Region id this muscle is listed under. */
  region: string;
  /** Side of the body map used for its location thumbnail. */
  view: MapView;
  name: Localized;
  /** Plain-language description of where the muscle is. */
  where: Localized;
}

export interface Stretch {
  /** Unique, URL-safe id, e.g. "neck-side-bend". Favourites are stored by this id. */
  id: string;
  name: Localized;
  type: StretchType;
  /** One-line description shown in lists. */
  summary: Localized;
  /** Seconds to hold; defaults to "defaults.holdSeconds" (30). */
  holdSeconds?: number;
  /** Number of sets; defaults to "defaults.sets" (2). */
  sets?: number;
  /** True if the stretch is done on one side, then repeated on the other (each side is timed separately). */
  perSide: boolean;
  /** Muscle ids. A stretch is listed under each of its primary muscles. */
  muscles: { primary: string[]; secondary: string[] };
  /** Items needed (only for type "equipment"). */
  equipment?: Localized[];
  steps: Localized[];
  safety: Localized[];
}

export interface StretchData {
  defaults: { holdSeconds: number; sets: number };
  regions: Region[];
  muscles: Muscle[];
  stretches: Stretch[];
}

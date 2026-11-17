/** Text in both languages. "zh" is Traditional Chinese (Hong Kong). */
export interface Localized {
  en: string;
  zh: string;
}

/** How the stretch is done by the user: alone, with a partner, or with equipment. */
export type StretchType = 'solo' | 'partner' | 'equipment';

/** Stretching method. */
export type Technique = 'static' | 'dynamic' | 'pnf';

export type MapView = 'front' | 'back';

/** Top level, e.g. "thigh". Also what a tappable area of the body map opens. */
export interface Region {
  id: string;
  name: Localized;
  /** Which side(s) of the body map show this region (derived from the map shapes). */
  views: MapView[];
}

/** Second level, e.g. "hamstrings". */
export interface MuscleGroup {
  id: string;
  name: Localized;
  region: string;
  /** Which side(s) of the full-body muscle map show this group (not used by the list UI yet). */
  mapViews: MapView[];
  /** Another group this one is reached through on the muscle map (not used by the list UI yet). */
  alsoVia?: string;
}

/** Third level, e.g. "semitendinosus". */
export interface Muscle {
  id: string;
  name: Localized;
  group: string;
  /** Where the muscle sits, in plain words. Only some muscles have it. */
  location?: Localized;
}

export interface Stretch {
  /** Unique, URL-safe id, e.g. "neck-side-bend". Favourites are stored by this id. */
  id: string;
  name: Localized;
  /** One-line description shown in lists. */
  summary: Localized;
  technique: Technique;
  /** Solo, partner or needs equipment (used by the list filter). */
  mode: StretchType;
  position: 'standing' | 'sitting' | 'lying' | 'kneeling';
  /** True if the stretch is done on one side, then repeated on the other (each side is timed separately). */
  perSide: boolean;
  holdSeconds: number;
  sets: number;
  /** Muscle ids or muscle-group ids. A group id stands for every muscle in that group. */
  primary: string[];
  secondary: string[];
  /** Items needed (only for mode "equipment"). */
  equipment?: Localized[];
  steps: Localized[];
  /** Where you should feel the stretch. */
  feel: Localized;
  mistakes: Localized[];
  /** Cautions. */
  safety: Localized[];
  easier: Localized;
  harder: Localized;
  /** Image path relative to the site root, or null when there is no image yet. */
  image: string | null;
}

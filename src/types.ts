/** Body part IDs. Add a new one here AND in stretches.json "bodyParts". */
export type BodyPartId =
  | 'neck'
  | 'shoulders'
  | 'back'
  | 'lower-back'
  | 'hips'
  | 'front-thigh'
  | 'back-thigh'
  | 'calves';

/** Text in both languages. "zh" is Traditional Chinese (Hong Kong). */
export interface Localized {
  en: string;
  zh: string;
}

/** How the stretch is done. */
export type StretchType = 'solo' | 'partner' | 'equipment';

export interface BodyPart {
  id: BodyPartId;
  name: Localized;
  /** A short emoji or symbol shown on the body-part tile. */
  icon: string;
  description: Localized;
}

export interface Stretch {
  /** Unique, URL-safe id, e.g. "neck-side-bend". Favourites are stored by this id. */
  id: string;
  name: Localized;
  bodyPart: BodyPartId;
  type: StretchType;
  /** One-line description shown in lists. */
  summary: Localized;
  /** How long to hold, in seconds. */
  holdSeconds: number;
  /** True if the stretch is done on one side, then repeated on the other. */
  perSide: boolean;
  /** Items needed (only for type "equipment"). */
  equipment?: Localized[];
  steps: Localized[];
  safety: Localized[];
}

export interface StretchData {
  bodyParts: BodyPart[];
  stretches: Stretch[];
}

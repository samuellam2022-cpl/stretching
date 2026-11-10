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

/** How the stretch is done. */
export type StretchType = 'solo' | 'partner' | 'equipment';

export interface BodyPart {
  id: BodyPartId;
  name: string;
  /** A short emoji or symbol shown on the body-part tile. */
  icon: string;
  description: string;
}

export interface Stretch {
  /** Unique, URL-safe id, e.g. "neck-side-bend". Favourites are stored by this id. */
  id: string;
  name: string;
  bodyPart: BodyPartId;
  type: StretchType;
  /** One-line description shown in lists. */
  summary: string;
  /** How long to hold, in seconds. */
  holdSeconds: number;
  /** True if the stretch is done on one side, then repeated on the other. */
  perSide: boolean;
  /** Items needed (only for type "equipment"), e.g. ["Strap or towel"]. */
  equipment?: string[];
  steps: string[];
  safety: string[];
}

export interface StretchData {
  bodyParts: BodyPart[];
  stretches: Stretch[];
}

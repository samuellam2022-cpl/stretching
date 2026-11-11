import raw from './data/stretches.json';
import type { BodyPart, BodyPartId, Localized, Stretch, StretchData, StretchType } from './types';

const TYPES: StretchType[] = ['solo', 'partner', 'equipment'];

const isLocalized = (v: unknown): v is Localized =>
  !!v && typeof (v as Localized).en === 'string' && (v as Localized).en.length > 0;
const allLocalized = (v: unknown): boolean => Array.isArray(v) && v.every(isLocalized);

/**
 * Checks stretches.json when the app loads so typos (a missing field, an
 * unknown body part, a duplicate id) show up clearly in the console instead
 * of breaking the UI.
 */
function validate(data: StretchData): StretchData {
  const partIds = new Set(data.bodyParts.map((p) => p.id));
  const seen = new Set<string>();
  const valid = data.stretches.filter((s) => {
    const problems: string[] = [];
    if (!s.id) problems.push('missing id');
    if (!isLocalized(s.name)) problems.push('name needs { "en": ..., "zh": ... }');
    if (!isLocalized(s.summary)) problems.push('summary needs { "en": ..., "zh": ... }');
    if (seen.has(s.id)) problems.push('duplicate id');
    if (!partIds.has(s.bodyPart)) problems.push(`unknown bodyPart "${s.bodyPart}"`);
    if (!TYPES.includes(s.type)) problems.push(`unknown type "${s.type}"`);
    if (!(s.holdSeconds > 0)) problems.push('holdSeconds must be a positive number');
    if (!allLocalized(s.steps) || s.steps.length === 0) problems.push('needs at least one step, each { "en", "zh" }');
    if (!allLocalized(s.safety)) problems.push('safety must be a list of { "en", "zh" }');
    if (s.equipment && !allLocalized(s.equipment)) problems.push('equipment must be a list of { "en", "zh" }');
    if (s.muscles) {
      const unknown = [...(s.muscles.primary ?? []), ...(s.muscles.secondary ?? [])].filter((m) => !data.muscles?.[m]);
      if (unknown.length) {
        console.warn(`[stretches.json] "${s.id}": unknown muscle id(s) ${unknown.join(', ')} – add them to "muscles"`);
        s.muscles = {
          primary: (s.muscles.primary ?? []).filter((m) => data.muscles?.[m]),
          secondary: (s.muscles.secondary ?? []).filter((m) => data.muscles?.[m]),
        };
      }
    }
    if (problems.length) {
      console.warn(`[stretches.json] Skipping "${s.id || s.name?.en}": ${problems.join(', ')}`);
      return false;
    }
    seen.add(s.id);
    return true;
  });
  return { muscles: data.muscles ?? {}, bodyParts: data.bodyParts, stretches: valid };
}

const data = validate(raw as StretchData);

export const bodyParts: BodyPart[] = data.bodyParts;
export const stretches: Stretch[] = data.stretches;

export const muscleName = (id: string): Localized | undefined => data.muscles[id];

export const getBodyPart = (id: string): BodyPart | undefined =>
  bodyParts.find((p) => p.id === id);

export const getStretch = (id: string): Stretch | undefined =>
  stretches.find((s) => s.id === id);

export const stretchesFor = (part: BodyPartId): Stretch[] =>
  stretches.filter((s) => s.bodyPart === part);

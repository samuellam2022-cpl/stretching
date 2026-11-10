import raw from './data/stretches.json';
import type { BodyPart, BodyPartId, Stretch, StretchData, StretchType } from './types';

const TYPES: StretchType[] = ['solo', 'partner', 'equipment'];

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
    if (seen.has(s.id)) problems.push('duplicate id');
    if (!partIds.has(s.bodyPart)) problems.push(`unknown bodyPart "${s.bodyPart}"`);
    if (!TYPES.includes(s.type)) problems.push(`unknown type "${s.type}"`);
    if (!(s.holdSeconds > 0)) problems.push('holdSeconds must be a positive number');
    if (!Array.isArray(s.steps) || s.steps.length === 0) problems.push('needs at least one step');
    if (!Array.isArray(s.safety)) problems.push('safety must be a list');
    if (problems.length) {
      console.warn(`[stretches.json] Skipping "${s.id || s.name}": ${problems.join(', ')}`);
      return false;
    }
    seen.add(s.id);
    return true;
  });
  return { bodyParts: data.bodyParts, stretches: valid };
}

const data = validate(raw as StretchData);

export const bodyParts: BodyPart[] = data.bodyParts;
export const stretches: Stretch[] = data.stretches;

export const getBodyPart = (id: string): BodyPart | undefined =>
  bodyParts.find((p) => p.id === id);

export const getStretch = (id: string): Stretch | undefined =>
  stretches.find((s) => s.id === id);

export const stretchesFor = (part: BodyPartId): Stretch[] =>
  stretches.filter((s) => s.bodyPart === part);

export const TYPE_LABELS: Record<StretchType, string> = {
  solo: 'Solo',
  partner: 'Partner',
  equipment: 'Needs equipment',
};

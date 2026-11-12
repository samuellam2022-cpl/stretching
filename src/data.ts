import raw from './data/stretches.json';
import type { Localized, Muscle, Region, Stretch, StretchData, StretchType } from './types';

const TYPES: StretchType[] = ['solo', 'partner', 'equipment'];

const isLocalized = (v: unknown): v is Localized =>
  !!v && typeof (v as Localized).en === 'string' && (v as Localized).en.length > 0;
const allLocalized = (v: unknown): boolean => Array.isArray(v) && v.every(isLocalized);

/**
 * Checks stretches.json when the app loads so typos (a missing field, an
 * unknown muscle, a duplicate id) show up clearly in the console instead of
 * breaking the UI.
 */
function validate(data: StretchData): StretchData {
  const muscleIds = new Set(data.muscles.map((m) => m.id));
  const regionIds = new Set(data.regions.map((r) => r.id));
  for (const m of data.muscles) {
    if (!regionIds.has(m.region)) console.warn(`[stretches.json] muscle "${m.id}": unknown region "${m.region}"`);
  }
  const seen = new Set<string>();
  const valid = data.stretches.filter((s) => {
    const problems: string[] = [];
    if (!s.id) problems.push('missing id');
    if (!isLocalized(s.name)) problems.push('name needs { "en": ..., "zh": ... }');
    if (!isLocalized(s.summary)) problems.push('summary needs { "en": ..., "zh": ... }');
    if (seen.has(s.id)) problems.push('duplicate id');
    if (!TYPES.includes(s.type)) problems.push(`unknown type "${s.type}"`);
    if (s.holdSeconds !== undefined && !(s.holdSeconds > 0)) problems.push('holdSeconds must be a positive number');
    if (!allLocalized(s.steps) || s.steps.length === 0) problems.push('needs at least one step, each { "en", "zh" }');
    if (!allLocalized(s.safety)) problems.push('safety must be a list of { "en", "zh" }');
    if (s.equipment && !allLocalized(s.equipment)) problems.push('equipment must be a list of { "en", "zh" }');
    const primary = (s.muscles?.primary ?? []).filter((m) => muscleIds.has(m));
    const secondary = (s.muscles?.secondary ?? []).filter((m) => muscleIds.has(m));
    const unknown = [...(s.muscles?.primary ?? []), ...(s.muscles?.secondary ?? [])].filter((m) => !muscleIds.has(m));
    if (unknown.length) console.warn(`[stretches.json] "${s.id}": unknown muscle id(s) ${unknown.join(', ')}`);
    if (!primary.length) problems.push('needs at least one known primary muscle');
    if (problems.length) {
      console.warn(`[stretches.json] Skipping "${s.id || s.name?.en}": ${problems.join(', ')}`);
      return false;
    }
    s.muscles = { primary, secondary };
    seen.add(s.id);
    return true;
  });
  return { ...data, stretches: valid };
}

const data = validate(raw as StretchData);

export const regions: Region[] = data.regions;
export const muscles: Muscle[] = data.muscles;
export const stretches: Stretch[] = data.stretches;

export const getRegion = (id: string): Region | undefined => regions.find((r) => r.id === id);
export const getMuscle = (id: string): Muscle | undefined => muscles.find((m) => m.id === id);
export const getStretch = (id: string): Stretch | undefined => stretches.find((s) => s.id === id);

export const musclesIn = (regionId: string): Muscle[] => muscles.filter((m) => m.region === regionId);

/** Stretches that have this muscle as a primary muscle. */
export const stretchesFor = (muscleId: string): Stretch[] => stretches.filter((s) => s.muscles.primary.includes(muscleId));

export const holdSeconds = (s: Stretch): number => s.holdSeconds ?? data.defaults.holdSeconds;
export const setsOf = (s: Stretch): number => s.sets ?? data.defaults.sets;

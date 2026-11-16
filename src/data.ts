// Reads the three-level muscle data (data/muscles.json: region → group → muscle)
// and the stretches (data/stretches.json).
import { regionViews } from './bodymap';
import musclesRaw from './data/muscles.json';
import stretchesRaw from './data/stretches.json';
import type { Localized, Muscle, MuscleGroup, MapView, Region, Stretch, StretchType, Technique } from './types';

interface RawNamed {
  id: string;
  zh: string;
  en: string;
}
interface RawMuscles {
  regions: RawNamed[];
  groups: (RawNamed & { region: string; mapViews: MapView[]; alsoVia?: string })[];
  muscles: (RawNamed & { group: string })[];
}

const MODES: StretchType[] = ['solo', 'partner', 'equipment'];
const TECHNIQUES: Technique[] = ['static', 'dynamic', 'pnf'];

const isLocalized = (v: unknown): v is Localized =>
  !!v && typeof (v as Localized).en === 'string' && (v as Localized).en.length > 0;
const allLocalized = (v: unknown): boolean => Array.isArray(v) && v.every(isLocalized);
const name = (n: RawNamed): Localized => ({ en: n.en, zh: n.zh });

const rawMuscles = musclesRaw as RawMuscles;

export const regions: Region[] = rawMuscles.regions.map((r) => ({ id: r.id, name: name(r), views: regionViews(r.id) }));
export const groups: MuscleGroup[] = rawMuscles.groups.map((g) => ({
  id: g.id,
  name: name(g),
  region: g.region,
  mapViews: g.mapViews,
  alsoVia: g.alsoVia,
}));
export const muscles: Muscle[] = rawMuscles.muscles.map((m) => ({ id: m.id, name: name(m), group: m.group }));

const regionIds = new Set(regions.map((r) => r.id));
const groupIds = new Set(groups.map((g) => g.id));
const muscleIds = new Set(muscles.map((m) => m.id));

for (const g of groups) if (!regionIds.has(g.region)) console.warn(`[muscles.json] group "${g.id}": unknown region "${g.region}"`);
for (const m of muscles) if (!groupIds.has(m.group)) console.warn(`[muscles.json] muscle "${m.id}": unknown group "${m.group}"`);

/**
 * Checks stretches.json when the app loads so typos (a missing field, an
 * unknown muscle, a duplicate id) show up clearly in the console instead of
 * breaking the UI.
 */
function validate(list: Stretch[]): Stretch[] {
  const seen = new Set<string>();
  const known = (id: string): boolean => muscleIds.has(id) || groupIds.has(id);
  return list.filter((s) => {
    const problems: string[] = [];
    if (!s.id) problems.push('missing id');
    if (!isLocalized(s.name)) problems.push('name needs { "en": ..., "zh": ... }');
    if (!isLocalized(s.summary)) problems.push('summary needs { "en": ..., "zh": ... }');
    if (seen.has(s.id)) problems.push('duplicate id');
    if (!MODES.includes(s.mode)) problems.push(`unknown mode "${s.mode}"`);
    if (!TECHNIQUES.includes(s.technique)) problems.push(`unknown technique "${s.technique}"`);
    if (!(s.holdSeconds > 0)) problems.push('holdSeconds must be a positive number');
    if (!(s.sets > 0)) problems.push('sets must be a positive number');
    if (!allLocalized(s.steps) || s.steps.length === 0) problems.push('needs at least one step, each { "en", "zh" }');
    if (!allLocalized(s.mistakes ?? [])) problems.push('mistakes must be a list of { "en", "zh" }');
    if (!allLocalized(s.safety ?? [])) problems.push('safety must be a list of { "en", "zh" }');
    if (s.equipment && !allLocalized(s.equipment)) problems.push('equipment must be a list of { "en", "zh" }');
    if (s.feel && !isLocalized(s.feel)) problems.push('feel needs { "en", "zh" }');
    if (s.easier && !isLocalized(s.easier)) problems.push('easier needs { "en", "zh" }');
    if (s.harder && !isLocalized(s.harder)) problems.push('harder needs { "en", "zh" }');
    const unknown = [...(s.primary ?? []), ...(s.secondary ?? [])].filter((id) => !known(id));
    if (unknown.length) console.warn(`[stretches.json] "${s.id}": unknown muscle or group id(s) ${unknown.join(', ')}`);
    s.primary = (s.primary ?? []).filter(known);
    s.secondary = (s.secondary ?? []).filter(known);
    if (!s.primary.length) problems.push('needs at least one known primary muscle');
    if (problems.length) {
      console.warn(`[stretches.json] Skipping "${s.id || s.name?.en}": ${problems.join(', ')}`);
      return false;
    }
    seen.add(s.id);
    return true;
  });
}

export const stretches: Stretch[] = validate((stretchesRaw as { stretches: Stretch[] }).stretches);

export const getRegion = (id: string): Region | undefined => regions.find((r) => r.id === id);
export const getGroup = (id: string): MuscleGroup | undefined => groups.find((g) => g.id === id);
export const getMuscle = (id: string): Muscle | undefined => muscles.find((m) => m.id === id);
export const getStretch = (id: string): Stretch | undefined => stretches.find((s) => s.id === id);

export const groupsIn = (regionId: string): MuscleGroup[] => groups.filter((g) => g.region === regionId);
export const musclesInGroup = (groupId: string): Muscle[] => muscles.filter((m) => m.group === groupId);
export const musclesInRegion = (regionId: string): Muscle[] => groupsIn(regionId).flatMap((g) => musclesInGroup(g.id));

/**
 * A region has a group level only if it has more than one group. Arm, core and
 * lower leg each hold a single group of the same name, so browsing skips it.
 */
export const hasGroupLevel = (regionId: string): boolean => groupsIn(regionId).length > 1;

/** Name of a muscle or a muscle group (stretches may list either). */
export const nameOf = (id: string): Localized | undefined => (getMuscle(id) ?? getGroup(id))?.name;

/** A muscle id stands for itself; a group id stands for all the muscles in that group. */
const expand = (id: string): string[] => (muscleIds.has(id) ? [id] : musclesInGroup(id).map((m) => m.id));

export interface StretchBuckets {
  /** The muscle is named as a primary target. */
  primary: Stretch[];
  /** The stretch names the muscle's whole group as primary: it works the group, not this muscle alone. */
  wholeGroup: Stretch[];
  /** The muscle is only a secondary target. */
  secondary: Stretch[];
  /** Fallback when nothing is dedicated to the muscle: the group's stretches. */
  coverage: Stretch[];
}

export const bucketTotal = (b: StretchBuckets): number =>
  b.primary.length + b.wholeGroup.length + b.secondary.length + b.coverage.length;

/** Every list is filtered so a stretch appears once, in its strongest role. */
function uniqueIn(buckets: Stretch[][]): Stretch[][] {
  const seen = new Set<string>();
  return buckets.map((list) =>
    list.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    }),
  );
}

/**
 * What to list for one muscle: stretches with it as a primary target, then
 * whole-group stretches, then secondary-only stretches. If none of the first
 * two exist, the group's stretches are added as coverage.
 */
export function stretchesForMuscle(muscleId: string): StretchBuckets {
  const groupId = getMuscle(muscleId)?.group;
  const direct = stretches.filter((s) => s.primary.includes(muscleId));
  const whole = stretches.filter((s) => !!groupId && s.primary.includes(groupId));
  const secondary = stretches.filter((s) => s.secondary.some((id) => expand(id).includes(muscleId)));
  const [primary, wholeGroup, sec] = uniqueIn([direct, whole, secondary]);
  const dedicated = primary.length + wholeGroup.length > 0;
  const shown = new Set([...primary, ...wholeGroup, ...sec].map((s) => s.id));
  const coverage = dedicated || !groupId ? [] : groupStretches(groupId).primary.filter((s) => !shown.has(s.id));
  return { primary, wholeGroup, secondary: sec, coverage };
}

/** What to list for a whole group: stretches with a primary target in it, then secondary-only ones. */
export function groupStretches(groupId: string): { primary: Stretch[]; secondary: Stretch[] } {
  const ids = new Set(musclesInGroup(groupId).map((m) => m.id));
  const hits = (list: string[]) => list.some((id) => expand(id).some((m) => ids.has(m)));
  const [primary, secondary] = uniqueIn([
    stretches.filter((s) => hits(s.primary)),
    stretches.filter((s) => hits(s.secondary)),
  ]);
  return { primary, secondary };
}

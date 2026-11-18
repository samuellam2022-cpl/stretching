import { bodyMapSvg } from './bodymap';
import {
  getGroup,
  getMuscle,
  getRegion,
  getStretch,
  groupsIn,
  hasGroupLevel,
  musclesInGroup,
  musclesInRegion,
  nameOf,
  regions,
  stretches,
  stretchesForMuscle,
  groupStretches,
  bucketTotal,
  type StretchBuckets,
} from './data';
import { favouriteIds, isFavourite } from './favourites';
import { sceneFor } from './figure/scenes';
import { getLang, loc, locOther, t } from './i18n';
import { RING_LENGTH, segmentLabel, segmentsOf } from './timer';
import type { Localized, MapView, Muscle, MuscleGroup, Stretch, StretchType } from './types';

export type Filter = 'all' | StretchType;
export const FILTERS: Filter[] = ['all', 'solo', 'partner', 'equipment'];

/** The old illustrated demos are hidden for now; flip this to bring them back (the code is untouched). */
const SHOW_LEGACY_DEMO = false;

export interface View {
  title: string;
  /** Where the back button goes when there's no in-app history. Undefined = no back button. */
  parent?: string;
  tab: 'browse' | 'favourites';
  html: string;
}

/** Escape text from stretches.json before putting it into HTML. */
export const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const STAR_ON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
const STAR_OFF =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
const CHEVRON =
  '<svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export const starIcon = (on: boolean): string => (on ? STAR_ON : STAR_OFF);
export const favLabel = (on: boolean): string => t(on ? 'removeFav' : 'addFav');

const typeLabel = (type: StretchType): string => t(type);

const doseText = (s: Stretch): string => t(s.perSide ? 'doseEachSide' : 'dose', { s: s.holdSeconds, n: s.sets });

function favButton(s: Stretch, extraClass = ''): string {
  const on = isFavourite(s.id);
  return `<button class="fav-btn ${extraClass}" data-fav="${esc(s.id)}" aria-pressed="${on}"
    aria-label="${favLabel(on)}">${starIcon(on)}</button>`;
}

type Role = 'primary' | 'wholeGroup' | 'secondary';

function stretchCard(s: Stretch, showMuscles = false, role?: Role): string {
  const names = showMuscles
    ? s.primary
        .map((id) => nameOf(id))
        .filter((n): n is Localized => !!n)
        .map((n) => loc(n))
        .join('、')
    : '';
  return `
    <li class="card">
      <a class="card-link" href="#/stretch/${encodeURIComponent(s.id)}">
        <span class="card-title">${esc(loc(s.name))}</span>
        <span class="card-summary">${esc(loc(s.summary))}</span>
        <span class="card-meta">
          <span class="tag tag-${s.mode}">${typeLabel(s.mode)}</span>
          ${role ? `<span class="tag tag-role role-${role}">${t(role === 'wholeGroup' ? 'roleWholeGroup' : role)}</span>` : ''}
          <span class="meta-hold">⏱ ${doseText(s)}</span>
          ${names ? `<span class="meta-part">${esc(names)}</span>` : ''}
        </span>
      </a>
      ${favButton(s)}
    </li>`;
}

/** A muscle row: both names and how many stretches. */
function muscleCard(m: Muscle): string {
  const n = bucketTotal(stretchesForMuscle(m.id));
  return `
    <li class="card muscle-card">
      <a class="card-link muscle-link" href="#/muscle/${m.id}">
        <span class="muscle-text">
          <span class="card-title">${esc(loc(m.name))}</span>
          <span class="muscle-other" lang="${getLang() === 'zh' ? 'en' : 'zh-HK'}">${esc(locOther(m.name))}</span>
          <span class="card-meta"><span class="meta-hold">${t('muscleStretchCount', { n })}</span></span>
        </span>
        ${CHEVRON}
      </a>
    </li>`;
}

/** A muscle-group row: both names, how many muscles and stretches. */
function groupCard(g: MuscleGroup): string {
  const nMuscles = musclesInGroup(g.id).length;
  const gs = groupStretches(g.id);
  const nStretches = gs.primary.length + gs.secondary.length;
  return `
    <li class="card muscle-card">
      <a class="card-link muscle-link" href="#/group/${g.id}">
        <span class="muscle-text">
          <span class="card-title">${esc(loc(g.name))}</span>
          <span class="muscle-other" lang="${getLang() === 'zh' ? 'en' : 'zh-HK'}">${esc(locOther(g.name))}</span>
          <span class="card-meta"><span class="meta-hold">${t('groupMuscleCount', { n: nMuscles })} · ${t('muscleStretchCount', { n: nStretches })}</span></span>
        </span>
        ${CHEVRON}
      </a>
    </li>`;
}

/** Where "back" from a region's lists goes: the body map with that region selected. */
const regionRoute = (regionId: string): string => {
  const r = getRegion(regionId);
  return r?.views.length ? `#/region/${regionId}/${r.views[0]}` : '#/';
};

/** Link to a muscle's stretch list, or to the group's list when a stretch names a whole group. */
const muscleHref = (id: string): string => (getMuscle(id) ? `#/muscle/${id}` : `#/group/${id}`);

const byFilter = (list: Stretch[], filter: Filter): Stretch[] => (filter === 'all' ? list : list.filter((s) => s.mode === filter));

function filterChips(all: Stretch[], filter: Filter): string {
  return FILTERS.map((f) => {
    const count = byFilter(all, f).length;
    const label = f === 'all' ? t('all') : typeLabel(f);
    return `<button class="chip" role="tab" data-filter="${f}" aria-selected="${f === filter}">
      ${label} <span class="chip-count">${count}</span></button>`;
  }).join('');
}

interface Section {
  title: string;
  role?: Role;
  list: Stretch[];
}

/** Stretch sections, each with a heading that says how the muscles are involved. */
function sectionedList(sections: Section[], filter: Filter): string {
  const parts = sections
    .map((sec) => ({ ...sec, list: byFilter(sec.list, filter) }))
    .filter((sec) => sec.list.length)
    .map(
      (sec) => `<h3 class="list-heading">${sec.title}</h3>
      <ul class="cards">${sec.list.map((s) => stretchCard(s, false, sec.role)).join('')}</ul>`,
    );
  if (parts.length) return parts.join('');
  return filter === 'all'
    ? `<p class="empty">${t('emptyAll')}</p>`
    : `<p class="empty">${t('emptyFilter', { type: getLang() === 'en' ? typeLabel(filter).toLowerCase() : typeLabel(filter) })}</p>`;
}

const uniqueCount = (lists: Stretch[][]): Stretch[] => lists.flat();

/** Main screen: the body map (front/back), and below it the muscles of the selected region. */
export function homeView(view: MapView, regionId?: string): View {
  const region = regionId ? getRegion(regionId) : undefined;
  const viewName = t(view === 'front' ? 'front' : 'backView');
  const toggle = (['front', 'back'] as MapView[])
    .map(
      (v) =>
        `<button class="seg-btn" role="tab" data-map-view="${v}" aria-selected="${v === view}">${t(v === 'front' ? 'front' : 'backView')}</button>`,
    )
    .join('');
  const map = bodyMapSvg(view, region?.id, (id) => esc(loc(getRegion(id)!.name)), t('mapAria', { view: viewName }));

  const regionChips = regions
    .map(
      (r) =>
        `<a class="chip region-chip" href="#/region/${r.id}${r.views.includes(view) ? `/${view}` : ''}" ${r.id === region?.id ? 'aria-current="true"' : ''}>${esc(loc(r.name))}</a>`,
    )
    .join('');

  // Regions with several groups list the groups; arm, core and lower leg skip that level.
  const list = region
    ? hasGroupLevel(region.id)
      ? `<section class="region-panel" data-region-panel>
        <h2 class="panel-title">${t('regionGroups', { region: esc(loc(region.name)) })}</h2>
        <ul class="cards">${groupsIn(region.id).map(groupCard).join('')}</ul>
      </section>`
      : `<section class="region-panel" data-region-panel>
        <h2 class="panel-title">${t('regionMuscles', { region: esc(loc(region.name)) })}</h2>
        <ul class="cards">${musclesInRegion(region.id).map(muscleCard).join('')}</ul>
      </section>`
    : '';

  return {
    title: t('appName'),
    tab: 'browse',
    html: `
      <div class="chips region-chips" aria-label="${t('allRegions')}">${regionChips}</div>
      <p class="lead">${t('homeLead')}</p>
      <div class="seg" role="tablist" aria-label="${t('viewToggle')}">${toggle}</div>
      <div class="map-wrap">${map}</div>
      ${list}
      <p class="disclaimer">${t('disclaimer')}</p>`,
  };
}

/** Header block shared by the group and muscle screens. */
function listHead(crumb: string, name: Localized): string {
  return `
      <div class="muscle-head">
        <div>
          <p class="detail-part">${esc(crumb)}</p>
          <h1 class="detail-title">${esc(loc(name))}</h1>
          <p class="muscle-other" lang="${getLang() === 'zh' ? 'en' : 'zh-HK'}">${esc(locOther(name))}</p>
        </div>
      </div>`;
}

/** Group screen: pick a muscle, or just see every stretch for the whole group. */
export function groupView(id: string, filter: Filter): View | null {
  const g = getGroup(id);
  if (!g) return null;
  const region = getRegion(g.region);
  const gs = groupStretches(g.id);
  const all = uniqueCount([gs.primary, gs.secondary]);
  return {
    title: loc(g.name),
    parent: regionRoute(g.region),
    tab: 'browse',
    html: `
      ${listHead(region ? loc(region.name) : '', g.name)}
      <h2 class="panel-title">${t('groupMuscles')}</h2>
      <ul class="cards">${musclesInGroup(g.id).map(muscleCard).join('')}</ul>
      <h2 class="panel-title">${t('groupStretches')}</h2>
      <div class="chips" role="tablist" aria-label="${t('filterLabel')}">${filterChips(all, filter)}</div>
      ${sectionedList(
        [
          { title: t('secPrimaryGroup'), role: 'primary', list: gs.primary },
          { title: t('secSecondaryGroup'), role: 'secondary', list: gs.secondary },
        ],
        filter,
      )}`,
  };
}

/** Last list level: every stretch that has this muscle as a primary muscle. */
export function muscleView(id: string, filter: Filter): View | null {
  const m = getMuscle(id);
  if (!m) return null;
  const group = getGroup(m.group);
  const region = group && getRegion(group.region);
  const b: StretchBuckets = stretchesForMuscle(m.id);
  const all = uniqueCount([b.primary, b.wholeGroup, b.secondary, b.coverage]);
  const crumb = [region && loc(region.name), group && hasGroupLevel(group.region) && loc(group.name)].filter(Boolean).join(' · ');
  return {
    title: loc(m.name),
    parent: group && hasGroupLevel(group.region) ? `#/group/${group.id}` : regionRoute(group?.region ?? ''),
    tab: 'browse',
    html: `
      ${listHead(crumb, m.name)}
      <h2 class="panel-title">${t('stretchesFor')}</h2>
      <div class="chips" role="tablist" aria-label="${t('filterLabel')}">${filterChips(all, filter)}</div>
      ${sectionedList(
        [
          { title: t('secPrimaryMuscle'), role: 'primary', list: b.primary },
          { title: t('secWholeGroup'), role: 'wholeGroup', list: b.wholeGroup },
          { title: t('secSecondaryMuscle'), role: 'secondary', list: b.secondary },
          { title: t('secCoverage'), role: 'wholeGroup', list: b.coverage },
        ],
        filter,
      )}`,
  };
}

/** Bullet list section; empty lists render nothing. */
function listSection(title: string, items: Localized[], cls = ''): string {
  return items.length
    ? `<section class="section ${cls}"><h2>${title}</h2><ul>${items.map((i) => `<li>${esc(loc(i))}</li>`).join('')}</ul></section>`
    : '';
}

/** The picture area. Always reserves its space so the page doesn't jump when images arrive. */
function mediaBlock(s: Stretch): string {
  if (SHOW_LEGACY_DEMO && sceneFor(s.id)) {
    return `<div class="demo" data-demo="${esc(s.id)}"></div>
        <p class="demo-legend">
          <span><span class="demo-swatch swatch-primary" aria-hidden="true"></span>${t('legendPrimary')}</span>
          ${s.secondary.length ? `<span><span class="demo-swatch swatch-secondary" aria-hidden="true"></span>${t('legendSecondary')}</span>` : ''}
        </p>
        <p class="demo-reduced">${t('demoReduced')}</p>`;
  }
  if (s.image) {
    return `<div class="media"><img src="${esc(import.meta.env.BASE_URL + s.image.replace(/^\//, ''))}" alt="${esc(loc(s.name))}" loading="lazy" /></div>`;
  }
  return `<div class="media media-placeholder" role="img" aria-label="${t('imageSoon')}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm0 11l5-5 4 4 3-3 5 5M9 9.5h.01"/></svg>
          <span>${t('imageSoon')}</span>
        </div>`;
}

export function stretchView(id: string): View | null {
  const s = getStretch(id);
  if (!s) return null;
  const first = s.primary[0];
  const hold = s.holdSeconds;
  const sets = s.sets;
  const equipment = s.equipment?.length
    ? `<section class="section"><h2>${t('youNeed')}</h2><ul class="equipment">${s.equipment
        .map((e) => `<li>${esc(loc(e))}</li>`)
        .join('')}</ul></section>`
    : '';

  // Muscle tags link to that muscle's stretch list (or the group's, when the stretch names a whole group).
  const tags = (ids: string[], cls: string) =>
    ids
      .map((mid) => ({ mid, name: nameOf(mid) }))
      .filter((x): x is { mid: string; name: Localized } => !!x.name)
      .map(({ mid, name }) => `<li><a class="muscle ${cls}" href="${muscleHref(mid)}">${esc(loc(name))}${CHEVRON}</a></li>`)
      .join('');
  const primary = tags(s.primary, 'muscle-primary');
  const secondary = tags(s.secondary, 'muscle-secondary');
  const muscleRows =
    `<div class="muscle-row"><span class="muscle-label">${t('primaryMuscles')}</span><ul class="muscle-list">${primary}</ul></div>` +
    (secondary
      ? `<div class="muscle-row"><span class="muscle-label">${t('secondaryMuscles')}</span><ul class="muscle-list">${secondary}</ul></div>`
      : '') +
    `<p class="muscle-hint">${t('muscleTagHint')}</p>`;

  const video = `https://www.youtube.com/results?search_query=${encodeURIComponent(s.name.en)}`;
  const demo = `
      <section class="demo-card">
        ${mediaBlock(s)}
        ${muscleRows}
        <a class="btn-video" href="${video}" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l11-6.5z"/></svg>
          <span>${t('demoVideo')}</span><span class="btn-video-hint">${t('demoVideoHint')}</span>
        </a>
      </section>`;

  const facts = `
      <dl class="facts">
        <div><dt>${t('technique')}</dt><dd>${t(s.technique)}</dd></div>
        <div><dt>${t('holdTime')}</dt><dd>${t('holdSeconds', { s: hold })}</dd></div>
        <div><dt>${t('setsLabel')}</dt><dd>${sets}</dd></div>
        <div><dt>${t('perSideLabel')}</dt><dd>${t(s.perSide ? 'perSideYes' : 'perSideNo')}</dd></div>
      </dl>`;

  const feel = s.feel ? `<section class="section"><h2>${t('feel')}</h2><p class="section-text">${esc(loc(s.feel))}</p></section>` : '';
  const variations =
    s.easier || s.harder
      ? `<section class="section variations">
        ${s.easier ? `<h2>${t('easier')}</h2><p class="section-text">${esc(loc(s.easier))}</p>` : ''}
        ${s.harder ? `<h2>${t('harder')}</h2><p class="section-text">${esc(loc(s.harder))}</p>` : ''}
      </section>`
      : '';

  const segs = segmentsOf({ holdSeconds: hold, sets, perSide: s.perSide });
  const segChips = segs
    .map((sg, i) => `<li><button class="seg-chip" data-seg="${i}" data-state="todo">${segmentLabel(sg)}</button></li>`)
    .join('');

  return {
    title: loc(s.name),
    parent: first ? muscleHref(first) : '#/',
    tab: 'browse',
    html: `
      <div class="detail-head">
        <div>
          <h1 class="detail-title">${esc(loc(s.name))}</h1>
          <span class="tag tag-${s.mode}">${typeLabel(s.mode)}</span>
        </div>
        ${favButton(s, 'fav-btn-lg')}
      </div>
      <p class="lead">${esc(loc(s.summary))}</p>
      ${facts}
      ${demo}

      <section class="timer" data-timer data-kind="idle">
        <div class="timer-top">
          <div class="timer-dial">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle class="timer-track" cx="60" cy="60" r="54" />
              <circle class="timer-ring" data-timer-ring cx="60" cy="60" r="54"
                stroke-dasharray="${RING_LENGTH}" stroke-dashoffset="0" />
            </svg>
            <div class="timer-readout" aria-live="polite">
              <span class="timer-time" data-timer-time>${hold}</span>
              <span class="timer-label" data-timer-label>${t('timerReady')}</span>
            </div>
          </div>
          <div class="timer-info">
            <p class="hold"><strong>${t('hold', { s: hold, n: sets })}</strong>${s.perSide ? `<br><span class="hold-note">${t('sidesSeparate')}</span>` : ''}</p>
            <button class="btn-primary" data-timer-toggle data-running="false">${t('timerStart')}</button>
          </div>
        </div>
        <ol class="seg-chips" aria-label="${t('segments')}">${segChips}</ol>
      </section>

      ${equipment}
      <section class="section">
        <h2>${t('steps')}</h2>
        <ol class="steps">${s.steps.map((st) => `<li>${esc(loc(st))}</li>`).join('')}</ol>
      </section>
      ${feel}
      ${listSection(t('mistakes'), s.mistakes ?? [])}
      ${listSection(t('safety'), s.safety ?? [], 'safety')}
      ${variations}`,
  };
}

export function favouritesView(): View {
  const order = new Map(stretches.map((s, i) => [s.id, i]));
  const favs = favouriteIds()
    .map((id) => getStretch(id))
    .filter((s): s is Stretch => !!s)
    .sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  return {
    title: t('tabFavourites'),
    tab: 'favourites',
    html: favs.length
      ? `<ul class="cards">${favs.map((s) => stretchCard(s, true)).join('')}</ul>`
      : `<div class="empty">
          <div class="empty-star">${STAR_OFF}</div>
          <p>${t('noFavs')}</p>
          <p>${t('noFavsHint')}</p>
          <a class="btn-secondary" href="#/">${t('browse')}</a>
        </div>`,
  };
}

export function notFoundView(): View {
  return {
    title: t('notFound'),
    parent: '#/',
    tab: 'browse',
    html: `<div class="empty"><p>${t('notFoundBody')}</p><a class="btn-secondary" href="#/">${t('goHome')}</a></div>`,
  };
}


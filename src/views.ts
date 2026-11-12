import { bodyMapSvg, muscleThumbSvg } from './bodymap';
import { getMuscle, getRegion, getStretch, holdSeconds, musclesIn, regions, setsOf, stretches, stretchesFor } from './data';
import { favouriteIds, isFavourite } from './favourites';
import { sceneFor } from './figure/scenes';
import { getLang, loc, locOther, t } from './i18n';
import { RING_LENGTH, segmentLabel, segmentsOf } from './timer';
import type { MapView, Muscle, Stretch, StretchType } from './types';

export type Filter = 'all' | StretchType;
export const FILTERS: Filter[] = ['all', 'solo', 'partner', 'equipment'];

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

const doseText = (s: Stretch): string => t(s.perSide ? 'doseEachSide' : 'dose', { s: holdSeconds(s), n: setsOf(s) });

function favButton(s: Stretch, extraClass = ''): string {
  const on = isFavourite(s.id);
  return `<button class="fav-btn ${extraClass}" data-fav="${esc(s.id)}" aria-pressed="${on}"
    aria-label="${favLabel(on)}">${starIcon(on)}</button>`;
}

function stretchCard(s: Stretch, showMuscles = false): string {
  const names = showMuscles
    ? s.muscles.primary
        .map((id) => getMuscle(id))
        .filter((m): m is Muscle => !!m)
        .map((m) => loc(m.name))
        .join('、')
    : '';
  return `
    <li class="card">
      <a class="card-link" href="#/stretch/${encodeURIComponent(s.id)}">
        <span class="card-title">${esc(loc(s.name))}</span>
        <span class="card-summary">${esc(loc(s.summary))}</span>
        <span class="card-meta">
          <span class="tag tag-${s.type}">${typeLabel(s.type)}</span>
          <span class="meta-hold">⏱ ${doseText(s)}</span>
          ${names ? `<span class="meta-part">${esc(names)}</span>` : ''}
        </span>
      </a>
      ${favButton(s)}
    </li>`;
}

/** A muscle row: location picture, both names, where it is, and how many stretches. */
function muscleCard(m: Muscle): string {
  const n = stretchesFor(m.id).length;
  return `
    <li class="card muscle-card">
      <a class="card-link muscle-link" href="#/muscle/${m.id}">
        <span class="thumb-box">${muscleThumbSvg(m.id, m.view)}</span>
        <span class="muscle-text">
          <span class="card-title">${esc(loc(m.name))}</span>
          <span class="muscle-other" lang="${getLang() === 'zh' ? 'en' : 'zh-HK'}">${esc(locOther(m.name))}</span>
          <span class="card-summary">${esc(loc(m.where))}</span>
          <span class="card-meta"><span class="meta-hold">${t('muscleStretchCount', { n })}</span></span>
        </span>
        ${CHEVRON}
      </a>
    </li>`;
}

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

  const list = region
    ? `<section class="region-panel" data-region-panel>
        <h2 class="panel-title">${t('regionMuscles', { region: esc(loc(region.name)) })}</h2>
        <ul class="cards">${musclesIn(region.id).map(muscleCard).join('')}</ul>
      </section>`
    : '';

  return {
    title: t('appName'),
    tab: 'browse',
    html: `
      <p class="lead">${t('homeLead')}</p>
      <div class="seg" role="tablist" aria-label="${t('viewToggle')}">${toggle}</div>
      <div class="map-wrap">${map}</div>
      <div class="chips region-chips" aria-label="${t('allRegions')}">${regionChips}</div>
      ${list}
      <p class="disclaimer">${t('disclaimer')}</p>`,
  };
}

/** Third level: every stretch that has this muscle as a primary muscle. */
export function muscleView(id: string, filter: Filter): View | null {
  const m = getMuscle(id);
  if (!m) return null;
  const region = getRegion(m.region);
  const all = stretchesFor(m.id);
  const shown = filter === 'all' ? all : all.filter((s) => s.type === filter);

  const chips = FILTERS.map((f) => {
    const count = f === 'all' ? all.length : all.filter((s) => s.type === f).length;
    const label = f === 'all' ? t('all') : typeLabel(f);
    return `<button class="chip" role="tab" data-filter="${f}" aria-selected="${f === filter}">
      ${label} <span class="chip-count">${count}</span></button>`;
  }).join('');

  const list = shown.length
    ? `<ul class="cards">${shown.map((s) => stretchCard(s)).join('')}</ul>`
    : `<p class="empty">${t('emptyFilter', {
        type: getLang() === 'en' ? typeLabel(filter as StretchType).toLowerCase() : typeLabel(filter as StretchType),
      })}</p>`;

  return {
    title: loc(m.name),
    parent: `#/region/${m.region}/${m.view}`,
    tab: 'browse',
    html: `
      <div class="muscle-head">
        <span class="thumb-box thumb-lg">${muscleThumbSvg(m.id, m.view)}</span>
        <div>
          <p class="detail-part">${region ? esc(loc(region.name)) : ''}</p>
          <h1 class="detail-title">${esc(loc(m.name))}</h1>
          <p class="muscle-other" lang="${getLang() === 'zh' ? 'en' : 'zh-HK'}">${esc(locOther(m.name))}</p>
          <p class="card-summary">${esc(loc(m.where))}</p>
        </div>
      </div>
      <h2 class="panel-title">${t('stretchesFor')}</h2>
      <div class="chips" role="tablist" aria-label="${t('filterLabel')}">${chips}</div>
      ${list}`,
  };
}

export function stretchView(id: string): View | null {
  const s = getStretch(id);
  if (!s) return null;
  const first = getMuscle(s.muscles.primary[0]);
  const hold = holdSeconds(s);
  const sets = setsOf(s);
  const equipment = s.equipment?.length
    ? `<section class="section"><h2>${t('youNeed')}</h2><ul class="equipment">${s.equipment
        .map((e) => `<li>${esc(loc(e))}</li>`)
        .join('')}</ul></section>`
    : '';
  const safety = s.safety.length
    ? `<section class="section safety"><h2>${t('safety')}</h2><ul>${s.safety
        .map((n) => `<li>${esc(loc(n))}</li>`)
        .join('')}</ul></section>`
    : '';

  // Muscle tags link to that muscle's stretch list.
  const tags = (ids: string[], cls: string) =>
    ids
      .map((mid) => getMuscle(mid))
      .filter((m): m is Muscle => !!m)
      .map((m) => `<li><a class="muscle ${cls}" href="#/muscle/${m.id}">${esc(loc(m.name))}${CHEVRON}</a></li>`)
      .join('');
  const primary = tags(s.muscles.primary, 'muscle-primary');
  const secondary = tags(s.muscles.secondary, 'muscle-secondary');
  const muscleRows =
    `<div class="muscle-row"><span class="muscle-label">${t('primaryMuscles')}</span><ul class="muscle-list">${primary}</ul></div>` +
    (secondary
      ? `<div class="muscle-row"><span class="muscle-label">${t('secondaryMuscles')}</span><ul class="muscle-list">${secondary}</ul></div>`
      : '') +
    `<p class="muscle-hint">${t('muscleTagHint')}</p>`;

  const video = `https://www.youtube.com/results?search_query=${encodeURIComponent(s.name.en)}`;
  const demo = `
      <section class="demo-card">
        ${
          sceneFor(s.id)
            ? `<div class="demo" data-demo="${esc(s.id)}"></div>
        <p class="demo-legend">
          <span><span class="demo-swatch swatch-primary" aria-hidden="true"></span>${t('legendPrimary')}</span>
          ${s.muscles.secondary.length ? `<span><span class="demo-swatch swatch-secondary" aria-hidden="true"></span>${t('legendSecondary')}</span>` : ''}
        </p>
        <p class="demo-reduced">${t('demoReduced')}</p>`
            : ''
        }
        ${muscleRows}
        <a class="btn-video" href="${video}" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l11-6.5z"/></svg>
          <span>${t('demoVideo')}</span><span class="btn-video-hint">${t('demoVideoHint')}</span>
        </a>
      </section>`;

  const segs = segmentsOf({ holdSeconds: hold, sets, perSide: s.perSide });
  const segChips = segs
    .map((sg, i) => `<li><button class="seg-chip" data-seg="${i}" data-state="todo">${segmentLabel(sg)}</button></li>`)
    .join('');

  return {
    title: loc(s.name),
    parent: first ? `#/muscle/${first.id}` : '#/',
    tab: 'browse',
    html: `
      <div class="detail-head">
        <div>
          <h1 class="detail-title">${esc(loc(s.name))}</h1>
          <span class="tag tag-${s.type}">${typeLabel(s.type)}</span>
        </div>
        ${favButton(s, 'fav-btn-lg')}
      </div>
      <p class="lead">${esc(loc(s.summary))}</p>
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
      ${safety}`,
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


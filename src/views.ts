import { bodyParts, getBodyPart, getStretch, stretchesFor } from './data';
import { favouriteIds, isFavourite } from './favourites';
import { getLang, loc, t } from './i18n';
import { RING_LENGTH } from './timer';
import type { BodyPartId, Stretch, StretchType } from './types';

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

export const starIcon = (on: boolean): string => (on ? STAR_ON : STAR_OFF);
export const favLabel = (on: boolean): string => t(on ? 'removeFav' : 'addFav');

const typeLabel = (type: StretchType): string => t(type);

const holdText = (s: Stretch): string => t('holdSeconds', { n: s.holdSeconds }) + (s.perSide ? t('eachSide') : '');

function favButton(s: Stretch, extraClass = ''): string {
  const on = isFavourite(s.id);
  return `<button class="fav-btn ${extraClass}" data-fav="${esc(s.id)}" aria-pressed="${on}"
    aria-label="${favLabel(on)}">${starIcon(on)}</button>`;
}

function stretchCard(s: Stretch, showPart = false): string {
  const part = showPart ? getBodyPart(s.bodyPart) : undefined;
  return `
    <li class="card">
      <a class="card-link" href="#/stretch/${encodeURIComponent(s.id)}">
        <span class="card-title">${esc(loc(s.name))}</span>
        <span class="card-summary">${esc(loc(s.summary))}</span>
        <span class="card-meta">
          <span class="tag tag-${s.type}">${typeLabel(s.type)}</span>
          <span class="meta-hold">⏱ ${holdText(s)}</span>
          ${part ? `<span class="meta-part">${esc(loc(part.name))}</span>` : ''}
        </span>
      </a>
      ${favButton(s)}
    </li>`;
}

export function homeView(): View {
  const tiles = bodyParts
    .map((p) => {
      const n = stretchesFor(p.id).length;
      return `
        <li>
          <a class="tile" href="#/part/${p.id}">
            <span class="tile-icon" aria-hidden="true">${esc(p.icon)}</span>
            <span class="tile-name">${esc(loc(p.name))}</span>
            <span class="tile-count">${n === 1 ? t('stretchCountOne') : t('stretchCount', { n })}</span>
          </a>
        </li>`;
    })
    .join('');
  return {
    title: t('appName'),
    tab: 'browse',
    html: `
      <p class="lead">${t('homeLead')}</p>
      <ul class="tiles">${tiles}</ul>
      <p class="disclaimer">${t('disclaimer')}</p>`,
  };
}

export function partView(id: string, filter: Filter): View | null {
  const part = getBodyPart(id);
  if (!part) return null;
  const all = stretchesFor(part.id as BodyPartId);
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
    title: loc(part.name),
    parent: '#/',
    tab: 'browse',
    html: `
      <p class="lead">${esc(loc(part.description))}</p>
      <div class="chips" role="tablist" aria-label="${t('filterLabel')}">${chips}</div>
      ${list}`,
  };
}

export function stretchView(id: string): View | null {
  const s = getStretch(id);
  if (!s) return null;
  const part = getBodyPart(s.bodyPart)!;
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

  return {
    title: loc(s.name),
    parent: `#/part/${part.id}`,
    tab: 'browse',
    html: `
      <div class="detail-head">
        <div>
          <p class="detail-part">${esc(part.icon)} ${esc(loc(part.name))}</p>
          <h1 class="detail-title">${esc(loc(s.name))}</h1>
          <span class="tag tag-${s.type}">${typeLabel(s.type)}</span>
        </div>
        ${favButton(s, 'fav-btn-lg')}
      </div>
      <p class="lead">${esc(loc(s.summary))}</p>

      <section class="timer" data-timer data-kind="idle">
        <div class="timer-dial">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle class="timer-track" cx="60" cy="60" r="54" />
            <circle class="timer-ring" data-timer-ring cx="60" cy="60" r="54"
              stroke-dasharray="${RING_LENGTH}" stroke-dashoffset="0" />
          </svg>
          <div class="timer-readout" aria-live="polite">
            <span class="timer-time" data-timer-time>${s.holdSeconds}</span>
            <span class="timer-label" data-timer-label>${t('timerReady')}</span>
          </div>
        </div>
        <div class="timer-info">
          <p class="hold"><strong>${t('hold', { time: holdText(s) })}</strong></p>
          <button class="btn-primary" data-timer-toggle data-running="false">${t('timerStart')}</button>
        </div>
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
  const favs = favouriteIds()
    .map((id) => getStretch(id))
    .filter((s): s is Stretch => !!s)
    .sort(
      (a, b) =>
        bodyParts.findIndex((p) => p.id === a.bodyPart) - bodyParts.findIndex((p) => p.id === b.bodyPart) ||
        loc(a.name).localeCompare(loc(b.name)),
    );
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

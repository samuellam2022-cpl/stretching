import { bodyParts, getBodyPart, getStretch, stretchesFor, TYPE_LABELS } from './data';
import { favouriteIds, isFavourite } from './favourites';
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
const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const STAR_ON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
const STAR_OFF =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';

export const starIcon = (on: boolean): string => (on ? STAR_ON : STAR_OFF);

const holdText = (s: Stretch): string => `${s.holdSeconds}s${s.perSide ? ' each side' : ''}`;

function favButton(s: Stretch, extraClass = ''): string {
  const on = isFavourite(s.id);
  return `<button class="fav-btn ${extraClass}" data-fav="${esc(s.id)}" aria-pressed="${on}"
    aria-label="${on ? 'Remove from' : 'Add to'} favourites">${starIcon(on)}</button>`;
}

function stretchCard(s: Stretch, showPart = false): string {
  const part = showPart ? getBodyPart(s.bodyPart) : undefined;
  return `
    <li class="card">
      <a class="card-link" href="#/stretch/${encodeURIComponent(s.id)}">
        <span class="card-title">${esc(s.name)}</span>
        <span class="card-summary">${esc(s.summary)}</span>
        <span class="card-meta">
          <span class="tag tag-${s.type}">${TYPE_LABELS[s.type]}</span>
          <span class="meta-hold">⏱ ${holdText(s)}</span>
          ${part ? `<span class="meta-part">${esc(part.name)}</span>` : ''}
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
            <span class="tile-name">${esc(p.name)}</span>
            <span class="tile-count">${n} stretch${n === 1 ? '' : 'es'}</span>
          </a>
        </li>`;
    })
    .join('');
  return {
    title: 'Stretching',
    tab: 'browse',
    html: `
      <p class="lead">Choose a body part to see stretches.</p>
      <ul class="tiles">${tiles}</ul>
      <p class="disclaimer">Stretch gently – you should feel mild tension, never pain.
      If you have an injury or medical condition, check with a health professional first.</p>`,
  };
}

export function partView(id: string, filter: Filter): View | null {
  const part = getBodyPart(id);
  if (!part) return null;
  const all = stretchesFor(part.id as BodyPartId);
  const shown = filter === 'all' ? all : all.filter((s) => s.type === filter);

  const chips = FILTERS.map((f) => {
    const count = f === 'all' ? all.length : all.filter((s) => s.type === f).length;
    const label = f === 'all' ? 'All' : TYPE_LABELS[f];
    return `<button class="chip" role="tab" data-filter="${f}" aria-selected="${f === filter}">
      ${label} <span class="chip-count">${count}</span></button>`;
  }).join('');

  const list = shown.length
    ? `<ul class="cards">${shown.map((s) => stretchCard(s)).join('')}</ul>`
    : `<p class="empty">No ${TYPE_LABELS[filter as StretchType].toLowerCase()} stretches for this body part yet.</p>`;

  return {
    title: part.name,
    parent: '#/',
    tab: 'browse',
    html: `
      <p class="lead">${esc(part.description)}</p>
      <div class="chips" role="tablist" aria-label="Filter stretches">${chips}</div>
      ${list}`,
  };
}

export function stretchView(id: string): View | null {
  const s = getStretch(id);
  if (!s) return null;
  const part = getBodyPart(s.bodyPart)!;
  const equipment = s.equipment?.length
    ? `<section class="section"><h2>You'll need</h2><ul class="equipment">${s.equipment
        .map((e) => `<li>${esc(e)}</li>`)
        .join('')}</ul></section>`
    : '';
  const safety = s.safety.length
    ? `<section class="section safety"><h2>Safety notes</h2><ul>${s.safety
        .map((n) => `<li>${esc(n)}</li>`)
        .join('')}</ul></section>`
    : '';

  return {
    title: s.name,
    parent: `#/part/${part.id}`,
    tab: 'browse',
    html: `
      <div class="detail-head">
        <div>
          <p class="detail-part">${esc(part.icon)} ${esc(part.name)}</p>
          <h1 class="detail-title">${esc(s.name)}</h1>
          <span class="tag tag-${s.type}">${TYPE_LABELS[s.type]}</span>
        </div>
        ${favButton(s, 'fav-btn-lg')}
      </div>
      <p class="lead">${esc(s.summary)}</p>

      <section class="timer" data-timer data-kind="idle">
        <div class="timer-dial">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle class="timer-track" cx="60" cy="60" r="54" />
            <circle class="timer-ring" data-timer-ring cx="60" cy="60" r="54"
              stroke-dasharray="${RING_LENGTH}" stroke-dashoffset="0" />
          </svg>
          <div class="timer-readout" aria-live="polite">
            <span class="timer-time" data-timer-time>${s.holdSeconds}</span>
            <span class="timer-label" data-timer-label>Ready</span>
          </div>
        </div>
        <div class="timer-info">
          <p class="hold"><strong>Hold ${holdText(s)}</strong></p>
          <button class="btn-primary" data-timer-toggle data-running="false">Start timer</button>
        </div>
      </section>

      ${equipment}
      <section class="section">
        <h2>Steps</h2>
        <ol class="steps">${s.steps.map((st) => `<li>${esc(st)}</li>`).join('')}</ol>
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
        a.name.localeCompare(b.name),
    );
  return {
    title: 'Favourites',
    tab: 'favourites',
    html: favs.length
      ? `<ul class="cards">${favs.map((s) => stretchCard(s, true)).join('')}</ul>`
      : `<div class="empty">
          <div class="empty-star">${STAR_OFF}</div>
          <p>No favourites yet.</p>
          <p>Tap the star on any stretch to save it here.</p>
          <a class="btn-secondary" href="#/">Browse stretches</a>
        </div>`,
  };
}

export function notFoundView(): View {
  return {
    title: 'Not found',
    parent: '#/',
    tab: 'browse',
    html: `<div class="empty"><p>That page doesn't exist.</p><a class="btn-secondary" href="#/">Go home</a></div>`,
  };
}

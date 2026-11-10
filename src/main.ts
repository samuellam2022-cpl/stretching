import './style.css';
import { getStretch } from './data';
import { toggleFavourite } from './favourites';
import { resetTimerUI, startTimer, stopTimer } from './timer';
import {
  FILTERS,
  favouritesView,
  homeView,
  notFoundView,
  partView,
  starIcon,
  stretchView,
  type Filter,
  type View,
} from './views';

history.scrollRestoration = 'manual';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <header class="topbar">
    <button class="back-btn" data-back hidden aria-label="Back">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>Back</span>
    </button>
    <h1 class="topbar-title" data-title></h1>
  </header>
  <main class="content" data-content></main>
  <nav class="tabbar" aria-label="Main">
    <a class="tab" data-tab="browse" href="#/">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>
      <span>Body parts</span>
    </a>
    <a class="tab" data-tab="favourites" href="#/favourites">
      ${starIcon(false)}
      <span>Favourites</span>
    </a>
  </nav>`;

const titleEl = app.querySelector<HTMLElement>('[data-title]')!;
const contentEl = app.querySelector<HTMLElement>('[data-content]')!;
const backBtn = app.querySelector<HTMLButtonElement>('[data-back]')!;

let current: View | null = null;
let currentRoute = '';
/** True once the user has navigated inside the app, so history.back() stays in the app. */
let hasInAppHistory = false;
const scrollPositions = new Map<string, number>();

function resolve(hash: string): View {
  const parts = hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const [section, id, extra] = parts;
  if (!section) return homeView();
  if (section === 'favourites') return favouritesView();
  if (section === 'part' && id) {
    const filter: Filter = FILTERS.includes(extra as Filter) ? (extra as Filter) : 'all';
    return partView(id, filter) ?? notFoundView();
  }
  if (section === 'stretch' && id) return stretchView(id) ?? notFoundView();
  return notFoundView();
}

/** Route key without the filter, so changing filter keeps scroll position sensible. */
const routeKey = (hash: string) => hash.split('/').slice(0, 3).join('/') || '#/';

function render(): void {
  stopTimer();
  if (currentRoute) scrollPositions.set(routeKey(currentRoute), window.scrollY);

  const hash = location.hash || '#/';
  const sameScreen = currentRoute && routeKey(currentRoute) === routeKey(hash);
  currentRoute = hash;
  current = resolve(hash);

  titleEl.textContent = current.title;
  document.title = current.title === 'Stretching' ? 'Stretching' : `${current.title} · Stretching`;
  backBtn.hidden = !current.parent;
  contentEl.innerHTML = current.html;
  app.querySelectorAll<HTMLElement>('[data-tab]').forEach((t) => {
    const active = t.dataset.tab === current!.tab;
    t.classList.toggle('active', active);
    if (active) t.setAttribute('aria-current', 'page');
    else t.removeAttribute('aria-current');
  });

  if (!sameScreen) window.scrollTo(0, scrollPositions.get(routeKey(hash)) ?? 0);
}

let replacing = false;
window.addEventListener('hashchange', () => {
  if (!replacing) hasInAppHistory = true;
  replacing = false;
  render();
});

app.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;

  const fav = target.closest<HTMLButtonElement>('[data-fav]');
  if (fav) {
    e.preventDefault();
    const id = fav.dataset.fav!;
    const on = toggleFavourite(id);
    // On the favourites screen, removing an item should remove it from the list.
    if (current?.tab === 'favourites' && !on) {
      render();
      return;
    }
    fav.setAttribute('aria-pressed', String(on));
    fav.setAttribute('aria-label', `${on ? 'Remove from' : 'Add to'} favourites`);
    fav.innerHTML = starIcon(on);
    fav.classList.remove('pop');
    void fav.offsetWidth; // restart animation
    fav.classList.add('pop');
    return;
  }

  const chip = target.closest<HTMLButtonElement>('[data-filter]');
  if (chip) {
    const [, , id] = (location.hash || '#/').split('/');
    const f = chip.dataset.filter as Filter;
    // replace() so filter changes don't pile up in the back history
    const next = `#/part/${id}${f === 'all' ? '' : `/${f}`}`;
    if (next === location.hash) return;
    replacing = true;
    location.replace(next);
    return;
  }

  if (target.closest('[data-back]')) {
    if (hasInAppHistory) history.back();
    else if (current?.parent) location.hash = current.parent;
    return;
  }

  const toggle = target.closest<HTMLButtonElement>('[data-timer-toggle]');
  if (toggle) {
    const root = toggle.closest<HTMLElement>('[data-timer]')!;
    const s = getStretch(decodeURIComponent((location.hash.split('/')[2] ?? '')));
    if (!s) return;
    if (toggle.dataset.running === 'true') resetTimerUI(root, s.holdSeconds);
    else startTimer(root, s.holdSeconds, s.perSide);
  }
});

// Stop the timer if the app goes to the background.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    const root = contentEl.querySelector<HTMLElement>('[data-timer]');
    const s = getStretch(decodeURIComponent(location.hash.split('/')[2] ?? ''));
    if (root && s && root.dataset.kind !== 'idle' && root.dataset.kind !== 'done') resetTimerUI(root, s.holdSeconds);
  }
});

// Enables :active styles on iOS Safari.
document.addEventListener('touchstart', () => {}, { passive: true });

render();

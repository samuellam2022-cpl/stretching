import './style.css';
import { getStretch } from './data';
import { toggleFavourite } from './favourites';
import { applyDocumentLang, getLang, setLang, t, type Lang } from './i18n';
import { resetTimerUI, startTimer, stopTimer } from './timer';
import {
  FILTERS,
  favouritesView,
  homeView,
  notFoundView,
  favLabel,
  partView,
  starIcon,
  stretchView,
  type Filter,
  type View,
} from './views';

history.scrollRestoration = 'manual';

const app = document.querySelector<HTMLDivElement>('#app')!;
applyDocumentLang();

app.innerHTML = `
  <header class="topbar">
    <button class="back-btn" data-back hidden>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span data-i18n="back"></span>
    </button>
    <h1 class="topbar-title" data-title></h1>
    <button class="lang-btn" data-lang-toggle>
      <span data-lang="zh" lang="zh-HK">中</span><span class="lang-sep" aria-hidden="true">／</span><span data-lang="en" lang="en">EN</span>
    </button>
  </header>
  <main class="content" data-content></main>
  <nav class="tabbar" aria-label="Main">
    <a class="tab" data-tab="browse" href="#/">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>
      <span data-i18n="tabBodyParts"></span>
    </a>
    <a class="tab" data-tab="favourites" href="#/favourites">
      ${starIcon(false)}
      <span data-i18n="tabFavourites"></span>
    </a>
  </nav>`;

const titleEl = app.querySelector<HTMLElement>('[data-title]')!;
const contentEl = app.querySelector<HTMLElement>('[data-content]')!;
const backBtn = app.querySelector<HTMLButtonElement>('[data-back]')!;

const langBtn = app.querySelector<HTMLButtonElement>('[data-lang-toggle]')!;

/** Update the fixed parts of the screen (top bar, tab bar) for the current language. */
function renderShell(): void {
  app.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n as Parameters<typeof t>[0]);
  });
  const lang = getLang();
  langBtn.querySelectorAll<HTMLElement>('[data-lang]').forEach((el) => {
    el.classList.toggle('on', el.dataset.lang === lang);
  });
  langBtn.setAttribute('aria-label', `${t('langToggle')}: ${lang === 'zh' ? 'English' : '中文'}`);
}

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
  const appName = t('appName');
  document.title = current.title === appName ? appName : `${current.title} · ${appName}`;
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
    fav.setAttribute('aria-label', favLabel(on));
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

  if (target.closest('[data-lang-toggle]')) {
    const next: Lang = getLang() === 'zh' ? 'en' : 'zh';
    setLang(next);
    renderShell();
    render(); // same route, so scroll position is kept
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

renderShell();
render();

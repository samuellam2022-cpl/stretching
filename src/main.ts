import './style.css';
import { getMuscle, getRegion, getStretch, holdSeconds, setsOf } from './data';
import { toggleFavourite } from './favourites';
import { mountDemo, type Demo, type DemoLabel } from './figure/player';
import { sceneFor } from './figure/scenes';
import { applyDocumentLang, getLang, loc, locOther, setLang, t, type Lang } from './i18n';
import { resetTimerUI, startTimer, stopTimer, type TimerPlan } from './timer';
import type { MapView, Stretch } from './types';
import {
  FILTERS,
  favLabel,
  favouritesView,
  homeView,
  muscleView,
  notFoundView,
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
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.5" r="2.5" fill="currentColor"/><path fill="currentColor" d="M7 8.5h10a1.5 1.5 0 0 1 0 3h-2.6v9a1.4 1.4 0 0 1-2.8 0V16h.8v4.5a1.4 1.4 0 0 1-2.8 0v-9H7a1.5 1.5 0 0 1 0-3z"/></svg>
      <span data-i18n="tabMap"></span>
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

const parseRoute = (hash: string): string[] => hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
const isView = (v: string | undefined): v is MapView => v === 'front' || v === 'back';

function resolve(hash: string): View {
  const [section, id, extra] = parseRoute(hash);
  if (!section) return homeView('front');
  if (section === 'map') return homeView(isView(id) ? id : 'front');
  if (section === 'region' && id) {
    const region = getRegion(id);
    if (!region) return notFoundView();
    return homeView(isView(extra) && region.views.includes(extra) ? extra : region.views[0], id);
  }
  if (section === 'favourites') return favouritesView();
  if (section === 'muscle' && id) {
    const filter: Filter = FILTERS.includes(extra as Filter) ? (extra as Filter) : 'all';
    return muscleView(id, filter) ?? notFoundView();
  }
  if (section === 'stretch' && id) return stretchView(id) ?? notFoundView();
  return notFoundView();
}

/** Screen identity for scroll memory: the map (any view/region) is one screen; filters don't count. */
function routeKey(hash: string): string {
  const [section, id] = parseRoute(hash);
  if (!section || section === 'map' || section === 'region') return 'map';
  return `${section}/${id ?? ''}`;
}

/** Everything the demo picture needs for a stretch, in the current language. */
function demoFor(s: Stretch): Demo | null {
  const scene = sceneFor(s.id);
  if (!scene) return null;
  const label = (id: string, level: DemoLabel['level']): DemoLabel | null => {
    const m = getMuscle(id);
    return m ? { id, level, title: loc(m.name), sub: locOther(m.name), levelText: t(level) } : null;
  };
  return {
    scene,
    muscles: s.muscles,
    labels: [
      ...s.muscles.primary.map((id) => label(id, 'primary')),
      ...s.muscles.secondary.map((id) => label(id, 'secondary')),
    ].filter((l): l is DemoLabel => !!l),
    arrowText: scene.arrow ? loc(scene.arrow.label) : '',
    aria: t('demoLabel', { name: loc(s.name) }),
  };
}

let stopDemo: (() => void) | null = null;

function render(): void {
  stopTimer();
  stopDemo?.();
  stopDemo = null;
  if (currentRoute) scrollPositions.set(routeKey(currentRoute), window.scrollY);

  const hash = location.hash || '#/';
  const sameScreen = !!currentRoute && routeKey(currentRoute) === routeKey(hash);
  currentRoute = hash;
  current = resolve(hash);

  titleEl.textContent = current.title;
  const appName = t('appName');
  document.title = current.title === appName ? appName : `${current.title} · ${appName}`;
  backBtn.hidden = !current.parent;
  contentEl.innerHTML = current.html;

  const demoEl = contentEl.querySelector<HTMLElement>('[data-demo]');
  const st = demoEl && getStretch(demoEl.dataset.demo!);
  const demo = st && demoFor(st);
  if (demoEl && demo) stopDemo = mountDemo(demoEl, demo);

  app.querySelectorAll<HTMLElement>('[data-tab]').forEach((el) => {
    const active = el.dataset.tab === current!.tab;
    el.classList.toggle('active', active);
    if (active) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });

  if (!sameScreen) window.scrollTo(0, scrollPositions.get(routeKey(hash)) ?? 0);
}

let replacing = false;
/** Change the route without adding a history entry (filters, map view, switching region). */
function replaceRoute(next: string): void {
  if (next === (location.hash || '#/')) return;
  replacing = true;
  location.replace(next);
}

window.addEventListener('hashchange', () => {
  if (!replacing) hasInAppHistory = true;
  replacing = false;
  render();
});

const currentStretch = (): Stretch | undefined => {
  const [section, id] = parseRoute(location.hash);
  return section === 'stretch' && id ? getStretch(id) : undefined;
};
const planFor = (s: Stretch): TimerPlan => ({ holdSeconds: holdSeconds(s), sets: setsOf(s), perSide: s.perSide });

function selectRegion(regionId: string): void {
  const [section, , view] = parseRoute(location.hash);
  const mapView = contentEl.querySelector<HTMLElement>('[data-map-view][aria-selected="true"]')?.dataset.mapView ?? view ?? 'front';
  const next = `#/region/${regionId}/${mapView}`;
  // From the plain map this is a step forward; switching between regions replaces.
  if (section === 'region') replaceRoute(next);
  else location.hash = next;
  // Bring the muscle list into view under the map.
  window.setTimeout(() => contentEl.querySelector('[data-region-panel]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
}

app.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;

  const fav = target.closest<HTMLButtonElement>('[data-fav]');
  if (fav) {
    e.preventDefault();
    const on = toggleFavourite(fav.dataset.fav!);
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

  const region = target.closest<SVGElement>('[data-region]');
  if (region) {
    selectRegion(region.dataset.region!);
    return;
  }

  const mapView = target.closest<HTMLElement>('[data-map-view]');
  if (mapView) {
    const v = mapView.dataset.mapView as MapView;
    const [section, id] = parseRoute(location.hash);
    const reg = section === 'region' && id ? getRegion(id) : undefined;
    // Keep the selected region if it exists on that side of the body.
    replaceRoute(reg && reg.views.includes(v) ? `#/region/${reg.id}/${v}` : v === 'front' ? '#/' : '#/map/back');
    return;
  }

  const chip = target.closest<HTMLButtonElement>('[data-filter]');
  if (chip) {
    const [, id] = parseRoute(location.hash);
    const f = chip.dataset.filter as Filter;
    replaceRoute(`#/muscle/${id}${f === 'all' ? '' : `/${f}`}`);
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

  const seg = target.closest<HTMLButtonElement>('[data-seg]');
  const toggle = target.closest<HTMLButtonElement>('[data-timer-toggle]');
  if (seg || toggle) {
    const s = currentStretch();
    const root = (seg ?? toggle)!.closest<HTMLElement>('[data-timer]');
    if (!s || !root) return;
    if (seg) startTimer(root, planFor(s), Number(seg.dataset.seg));
    else if (toggle!.dataset.running === 'true') resetTimerUI(root, holdSeconds(s));
    else startTimer(root, planFor(s));
  }
});

// Body-map regions are focusable; Enter/Space selects like a tap.
app.addEventListener('keydown', (e) => {
  const region = (e.target as HTMLElement).closest<SVGElement>('[data-region]');
  if (region && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    selectRegion(region.dataset.region!);
  }
});

// Stop the timer if the app goes to the background.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  const root = contentEl.querySelector<HTMLElement>('[data-timer]');
  const s = currentStretch();
  if (root && s && root.dataset.kind !== 'idle' && root.dataset.kind !== 'done') resetTimerUI(root, holdSeconds(s));
});

// Enables :active styles on iOS Safari.
document.addEventListener('touchstart', () => {}, { passive: true });

renderShell();
render();

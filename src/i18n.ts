import type { Localized } from './types';

export type Lang = 'en' | 'zh';

const KEY = 'stretching:lang';

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'zh') return saved;
  } catch {
    /* storage blocked */
  }
  // First visit: follow the phone's language settings.
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  return langs.some((l) => l?.toLowerCase().startsWith('zh')) ? 'zh' : 'en';
}

let lang: Lang = detect();

export const getLang = (): Lang => lang;

/** The same value in the other language (for bilingual labels). */
export const locOther = (v: Localized): string => (lang === 'zh' ? v.en : v.zh || v.en);

export function setLang(next: Lang): void {
  lang = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* storage blocked – choice lasts for this session only */
  }
  applyDocumentLang();
}

export function applyDocumentLang(): void {
  document.documentElement.lang = lang === 'zh' ? 'zh-HK' : 'en';
}

/** Pick the current language from a bilingual value, falling back to English. */
export const loc = (v: Localized): string => (lang === 'zh' ? v.zh || v.en : v.en);

const STRINGS = {
  appName: { en: 'Post-workout Stretch', zh: '運動後拉筋' },
  back: { en: 'Back', zh: '返回' },
  langToggle: { en: 'Switch language', zh: '切換語言' },
  tabMap: { en: 'Muscles', zh: '肌肉圖' },
  tabFavourites: { en: 'Favourites', zh: '我的最愛' },
  homeLead: { en: 'Tap the part of the body you just trained.', zh: '撳啱啱練完嘅身體部位。' },
  mapAria: { en: 'Body map, {view} view', zh: '人體肌肉圖（{view}）' },
  front: { en: 'Front', zh: '正面' },
  backView: { en: 'Back', zh: '背面' },
  viewToggle: { en: 'Front or back of the body', zh: '身體正面或背面' },
  regionMuscles: { en: 'Muscles: {region}', zh: '{region}嘅肌肉' },
  allRegions: { en: 'All body parts', zh: '全部部位' },
  muscleStretchCount: { en: '{n} stretches', zh: '{n} 個動作' },
  stretchesFor: { en: 'Stretches for this muscle', zh: '拉呢條肌肉嘅動作' },
  disclaimer: {
    en: 'Stretch after exercise while the muscles are warm. Stretch gently – you should feel mild tension, never pain. If you have an injury or medical condition, check with a health professional first.',
    zh: '運動後趁肌肉仲暖嗰陣拉筋。伸展要溫和——應該只係有輕微拉緊感，唔應該痛。如果你有傷患或者健康問題，請先問醫護人員意見。',
  },
  filterLabel: { en: 'Filter stretches', zh: '篩選動作' },
  all: { en: 'All', zh: '全部' },
  solo: { en: 'Solo', zh: '單人' },
  partner: { en: 'Partner', zh: '雙人' },
  equipment: { en: 'Needs equipment', zh: '需要器材' },
  emptyFilter: { en: 'No {type} stretches for this muscle yet.', zh: '呢條肌肉暫時未有「{type}」動作。' },
  dose: { en: '{s}s × {n} sets', zh: '{s} 秒 × {n} 組' },
  doseEachSide: { en: '{s}s × {n} sets each side', zh: '每邊 {s} 秒 × {n} 組' },
  hold: { en: 'Hold {s} seconds, {n} sets', zh: '保持 {s} 秒，做 {n} 組' },
  sidesSeparate: { en: 'Left and right are timed separately.', zh: '左右邊分開計時。' },
  timerReady: { en: 'Ready', zh: '準備' },
  timerStart: { en: 'Start timer', zh: '開始計時' },
  timerStop: { en: 'Stop', zh: '停止' },
  timerAgain: { en: 'Start again', zh: '再嚟一次' },
  timerSwitch: { en: 'Switch sides', zh: '轉邊' },
  timerRest: { en: 'Rest', zh: '休息' },
  timerDone: { en: 'Done – nice work!', zh: '完成，做得好！' },
  sideR: { en: 'Right', zh: '右邊' },
  sideL: { en: 'Left', zh: '左邊' },
  setN: { en: 'Set {n}', zh: '第 {n} 組' },
  segSide: { en: '{side} · set {n}', zh: '{side} · 第 {n} 組' },
  segments: { en: 'Timer steps (tap to start from one)', zh: '計時步驟（撳可以由嗰步開始）' },
  demoLabel: { en: 'Illustrated demonstration: {name}', zh: '{name}示範圖' },
  legendPrimary: { en: 'Red = primary muscle', zh: '紅色 = 主要肌肉' },
  legendSecondary: { en: 'Orange = secondary muscle', zh: '橙色 = 次要肌肉' },
  demoReduced: { en: 'Reduce Motion is on, so the final position is shown.', zh: '已開啟「減少動態效果」，顯示最終姿勢。' },
  primary: { en: 'Primary', zh: '主要' },
  secondary: { en: 'Secondary', zh: '次要' },
  primaryMuscles: { en: 'Primary muscles', zh: '主要肌肉' },
  secondaryMuscles: { en: 'Secondary muscles', zh: '次要肌肉' },
  muscleTagHint: { en: 'Tap a muscle to see all its stretches.', zh: '撳肌肉標籤可以睇晒嗰條肌肉嘅動作。' },
  demoVideo: { en: 'Demo videos', zh: '示範片' },
  demoVideoHint: { en: 'Opens a YouTube search', zh: '開啟 YouTube 搜尋' },
  youNeed: { en: "You'll need", zh: '你需要' },
  steps: { en: 'Steps', zh: '步驟' },
  safety: { en: 'Safety notes', zh: '注意事項' },
  addFav: { en: 'Add to favourites', zh: '加入我的最愛' },
  removeFav: { en: 'Remove from favourites', zh: '從我的最愛移除' },
  noFavs: { en: 'No favourites yet.', zh: '仲未有最愛動作。' },
  noFavsHint: { en: 'Tap the star on any stretch to save it here.', zh: '撳動作旁邊嘅星星，就會儲存喺呢度。' },
  browse: { en: 'Open the body map', zh: '開肌肉圖' },
  notFound: { en: 'Not found', zh: '搵唔到' },
  notFoundBody: { en: "That page doesn't exist.", zh: '呢一頁唔存在。' },
  goHome: { en: 'Go home', zh: '返主頁' },
} satisfies Record<string, Localized>;

export type StringKey = keyof typeof STRINGS;

/** UI string in the current language, with {placeholders} filled in. */
export function t(key: StringKey, vars: Record<string, string | number> = {}): string {
  return loc(STRINGS[key]).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

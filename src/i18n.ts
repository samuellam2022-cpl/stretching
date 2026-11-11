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
  appName: { en: 'Stretching', zh: '伸展' },
  back: { en: 'Back', zh: '返回' },
  langToggle: { en: 'Switch language', zh: '切換語言' },
  tabBodyParts: { en: 'Body parts', zh: '身體部位' },
  tabFavourites: { en: 'Favourites', zh: '我的最愛' },
  homeLead: { en: 'Choose a body part to see stretches.', zh: '揀一個身體部位睇伸展動作。' },
  disclaimer: {
    en: 'Stretch gently – you should feel mild tension, never pain. If you have an injury or medical condition, check with a health professional first.',
    zh: '伸展要溫和——應該只係有輕微拉緊感，唔應該痛。如果你有傷患或者健康問題，請先問醫護人員意見。',
  },
  stretchCount: { en: '{n} stretches', zh: '{n} 個動作' },
  stretchCountOne: { en: '1 stretch', zh: '1 個動作' },
  filterLabel: { en: 'Filter stretches', zh: '篩選動作' },
  all: { en: 'All', zh: '全部' },
  solo: { en: 'Solo', zh: '單人' },
  partner: { en: 'Partner', zh: '雙人' },
  equipment: { en: 'Needs equipment', zh: '需要器材' },
  emptyFilter: { en: 'No {type} stretches for this body part yet.', zh: '呢個部位暫時未有「{type}」動作。' },
  holdSeconds: { en: '{n}s', zh: '{n} 秒' },
  eachSide: { en: ' each side', zh: '（每邊）' },
  hold: { en: 'Hold {time}', zh: '保持 {time}' },
  timerReady: { en: 'Ready', zh: '準備' },
  timerStart: { en: 'Start timer', zh: '開始計時' },
  timerStop: { en: 'Stop', zh: '停止' },
  timerAgain: { en: 'Start again', zh: '再嚟一次' },
  timerHold: { en: 'Hold', zh: '保持' },
  timerFirst: { en: 'First side', zh: '第一邊' },
  timerSwitch: { en: 'Switch sides', zh: '轉邊' },
  timerSecond: { en: 'Second side', zh: '第二邊' },
  timerDone: { en: 'Done – nice work!', zh: '完成，做得好！' },
  demoLabel: { en: 'Animated demonstration: {name}', zh: '{name}動畫示範' },
  demoLegend: { en: 'Red = muscles being stretched', zh: '紅色 = 正在拉伸嘅肌肉' },
  demoReduced: { en: 'Reduce Motion is on, so the final position is shown.', zh: '已開啟「減少動態效果」，顯示最終姿勢。' },
  primaryMuscles: { en: 'Primary muscles', zh: '主要肌肉' },
  secondaryMuscles: { en: 'Secondary muscles', zh: '次要肌肉' },
  demoVideo: { en: 'Demo videos', zh: '示範片' },
  demoVideoHint: { en: 'Opens a YouTube search', zh: '開啟 YouTube 搜尋' },
  youNeed: { en: "You'll need", zh: '你需要' },
  steps: { en: 'Steps', zh: '步驟' },
  safety: { en: 'Safety notes', zh: '注意事項' },
  addFav: { en: 'Add to favourites', zh: '加入我的最愛' },
  removeFav: { en: 'Remove from favourites', zh: '從我的最愛移除' },
  noFavs: { en: 'No favourites yet.', zh: '仲未有最愛動作。' },
  noFavsHint: { en: 'Tap the star on any stretch to save it here.', zh: '撳動作旁邊嘅星星，就會儲存喺呢度。' },
  browse: { en: 'Browse stretches', zh: '瀏覽動作' },
  notFound: { en: 'Not found', zh: '搵唔到' },
  notFoundBody: { en: "That page doesn't exist.", zh: '呢一頁唔存在。' },
  goHome: { en: 'Go home', zh: '返主頁' },
} satisfies Record<string, Localized>;

export type StringKey = keyof typeof STRINGS;

/** UI string in the current language, with {placeholders} filled in. */
export function t(key: StringKey, vars: Record<string, string | number> = {}): string {
  return loc(STRINGS[key]).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

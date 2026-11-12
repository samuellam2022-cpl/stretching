# 運動後拉筋 · Post-workout Stretch

A muscle-first post-workout stretching app for iPhone, built with Vite + TypeScript and installable as a PWA. Traditional Chinese (Hong Kong) and English.

**Live:** https://samuellam2022-cpl.github.io/stretching/

## How it works

1. **Body map** – a 2D figure you can flip between front and back. Tap the part of the body you trained; it lights up.
2. **Muscles** – the muscles in that part are listed with both Chinese and English names and a small picture of where each one is (26 muscles in 13 body parts).
3. **Stretches** – tap a muscle to see every stretch that has it as a *primary* muscle (at least 3 per muscle), filtered by Solo / Partner / Needs equipment.
4. **Stretch page**
   - An animated flat illustration of one consistent character (skin, hair, T-shirt, trousers; rounded limbs). Partner stretches show a second person; equipment is drawn.
   - Primary muscles are overlaid in semi-transparent **red**, secondary in **orange**, each with a label box (Chinese + English name, Primary/Secondary) and a leader line to the muscle. An arrow with a short cue shows the key movement (e.g. "Heel toward buttock").
   - Primary / secondary muscle tags below the picture; tapping one opens that muscle's stretch list.
   - Timer: hold **30 seconds × 2 sets** by default, with **left and right timed separately** (right 1 → left 1 → right 2 → left 2). Tap any step to start from it.
   - Steps, safety notes, equipment, and a "Demo videos" button that opens a YouTube search for the English name.
- Favourites are saved on the device (localStorage). Works offline once loaded. Follows dark mode and iPhone **Reduce Motion** (shows the final position without moving).
- Language: tap **中／EN** at the top right. The first visit follows the phone's language; the choice is remembered.

## Install on iPhone

Open the live link in Safari → Share → **Add to Home Screen**.

## Data

Everything is in [`src/data/stretches.json`](src/data/stretches.json). All text is bilingual: `{ "en": "...", "zh": "..." }` (`zh` = Traditional Chinese, Hong Kong usage; if empty, English is shown).

- `defaults` – `holdSeconds` (30) and `sets` (2) for every stretch.
- `regions` – the tappable body parts, and which side(s) of the map show them.
- `muscles` – `id`, `region`, `view` (`front`/`back`, used for the location picture), `name`, `where`.
- `stretches` – one object each:

```json
{
  "id": "calves-kneeling-soleus",
  "type": "solo",
  "perSide": true,
  "name": { "en": "Kneeling ankle stretch", "zh": "跪姿腳踝伸展" },
  "summary": { "en": "One line shown in the list.", "zh": "列表顯示嘅一句簡介。" },
  "muscles": { "primary": ["soleus"], "secondary": [] },
  "equipment": [{ "en": "Only when type is equipment", "zh": "只係 type 係 equipment 先需要" }],
  "steps": [{ "en": "Step one", "zh": "第一步" }],
  "safety": [{ "en": "Safety note", "zh": "注意事項" }]
}
```

- `id` – unique, lowercase, dashes only. Favourites are stored by id, so don't rename one in use.
- `type` – `solo`, `partner` or `equipment`.
- `perSide` – `true` if done on one side then the other (each side gets its own timer steps).
- `muscles.primary` / `muscles.secondary` – muscle ids. A stretch is listed under each of its primary muscles.
- Optional `holdSeconds` / `sets` override the defaults for one stretch.

Invalid entries are skipped with a warning in the browser console. UI labels live in `src/i18n.ts`.

### Body map and muscle pictures

[`src/bodymap.ts`](src/bodymap.ts) holds the front/back outlines, the region shapes, and each muscle's shape for its location picture. A new muscle needs a shape there (otherwise its picture shows only the outline).

### Demo illustrations

Scenes live in [`src/figure/scenes.ts`](src/figure/scenes.ts), keyed by stretch id. A stretch without a scene still works; it just has no picture. Each scene gives a start pose and an end pose as joint angles (0° = pointing down, 90° = forward, 180° = up), optional equipment, and an optional `arrow` cue. Muscle overlays are placed automatically from the stretch's muscle list (defaults in `src/figure/muscleMap.ts`); a scene can override a position with `hl`.

To preview every illustration, run `npm run dev` and open `http://localhost:5173/stretching/dev/gallery.html` (add `?live` to see them move, `?id=<stretch id>` for one, `?lang=en` for English labels).

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build
```

## Deployment

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.
In the repo's **Settings → Pages**, the source must be **GitHub Actions**.

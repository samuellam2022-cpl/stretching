# 運動後拉筋 · Post-workout Stretch

A muscle-first post-workout stretching app for iPhone, built with Vite + TypeScript and installable as a PWA. Traditional Chinese (Hong Kong) and English.

**Live:** https://samuellam2022-cpl.github.io/stretching/

## How it works

1. **Body map** – a 2D figure you can flip between front and back. Tap the part of the body you trained; it lights up.
2. **Muscle groups** – the groups in that region (e.g. thigh → quadriceps, hamstrings, adductors…). Arm, core and lower leg have no group level and list their muscles directly. Opening a group shows all stretches for the group, with its muscles to pick from.
3. **Stretches** – tap a muscle to see every stretch that has it as a *primary* muscle, filtered by Solo / Partner / Needs equipment.
4. **Stretch page**
   - A picture area (a placeholder while the stretch has no image; the old illustrated demos are hidden for now).
   - Technique, hold time, sets and per side; primary / secondary muscles (tap one to open its stretch list).
   - Timer: hold time × sets, with **left and right timed separately** for per-side stretches (right 1 → left 1 → right 2 → left 2). Tap any step to start from it.
   - Steps, where you should feel it, common mistakes, cautions, easier and harder variations, equipment, and a "Demo videos" button that opens a YouTube search for the English name.
- Favourites are saved on the device (localStorage). Works offline once loaded. Follows dark mode and iPhone **Reduce Motion** (shows the final position without moving).
- Language: tap **中／EN** at the top right. The first visit follows the phone's language; the choice is remembered.

## Install on iPhone

Open the live link in Safari → Share → **Add to Home Screen**.

## Data

All text is bilingual: `{ "en": "...", "zh": "..." }` (`zh` = Traditional Chinese, Hong Kong usage; if empty, English is shown). UI labels live in `src/i18n.ts`.

- [`src/data/muscles.json`](src/data/muscles.json) – three levels: `regions` → `groups` (each has a `region`) → `muscles` (each has a `group`). Names are flat `zh` / `en` fields. Region ids that match a group id (`arm`, `core`, `lower-leg`) mean the region has no real group level. `mapViews` and `alsoVia` on groups are for the future full-body muscle map; the list UI doesn't use them.
- [`src/data/stretches.json`](src/data/stretches.json) – `{ "stretches": [...] }`, one object each: `id`, `name`, `summary`, `technique` (`static` / `dynamic` / `pnf`), `mode` (`solo` / `partner` / `equipment`), `position`, `perSide`, `holdSeconds`, `sets`, `primary` and `secondary` (muscle ids **or group ids**; a group id counts for every muscle in that group), `steps`, `feel`, `mistakes`, `safety`, `easier`, `harder`, `equipment` (only for `mode: "equipment"`) and `image` (`null`, or a path under `public/`).
- `id` – unique, lowercase, dashes only. Favourites are stored by id, so don't rename one in use.

Invalid entries are skipped with a warning in the browser console.

### Body map

[`src/bodymap.ts`](src/bodymap.ts) holds the front/back outlines and the tappable areas. `AREA_REGION` says which `muscles.json` region each area opens. (The per-muscle location pictures in that file are not shown in the lists at the moment.)

### Demo illustrations

These are hidden at the moment (`SHOW_LEGACY_DEMO` in `src/views.ts`); the code is kept. Scenes live in [`src/figure/scenes.ts`](src/figure/scenes.ts), keyed by stretch id. A stretch without a scene still works; it just has no picture. Each scene gives a start pose and an end pose as joint angles (0° = pointing down, 90° = forward, 180° = up), optional equipment, and an optional `arrow` cue. Muscle overlays are placed automatically from the stretch's muscle list (defaults in `src/figure/muscleMap.ts`); a scene can override a position with `hl`.

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

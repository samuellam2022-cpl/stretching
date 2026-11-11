# Stretching

A touch-friendly stretching app for iPhone, built with Vite + TypeScript and installable as a PWA.

**Live:** https://samuellam2022-cpl.github.io/stretching/

## Features

- Browse stretches by body part: neck, shoulders, back, lower back, hips, front of thigh, back of thigh, calves
- Filter each body part by **Solo / Partner / Needs equipment**
- Stretch detail: steps, hold time (seconds, with a built-in countdown timer), safety notes
- Favourites saved on your device (localStorage)
- Animated demonstration for every stretch: a simple figure moves slowly between the start and end positions (about 3 seconds per cycle), with the muscles being stretched shown in red. Partner stretches show two people and equipment is drawn. It follows dark mode, and with iPhone **Reduce Motion** on it shows the final position without moving
- Primary (green) and secondary (grey) muscle tags, plus a **Demo videos** button that opens a YouTube search for the stretch's English name
- English and Traditional Chinese (Hong Kong) – tap **中／EN** at the top right. The first visit follows the phone's language; your choice is remembered
- Works offline once loaded; add it to your Home Screen to use it like an app

## Install on iPhone

Open the live link in Safari → Share → **Add to Home Screen**.

## Adding stretches

All stretch data is in [`src/data/stretches.json`](src/data/stretches.json). Every piece of text is bilingual: `{ "en": "...", "zh": "..." }` (`zh` = Traditional Chinese, Hong Kong usage). Add an object to `stretches`:

```json
{
  "id": "calves-downward-dog",
  "bodyPart": "calves",
  "type": "solo",
  "holdSeconds": 30,
  "perSide": true,
  "name": { "en": "Downward dog calf pedal", "zh": "下犬式踩腳跟" },
  "summary": { "en": "One line shown in the list.", "zh": "列表顯示嘅一句簡介。" },
  "equipment": [{ "en": "Only when type is equipment", "zh": "只係 type 係 equipment 先需要" }],
  "steps": [
    { "en": "Step one", "zh": "第一步" },
    { "en": "Step two", "zh": "第二步" }
  ],
  "safety": [{ "en": "Safety note", "zh": "注意事項" }]
}
```

- `id` – unique, lowercase, dashes only. Favourites are stored by id, so don't rename an id once in use.
- `bodyPart` – one of `neck`, `shoulders`, `back`, `lower-back`, `hips`, `front-thigh`, `back-thigh`, `calves`
- `type` – `solo`, `partner` or `equipment`
- `perSide` – `true` if done on one side then the other (the timer runs both sides)
- `muscles` – `{ "primary": [...], "secondary": [...] }` using ids from the `muscles` list at the top of the file (add new muscles there with `en`/`zh` names)
- If a `zh` text is empty, the English is shown instead.

Invalid entries are skipped with a warning in the browser console. To add a new body part, add it to `bodyParts` in the JSON and to `BodyPartId` in `src/types.ts`. UI labels (buttons, headings) live in `src/i18n.ts`.

### Demo animations

Animations live in [`src/figure/scenes.ts`](src/figure/scenes.ts), keyed by stretch id. A new stretch without an entry still works; it just has no animation. Each scene gives a start pose and an end pose as joint angles (0° = pointing down, 90° = forward, 180° = up), optional equipment, and the muscles to colour red. To preview every animation, run `npm run dev` and open `http://localhost:5173/stretching/dev/gallery.html` (add `?live` to see them move, `?id=<stretch id>` for one).

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

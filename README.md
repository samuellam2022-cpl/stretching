# Stretching

A touch-friendly stretching app for iPhone, built with Vite + TypeScript and installable as a PWA.

**Live:** https://samuellam2022-cpl.github.io/stretching/

## Features

- Browse stretches by body part: neck, shoulders, back, lower back, hips, front of thigh, back of thigh, calves
- Filter each body part by **Solo / Partner / Needs equipment**
- Stretch detail: steps, hold time (seconds, with a built-in countdown timer), safety notes
- Favourites saved on your device (localStorage)
- Works offline once loaded; add it to your Home Screen to use it like an app

## Install on iPhone

Open the live link in Safari → Share → **Add to Home Screen**.

## Adding stretches

All stretch data is in [`src/data/stretches.json`](src/data/stretches.json). Add an object to `stretches`:

```json
{
  "id": "calves-downward-dog",
  "name": "Downward dog calf pedal",
  "bodyPart": "calves",
  "type": "solo",
  "summary": "One line shown in the list.",
  "holdSeconds": 30,
  "perSide": true,
  "equipment": ["Only needed when type is \"equipment\""],
  "steps": ["Step one", "Step two"],
  "safety": ["Safety note"]
}
```

- `id` – unique, lowercase, dashes only. Favourites are stored by id, so don't rename an id once in use.
- `bodyPart` – one of `neck`, `shoulders`, `back`, `lower-back`, `hips`, `front-thigh`, `back-thigh`, `calves`
- `type` – `solo`, `partner` or `equipment`
- `perSide` – `true` if done on one side then the other (the timer runs both sides)

Invalid entries are skipped with a warning in the browser console. To add a new body part, add it to `bodyParts` in the JSON and to `BodyPartId` in `src/types.ts`.

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

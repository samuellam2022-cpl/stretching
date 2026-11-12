import '../src/style.css';
import { getMuscle, stretches } from '../src/data';
import { mountDemo, svgFor, type Demo, type DemoLabel } from '../src/figure/player';
import { sceneFor } from '../src/figure/scenes';

// Dev tool: ?id=<stretch id> for one, ?live for animation, ?lang=en for English labels, ?from=<n>&to=<n> for a range.
const params = new URLSearchParams(location.search);
const only = params.get('id');
const en = params.get('lang') === 'en';
const g = document.getElementById('g')!;
const from = Number(params.get('from') ?? 0);
const to = Number(params.get('to') ?? 999);

stretches.forEach((s, i) => {
  if ((only && s.id !== only) || i < from || i >= to) return;
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.dataset.id = s.id;
  const scene = sceneFor(s.id);
  cell.innerHTML = `<b>${s.id}${scene ? '' : ' — NO SCENE'}</b>`;
  g.append(cell);
  if (!scene) return;
  const label = (id: string, level: DemoLabel['level']): DemoLabel => {
    const m = getMuscle(id)!;
    return { id, level, title: en ? m.name.en : m.name.zh, sub: en ? m.name.zh : m.name.en, levelText: en ? (level === 'primary' ? 'Primary' : 'Secondary') : level === 'primary' ? '主要' : '次要' };
  };
  const demo: Demo = {
    scene,
    muscles: s.muscles,
    labels: [...s.muscles.primary.map((id) => label(id, 'primary')), ...s.muscles.secondary.map((id) => label(id, 'secondary'))],
    arrowText: scene.arrow ? (en ? scene.arrow.label.en : scene.arrow.label.zh) : '',
    aria: s.name.en,
  };
  if (params.has('live')) {
    const box = document.createElement('div');
    cell.append(box);
    mountDemo(box, demo);
  } else {
    cell.insertAdjacentHTML('beforeend', `<div class="pair">${svgFor(demo, 0)}${svgFor(demo, 1)}</div>`);
  }
});

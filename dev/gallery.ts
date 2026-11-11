import '../src/style.css';
import { SCENES } from '../src/figure/scenes';
import { mountDemo, svgFor } from '../src/figure/player';

const params = new URLSearchParams(location.search);
const only = params.get('id');
const g = document.getElementById('g')!;
for (const [id, scene] of Object.entries(SCENES)) {
  if (only && id !== only) continue;
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.innerHTML = `<b>${id}</b>`;
  if (params.has('live')) {
    const box = document.createElement('div');
    cell.append(box);
    mountDemo(box, scene, id);
  } else {
    cell.insertAdjacentHTML('beforeend', `<div class="pair">${svgFor(scene, 0)}${svgFor(scene, 1)}</div>`);
  }
  g.append(cell);
}

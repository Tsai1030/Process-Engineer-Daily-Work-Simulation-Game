import { type Component, h } from '../dom';
import type { HudView } from '../view_models';

const SVG_NS = 'http://www.w3.org/2000/svg';
const FLAG_SIZE = '16';

function createWindFlagIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', FLAG_SIZE);
  svg.setAttribute('height', FLAG_SIZE);
  svg.setAttribute('aria-hidden', 'true');
  const flag = document.createElementNS(SVG_NS, 'path');
  flag.setAttribute('d', 'M2 1v14M2 2l12 3.5L2 9z');
  flag.setAttribute('fill', 'currentColor');
  flag.setAttribute('stroke', 'currentColor');
  flag.setAttribute('stroke-width', '1.5');
  svg.append(flag);
  return svg;
}

export function createHud(): Component<HudView> {
  const date = h('span', { class: 'date' });
  const clock = h('b', { class: 'clock' });
  const day = h('div', { class: 'day' });
  const rankText = document.createTextNode('');
  const company = h('small');
  const windText = document.createTextNode('');
  const windFlag = h('div', { class: 'wind-flag', hidden: true }, createWindFlagIcon(), windText);
  const el = h(
    'div',
    { class: 'hudcol' },
    h('div', { class: 'panel hud' }, h('div', {}, date, clock), day),
    h('div', { class: 'rank' }, rankText, company),
    windFlag,
  );

  return {
    el,
    update(view) {
      date.textContent = view.dateLabel + (view.nightLabel ?? '');
      clock.textContent = view.clock;
      day.textContent = view.dayCount;
      rankText.data = view.rankLine;
      company.textContent = view.company;
      windText.data = view.windFlag ?? '';
      windFlag.hidden = view.windFlag === null;
    },
    destroy() {
      el.remove();
    },
  };
}

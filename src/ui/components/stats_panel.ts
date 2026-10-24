import { type Component, h } from '../dom';
import type { StatRowView, StatsPanelView } from '../view_models';

function createStatRow(view: StatRowView) {
  const label = h('span', { class: 'lab' });
  const fill = h('i');
  const lostCap = h('s', { class: 'cap' });
  const value = h('span', { class: 'v' });
  const max = h('small');
  const el = h(
    'div',
    { class: 'row', 'data-stat': view.stat },
    label,
    h('div', { class: 'bar' }, fill, lostCap),
    h('b', { class: 'num' }, value, max),
  );
  return {
    el,
    update(next: StatRowView, lowBadge: string) {
      label.textContent = next.label;
      label.dataset['lowLabel'] = lowBadge;
      fill.style.width = `${next.value}%`;
      lostCap.style.width = `${next.lostCapPct}%`;
      value.textContent = String(next.value);
      max.textContent = `/${next.max}`;
      el.classList.toggle('low', next.low);
    },
  };
}

function createFavorRow(slots: number) {
  const label = h('span', { class: 'lab' });
  const coinEls = Array.from({ length: slots }, () => h('span', { class: 'coin' }));
  const count = h('b');
  const coins = h('div', { class: 'coins', role: 'img' }, ...coinEls, count);
  const el = h('div', { class: 'row', 'data-stat': 'favor' }, label, coins);
  return {
    el,
    slots,
    update(favor: StatsPanelView['favor']) {
      label.textContent = favor.label;
      coins.setAttribute('aria-label', `${favor.label} ${favor.count}`);
      coinEls.forEach((coin, index) => {
        coin.classList.toggle('off', index >= favor.count);
      });
      count.textContent = String(favor.count);
    },
  };
}

export function createStatsPanel(): Component<StatsPanelView> {
  const title = h('h2');
  const statGrid = h('div', { class: 'stat-grid' });
  const el = h('section', { class: 'panel stats' }, title, statGrid);
  const moneyLabel = h('span', { class: 'lab' });
  const moneyValue = h('span', { class: 'v' });
  const moneyRow = h(
    'div',
    { class: 'row money', 'data-stat': 'money' },
    moneyLabel,
    h('b', { class: 'num' }, moneyValue),
  );
  let rows: ReturnType<typeof createStatRow>[] = [];
  let favorRow: ReturnType<typeof createFavorRow> | null = null;

  return {
    el,
    update(view) {
      el.setAttribute('aria-label', view.ariaLabel);
      title.textContent = view.title;
      if (favorRow === null || rows.length !== view.rows.length || favorRow.slots !== view.favor.slots) {
        rows = view.rows.map(createStatRow);
        favorRow = createFavorRow(view.favor.slots);
        statGrid.replaceChildren(...rows.map((row) => row.el), favorRow.el, moneyRow);
      }
      view.rows.forEach((row, index) => {
        rows[index]?.update(row, view.lowBadge);
      });
      favorRow.update(view.favor);
      moneyLabel.textContent = view.money.label;
      moneyValue.textContent = view.money.text;
    },
    destroy() {
      el.remove();
    },
  };
}

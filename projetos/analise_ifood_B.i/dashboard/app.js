/* Apache ECharts 5.6.0, servido localmente. Agregação apenas dos dados públicos. */
'use strict';
const number = new Intl.NumberFormat('pt-BR');
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const months = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril'];
const labels = { FINISHED: 'Finalizados', CANCELED: 'Cancelados', DELIVERED: 'Concluídos',
  FOOD: 'Alimentação', GOOD: 'Produtos', GOODS: 'Produtos', MOTOBOY: 'Moto', BIKER: 'Bicicleta',
  LOGISTIC_OPERATOR: 'Operador logístico', 'LOGISTIC OPERATOR': 'Operador logístico',
  FREELANCER: 'Autônomo', FREELANCE: 'Autônomo', 'OWN CHANNEL': 'Canal próprio', MARKETPLACE: 'Marketplace' };
const label = value => labels[value] || String(value);
const form = document.querySelector('#filters');
const state = document.querySelector('#state');
const charts = new Map();
let data;

function element(tag, text, parent) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (parent) parent.append(node);
  return node;
}

function filtered(name) {
  const table = data[name];
  const filters = ['mes', 'channel_type', 'store_segment'].map(key => document.getElementById(key).value);
  return table.linhas.filter(row => filters.every((value, i) => value === '' || row[i] === Number(value)));
}

function sum(rows, index) { return rows.reduce((total, row) => total + row[index], 0); }
function ratio(a, b) { return b ? a / b : null; }

function group(tableName, dimension, metric, top = 0) {
  const table = data[tableName];
  const di = table.colunas.indexOf(dimension);
  const mi = table.colunas.indexOf(metric);
  const totals = new Map();
  filtered(tableName).forEach(row => totals.set(row[di], (totals.get(row[di]) || 0) + row[mi]));
  // Mantém horas e meses sem atividade para facilitar a comparação entre recortes.
  if (dimension === 'mes' || dimension === 'hora') {
    data.dimensoes[dimension].forEach((value, i) => {
      if (dimension === 'mes' && value === 0) return;
      if (!totals.has(i)) totals.set(i, 0);
    });
  }
  let result = [...totals].map(([key, value]) => ({
    name: dimension === 'mes' ? months[data.dimensoes[dimension][key]] || 'Sem mês' :
      dimension === 'hora' ? `${data.dimensoes[dimension][key]} h` : label(data.dimensoes[dimension][key]),
    value: metric === 'centavos' ? value / 100 : value,
    key
  }));
  result.sort((a, b) => dimension === 'mes' || dimension === 'hora' ? a.key - b.key : b.value - a.value);
  if (top) result = result.slice(0, top);
  return result;
}

function deliveryGroup(dimension, metric) {
  const table = data.entregas;
  const di = table.colunas.indexOf(dimension);
  const totals = new Map();
  filtered('entregas').forEach(row => {
    const total = totals.get(row[di]) || [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) total[i] += row[5 + i];
    totals.set(row[di], total);
  });
  return [...totals].map(([key, t]) => ({ name: label(data.dimensoes[dimension][key]),
    value: metric === 'distance' ? ratio(t[1], t[2]) === null ? null : t[1] / t[2] / 1000 :
      metric === 'completed' ? ratio(t[3], t[0]) : t[0]
  })).sort((a, b) => (b.value || 0) - (a.value || 0));
}

function plot(id, entries, { horizontal = false, format = number, line = false } = {}) {
  const host = document.getElementById(id);
  let chart = charts.get(id);
  if (!chart) {
    chart = echarts.init(host, null, { renderer: 'svg' });
    charts.set(id, chart);
    const details = element('details', undefined, host.parentElement);
    element('summary', 'Ver dados em tabela', details);
    const scroll = element('div', undefined, details);
    scroll.className = 'table-scroll';
    const table = element('table', undefined, scroll);
    table.setAttribute('aria-label', host.parentElement.querySelector('h3').textContent);
  }
  const currency = format === money;
  const percentage = format === percent;
  const display = value => value === null ? '—' : format.format(value);
  const categories = entries.map(d => d.name);
  const numericAxis = { type: 'value', max: percentage ? 1 : undefined,
    splitNumber: window.innerWidth < 500 ? 3 : 5,
    axisLabel: { hideOverlap: true, formatter: v => percentage ? percent.format(v) : (currency ? 'R$ ' : '') + compact.format(v) },
    splitLine: { lineStyle: { color: '#e6ebee' } } };
  const categoryAxis = { type: 'category', data: categories,
    axisTick: { show: false }, axisLine: { lineStyle: { color: '#aeb9c1' } },
    axisLabel: { width: horizontal ? (window.innerWidth < 500 ? 95 : 145) : 90,
      overflow: 'truncate', interval: line && entries.length > 12 ? 3 : 'auto', fontSize: 11 }, inverse: horizontal };
  chart.setOption({
    animation: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    animationDuration: 250,
    textStyle: { fontFamily: 'Open Sans, sans-serif', color: '#3d4449' },
    aria: { enabled: true, label: { description: host.parentElement.querySelector('h3').textContent + '. Dados disponíveis na tabela após o gráfico.' } },
    grid: { top: 16, right: currency ? 30 : 20, bottom: 22, left: 8, containLabel: true },
    tooltip: { trigger: 'axis', confine: true, renderMode: 'richText',
      valueFormatter: display },
    xAxis: horizontal ? numericAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : numericAxis,
    series: [{ type: line ? 'line' : 'bar', data: entries.map(d => d.value),
      itemStyle: { color: '#0090e8' }, lineStyle: { width: 3 }, symbolSize: 5, barMaxWidth: 42 }],
    graphic: entries.length ? [] : [{ type: 'text', left: 'center', top: 'middle',
      style: { text: 'Sem dados neste recorte', fill: '#56616a', fontSize: 14 } }]
  }, true);
  const table = host.parentElement.querySelector('table');
  table.replaceChildren();
  const head = element('tr', undefined, element('thead', undefined, table));
  element('th', 'Categoria', head).scope = 'col';
  element('th', 'Valor', head).scope = 'col';
  const body = element('tbody', undefined, table);
  entries.forEach(entry => {
    const row = element('tr', undefined, body);
    element('th', entry.name, row).scope = 'row';
    element('td', display(entry.value), row);
  });
  if (!entries.length) element('td', 'Sem dados neste recorte', element('tr', undefined, body));
}

function render() {
  const rows = filtered('cubo');
  const deliveries = filtered('entregas');
  const count = sum(rows, 5), revenue = sum(rows, 6) / 100;
  const statuses = data.dimensoes.order_status;
  const canceled = sum(rows.filter(r => statuses[r[4]] === 'CANCELED'), 5);
  const completed = sum(rows.filter(r => statuses[r[4]] === 'FINISHED'), 5);
  const distance = ratio(sum(deliveries, 6), sum(deliveries, 7));
  const kpis = [
    ['Pedidos', count, number], ['Faturamento', revenue, money],
    ['Ticket médio', ratio(revenue, count), money], ['Cancelados', ratio(canceled, count), percent],
    ['Concluídos (pedidos)', ratio(completed, count), percent], ['Entregas', sum(deliveries, 5), number],
    ['Distância média', distance === null ? null : distance / 1000, decimal, ' km']
  ];
  const host = document.getElementById('kpis');
  host.replaceChildren();
  kpis.forEach(([title, value, formatter, suffix = '']) => {
    const block = element('div', undefined, host);
    element('dt', title, block);
    element('dd', value === null ? '—' : formatter.format(value) + suffix, block);
  });
  const selection = [...form.querySelectorAll('select')].filter(s => s.value !== '')
    .map(s => s.options[s.selectedIndex].textContent);
  state.textContent = `${selection.length ? selection.join(' · ') : 'Todos os dados'} · ${number.format(count)} pedidos${count ? '' : ' · Sem pedidos neste recorte'}`;
  plot('chart-month', group('cubo', 'mes', 'pedidos'), { line: true });
  plot('chart-status', group('cubo', 'order_status', 'pedidos'), { horizontal: true });
  plot('chart-hour', group('horas', 'hora', 'pedidos'), { line: true });
  plot('chart-channel', group('canais', 'channel_name', 'pedidos', 10), { horizontal: true });
  plot('chart-store', group('lojas', 'store_name', 'centavos', 10), { horizontal: true, format: money });
  plot('chart-segment', group('cubo', 'store_segment', 'centavos'), { horizontal: true, format: money });
  plot('chart-city', group('cubo', 'hub_city', 'pedidos'), { horizontal: true });
  plot('chart-type', deliveryGroup('driver_type', 'count'), { horizontal: true });
  plot('chart-modal', deliveryGroup('driver_modal', 'count'), { horizontal: true });
  plot('chart-distance', deliveryGroup('driver_modal', 'distance'), { horizontal: true, format: decimal });
  plot('chart-completed', deliveryGroup('driver_modal', 'completed'), { horizontal: true, format: percent });
}

async function start() {
  try {
    const response = await fetch('dados.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
    if (!window.echarts) throw new Error('Biblioteca de gráficos indisponível');
    ['mes', 'channel_type', 'store_segment'].forEach(key => {
      const select = document.getElementById(key);
      data.dimensoes[key].forEach((value, i) => {
        const option = element('option', key === 'mes' ? months[value] || 'Sem pedido associado' : label(value), select);
        option.value = i;
      });
    });
    render();
    form.querySelectorAll('select, button').forEach(control => { control.disabled = false; });
    form.addEventListener('change', render);
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('reset', () => requestAnimationFrame(render));
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        charts.forEach(chart => chart.resize());
        render();
      }, 120);
    });
  } catch (error) {
    state.classList.add('error');
    state.textContent = 'Não foi possível carregar o dashboard. Recarregue a página para tentar novamente.';
    console.error('Falha ao carregar dashboard:', error);
  }
}
start();

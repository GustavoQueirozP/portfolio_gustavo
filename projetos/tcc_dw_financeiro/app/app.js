/* Reimplementação estática sobre a captura pública. Não requer API ou build. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const number = v => v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null;
  const fmt = (v, digits = 2) => number(v) === null ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const pct = v => number(v) === null ? '—' : `${fmt(v)}%`;
  const money = v => number(v) === null ? '—' : `R$ ${fmt(v)}`;
  const millions = v => number(v) === null ? '—' : `${money(v)} mi`;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const model = v => v === 'REGRESSAO_LINEAR' ? 'Regressão linear' : v === 'ARIMA' ? 'ARIMA' : 'Histórico';
  const variable = v => ({ receita_liquida: 'Receita líquida', lucro_liquido: 'Lucro líquido', preco_medio_anual: 'Preço médio anual', preco_medio: 'Preço médio', preco: 'Preço médio' }[v] || v);
  const state = { company: 'TOTS3', year: '2025', indicator: 'roe_pct', variable: 'receita_liquida', from: '2018-01-01', to: '2026-12-31' };
  const screens = {
    visao: ['Visão executiva', 'Desempenho anual e posição relativa das empresas de tecnologia da B3.'],
    historico: ['Histórico de indicadores', 'Acompanhe a evolução dos fundamentos, com os valores anuais da captura.'],
    comparativo: ['Comparativo setorial', 'Compare empresas do mesmo setor e explore o ranking por score.'],
    mercado: ['Mercado e cotações', 'Fechamento e médias móveis no último pregão disponível de cada semana.'],
    projecoes: ['Projeções', 'Histórico e cenários de receita, lucro e preço para 2026–2028.'],
    confiabilidade: ['Confiabilidade dos modelos', 'Qualidade do ajuste histórico e validação parcial das projeções de preço.']
  };
  const metrics = {
    roe_pct: ['ROE', pct], roa_pct: ['ROA', pct], margem_bruta_pct: ['Margem bruta', pct], margem_ebitda_pct: ['Margem EBITDA', pct], margem_liquida_pct: ['Margem líquida', pct],
    liquidez_corrente: ['Liquidez corrente', fmt], endividamento_pct: ['Endividamento', pct], cresc_receita_yoy_pct: ['Crescimento de receita (YoY)', pct], cresc_lucro_yoy_pct: ['Crescimento de lucro (YoY)', pct],
    score_investimento: ['Score de investimento', fmt], receita_m: ['Receita líquida', millions], lucro_m: ['Lucro líquido', millions]
  };
  let data, charts = [], screen = 'visao';
  function select(id, label, options, selected) {
    return `<label for="${id}">${label}<select id="${id}">${options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(selected) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  }
  function filters() {
    let html = '';
    if (['historico', 'mercado', 'projecoes'].includes(screen)) html += select('company', 'Empresa', data.empresas.map(e => [e.ticker, `${e.ticker} · ${e.nome_empresa}`]), state.company);
    if (['visao', 'comparativo'].includes(screen)) html += select('year', 'Exercício', [['todos', 'Mais recente por empresa'], ...Object.keys(data.ranking).filter(k => k !== 'todos').reverse().map(k => [k, k])], state.year);
    if (screen === 'historico') html += select('indicator', 'Indicador', Object.entries(metrics).map(([k, v]) => [k, v[0]]), state.indicator);
    if (screen === 'projecoes') html += select('variable', 'Variável', [['receita_liquida', 'Receita líquida'], ['lucro_liquido', 'Lucro líquido']], state.variable);
    if (screen === 'mercado') html += `<label for="from">Desde<input id="from" type="date" value="${state.from}"></label><label for="to">Até<input id="to" type="date" value="${state.to}"></label>`;
    $('filtros').innerHTML = html;
    $('filtros').hidden = !html;
    $('filtros').onchange = event => { state[event.target.id] = event.target.value; render(); };
    $('filtros').onsubmit = event => event.preventDefault();
  }
  const kpi = (label, value, note = '') => `<article class="kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></article>`;
  const panel = (title, body, note = '') => `<section class="panel"><h2>${esc(title)}</h2>${note ? `<p>${esc(note)}</p>` : ''}${body}</section>`;
  function table(caption, headers, rows) {
    return `<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(caption)}"><table><caption>${esc(caption)}</caption><thead><tr>${headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((v, i) => i ? `<td>${v}</td>` : `<th scope="row">${v}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  const chartHTML = (id, label) => `<div class="chart" id="${id}" role="img" aria-label="${esc(label)}"></div>`;
  function chart(id, labels, series, format = fmt, extra = {}) {
    const instance = echarts.init($(id), null, { renderer: 'svg' });
    charts.push(instance);
    instance.setOption({ animation: false, color: ['#0069a8', '#b07129', '#176b53', '#6d5ba6'], textStyle: { fontFamily: 'Segoe UI, Arial, sans-serif' },
      tooltip: { trigger: 'axis', confine: true, valueFormatter: v => format(v) },
      legend: { top: 8, type: 'scroll', textStyle: { color: '#536575' } },
      grid: { left: 12, right: 22, top: 65, bottom: 35, containLabel: true },
      xAxis: { type: 'category', data: labels, axisLabel: { color: '#536575', hideOverlap: true }, axisLine: { lineStyle: { color: '#c4d0d9' } } },
      yAxis: { type: 'value', axisLabel: { color: '#536575', formatter: v => Math.abs(v) >= 1000000 ? `${fmt(v / 1e6, 0)} mi` : fmt(v, 0) }, splitLine: { lineStyle: { color: '#e7edf1' } } },
      series: series.map(s => ({ type: 'line', showSymbol: false, connectNulls: false, ...s })), ...extra });
  }
  function latest(rows) {
    const result = new Map();
    rows.forEach(r => { if (!result.has(r.ticker) || r.ano > result.get(r.ticker).ano) result.set(r.ticker, r); });
    return [...result.values()];
  }
  function ranking() { const rows = data.ranking[state.year] || []; return state.year === 'todos' ? latest(rows).sort((a, b) => Number(b.score_investimento) - Number(a.score_investimento)) : rows.slice().sort((a, b) => Number(a.rank_score) - Number(b.rank_score)); }
  function executive() {
    const rows = state.year === 'todos' ? latest(data['dashboard-executivo'].todos) : data['dashboard-executivo'][state.year];
    const sum = key => rows.reduce((acc, r) => acc + (number(r[key]) ?? 0), 0);
    const mean = key => { const values = rows.map(r => number(r[key])).filter(v => v !== null); return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null; };
    const rank = ranking();
    $('painel').innerHTML = `<div class="kpis">${kpi('Receita líquida total', millions(sum('receita_liquida') / 1e6), `${rows.length} empresas no recorte`)}${kpi('Lucro líquido total', millions(sum('lucro_liquido') / 1e6))}${kpi('ROE médio', pct(mean('roe') === null ? null : mean('roe') * 100), 'Média simples entre empresas')}${kpi('Margem líquida média', pct(mean('margem_liquida') === null ? null : mean('margem_liquida') * 100), 'Média simples entre empresas')}</div>` +
      panel('Fundamentos por empresa', chartHTML('executive-chart', 'Receita e lucro por empresa, em milhões de reais') + table('Demonstrações anuais · valores exatos da captura', ['Empresa', 'Ano', 'Receita líquida', 'Lucro líquido', 'ROE', 'Margem líquida', 'Score'], rows.map(r => [`${esc(r.ticker)}<small>${esc(r.nome_empresa)}</small>`, r.ano, millions(Number(r.receita_liquida) / 1e6), millions(Number(r.lucro_liquido) / 1e6), pct(number(r.roe) === null ? null : Number(r.roe) * 100), pct(number(r.margem_liquida) === null ? null : Number(r.margem_liquida) * 100), fmt(r.score_investimento)]))) +
      panel('Top 3 por score', table('Posição no recorte selecionado', ['Posição', 'Empresa', 'Ano', 'Score / 10'], rank.slice(0, 3).map((r, i) => [i + 1, esc(r.ticker), r.ano, fmt(r.score_investimento)])), 'O score pondera ROE (30%), margem e crescimento (20% cada), endividamento e liquidez (15% cada). Dados ausentes recebem nota neutra 5.') +
      panel('Simulador de investimento', `<p>Compare um cenário ARIMA com taxas hipotéticas de renda fixa. A simulação usa a última cotação capturada, independentemente do exercício acima.</p><form class="filters" id="simulation">${select('sim-company', 'Empresa', data.empresas.map(e => [e.ticker, e.ticker]), rank[0]?.ticker || 'TOTS3')}<label for="capital">Aporte (R$)<input id="capital" type="number" min="0.01" max="1000000000000" step="0.01" value="1000"></label>${select('target', 'Ano-alvo', [2026, 2027, 2028].map(y => [y, y]), 2026)}<label for="selic">Tesouro Selic (% a.a.)<input id="selic" type="number" min="0" max="100" step="0.1" value="11"></label><label for="lci">LCI/LCA (% a.a.)<input id="lci" type="number" min="0" max="100" step="0.1" value="10"></label><label for="saving">Poupança (% a.a.)<input id="saving" type="number" min="0" max="100" step="0.1" value="6"></label></form><div id="allocation" aria-live="polite"></div><p class="note">Taxas editáveis são premissas ilustrativas. Sem dividendos, taxas ou impostos. Ações inteiras; a sobra do aporte fica fora da posição em ações. Capitalização da renda fixa até dezembro do ano-alvo, a partir da última cotação capturada.</p>`);
    chart('executive-chart', rows.map(r => r.ticker), [{ name: 'Receita líquida · R$ mi', type: 'bar', data: rows.map(r => number(r.receita_liquida) / 1e6) }, { name: 'Lucro líquido · R$ mi', type: 'bar', data: rows.map(r => number(r.lucro_liquido) / 1e6) }], millions);
    $('simulation').querySelectorAll('input').forEach(input => { input.required = true; });
    const simulate = () => {
      if (!$('simulation').checkValidity()) { $('allocation').innerHTML = '<p>Informe um aporte positivo e taxas entre 0 e 100%.</p>'; return; }
      const capital = number($('capital').value), ticker = $('sim-company').value, year = Number($('target').value);
      const last = data['mercado-semanal'][ticker].at(-1), current = Number(last.fechamento);
      const projection = data['preco-projetado'][ticker].find(r => r.ano === year && r.tipo_dado === 'PROJECAO');
      const r2 = data['r2-modelos'].find(r => r.ticker === ticker && /preco/.test(r.variavel))?.r2;
      const quantity = Math.floor(capital / current), invested = quantity * current, final = quantity * Number(projection.preco_medio);
      const months = Math.max(0, (year - Number(last.data_calendario.slice(0, 4))) * 12 + 12 - Number(last.data_calendario.slice(5, 7)));
      const alternatives = [['Tesouro Selic', 'selic'], ['LCI/LCA', 'lci'], ['Poupança', 'saving']].map(([name, id]) => { const value = capital * (1 + Number($(id).value) / 100) ** (months / 12); return [name, money(value), money(value - capital), pct((value / capital - 1) * 100)]; });
      $('allocation').innerHTML = `<p>${esc(ticker)} · ${quantity} ações a ${money(current)} (último pregão: ${last.data_calendario.slice(0, 10).split('-').reverse().join('/')}). Investido: ${money(invested)}; sobra: ${money(capital - invested)}. Preço ARIMA ${year}: ${money(projection.preco_medio)}; IC 95%: ${money(projection.intervalo_inf)} a ${money(projection.intervalo_sup)}; R²: ${fmt(r2, 3)}.</p>` + table('Cenários ilustrativos · bases de capital indicadas acima', ['Aplicação', 'Valor final', 'Retorno em R$', 'Retorno %'], [[`${ticker} · ARIMA`, money(final), money(final - invested), invested > 0 ? pct((final / invested - 1) * 100) : '—'], ...alternatives]);
    };
    $('simulation').oninput = simulate; $('simulation').onsubmit = e => e.preventDefault(); simulate();
  }
  function history() {
    const rows = data.indicadores[state.company].slice().sort((a, b) => a.ano - b.ano), [label, format] = metrics[state.indicator];
    const valid = rows.filter(r => number(r[state.indicator]) !== null), first = valid[0], last = valid.at(-1);
    let cagr = '';
    if (['receita_m', 'lucro_m'].includes(state.indicator)) {
      const start = number(first?.[state.indicator]), end = number(last?.[state.indicator]), years = last?.ano - first?.ano;
      cagr = start > 0 && end > 0 && years > 0 ? `CAGR ${first.ano}–${last.ano}: ${pct((Math.pow(end / start, 1 / years) - 1) * 100)} ao ano.` : 'CAGR indisponível: exige valores extremos positivos e mais de um exercício.';
    }
    $('painel').innerHTML = `<div class="kpis">${kpi(label, format(last?.[state.indicator]), `Último exercício disponível: ${last?.ano ?? '—'}`)}${kpi('Cobertura', `${rows.length} anos`, `${rows[0]?.ano}–${rows.at(-1)?.ano}`)}</div>` + panel(`${state.company} · ${label}`, chartHTML('history-chart', `Evolução anual de ${label}`), cagr || 'Lacunas são preservadas; valores ausentes não são tratados como zero.') + panel('Série anual', table('Valores do indicador selecionado', ['Ano', label], rows.map(r => [r.ano, format(r[state.indicator])])) + `<details><summary>Todos os indicadores financeiros</summary>${table('Indicadores e múltiplos disponíveis', ['Ano', ...Object.values(metrics).map(v => v[0]), 'EBITDA (R$ mi)', 'PL (R$ mi)', 'Dívida líquida (R$ mi)', 'P/L', 'P/VP', 'EV/EBITDA'], rows.map(r => [r.ano, ...Object.entries(metrics).map(([k, v]) => v[1](r[k])), millions(r.ebitda_m), millions(r.pl_m), millions(r.divida_liq_m), fmt(r.pl_ratio), fmt(r.pvp_ratio), fmt(r.ev_ebitda)]))}</details>`);
    chart('history-chart', rows.map(r => String(r.ano)), [{ name: label, data: rows.map(r => number(r[state.indicator])) }], format);
  }
  function comparison() {
    const rows = ranking();
    $('painel').innerHTML = panel('Top 5 por score', chartHTML('rank-chart', 'Cinco maiores scores do ano selecionado'), 'Score de 0 a 10. A posição reflete o recorte; não é uma recomendação de investimento.') + panel('Ranking setorial', table('Indicadores e posições por métrica · menor endividamento é melhor', ['Empresa', 'Ano', 'Score', 'ROE', 'Margem líquida', 'Cresc. receita', 'Liquidez', 'Endividamento'], rows.map((r, i) => [`${i + 1}. ${esc(r.ticker)}<small>${esc(r.nome_empresa)} · ${esc(r.subsetor)}</small>`, r.ano, `${fmt(r.score_investimento)}<small>posição ${esc(r.rank_score)}</small>`, `${pct(r.roe_pct)}<small>posição ${esc(r.rank_roe)}</small>`, `${pct(r.margem_liquida_pct)}<small>posição ${esc(r.rank_margem)}</small>`, `${pct(r.cresc_receita_pct)}<small>posição ${esc(r.rank_crescimento)}</small>`, `${fmt(r.liquidez_corrente)}<small>posição ${esc(r.rank_liquidez)}</small>`, `${pct(r.endividamento_pct)}<small>posição ${esc(r.rank_endividamento)}</small>`])));
    chart('rank-chart', rows.slice(0, 5).map(r => r.ticker), [{ name: 'Score / 10', type: 'bar', data: rows.slice(0, 5).map(r => number(r.score_investimento)), barMaxWidth: 64 }], fmt, { yAxis: { type: 'value', min: 0, max: 10 } });
  }
  function market() {
    if (state.from && state.to && state.from > state.to) { $('painel').innerHTML = '<p class="empty">O início do período deve ser anterior ou igual ao fim. Ajuste as datas acima.</p>'; return; }
    const rows = data['mercado-semanal'][state.company].filter(r => (!state.from || r.data_calendario.slice(0, 10) >= state.from) && (!state.to || r.data_calendario.slice(0, 10) <= state.to));
    if (!rows.length) { $('painel').innerHTML = '<p class="empty">Nenhum pregão semanal neste período. Amplie as datas ou escolha outra empresa.</p>'; return; }
    const last = rows.at(-1), first = rows[0], variation = Number(first.fechamento) ? (Number(last.fechamento) / Number(first.fechamento) - 1) * 100 : null;
    const dateLabel = s => new Date(`${s.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR');
    $('painel').innerHTML = `<div class="kpis">${kpi('Último fechamento no recorte', money(last.fechamento), dateLabel(last.data_calendario))}${kpi('Variação no recorte', pct(variation), 'Entre o primeiro e o último fechamento semanal')}${kpi('Média de 21 pregões', money(last.media_21))}${kpi('Média de 200 pregões', money(last.media_200))}</div>` + panel(`${state.company} · Cotação semanal`, chartHTML('price-chart', 'Fechamento e médias móveis de 21 e 200 pregões'), 'Amostra do último pregão da semana ISO. Preços e médias de 21/200 pregões preservados da série diária; não são médias semanais.') + panel('Volume do pregão amostrado', chartHTML('volume-chart', 'Volume do último pregão de cada semana'), 'Volume do dia selecionado, não a soma da semana.') + panel('Dados de mercado', `<details><summary>Consultar ${rows.length} pregões semanais</summary>${table('Amostra semanal · do mais recente ao mais antigo', ['Data', 'Fechamento', 'MM 21', 'MM 200', 'Volume do dia'], rows.slice().reverse().map(r => [dateLabel(r.data_calendario), money(r.fechamento), money(r.media_21), money(r.media_200), fmt(r.volume, 0)]))}</details>`);
    const labels = rows.map(r => dateLabel(r.data_calendario));
    chart('price-chart', labels, [['Fechamento', 'fechamento'], ['MM 21 pregões', 'media_21'], ['MM 200 pregões', 'media_200']].map(([name, key]) => ({ name, data: rows.map(r => number(r[key])) })), money, { dataZoom: [{ type: 'inside' }] });
    chart('volume-chart', labels, [{ name: 'Volume do dia', type: 'bar', data: rows.map(r => number(r.volume)) }], v => fmt(v, 0));
  }
  function forecastSeries(rows, value, low, high) {
    const years = [...new Set(rows.map(r => r.ano))].sort();
    const models = [...new Set(rows.map(r => r.tipo_modelo).filter(Boolean))];
    const series = [{ name: 'Histórico', data: years.map(y => number(rows.find(r => r.ano === y && r.tipo_dado === 'HISTORICO')?.[value])) }];
    for (const m of models) {
      const find = y => rows.find(r => r.ano === y && r.tipo_modelo === m);
      series.push({ name: model(m), data: years.map(y => number(find(y)?.[value])), lineStyle: { type: 'dashed' }, showSymbol: true });
      series.push({ name: `IC 95% inferior · ${model(m)}`, data: years.map(y => number(find(y)?.[low])), lineStyle: { width: 1, type: 'dotted' }, symbol: 'none' });
      series.push({ name: `IC 95% superior · ${model(m)}`, data: years.map(y => number(find(y)?.[high])), lineStyle: { width: 1, type: 'dotted' }, symbol: 'none' });
    }
    return { years, series };
  }
  function forecasts() {
    const rows = data.projecoes[state.company].filter(r => r.variavel === state.variable), predicted = rows.filter(r => r.tipo_dado !== 'HISTORICO');
    const prices = data['preco-projetado'][state.company], priceR2 = data['r2-modelos'].find(r => r.ticker === state.company && r.tipo_modelo === 'ARIMA' && /preco/.test(r.variavel))?.r2;
    $('painel').innerHTML = `<div class="model-note"><p>Intervalos de confiança / predição de 95% publicados pelo modelo. O R² mede o ajuste ao histórico e não garante acerto futuro. Valores negativos ou faixas amplas são mantidos como limitação do modelo.</p></div>` + panel(`${state.company} · ${variable(state.variable)}`, chartHTML('forecast-chart', 'Histórico e projeções financeiras com limites de 95%'), 'Valores em milhões de reais. Limites pontilhados e projeções tracejadas.') + panel('Projeções financeiras detalhadas', table('Cenários 2026–2028 · R$ milhões', ['Ano', 'Modelo', 'Projeção', 'IC 95% inferior', 'IC 95% superior', 'R²'], predicted.map(r => [r.ano, model(r.tipo_modelo), millions(r.valor_m), millions(r.intervalo_inf_m), millions(r.intervalo_sup_m), fmt(r.r2, 3)]))) + panel('Preço médio anual · ARIMA', chartHTML('forecast-price-chart', 'Preço médio histórico e projetado com limites de 95%') + table('Preço projetado · R² do ARIMA: ' + fmt(priceR2, 3), ['Ano', 'Preço médio', 'IC 95% inferior', 'IC 95% superior', 'R²'], prices.filter(r => r.tipo_dado !== 'HISTORICO').map(r => [r.ano, money(r.preco_medio), money(r.intervalo_inf), money(r.intervalo_sup), fmt(priceR2, 3)])), 'Preço médio anual estimado, não preço-alvo. A estimação de preço utiliza a série mensal no projeto original.');
    const financial = forecastSeries(rows, 'valor_m', 'intervalo_inf_m', 'intervalo_sup_m');
    chart('forecast-chart', financial.years, financial.series, millions);
    const price = forecastSeries(prices, 'preco_medio', 'intervalo_inf', 'intervalo_sup');
    chart('forecast-price-chart', price.years, price.series, money);
  }
  function reliability() {
    const rows = data['r2-modelos'], validation = data['validacao-preco'];
    const inside = validation.filter(r => r.dentro_ic === true).length;
    const deviations = validation.map(r => number(r.desvio_pct)).filter(v => v !== null);
    const groups = new Map();
    rows.forEach(r => { const key = `${r.variavel}|${r.tipo_modelo}`; if (!groups.has(key)) groups.set(key, []); if (number(r.r2) !== null) groups.get(key).push(Number(r.r2)); });
    const averages = [...groups].map(([key, values]) => { const [v, m] = key.split('|'); return { label: `${variable(v)} · ${model(m)}`, value: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null }; });
    $('painel').innerHTML = `<div class="model-note"><p>R² indica quanto o modelo explica da variação histórica dos dados; um valor alto não garante boas previsões e um valor negativo pode indicar ajuste pior que a média.</p></div><div class="kpis">${kpi('Dentro do intervalo de 95%', pct(inside / validation.length * 100), `${inside} de ${validation.length} empresas · preço em 2026`)}${kpi('Desvio médio absoluto', pct(deviations.reduce((a, b) => a + Math.abs(b), 0) / deviations.length), 'Preço real parcial vs. projeção ARIMA')}${kpi('Ajustes avaliados', String(rows.length), 'Empresa × variável × modelo')}</div>` + panel('Preço de 2026 · validação parcial', table('Preço médio observado até a captura; exercício ainda incompleto', ['Empresa', 'Real parcial', 'ARIMA', 'IC 95% inferior', 'IC 95% superior', 'Desvio', 'Dentro do IC?'], validation.map(r => [esc(r.ticker), money(r.preco_medio_real), money(r.projecao_arima), money(r.ic_inf), money(r.ic_sup), pct(r.desvio_pct), r.dentro_ic ? 'Sim' : 'Não'])), 'Comparação parcial: o preço médio de 2026 ainda pode mudar. Estar dentro de uma faixa muito ampla não prova precisão.') + panel('R² médio por variável e modelo', chartHTML('r2-chart', 'Médias simples do R quadrado por variável e modelo') + table('Média simples dos R² disponíveis', ['Variável / modelo', 'R² médio'], averages.map(r => [esc(r.label), fmt(r.value, 3)]))) + panel('Ajustes por empresa', table('R² histórico de cada combinação', ['Empresa', 'Variável', 'Modelo', 'R²'], rows.map(r => [esc(r.ticker), esc(variable(r.variavel)), model(r.tipo_modelo), fmt(r.r2, 3)])));
    chart('r2-chart', averages.map(r => r.label), [{ name: 'R² médio', type: 'bar', data: averages.map(r => r.value) }], v => fmt(v, 3), { yAxis: { type: 'value', axisLabel: { formatter: v => fmt(v, 1) } }, xAxis: { type: 'category', data: averages.map(r => r.label.replace(' · ', '\n')), axisLabel: { fontSize: 10, interval: 0, width: 65, overflow: 'break' } } });
  }
  function render() {
    if (!data) return;
    charts.forEach(c => c.dispose()); charts = [];
    screen = Object.hasOwn(screens, location.hash.slice(1)) ? location.hash.slice(1) : 'visao';
    $('titulo').textContent = screens[screen][0]; $('descricao').textContent = screens[screen][1];
    document.title = `${screens[screen][0]} — DW Financeiro`;
    document.querySelectorAll('.navigation a').forEach(a => { if (a.hash === `#${screen}`) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    filters();
    try { ({ visao: executive, historico: history, comparativo: comparison, mercado: market, projecoes: forecasts, confiabilidade: reliability })[screen](); $('status').textContent = ''; }
    catch (error) { $('status').textContent = 'Não foi possível apresentar esta tela. Recarregue a página para tentar novamente.'; console.error(error); }
  }
  async function init() {
    try {
      const names = ['empresas', 'dashboard-executivo', 'ranking', 'indicadores', 'mercado-semanal', 'projecoes', 'preco-projetado', 'r2-modelos', 'validacao-preco'];
      data = Object.fromEntries(await Promise.all(names.map(async name => { const response = await fetch(`dados/${name}.json`); if (!response.ok) throw new Error(`Dados indisponíveis: ${name}`); return [name, await response.json()]; })));
      if (!window.echarts) throw new Error('Biblioteca de gráficos indisponível');
      render();
    } catch (error) { $('status').innerHTML = 'Não foi possível carregar os dados. Verifique a conexão e <button type="button" id="retry">Tentar novamente</button>.'; $('retry').onclick = init; console.error(error); }
  }
  window.addEventListener('hashchange', render);
  window.addEventListener('resize', () => charts.forEach(c => c.resize()));
  document.querySelector('.skip').addEventListener('click', event => {
    event.preventDefault();
    $('conteudo').focus();
    $('conteudo').scrollIntoView({ block: 'start' });
  });
  init();
})();

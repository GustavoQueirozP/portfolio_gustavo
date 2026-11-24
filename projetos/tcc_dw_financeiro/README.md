# TCC — demonstração pública

Abra `index.html` (case) ou `app/` por um servidor HTTP. Não há build, API,
armazenamento de credenciais ou dependência de rede para carregar os gráficos.
O ECharts 5 é compartilhado com o restante do portfólio.

## Dados

As respostas JSON foram capturadas em 24/11/2026. Essa é a data da captura,
não a data final das séries: DFP 2018–2025, cotações até maio de 2026 e
projeções 2026–2028. A versão publicada usa apenas dados públicos.

`scripts/reduzir_mercado_tcc.py` seleciona o último pregão disponível por
semana ISO e ticker. Preserva fechamento, volume e médias móveis desse dia.
Não soma volume nem recalcula médias. O arquivo diário só é removido depois
de gravar e validar uma saída inferior a 400.000 bytes. Executar novamente
com a saída já pronta não modifica os dados.

## Telas e fontes

| Hash | Conteúdo | JSON |
| --- | --- | --- |
| `#visao` | KPIs, valores por empresa, Top 3 e simulador | dashboard-executivo, ranking, mercado-semanal, preco-projetado, r2-modelos |
| `#historico` | Empresa, 12 indicadores e CAGR quando calculável | indicadores por ticker |
| `#comparativo` | Ano, Top 5 e posições por métrica | ranking |
| `#mercado` | Empresa, datas, fechamento, MM21, MM200 e volume | mercado-semanal |
| `#projecoes` | Empresa, receita/lucro, modelos e preços | projecoes, preco-projetado, r2-modelos |
| `#confiabilidade` | Validação parcial de 2026 e R² individual/médio | validacao-preco, r2-modelos |

Valores nulos e não finitos aparecem como “—”. Percentuais do dashboard
executivo chegam como frações; os indicadores e o ranking já chegam em
pontos percentuais. Valores de demonstrações no dashboard estão em reais;
as séries com sufixo `_m` já estão em milhões. O filtro “mais recente”
seleciona um único exercício por empresa, evitando somar vários anos.

O simulador usa ações inteiras, a última cotação disponível e o preço médio
ARIMA do ano escolhido, com IC de 95% e R². O saldo não investido é informado
separadamente. As taxas de renda fixa são premissas editáveis (11%, 10%, 6%),
capitalizadas até dezembro do ano-alvo a partir do mês da última cotação.
Não há interpolação mensal nesta versão. Retornos não incluem dividendos,
taxas ou impostos. Uma projeção de preço médio anual não é um preço-alvo.

## Visual e acessibilidade

O app usa azul `#0069a8`, tinta `#202e3b`, texto secundário `#536575`,
fundo `#f3f6f8` e superfícies brancas. KPIs, filtros e tabelas mantêm números
tabulares em pt-BR. Em telas estreitas, a navegação e as tabelas podem ser
roladas horizontalmente dentro de suas próprias regiões. Gráficos têm
descrições e tabelas com os dados correspondentes. O case mantém a
estrutura editorial do portfólio com CSS e fontes locais.

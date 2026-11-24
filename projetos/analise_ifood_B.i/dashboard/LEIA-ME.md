# Dashboard iFood

Dados: iFood/Kaggle, jan–abr/2021. Página estática, sem build ou consulta ao Postgres.
Abra por HTTP (por exemplo, `uv run python -m http.server` na raiz do repositório),
em `/projetos/analise_ifood_B.i/dashboard/`. Abrir o HTML via `file://` impede o fetch do JSON.

Para reproduzir: `uv run python scripts/extrair_pbix.py` e
`uv run python scripts/gerar_dados_ifood.py`. Os caminhos são relativos ao script;
os CSVs originais não são modificados. `stores.csv` exige fallback de UTF-8 para Latin-1.

## Indicadores

As expressões originais estão em [MODELO.md](../MODELO.md). O PBIX contém **19 medidas**,
além das 13 previstas inicialmente. O extrator preserva todas, integralmente.

| Indicador | Definição |
|---|---|
| Pedidos | COUNT de orders.order_id, todos os status |
| Faturamento | SUM de orders.order_amount, inclusive cancelados; não usa payments |
| Ticket médio | Faturamento / pedidos |
| % cancelados | COUNT de pedidos CANCELED / pedidos |
| % concluídos | COUNT de pedidos DELIVERED / pedidos, conforme o DAX |
| Entregas | COUNT de deliveries.delivery_id, sem deduplicar por pedido |
| Distância média (km) | AVERAGE de deliveries.delivery_distance_meters / 1000 |
| % entregas concluídas | COUNT de driver_id não nulo com delivery_status DELIVERED / entregas |

**Pedidos concluídos retorna 0%:** os pedidos no CSV têm status FINISHED ou CANCELED,
enquanto a medida DAX busca DELIVERED. FINISHED não é convertido implicitamente em DELIVERED.
As entregas têm status DELIVERED, CANCELLED e DELIVERING. Percentuais de pedidos e
entregas usam denominadores distintos. Divisão sem denominador é exibida como “—” (DAX BLANK).

Faturamento é convertido em centavos inteiros antes da agregação para evitar deriva de ponto
flutuante. Os testes comparam com a soma original em tolerância inferior a um centavo.
A média das distâncias usa soma e contagem válida, nunca média de médias.

## Agregados e filtros

`dados.json` usa tabelas com `colunas` e `linhas`, dimensões codificadas por índices
em `dimensoes`, contagens inteiras e receita em centavos. Não inclui registros individuais.

- `cubo`: mês × tipo de canal × segmento × cidade do hub × status, pedidos e centavos.
- `horas`: mês × tipo de canal × segmento × hora. Separado do cubo para reduzir o tamanho,
  sem perder os três filtros disponíveis. As horas são as registradas no CSV.
- `lojas` e `canais`: agregados completos por mês × tipo de canal × segmento × nome.
  Top 10 recalculado em cada seleção; os tops globais também estão pré-calculados no JSON.
- `entregas`: mês × tipo de canal × segmento × tipo de entregador × modal, com contagem,
  soma das distâncias, quantidade de distâncias válidas e entregas concluídas.

Junções de dimensões são many-to-one verificadas, com left join para preservar os totais.
Entregas recebem filtros do pedido via delivery_order_id, sem duplicar pedidos no cubo.
Valores ausentes ficam em “Não informado”; mês 0 representa entrega sem pedido associado.
Os três filtros são interseccionados e propagados a todos os gráficos, incluindo entregas.
O gráfico de cidades mede pedidos nos hubs, não quantidade de hubs físicos.

As medidas com ALLEXCEPT preservam o agrupamento dentro do modelo original. O dashboard
aplica explicitamente os três filtros a todas as tabelas; não é um emulador genérico de
contexto DAX, filtros visuais, relacionamentos bidirecionais ou interações entre visuais.
Medidas auxiliares (conversão APPROVED, faturamento perdido, cancelamentos por hora,
participação de segmento e ticket por segmento) estão documentadas no modelo; os gráficos
e KPIs publicados são os pedidos no escopo da página HTML.

## Conferência sem filtros

| Indicador | Valor |
|---|---:|
| Pedidos | 368.999 |
| Faturamento | R$ 38.800.730,73 |
| Ticket médio | R$ 105,1513167515 |
| Cancelados | 16.979 (4,6013674834%) |
| Concluídos (DELIVERED em orders) | 0 (0%) |
| Entregas | 378.843 |
| Distância média | 10,7213600444 km |

JSON: 67.421 bytes. A interface arredonda moeda em duas casas e distância e percentuais
em até duas casas. Mantém a precisão dos agregados nos cálculos.

## Dependência local

Apache ECharts **5.6.0**, obtido de `https://unpkg.com/echarts@5.6.0/dist/echarts.min.js`.
Licença Apache-2.0 de `https://unpkg.com/echarts@5.6.0/LICENSE`, ao lado do JS em
`assets/js/vendor/LICENSE`. A página usa apenas a cópia local, sem CDN de gráficos ou mapas.
Fontes e cores seguem o CSS Editorial do portfólio (Open Sans, Roboto Slab, #0090e8).
As fontes são cópias locais do repositório oficial google/fonts: `ofl/opensans` (OFL)
e `apache/robotoslab` (Apache-2.0), com as respectivas licenças em `fonts/`.
Cada gráfico tem tabela expansível para leitura dos valores exatos e acesso por teclado.

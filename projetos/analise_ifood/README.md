# Delivery Center: receita, cancelamentos e operação

O nome histórico da pasta é iFood, mas a base descreve uma operação multicanal do Delivery Center, sem representar toda a operação do iFood.

## Dados e método

- Fonte: [Delivery Center: Food & Goods orders in Brazil, de nosbielcs no Kaggle](https://www.kaggle.com/datasets/nosbielcs/brazilian-delivery-center). Sete CSVs locais: pedidos, pagamentos, entregas, entregadores, lojas, canais e hubs.
- Licença documentada no notebook: “Data files © Original Authors” (`copyright-authors`, consulta de 24/11/2026). Não concede licença aberta de redistribuição; os direitos permanecem dos autores.
- Período: 01/01/2021 a 30/04/2021; unidade principal de análise: um pedido.
- Faturamento: soma de `orders.order_amount`, incluindo cancelados para reconciliar com o dashboard; não é receita líquida realizada. Pagamentos são agregados separadamente por chave.
- Chaves e junções validadas; SQL executado em DuckDB em memória. O ciclo usa finalizados com tempo positivo, mostrando recorte bruto e operacional de até 180 min. Modal exige uma única entrega concluída, custo não negativo e distância positiva; R$/km é soma dos custos dividida pela soma das distâncias.

## Resultados executados

- 368.999 pedidos; valor bruto de **R$ 38.800.730,73**; 16.979 cancelamentos (**4,60%**).
- FOOD PLACE concentra **63,67%** da receita; FOOD, **69,65%**; GOLDEN SHOPPING, **9,74%**. As dez maiores lojas representam **29,73%**.
- Pico agregado às **15h: 50.471 pedidos**, P90 operacional **69,98 min**. Recorte até 180 min: mediana **41,12 min**, P90 **67,55 min**; bruto positivo: **42,18 min / 83,17 min**.
- BIKER: **R$ 5,03/pedido**, **1,07 km**, **R$ 4,68/km** (92.635 pedidos); MOTOBOY: **R$ 8,14/pedido**, **3,34 km**, **R$ 2,43/km** (231.226 pedidos). Cobertura: **323.861 pedidos (92,00% dos finalizados)**.
- Maior pedido: **R$ 1.788.306,11 (4,61% do total)**; **48.818 pedidos** têm mais de um registro de pagamento.

## Limitações

O período de quatro meses de 2021 não representa a operação atual. O filtro de 180 min pode retirar atrasos reais e pedidos programados; não define SLA. A comparação entre modais é descritiva, sem medir economia causal. O custo registrado no pedido não equivale à remuneração do entregador. Auditar valores extremos e reconciliar pagamentos antes de projetar receita realizada.

## Como executar

Com o ambiente do repositório, abra `analise_ifood.ipynb` e execute as células na ordem, com diretório de trabalho nesta pasta. O notebook importa `../../scripts/formatacao_br.py` para apresentar números em pt-BR, sem locale do sistema. Para executar e reexportar os três notebooks, rode `uv run python scripts/exportar_notebooks.py` na raiz. Não é necessário servidor PostgreSQL; `ifood.sql` preserva as consultas e o DDL legado.

- [Notebook executável](analise_ifood.ipynb)
- [Notebook HTML](notebook.html)
- [Página de resultados](index.html)

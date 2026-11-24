# Fórmula 1: piloto ou carro?

**Pergunta de negócio:** quando dois pilotos dividem o mesmo carro na mesma temporada, com que frequência um supera o outro? A análise compara colegas de equipe na mesma corrida para reduzir a diferença de equipamento.

## Dados e método

- Fonte: CSVs históricos locais, da coleção [Formula 1 World Championship (1950–2024), de Rohan Rao no Kaggle](https://www.kaggle.com/datasets/rohanrao/formula-1-world-championship-1950-2020), baseada no Ergast Motor Racing Data.
- Período: 1950–2024; excluídas as 500 Milhas de Indianápolis, incluídas na base como etapa do campeonato nos anos iniciais, mas não disputadas como GP de F1.
- Licença: os CSVs locais não identificam a licença do snapshot. Confira os termos da página do Kaggle e dos dados Ergast antes de redistribuir.
- A comparação usa posição final classificada no mesmo GP, equipe e temporada; pontos não são comparados entre eras. Para contexto, a participação de pontos da equipe é calculada dentro da temporada.
- Ranking histórico: média por GP da fração de colegas superados, exigindo ao menos 30 GPs comparáveis.

## Resultados calculados

- O recorte tem **1.114 GPs** e **26.292 resultados classificados**.
- Foram observados **34.846 confrontos dirigidos piloto-colega** na mesma equipe e corrida.
- **40,0%** dos recortes piloto-temporada-equipe superaram 50% na média por GP de colegas superados.
- A participação mediana de uma equipe nos pontos da temporada foi **3,6%**.
- Entre pilotos com pelo menos 30 GPs comparáveis, **Juan Fangio** lidera com **79,7%** de colegas superados em **51 GPs comparáveis**.

Esses resultados descrevem desempenho relativo nas chegadas classificadas; não isolam talento, confiabilidade, estratégia ou qualidade do carro e não demonstram causalidade. As regras, os grids e a cobertura histórica mudam entre temporadas.

Cada GP recebe o mesmo peso; com vários colegas, primeiro calculamos a fração superada naquela corrida.

## Arquivos

- [Notebook executável](analise_formula1.ipynb)
- [Notebook HTML](notebook.html)
- [Página do projeto](index.html)
- CSVs usados pela análise nesta pasta.

Os textos, tabelas de achados e gráficos usam formatação pt-BR via `../../scripts/formatacao_br.py`, sem depender do locale do sistema. Para executar e reexportar os três notebooks, rode `uv run python scripts/exportar_notebooks.py` na raiz do repositório.

# F?rmula 1: piloto ou carro?

**Pergunta de neg?cio:** quando dois pilotos dividem o mesmo carro na mesma temporada, com que frequ?ncia um supera o outro? A an?lise compara colegas de equipe na mesma corrida para reduzir a diferen?a de equipamento.

## Dados e m?todo

- Fonte: CSVs hist?ricos locais, da cole??o [Formula 1 World Championship (1950?2024), de Rohan Rao no Kaggle](https://www.kaggle.com/datasets/rohanrao/formula-1-world-championship-1950-2020), baseada no Ergast Motor Racing Data.
- Per?odo: 1950?2024; exclu?das as 500 Milhas de Indian?polis, inclu?das na base como etapa do campeonato nos anos iniciais, mas n?o disputadas como GP de F1.
- Licen?a: os CSVs locais n?o identificam a licen?a do snapshot. Confira os termos da p?gina do Kaggle e dos dados Ergast antes de redistribuir.
- A compara??o usa posi??o final classificada no mesmo GP, equipe e temporada; pontos n?o s?o comparados entre eras. Para contexto, a participa??o de pontos da equipe ? calculada dentro da temporada.
- Ranking hist?rico: taxa de vit?rias contra colegas, exigindo ao menos 30 confrontos diretos.

## Resultados calculados

- O recorte tem **1.114 GPs** e **26.292 resultados classificados**.
- Foram observados **34.846 confrontos dirigidos piloto-colega** na mesma equipe e corrida.
- **40,8%** dos recortes piloto-temporada-equipe superaram 50% de vit?rias contra colegas.
- A participa??o mediana de uma equipe nos pontos da temporada foi **3,6%**.
- Entre pilotos com pelo menos 30 disputas, **Juan Fangio** lidera com **82,6%** de vit?rias em **201** confrontos.

Esses resultados descrevem desempenho relativo nas chegadas classificadas; n?o isolam talento, confiabilidade, estrat?gia ou qualidade do carro e n?o demonstram causalidade. As regras, os grids e a cobertura hist?rica mudam entre temporadas.

## Arquivos

- [Notebook execut?vel](analise_formula1.ipynb)
- [Notebook HTML](notebook.html)
- [P?gina do projeto](index.html)
- CSVs usados pela an?lise nesta pasta.

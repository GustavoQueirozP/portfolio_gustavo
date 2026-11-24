# E-commerce: RFM, churn e previsão

## Pergunta de negócio

Como segmentar clientes por valor e engajamento, estimar quem pode ficar 90 dias sem comprar e prever vendas diárias no curto prazo?

## Dados e método

O arquivo `data.csv` contém o **Online Retail** do [UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/352/online+retail), varejista britânica online entre 01/12/2010 e 09/12/2011, sob licença CC BY 4.0. São 541.909 linhas. Removemos linhas sem CustomerID das análises de clientes; devoluções são as linhas com InvoiceNo iniciado por C ou quantidade negativa e são descontadas da receita líquida. Compras com preço e quantidade positivos compõem o RFM.

O notebook calcula segmentos RFM por quintis e retenção mensal por coorte. Churn usa T = 10/09/2011: features apenas até T e rótulo sem compra nos 90 dias seguintes. O holdout é temporal, com os clientes de última compra mais recente reservados para teste; o modelo é comparado à baseline de recência por ROC-AUC, PR-AUC e recall. Para previsão, os 30 últimos dias são holdout; Prophet é comparado com o valor do mesmo dia da semana anterior. MAPE exclui dias reais zero.

## Resultados executados

- 397.884 linhas de compra identificáveis; 10.624 linhas de devoluções/cancelamentos (2,0% da base). Receita líquida: **£8.014.595**; pico em novembro de 2011: **£1.114.077**.
- **946 clientes Campeões (21,8%)**; retenção média no mês seguinte de **20,6%**.
- Churn no corte: prevalência **43,0%** em 3.370 clientes. No teste temporal (843 clientes), HistGradientBoosting obteve ROC-AUC **0,775**, PR-AUC **0,462** e recall **51,2%**; baseline de recência: ROC-AUC **0,542** e PR-AUC **0,266**.
- Forecast de 30 dias: Prophet teve MAE de **£10.759** e MAPE **27,0%**; baseline semanal, MAE **£11.848** e MAPE **37,9%**. Houve 4 dias sem receita real, excluídos apenas do MAPE.

## Limitações

A amostra cobre cerca de um ano e termina em 2011; clientes sem ID ficam fora dos modelos de cliente e coortes recentes têm observação curta. Devoluções são reconhecidas pela data da linha, sem conciliação à fatura original. A definição de churn é operacional e a avaliação usa uma única janela temporal; o forecast também tem somente um holdout de 30 dias. Faça backtesting em várias janelas antes de orientar campanhas ou planejamento operacional.

## Como executar

Com o ambiente do repositório: abra `churn_rfm_forecast.ipynb` e execute as células na ordem. O caminho do arquivo é relativo ao diretório do notebook.

Os textos, tabelas de achados e gráficos usam formatação pt-BR via `../../scripts/formatacao_br.py`, sem depender do locale do sistema. Para executar e reexportar os três notebooks, rode `uv run python scripts/exportar_notebooks.py` na raiz do repositório.

# Análise de Churn e Forecasting — Projeto Python

## Descrição

Este projeto realiza duas análises preditivas utilizando dados de vendas de e-commerce:

1. **Análise de churn** (cancelamento) de clientes, utilizando um modelo de árvore de decisão para identificar clientes com maior risco de churn, considerando o histórico de compras e frequência.

2. **Análise de forecasting** para previsão das vendas futuras, aplicando modelos de séries temporais baseados nos dados históricos de faturamento.

## Dataset

Utiliza o dataset "E-Commerce Sales" do Kaggle, contendo dados de transações, produtos e clientes.

## Objetivos

- Explorar e preparar os dados;
- Calcular métricas relevantes por cliente (total gasto, frequência, quantidade);
- Definir churn com base na inatividade dos clientes;
- Construir e avaliar um modelo de árvore de decisão para prever churn;
- Realizar análise de séries temporais para prever vendas futuras;
- Avaliar a acurácia dos modelos de forecasting e identificar tendências sazonais.

## Tecnologias

- Python 3
- Pandas, NumPy
- Scikit-learn
- Matplotlib, Seaborn
- Statsmodels (para forecasting)

## Como executar

1. Clone o repositório
2. Coloque o arquivo `data.csv` dentro da pasta `projetos/analise_vendas_python/`
3. Execute o notebook `analise_churn_forecasting.ipynb` para rodar as análises e modelos

## Resultados

- Visualização da árvore de decisão para churn;
- Métricas de desempenho do modelo (precisão, recall, f1-score);
- Gráficos e insights sobre o comportamento dos clientes e risco de churn;
- Previsão das vendas futuras com modelos de séries temporais;
- Avaliação da acurácia e detecção de padrões sazonais nas vendas.



# Painel Power BI — operação de delivery (base iFood / Delivery Center)

Painel em Power BI com três páginas (Visão geral, Lojas e segmentos, Entregas) sobre a base pública
[Delivery Center: Food & Goods orders in Brazil](https://www.kaggle.com/datasets/nosbielcs/brazilian-delivery-center)
(jan–abr/2021, 368.999 pedidos). Case no portfólio: `index.html`; PDF do painel: `analise_ifood.pdf`.

## Arquivos
- `analise_ifood.pbip` + `analise_ifood.Report/` + `analise_ifood.SemanticModel/`: o projeto no formato
  Power BI Project (modelo em TMDL, páginas em PBIR/JSON). É a versão atual.
- `analise_ifood.pbix`: versão antiga, que lia de um PostgreSQL local (DirectQuery). Mantida como histórico.
- `dashboard/`: versão web estática do mesmo painel (ECharts), para quem não tem Power BI.
- `MODELO.md`: medidas e visuais extraídos do `.pbix` original.

## Como abrir
1. Abra `analise_ifood.pbip` no Power BI Desktop.
2. Em Transformar dados → Gerenciar parâmetros, aponte `PastaDados` para a pasta `projetos/analise_ifood/`
   deste repositório (onde estão os CSVs) e clique em Atualizar.

## Decisões
- Faturamento = valor bruto dos pedidos, incluindo cancelados (bate com o notebook da mesma base).
- Distância = **mediana**: 509 entregas com mais de 50 km (até 7.251 km) somam 73,5% dos km e distorcem a média.
- Tema próprio (`StaticResources/RegisteredResources/TemaPortfolioIfood.json`).

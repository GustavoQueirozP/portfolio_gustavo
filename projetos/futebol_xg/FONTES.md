# Fontes do case Futebol: xG e xT

Data: [StatsBomb Open Data](https://github.com/statsbomb/open-data).

Os números e gráficos publicados foram conferidos nos relatórios existentes. Não houve retreino nem cálculo de novas métricas para este case. As referências abaixo são nomes de arquivos de origem, sem link para código privado. Não foram publicados eventos brutos ou imagens de transmissão.

## Números

| Informação | Origem |
| --- | --- |
| 12.826 chutes no conjunto de treino; Premier League 2015/16, Copa 2018 e Euro 2020 | README, seção “Fase 0 — métricas” |
| 3.475 chutes sem pênaltis na avaliação; Copa 2022, Euro 2024 e Copa América 2024 | README e subtítulo de `reports/modelos/xg_calibracao.png` |
| xG próprio: AUC 0,7798; log loss 0,2561; Brier 0,0722; xG total 317,7383; 313 gols | `reports/modelos/xg_avaliacao.csv`, linha “nosso xG” |
| StatsBomb: AUC 0,8014; log loss 0,2454; Brier 0,0687; xG total 315,2701; 313 gols | `reports/modelos/xg_avaliacao.csv`, linha “StatsBomb xG (referência)” |
| Grade 16 × 12 e torneios de treino do xT | `reports/modelos/xt_grade.png` |
| Mínimo de 270 minutos; xT por 90 minutos, passes e conduções | Subtítulos dos três gráficos `top_xt.png` |
| Copa 2022: Raphinha 0,31; Kevin De Bruyne 0,30; Ángel Di María 0,30 xT/90 | `reports/wc-2022/top_xt.png`, rótulos arredondados das barras |
| Euro 2024: Jérémy Doku 0,35; Lamine Yamal 0,32; Cody Gakpo 0,26 xT/90 | `reports/euro-2024/top_xt.png`, rótulos arredondados das barras |
| Copa América 2024: Ángel Di María 0,26; Yeferson Soteldo 0,20; Lionel Messi 0,20 xT/90 | `reports/copa-america-2024/top_xt.png`, rótulos arredondados das barras |
| Desvio da curva própria na faixa de previsão média próxima de 0,36 | Leitura visual de `reports/modelos/xg_calibracao.png`; valor aproximado, sem nova métrica de calibração |

Não há totais agregados documentados de partidas ou chutes por torneio nos relatórios consultados. A contagem de treino é a registrada no README; não é apresentada como contagem exclusiva de chutes sem pênaltis.

## Método

Descrição conferida no código dos modelos, sem reprodução de código ou links privados: gradient boosting com geometria, corpo, situação e contexto posicional do chute; validação interna de 15% para parada antecipada; avaliação em competições separadas; pênaltis tratados pela taxa observada no treino; calibração visual sem ajuste posterior. O xT usa socceraction, grade 16 × 12 e interpolação bilinear para movimentos bem-sucedidos. Os rankings publicados filtram mínimo de 270 minutos.

## Imagens

Conversão dos cinco gráficos PNG para WebP com Pillow, qualidade 90. Dimensões preservadas, sem recorte, alteração de conteúdo ou mudança de escala dos gráficos. Tamanhos em bytes:

| Origem | Destino neste case | Bytes |
| --- | --- | ---: |
| `reports/modelos/xg_calibracao.png` | `img/xg-calibracao.webp` | 32.504 |
| `reports/modelos/xt_grade.png` | `img/xt-grade.webp` | 28.710 |
| `reports/wc-2022/top_xt.png` | `img/xt-copa-2022.webp` | 43.272 |
| `reports/euro-2024/top_xt.png` | `img/xt-euro-2024.webp` | 42.904 |
| `reports/copa-america-2024/top_xt.png` | `img/xt-copa-america-2024.webp` | 44.542 |

Logo adicional de atribuição: [asset oficial no repositório Open Data](https://github.com/statsbomb/open-data/blob/master/img/SB%20-%20Icon%20Lockup%20-%20Colour%20positive.png) → `img/statsbomb.png`, 25.024 bytes. Redimensionado proporcionalmente de 5885 × 943 para 600 × 96, sem redesenho ou recoloração. O logo aparece no case e no card da página inicial.

Crédito e logo conforme [Terms & Conditions do README](https://github.com/statsbomb/open-data#terms--conditions). Dados sujeitos ao [Public Data User Agreement](https://github.com/statsbomb/open-data/blob/master/LICENSE.pdf). O crédito HTML5 UP corresponde ao design da página, não à fonte dos dados.

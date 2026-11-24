# Verificação e exportação do site

Na raiz do repositório, após `uv sync`:

```powershell
uv run python scripts/exportar_notebooks.py
uv run python scripts/checar_site.py --ignorar-notebooks
uv run python -m http.server 8879 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8879/`. O verificador imprime arquivo, linha e problema,
retornando 1 quando encontra falhas. Confere destinos locais de `href`/`src`,
âncoras vazias, texto alternativo, crédito HTML5 UP no rodapé, caminhos pessoais
Windows e referência indevida ao tema de hospedagem. Links externos não são
consultados. Fragmentos de âncoras não são validados; o arquivo de destino é.
Ambientes e caches de ferramentas são excluídos.

`--ignorar-notebooks` adia somente a inspeção dos arquivos `.ipynb`. Os HTMLs
exportados continuam sendo verificados. Sem essa opção, a auditoria também
identifica caminhos pessoais em saídas antigas e checkpoints dos notebooks.
Essas saídas precisam ser limpas ou reexecutadas em outra rodada; não foram
alteradas junto com a análise nesta tarefa.

O exportador executa Fórmula 1, iFood e vendas Python com `jupyter nbconvert
--execute --to html`, a partir da pasta de cada notebook, e grava `notebook.html`
nessa mesma pasta. Há limite total de 600 segundos por notebook e de 600 segundos
por célula; falhas são reportadas e o comando termina com status 1. O HTML de cada
notebook só é substituído quando a execução termina com sucesso. Em uma falha,
um HTML anterior pode continuar existindo: confira o status de saída.

Os únicos ajustes persistentes no conteúdo dos notebooks são os caminhos de
entrada convertidos para relativos. A exportação usa uma cópia temporária e omite
a célula interativa `pip install prophet`, pois as dependências já são instaladas
por `uv sync`. As análises e seus parâmetros são preservados. Gráficos recebem
alternativa textual quando ausente, e o HTML recebe crédito e link de volta ao
case. O case Power BI aponta para o dashboard web e o PBIX; não possui notebook
próprio e referencia a exploração iFood como material complementar.

## Resultado desta rodada (24/11/2026)

- Estado inicial: 159 problemas; 113 com `--ignorar-notebooks`.
- Estado final: 43 problemas, todos em notebooks/checkpoint; zero com a opção.
- Três notebooks executados e exportados, com imagens incorporadas.
- Cinco testes passaram com `uv run pytest -q --basetemp=.pytest-tmp`; a tentativa
  com o temporário padrão do Windows encontrou erro de permissão.
- Index e quatro cases responderam 200 pelo servidor local, incluindo os 24
  destinos locais encontrados em seus `href`/`src`.
- `rg` confirmou ausência de referências às páginas de demonstração nas páginas
  mantidas; após removê-las, confirmou ausência de usos de `pic01.jpg` a
  `pic11.jpg`, antes da exclusão dessas imagens.
- A captura visual no Edge não concluiu por falha de inicialização da GPU no
  ambiente. A navegação HTTP e a verificação estática foram concluídas.

Os cases explicitam análise em revisão: origem exata, licença dos dados, recorte
e métricas ainda precisam de validação antes de publicar conclusões numéricas.

Se o cache global do uv estiver bloqueado neste ambiente, use uma pasta local:

```powershell
$env:UV_CACHE_DIR = Join-Path (Get-Location) '.uv-cache'
```

Nenhum commit ou push faz parte destes comandos.

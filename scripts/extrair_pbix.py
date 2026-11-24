"""Documenta o modelo e os visuais sem consultar o Postgres do relatório."""
import json
from pathlib import Path
from zipfile import ZipFile

from pbixray import PBIXRay

ROOT = Path(__file__).resolve().parents[1]
PASTA = ROOT / 'projetos/analise_ifood_B.i'


def extrair(pbix=PASTA / 'analise_ifood.pbix', destino=PASTA / 'MODELO.md'):
    with ZipFile(pbix) as arquivo:
        layout = json.loads(arquivo.read('Report/Layout').decode('utf-16'))
    modelo = PBIXRay(str(pbix))
    medidas = modelo.dax_measures
    linhas = ['# Modelo do relatório iFood', '',
              'Extraído por `scripts/extrair_pbix.py` com pbixray e Report/Layout. '
              'DirectQuery: os CSVs são a fonte do dashboard estático; nenhuma conexão ao Postgres é aberta.', '',
              f'{len(layout["sections"])} páginas; {len(medidas)} medidas DAX. '
              'O arquivo contém 19 medidas, embora o escopo inicial mencionasse 13.', '', '## Páginas e visuais', '']
    for pagina in layout['sections']:
        linhas += [f'### {pagina["displayName"]}', '', '| Tipo | Campos (papel) |', '|---|---|']
        for visual in pagina.get('visualContainers', []):
            config = json.loads(visual.get('config', '{}')).get('singleVisual', {})
            campos = [f'{p.get("queryRef", "")} ({papel})'
                      for papel, proj in config.get('projections', {}).items() for p in proj]
            linhas += [f'| {config.get("visualType", "grupo")} | {"; ".join(campos) or "—"} |']
        linhas += ['']
    linhas += ['## Medidas DAX completas', '']
    for _, medida in medidas.iterrows():
        linhas += [f'### {medida["Name"]}', '', '```dax',
                   f'{medida["Name"]} = {medida["Expression"]}', '```', '']
    linhas += ['## Power Query', '']
    for _, consulta in modelo.power_query.iterrows():
        linhas += [f'### {consulta["TableName"]}', '', '```powerquery', consulta['Expression'], '```', '']
    destino.write_text('\n'.join(linhas), encoding='utf-8')
    modelo.close()
    print(f'{destino.relative_to(ROOT)}: {len(layout["sections"])} páginas, {len(medidas)} medidas')


if __name__ == '__main__':
    extrair()

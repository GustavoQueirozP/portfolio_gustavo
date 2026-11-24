"""Seleciona o último pregão ISO semanal, preservando os valores da captura.

Uso: uv run python scripts/reduzir_mercado_tcc.py
O arquivo diário é removido somente após validar e gravar a saída < 400 KB.
"""
import json
from datetime import date
from pathlib import Path

PASTA = Path(__file__).resolve().parents[1] / 'projetos/tcc_dw_financeiro/app/dados'
CAMPOS = ('data_calendario', 'fechamento', 'volume', 'media_21', 'media_200')


def reduzir(dados):
    resultado = {}
    for ticker, linhas in dados.items():
        semanas = {}
        for linha in sorted(linhas, key=lambda x: x['data_calendario']):
            dia = date.fromisoformat(linha['data_calendario'][:10])
            semanas[dia.isocalendar()[:2]] = {k: linha[k] for k in CAMPOS}
        resultado[ticker] = list(semanas.values())
    return resultado


def main():
    origem, destino = PASTA / 'mercado.json', PASTA / 'mercado-semanal.json'
    if not origem.exists() and destino.exists():
        print(f'Já reduzido: {destino.stat().st_size:,} bytes.')
        return
    dados = reduzir(json.loads(origem.read_text(encoding='utf-8')))
    conteudo = json.dumps(dados, ensure_ascii=False, separators=(',', ':'))
    if len(conteudo.encode('utf-8')) >= 400_000:
        raise ValueError('Saída excede 400 KB; diário preservado.')
    destino.write_text(conteudo, encoding='utf-8')
    assert json.loads(destino.read_text(encoding='utf-8')) == dados
    origem.unlink()
    print(f'{sum(map(len, dados.values()))} pregões semanais; {destino.stat().st_size:,} bytes.')


if __name__ == '__main__':
    main()

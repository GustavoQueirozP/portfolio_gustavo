import importlib.util
import json
from pathlib import Path

import pandas as pd
import pytest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('gerador_ifood', ROOT / 'scripts/gerar_dados_ifood.py')
gerador = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gerador)


@pytest.fixture(scope='module')
def dados(tmp_path_factory):
    destino = tmp_path_factory.mktemp('ifood') / 'dados.json'
    resultado = gerador.gerar(destino)
    return resultado, destino


@pytest.fixture(scope='module')
def orders():
    return pd.read_csv(ROOT / 'projetos/analise_ifood/orders.csv',
        usecols=['order_id', 'order_amount', 'order_status', 'order_created_month'],
        dtype={'order_id': 'int64', 'order_amount': 'float64', 'order_status': 'string', 'order_created_month': 'int8'})


def test_totais_e_cancelamentos(dados, orders):
    d, _ = dados
    linhas = d['cubo']['linhas']
    pedidos = sum(r[5] for r in linhas)
    receita = sum(r[6] for r in linhas) / 100
    status = d['dimensoes']['order_status'].index('CANCELED')
    cancelados = sum(r[5] for r in linhas if r[4] == status)
    assert pedidos == len(orders) == orders.order_id.count()
    assert receita == pytest.approx(orders.order_amount.sum(), abs=0.005)
    assert cancelados / pedidos == pytest.approx((orders.order_status == 'CANCELED').mean())
    assert receita / pedidos == pytest.approx(orders.order_amount.sum() / len(orders))
    concluidos = sum(r[5] for r in linhas if d['dimensoes']['order_status'][r[4]] == 'FINISHED')
    assert concluidos == (orders.order_status == 'FINISHED').sum()


def test_filtro_mes_e_agregados_completos(dados, orders):
    d, _ = dados
    for i, mes in enumerate(d['dimensoes']['mes']):
        direto = orders[orders.order_created_month == mes]
        for nome in ['cubo', 'lojas', 'canais']:
            t = d[nome]
            linhas = [r for r in t['linhas'] if r[0] == i]
            assert sum(r[t['colunas'].index('pedidos')] for r in linhas) == len(direto)
            assert sum(r[t['colunas'].index('centavos')] for r in linhas) / 100 == pytest.approx(direto.order_amount.sum(), abs=.005)
        assert sum(r[4] for r in d['horas']['linhas'] if r[0] == i) == len(direto)


def test_entregas_sem_duplicacao(dados):
    d, _ = dados
    bruto = pd.read_csv(ROOT / 'projetos/analise_ifood/deliveries.csv',
        usecols=['delivery_id', 'delivery_status', 'driver_id', 'delivery_distance_meters'])
    linhas = d['entregas']['linhas']
    assert sum(r[5] for r in linhas) == bruto.delivery_id.count()
    distancia = sum(r[6] for r in linhas) / sum(r[7] for r in linhas) / 1000
    assert distancia == pytest.approx(bruto.delivery_distance_meters.mean() / 1000)
    assert sum(r[8] for r in linhas) == ((bruto.delivery_status == 'DELIVERED') & bruto.driver_id.notna()).sum()


def test_json_pequeno_reproduzivel(dados):
    d, destino = dados
    assert destino.stat().st_size < 300_000
    assert json.loads(destino.read_text(encoding='utf-8')) == json.loads(gerador.DESTINO.read_text(encoding='utf-8'))


def test_modelo_completo():
    texto = (ROOT / 'projetos/analise_ifood_B.i/MODELO.md').read_text(encoding='utf-8')
    assert all(f'### {p}' in texto for p in ['Visão Geral', 'Lojas e Segmentos', 'Entregas'])
    assert texto.count('```dax') == 19  # Quantidade real do artefato, superior às 13 do briefing.
    assert texto.count('```powerquery') == 8

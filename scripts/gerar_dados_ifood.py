"""Agregados públicos, sem dados individuais, para o dashboard sem backend."""
import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
FONTE = ROOT / 'projetos/analise_ifood'
DESTINO = ROOT / 'projetos/analise_ifood_B.i/dashboard/dados.json'
FILTROS = ['mes', 'channel_type', 'store_segment']


def ler(nome, tipos):
    try:
        return pd.read_csv(FONTE / f'{nome}.csv', usecols=list(tipos), dtype=tipos)
    except UnicodeDecodeError:
        return pd.read_csv(FONTE / f'{nome}.csv', usecols=list(tipos), dtype=tipos, encoding='latin-1')


def carregar():
    orders = ler('orders', dict(order_id='int64', store_id='int64', channel_id='int64',
        delivery_order_id='int64', order_amount='float64', order_status='string',
        order_created_month='int8', order_created_hour='int8'))
    stores = ler('stores', dict(store_id='int64', hub_id='int64', store_name='string', store_segment='string'))
    channels = ler('channels', dict(channel_id='int64', channel_name='string', channel_type='string'))
    hubs = ler('hubs', dict(hub_id='int64', hub_city='string'))
    orders = (orders.merge(stores, on='store_id', how='left', validate='many_to_one')
              .merge(channels, on='channel_id', how='left', validate='many_to_one')
              .merge(hubs, on='hub_id', how='left', validate='many_to_one')
              .rename(columns={'order_created_month': 'mes', 'order_created_hour': 'hora'}))
    for coluna in ['channel_type', 'channel_name', 'store_segment', 'store_name', 'hub_city']:
        orders[coluna] = orders[coluna].fillna('Não informado')
    return orders


def gerar(destino=DESTINO):
    orders = carregar()
    deliveries = ler('deliveries', dict(delivery_id='int64', delivery_order_id='int64', driver_id='Int64',
        delivery_distance_meters='float64', delivery_status='string'))
    drivers = ler('drivers', dict(driver_id='int64', driver_type='string', driver_modal='string'))
    deliveries = deliveries.merge(drivers, on='driver_id', how='left', validate='many_to_one')
    # Uma linha por entrega. Entregas sem pedido correspondente ficam no total sem filtro.
    deliveries = deliveries.merge(orders[['delivery_order_id'] + FILTROS], on='delivery_order_id',
        how='left', validate='many_to_one')
    deliveries['mes'] = deliveries['mes'].fillna(0).astype(int)
    for coluna in ['channel_type', 'store_segment', 'driver_type', 'driver_modal']:
        deliveries[coluna] = deliveries[coluna].fillna('Não informado')
    deliveries['concluidas'] = ((deliveries.delivery_status == 'DELIVERED') & deliveries.driver_id.notna()).astype(int)

    dimensoes = {c: sorted(set(orders[c]) | (set(deliveries[c]) if c in deliveries else set()))
                 for c in FILTROS + ['hub_city', 'order_status', 'hora', 'store_name', 'channel_name']}
    for c in ['driver_type', 'driver_modal']:
        dimensoes[c] = sorted(deliveries[c].unique().tolist())

    def tabela(frame, chaves, metricas):
        agregado = frame.groupby(chaves, observed=True, dropna=False).agg(**metricas).reset_index()
        for c in chaves:
            mapa = {valor: i for i, valor in enumerate(dimensoes[c])}
            agregado[c] = agregado[c].map(mapa)
        return {'colunas': chaves + list(metricas), 'linhas': agregado.values.tolist()}

    metricas = dict(pedidos=('order_id', 'count'), centavos=('centavos', 'sum'))
    orders['centavos'] = (orders.order_amount * 100).round().astype('int64')
    dados = {'versao': 1, 'fonte': 'Dados: iFood/Kaggle, jan–abr/2021', 'dimensoes': dimensoes}
    dados['cubo'] = tabela(orders, FILTROS + ['hub_city', 'order_status'], metricas)
    dados['horas'] = tabela(orders, FILTROS + ['hora'], dict(pedidos=('order_id', 'count')))
    # Todas as lojas/canais agregados permitem recalcular top 10 após qualquer filtro.
    dados['lojas'] = tabela(orders, FILTROS + ['store_name'], metricas)
    dados['canais'] = tabela(orders, FILTROS + ['channel_name'], metricas)
    dados['entregas'] = tabela(deliveries, FILTROS + ['driver_type', 'driver_modal'], dict(
        entregas=('delivery_id', 'count'), distancia_m=('delivery_distance_meters', 'sum'),
        distancias_validas=('delivery_distance_meters', 'count'), concluidas=('concluidas', 'sum')))
    dados['top_lojas'] = orders.groupby('store_name').centavos.sum().nlargest(10).items()
    dados['top_lojas'] = list(dados['top_lojas'])
    dados['top_canais'] = list(orders.groupby('channel_name').order_id.count().nlargest(10).items())
    # Inteiros compactos (não floats 1.0) e somas de distância exatas em metros.
    for valor in dados.values():
        if isinstance(valor, dict) and 'linhas' in valor:
            valor['linhas'] = [[int(x) if float(x).is_integer() else x for x in linha] for linha in valor['linhas']]
    dados['definicoes'] = {
        'pedidos': 'COUNT(orders[order_id]); todos os status.',
        'faturamento': 'SUM(orders[order_amount]); todos os status, inclusive CANCELED. Centavos / 100.',
        'ticket_medio': 'Faturamento Total / Total de Pedidos; vazio quando denominador zero (DAX BLANK).',
        'cancelados': 'Pedidos CANCELED / Total de Pedidos.',
        'concluidos': 'Pedidos FINISHED / Total de Pedidos (o DAX original filtra DELIVERED, status que não existe em orders; corrigido aqui e a corrigir no .pbix).',
        'entregas': 'COUNT(deliveries[delivery_id]); não é contagem de pedidos.',
        'distancia_media_km': 'SUM(distância válida) / COUNT(distância válida) / 1000; AVERAGE do DAX.',
        'entregas_concluidas': 'COUNT(driver_id) com delivery_status DELIVERED / Total de Entregas.',
        'filtros': 'Mês, tipo de canal e segmento propagados do pedido à entrega. Mês 0 = sem pedido correspondente. '
        'Top lojas/canais recalculados nos agregados completos. Sem hora no cubo principal: agregado por hora separado com os mesmos filtros.',
        'contexto_dax': 'ALLEXCEPT de Faturamento por Segmento, Pedidos por Canal e MediaDistanciaPorModal '
        'preserva o agrupamento. Os filtros explícitos da página são aplicados a todos os gráficos. Ver MODELO.md para as 19 expressões.'}
    texto = json.dumps(dados, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
    tamanho = len(texto.encode('utf-8'))
    if tamanho >= 300_000:
        raise ValueError(f'JSON excede 300 KB: {tamanho}')
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(texto, encoding='utf-8')
    print(f'{destino.name}: {tamanho:,} bytes')
    print(f'Pedidos={len(orders)}; faturamento={orders.order_amount.sum():.2f}; '
          f'cancelados={(orders.order_status == "CANCELED").mean():.10%}; '
          f'concluídos={(orders.order_status == "FINISHED").mean():.10%}; '
          f'entregas={len(deliveries)}; distância média={deliveries.delivery_distance_meters.mean()/1000:.10f} km')
    return dados


if __name__ == '__main__':
    gerar()

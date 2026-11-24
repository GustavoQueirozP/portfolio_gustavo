# Modelo do relatório iFood

Extraído por `scripts/extrair_pbix.py` com pbixray e Report/Layout. DirectQuery: os CSVs são a fonte do dashboard estático; nenhuma conexão ao Postgres é aberta.

3 páginas; 19 medidas DAX. O arquivo contém 19 medidas, embora o escopo inicial mencionasse 13.

## Páginas e visuais

### Visão Geral

| Tipo | Campos (papel) |
|---|---|
| card | Medidas.Total de Pedidos (Values) |
| card | Medidas.Faturamento Total (Values) |
| image | — |
| columnChart | public orders.order_status (Category); Medidas.Total de Pedidos (Y) |
| lineChart | public orders.order_created_hour (Category); Medidas.Total de Pedidos (Y) |
| columnChart | public orders.order_created_month (Category); Medidas.Total de Pedidos (Y) |
| barChart | public channels.channel_name (Category); Medidas.Total de Pedidos (Y) |

### Lojas e Segmentos

| Tipo | Campos (papel) |
|---|---|
| image | — |
| barChart | public stores.store_name (Category); Medidas.Faturamento Total (Y) |
| columnChart | public stores.store_segment (Category); Medidas.Faturamento Total (Y) |
| pieChart | public stores.store_segment (Category); Medidas.Total de Pedidos (Y) |
| map | public hubs.hub_latitude (Y); public hubs.hub_longitude (X); Medidas.Faturamento Total (Size); public hubs.hub_name (Series) |

### Entregas

| Tipo | Campos (papel) |
|---|---|
| image | — |
| card | Medidas.Total de Entregas (Values) |
| card | Medidas.Distância Média das Entregas (Values) |
| card | Medidas.PercentualEntregasConcluidas (Values) |
| columnChart | public drivers.driver_type (Category); CountNonNull(public deliveries.delivery_id) (Y) |
| columnChart | public drivers.driver_modal (Category); CountNonNull(public deliveries.delivery_id) (Y) |
| barChart | public drivers.driver_modal (Category); Medidas.MediaDistanciaPorModal (Y) |

## Medidas DAX completas

### Faturamento Total

```dax
Faturamento Total = SUM('public orders'[order_amount])
```

### Total de Pedidos

```dax
Total de Pedidos = COUNT('public orders'[order_id])
```

### Ticket Médio

```dax
Ticket Médio = DIVIDE([Faturamento Total], [Total de Pedidos])
```

### Total Cancelados

```dax
Total Cancelados = CALCULATE(
    COUNT('public orders'[order_id]),
    'public orders'[order_status] = "CANCELED"
)
```

### % Cancelados

```dax
% Cancelados = DIVIDE([Total Cancelados], [Total de Pedidos])
```

### Pedidos Concluídos

```dax
Pedidos Concluídos = CALCULATE(
    COUNT('public orders'[order_id]),
    'public orders'[order_status] = "DELIVERED"
)
```

### % Concluídos

```dax
% Concluídos = DIVIDE([Pedidos Concluídos], [Total de Pedidos])
```

### Faturamento por Segmento

```dax
Faturamento por Segmento = CALCULATE(
    SUM('public orders'[order_amount]),
    ALLEXCEPT('public stores', 'public stores'[store_segment])
)
```

### Total de Entregas

```dax
Total de Entregas = COUNT('public deliveries'[delivery_id])
```

### Distância Média das Entregas

```dax
Distância Média das Entregas = AVERAGE('public deliveries'[delivery_distance_meters]) / 1000

```

### Pedidos por Canal

```dax
Pedidos por Canal = CALCULATE(
    COUNT('public orders'[order_id]),
    ALLEXCEPT('public channels', 'public channels'[channel_name])
)
```

### Taxa de Conversão (%)

```dax
Taxa de Conversão (%) = 
DIVIDE(
    CALCULATE(COUNTROWS('public orders'), 'public orders'[order_status] = "APPROVED"),
    [Total de Pedidos],
    0
)
```

### Ticket Médio por Segmento

```dax
Ticket Médio por Segmento = 
DIVIDE(
    SUM('public orders'[order_amount]),
    COUNT('public orders'[order_id])
)

```

### Faturamento Perdido

```dax
Faturamento Perdido = 
CALCULATE(
    SUM('public orders'[order_amount]),
    'public orders'[order_status] = "CANCELED"
)

```

### Cancelamentos por Hora

```dax
Cancelamentos por Hora = 
CALCULATE(
    COUNTROWS('public orders'),
    'public orders'[order_status] = "CANCELED"
)

```

### % Faturamento por Segmento

```dax
% Faturamento por Segmento = 
DIVIDE(
    CALCULATE(SUM('public orders'[order_amount])),
    CALCULATE(SUM('public orders'[order_amount]), ALL('public stores'[store_segment]))
)

```

### EntregasConcluidas

```dax
EntregasConcluidas = 
CALCULATE(COUNT('public deliveries'[driver_id]), 'public deliveries'[delivery_status] = "DELIVERED")
```

### PercentualEntregasConcluidas

```dax
PercentualEntregasConcluidas = 
DIVIDE([EntregasConcluidas], [Total de Entregas], 0)
```

### MediaDistanciaPorModal

```dax
MediaDistanciaPorModal = 
CALCULATE(
    AVERAGE('public deliveries'[delivery_distance_meters]) / 1000,
    ALLEXCEPT('public drivers', 'public drivers'[driver_modal])
)

```

## Power Query

### public channels

```powerquery
let
    Fonte = PostgreSQL.Database("localhost:5432", "postgres"),
    public_channels = Fonte{[Schema="public",Item="channels"]}[Data]
in
    public_channels
```

### public deliveries

```powerquery
let
    Fonte = PostgreSQL.Database("localhost:5432", "postgres"),
    public_deliveries = Fonte{[Schema="public",Item="deliveries"]}[Data]
in
    public_deliveries
```

### public drivers

```powerquery
let
    Fonte = PostgreSQL.Database("localhost:5432", "postgres"),
    public_drivers = Fonte{[Schema="public",Item="drivers"]}[Data]
in
    public_drivers
```

### public hubs

```powerquery
let
    Fonte = PostgreSQL.Database("localhost:5432", "postgres"),
    public_hubs = Fonte{[Schema="public",Item="hubs"]}[Data]
in
    public_hubs
```

### public orders

```powerquery
let
    Fonte = PostgreSQL.Database("localhost:5432", "postgres"),
    public_orders = Fonte{[Schema="public",Item="orders"]}[Data]
in
    public_orders
```

### public payments

```powerquery
let
    Fonte = PostgreSQL.Database("localhost:5432", "postgres"),
    public_payments = Fonte{[Schema="public",Item="payments"]}[Data]
in
    public_payments
```

### public stores

```powerquery
let
    Fonte = PostgreSQL.Database("localhost:5432", "postgres"),
    public_stores = Fonte{[Schema="public",Item="stores"]}[Data]
in
    public_stores
```

### Medidas

```powerquery
let
    Fonte = Table.FromRows(Json.Document(Binary.Decompress(Binary.FromText("i44FAA==", BinaryEncoding.Base64), Compression.Deflate)), let _t = ((type nullable text) meta [Serialized.Text = true]) in type table [#"Coluna 1" = _t]),
    #"Tipo Alterado" = Table.TransformColumnTypes(Fonte,{{"Coluna 1", type text}})
in
    #"Tipo Alterado"
```

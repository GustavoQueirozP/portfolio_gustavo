CREATE TABLE channels (
    channel_id TEXT PRIMARY KEY,
    channel_name TEXT,
    channel_type TEXT
);

CREATE TABLE deliveries (
    delivery_id TEXT PRIMARY KEY,
    delivery_order_id TEXT,
    driver_id TEXT,
    delivery_distance_meters NUMERIC,
    delivery_status TEXT
);


CREATE TABLE drivers (
    driver_id TEXT PRIMARY KEY,
    driver_modal TEXT,
    driver_type TEXT
);
CREATE TABLE hubs (
    hub_id TEXT PRIMARY KEY,
    hub_name TEXT,
    hub_city TEXT,
    hub_state TEXT,
    hub_latitude NUMERIC,
    hub_longitude NUMERIC
);
CREATE TABLE orders (
    order_id TEXT PRIMARY KEY,
    store_id TEXT,
    channel_id TEXT,
    payment_order_id TEXT,
    delivery_order_id TEXT,
    order_status TEXT,
    order_amount NUMERIC,
    order_created_date TIMESTAMP,
    order_closed_date TIMESTAMP,
    order_estimated_delivery_date TIMESTAMP,
    order_delivery_date TIMESTAMP,
    order_total_delivery_time_seconds INTEGER,
    order_store_delivery_time_seconds INTEGER,
    order_ready_to_delivery_time_seconds INTEGER,
    order_created_hour INTEGER,
    order_created_minute INTEGER,
    order_created_day INTEGER,
    order_created_week INTEGER,
    order_created_month INTEGER,
    order_created_year INTEGER,
    order_created_day_of_week INTEGER,
    order_created_day_of_year INTEGER,
    order_closed_day INTEGER,
    order_closed_month INTEGER,
    order_closed_year INTEGER,
    order_delivery_day INTEGER,
    order_delivery_month INTEGER,
    order_delivery_year INTEGER
);
CREATE TABLE payments (
    payment_id TEXT PRIMARY KEY,
    payment_order_id TEXT,
    payment_amount NUMERIC,
    payment_fee NUMERIC,
    payment_method TEXT,
    payment_status TEXT
);

CREATE TABLE stores (
    store_id TEXT PRIMARY KEY,
    hub_id TEXT,
    store_name TEXT,
    store_segment TEXT,
    store_plan_price NUMERIC,
    store_latitude NUMERIC,
    store_longitude NUMERIC
);


SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';


-- Chaves estrangeiras
ALTER TABLE orders ADD CONSTRAINT fk_orders_channel FOREIGN KEY (channel_id) REFERENCES channels(channel_id);
ALTER TABLE orders ADD CONSTRAINT fk_orders_store FOREIGN KEY (store_id) REFERENCES stores(store_id);
ALTER TABLE stores ADD CONSTRAINT fk_stores_hub FOREIGN KEY (hub_id) REFERENCES hubs(hub_id);

SELECT o.order_id, p.payment_amount
FROM orders o
JOIN payments p ON o.payment_order_id = p.payment_order_id;

SELECT payment_order_id, COUNT(*)
FROM payments
GROUP BY payment_order_id
HAVING COUNT(*) > 1;

SELECT delivery_order_id, COUNT(*)
FROM deliveries
GROUP BY delivery_order_id
HAVING COUNT(*) > 1;

SELECT DISTINCT d.driver_id
FROM deliveries d
LEFT JOIN drivers dr ON d.driver_id = dr.driver_id
WHERE dr.driver_id IS NULL;

SELECT o.order_id, o.order_amount, p.payment_amount, p.payment_method
FROM orders o
JOIN payments p ON o.payment_order_id = p.payment_order_id;

SELECT o.order_id, d.delivery_id, d.delivery_distance_meters, dr.driver_type
FROM orders o
JOIN deliveries d ON o.delivery_order_id = d.delivery_order_id
JOIN drivers dr ON d.driver_id = dr.driver_id;

SELECT o.order_id, s.store_name, h.hub_city, h.hub_state
FROM orders o
JOIN stores s ON o.store_id = s.store_id
JOIN hubs h ON s.hub_id = h.hub_id;

SELECT o.order_id, c.channel_name, c.channel_type
FROM orders o
JOIN channels c ON o.channel_id = c.channel_id;

SELECT s.store_name, h.hub_name, h.hub_city
FROM stores s
JOIN hubs h ON s.hub_id = h.hub_id;


SELECT 
    c.channel_name,
    SUM(o.order_amount) AS total_faturado
FROM orders o
JOIN channels c ON o.channel_id = c.channel_id
GROUP BY c.channel_name
ORDER BY total_faturado DESC;

SELECT 
    s.store_name,
    SUM(o.order_amount) AS total_faturado
FROM orders o
JOIN stores s ON o.store_id = s.store_id
GROUP BY s.store_name
ORDER BY total_faturado DESC
LIMIT 10;

SELECT 
    h.hub_city,
    COUNT(o.order_id) AS total_pedidos
FROM orders o
JOIN stores s ON o.store_id = s.store_id
JOIN hubs h ON s.hub_id = h.hub_id
GROUP BY h.hub_city
ORDER BY total_pedidos DESC;

SELECT 
    p.payment_method,
    COUNT(p.payment_id) AS total_pagamentos,
    SUM(p.payment_amount) AS valor_total
FROM payments p
GROUP BY p.payment_method
ORDER BY valor_total DESC;

SELECT 
    dr.driver_type,
    AVG(d.delivery_distance_meters) AS distancia_media
FROM deliveries d
JOIN drivers dr ON d.driver_id = dr.driver_id
GROUP BY dr.driver_type
ORDER BY distancia_media DESC;

SELECT 
    s.store_segment,
    SUM(o.order_amount) AS total_faturado
FROM orders o
JOIN stores s ON o.store_id = s.store_id
GROUP BY s.store_segment
ORDER BY total_faturado DESC;

SELECT 
    c.channel_name,
    COUNT(o.order_id) AS total_cancelados
FROM orders o
JOIN channels c ON o.channel_id = c.channel_id
WHERE o.order_status = 'CANCELED'
GROUP BY c.channel_name
ORDER BY total_cancelados DESC;

SELECT 
    o.order_created_month AS mes,
    c.channel_name,
    COUNT(o.order_id) AS total_pedidos,
    SUM(o.order_amount) AS faturamento_total
FROM orders o
JOIN channels c ON o.channel_id = c.channel_id
GROUP BY o.order_created_month, c.channel_name
ORDER BY o.order_created_month, faturamento_total DESC;

SELECT 
    s.store_name,
    COUNT(o.order_id) AS total_pedidos,
    SUM(o.order_amount) AS faturamento_total
FROM orders o
JOIN stores s ON o.store_id = s.store_id
GROUP BY s.store_name
ORDER BY faturamento_total DESC
LIMIT 5;

SELECT 
    c.channel_name,
    COUNT(*) FILTER (WHERE o.order_status = 'CANCELED') AS total_cancelados,
    COUNT(o.order_id) AS total_pedidos,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE o.order_status = 'CANCELED') / NULLIF(COUNT(o.order_id), 0), 2
    ) AS percentual_cancelamento
FROM orders o
JOIN channels c ON o.channel_id = c.channel_id
GROUP BY c.channel_name
ORDER BY percentual_cancelamento DESC;

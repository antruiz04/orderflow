-- Crea una base de datos por microservicio (database-per-service pattern).
-- Cada servicio solo debería conectarse a SU base de datos.

CREATE DATABASE auth_db;
CREATE DATABASE catalog_db;
CREATE DATABASE orders_db;
CREATE DATABASE inventory_db;

-- Sistema de Inversión en Terrenos - Einherjer Blitz
-- Estructura de base de datos para inversiones tipo criptomoneda

-- Tabla principal de terrenos disponibles
CREATE TABLE `terrenos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `precio_inicial` decimal(15,2) NOT NULL DEFAULT 100.00,
  `precio_actual` decimal(15,2) NOT NULL DEFAULT 100.00,
  `supply_total` bigint(20) NOT NULL DEFAULT 1000000, -- Total de "acciones" disponibles
  `supply_circulante` bigint(20) NOT NULL DEFAULT 0, -- Acciones ya compradas
  `imagen` varchar(255) DEFAULT 'default_terrain.jpg',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activo` (`activo`),
  KEY `idx_precio_actual` (`precio_actual`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de inversiones de usuarios
CREATE TABLE `terrenos_inversiones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `terreno_id` int(11) NOT NULL,
  `cantidad_acciones` bigint(20) NOT NULL, -- Cantidad de "acciones" del terreno
  `precio_compra_promedio` decimal(15,8) NOT NULL, -- Precio promedio de compra
  `inversion_total` decimal(15,2) NOT NULL, -- Total invertido en esferas
  `fecha_primera_compra` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_terrain` (`user_id`, `terreno_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_terreno_id` (`terreno_id`),
  KEY `idx_cantidad_acciones` (`cantidad_acciones`),
  FOREIGN KEY (`terreno_id`) REFERENCES `terrenos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de historial de precios (para gráficos)
CREATE TABLE `terrenos_precio_historial` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `terreno_id` int(11) NOT NULL,
  `precio` decimal(15,8) NOT NULL,
  `volumen_24h` decimal(15,2) NOT NULL DEFAULT 0.00, -- Volumen de transacciones en 24h
  `supply_circulante` bigint(20) NOT NULL,
  `market_cap` decimal(20,2) NOT NULL, -- precio_actual * supply_circulante
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_terreno_fecha` (`terreno_id`, `fecha`),
  KEY `idx_fecha` (`fecha`),
  FOREIGN KEY (`terreno_id`) REFERENCES `terrenos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de transacciones de compra/venta
CREATE TABLE `terrenos_transacciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `terreno_id` int(11) NOT NULL,
  `tipo` enum('compra','venta') NOT NULL,
  `cantidad_acciones` bigint(20) NOT NULL,
  `precio_unitario` decimal(15,8) NOT NULL,
  `total_esferas` decimal(15,2) NOT NULL, -- Total en esferas
  `fee_transaccion` decimal(15,2) NOT NULL DEFAULT 0.00,
  `precio_antes` decimal(15,8) NOT NULL, -- Precio antes de la transacción
  `precio_despues` decimal(15,8) NOT NULL, -- Precio después de la transacción
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_terreno_id` (`terreno_id`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_fecha` (`fecha`),
  FOREIGN KEY (`terreno_id`) REFERENCES `terrenos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para eventos que afectan precios (noticias, eventos del juego)
CREATE TABLE `terrenos_eventos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `terreno_id` int(11) DEFAULT NULL, -- NULL = evento global
  `titulo` varchar(200) NOT NULL,
  `descripcion` text,
  `tipo` enum('positivo','negativo','neutro') NOT NULL DEFAULT 'neutro',
  `impacto_precio` decimal(5,2) NOT NULL DEFAULT 0.00, -- Porcentaje de impacto (-100 a +100)
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_inicio` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` timestamp NULL DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_terreno_activo` (`terreno_id`, `activo`),
  KEY `idx_fecha_inicio` (`fecha_inicio`),
  KEY `idx_tipo` (`tipo`),
  FOREIGN KEY (`terreno_id`) REFERENCES `terrenos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de análisis técnico y métricas
CREATE TABLE `terrenos_metricas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `terreno_id` int(11) NOT NULL,
  `rsi` decimal(5,2) DEFAULT NULL, -- Relative Strength Index
  `media_movil_7d` decimal(15,8) DEFAULT NULL,
  `media_movil_30d` decimal(15,8) DEFAULT NULL,
  `volatilidad_24h` decimal(5,2) DEFAULT NULL,
  `cambio_24h` decimal(5,2) DEFAULT NULL, -- Porcentaje de cambio
  `cambio_7d` decimal(5,2) DEFAULT NULL,
  `cambio_30d` decimal(5,2) DEFAULT NULL,
  `volumen_24h` decimal(15,2) DEFAULT NULL,
  `numero_holders` int(11) DEFAULT 0, -- Número de inversores
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_terreno_fecha` (`terreno_id`, `fecha`),
  KEY `idx_terreno_id` (`terreno_id`),
  KEY `idx_fecha` (`fecha`),
  FOREIGN KEY (`terreno_id`) REFERENCES `terrenos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar terrenos de producción (precios en 0 para configuración manual de Esencias Azules)
INSERT INTO `terrenos` (`nombre`, `descripcion`, `precio_inicial`, `precio_actual`, `supply_total`, `supply_circulante`, `imagen`) VALUES
('Mary Geoise', 'Capital sagrada del Gobierno Mundial en el tope del Red Line', 1447.00, 1447.00, 500000, 0, 'default.jpg'),
('Cybertron', 'Planeta mecánico hogar de los Transformers con tecnología avanzada', 6075.00, 6075.00, 500000, 0, 'default.jpg'),
('Isla Nublar y las 5 Muertes', 'Archipiélago donde habitan los dinosaurios de Jurassic Park', 1000.00, 1000.00, 500000, 0, 'default.jpg'),
('Konoha', 'Villa oculta de la Hoja con ninjas élite y chakra abundante', 1200.00, 1200.00, 500000, 0, 'default.jpg'),
('Fortaleza de la Soledad', 'Refugio ártico de Superman con tecnología kryptoniana', 3375.00, 3375.00, 500000, 0, 'default.jpg'),
('Gran Tumba de Nazarick', 'Fortaleza subterránea de Ainz Ooal Gown y los NPCs de Yggdrasil', 2656.00, 2656.00, 500000, 0, 'default.jpg'),
('Sociedad de Almas', 'Dimensión espiritual con poderes sobrenaturales y zanpakutos', 2012.00, 2012.00, 500000, 0, 'default.jpg'),
('Sumeru', 'Nación del conocimiento con sabiduría ancestral y poder dendro', 2713.00, 2713.00, 500000, 0, 'default.jpg'),
('Piltover/Zaun', 'Ciudad del progreso y los bajos fondos de Runeterra', 2900.00, 2900.00, 500000, 0, 'default.jpg'),
('Mondstadt', 'Ciudad de la libertad protegida por el Anemo Archon', 1360.00, 1360.00, 500000, 0, 'default.jpg'),
('Cueva de los Akatsuki', 'Base secreta de la organización criminal más peligrosa', 1125.00, 1125.00, 500000, 0, 'default.jpg'),
('Subsuelo', 'Reino subterráneo lleno de monstruos y tesoros ocultos', 1670.00, 1670.00, 500000, 0, 'default.jpg'),
('Fortaleza Karma', 'Bastión místico donde se entrenan los guerreros más poderosos', 1670.00, 1670.00, 500000, 0, 'default.jpg'),
('El Olimpo', 'Monte sagrado hogar de los dioses griegos', 1290.00, 1290.00, 500000, 0, 'default.jpg'),
('Wakanda', 'Nación africana tecnológicamente avanzada rica en vibranium', 1990.00, 1990.00, 500000, 0, 'default.jpg'),
('Atlantis', 'Reino submarino perdido con tecnología antigua avanzada', 1030.00, 1030.00, 500000, 0, 'default.jpg'),
('Liyue', 'Puerto comercial con abundantes recursos minerales y contratos geo', 1814.00, 1814.00, 500000, 0, 'default.jpg'),
('Penacony', 'Planeta de los sueños donde la realidad se mezcla con fantasías', 3128.00, 3128.00, 500000, 0, 'default.jpg'),
('Aldea de Clash of Clans', 'Territorio tribal donde clanes luchan por recursos y gloria', 1325.00, 1325.00, 500000, 0, 'default.jpg'),
('Rhodes Island', 'Organización farmacéutica móvil que lucha contra la Oripathy', 2670.00, 2670.00, 500000, 0, 'default.jpg'),
('Fontaine', 'Nación de la justicia con tecnología hidráulica avanzada', 7012.00, 7012.00, 500000, 0, 'default.jpg'),
('Wano', 'País aislado de samuráis con tradiciones ancestrales', 1915.00, 1915.00, 500000, 0, 'default.jpg'),
('La Senda', 'Camino místico que conecta diferentes dimensiones', 2137.00, 2137.00, 500000, 0, 'default.jpg'),
('Elbaph', 'Isla de los gigantes guerreros en el Nuevo Mundo', 1356.00, 1356.00, 500000, 0, 'default.jpg'),
('Fortaleza Dimensional Infinita', 'Bastión que existe entre múltiples realidades', 2600.00, 2600.00, 500000, 0, 'default.jpg');

-- Insertar precios iniciales en el historial
INSERT INTO `terrenos_precio_historial` (`terreno_id`, `precio`, `supply_circulante`, `market_cap`)
SELECT `id`, `precio_actual`, `supply_circulante`, (`precio_actual` * `supply_circulante`) 
FROM `terrenos`;


-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 07-09-2025 a las 01:08:01
-- Versión del servidor: 10.4.27-MariaDB
-- Versión de PHP: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `einherjer_blitz`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pase_batalla`
--

CREATE TABLE `pase_batalla` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `premium` tinyint(1) DEFAULT 0,
  `progreso` int(11) DEFAULT 0,
  `temporada` varchar(50) DEFAULT 'actual',
  `fecha_compra` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL DEFAULT curdate(),
  `used` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `payment_orders`
--

CREATE TABLE `payment_orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` varchar(100) NOT NULL,
  `package_type` enum('basic','premium','deluxe') NOT NULL,
  `keys_amount` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `status` enum('pending','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
  `payment_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `ID` int(11) NOT NULL,
  `Nombre` varchar(100) NOT NULL,
  `Precio_Esferas` int(11) NOT NULL,
  `Stock` int(11) NOT NULL,
  `Imagen_URL` varchar(500) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `categoria` varchar(50) DEFAULT 'general',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recompensas_eliminadas`
--

CREATE TABLE `recompensas_eliminadas` (
  `id` int(11) NOT NULL,
  `original_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `recompensa_obtenida` varchar(100) NOT NULL,
  `tipo_recompensa` varchar(50) DEFAULT 'general',
  `valor` int(11) DEFAULT 0,
  `fecha_obtencion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `fecha_eliminacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recompensas_usuario`
--

CREATE TABLE `recompensas_usuario` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `recompensa_obtenida` varchar(100) NOT NULL,
  `tipo_recompensa` varchar(50) DEFAULT 'general',
  `valor` int(11) DEFAULT 0,
  `fecha_obtencion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `terrain_investments`
--

CREATE TABLE `terrain_investments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `terrain_id` int(11) NOT NULL,
  `cantidad_acciones` decimal(15,8) NOT NULL,
  `precio_compra` decimal(15,8) NOT NULL,
  `valor_inversion` decimal(15,2) NOT NULL,
  `fecha_inversion` timestamp NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `terrenos`
--

CREATE TABLE `terrenos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `owner_id` int(11) NOT NULL,
  `precio_inicial` decimal(15,2) NOT NULL DEFAULT 1000.00,
  `precio_actual` decimal(15,2) NOT NULL DEFAULT 1000.00,
  `supply_total` decimal(15,2) NOT NULL DEFAULT 10000.00,
  `supply_circulante` decimal(15,2) NOT NULL DEFAULT 10000.00,
  `volumen_24h` decimal(15,2) DEFAULT 0.00,
  `cambio_24h` decimal(5,2) DEFAULT 0.00,
  `imagen_url` varchar(500) DEFAULT 'default_terrain.jpg',
  `categoria` varchar(50) DEFAULT 'residencial',
  `ubicacion` varchar(200) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultima_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `terrenos`
--

INSERT INTO `terrenos` (`id`, `nombre`, `descripcion`, `owner_id`, `precio_inicial`, `precio_actual`, `supply_total`, `supply_circulante`, `volumen_24h`, `cambio_24h`, `imagen_url`, `categoria`, `ubicacion`, `activo`, `fecha_creacion`, `ultima_actualizacion`) VALUES
(1, 'Fortaleza de la Soledad', NULL, 1, '1000.00', '3375.00', '10000.00', '100.00', '0.00', '0.00', 'fortaleza1.jpg', 'fortaleza', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(2, 'Cybertron', NULL, 1, '1000.00', '6075.00', '10000.00', '100.00', '0.00', '0.00', 'cybertron.jpg', 'industrial', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(3, 'Fortaleza Dimensional Infinita', NULL, 1, '1000.00', '2600.00', '10000.00', '100.00', '0.00', '0.00', 'fortaleza2.jpg', 'fortaleza', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(4, 'Marineford', NULL, 1, '1000.00', '1365.00', '10000.00', '100.00', '0.00', '0.00', 'marineford.jpg', 'fortaleza', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(5, 'Fortaleza Karma', NULL, 1, '1000.00', '1675.00', '10000.00', '100.00', '0.00', '0.00', 'karma.jpg', 'fortaleza', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(6, 'Colegio Técnico de Hechicería Metropolitana de Tokio', NULL, 1, '1000.00', '1200.00', '10000.00', '100.00', '0.00', '0.00', 'tokyo.jpg', 'comercial', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(7, 'Liyue', NULL, 1, '1000.00', '1814.00', '10000.00', '100.00', '0.00', '0.00', 'liyue.jpg', 'comercial', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(8, 'Fontaine', NULL, 1, '1000.00', '7013.91', '10000.00', '100.00', '759.40', '0.00', 'fontaine.jpg', 'natural', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 04:22:38'),
(9, 'Sociedad de Almas', NULL, 1, '1000.00', '2012.00', '10000.00', '100.00', '0.00', '0.00', 'almas.jpg', 'fortaleza', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(10, 'Penacony', NULL, 1, '1000.00', '3128.00', '10000.00', '100.00', '0.00', '0.00', 'penacony.jpg', 'comercial', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(11, 'Wano', NULL, 1, '1000.00', '1915.00', '10000.00', '100.00', '0.00', '0.00', 'wano.jpg', 'natural', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(12, 'Inazuma', NULL, 1, '1000.00', '1275.00', '10000.00', '100.00', '0.00', '0.00', 'inazuma.jpg', 'natural', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(13, 'Templo de Kamisama', NULL, 1, '1000.00', '3806.00', '10000.00', '100.00', '0.00', '0.00', 'kamisama.jpg', 'fortaleza', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(14, 'Natlan', NULL, 1, '1000.00', '3750.00', '10000.00', '100.00', '0.00', '0.00', 'natlan.jpg', 'natural', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(15, 'La Senda', NULL, 1, '1000.00', '2137.00', '10000.00', '100.00', '0.00', '0.00', 'senda.jpg', 'natural', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(16, 'Piltover/Zaun', NULL, 1, '1000.00', '2900.00', '10000.00', '100.00', '0.00', '0.00', 'piltover.jpg', 'industrial', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(17, 'Sumeru', NULL, 1, '1000.00', '2713.00', '10000.00', '100.00', '0.00', '0.00', 'sumeru.jpg', 'natural', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(18, 'Rhodes Island', NULL, 1, '1000.00', '2670.00', '10000.00', '100.00', '0.00', '0.00', 'rhodes.jpg', 'fortaleza', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(19, 'Mary Geoise', NULL, 1, '1000.00', '1447.00', '10000.00', '100.00', '0.00', '0.00', 'mary.jpg', 'fortaleza', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14'),
(20, 'Nazarick', NULL, 1, '1000.00', '2656.00', '10000.00', '100.00', '0.00', '0.00', 'nazarick.jpg', 'fortaleza', NULL, 1, '2025-08-30 03:48:14', '2025-08-30 03:48:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `transacciones_einherjer`
--

CREATE TABLE `transacciones_einherjer` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `tipo` enum('minado','deposito','transferencia','retiro','compra') NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `destinatario` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_portfolio`
--

CREATE TABLE `user_portfolio` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `terrain_id` int(11) NOT NULL,
  `total_acciones` decimal(15,8) NOT NULL DEFAULT 0.00000000,
  `valor_promedio_compra` decimal(15,8) NOT NULL DEFAULT 0.00000000,
  `inversion_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `valor_actual` decimal(15,2) NOT NULL DEFAULT 0.00,
  `ganancia_perdida` decimal(15,2) NOT NULL DEFAULT 0.00,
  `porcentaje_change` decimal(5,2) NOT NULL DEFAULT 0.00,
  `ultima_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `unique_id` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `jefes_derrotados` int(11) NOT NULL DEFAULT 0,
  `megajefes_derrotados` int(11) NOT NULL DEFAULT 0,
  `horas_jugadas` int(11) NOT NULL DEFAULT 0,
  `rango` varchar(50) NOT NULL DEFAULT 'Sin Rango',
  `copas` int(11) NOT NULL DEFAULT 0,
  `llaves` int(11) NOT NULL DEFAULT 0,
  `recompensas` int(11) NOT NULL DEFAULT 0,
  `perfil_imagen` varchar(255) DEFAULT 'default.jpg',
  `frase` varchar(255) DEFAULT 'Guerrero de Einherjer',
  `nivel` int(11) NOT NULL DEFAULT 1,
  `experiencia` int(11) NOT NULL DEFAULT 0,
  `victorias` int(11) NOT NULL DEFAULT 0,
  `derrotas` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `username`, `email`, `password_hash`, `unique_id`, `created_at`, `last_login`, `is_active`, `jefes_derrotados`, `megajefes_derrotados`, `horas_jugadas`, `rango`, `copas`, `llaves`, `recompensas`, `perfil_imagen`, `frase`, `nivel`, `experiencia`, `victorias`, `derrotas`) VALUES
(1, 'admin', 'gg4545149@gmail.com', '$2y$10$.01.ubnWV4CQRj9CdsOMle4RYl1JNwowsAHMqlSKpO1.4X9YyoFbO', 'ADMIN2024', '2025-05-24 22:46:51', '2025-09-06 22:48:20', 1, 0, 0, 0, 'Gran Maestro', 9999, 69, 378, 'default.jpg', 'Administrador de Einherjer Blitz', 50, 0, 0, 0),
(3, 'fran', '', '$argon2id$v=19$m=65536,t=4,p=1$bTdGZVd4dnFqdXlOQm1HLw$CDtkl0+cfl5rpSWuLIdXzlM2gFMMJNHfcvjJHdXCaBQ', 'AC9A319223D3CA3A', '2025-08-18 14:29:49', '2025-08-22 19:46:06', 1, 0, 0, 0, 'Sin Rango', 0, 30, 0, 'default.jpg', 'Guerrero de Einherjer', 1, 0, 0, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `wallet_config`
--

CREATE TABLE `wallet_config` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `fee_trading` decimal(5,4) DEFAULT 0.0025,
  `slippage_tolerance` decimal(5,4) DEFAULT 0.0050,
  `auto_reinvest` tinyint(1) DEFAULT 0,
  `notifications_enabled` tinyint(1) DEFAULT 1,
  `privacy_mode` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `wallet_transactions`
--

CREATE TABLE `wallet_transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tipo` enum('compra_terreno','venta_terreno','transferencia_esferas','transferencia_llaves','recompensa','minado','deposito','retiro','fee') NOT NULL,
  `subtipo` varchar(50) DEFAULT NULL,
  `cantidad_esferas` decimal(15,2) DEFAULT 0.00,
  `cantidad_llaves` int(11) DEFAULT 0,
  `terrain_id` int(11) DEFAULT NULL,
  `precio_por_accion` decimal(15,8) DEFAULT NULL,
  `cantidad_acciones` decimal(15,8) DEFAULT NULL,
  `fee_amount` decimal(15,2) DEFAULT 0.00,
  `destinatario_id` int(11) DEFAULT NULL,
  `hash_transaccion` varchar(64) DEFAULT NULL,
  `estado` enum('pendiente','completada','fallida','cancelada') DEFAULT 'completada',
  `descripcion` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `fecha_transaccion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `pase_batalla`
--
ALTER TABLE `pase_batalla`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_username_temporada` (`user_id`,`temporada`),
  ADD KEY `username` (`username`);

--
-- Indices de la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Indices de la tabla `payment_orders`
--
ALTER TABLE `payment_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_id` (`order_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`ID`);

--
-- Indices de la tabla `recompensas_eliminadas`
--
ALTER TABLE `recompensas_eliminadas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_fecha_eliminacion` (`fecha_eliminacion`);

--
-- Indices de la tabla `recompensas_usuario`
--
ALTER TABLE `recompensas_usuario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `username` (`username`);

--
-- Indices de la tabla `terrain_investments`
--
ALTER TABLE `terrain_investments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_terrain` (`user_id`,`terrain_id`),
  ADD KEY `idx_fecha` (`fecha_inversion`),
  ADD KEY `terrain_id` (`terrain_id`);

--
-- Indices de la tabla `terrenos`
--
ALTER TABLE `terrenos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_owner` (`owner_id`),
  ADD KEY `idx_categoria` (`categoria`),
  ADD KEY `idx_precio` (`precio_actual`);

--
-- Indices de la tabla `transacciones_einherjer`
--
ALTER TABLE `transacciones_einherjer`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `username` (`username`),
  ADD KEY `tipo` (`tipo`);

--
-- Indices de la tabla `user_portfolio`
--
ALTER TABLE `user_portfolio`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_user_terrain` (`user_id`,`terrain_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_valor` (`valor_actual`),
  ADD KEY `terrain_id` (`terrain_id`);

--
-- Indices de la tabla `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_token` (`session_token`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `unique_id` (`unique_id`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_unique_id` (`unique_id`);

--
-- Indices de la tabla `wallet_config`
--
ALTER TABLE `wallet_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_user` (`user_id`);

--
-- Indices de la tabla `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_hash` (`hash_transaccion`),
  ADD KEY `idx_user_fecha` (`user_id`,`fecha_transaccion`),
  ADD KEY `idx_tipo` (`tipo`),
  ADD KEY `idx_terrain` (`terrain_id`),
  ADD KEY `idx_destinatario` (`destinatario_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `pase_batalla`
--
ALTER TABLE `pase_batalla`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `payment_orders`
--
ALTER TABLE `payment_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `recompensas_eliminadas`
--
ALTER TABLE `recompensas_eliminadas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `recompensas_usuario`
--
ALTER TABLE `recompensas_usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `terrain_investments`
--
ALTER TABLE `terrain_investments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `terrenos`
--
ALTER TABLE `terrenos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de la tabla `transacciones_einherjer`
--
ALTER TABLE `transacciones_einherjer`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `user_portfolio`
--
ALTER TABLE `user_portfolio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `wallet_config`
--
ALTER TABLE `wallet_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `pase_batalla`
--
ALTER TABLE `pase_batalla`
  ADD CONSTRAINT `pase_batalla_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `payment_orders`
--
ALTER TABLE `payment_orders`
  ADD CONSTRAINT `payment_orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `recompensas_eliminadas`
--
ALTER TABLE `recompensas_eliminadas`
  ADD CONSTRAINT `recompensas_eliminadas_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `recompensas_usuario`
--
ALTER TABLE `recompensas_usuario`
  ADD CONSTRAINT `recompensas_usuario_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `terrain_investments`
--
ALTER TABLE `terrain_investments`
  ADD CONSTRAINT `terrain_investments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `terrain_investments_ibfk_2` FOREIGN KEY (`terrain_id`) REFERENCES `terrenos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `terrenos`
--
ALTER TABLE `terrenos`
  ADD CONSTRAINT `terrenos_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `transacciones_einherjer`
--
ALTER TABLE `transacciones_einherjer`
  ADD CONSTRAINT `transacciones_einherjer_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_portfolio`
--
ALTER TABLE `user_portfolio`
  ADD CONSTRAINT `user_portfolio_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_portfolio_ibfk_2` FOREIGN KEY (`terrain_id`) REFERENCES `terrenos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `wallet_config`
--
ALTER TABLE `wallet_config`
  ADD CONSTRAINT `wallet_config_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `wallet_transactions`
--
ALTER TABLE `wallet_transactions`
  ADD CONSTRAINT `wallet_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wallet_transactions_ibfk_2` FOREIGN KEY (`terrain_id`) REFERENCES `terrenos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `wallet_transactions_ibfk_3` FOREIGN KEY (`destinatario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

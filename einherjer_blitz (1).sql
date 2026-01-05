-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 05-01-2026 a las 05:15:22
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
CREATE DATABASE IF NOT EXISTS `einherjer_blitz` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `einherjer_blitz`;

DELIMITER $$
--
-- Procedimientos
--
DROP PROCEDURE IF EXISTS `sp_claim_all_tickets`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_claim_all_tickets` (IN `p_user_id` INT, OUT `p_tickets_claimed` INT, OUT `p_success` BOOLEAN)   BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_tickets_claimed = 0;
    END;
    
    START TRANSACTION;
    
    -- Contar tickets pendientes
    SELECT COUNT(*) INTO p_tickets_claimed
    FROM tienda_tickets
    WHERE user_id = p_user_id AND claimed = 0;
    
    -- Marcar todos como reclamados
    UPDATE tienda_tickets
    SET claimed = 1, claimed_date = NOW()
    WHERE user_id = p_user_id AND claimed = 0;
    
    COMMIT;
    SET p_success = TRUE;
END$$

DROP PROCEDURE IF EXISTS `sp_cleanup_expired_tickets`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_cleanup_expired_tickets` ()   BEGIN
    DECLARE v_deleted_count INT DEFAULT 0;
    
    -- Mover tickets expirados no reclamados al historial
    INSERT INTO tienda_tickets_historial (
        ticket_id, user_id, username, item_name, cantidad, 
        ticket_type, claimed_date, notes
    )
    SELECT 
        id, user_id, username, item_name, cantidad,
        ticket_type, NOW(), CONCAT('Ticket expirado - ', notes)
    FROM tienda_tickets
    WHERE claimed = 0 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    -- Eliminar tickets expirados
    DELETE FROM tienda_tickets
    WHERE claimed = 0 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    SET v_deleted_count = ROW_COUNT();
    
    SELECT v_deleted_count as deleted_count;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ai_chat_usage`
--

DROP TABLE IF EXISTS `ai_chat_usage`;
CREATE TABLE `ai_chat_usage` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `model_type` varchar(32) NOT NULL,
  `usage_date` date NOT NULL,
  `request_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `prompt_tokens` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `output_tokens` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `context_limit_tokens` int(10) UNSIGNED NOT NULL DEFAULT 2048,
  `prompt_tokens_used` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `output_tokens_used` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `ai_chat_usage`:
--   `user_id`
--       `usuarios` -> `id`
--

--
-- Volcado de datos para la tabla `ai_chat_usage`
--

INSERT INTO `ai_chat_usage` (`id`, `user_id`, `model_type`, `usage_date`, `request_count`, `prompt_tokens`, `output_tokens`, `context_limit_tokens`, `prompt_tokens_used`, `output_tokens_used`, `created_at`, `updated_at`) VALUES
(1, 1, 'mini', '2025-12-12', 1, 35, 6, 2048, 35, 6, '2025-12-12 02:55:38', '2025-12-12 02:55:54');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `marketplace_active_listings`
-- (Véase abajo para la vista actual)
--
DROP VIEW IF EXISTS `marketplace_active_listings`;
CREATE TABLE `marketplace_active_listings` (
`id` int(11)
,`seller_id` int(11)
,`seller_username` varchar(50)
,`item_name` varchar(150)
,`item_description` text
,`item_image` varchar(500)
,`reward_id` int(11)
,`price_llaves` int(11)
,`price_esferas` int(11)
,`price_cupones` int(11)
,`is_premium_listing` tinyint(1)
,`is_active` tinyint(1)
,`is_sold` tinyint(1)
,`stock_quantity` int(11)
,`views_count` int(11)
,`created_at` timestamp
,`updated_at` timestamp
,`sold_at` timestamp
,`seller_avatar` varchar(255)
,`seller_rank` varchar(50)
,`seller_is_premium` tinyint(1)
,`seller_has_highlight` tinyint(1)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `marketplace_cupones`
--

DROP TABLE IF EXISTS `marketplace_cupones`;
CREATE TABLE `marketplace_cupones` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `cupones_amount` int(11) NOT NULL DEFAULT 0,
  `transaction_id` int(11) DEFAULT NULL,
  `is_claimed` tinyint(1) DEFAULT 0,
  `claimed_at` timestamp NULL DEFAULT NULL,
  `messenger_verified` tinyint(1) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `marketplace_cupones`:
--   `user_id`
--       `usuarios` -> `id`
--   `transaction_id`
--       `marketplace_transactions` -> `id`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `marketplace_listings`
--

DROP TABLE IF EXISTS `marketplace_listings`;
CREATE TABLE `marketplace_listings` (
  `id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `seller_username` varchar(50) NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `item_description` text DEFAULT NULL,
  `item_category` varchar(100) DEFAULT 'General' COMMENT 'Categoría del artículo',
  `item_image` varchar(500) DEFAULT NULL,
  `item_image_url` varchar(500) DEFAULT NULL COMMENT 'URL de imagen',
  `reward_id` int(11) DEFAULT NULL COMMENT 'FK a recompensas_usuario si es del inventario',
  `ticket_id` int(11) DEFAULT NULL COMMENT 'FK a tienda_tickets si proviene de ticket',
  `source_type` enum('recompensa','ticket','manual') DEFAULT 'manual' COMMENT 'Origen del artículo',
  `price_llaves` int(11) DEFAULT 0,
  `price_esferas` int(11) DEFAULT 0,
  `price_cupones` int(11) DEFAULT 0 COMMENT 'Cupones azules (canjeo en Messenger)',
  `is_premium_listing` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `is_sold` tinyint(1) DEFAULT 0,
  `stock_quantity` int(11) DEFAULT 1,
  `views_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `sold_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `marketplace_listings`:
--   `seller_id`
--       `usuarios` -> `id`
--   `reward_id`
--       `recompensas_usuario` -> `id`
--   `ticket_id`
--       `tienda_tickets` -> `id`
--

--
-- Disparadores `marketplace_listings`
--
DROP TRIGGER IF EXISTS `after_marketplace_sale`;
DELIMITER $$
CREATE TRIGGER `after_marketplace_sale` AFTER UPDATE ON `marketplace_listings` FOR EACH ROW BEGIN
    IF NEW.is_sold = 1 AND OLD.is_sold = 0 AND NEW.reward_id IS NOT NULL THEN
        -- Marcar la recompensa como "vendida" agregando un campo extra
        UPDATE recompensas_usuario 
        SET tipo_recompensa = CONCAT(tipo_recompensa, '_vendido')
        WHERE id = NEW.reward_id;
    END IF;
END
$$
DELIMITER ;
DROP TRIGGER IF EXISTS `increment_listing_views`;
DELIMITER $$
CREATE TRIGGER `increment_listing_views` BEFORE UPDATE ON `marketplace_listings` FOR EACH ROW BEGIN
    IF NEW.views_count > OLD.views_count THEN
        SET NEW.views_count = OLD.views_count + 1;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `marketplace_premium`
--

DROP TABLE IF EXISTS `marketplace_premium`;
CREATE TABLE `marketplace_premium` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `premium_active` tinyint(1) DEFAULT 1,
  `premium_start_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `premium_end_date` timestamp NULL DEFAULT NULL,
  `can_upload_photos` tinyint(1) DEFAULT 1,
  `highlighted_listing` tinyint(1) DEFAULT 1,
  `can_sell_without_inventory` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `marketplace_premium`:
--   `user_id`
--       `usuarios` -> `id`
--

--
-- Volcado de datos para la tabla `marketplace_premium`
--

INSERT INTO `marketplace_premium` (`id`, `user_id`, `username`, `premium_active`, `premium_start_date`, `premium_end_date`, `can_upload_photos`, `highlighted_listing`, `can_sell_without_inventory`, `created_at`) VALUES
(1, 1, 'admin', 1, '2025-11-10 22:55:30', NULL, 1, 1, 1, '2025-11-10 22:55:30');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `marketplace_seller_stats`
-- (Véase abajo para la vista actual)
--
DROP VIEW IF EXISTS `marketplace_seller_stats`;
CREATE TABLE `marketplace_seller_stats` (
`seller_id` int(11)
,`seller_username` varchar(50)
,`total_listings` bigint(21)
,`active_listings` bigint(21)
,`total_sales` bigint(21)
,`total_llaves_earned` decimal(32,0)
,`total_esferas_earned` decimal(32,0)
,`total_cupones_earned` decimal(32,0)
,`is_premium` tinyint(1)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `marketplace_transactions`
--

DROP TABLE IF EXISTS `marketplace_transactions`;
CREATE TABLE `marketplace_transactions` (
  `id` int(11) NOT NULL,
  `listing_id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `seller_username` varchar(50) NOT NULL,
  `buyer_id` int(11) NOT NULL,
  `buyer_username` varchar(50) NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `paid_llaves` int(11) DEFAULT 0,
  `paid_esferas` int(11) DEFAULT 0,
  `paid_cupones` int(11) DEFAULT 0,
  `transaction_type` enum('llaves','esferas','cupones') NOT NULL DEFAULT 'esferas',
  `status` enum('pending','completed','cancelled') DEFAULT 'completed',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `marketplace_transactions`:
--   `listing_id`
--       `marketplace_listings` -> `id`
--   `seller_id`
--       `usuarios` -> `id`
--   `buyer_id`
--       `usuarios` -> `id`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `online_battles`
--

DROP TABLE IF EXISTS `online_battles`;
CREATE TABLE `online_battles` (
  `id` int(11) NOT NULL,
  `player1_id` int(11) NOT NULL,
  `player2_id` int(11) NOT NULL,
  `player1_username` varchar(50) NOT NULL,
  `player2_username` varchar(50) NOT NULL,
  `player1_character_id` int(11) NOT NULL,
  `player2_character_id` int(11) NOT NULL,
  `player1_rango` varchar(50) NOT NULL,
  `player2_rango` varchar(50) NOT NULL,
  `player1_copas` int(11) NOT NULL,
  `player2_copas` int(11) NOT NULL,
  `battle_state` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`battle_state`)),
  `current_turn` enum('player1','player2') NOT NULL,
  `turn_started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `turn_timeout` int(11) DEFAULT 30,
  `status` enum('active','finished','abandoned') DEFAULT 'active',
  `winner_id` int(11) DEFAULT NULL,
  `end_reason` enum('knockout','surrender','timeout','disconnect') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `player1_last_heartbeat` timestamp NOT NULL DEFAULT current_timestamp(),
  `player2_last_heartbeat` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `online_battles`:
--   `player1_id`
--       `usuarios` -> `id`
--   `player2_id`
--       `usuarios` -> `id`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `online_match_history`
--

DROP TABLE IF EXISTS `online_match_history`;
CREATE TABLE `online_match_history` (
  `id` int(11) NOT NULL,
  `battle_id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  `opponent_id` int(11) NOT NULL,
  `player_username` varchar(50) NOT NULL,
  `opponent_username` varchar(50) NOT NULL,
  `player_character_id` int(11) NOT NULL,
  `opponent_character_id` int(11) NOT NULL,
  `result` enum('win','loss','draw') NOT NULL,
  `cups_change` int(11) NOT NULL,
  `duration_seconds` int(11) NOT NULL,
  `damage_dealt` int(11) DEFAULT 0,
  `damage_received` int(11) DEFAULT 0,
  `rounds_played` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `online_match_history`:
--   `battle_id`
--       `online_battles` -> `id`
--   `player_id`
--       `usuarios` -> `id`
--   `opponent_id`
--       `usuarios` -> `id`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `online_queue`
--

DROP TABLE IF EXISTS `online_queue`;
CREATE TABLE `online_queue` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `rango` varchar(50) NOT NULL,
  `copas` int(11) NOT NULL,
  `character_id` int(11) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_heartbeat` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` enum('searching','matched','cancelled') DEFAULT 'searching',
  `match_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `online_queue`:
--   `user_id`
--       `usuarios` -> `id`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pase_batalla`
--

DROP TABLE IF EXISTS `pase_batalla`;
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

--
-- RELACIONES PARA LA TABLA `pase_batalla`:
--   `user_id`
--       `usuarios` -> `id`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL DEFAULT curdate(),
  `used` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `password_reset_tokens`:
--   `user_id`
--       `usuarios` -> `id`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

DROP TABLE IF EXISTS `productos`;
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

--
-- RELACIONES PARA LA TABLA `productos`:
--

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`ID`, `Nombre`, `Precio_Esferas`, `Stock`, `Imagen_URL`, `descripcion`, `categoria`, `created_at`) VALUES
(3, 'Valorant', 1000, 0, 'https://i.pinimg.com/736x/b4/66/4f/b4664fb791957f5bfb1b78b16b741851.jpg', 'prueba', 'ninguna', '2025-09-29 04:04:31'),
(4, 'Prueba 2', 10, 0, 'asdnuasudibabdni', 'prueba', 'ninguna', '2025-09-29 04:21:31');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recompensas_eliminadas`
--

DROP TABLE IF EXISTS `recompensas_eliminadas`;
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

--
-- RELACIONES PARA LA TABLA `recompensas_eliminadas`:
--   `user_id`
--       `usuarios` -> `id`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recompensas_usuario`
--

DROP TABLE IF EXISTS `recompensas_usuario`;
CREATE TABLE `recompensas_usuario` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `recompensa_obtenida` varchar(100) NOT NULL,
  `tipo_recompensa` varchar(50) DEFAULT 'general',
  `valor` int(11) DEFAULT 0,
  `fecha_obtencion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `recompensas_usuario`:
--   `user_id`
--       `usuarios` -> `id`
--

--
-- Volcado de datos para la tabla `recompensas_usuario`
--

INSERT INTO `recompensas_usuario` (`id`, `user_id`, `username`, `recompensa_obtenida`, `tipo_recompensa`, `valor`, `fecha_obtencion`) VALUES
(24, 1, 'admin', 'Chaldea (Fate)', 'terrain_vendido_vendido', 1, '2025-10-15 19:08:47'),
(54, 1, 'admin', 'Dad Key', 'special', 1, '2025-12-05 02:31:52'),
(55, 1, 'admin', 'Hipódromo Valhalla (Uma Musume)', 'terrain', 1, '2025-12-05 02:41:11'),
(56, 1, 'admin', 'Krypton (DC Comics)', 'terrain', 1, '2025-12-05 02:45:30'),
(57, 1, 'admin', 'Hallownest (Hollow Knight)', 'terrain', 1, '2025-12-05 02:46:55'),
(58, 1, 'admin', 'Skypeia (One Piece)', 'terrain', 1, '2025-12-05 02:48:27'),
(59, 1, 'admin', 'Torre de los Vengadores (Marvel)', 'terrain', 1, '2025-12-05 02:50:49'),
(60, 1, 'admin', 'Invocación: Godrick', 'invocation', 1, '2025-12-05 02:58:41'),
(61, 1, 'admin', 'Invocación: Radahn', 'invocation', 1, '2025-12-05 03:13:24'),
(62, 1, 'admin', 'Arma: Cetro del Devorador', 'weapon', 1, '2025-12-05 03:13:33'),
(63, 1, 'admin', 'Invocación: Rey sin Nombre', 'invocation', 1, '2025-12-05 03:13:41'),
(64, 1, 'admin', 'Arma: Espada magna de la hoja injertada', 'weapon', 1, '2025-12-05 03:13:52'),
(65, 1, 'admin', 'Invocación: Godrick', 'invocation', 1, '2025-12-05 03:14:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tienda_tickets`
--

DROP TABLE IF EXISTS `tienda_tickets`;
CREATE TABLE `tienda_tickets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `ticket_type` enum('tienda','marketplace_compra','marketplace_venta') NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `item_description` text DEFAULT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `precio_pagado` int(11) NOT NULL COMMENT 'Precio en Esferas/Llaves que pagó',
  `moneda_usada` enum('esferas','llaves','cupones_azules') NOT NULL DEFAULT 'esferas',
  `categoria` varchar(100) DEFAULT 'General',
  `imagen_url` varchar(500) DEFAULT NULL,
  `transaction_id` int(11) DEFAULT NULL COMMENT 'ID de la transacción relacionada',
  `seller_id` int(11) DEFAULT NULL COMMENT 'ID del vendedor (solo para marketplace)',
  `seller_username` varchar(100) DEFAULT NULL COMMENT 'Username del vendedor',
  `listing_id` int(11) DEFAULT NULL COMMENT 'ID del anuncio (solo para marketplace)',
  `claimed` tinyint(1) NOT NULL DEFAULT 0,
  `claimed_date` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL COMMENT 'Fecha de expiración (opcional)',
  `notes` text DEFAULT NULL COMMENT 'Notas adicionales'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `tienda_tickets`:
--   `user_id`
--       `usuarios` -> `id`
--

--
-- Volcado de datos para la tabla `tienda_tickets`
--

INSERT INTO `tienda_tickets` (`id`, `user_id`, `username`, `ticket_type`, `item_name`, `item_description`, `cantidad`, `precio_pagado`, `moneda_usada`, `categoria`, `imagen_url`, `transaction_id`, `seller_id`, `seller_username`, `listing_id`, `claimed`, `claimed_date`, `created_at`, `expires_at`, `notes`) VALUES
(1, 1, 'admin', 'tienda', 'Prueba 2', NULL, 1, 10, 'esferas', 'General', NULL, 47, NULL, NULL, NULL, 1, '2025-11-10 18:40:30', '2025-11-10 18:40:21', NULL, NULL),
(2, 1, 'admin', 'tienda', 'Prueba 2', NULL, 1, 10, 'esferas', 'General', NULL, 48, NULL, NULL, NULL, 1, '2025-11-10 18:47:11', '2025-11-10 18:47:01', NULL, NULL),
(3, 1, 'admin', 'tienda', 'Prueba 2', NULL, 1, 10, 'esferas', 'General', NULL, 49, NULL, NULL, NULL, 1, '2025-11-10 19:02:20', '2025-11-10 18:47:39', NULL, NULL),
(4, 1, 'admin', 'tienda', 'Prueba 2', NULL, 1, 10, 'esferas', 'General', NULL, 50, NULL, NULL, NULL, 1, '2025-11-10 19:02:20', '2025-11-10 18:54:07', NULL, NULL),
(5, 1, 'admin', 'tienda', 'Prueba 2', NULL, 1, 10, 'esferas', 'General', NULL, 51, NULL, NULL, NULL, 1, '2025-11-10 19:02:47', '2025-11-10 19:02:36', NULL, NULL),
(6, 1, 'admin', 'tienda', 'Prueba 2', NULL, 1, 10, 'esferas', 'General', NULL, 52, NULL, NULL, NULL, 1, '2025-11-10 19:02:47', '2025-11-10 19:02:38', NULL, NULL),
(8, 1, 'admin', 'marketplace_venta', 'Kamen Rider Kuuga', NULL, 1, 10, 'esferas', 'Marketplace', NULL, 2, NULL, NULL, 3, 1, '2025-11-10 19:04:35', '2025-11-10 19:04:08', NULL, 'Vendido a: fran2'),
(12, 1, 'admin', 'tienda', 'Prueba 2', NULL, 1, 10, 'esferas', 'General', NULL, 55, NULL, NULL, NULL, 0, NULL, '2025-11-10 19:15:10', NULL, NULL),
(13, 1, 'admin', 'tienda', 'Prueba 2', NULL, 1, 10, 'esferas', 'General', NULL, 56, NULL, NULL, NULL, 0, NULL, '2025-11-10 19:20:05', NULL, NULL),
(14, 1, 'admin', 'tienda', 'Prueba 2', NULL, 1, 10, 'esferas', 'General', NULL, 57, NULL, NULL, NULL, 0, NULL, '2025-11-10 19:20:44', NULL, NULL),
(15, 1, 'admin', 'tienda', 'Valorant', NULL, 1, 1000, 'esferas', 'General', NULL, 58, NULL, NULL, NULL, 1, '2025-11-10 19:29:04', '2025-11-10 19:28:44', NULL, ' [EN MARKETPLACE] [VENDIDO]');

--
-- Disparadores `tienda_tickets`
--
DROP TRIGGER IF EXISTS `trg_ticket_claimed`;
DELIMITER $$
CREATE TRIGGER `trg_ticket_claimed` AFTER UPDATE ON `tienda_tickets` FOR EACH ROW BEGIN
    IF NEW.claimed = 1 AND OLD.claimed = 0 THEN
        -- Actualizar estadísticas
        UPDATE tienda_tickets_stats 
        SET 
            tickets_claimed = tickets_claimed + 1,
            tickets_pending = tickets_pending - 1,
            last_claim_date = NEW.claimed_date
        WHERE user_id = NEW.user_id;
        
        -- Guardar en historial
        INSERT INTO tienda_tickets_historial (
            ticket_id, user_id, username, item_name, cantidad, 
            ticket_type, claimed_date, notes
        ) VALUES (
            NEW.id, NEW.user_id, NEW.username, NEW.item_name, NEW.cantidad,
            NEW.ticket_type, NEW.claimed_date, NEW.notes
        );
    END IF;
END
$$
DELIMITER ;
DROP TRIGGER IF EXISTS `trg_ticket_created`;
DELIMITER $$
CREATE TRIGGER `trg_ticket_created` AFTER INSERT ON `tienda_tickets` FOR EACH ROW BEGIN
    -- Insertar o actualizar estadísticas
    INSERT INTO tienda_tickets_stats (user_id, total_tickets, tickets_pending, last_ticket_date)
    VALUES (NEW.user_id, 1, 1, NEW.created_at)
    ON DUPLICATE KEY UPDATE
        total_tickets = total_tickets + 1,
        tickets_pending = tickets_pending + 1,
        last_ticket_date = NEW.created_at;
    
    -- Actualizar contador por tipo
    IF NEW.ticket_type = 'tienda' THEN
        UPDATE tienda_tickets_stats 
        SET total_tienda = total_tienda + 1 
        WHERE user_id = NEW.user_id;
    ELSEIF NEW.ticket_type = 'marketplace_compra' THEN
        UPDATE tienda_tickets_stats 
        SET total_marketplace_compras = total_marketplace_compras + 1 
        WHERE user_id = NEW.user_id;
    ELSEIF NEW.ticket_type = 'marketplace_venta' THEN
        UPDATE tienda_tickets_stats 
        SET total_marketplace_ventas = total_marketplace_ventas + 1 
        WHERE user_id = NEW.user_id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tienda_tickets_historial`
--

DROP TABLE IF EXISTS `tienda_tickets_historial`;
CREATE TABLE `tienda_tickets_historial` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `ticket_type` varchar(50) NOT NULL,
  `claimed_date` datetime NOT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `tienda_tickets_historial`:
--

--
-- Volcado de datos para la tabla `tienda_tickets_historial`
--

INSERT INTO `tienda_tickets_historial` (`id`, `ticket_id`, `user_id`, `username`, `item_name`, `cantidad`, `ticket_type`, `claimed_date`, `notes`) VALUES
(1, 1, 1, 'admin', 'Prueba 2', 1, 'tienda', '2025-11-10 18:40:30', NULL),
(2, 2, 1, 'admin', 'Prueba 2', 1, 'tienda', '2025-11-10 18:47:11', NULL),
(3, 3, 1, 'admin', 'Prueba 2', 1, 'tienda', '2025-11-10 19:02:20', NULL),
(4, 4, 1, 'admin', 'Prueba 2', 1, 'tienda', '2025-11-10 19:02:20', NULL),
(5, 5, 1, 'admin', 'Prueba 2', 1, 'tienda', '2025-11-10 19:02:47', NULL),
(6, 6, 1, 'admin', 'Prueba 2', 1, 'tienda', '2025-11-10 19:02:47', NULL),
(7, 8, 1, 'admin', 'Kamen Rider Kuuga', 1, 'marketplace_venta', '2025-11-10 19:04:35', 'Vendido a: fran2'),
(8, 7, 4, 'fran2', 'Kamen Rider Kuuga', 1, 'marketplace_compra', '2025-11-10 19:13:15', NULL),
(9, 9, 4, 'fran2', 'Chaldea (Fate)', 1, 'marketplace_compra', '2025-11-10 19:13:15', NULL),
(10, 15, 1, 'admin', 'Valorant', 1, 'tienda', '2025-11-10 19:29:04', ' [EN MARKETPLACE]');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tienda_tickets_stats`
--

DROP TABLE IF EXISTS `tienda_tickets_stats`;
CREATE TABLE `tienda_tickets_stats` (
  `user_id` int(11) NOT NULL,
  `total_tickets` int(11) NOT NULL DEFAULT 0,
  `tickets_claimed` int(11) NOT NULL DEFAULT 0,
  `tickets_pending` int(11) NOT NULL DEFAULT 0,
  `total_tienda` int(11) NOT NULL DEFAULT 0,
  `total_marketplace_compras` int(11) NOT NULL DEFAULT 0,
  `total_marketplace_ventas` int(11) NOT NULL DEFAULT 0,
  `last_ticket_date` datetime DEFAULT NULL,
  `last_claim_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `tienda_tickets_stats`:
--   `user_id`
--       `usuarios` -> `id`
--

--
-- Volcado de datos para la tabla `tienda_tickets_stats`
--

INSERT INTO `tienda_tickets_stats` (`user_id`, `total_tickets`, `tickets_claimed`, `tickets_pending`, `total_tienda`, `total_marketplace_compras`, `total_marketplace_ventas`, `last_ticket_date`, `last_claim_date`) VALUES
(1, 11, 8, 3, 10, 0, 1, '2025-11-10 19:28:44', '2025-11-10 19:29:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `transacciones_einherjer`
--

DROP TABLE IF EXISTS `transacciones_einherjer`;
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

--
-- RELACIONES PARA LA TABLA `transacciones_einherjer`:
--   `user_id`
--       `usuarios` -> `id`
--

--
-- Volcado de datos para la tabla `transacciones_einherjer`
--

INSERT INTO `transacciones_einherjer` (`id`, `user_id`, `username`, `tipo`, `cantidad`, `descripcion`, `fecha`, `destinatario`) VALUES
(1, 1, 'admin', 'compra', '5.00', 'Apertura de Cofre Warhammer 40K', '2025-09-12 20:19:15', NULL),
(2, 1, 'admin', 'compra', '5.00', 'Apertura de Las Sombras de Phanes', '2025-09-12 20:19:36', NULL),
(3, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-09-12 20:19:50', NULL),
(4, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-09-12 20:20:02', NULL),
(5, 1, 'admin', 'compra', '10.00', 'Prueba', '2025-09-29 04:09:30', NULL),
(6, 1, 'admin', 'compra', '100.00', 'Prueba', '2025-09-29 04:21:11', NULL),
(7, 1, 'admin', 'compra', '100.00', 'Prueba', '2025-09-29 04:21:17', NULL),
(8, 1, 'admin', 'compra', '10.00', 'Prueba 2', '2025-09-29 04:21:37', NULL),
(9, 1, 'admin', 'compra', '100.00', 'Prueba', '2025-09-29 04:22:26', NULL),
(10, 1, 'admin', 'compra', '1000.00', 'Prueba', '2025-09-29 04:32:23', NULL),
(11, 1, 'admin', 'compra', '10.00', 'Prueba 2', '2025-09-29 04:41:19', NULL),
(12, 1, 'admin', 'transferencia', '50.00', 'Conversión rápida: 1 llaves → 50 esferas', '2025-09-29 04:50:09', NULL),
(13, 1, 'admin', 'transferencia', '50.00', 'Conversión rápida: 1 llaves → 50 esferas', '2025-09-29 04:50:17', NULL),
(14, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 19:07:53', NULL),
(15, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 19:08:39', NULL),
(16, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 19:08:43', NULL),
(17, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 19:08:47', NULL),
(18, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 19:09:00', NULL),
(19, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 19:09:04', NULL),
(20, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 19:09:07', NULL),
(21, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 19:09:10', NULL),
(22, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 19:09:13', NULL),
(23, 1, 'admin', 'compra', '5.00', 'Apertura de Comics que Inspiran', '2025-10-15 19:09:27', NULL),
(24, 1, 'admin', 'compra', '5.00', 'Apertura de Comics que Inspiran', '2025-10-15 19:17:33', NULL),
(25, 1, 'admin', 'compra', '5.00', 'Apertura de Comics que Inspiran', '2025-10-15 19:17:50', NULL),
(26, 1, 'admin', 'compra', '5.00', 'Apertura de Comics que Inspiran', '2025-10-15 19:18:03', NULL),
(27, 1, 'admin', 'compra', '5.00', 'Apertura de Comics que Inspiran', '2025-10-15 19:18:12', NULL),
(28, 1, 'admin', 'compra', '5.00', 'Apertura de Comics que Inspiran', '2025-10-15 19:18:19', NULL),
(29, 1, 'admin', 'compra', '5.00', 'Apertura de Comics que Inspiran', '2025-10-15 19:20:14', NULL),
(30, 1, 'admin', 'compra', '5.00', 'Apertura de Comics que Inspiran', '2025-10-15 19:20:36', NULL),
(31, 1, 'admin', 'compra', '5.00', 'Apertura de Comics que Inspiran', '2025-10-15 19:28:42', NULL),
(32, 1, 'admin', 'compra', '5.00', 'Apertura de Comics que Inspiran', '2025-10-15 19:50:19', NULL),
(33, 1, 'admin', 'compra', '5.00', 'Apertura de Comics que Inspiran', '2025-10-15 20:21:07', NULL),
(34, 1, 'admin', 'compra', '5.00', 'Apertura de Comics que Inspiran', '2025-10-15 20:24:43', NULL),
(35, 1, 'admin', 'compra', '5.00', 'Apertura de Comics que Inspiran', '2025-10-15 20:24:52', NULL),
(36, 1, 'admin', 'compra', '5.00', 'Apertura de Comics que Inspiran', '2025-10-15 20:37:53', NULL),
(37, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 20:38:06', NULL),
(38, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 20:38:20', NULL),
(39, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 20:42:37', NULL),
(40, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 20:45:54', NULL),
(41, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 20:46:25', NULL),
(42, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 20:48:21', NULL),
(43, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-10-15 20:52:59', NULL),
(44, 1, 'admin', 'compra', '5.00', 'Apertura de Comics que Inspiran', '2025-10-15 20:53:17', NULL),
(45, 1, 'admin', 'compra', '5.00', 'Apertura de Héroes Kamen Rider', '2025-11-01 05:14:35', NULL),
(47, 1, 'admin', 'compra', '10.00', 'Prueba 2', '2025-11-10 21:40:21', NULL),
(48, 1, 'admin', 'compra', '10.00', 'Prueba 2', '2025-11-10 21:47:01', NULL),
(49, 1, 'admin', 'compra', '10.00', 'Prueba 2', '2025-11-10 21:47:39', NULL),
(50, 1, 'admin', 'compra', '10.00', 'Prueba 2', '2025-11-10 21:54:07', NULL),
(51, 1, 'admin', 'compra', '10.00', 'Prueba 2', '2025-11-10 22:02:36', NULL),
(52, 1, 'admin', 'compra', '10.00', 'Prueba 2', '2025-11-10 22:02:38', NULL),
(55, 1, 'admin', 'compra', '10.00', 'Prueba 2', '2025-11-10 22:15:10', NULL),
(56, 1, 'admin', 'compra', '10.00', 'Prueba 2', '2025-11-10 22:20:05', NULL),
(57, 1, 'admin', 'compra', '10.00', 'Prueba 2', '2025-11-10 22:20:44', NULL),
(58, 1, 'admin', 'compra', '1000.00', 'Valorant', '2025-11-10 22:28:44', NULL),
(59, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-12-05 02:31:52', NULL),
(60, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-12-05 02:41:11', NULL),
(61, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-12-05 02:45:30', NULL),
(62, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-12-05 02:46:55', NULL),
(63, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-12-05 02:48:27', NULL),
(64, 1, 'admin', 'compra', '25.00', 'Apertura de Cofre de Terrenos', '2025-12-05 02:50:49', NULL),
(65, 1, 'admin', 'compra', '5.00', 'Apertura de Cofre Elden Ring/Dark Souls', '2025-12-05 02:58:41', NULL),
(66, 1, 'admin', 'compra', '5.00', 'Apertura de Cofre Elden Ring/Dark Souls', '2025-12-05 03:13:24', NULL),
(67, 1, 'admin', 'compra', '5.00', 'Apertura de Cofre Elden Ring/Dark Souls', '2025-12-05 03:13:33', NULL),
(68, 1, 'admin', 'compra', '5.00', 'Apertura de Cofre Elden Ring/Dark Souls', '2025-12-05 03:13:41', NULL),
(69, 1, 'admin', 'compra', '5.00', 'Apertura de Cofre Elden Ring/Dark Souls', '2025-12-05 03:13:52', NULL),
(70, 1, 'admin', 'compra', '5.00', 'Apertura de Cofre Elden Ring/Dark Souls', '2025-12-05 03:14:01', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `umbra_endings`
--

DROP TABLE IF EXISTS `umbra_endings`;
CREATE TABLE `umbra_endings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ending_type` varchar(50) NOT NULL,
  `ending_variation` int(11) DEFAULT 1,
  `achieved_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `session_number` int(11) DEFAULT NULL,
  `final_paranoia` int(11) DEFAULT NULL,
  `final_perception` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `umbra_endings`:
--   `user_id`
--       `usuarios` -> `id`
--

--
-- Volcado de datos para la tabla `umbra_endings`
--

INSERT INTO `umbra_endings` (`id`, `user_id`, `ending_type`, `ending_variation`, `achieved_at`, `session_number`, `final_paranoia`, `final_perception`) VALUES
(1, 1, 'cycle', 1, '2025-12-11 04:49:22', 1, 71, 100),
(2, 1, 'consumed', 1, '2025-12-11 04:49:55', 2, 71, 100),
(3, 1, 'consumed', 1, '2025-12-11 04:54:43', 5, 71, 100),
(4, 1, 'consumed', 1, '2025-12-11 04:55:19', 7, 71, 100),
(5, 1, 'cycle', 1, '2025-12-11 04:56:53', 9, 26, 100),
(6, 1, 'escape', 1, '2025-12-11 05:00:07', 12, 45, 100),
(7, 1, 'truth', 1, '2025-12-11 05:01:43', 14, 36, 100);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `umbra_player_events`
--

DROP TABLE IF EXISTS `umbra_player_events`;
CREATE TABLE `umbra_player_events` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `event_type` varchar(50) NOT NULL,
  `event_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`event_data`)),
  `session_number` int(11) DEFAULT 1,
  `occurred_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `umbra_player_events`:
--   `user_id`
--       `usuarios` -> `id`
--

--
-- Volcado de datos para la tabla `umbra_player_events`
--

INSERT INTO `umbra_player_events` (`id`, `user_id`, `event_type`, `event_data`, `session_number`, `occurred_at`) VALUES
(4, 1, 'first_visit', '{\"timestamp\":\"2025-12-11 05:47:28\"}', 1, '2025-12-11 04:47:28'),
(5, 1, 'ending_reached', '{\"ending\":\"cycle\",\"sanity\":40,\"paranoia\":71}', 1, '2025-12-11 04:49:22'),
(6, 1, 'return_visit', '{\"timestamp\":\"2025-12-11 05:49:28\",\"previous_chapter\":31,\"previous_paranoia\":71}', 2, '2025-12-11 04:49:28'),
(7, 1, 'ending_reached', '{\"ending\":\"consumed\",\"sanity\":40,\"paranoia\":71}', 2, '2025-12-11 04:49:55'),
(8, 1, 'return_visit', '{\"timestamp\":\"2025-12-11 05:50:16\",\"previous_chapter\":31,\"previous_paranoia\":71}', 3, '2025-12-11 04:50:16'),
(9, 1, 'return_visit', '{\"timestamp\":\"2025-12-11 05:50:18\",\"previous_chapter\":31,\"previous_paranoia\":71}', 4, '2025-12-11 04:50:18'),
(10, 1, 'return_visit', '{\"timestamp\":\"2025-12-11 05:54:31\",\"previous_chapter\":31,\"previous_paranoia\":71}', 5, '2025-12-11 04:54:31'),
(11, 1, 'ending_reached', '{\"ending\":\"consumed\",\"sanity\":40,\"paranoia\":71}', 5, '2025-12-11 04:54:43'),
(12, 1, 'return_visit', '{\"timestamp\":\"2025-12-11 05:54:50\",\"previous_chapter\":31,\"previous_paranoia\":71}', 6, '2025-12-11 04:54:50'),
(13, 1, 'return_visit', '{\"timestamp\":\"2025-12-11 05:55:07\",\"previous_chapter\":31,\"previous_paranoia\":71}', 7, '2025-12-11 04:55:07'),
(14, 1, 'ending_reached', '{\"ending\":\"consumed\",\"sanity\":40,\"paranoia\":71}', 7, '2025-12-11 04:55:19'),
(15, 1, 'return_visit', '{\"timestamp\":\"2025-12-11 05:55:21\",\"previous_chapter\":1,\"previous_paranoia\":0}', 9, '2025-12-11 04:55:21'),
(16, 1, 'ending_reached', '{\"ending\":\"cycle\",\"sanity\":75,\"paranoia\":26}', 9, '2025-12-11 04:56:53'),
(17, 1, 'return_visit', '{\"timestamp\":\"2025-12-11 05:56:58\",\"previous_chapter\":1,\"previous_paranoia\":0}', 11, '2025-12-11 04:56:58'),
(18, 1, 'return_visit', '{\"timestamp\":\"2025-12-11 05:59:14\",\"previous_chapter\":1,\"previous_paranoia\":0}', 12, '2025-12-11 04:59:14'),
(19, 1, 'ending_reached', '{\"ending\":\"escape\",\"sanity\":100,\"paranoia\":45}', 12, '2025-12-11 05:00:07'),
(20, 1, 'return_visit', '{\"timestamp\":\"2025-12-11 06:00:14\",\"previous_chapter\":1,\"previous_paranoia\":0}', 14, '2025-12-11 05:00:14'),
(21, 1, 'ending_reached', '{\"ending\":\"truth\",\"sanity\":40,\"paranoia\":36}', 14, '2025-12-11 05:01:43'),
(22, 1, 'return_visit', '{\"timestamp\":\"2025-12-12 03:52:51\",\"previous_chapter\":34,\"previous_paranoia\":36}', 15, '2025-12-12 02:52:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `umbra_progress`
--

DROP TABLE IF EXISTS `umbra_progress`;
CREATE TABLE `umbra_progress` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_count` int(11) DEFAULT 1,
  `chapter` int(11) DEFAULT 1,
  `paranoia_level` int(11) DEFAULT 0,
  `perception` int(11) DEFAULT 100,
  `trust` int(11) DEFAULT 50,
  `sanity` int(11) DEFAULT 100,
  `has_seen_face` tinyint(1) DEFAULT 0,
  `knows_name` tinyint(1) DEFAULT 0,
  `room_revealed` tinyint(1) DEFAULT 0,
  `made_pact` tinyint(1) DEFAULT 0,
  `attempted_escape` int(11) DEFAULT 0,
  `current_room` varchar(50) DEFAULT 'void',
  `inventory` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`inventory`)),
  `discovered_secrets` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`discovered_secrets`)),
  `event_log` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`event_log`)),
  `whispers_heard` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`whispers_heard`)),
  `total_playtime_minutes` int(11) DEFAULT 0,
  `last_chapter_time` timestamp NULL DEFAULT NULL,
  `last_played` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `umbra_progress`:
--   `user_id`
--       `usuarios` -> `id`
--

--
-- Volcado de datos para la tabla `umbra_progress`
--

INSERT INTO `umbra_progress` (`id`, `user_id`, `session_count`, `chapter`, `paranoia_level`, `perception`, `trust`, `sanity`, `has_seen_face`, `knows_name`, `room_revealed`, `made_pact`, `attempted_escape`, `current_room`, `inventory`, `discovered_secrets`, `event_log`, `whispers_heard`, `total_playtime_minutes`, `last_chapter_time`, `last_played`, `created_at`) VALUES
(2, 1, 15, 34, 36, 100, 80, 80, 0, 0, 0, 0, 1, 'void', NULL, NULL, NULL, NULL, 0, NULL, '2025-12-12 02:52:51', '2025-12-11 04:47:28');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `umbra_whispers`
--

DROP TABLE IF EXISTS `umbra_whispers`;
CREATE TABLE `umbra_whispers` (
  `id` int(11) NOT NULL,
  `content` text NOT NULL,
  `trigger_condition` varchar(100) DEFAULT NULL,
  `min_paranoia` int(11) DEFAULT 0,
  `max_perception` int(11) DEFAULT 100,
  `rarity` int(11) DEFAULT 50,
  `is_personalized` tinyint(1) DEFAULT 0,
  `category` enum('ambient','threat','memory','revelation','fourth_wall') DEFAULT 'ambient'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- RELACIONES PARA LA TABLA `umbra_whispers`:
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
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

--
-- RELACIONES PARA LA TABLA `user_sessions`:
--   `user_id`
--       `usuarios` -> `id`
--

--
-- Volcado de datos para la tabla `user_sessions`
--

INSERT INTO `user_sessions` (`id`, `user_id`, `session_token`, `created_at`, `expires_at`, `is_active`, `ip_address`, `user_agent`) VALUES
(1, 1, '7657260066318f53442c261eabaf790098d770376872675bb65bfe2ff4091680', '2025-09-07 03:26:51', '2025-09-08 08:35:43', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'),
(3, 1, '3e7d2b6fdf2b85ae48151ca3a9736cd924615f7d34c3f0e62cd045a0eec71580', '2025-09-12 20:19:07', '2025-09-14 02:04:50', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'),
(4, 1, 'e4a0d1df7b1eb46871d1fc393d6478e45dca7a9fe3b91a2a8ea0713e659308e0', '2025-09-29 03:39:03', '2025-09-30 09:50:23', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'),
(5, 1, 'e73af5b84da1db6e4dc0a0bcec97643860e30333afd4558ee812732a4c8e2ee7', '2025-10-01 04:07:11', '2025-10-02 10:37:49', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'),
(6, 1, 'a3418219a5c47d2866e8081c5cb469ab9a83c59fc4ca6ad947341a77a731c5c2', '2025-10-11 01:44:13', '2025-10-12 06:44:20', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'),
(7, 1, '01a51c800fdf480611ee8c1bddda9e2f015e64555b8a743499b99b54ef28a05b', '2025-10-13 02:24:37', '2025-10-14 07:30:32', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'),
(8, 1, '24867669c0e6789609df73772e526e45980be10986103c96d31f5f2b6e2cddda', '2025-10-15 19:05:48', '2025-10-17 01:53:26', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'),
(9, 1, 'f0097456ca0a81a96308d4e5ebfccbf054a05a1bab234e1c8d98771e437a4c22', '2025-10-22 21:07:10', '2025-10-24 02:48:58', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'),
(10, 1, '95a629d58d9c88e70b97f8371d868790b6f1dccb08624c6e10eea4fd91df1cbf', '2025-11-01 04:27:10', '2025-11-02 09:14:45', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'),
(11, 1, 'b4a832d178b05f310eaf0a51fb934d3feec4455b57c8dca332634e5f7e65af2a', '2025-11-09 03:30:53', '2025-11-10 10:30:18', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(14, 1, 'a51d88a6941a08a1ab6255e2226cdb6187978933f6410b380dd6c99de40fff11', '2025-11-10 02:44:27', '2025-11-11 06:52:02', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(15, 1, 'ac0687bf437bd773de6c662425ce7ffc5f77ef25c52d3729b68a25f5df09c977', '2025-11-10 21:01:12', '2025-11-12 01:28:42', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(17, 1, 'b5e63abe865b8d174d840be3c97ded51a65f2e6324b160d19e3fa7a508246018', '2025-11-10 21:33:23', '2025-11-12 03:01:51', 1, '::1', 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'),
(19, 1, 'a11001062b4580a8ee35c39128b6dba164013487e938042f70d01c50ce2f6711', '2025-11-19 18:57:39', '2025-11-20 23:26:34', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(20, 1, '4d74777c127c89c316aff122aa968f9c1a9093fef9c3dccc15e08263ac782354', '2025-11-21 04:16:14', '2025-11-22 08:55:28', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(21, 5, '0709ad4db8f4fe1c92ecce8128d8b7d7487d606ef7a15c061902f795d205333f', '2025-11-21 04:27:29', '2025-11-22 08:41:29', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0'),
(22, 5, '4a3eab5be99788827fbb577527b6075a8cc066f7067f5553c899e559fe300f89', '2025-11-21 04:45:52', '2025-11-22 08:55:24', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0'),
(23, 1, '79a003635e139e822fb6d7eedad09249830353c4b39748e4860c85b8457f12b6', '2025-11-23 02:35:34', '2025-11-24 10:03:26', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(24, 5, '36d0ea4c54c03074cdc27f5a33eed3d7e4be792334e9930cc738bc9faa09f588', '2025-11-23 02:36:15', '2025-11-24 07:21:29', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0'),
(25, 5, '41d39254398a6fd3a5b71eaf7e1743bcbd7b974150db8405edfa785a8200456c', '2025-11-23 03:38:20', '2025-11-24 07:43:58', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0'),
(26, 5, 'b9df68b7c46ae3cbb80b2599dcde5c43889e9515b76b18df2be47a3c3dbc6a11', '2025-11-23 03:44:23', '2025-11-24 07:59:33', 1, '::1', 'Mozilla/5.0 (Linux; Android 8.0.0; SM-G955U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36 Edg/142.0.0.0'),
(27, 5, '1caa92b02cc60f59655bc924ab081a0cc39416e6295d98921622ae833e1dab83', '2025-11-23 04:04:21', '2025-11-24 08:12:23', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0'),
(28, 5, '4353bea2049b02f4d34e6f2efe2dac96d6c16d1e14909568ccc0d1a8ccd6121a', '2025-11-23 04:39:39', '2025-11-24 08:41:11', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0'),
(29, 5, 'f0dfbe65e2dc30dbfada836d1a8f837d14a456084e19adfcccc3edfbe8b96fc5', '2025-11-23 05:12:39', '2025-11-24 09:17:24', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0'),
(30, 5, '05b97ea8225fd2d0df62a1c3513ae0874a507501a4db77df17b0142c278140fd', '2025-11-23 06:01:24', '2025-11-24 10:03:05', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0'),
(31, 1, '427a05000e71e2ddc8f082ad91a80cb400a54dcced031a13713686840d50d610', '2025-11-30 00:33:33', '2025-12-01 04:35:41', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(32, 1, 'c6fa93c7296ebebb55bbc7046733173d9c69eb73b823c693c4c1d2fb93bdf51e', '2025-12-01 04:47:39', '2025-12-02 09:25:01', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(33, 5, 'e3411c57aec919645440159aa1ad4bce18b124cc23464d2a603b19015630e1df', '2025-12-01 04:54:17', '2025-12-02 09:09:59', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0'),
(34, 1, '4c4d5c02ceea755959c060f5ca63ea0ffb550e650175a1b77a7a743e941ae439', '2025-12-01 18:41:49', '2025-12-02 22:53:01', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(35, 1, '42824058799e18f192f82464c8174eb34887f0569bd47ede70f652cecf60dbef', '2025-12-05 02:31:40', '2025-12-06 06:54:47', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(36, 1, 'd5cef8caf16a9a315c0c044b8fe70f984ab9171b1863d4d98bcdceafc50d5cbb', '2025-12-05 02:56:18', '2025-12-06 07:14:08', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(37, 1, '337c3adb41c03e62efbe6ab267c4006a573ecf306a23017961ed70384594e69a', '2025-12-10 03:09:45', '2025-12-11 08:57:22', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(38, 1, '2280a22d0820e2d58340e4e8b2a78a724e2cca94a0533fef586bbc5b5d6cba80', '2025-12-11 01:26:59', '2025-12-12 09:01:51', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(39, 1, 'e88966d7079c088f4fbc5a1204db50d14bfb3cf52d75d2342c03bdcd21c095d1', '2025-12-12 02:52:45', '2025-12-13 06:55:52', 1, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
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
-- RELACIONES PARA LA TABLA `usuarios`:
--

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `username`, `email`, `password_hash`, `unique_id`, `created_at`, `last_login`, `is_active`, `jefes_derrotados`, `megajefes_derrotados`, `horas_jugadas`, `rango`, `copas`, `llaves`, `recompensas`, `perfil_imagen`, `frase`, `nivel`, `experiencia`, `victorias`, `derrotas`) VALUES
(1, 'admin', 'gg4545149@gmail.com', '$2y$10$.01.ubnWV4CQRj9CdsOMle4RYl1JNwowsAHMqlSKpO1.4X9YyoFbO', 'ADMIN2024', '2025-05-24 22:46:51', '2025-12-12 02:52:45', 1, 0, 0, 0, 'Bronce', 10, 440, 810, 'shuna.jpg', 'El más capo', 50, 0, 12, 8),
(5, 'fran2', 'geweqeqweq@gmail.com', '$argon2id$v=19$m=65536,t=4,p=1$TUQ2eEQ4NkgyU0ZVSkJXSg$ftskKH0TGJ/CoEWVCBWGLUPlpxBlbuBtsK4Tz56YQWI', 'CC7D8430ABE83E01', '2025-11-21 04:27:24', '2025-12-01 04:54:17', 1, 0, 0, 0, 'Bronce', 0, 0, 0, 'default.jpg', 'Guerrero de Einherjer', 1, 0, 8, 12);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_tickets_historial_completo`
-- (Véase abajo para la vista actual)
--
DROP VIEW IF EXISTS `v_tickets_historial_completo`;
CREATE TABLE `v_tickets_historial_completo` (
`id` int(11)
,`ticket_id` int(11)
,`user_id` int(11)
,`username` varchar(100)
,`item_name` varchar(255)
,`cantidad` int(11)
,`ticket_type` varchar(50)
,`claimed_date` datetime
,`notes` text
,`fecha_formateada` varchar(21)
,`tipo_label` varchar(21)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `v_tickets_pendientes`
-- (Véase abajo para la vista actual)
--
DROP VIEW IF EXISTS `v_tickets_pendientes`;
CREATE TABLE `v_tickets_pendientes` (
`id` int(11)
,`user_id` int(11)
,`username` varchar(100)
,`ticket_type` enum('tienda','marketplace_compra','marketplace_venta')
,`item_name` varchar(255)
,`item_description` text
,`cantidad` int(11)
,`precio_pagado` int(11)
,`moneda_usada` enum('esferas','llaves','cupones_azules')
,`categoria` varchar(100)
,`imagen_url` varchar(500)
,`transaction_id` int(11)
,`seller_id` int(11)
,`seller_username` varchar(100)
,`listing_id` int(11)
,`claimed` tinyint(1)
,`claimed_date` datetime
,`created_at` datetime
,`expires_at` datetime
,`notes` text
,`tipo_label` varchar(21)
,`precio_label` varchar(26)
,`dias_antiguedad` int(7)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `marketplace_active_listings`
--
DROP TABLE IF EXISTS `marketplace_active_listings`;

DROP VIEW IF EXISTS `marketplace_active_listings`;
CREATE ALGORITHM=UNDEFINED
DEFINER=`root`@`localhost`
SQL SECURITY DEFINER
VIEW `marketplace_active_listings` AS
SELECT
  ml.id,
  ml.seller_id,
  ml.seller_username,
  ml.item_name,
  ml.item_description,
  ml.item_image,
  ml.reward_id,
  ml.price_llaves,
  ml.price_esferas,
  ml.price_cupones,
  ml.is_premium_listing,
  ml.is_active,
  ml.is_sold,
  ml.stock_quantity,
  ml.views_count,
  ml.created_at,
  ml.updated_at,
  ml.sold_at,
  u.perfil_imagen AS seller_avatar,
  u.rango AS seller_rank,
  mp.premium_active AS seller_is_premium,
  mp.highlighted_listing AS seller_has_highlight
FROM marketplace_listings ml
JOIN usuarios u ON ml.seller_id = u.id
LEFT JOIN marketplace_premium mp
  ON ml.seller_id = mp.user_id
  AND mp.premium_active = 1
WHERE ml.is_active = 1
  AND ml.is_sold = 0
  AND ml.stock_quantity > 0
ORDER BY
  ml.is_premium_listing DESC,
  ml.created_at DESC;


-- --------------------------------------------------------

--
-- Estructura para la vista `marketplace_seller_stats`
--
DROP TABLE IF EXISTS `marketplace_seller_stats`;

DROP VIEW IF EXISTS `marketplace_seller_stats`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `marketplace_seller_stats`  AS SELECT `u`.`id` AS `seller_id`, `u`.`username` AS `seller_username`, count(distinct `ml`.`id`) AS `total_listings`, count(distinct case when `ml`.`is_active` = 1 and `ml`.`is_sold` = 0 then `ml`.`id` end) AS `active_listings`, count(distinct `mt`.`id`) AS `total_sales`, coalesce(sum(`mt`.`paid_llaves`),0) AS `total_llaves_earned`, coalesce(sum(`mt`.`paid_esferas`),0) AS `total_esferas_earned`, coalesce(sum(`mt`.`paid_cupones`),0) AS `total_cupones_earned`, `mp`.`premium_active` AS `is_premium` FROM (((`usuarios` `u` left join `marketplace_listings` `ml` on(`u`.`id` = `ml`.`seller_id`)) left join `marketplace_transactions` `mt` on(`u`.`id` = `mt`.`seller_id` and `mt`.`status` = 'completed')) left join `marketplace_premium` `mp` on(`u`.`id` = `mp`.`user_id` and `mp`.`premium_active` = 1)) GROUP BY `u`.`id`;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_tickets_historial_completo`
--
DROP TABLE IF EXISTS `v_tickets_historial_completo`;

DROP VIEW IF EXISTS `v_tickets_historial_completo`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_tickets_historial_completo`  AS SELECT `h`.`id` AS `id`, `h`.`ticket_id` AS `ticket_id`, `h`.`user_id` AS `user_id`, `h`.`username` AS `username`, `h`.`item_name` AS `item_name`, `h`.`cantidad` AS `cantidad`, `h`.`ticket_type` AS `ticket_type`, `h`.`claimed_date` AS `claimed_date`, `h`.`notes` AS `notes`, date_format(`h`.`claimed_date`,'%d/%m/%Y %H:%i') AS `fecha_formateada`, CASE WHEN `h`.`ticket_type` = 'tienda' THEN 'Compra en Tienda' WHEN `h`.`ticket_type` = 'marketplace_compra' THEN 'Compra en Marketplace' WHEN `h`.`ticket_type` = 'marketplace_venta' THEN 'Venta en Marketplace' END AS `tipo_label` FROM `tienda_tickets_historial` AS `h` ORDER BY `h`.`claimed_date` DESC;

-- --------------------------------------------------------

--
-- Estructura para la vista `v_tickets_pendientes`
--
DROP TABLE IF EXISTS `v_tickets_pendientes`;

DROP VIEW IF EXISTS `v_tickets_pendientes`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_tickets_pendientes`  AS SELECT `t`.`id` AS `id`, `t`.`user_id` AS `user_id`, `t`.`username` AS `username`, `t`.`ticket_type` AS `ticket_type`, `t`.`item_name` AS `item_name`, `t`.`item_description` AS `item_description`, `t`.`cantidad` AS `cantidad`, `t`.`precio_pagado` AS `precio_pagado`, `t`.`moneda_usada` AS `moneda_usada`, `t`.`categoria` AS `categoria`, `t`.`imagen_url` AS `imagen_url`, `t`.`transaction_id` AS `transaction_id`, `t`.`seller_id` AS `seller_id`, `t`.`seller_username` AS `seller_username`, `t`.`listing_id` AS `listing_id`, `t`.`claimed` AS `claimed`, `t`.`claimed_date` AS `claimed_date`, `t`.`created_at` AS `created_at`, `t`.`expires_at` AS `expires_at`, `t`.`notes` AS `notes`, CASE WHEN `t`.`ticket_type` = 'tienda' THEN 'Compra en Tienda' WHEN `t`.`ticket_type` = 'marketplace_compra' THEN 'Compra en Marketplace' WHEN `t`.`ticket_type` = 'marketplace_venta' THEN 'Venta en Marketplace' END AS `tipo_label`, CASE WHEN `t`.`moneda_usada` = 'esferas' THEN concat(`t`.`precio_pagado`,' Esferas') WHEN `t`.`moneda_usada` = 'llaves' THEN concat(`t`.`precio_pagado`,' Llaves') WHEN `t`.`moneda_usada` = 'cupones_azules' THEN concat(`t`.`precio_pagado`,' Cupones Azules') END AS `precio_label`, to_days(current_timestamp()) - to_days(`t`.`created_at`) AS `dias_antiguedad` FROM `tienda_tickets` AS `t` WHERE `t`.`claimed` = 0 ORDER BY `t`.`created_at` DESC;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `ai_chat_usage`
--
ALTER TABLE `ai_chat_usage`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_usage` (`user_id`,`model_type`,`usage_date`);

--
-- Indices de la tabla `marketplace_cupones`
--
ALTER TABLE `marketplace_cupones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `is_claimed` (`is_claimed`),
  ADD KEY `transaction_id` (`transaction_id`),
  ADD KEY `idx_cupones_user_claimed` (`user_id`,`is_claimed`);

--
-- Indices de la tabla `marketplace_listings`
--
ALTER TABLE `marketplace_listings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `seller_id` (`seller_id`),
  ADD KEY `is_active` (`is_active`),
  ADD KEY `is_sold` (`is_sold`),
  ADD KEY `is_premium_listing` (`is_premium_listing`),
  ADD KEY `reward_id` (`reward_id`),
  ADD KEY `idx_listings_seller_active` (`seller_id`,`is_active`,`is_sold`),
  ADD KEY `idx_ticket_id` (`ticket_id`),
  ADD KEY `idx_source_type` (`source_type`);

--
-- Indices de la tabla `marketplace_premium`
--
ALTER TABLE `marketplace_premium`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `username` (`username`);

--
-- Indices de la tabla `marketplace_transactions`
--
ALTER TABLE `marketplace_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `listing_id` (`listing_id`),
  ADD KEY `seller_id` (`seller_id`),
  ADD KEY `buyer_id` (`buyer_id`),
  ADD KEY `status` (`status`),
  ADD KEY `idx_transactions_buyer` (`buyer_id`,`created_at`);

--
-- Indices de la tabla `online_battles`
--
ALTER TABLE `online_battles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_players` (`player1_id`,`player2_id`),
  ADD KEY `player2_id` (`player2_id`);

--
-- Indices de la tabla `online_match_history`
--
ALTER TABLE `online_match_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_player` (`player_id`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `battle_id` (`battle_id`),
  ADD KEY `opponent_id` (`opponent_id`);

--
-- Indices de la tabla `online_queue`
--
ALTER TABLE `online_queue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_copas` (`copas`),
  ADD KEY `idx_user` (`user_id`);

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
-- Indices de la tabla `tienda_tickets`
--
ALTER TABLE `tienda_tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_ticket_type` (`ticket_type`),
  ADD KEY `idx_claimed` (`claimed`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_user_claimed` (`user_id`,`claimed`),
  ADD KEY `idx_type_claimed` (`ticket_type`,`claimed`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indices de la tabla `tienda_tickets_historial`
--
ALTER TABLE `tienda_tickets_historial`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_claimed_date` (`claimed_date`);

--
-- Indices de la tabla `tienda_tickets_stats`
--
ALTER TABLE `tienda_tickets_stats`
  ADD PRIMARY KEY (`user_id`);

--
-- Indices de la tabla `transacciones_einherjer`
--
ALTER TABLE `transacciones_einherjer`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `username` (`username`),
  ADD KEY `tipo` (`tipo`);

--
-- Indices de la tabla `umbra_endings`
--
ALTER TABLE `umbra_endings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_umbra_endings_user` (`user_id`);

--
-- Indices de la tabla `umbra_player_events`
--
ALTER TABLE `umbra_player_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_event` (`user_id`,`event_type`),
  ADD KEY `idx_umbra_events_user` (`user_id`);

--
-- Indices de la tabla `umbra_progress`
--
ALTER TABLE `umbra_progress`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_umbra_progress_user` (`user_id`);

--
-- Indices de la tabla `umbra_whispers`
--
ALTER TABLE `umbra_whispers`
  ADD PRIMARY KEY (`id`);

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
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `ai_chat_usage`
--
ALTER TABLE `ai_chat_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `marketplace_cupones`
--
ALTER TABLE `marketplace_cupones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `marketplace_listings`
--
ALTER TABLE `marketplace_listings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `marketplace_premium`
--
ALTER TABLE `marketplace_premium`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `marketplace_transactions`
--
ALTER TABLE `marketplace_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `online_battles`
--
ALTER TABLE `online_battles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `online_match_history`
--
ALTER TABLE `online_match_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT de la tabla `online_queue`
--
ALTER TABLE `online_queue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

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
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `recompensas_eliminadas`
--
ALTER TABLE `recompensas_eliminadas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `recompensas_usuario`
--
ALTER TABLE `recompensas_usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT de la tabla `tienda_tickets`
--
ALTER TABLE `tienda_tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `tienda_tickets_historial`
--
ALTER TABLE `tienda_tickets_historial`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `transacciones_einherjer`
--
ALTER TABLE `transacciones_einherjer`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT de la tabla `umbra_endings`
--
ALTER TABLE `umbra_endings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `umbra_player_events`
--
ALTER TABLE `umbra_player_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `umbra_progress`
--
ALTER TABLE `umbra_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `umbra_whispers`
--
ALTER TABLE `umbra_whispers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `ai_chat_usage`
--
ALTER TABLE `ai_chat_usage`
  ADD CONSTRAINT `ai_chat_usage_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `marketplace_cupones`
--
ALTER TABLE `marketplace_cupones`
  ADD CONSTRAINT `marketplace_cupones_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `marketplace_cupones_ibfk_2` FOREIGN KEY (`transaction_id`) REFERENCES `marketplace_transactions` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `marketplace_listings`
--
ALTER TABLE `marketplace_listings`
  ADD CONSTRAINT `marketplace_listings_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `marketplace_listings_ibfk_2` FOREIGN KEY (`reward_id`) REFERENCES `recompensas_usuario` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `marketplace_listings_ibfk_3` FOREIGN KEY (`ticket_id`) REFERENCES `tienda_tickets` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `marketplace_premium`
--
ALTER TABLE `marketplace_premium`
  ADD CONSTRAINT `marketplace_premium_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `marketplace_transactions`
--
ALTER TABLE `marketplace_transactions`
  ADD CONSTRAINT `marketplace_transactions_ibfk_1` FOREIGN KEY (`listing_id`) REFERENCES `marketplace_listings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `marketplace_transactions_ibfk_2` FOREIGN KEY (`seller_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `marketplace_transactions_ibfk_3` FOREIGN KEY (`buyer_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `online_battles`
--
ALTER TABLE `online_battles`
  ADD CONSTRAINT `online_battles_ibfk_1` FOREIGN KEY (`player1_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `online_battles_ibfk_2` FOREIGN KEY (`player2_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `online_match_history`
--
ALTER TABLE `online_match_history`
  ADD CONSTRAINT `online_match_history_ibfk_1` FOREIGN KEY (`battle_id`) REFERENCES `online_battles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `online_match_history_ibfk_2` FOREIGN KEY (`player_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `online_match_history_ibfk_3` FOREIGN KEY (`opponent_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `online_queue`
--
ALTER TABLE `online_queue`
  ADD CONSTRAINT `online_queue_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

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
-- Filtros para la tabla `tienda_tickets`
--
ALTER TABLE `tienda_tickets`
  ADD CONSTRAINT `tienda_tickets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tienda_tickets_stats`
--
ALTER TABLE `tienda_tickets_stats`
  ADD CONSTRAINT `tienda_tickets_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `transacciones_einherjer`
--
ALTER TABLE `transacciones_einherjer`
  ADD CONSTRAINT `transacciones_einherjer_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `umbra_endings`
--
ALTER TABLE `umbra_endings`
  ADD CONSTRAINT `umbra_endings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `umbra_player_events`
--
ALTER TABLE `umbra_player_events`
  ADD CONSTRAINT `umbra_player_events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `umbra_progress`
--
ALTER TABLE `umbra_progress`
  ADD CONSTRAINT `umbra_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

DELIMITER $$
--
-- Eventos
--
DROP EVENT IF EXISTS `cleanup_old_queue_entries`$$
CREATE DEFINER=`root`@`localhost` EVENT `cleanup_old_queue_entries` ON SCHEDULE EVERY 1 MINUTE STARTS '2025-11-19 15:53:01' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    DELETE FROM online_queue 
    WHERE last_heartbeat < DATE_SUB(NOW(), INTERVAL 5 MINUTE);
END$$

DROP EVENT IF EXISTS `cleanup_abandoned_battles`$$
CREATE DEFINER=`root`@`localhost` EVENT `cleanup_abandoned_battles` ON SCHEDULE EVERY 5 MINUTE STARTS '2025-11-19 15:53:01' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    UPDATE online_battles 
    SET status = 'abandoned',
        end_reason = 'disconnect'
    WHERE status = 'active'
    AND updated_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE);
END$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

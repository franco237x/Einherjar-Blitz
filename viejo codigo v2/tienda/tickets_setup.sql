-- =====================================================
-- Sistema de Tickets para Tienda y Marketplace
-- Einherjer Blitz - Tickets System
-- =====================================================

-- Tabla principal de tickets
CREATE TABLE IF NOT EXISTS `tienda_tickets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `ticket_type` ENUM('tienda', 'marketplace_compra', 'marketplace_venta') NOT NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `item_description` TEXT,
    `cantidad` INT NOT NULL DEFAULT 1,
    `precio_pagado` INT NOT NULL COMMENT 'Precio en Esferas/Llaves que pagó',
    `moneda_usada` ENUM('esferas', 'llaves', 'cupones_azules') NOT NULL DEFAULT 'esferas',
    `categoria` VARCHAR(100) DEFAULT 'General',
    `imagen_url` VARCHAR(500),
    
    -- Información de la transacción
    `transaction_id` INT COMMENT 'ID de la transacción relacionada',
    `seller_id` INT COMMENT 'ID del vendedor (solo para marketplace)',
    `seller_username` VARCHAR(100) COMMENT 'Username del vendedor',
    `listing_id` INT COMMENT 'ID del anuncio (solo para marketplace)',
    
    -- Estado del ticket
    `claimed` TINYINT(1) NOT NULL DEFAULT 0,
    `claimed_date` DATETIME,
    
    -- Metadatos
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at` DATETIME COMMENT 'Fecha de expiración (opcional)',
    `notes` TEXT COMMENT 'Notas adicionales',
    
    -- Índices
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_username` (`username`),
    INDEX `idx_ticket_type` (`ticket_type`),
    INDEX `idx_claimed` (`claimed`),
    INDEX `idx_created_at` (`created_at`),
    
    -- Foreign Keys
    FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de historial de reclamos
CREATE TABLE IF NOT EXISTS `tienda_tickets_historial` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ticket_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `item_name` VARCHAR(255) NOT NULL,
    `cantidad` INT NOT NULL,
    `ticket_type` VARCHAR(50) NOT NULL,
    `claimed_date` DATETIME NOT NULL,
    `notes` TEXT,
    
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_claimed_date` (`claimed_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de estadísticas de tickets por usuario
CREATE TABLE IF NOT EXISTS `tienda_tickets_stats` (
    `user_id` INT PRIMARY KEY,
    `total_tickets` INT NOT NULL DEFAULT 0,
    `tickets_claimed` INT NOT NULL DEFAULT 0,
    `tickets_pending` INT NOT NULL DEFAULT 0,
    `total_tienda` INT NOT NULL DEFAULT 0,
    `total_marketplace_compras` INT NOT NULL DEFAULT 0,
    `total_marketplace_ventas` INT NOT NULL DEFAULT 0,
    `last_ticket_date` DATETIME,
    `last_claim_date` DATETIME,
    
    FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Vista para tickets pendientes
-- =====================================================
CREATE OR REPLACE VIEW `v_tickets_pendientes` AS
SELECT 
    t.*,
    CASE 
        WHEN t.ticket_type = 'tienda' THEN 'Compra en Tienda'
        WHEN t.ticket_type = 'marketplace_compra' THEN 'Compra en Marketplace'
        WHEN t.ticket_type = 'marketplace_venta' THEN 'Venta en Marketplace'
    END as tipo_label,
    CASE 
        WHEN t.moneda_usada = 'esferas' THEN CONCAT(t.precio_pagado, ' Esferas')
        WHEN t.moneda_usada = 'llaves' THEN CONCAT(t.precio_pagado, ' Llaves')
        WHEN t.moneda_usada = 'cupones_azules' THEN CONCAT(t.precio_pagado, ' Cupones Azules')
    END as precio_label,
    DATEDIFF(NOW(), t.created_at) as dias_antiguedad
FROM tienda_tickets t
WHERE t.claimed = 0
ORDER BY t.created_at DESC;

-- =====================================================
-- Vista para historial completo con detalles
-- =====================================================
CREATE OR REPLACE VIEW `v_tickets_historial_completo` AS
SELECT 
    h.*,
    DATE_FORMAT(h.claimed_date, '%d/%m/%Y %H:%i') as fecha_formateada,
    CASE 
        WHEN h.ticket_type = 'tienda' THEN 'Compra en Tienda'
        WHEN h.ticket_type = 'marketplace_compra' THEN 'Compra en Marketplace'
        WHEN h.ticket_type = 'marketplace_venta' THEN 'Venta en Marketplace'
    END as tipo_label
FROM tienda_tickets_historial h
ORDER BY h.claimed_date DESC;

-- =====================================================
-- Trigger: Actualizar estadísticas al crear ticket
-- =====================================================
DELIMITER $$

CREATE TRIGGER `trg_ticket_created` 
AFTER INSERT ON `tienda_tickets`
FOR EACH ROW
BEGIN
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
END$$

DELIMITER ;

-- =====================================================
-- Trigger: Actualizar estadísticas al reclamar ticket
-- =====================================================
DELIMITER $$

CREATE TRIGGER `trg_ticket_claimed` 
AFTER UPDATE ON `tienda_tickets`
FOR EACH ROW
BEGIN
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
END$$

DELIMITER ;

-- =====================================================
-- Procedimiento: Reclamar todos los tickets de un usuario
-- =====================================================
DELIMITER $$

CREATE PROCEDURE `sp_claim_all_tickets`(
    IN p_user_id INT,
    OUT p_tickets_claimed INT,
    OUT p_success BOOLEAN
)
BEGIN
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

DELIMITER ;

-- =====================================================
-- Procedimiento: Limpiar tickets expirados
-- =====================================================
DELIMITER $$

CREATE PROCEDURE `sp_cleanup_expired_tickets`()
BEGIN
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

-- =====================================================
-- Índices adicionales para optimización
-- =====================================================
ALTER TABLE `tienda_tickets` 
ADD INDEX `idx_user_claimed` (`user_id`, `claimed`),
ADD INDEX `idx_type_claimed` (`ticket_type`, `claimed`),
ADD INDEX `idx_expires_at` (`expires_at`);

-- =====================================================
-- Insertar datos de prueba (opcional - comentar en producción)
-- =====================================================
/*
INSERT INTO tienda_tickets (user_id, username, ticket_type, item_name, cantidad, precio_pagado, moneda_usada, categoria)
VALUES 
(1, 'test_user', 'tienda', 'Espada Legendaria', 1, 500, 'esferas', 'Armas'),
(1, 'test_user', 'tienda', 'Poción de Vida x5', 5, 100, 'esferas', 'Consumibles'),
(1, 'test_user', 'marketplace_compra', 'Armadura Épica', 1, 750, 'llaves', 'Armaduras');
*/

-- =====================================================
-- Fin del Script
-- =====================================================

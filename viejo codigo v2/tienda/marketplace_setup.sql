-- ============================================
-- MARKETPLACE - Schema Setup
-- Sistema de marketplace para Einherjar Blitz
-- ============================================

-- Tabla para usuarios premium del marketplace
CREATE TABLE IF NOT EXISTS `marketplace_premium` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `premium_active` TINYINT(1) DEFAULT 1,
  `premium_start_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `premium_end_date` TIMESTAMP NULL DEFAULT NULL,
  `can_upload_photos` TINYINT(1) DEFAULT 1,
  `highlighted_listing` TINYINT(1) DEFAULT 1,
  `can_sell_without_inventory` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `username` (`username`),
  CONSTRAINT `marketplace_premium_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para anuncios del marketplace
CREATE TABLE IF NOT EXISTS `marketplace_listings` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `seller_id` INT(11) NOT NULL,
  `seller_username` VARCHAR(50) NOT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `item_description` TEXT DEFAULT NULL,
  `item_image` VARCHAR(500) DEFAULT NULL,
  `reward_id` INT(11) DEFAULT NULL COMMENT 'FK a recompensas_usuario si es del inventario',
  `price_llaves` INT(11) DEFAULT 0,
  `price_esferas` INT(11) DEFAULT 0,
  `price_cupones` INT(11) DEFAULT 0 COMMENT 'Cupones azules (canjeo en Messenger)',
  `is_premium_listing` TINYINT(1) DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `is_sold` TINYINT(1) DEFAULT 0,
  `stock_quantity` INT(11) DEFAULT 1,
  `views_count` INT(11) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sold_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `seller_id` (`seller_id`),
  KEY `is_active` (`is_active`),
  KEY `is_sold` (`is_sold`),
  KEY `is_premium_listing` (`is_premium_listing`),
  KEY `reward_id` (`reward_id`),
  CONSTRAINT `marketplace_listings_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `marketplace_listings_ibfk_2` FOREIGN KEY (`reward_id`) REFERENCES `recompensas_usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para transacciones del marketplace
CREATE TABLE IF NOT EXISTS `marketplace_transactions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `listing_id` INT(11) NOT NULL,
  `seller_id` INT(11) NOT NULL,
  `seller_username` VARCHAR(50) NOT NULL,
  `buyer_id` INT(11) NOT NULL,
  `buyer_username` VARCHAR(50) NOT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `paid_llaves` INT(11) DEFAULT 0,
  `paid_esferas` INT(11) DEFAULT 0,
  `paid_cupones` INT(11) DEFAULT 0,
  `transaction_type` ENUM('llaves', 'esferas', 'cupones') NOT NULL DEFAULT 'esferas',
  `status` ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `listing_id` (`listing_id`),
  KEY `seller_id` (`seller_id`),
  KEY `buyer_id` (`buyer_id`),
  KEY `status` (`status`),
  CONSTRAINT `marketplace_transactions_ibfk_1` FOREIGN KEY (`listing_id`) REFERENCES `marketplace_listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `marketplace_transactions_ibfk_2` FOREIGN KEY (`seller_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `marketplace_transactions_ibfk_3` FOREIGN KEY (`buyer_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para cupones reclamables (cupones azules)
CREATE TABLE IF NOT EXISTS `marketplace_cupones` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `cupones_amount` INT(11) NOT NULL DEFAULT 0,
  `transaction_id` INT(11) DEFAULT NULL,
  `is_claimed` TINYINT(1) DEFAULT 0,
  `claimed_at` TIMESTAMP NULL DEFAULT NULL,
  `messenger_verified` TINYINT(1) DEFAULT 0,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `is_claimed` (`is_claimed`),
  KEY `transaction_id` (`transaction_id`),
  CONSTRAINT `marketplace_cupones_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `marketplace_cupones_ibfk_2` FOREIGN KEY (`transaction_id`) REFERENCES `marketplace_transactions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices adicionales para optimización
CREATE INDEX idx_listings_seller_active ON marketplace_listings(seller_id, is_active, is_sold);
CREATE INDEX idx_transactions_buyer ON marketplace_transactions(buyer_id, created_at);
CREATE INDEX idx_cupones_user_claimed ON marketplace_cupones(user_id, is_claimed);

-- Vista para obtener listings activos con información del vendedor
CREATE OR REPLACE VIEW marketplace_active_listings AS
SELECT 
    ml.*,
    u.perfil_imagen as seller_avatar,
    u.rango as seller_rank,
    mp.premium_active as seller_is_premium,
    mp.highlighted_listing as seller_has_highlight
FROM marketplace_listings ml
JOIN usuarios u ON ml.seller_id = u.id
LEFT JOIN marketplace_premium mp ON ml.seller_id = mp.user_id AND mp.premium_active = 1
WHERE ml.is_active = 1 AND ml.is_sold = 0 AND ml.stock_quantity > 0
ORDER BY 
    ml.is_premium_listing DESC,
    ml.created_at DESC;

-- Vista para estadísticas de vendedores
CREATE OR REPLACE VIEW marketplace_seller_stats AS
SELECT 
    u.id as seller_id,
    u.username as seller_username,
    COUNT(DISTINCT ml.id) as total_listings,
    COUNT(DISTINCT CASE WHEN ml.is_active = 1 AND ml.is_sold = 0 THEN ml.id END) as active_listings,
    COUNT(DISTINCT mt.id) as total_sales,
    COALESCE(SUM(mt.paid_llaves), 0) as total_llaves_earned,
    COALESCE(SUM(mt.paid_esferas), 0) as total_esferas_earned,
    COALESCE(SUM(mt.paid_cupones), 0) as total_cupones_earned,
    mp.premium_active as is_premium
FROM usuarios u
LEFT JOIN marketplace_listings ml ON u.id = ml.seller_id
LEFT JOIN marketplace_transactions mt ON u.id = mt.seller_id AND mt.status = 'completed'
LEFT JOIN marketplace_premium mp ON u.id = mp.user_id AND mp.premium_active = 1
GROUP BY u.id;

-- Triggers para mantener integridad

-- Trigger: Al vender un item del inventario, marcarlo como vendido en recompensas_usuario
DELIMITER //
CREATE TRIGGER after_marketplace_sale 
AFTER UPDATE ON marketplace_listings
FOR EACH ROW
BEGIN
    IF NEW.is_sold = 1 AND OLD.is_sold = 0 AND NEW.reward_id IS NOT NULL THEN
        -- Marcar la recompensa como "vendida" agregando un campo extra
        UPDATE recompensas_usuario 
        SET tipo_recompensa = CONCAT(tipo_recompensa, '_vendido')
        WHERE id = NEW.reward_id;
    END IF;
END//
DELIMITER ;

-- Trigger: Incrementar contador de vistas
DELIMITER //
CREATE TRIGGER increment_listing_views 
BEFORE UPDATE ON marketplace_listings
FOR EACH ROW
BEGIN
    IF NEW.views_count > OLD.views_count THEN
        SET NEW.views_count = OLD.views_count + 1;
    END IF;
END//
DELIMITER ;

-- ============================================
-- Datos de prueba (opcional)
-- ============================================

-- Insertar algunos usuarios premium de ejemplo (descomentar si se desea)
-- INSERT INTO marketplace_premium (user_id, username, premium_active) VALUES (1, 'admin', 1);

-- ============================================
-- Notas de uso:
-- ============================================
-- 1. Para activar premium a un usuario: INSERT INTO marketplace_premium (user_id, username) VALUES (?, ?);
-- 2. Los cupones azules se guardan en marketplace_cupones y se reclaman en el grupo de Messenger
-- 3. Los items vendidos desde el inventario quedan marcados en recompensas_usuario con sufijo "_vendido"
-- 4. Las transacciones se registran automáticamente en marketplace_transactions
-- ============================================

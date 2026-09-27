-- =====================================================
-- Migración: Soporte para vender tickets en marketplace
-- Einherjar Blitz - Marketplace Inventory Extension
-- =====================================================

-- Agregar columnas para soportar tickets como fuente de inventario
ALTER TABLE `marketplace_listings`
ADD COLUMN `ticket_id` INT(11) DEFAULT NULL COMMENT 'FK a tienda_tickets si proviene de ticket' AFTER `reward_id`,
ADD COLUMN `source_type` ENUM('recompensa', 'ticket', 'manual') DEFAULT 'manual' COMMENT 'Origen del artículo' AFTER `ticket_id`,
ADD COLUMN `item_category` VARCHAR(100) DEFAULT 'General' COMMENT 'Categoría del artículo' AFTER `item_description`,
ADD COLUMN `item_image_url` VARCHAR(500) DEFAULT NULL COMMENT 'URL de imagen' AFTER `item_image`;

-- Actualizar índices
CREATE INDEX idx_ticket_id ON marketplace_listings(ticket_id);
CREATE INDEX idx_source_type ON marketplace_listings(source_type);

-- Agregar foreign key para ticket_id (opcional, depende de si quieres cascade delete)
ALTER TABLE `marketplace_listings`
ADD CONSTRAINT `marketplace_listings_ibfk_3` 
FOREIGN KEY (`ticket_id`) REFERENCES `tienda_tickets` (`id`) 
ON DELETE SET NULL;

-- Actualizar registros existentes
UPDATE `marketplace_listings` 
SET `source_type` = 'recompensa' 
WHERE `reward_id` IS NOT NULL AND `source_type` = 'manual';

-- Comentarios
-- Esta migración permite:
-- 1. Vender recompensas del gacha (usando reward_id)
-- 2. Vender tickets no reclamados de tienda/marketplace (usando ticket_id)
-- 3. Crear listings manuales sin inventario (para premium)

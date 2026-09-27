-- Key Purchases and Ad Views Tables
-- Einherjer Blitz 3.0 - Gacha System

-- Table for key purchase transactions
CREATE TABLE IF NOT EXISTS `key_purchases` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `payment_provider` ENUM('mercadopago', 'paypal') NOT NULL,
    `payment_id` VARCHAR(255) NOT NULL,
    `external_reference` VARCHAR(255) DEFAULT NULL,
    `package_id` VARCHAR(50) NOT NULL,
    `keys_purchased` INT NOT NULL,
    `bonus_keys` INT DEFAULT 0,
    `amount_paid` DECIMAL(10,2) NOT NULL,
    `currency` VARCHAR(3) DEFAULT 'USD',
    `status` ENUM('pending', 'approved', 'rejected', 'refunded') DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `completed_at` TIMESTAMP NULL,
    `webhook_data` JSON DEFAULT NULL,
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_payment_id` (`payment_id`),
    INDEX `idx_status` (`status`),
    FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for ad view tracking
CREATE TABLE IF NOT EXISTS `ad_views` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `view_date` DATE NOT NULL,
    `views_count` INT DEFAULT 0,
    `keys_earned` INT DEFAULT 0,
    `last_view_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_date` (`user_id`, `view_date`),
    INDEX `idx_user_id` (`user_id`),
    FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

<?php
require_once __DIR__ . '/../includes/Database.php';

try {
    $db = Database::getInstance()->getConnection();

    // Daily aggregated usage per user/model with token accounting
    $sql = "CREATE TABLE IF NOT EXISTS ai_chat_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        model_type VARCHAR(32) NOT NULL,
        usage_date DATE NOT NULL,
        request_count INT UNSIGNED NOT NULL DEFAULT 0,
        prompt_tokens INT UNSIGNED NOT NULL DEFAULT 0,
        output_tokens INT UNSIGNED NOT NULL DEFAULT 0,
        context_limit_tokens INT UNSIGNED NOT NULL DEFAULT 2048,
        prompt_tokens_used INT UNSIGNED NOT NULL DEFAULT 0,
        output_tokens_used INT UNSIGNED NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_usage (user_id, model_type, usage_date),
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $db->exec($sql);
    echo "Tabla 'ai_chat_usage' creada o ya existente.<br>";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
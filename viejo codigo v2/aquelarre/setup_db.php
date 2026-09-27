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

    // Tracking individual witch conversations (historical, no longer blocks access)
    $sqlTrials = "CREATE TABLE IF NOT EXISTS aquelarre_trials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        witch_name VARCHAR(32) NOT NULL,
        completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_trial (user_id, witch_name),
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $db->exec($sqlTrials);
    echo "Tabla 'aquelarre_trials' creada o ya existente.<br>";

    // Add hot mode column to usuarios if it doesn't exist
    $checkCol = $db->query("SHOW COLUMNS FROM usuarios LIKE 'aquelarre_hot'");
    if ($checkCol->rowCount() === 0) {
        $db->exec("ALTER TABLE usuarios ADD COLUMN aquelarre_hot TINYINT(1) NOT NULL DEFAULT 0");
        echo "Columna 'aquelarre_hot' agregada a 'usuarios'.<br>";
    } else {
        echo "Columna 'aquelarre_hot' ya existe en 'usuarios'.<br>";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
<?php
require_once __DIR__ . '/../includes/Database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Create ai_chat_usage table
    $sql = "CREATE TABLE IF NOT EXISTS ai_chat_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        model_type VARCHAR(20) NOT NULL,
        usage_date DATE NOT NULL,
        request_count INT DEFAULT 1,
        UNIQUE KEY unique_usage (user_id, model_type, usage_date),
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $db->exec($sql);
    echo "Table 'ai_chat_usage' created or already exists successfully.<br>";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
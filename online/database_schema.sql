-- ============================================
-- Einherjar Blitz - Online Battle Mode Schema
-- ============================================

-- Tabla para la cola de matchmaking
CREATE TABLE IF NOT EXISTS online_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    rango VARCHAR(50) NOT NULL,
    copas INT NOT NULL,
    character_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('searching', 'matched', 'cancelled') DEFAULT 'searching',
    match_id INT DEFAULT NULL,
    INDEX idx_status (status),
    INDEX idx_copas (copas),
    INDEX idx_user (user_id),
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para las batallas online activas
CREATE TABLE IF NOT EXISTS online_battles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player1_id INT NOT NULL,
    player2_id INT NOT NULL,
    player1_username VARCHAR(50) NOT NULL,
    player2_username VARCHAR(50) NOT NULL,
    player1_character_id INT NOT NULL,
    player2_character_id INT NOT NULL,
    player1_rango VARCHAR(50) NOT NULL,
    player2_rango VARCHAR(50) NOT NULL,
    player1_copas INT NOT NULL,
    player2_copas INT NOT NULL,
    battle_state JSON NOT NULL,
    current_turn ENUM('player1', 'player2') NOT NULL,
    turn_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    turn_timeout INT DEFAULT 30,
    status ENUM('active', 'finished', 'abandoned') DEFAULT 'active',
    winner_id INT DEFAULT NULL,
    end_reason ENUM('knockout', 'surrender', 'timeout', 'disconnect') DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    player1_last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    player2_last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_players (player1_id, player2_id),
    FOREIGN KEY (player1_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (player2_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para el historial de partidas
CREATE TABLE IF NOT EXISTS online_match_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    battle_id INT NOT NULL,
    player_id INT NOT NULL,
    opponent_id INT NOT NULL,
    player_username VARCHAR(50) NOT NULL,
    opponent_username VARCHAR(50) NOT NULL,
    player_character_id INT NOT NULL,
    opponent_character_id INT NOT NULL,
    result ENUM('win', 'loss', 'draw') NOT NULL,
    cups_change INT NOT NULL,
    duration_seconds INT NOT NULL,
    damage_dealt INT DEFAULT 0,
    damage_received INT DEFAULT 0,
    rounds_played INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_player (player_id),
    INDEX idx_created (created_at),
    FOREIGN KEY (battle_id) REFERENCES online_battles(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (opponent_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Limpiar registros antiguos de la cola (más de 5 minutos)
DELIMITER $$
CREATE EVENT IF NOT EXISTS cleanup_old_queue_entries
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
    DELETE FROM online_queue 
    WHERE last_heartbeat < DATE_SUB(NOW(), INTERVAL 5 MINUTE);
END$$
DELIMITER ;

-- Limpiar batallas abandonadas (más de 10 minutos sin actualización)
DELIMITER $$
CREATE EVENT IF NOT EXISTS cleanup_abandoned_battles
ON SCHEDULE EVERY 5 MINUTE
DO
BEGIN
    UPDATE online_battles 
    SET status = 'abandoned',
        end_reason = 'disconnect'
    WHERE status = 'active'
    AND updated_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE);
END$$
DELIMITER ;

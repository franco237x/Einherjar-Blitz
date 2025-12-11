-- UMBRA - Psychological Horror Game Database Schema
-- Sistema de terror psicológico con persistencia entre sesiones

-- Tabla principal de progreso
CREATE TABLE IF NOT EXISTS umbra_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_count INT DEFAULT 1,
    chapter INT DEFAULT 1,
    paranoia_level INT DEFAULT 0,
    perception INT DEFAULT 100,
    trust INT DEFAULT 50,
    sanity INT DEFAULT 100,
    has_seen_face BOOLEAN DEFAULT FALSE,
    knows_name BOOLEAN DEFAULT FALSE,
    room_revealed BOOLEAN DEFAULT FALSE,
    made_pact BOOLEAN DEFAULT FALSE,
    attempted_escape INT DEFAULT 0,
    current_room VARCHAR(50) DEFAULT 'void',
    inventory JSON,
    discovered_secrets JSON,
    event_log JSON,
    whispers_heard JSON,
    total_playtime_minutes INT DEFAULT 0,
    last_chapter_time TIMESTAMP NULL,
    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de eventos del jugador (memoria persistente)
CREATE TABLE IF NOT EXISTS umbra_player_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSON,
    session_number INT DEFAULT 1,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_user_event (user_id, event_type)
);

-- Tabla de susurros desbloqueados
CREATE TABLE IF NOT EXISTS umbra_whispers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content TEXT NOT NULL,
    trigger_condition VARCHAR(100),
    min_paranoia INT DEFAULT 0,
    max_perception INT DEFAULT 100,
    rarity INT DEFAULT 50,
    is_personalized BOOLEAN DEFAULT FALSE,
    category ENUM('ambient', 'threat', 'memory', 'revelation', 'fourth_wall') DEFAULT 'ambient'
);

-- Insertar susurros predefinidos
INSERT INTO umbra_whispers (content, trigger_condition, min_paranoia, max_perception, rarity, category) VALUES
-- Susurros ambientales
('...puedo oírte respirar...', NULL, 0, 100, 70, 'ambient'),
('¿Por qué sigues aquí?', NULL, 10, 90, 60, 'ambient'),
('La puerta nunca existió...', 'chapter_3', 20, 80, 50, 'ambient'),
('Recuerdo cuando llegaste...', 'session_2', 0, 100, 40, 'memory'),
('Esta no es la primera vez...', 'session_3', 30, 70, 30, 'memory'),

-- Susurros amenazantes
('Pronto vendrá...', NULL, 40, 60, 40, 'threat'),
('No mires atrás...', NULL, 50, 50, 35, 'threat'),
('Está detrás de ti...', NULL, 60, 40, 25, 'threat'),
('Ya es demasiado tarde...', 'chapter_7', 70, 30, 20, 'threat'),

-- Revelaciones
('Tú me creaste...', 'chapter_10', 50, 50, 15, 'revelation'),
('Siempre has estado aquí...', 'chapter_12', 60, 40, 10, 'revelation'),
('Eres yo...', 'chapter_14', 80, 20, 5, 'revelation'),

-- Cuarta pared (personalizados - {name} se reemplaza)
('Sé que eres tú, {name}...', NULL, 30, 70, 25, 'fourth_wall'),
('¿Cuántas veces más, {name}?', 'session_2', 40, 60, 20, 'fourth_wall'),
('Son las {time}... ¿no deberías dormir?', 'night_time', 20, 80, 30, 'fourth_wall'),
('Llevas {minutes} minutos aquí...', NULL, 50, 50, 35, 'fourth_wall');

-- Tabla de finales alcanzados
CREATE TABLE IF NOT EXISTS umbra_endings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    ending_type VARCHAR(50) NOT NULL,
    ending_variation INT DEFAULT 1,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_number INT,
    final_paranoia INT,
    final_perception INT,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para mejor rendimiento
CREATE INDEX idx_umbra_progress_user ON umbra_progress(user_id);
CREATE INDEX idx_umbra_events_user ON umbra_player_events(user_id);
CREATE INDEX idx_umbra_endings_user ON umbra_endings(user_id);


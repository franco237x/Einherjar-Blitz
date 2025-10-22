-- Tablas para el minijuego AM (Allied Mastercomputer)

-- Tabla de progreso del juego
CREATE TABLE IF NOT EXISTS `am_game_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `chapter` int(11) NOT NULL DEFAULT 1,
  `decisions` text NOT NULL,
  `discovered_truth` tinyint(1) NOT NULL DEFAULT 0,
  `defied_am` tinyint(1) NOT NULL DEFAULT 0,
  `showed_compassion` tinyint(1) NOT NULL DEFAULT 0,
  `found_core_access` tinyint(1) NOT NULL DEFAULT 0,
  `sanity` int(11) NOT NULL DEFAULT 100,
  `trust` int(11) NOT NULL DEFAULT 50,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_am_progress_user` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de finales desbloqueados
CREATE TABLE IF NOT EXISTS `am_endings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `ending_type` enum('good_ending','bad_ending','secret_ending','true_ending') NOT NULL,
  `unlocked_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `ending_type` (`ending_type`),
  CONSTRAINT `fk_am_endings_user` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices para mejorar rendimiento
CREATE INDEX idx_am_progress_user ON am_game_progress(user_id);
CREATE INDEX idx_am_endings_user_ending ON am_endings(user_id, ending_type);

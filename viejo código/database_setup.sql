-- Crear base de datos Einherjer Blitz
CREATE DATABASE IF NOT EXISTS `einherjer_blitz` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `einherjer_blitz`;

-- Tabla de usuarios modernizada
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `email` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `unique_id` varchar(100) NOT NULL UNIQUE,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `jefes_derrotados` int(11) NOT NULL DEFAULT 0,
  `megajefes_derrotados` int(11) NOT NULL DEFAULT 0,
  `horas_jugadas` int(11) NOT NULL DEFAULT 0,
  `rango` varchar(50) NOT NULL DEFAULT 'Sin Rango',
  `copas` int(11) NOT NULL DEFAULT 0,
  `llaves` int(11) NOT NULL DEFAULT 0,
  `recompensas` int(11) NOT NULL DEFAULT 0,
  `perfil_imagen` varchar(255) DEFAULT 'default.jpg',
  `frase` varchar(255) DEFAULT 'Guerrero de Einherjer',
  `nivel` int(11) NOT NULL DEFAULT 1,
  `experiencia` int(11) NOT NULL DEFAULT 0,
  `victorias` int(11) NOT NULL DEFAULT 0,
  `derrotas` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_unique_id` (`unique_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de sesiones para seguridad moderna
CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `user_id` (`user_id`),
  KEY `idx_expires` (`expires_at`),
  FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de productos
CREATE TABLE `productos` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(100) NOT NULL,
  `Precio_Esferas` int(11) NOT NULL,
  `Stock` int(11) NOT NULL,
  `Imagen_URL` varchar(500) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `categoria` varchar(50) DEFAULT 'general',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de recompensas modernizada
CREATE TABLE `recompensas_usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `recompensa_obtenida` varchar(100) NOT NULL,
  `tipo_recompensa` varchar(50) DEFAULT 'general',
  `valor` int(11) DEFAULT 0,
  `fecha_obtencion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `username` (`username`),
  FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de transacciones EINHERJER
CREATE TABLE `transacciones_einherjer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `tipo` enum('minado','deposito','transferencia','retiro','compra') NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `destinatario` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `username` (`username`),
  KEY `tipo` (`tipo`),
  FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pase de batalla
CREATE TABLE `pase_batalla` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `premium` tinyint(1) DEFAULT 0,
  `progreso` int(11) DEFAULT 0,
  `temporada` varchar(50) DEFAULT 'actual',
  `fecha_compra` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_username_temporada` (`user_id`, `temporada`),
  KEY `username` (`username`),
  FOREIGN KEY (`user_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar datos de ejemplo
INSERT INTO `productos` (`Nombre`, `Precio_Esferas`, `Stock`, `Imagen_URL`, `descripcion`, `categoria`) VALUES
('Teigu: Murasame', 300, 1, 'https://i.pinimg.com/originals/af/64/3f/af643f6558e79d9f53e2d2855c75fb6b.jpg', 'Legendaria espada maldita que mata con un solo corte', 'armas'),
('Invocación Mítica: Kokushibo', 150, 1, 'https://i.pinimg.com/236x/c2/14/15/c214151acbb9aca01191de17cf49dd93.jpg', 'Invocación del demonio de la Luna Superior', 'invocaciones'),
('Libro Exclusivo: Griffith', 350, 0, 'https://i.pinimg.com/originals/fd/1a/aa/fd1aaabe4b310a19e109b3567e58456f.jpg', 'Conocimiento prohibido del Halcón de la Luz', 'libros'),
('Cofre Misterioso Mejorado', 80, 10, 'https://img.freepik.com/fotos-premium/misterioso-cofre-tesoro_863013-113912.jpg', 'Cofre que contiene recompensas aleatorias mejoradas', 'cofres');

-- Insertar usuario administrador por defecto
INSERT INTO `usuarios` (`username`, `password_hash`, `unique_id`, `rango`, `copas`, `llaves`, `recompensas`, `nivel`, `frase`) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN2024', 'Gran Maestro', 9999, 100, 1000, 50, 'Administrador de Einherjer Blitz');

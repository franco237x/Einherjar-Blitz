<?php
/**
 * Script de migración para el sistema de Wallet
 * Ejecutar este archivo para crear las tablas necesarias para el wallet
 */

require_once 'includes/Database.php';

function runMigration() {
    $db = Database::getInstance();
    
    $migrations = [
        // Tabla de terrenos
        "CREATE TABLE IF NOT EXISTS `terrenos` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `nombre` varchar(100) NOT NULL,
            `descripcion` text,
            `owner_id` int(11) NOT NULL,
            `precio_inicial` decimal(15,2) NOT NULL DEFAULT 1000.00,
            `precio_actual` decimal(15,2) NOT NULL DEFAULT 1000.00,
            `supply_total` decimal(15,2) NOT NULL DEFAULT 10000.00,
            `supply_circulante` decimal(15,2) NOT NULL DEFAULT 10000.00,
            `volumen_24h` decimal(15,2) DEFAULT 0.00,
            `cambio_24h` decimal(5,2) DEFAULT 0.00,
            `imagen_url` varchar(500) DEFAULT 'default_terrain.jpg',
            `categoria` varchar(50) DEFAULT 'residencial',
            `ubicacion` varchar(200),
            `activo` tinyint(1) DEFAULT 1,
            `fecha_creacion` timestamp DEFAULT CURRENT_TIMESTAMP,
            `ultima_actualizacion` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_owner` (`owner_id`),
            KEY `idx_categoria` (`categoria`),
            KEY `idx_precio` (`precio_actual`),
            FOREIGN KEY (`owner_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Tabla de inversiones en terrenos
        "CREATE TABLE IF NOT EXISTS `terrain_investments` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `user_id` int(11) NOT NULL,
            `terrain_id` int(11) NOT NULL,
            `cantidad_acciones` decimal(15,8) NOT NULL,
            `precio_compra` decimal(15,8) NOT NULL,
            `valor_inversion` decimal(15,2) NOT NULL,
            `fecha_inversion` timestamp DEFAULT CURRENT_TIMESTAMP,
            `activo` tinyint(1) DEFAULT 1,
            PRIMARY KEY (`id`),
            KEY `idx_user_terrain` (`user_id`, `terrain_id`),
            KEY `idx_fecha` (`fecha_inversion`),
            FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`terrain_id`) REFERENCES `terrenos` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Tabla de transacciones del wallet
        "CREATE TABLE IF NOT EXISTS `wallet_transactions` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `user_id` int(11) NOT NULL,
            `tipo` enum('compra_terreno','venta_terreno','transferencia_esferas','transferencia_llaves','recompensa','minado','deposito','retiro','fee') NOT NULL,
            `subtipo` varchar(50) DEFAULT NULL,
            `cantidad_esferas` decimal(15,2) DEFAULT 0.00,
            `cantidad_llaves` int(11) DEFAULT 0,
            `terrain_id` int(11) DEFAULT NULL,
            `precio_por_accion` decimal(15,8) DEFAULT NULL,
            `cantidad_acciones` decimal(15,8) DEFAULT NULL,
            `fee_amount` decimal(15,2) DEFAULT 0.00,
            `destinatario_id` int(11) DEFAULT NULL,
            `hash_transaccion` varchar(64) DEFAULT NULL,
            `estado` enum('pendiente','completada','fallida','cancelada') DEFAULT 'completada',
            `descripcion` text,
            `metadata` json DEFAULT NULL,
            `fecha_transaccion` timestamp DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `idx_hash` (`hash_transaccion`),
            KEY `idx_user_fecha` (`user_id`, `fecha_transaccion`),
            KEY `idx_tipo` (`tipo`),
            KEY `idx_terrain` (`terrain_id`),
            KEY `idx_destinatario` (`destinatario_id`),
            FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`terrain_id`) REFERENCES `terrenos` (`id`) ON DELETE SET NULL,
            FOREIGN KEY (`destinatario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Tabla de portfolio del usuario
        "CREATE TABLE IF NOT EXISTS `user_portfolio` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `user_id` int(11) NOT NULL,
            `terrain_id` int(11) NOT NULL,
            `total_acciones` decimal(15,8) NOT NULL DEFAULT 0.00000000,
            `valor_promedio_compra` decimal(15,8) NOT NULL DEFAULT 0.00000000,
            `inversion_total` decimal(15,2) NOT NULL DEFAULT 0.00,
            `valor_actual` decimal(15,2) NOT NULL DEFAULT 0.00,
            `ganancia_perdida` decimal(15,2) NOT NULL DEFAULT 0.00,
            `porcentaje_change` decimal(5,2) NOT NULL DEFAULT 0.00,
            `ultima_actualizacion` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `idx_user_terrain` (`user_id`, `terrain_id`),
            KEY `idx_user` (`user_id`),
            KEY `idx_valor` (`valor_actual`),
            FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`terrain_id`) REFERENCES `terrenos` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

        // Tabla de configuración del wallet
        "CREATE TABLE IF NOT EXISTS `wallet_config` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `user_id` int(11) NOT NULL,
            `fee_trading` decimal(5,4) DEFAULT 0.0025,
            `slippage_tolerance` decimal(5,4) DEFAULT 0.0050,
            `auto_reinvest` tinyint(1) DEFAULT 0,
            `notifications_enabled` tinyint(1) DEFAULT 1,
            `privacy_mode` tinyint(1) DEFAULT 0,
            `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
            `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `idx_user` (`user_id`),
            FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    ];

    // Insertar terrenos con precios y dueños específicos
    $terrenos = [
        ['nombre' => 'Fortaleza de la Soledad', 'categoria' => 'fortaleza', 'precio_actual' => 3375.00, 'supply_circulante' => 100, 'imagen_url' => 'fortaleza1.jpg', 'owner_id' => 1],
        ['nombre' => 'Cybertron', 'categoria' => 'industrial', 'precio_actual' => 6075.00, 'supply_circulante' => 100, 'imagen_url' => 'cybertron.jpg', 'owner_id' => 1],
        ['nombre' => 'Fortaleza Dimensional Infinita', 'categoria' => 'fortaleza', 'precio_actual' => 2600.00, 'supply_circulante' => 100, 'imagen_url' => 'fortaleza2.jpg', 'owner_id' => 1],
        ['nombre' => 'Marineford', 'categoria' => 'fortaleza', 'precio_actual' => 1365.00, 'supply_circulante' => 100, 'imagen_url' => 'marineford.jpg', 'owner_id' => 1],
        ['nombre' => 'Fortaleza Karma', 'categoria' => 'fortaleza', 'precio_actual' => 1675.00, 'supply_circulante' => 100, 'imagen_url' => 'karma.jpg', 'owner_id' => 1],
        ['nombre' => 'Colegio Técnico de Hechicería Metropolitana de Tokio', 'categoria' => 'comercial', 'precio_actual' => 1200.00, 'supply_circulante' => 100, 'imagen_url' => 'tokyo.jpg', 'owner_id' => 1],
        ['nombre' => 'Liyue', 'categoria' => 'comercial', 'precio_actual' => 1814.00, 'supply_circulante' => 100, 'imagen_url' => 'liyue.jpg', 'owner_id' => 1],
        ['nombre' => 'Fontaine', 'categoria' => 'natural', 'precio_actual' => 7012.00, 'supply_circulante' => 100, 'imagen_url' => 'fontaine.jpg', 'owner_id' => 1],
        ['nombre' => 'Sociedad de Almas', 'categoria' => 'fortaleza', 'precio_actual' => 2012.00, 'supply_circulante' => 100, 'imagen_url' => 'almas.jpg', 'owner_id' => 1],
        ['nombre' => 'Penacony', 'categoria' => 'comercial', 'precio_actual' => 3128.00, 'supply_circulante' => 100, 'imagen_url' => 'penacony.jpg', 'owner_id' => 1],
        ['nombre' => 'Wano', 'categoria' => 'natural', 'precio_actual' => 1915.00, 'supply_circulante' => 100, 'imagen_url' => 'wano.jpg', 'owner_id' => 1],
        ['nombre' => 'Inazuma', 'categoria' => 'natural', 'precio_actual' => 1275.00, 'supply_circulante' => 100, 'imagen_url' => 'inazuma.jpg', 'owner_id' => 1],
        ['nombre' => 'Templo de Kamisama', 'categoria' => 'fortaleza', 'precio_actual' => 3806.00, 'supply_circulante' => 100, 'imagen_url' => 'kamisama.jpg', 'owner_id' => 1],
        ['nombre' => 'Natlan', 'categoria' => 'natural', 'precio_actual' => 3750.00, 'supply_circulante' => 100, 'imagen_url' => 'natlan.jpg', 'owner_id' => 1],
        ['nombre' => 'La Senda', 'categoria' => 'natural', 'precio_actual' => 2137.00, 'supply_circulante' => 100, 'imagen_url' => 'senda.jpg', 'owner_id' => 1],
        ['nombre' => 'Piltover/Zaun', 'categoria' => 'industrial', 'precio_actual' => 2900.00, 'supply_circulante' => 100, 'imagen_url' => 'piltover.jpg', 'owner_id' => 1],
        ['nombre' => 'Sumeru', 'categoria' => 'natural', 'precio_actual' => 2713.00, 'supply_circulante' => 100, 'imagen_url' => 'sumeru.jpg', 'owner_id' => 1],
        ['nombre' => 'Rhodes Island', 'categoria' => 'fortaleza', 'precio_actual' => 2670.00, 'supply_circulante' => 100, 'imagen_url' => 'rhodes.jpg', 'owner_id' => 1],
        ['nombre' => 'Mary Geoise', 'categoria' => 'fortaleza', 'precio_actual' => 1447.00, 'supply_circulante' => 100, 'imagen_url' => 'mary.jpg', 'owner_id' => 1],
        ['nombre' => 'Nazarick', 'categoria' => 'fortaleza', 'precio_actual' => 2656.00, 'supply_circulante' => 100, 'imagen_url' => 'nazarick.jpg', 'owner_id' => 1]
    ];

    try {
        $db->beginTransaction();

        echo "🚀 Iniciando migración del sistema Wallet...\n\n";

        // Ejecutar migraciones de tablas
        foreach ($migrations as $index => $sql) {
            echo "📊 Creando tabla " . ($index + 1) . "/" . count($migrations) . "...\n";
            $db->prepare($sql)->execute();
            echo "✅ Tabla creada exitosamente\n\n";
        }

        // Insertar terrenos
        echo "📦 Insertando terrenos...\n";
        foreach ($terrenos as $index => $terreno) {
            $sql = "INSERT INTO `terrenos` (`nombre`, `categoria`, `precio_actual`, `supply_circulante`, `imagen_url`, `owner_id`) VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                $terreno['nombre'],
                $terreno['categoria'], 
                $terreno['precio_actual'],
                $terreno['supply_circulante'],
                $terreno['imagen_url'],
                $terreno['owner_id']
            ]);
            echo "📝 Insertado: " . $terreno['nombre'] . " - " . $terreno['precio_actual'] . " ESF (Dueño: User ID " . $terreno['owner_id'] . ")\n";
        }

        $db->commit();
        
        echo "🎉 ¡Migración completada exitosamente!\n\n";
        echo "📋 Resumen:\n";
        echo "   • Tablas creadas: " . count($migrations) . "\n";
        echo "   • Terrenos insertados: " . count($terrenos) . "\n";
        echo "   • Sistema Wallet: ✅ Listo para usar\n\n";
        echo "🔗 Puedes acceder al wallet desde: dashboard.php → Wallet\n";

        return true;

    } catch (Exception $e) {
        if ($db->getConnection()->inTransaction()) {
            $db->rollback();
        }
        echo "❌ Error durante la migración: " . $e->getMessage() . "\n";
        return false;
    }
}

// Verificar si se ejecuta desde línea de comandos o navegador
if (php_sapi_name() === 'cli') {
    // Línea de comandos
    echo "=== MIGRACIÓN SISTEMA WALLET - EINHERJER BLITZ ===\n\n";
    runMigration();
} else {
    // Navegador web
    header('Content-Type: text/plain; charset=utf-8');
    
    // Verificar autenticación (opcional para seguridad)
    require_once 'includes/Database.php';
    $auth = new AuthController();
    
    if ($auth->isAuthenticated()) {
        $userData = $auth->getUserData();
        if ($userData && $userData['username'] === 'admin') {
            echo "=== MIGRACIÓN SISTEMA WALLET - EINHERJER BLITZ ===\n\n";
            echo "Usuario: " . $userData['username'] . "\n";
            echo "Fecha: " . date('Y-m-d H:i:s') . "\n\n";
            runMigration();
        } else {
            echo "❌ Acceso denegado: Solo administradores pueden ejecutar migraciones\n";
        }
    } else {
        echo "❌ Acceso denegado: Debes estar autenticado\n";
    }
}
?>

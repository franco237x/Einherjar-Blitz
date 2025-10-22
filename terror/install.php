<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instalación AM Game - Einherjar Blitz</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            background: #0a0a0a;
            color: #00ff00;
            padding: 40px 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            max-width: 800px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ff00;
            padding: 40px;
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
        }
        
        h1 {
            text-align: center;
            color: #00ff00;
            text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
            margin-bottom: 30px;
            font-size: 28px;
        }
        
        .status {
            padding: 20px;
            margin: 20px 0;
            border: 1px solid;
            border-radius: 5px;
        }
        
        .success {
            background: rgba(0, 255, 0, 0.1);
            border-color: #00ff00;
            color: #00ff00;
        }
        
        .error {
            background: rgba(255, 0, 0, 0.1);
            border-color: #ff0000;
            color: #ff0000;
        }
        
        .warning {
            background: rgba(255, 170, 0, 0.1);
            border-color: #ffaa00;
            color: #ffaa00;
        }
        
        .btn {
            display: inline-block;
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid #00ff00;
            color: #00ff00;
            padding: 15px 30px;
            text-decoration: none;
            margin: 10px 5px;
            cursor: pointer;
            transition: all 0.3s;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        
        .btn:hover {
            background: rgba(0, 255, 0, 0.2);
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
        }
        
        .btn-danger {
            border-color: #ff0000;
            color: #ff0000;
            background: rgba(255, 0, 0, 0.1);
        }
        
        .btn-danger:hover {
            background: rgba(255, 0, 0, 0.2);
            box-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
        }
        
        pre {
            background: rgba(0, 0, 0, 0.5);
            padding: 15px;
            overflow-x: auto;
            border-left: 3px solid #00ff00;
            margin: 15px 0;
        }
        
        .actions {
            text-align: center;
            margin-top: 30px;
        }
        
        ul {
            list-style: none;
            padding-left: 20px;
        }
        
        li::before {
            content: '> ';
            color: #ffaa00;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>AM GAME - INSTALACIÓN</h1>
        
        <?php
        require_once '../includes/Database.php';
        
        $installationStatus = [];
        $hasErrors = false;
        
        if (isset($_GET['install'])) {
            try {
                $db = Database::getInstance();
                
                // Crear tabla am_game_progress
                $sql1 = "CREATE TABLE IF NOT EXISTS `am_game_progress` (
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
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
                
                $stmt = $db->prepare($sql1);
                $stmt->execute();
                $installationStatus[] = ['success', 'Tabla am_game_progress creada exitosamente'];
                
                // Crear tabla am_endings
                $sql2 = "CREATE TABLE IF NOT EXISTS `am_endings` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `user_id` int(11) NOT NULL,
                  `ending_type` enum('good_ending','bad_ending','secret_ending','true_ending') NOT NULL,
                  `unlocked_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`id`),
                  KEY `user_id` (`user_id`),
                  KEY `ending_type` (`ending_type`),
                  CONSTRAINT `fk_am_endings_user` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
                
                $stmt = $db->prepare($sql2);
                $stmt->execute();
                $installationStatus[] = ['success', 'Tabla am_endings creada exitosamente'];
                
                $installationStatus[] = ['success', '✓ Instalación completada con éxito'];
                
            } catch (PDOException $e) {
                $installationStatus[] = ['error', 'Error: ' . $e->getMessage()];
                $hasErrors = true;
            }
        }
        
        if (isset($_GET['reset'])) {
            try {
                $db = Database::getInstance();
                
                $stmt1 = $db->prepare("DROP TABLE IF EXISTS am_endings");
                $stmt1->execute();
                $stmt2 = $db->prepare("DROP TABLE IF EXISTS am_game_progress");
                $stmt2->execute();
                
                $installationStatus[] = ['warning', 'Tablas eliminadas. Ejecuta la instalación nuevamente.'];
                
            } catch (PDOException $e) {
                $installationStatus[] = ['error', 'Error: ' . $e->getMessage()];
                $hasErrors = true;
            }
        }
        
        // Mostrar estado
        if (!empty($installationStatus)) {
            foreach ($installationStatus as $status) {
                echo '<div class="status ' . $status[0] . '">' . htmlspecialchars($status[1]) . '</div>';
            }
        } else {
            echo '<div class="status warning">';
            echo '<h3>Bienvenido a la instalación de AM Game</h3>';
            echo '<p>Este instalador creará las tablas necesarias en la base de datos.</p>';
            echo '<ul>';
            echo '<li>am_game_progress - Almacena el progreso de cada jugador</li>';
            echo '<li>am_endings - Registra los finales alcanzados</li>';
            echo '</ul>';
            echo '<p style="margin-top: 20px;">Haz clic en "Instalar" para comenzar.</p>';
            echo '</div>';
        }
        ?>
        
        <div class="actions">
            <?php if (!isset($_GET['install']) || $hasErrors): ?>
                <a href="?install=1" class="btn">Instalar Base de Datos</a>
            <?php endif; ?>
            
            <?php if (isset($_GET['install']) && !$hasErrors): ?>
                <a href="../index.php" class="btn">Ir al Juego</a>
            <?php endif; ?>
            
            <a href="?reset=1" class="btn btn-danger" 
               onclick="return confirm('¿Estás seguro? Esto eliminará TODO el progreso del juego.')">
               Resetear Todo
            </a>
            
            <a href="../dashboard.php" class="btn">Volver al Dashboard</a>
        </div>
        
        <div class="status warning" style="margin-top: 40px;">
            <h4>Configuración Adicional (Opcional)</h4>
            <p>Para habilitar el email del Final Verdadero, edita el archivo:</p>
            <pre>terror/api/trigger_ending.php</pre>
            <p>Y configura tu SMTP:</p>
            <pre>$mail->Host = 'smtp.gmail.com';
$mail->Username = 'tu-email@gmail.com';
$mail->Password = 'tu-app-password';</pre>
        </div>
    </div>
</body>
</html>

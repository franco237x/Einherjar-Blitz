<?php
require_once '../includes/Database.php';

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    header('Location: ../index.php');
    exit();
}
$userData = $auth->getUserData();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Einherjar Cards - Menú Principal</title>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <link rel="stylesheet" href="assets/css/menu.css">
</head>
<body>
    <div class="menu-container">
        <!-- Header con info del jugador -->
        <header class="menu-header">
            <div class="logo-section">
                <h1 class="game-title">
                    <i class="fas fa-layer-group"></i> Einherjar Cards
                </h1>
                <p class="game-subtitle">El Juego de Cartas Definitivo</p>
            </div>
            <div class="player-welcome">
                <span class="welcome-text">Bienvenido,</span>
                <span class="player-name"><?php echo htmlspecialchars($userData['username']); ?></span>
            </div>
        </header>

        <!-- Menú principal -->
        <main class="menu-main">
            <div class="menu-options">
                <!-- Opción 1: Jugar contra IA -->
                <a href="game.php" class="menu-option option-ai">
                    <div class="option-icon">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="option-content">
                        <h2 class="option-title">Jugar contra IA</h2>
                        <p class="option-description">Enfrenta a una inteligencia artificial y pon a prueba tus habilidades</p>
                    </div>
                    <div class="option-arrow">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </a>

                <!-- Opción 2: Jugar Online (bloqueado) -->
                <div class="menu-option option-online option-locked">
                    <div class="option-icon">
                        <i class="fas fa-globe"></i>
                    </div>
                    <div class="option-content">
                        <h2 class="option-title">Jugar Online</h2>
                        <p class="option-description">Desafía a otros jugadores en tiempo real</p>
                        <span class="locked-badge">
                            <i class="fas fa-lock"></i> Próximamente
                        </span>
                    </div>
                </div>

                <!-- Opción 3: Ver todas las cartas -->
                <a href="collection.php" class="menu-option option-collection">
                    <div class="option-icon">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="option-content">
                        <h2 class="option-title">Colección de Cartas</h2>
                        <p class="option-description">Explora todas las cartas disponibles y sus habilidades</p>
                    </div>
                    <div class="option-arrow">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </a>

                <!-- Opción 4: Volver al dashboard -->
                <a href="../dashboard.php" class="menu-option option-back">
                    <div class="option-icon">
                        <i class="fas fa-home"></i>
                    </div>
                    <div class="option-content">
                        <h2 class="option-title">Volver al Dashboard</h2>
                        <p class="option-description">Regresa al menú principal de Einherjar Blitz</p>
                    </div>
                    <div class="option-arrow">
                        <i class="fas fa-arrow-left"></i>
                    </div>
                </a>
            </div>
        </main>

        <!-- Footer -->
        <footer class="menu-footer">
            <p>
                <i class="fas fa-gamepad"></i> Einherjar Cards • Versión 1.0 (Beta) • 2025
            </p>
        </footer>
    </div>

    <script src="assets/js/menu.js"></script>
</body>
</html>

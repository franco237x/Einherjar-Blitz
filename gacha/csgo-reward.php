<?php
require_once '../includes/Database.php';
require_once '../includes/version_helper.php';

$auth = new AuthController();

// Verificar autenticación
if (!$auth->isAuthenticated()) {
    header('Location: ../index.php');
    exit();
}

$userData = $auth->getUserData();
$userKeys = $userData ? $userData['llaves'] : 0;
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="theme-color" content="#0a0a12">
    <title>Abriendo Cofre - Einherjar Blitz</title>

    <!-- Google Fonts -->
    <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
        rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- CS:GO Reward Styles -->
    <link rel="stylesheet" href="assets/css/csgo-reward.css<?php echo v('gacha/assets/css/csgo-reward.css'); ?>">

    <!-- Mobile-specific styles -->
    <style>
        /* Prevent pull-to-refresh on mobile */
        html,
        body {
            overscroll-behavior: none;
            -webkit-overflow-scrolling: touch;
        }

        /* Safe area for notched phones */
        .csgo-container {
            padding-top: max(1rem, env(safe-area-inset-top));
            padding-bottom: max(1rem, env(safe-area-inset-bottom));
            padding-left: max(0.5rem, env(safe-area-inset-left));
            padding-right: max(0.5rem, env(safe-area-inset-right));
        }

        /* Prevent text selection on mobile */
        .roulette-container,
        .winner-panel {
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
        }

        /* Better touch targets */
        .btn-csgo {
            min-height: 48px;
            -webkit-tap-highlight-color: transparent;
        }
    </style>
</head>

<body class="csgo-reward-body">
    <!-- Fondo con partículas -->
    <div class="csgo-background">
        <div class="bg-particles"></div>
    </div>

    <!-- Contenedor principal -->
    <div class="csgo-container">
        <!-- Header compacto para móvil -->
        <header class="csgo-header">
            <a href="index.php" class="back-btn" id="backBtn">
                <i class="fas fa-arrow-left"></i>
            </a>

            <h1 class="header-title">
                <i class="fas fa-gift"></i>
                <span class="title-text">Abriendo...</span>
            </h1>

            <div class="key-display">
                <i class="fas fa-key"></i>
                <span id="keyCount"><?php echo $userKeys; ?></span>
            </div>
        </header>

        <!-- Área de la ruleta -->
        <section class="roulette-section">
            <!-- Contenedor de la ruleta -->
            <div class="roulette-container" id="rouletteContainer">
                <!-- Viewport de la ruleta -->
                <div class="roulette-viewport" id="rouletteViewport">
                    <!-- Gradientes de fade -->
                    <div class="roulette-fade-left"></div>
                    <div class="roulette-fade-right"></div>

                    <!-- Indicador central -->
                    <div class="roulette-indicator"></div>

                    <!-- Strip de items (se genera dinámicamente) -->
                    <div class="roulette-strip" id="rouletteStrip"></div>
                </div>
            </div>

            <!-- Hint para móvil -->
            <div class="mobile-hint" id="mobileHint">
                <i class="fas fa-hand-pointer"></i>
                <span>Toca para continuar</span>
            </div>
        </section>
    </div>

    <!-- Panel de ganador -->
    <div class="winner-panel" id="winnerPanel">
        <!-- Canvas para confetti -->
        <canvas id="confettiCanvas" class="confetti-canvas"></canvas>

        <div class="winner-content">
            <!-- Imagen del premio -->
            <div class="winner-image-container">
                <div class="winner-glow" id="winnerGlow"></div>
                <img id="winnerImage" class="winner-image" src="" alt="Recompensa">
            </div>

            <!-- Estrellas de rareza -->
            <div class="winner-stars" id="winnerStars"></div>

            <!-- Información -->
            <div class="winner-type" id="winnerType">Recompensa</div>
            <h2 class="winner-name" id="winnerName">Cargando...</h2>
            <div class="winner-rarity-label" id="winnerRarity">Raro</div>

            <!-- Botones de acción -->
            <div class="winner-actions">
                <button class="btn-csgo btn-csgo-secondary" id="btnOpenAnother">
                    <i class="fas fa-redo"></i>
                    <span>Abrir Otro</span>
                </button>
                <button class="btn-csgo btn-csgo-primary" id="btnContinue">
                    <i class="fas fa-check"></i>
                    <span>Continuar</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Pantalla de carga -->
    <div class="loading-screen" id="loadingScreen">
        <div class="loading-spinner"></div>
        <div class="loading-text">Preparando cofre...</div>
    </div>

    <!-- GSAP for smooth animations -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

    <!-- Canvas Confetti for particle effects -->
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"></script>

    <!-- Howler.js for reliable mobile audio -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js"></script>

    <!-- Reward Images Config -->
    <script src="assets/js/reward-images.js<?php echo v('gacha/assets/js/reward-images.js'); ?>"></script>

    <!-- CS:GO Reward System -->
    <script src="assets/js/csgo-reward.js<?php echo v('gacha/assets/js/csgo-reward.js'); ?>"></script>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const chestType = urlParams.get('chest');
            const rewardData = urlParams.get('reward');

            if (chestType && rewardData) {
                try {
                    const reward = JSON.parse(decodeURIComponent(rewardData));
                    console.log('Reward data:', reward);
                    console.log('Chest type:', chestType);

                    // Inicializar sistema de ruleta CS:GO
                    const csgoSystem = new CSGORewardSystem(reward, chestType);
                    csgoSystem.start();

                } catch (e) {
                    console.error('Error parsing reward data:', e);
                    window.location.href = 'index.php';
                }
            } else {
                console.error('Missing chest or reward data');
                window.location.href = 'index.php';
            }
        });
    </script>
</body>

</html>
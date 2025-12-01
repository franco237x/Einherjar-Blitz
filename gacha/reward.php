<?php
require_once '../includes/version_helper.php';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resultado del Cofre - Einherjar Blitz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/gacha.css<?php echo v('gacha/assets/css/gacha.css'); ?>">
    <link rel="stylesheet" href="assets/css/reward-animation.css<?php echo v('gacha/assets/css/reward-animation.css'); ?>">
    <link rel="stylesheet" href="assets/css/reward-video-effects.css<?php echo v('gacha/assets/css/reward-video-effects.css'); ?>">
</head>
<body class="bg-dark overflow-hidden">
    <!-- Sistema de animación con videos -->
    <div id="videoAnimationSystem" class="video-animation-system">
        <!-- Video de meteoro/estrella fugaz -->
        <div id="meteorVideo" class="meteor-video-container hidden">
            <video id="meteorVideoElement" class="meteor-video" muted playsinline>
                <source type="video/mp4">
                Tu navegador no soporta videos HTML5.
            </video>
            <button id="skipMeteor" class="skip-button hidden">
                <i class="fas fa-forward"></i> Saltar
            </button>
        </div>
        
        <!-- Efectos de luz ambiente -->
        <div id="lightEffects" class="light-effects hidden">
            <div class="light-orb orb-1"></div>
            <div class="light-orb orb-2"></div>
            <div class="light-orb orb-3"></div>
            <div class="light-orb orb-4"></div>
            <div class="light-orb orb-5"></div>
        </div>
        
        <!-- Contenedor principal de revelación -->
        <div id="splashReveal" class="splash-reveal hidden">
            <!-- Fondo de splash art dinámico -->
            <div class="splash-background"></div>
            
            <!-- Efectos de partículas -->
            <div class="particle-system">
                <canvas id="particleCanvas" class="particle-canvas"></canvas>
            </div>
            
            <!-- Información del item -->
            <div class="item-revelation">
                <!-- Imagen de la recompensa -->
                <div class="reward-image-container">
                    <div class="reward-image-bg"></div>
                    <img id="rewardImage" class="reward-image" src="" alt="Recompensa" style="opacity: 0;">
                    <div class="image-overlay"></div>
                </div>
                
                <div class="item-info">
                    <div class="rarity-glow"></div>
                    <div class="item-icon-container">
                        <div class="item-stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="item-icon">
                            <i id="itemIcon" class="fas fa-gift"></i>
                        </div>
                    </div>
                    <div class="item-details">
                        <div id="itemType" class="item-type"></div>
                        <div id="itemName" class="item-name"></div>
                        <div id="itemValue" class="item-value"></div>
                    </div>
                </div>
                
                <!-- Botones de acción -->
                <div class="action-buttons">
                    <button id="claimButton" class="claim-btn">
                        <i class="fas fa-check"></i>
                        <span>Reclamar</span>
                    </button>
                    <button id="againButton" class="again-btn">
                        <i class="fas fa-redo"></i>
                        <span>Otra vez</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Overlay de carga inicial -->
    <div id="initialLoader" class="initial-loader">
        <div class="loader-content">
            <div class="loading-icon">
                <i class="fas fa-treasure-chest"></i>
            </div>
            <div class="loading-text">Preparando recompensa...</div>
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/reward-animation.js<?php echo v('gacha/assets/js/reward-animation.js'); ?>"></script>
    <script src="assets/js/reward-images.js<?php echo v('gacha/assets/js/reward-images.js'); ?>"></script>
    <script src="assets/js/reward-video-system.js<?php echo v('gacha/assets/js/reward-video-system.js'); ?>"></script>
    
    <script>
        // Sistema de animación con videos
        let videoRewardSystem;
        
        // Obtener datos de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const chestType = urlParams.get('chest');
        const rewardData = urlParams.get('reward');
        
        // Inicializar sistema al cargar la página
        document.addEventListener('DOMContentLoaded', function() {
            // Inicializar el sistema de animaciones con videos
            videoRewardSystem = new VideoRewardSystem();
            
            if (chestType && rewardData) {
                try {
                    const reward = JSON.parse(decodeURIComponent(rewardData));
                    
                    // Mostrar loader inicial
                    setTimeout(() => {
                        startVideoReveal(reward);
                    }, 1000);
                    
                } catch (e) {
                    console.error('Error parsing reward data:', e);
                    goBack();
                }
            } else {
                // Si no hay datos, volver al gacha principal
                goBack();
            }
        });
        
        function startVideoReveal(reward) {
            // Ocultar loader inicial
            document.getElementById('initialLoader').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('initialLoader').style.display = 'none';
                
                // Iniciar secuencia de animación con videos
                videoRewardSystem.startRevealSequence(reward);
            }, 500);
        }
        
        function goBack() {
            window.location.href = 'index.php';
        }
        
        // Funciones para los botones
        document.addEventListener('click', function(e) {
            if (e.target.closest('#claimButton')) {
                videoRewardSystem.claimReward();
                setTimeout(() => {
                    goBack();
                }, 1000);
            }
            
            if (e.target.closest('#againButton')) {
                goBack();
            }
            
            if (e.target.closest('#skipMeteor')) {
                videoRewardSystem.skipMeteor();
            }
        });
        
        // Detectar teclas para saltar
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                videoRewardSystem.skipMeteor();
            }
        });
    </script>
</body>
</html>

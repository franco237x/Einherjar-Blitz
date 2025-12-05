<?php
require_once '../includes/version_helper.php';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Recompensa - Einherjar Blitz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/genshin-reward.css<?php echo v('gacha/assets/css/genshin-reward.css'); ?>">
</head>
<body>
    <!-- Fondo con gradiente y partículas -->
    <div class="reward-background">
        <div class="bg-gradient"></div>
        <div class="bg-particles" id="particles"></div>
        <div class="bg-rays" id="rays"></div>
    </div>

    <!-- Fase 0: Video de Meteoro -->
    <div class="meteor-phase" id="meteorPhase">
        <video id="meteorVideo" class="meteor-video" muted playsinline>
            <source src="" type="video/mp4">
        </video>
        <button class="skip-btn" id="skipMeteor">
            <i class="fas fa-forward"></i> Saltar
        </button>
    </div>

    <!-- Fase 1: Silueta/Sombra del objeto -->
    <div class="silhouette-phase" id="silhouettePhase">
        <div class="silhouette-container">
            <!-- Aura pulsante detrás -->
            <div class="silhouette-aura"></div>
            
            <!-- La silueta negra del objeto -->
            <div class="silhouette-wrapper">
                <img id="silhouetteImg" class="silhouette-image" src="" alt="">
            </div>
            
            <!-- Texto de anticipación -->
            <div class="anticipation-text">
                <span class="dot">.</span>
                <span class="dot">.</span>
                <span class="dot">.</span>
            </div>
        </div>
        
        <!-- Hint para saltar -->
        <div class="skip-hint">Toca para revelar</div>
    </div>

    <!-- Fase 2: Flash de revelación -->
    <div class="flash-phase" id="flashPhase"></div>

    <!-- Fase 3: Revelación completa -->
    <div class="reveal-phase" id="revealPhase">
        <!-- Rayos de luz desde el centro -->
        <div class="light-burst" id="lightBurst"></div>
        
        <!-- Contenedor principal del item -->
        <div class="reward-showcase">
            <!-- Fondo con color de rareza -->
            <div class="rarity-background" id="rarityBg"></div>
            
            <!-- Imagen del reward con brillo -->
            <div class="reward-image-wrapper">
                <div class="reward-glow" id="rewardGlow"></div>
                <img id="rewardImage" class="reward-image" src="" alt="">
            </div>
            
            <!-- Estrellas de rareza -->
            <div class="rarity-stars" id="rarityStars"></div>
            
            <!-- Información del item -->
            <div class="reward-info">
                <div class="reward-type" id="rewardType"></div>
                <div class="reward-name" id="rewardName"></div>
                <div class="reward-quantity" id="rewardQuantity"></div>
            </div>
        </div>
        
        <!-- Botones de acción -->
        <div class="action-buttons" id="actionButtons">
            <button class="btn-claim" id="btnClaim">
                <i class="fas fa-check"></i>
                <span>Continuar</span>
            </button>
        </div>
    </div>

    <!-- Indicador de carga -->
    <div class="loading-screen" id="loadingScreen">
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-text">Abriendo cofre...</div>
        </div>
    </div>

    <script src="assets/js/genshin-reward.js<?php echo v('gacha/assets/js/genshin-reward.js'); ?>"></script>
    <script src="assets/js/reward-images.js<?php echo v('gacha/assets/js/reward-images.js'); ?>"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const chestType = urlParams.get('chest');
            const rewardData = urlParams.get('reward');
            
            if (chestType && rewardData) {
                try {
                    const reward = JSON.parse(decodeURIComponent(rewardData));
                    const rewardSystem = new GenshinRewardSystem(reward);
                    rewardSystem.start();
                } catch (e) {
                    console.error('Error:', e);
                    window.location.href = 'index.php';
                }
            } else {
                window.location.href = 'index.php';
            }
        });
    </script>
</body>
</html>

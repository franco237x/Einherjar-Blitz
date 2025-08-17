<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resultado del Cofre - Einherjar Blitz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/gacha.css">
    <link rel="stylesheet" href="assets/css/reward-animation.css">
</head>
<body class="bg-dark">
    <!-- Overlay de animación -->
    <div id="rewardOverlay" class="reward-overlay">
        <div class="reward-container">
            <!-- Animación de apertura -->
            <div id="openingAnimation" class="opening-animation">
                <div class="chest-opening">
                    <i class="fas fa-treasure-chest chest-icon"></i>
                    <div class="light-rays"></div>
                    <div class="sparkles"></div>
                </div>
                <h3 class="text-white mb-0">Abriendo cofre...</h3>
            </div>
            
            <!-- Resultado -->
            <div id="rewardResult" class="reward-result d-none">
                <div class="reward-card">
                    <div class="reward-bg">
                        <div class="reward-rarity-glow"></div>
                        <div class="reward-icon-container">
                            <i id="rewardIcon" class="reward-icon"></i>
                        </div>
                        <div class="reward-info">
                            <h2 id="rewardName" class="reward-name"></h2>
                            <p id="rewardType" class="reward-type"></p>
                            <div id="rewardValue" class="reward-value"></div>
                            <div id="rewardRarity" class="reward-rarity"></div>
                        </div>
                    </div>
                </div>
                
                <div class="reward-actions mt-4">
                    <button onclick="claimReward()" class="btn btn-lg btn-success me-3">
                        <i class="fas fa-check me-2"></i>Reclamar
                    </button>
                    <button onclick="goBack()" class="btn btn-lg btn-outline-light">
                        <i class="fas fa-arrow-left me-2"></i>Volver
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/reward-animation.js"></script>
    
    <script>
        // Obtener datos de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const chestType = urlParams.get('chest');
        const rewardData = urlParams.get('reward');
        
        if (chestType && rewardData) {
            try {
                const reward = JSON.parse(decodeURIComponent(rewardData));
                setTimeout(() => {
                    showReward(reward);
                }, 2000); // Mostrar después de 2 segundos de animación
            } catch (e) {
                console.error('Error parsing reward data:', e);
                goBack();
            }
        } else {
            // Si no hay datos, volver al gacha principal
            goBack();
        }
        
        function showReward(reward) {
            const openingAnimation = document.getElementById('openingAnimation');
            const rewardResult = document.getElementById('rewardResult');
            
            // Ocultar animación de apertura
            openingAnimation.style.opacity = '0';
            setTimeout(() => {
                openingAnimation.classList.add('d-none');
                
                // Configurar resultado
                setupRewardDisplay(reward);
                
                // Mostrar resultado
                rewardResult.classList.remove('d-none');
                setTimeout(() => {
                    rewardResult.style.opacity = '1';
                }, 100);
            }, 500);
        }
        
        function setupRewardDisplay(reward) {
            const rewardIcon = document.getElementById('rewardIcon');
            const rewardName = document.getElementById('rewardName');
            const rewardType = document.getElementById('rewardType');
            const rewardValue = document.getElementById('rewardValue');
            const rewardRarity = document.getElementById('rewardRarity');
            const rewardCard = document.querySelector('.reward-card');
            
            // Configurar icono basado en tipo
            const iconMap = {
                'currency': 'fas fa-coins',
                'item': 'fas fa-gem',
                'card': 'fas fa-id-card',
                'special': 'fas fa-star',
                'ammo': 'fas fa-bullet',
                'weapon': 'fas fa-sword',
                'armor': 'fas fa-shield-alt',
                'relic': 'fas fa-crown',
                'blessing': 'fas fa-hands-praying',
                'resource': 'fas fa-mountain',
                'crystal': 'fas fa-diamond',
                'gem': 'fas fa-gem',
                'diamond': 'fas fa-diamond',
                'terrain': 'fas fa-map'
            };
            
            rewardIcon.className = iconMap[reward.type] || 'fas fa-gift';
            rewardName.textContent = reward.name;
            rewardType.textContent = getTypeDisplayName(reward.type);
            rewardValue.textContent = `Cantidad: ${reward.value}`;
            rewardRarity.textContent = getRarityDisplayName(reward.rarity);
            
            // Aplicar clase de rareza
            rewardCard.className = `reward-card rarity-${reward.rarity}`;
        }
        
        function getTypeDisplayName(type) {
            const typeNames = {
                'currency': 'Moneda',
                'item': 'Objeto',
                'card': 'Carta',
                'special': 'Especial',
                'ammo': 'Munición',
                'weapon': 'Arma',
                'armor': 'Armadura',
                'relic': 'Reliquia',
                'blessing': 'Bendición',
                'resource': 'Recurso',
                'crystal': 'Cristal',
                'gem': 'Gema',
                'diamond': 'Diamante',
                'terrain': 'Terreno'
            };
            return typeNames[type] || 'Desconocido';
        }
        
        function getRarityDisplayName(rarity) {
            const rarityNames = {
                'common': 'Común',
                'rare': 'Raro',
                'epic': 'Épico',
                'legendary': 'Legendario',
                'mythical': 'Mítico'
            };
            return rarityNames[rarity] || 'Desconocido';
        }
        
        function claimReward() {
            // Animación de reclamado
            const rewardResult = document.getElementById('rewardResult');
            rewardResult.style.transform = 'scale(0.8)';
            rewardResult.style.opacity = '0';
            
            setTimeout(() => {
                goBack();
            }, 500);
        }
        
        function goBack() {
            window.location.href = 'index.php';
        }
    </script>
</body>
</html>

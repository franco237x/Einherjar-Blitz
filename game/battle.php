<?php
require_once '../includes/version_helper.php';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Einherjar Blitz">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#0a0a0a">
    <meta name="msapplication-navbutton-color" content="#0a0a0a">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="description" content="Einherjar Blitz - Juego de batallas épicas optimizado para móviles">
    <meta name="format-detection" content="telephone=no">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="../manifest.json">
    
    <!-- Apple Touch Icons -->
    <link rel="apple-touch-icon" sizes="152x152" href="../images/icon-152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="../images/icon-180.png">
    <link rel="apple-touch-icon" sizes="167x167" href="../images/icon-167.png">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="../images/icon-32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="../images/icon-16.png">
    
    <title>Einherjar Blitz - Batalla</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/battle-mobile.css<?php echo v('assets/css/battle-mobile.css'); ?>">
</head>
<body>
    <!-- Background dinámico -->
    <div class="battle-background">
        <div class="particles"></div>
        <div class="energy-waves"></div>
    </div>

    <!-- Container principal del juego -->
    <div class="game-container">
        <!-- Header de batalla -->
        <header class="battle-header">
            <div class="battle-info">
                <div class="round-counter">
                    <span class="round-label">Ronda</span>
                    <span class="round-number" id="roundNumber">1</span>
                </div>
                <div class="turn-indicator">
                    <span class="turn-label">Turno de:</span>
                    <span class="turn-player" id="currentTurn">Jugador</span>
                </div>
                <div class="battle-timer">
                    <i class="fas fa-clock"></i>
                    <span id="battleTimer">00:00</span>
                </div>
            </div>
            <button class="settings-btn" id="settingsBtn">
                <i class="fas fa-cog"></i>
            </button>
        </header>

        <!-- Arena de batalla -->
        <main class="battle-arena">
            <!-- Personaje del jugador -->
            <section class="player-section" id="playerSection">
                <div class="character-container player-character">
                    <div class="character-info">
                        <div class="character-image-wrapper">
                            <img src="" alt="Personaje del jugador" id="playerImage" class="character-image">
                            <div class="character-status" id="playerStatus"></div>
                            <div class="damage-indicator" id="playerDamage"></div>
                            <div class="element-glow" id="playerElementGlow"></div>
                        </div>
                        
                        <div class="character-details">
                            <div class="character-header">
                                <h2 class="character-name" id="playerName">Cargando...</h2>
                                <div class="character-title" id="playerTitle"></div>
                                <div class="rarity-badge" id="playerRarity"></div>
                            </div>
                            
                            <div class="stats-panel">
                                <!-- Barra de vida -->
                                <div class="stat-bar health-bar">
                                    <div class="stat-label">
                                        <div>
                                            <i class="fas fa-heart"></i>
                                            <span>Vida</span>
                                        </div>
                                        <span class="stat-values" id="playerHealthText">1000/1000</span>
                                    </div>
                                    <div class="bar-container">
                                        <div class="bar-fill health-fill" id="playerHealthBar"></div>
                                        <div class="bar-shine"></div>
                                    </div>
                                </div>
                                
                                <!-- Barra de energía -->
                                <div class="stat-bar energy-bar">
                                    <div class="stat-label">
                                        <div>
                                            <i class="fas fa-bolt"></i>
                                            <span>Energía</span>
                                        </div>
                                        <span class="stat-values" id="playerEnergyText">100/100</span>
                                    </div>
                                    <div class="bar-container">
                                        <div class="bar-fill energy-fill" id="playerEnergyBar"></div>
                                        <div class="bar-shine"></div>
                                    </div>
                                </div>
                                
                                <!-- Estadísticas adicionales -->
                                <div class="additional-stats">
                                    <div class="stat-item">
                                        <i class="fas fa-sword"></i>
                                        <span class="stat-name">ATK</span>
                                        <span class="stat-value" id="playerAttack">70-115</span>
                                    </div>
                                    <div class="stat-item">
                                        <i class="fas fa-shield"></i>
                                        <span class="stat-name">DEF</span>
                                        <span class="stat-value" id="playerDefense">17</span>
                                    </div>
                                    <div class="stat-item">
                                        <i class="fas fa-magic"></i>
                                        <span class="stat-name">RES</span>
                                        <span class="stat-value" id="playerResistance">50%</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Efectos de estado -->
                            <div class="status-effects" id="playerStatusEffects"></div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Zona central de batalla -->
            <section class="battle-center">
                <!-- Área de mensajes de batalla -->
                <div class="battle-log">
                    <div class="log-container" id="battleLogContainer">
                        <div class="log-entry system-message">
                            <i class="fas fa-info-circle"></i>
                            ¡La batalla está a punto de comenzar!
                        </div>
                    </div>
                </div>
            </section>

            <!-- Enemigo -->
            <section class="enemy-section" id="enemySection">
                <div class="character-container enemy-character">
                    <div class="character-info">
                        <div class="character-image-wrapper">
                            <img src="" alt="Enemigo" id="enemyImage" class="character-image">
                            <div class="character-status" id="enemyStatus"></div>
                            <div class="damage-indicator" id="enemyDamage"></div>
                            <div class="element-glow" id="enemyElementGlow"></div>
                        </div>
                        
                        <div class="character-details">
                            <div class="character-header">
                                <h2 class="character-name" id="enemyName">Oponente</h2>
                                <div class="character-title" id="enemyTitle"></div>
                                <div class="rarity-badge" id="enemyRarity"></div>
                            </div>
                            
                            <div class="stats-panel">
                                <!-- Barra de vida -->
                                <div class="stat-bar health-bar">
                                    <div class="stat-label">
                                        <div>
                                            <i class="fas fa-heart"></i>
                                            <span>Vida</span>
                                        </div>
                                        <span class="stat-values" id="enemyHealthText">1000/1000</span>
                                    </div>
                                    <div class="bar-container">
                                        <div class="bar-fill health-fill" id="enemyHealthBar"></div>
                                        <div class="bar-shine"></div>
                                    </div>
                                </div>
                                
                                <!-- Barra de energía -->
                                <div class="stat-bar energy-bar">
                                    <div class="stat-label">
                                        <div>
                                            <i class="fas fa-bolt"></i>
                                            <span>Energía</span>
                                        </div>
                                        <span class="stat-values" id="enemyEnergyText">100/100</span>
                                    </div>
                                    <div class="bar-container">
                                        <div class="bar-fill energy-fill" id="enemyEnergyBar"></div>
                                        <div class="bar-shine"></div>
                                    </div>
                                </div>
                                
                                <!-- Estadísticas adicionales -->
                                <div class="additional-stats">
                                    <div class="stat-item">
                                        <i class="fas fa-sword"></i>
                                        <span class="stat-name">ATK</span>
                                        <span class="stat-value" id="enemyAttack">70-115</span>
                                    </div>
                                    <div class="stat-item">
                                        <i class="fas fa-shield"></i>
                                        <span class="stat-name">DEF</span>
                                        <span class="stat-value" id="enemyDefense">17</span>
                                    </div>
                                    <div class="stat-item">
                                        <i class="fas fa-magic"></i>
                                        <span class="stat-name">RES</span>
                                        <span class="stat-value" id="enemyResistance">50%</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Efectos de estado -->
                            <div class="status-effects" id="enemyStatusEffects"></div>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        <!-- Panel de acciones del jugador -->
        <footer class="action-panel" id="actionPanel">
            <div class="actions-container">
                <!-- Botón de ataque básico -->
                <button class="action-btn primary-action" id="attackBtn" data-action="attack">
                    <div class="btn-icon">
                        <i class="fas fa-sword"></i>
                    </div>
                    <div class="btn-content">
                        <span class="btn-title">Atacar</span>
                        <span class="btn-subtitle">Ataque básico</span>
                    </div>
                    <div class="btn-cost">
                        <span class="cost-value">0</span>
                        <i class="fas fa-bolt"></i>
                    </div>
                </button>

                <!-- Botón de defensa -->
                <button class="action-btn secondary-action" id="defendBtn" data-action="defend">
                    <div class="btn-icon">
                        <i class="fas fa-shield"></i>
                    </div>
                    <div class="btn-content">
                        <span class="btn-title">Defender</span>
                        <span class="btn-subtitle">Reduce daño</span>
                    </div>
                    <div class="btn-cost">
                        <span class="cost-value">0</span>
                        <i class="fas fa-bolt"></i>
                    </div>
                </button>

                <!-- Botón de habilidad especial -->
                <button class="action-btn special-action" id="specialBtn" data-action="special">
                    <div class="btn-icon">
                        <i class="fas fa-magic"></i>
                    </div>
                    <div class="btn-content">
                        <span class="btn-title">Habilidad</span>
                        <span class="btn-subtitle" id="specialName">Cargando...</span>
                    </div>
                    <div class="btn-cost">
                        <span class="cost-value" id="specialCost">30</span>
                        <i class="fas fa-bolt"></i>
                    </div>
                </button>

                <!-- Botón de objeto/curación -->
                <button class="action-btn utility-action" id="healBtn" data-action="heal">
                    <div class="btn-icon">
                        <i class="fas fa-heart"></i>
                    </div>
                    <div class="btn-content">
                        <span class="btn-title">Curar</span>
                        <span class="btn-subtitle">Restaura vida</span>
                    </div>
                    <div class="btn-cost">
                        <span class="cost-value">20</span>
                        <i class="fas fa-bolt"></i>
                    </div>
                </button>
            </div>

            <!-- Botón de rendirse -->
            <button class="surrender-btn" id="surrenderBtn">
                <i class="fas fa-flag"></i>
                <span>Rendirse</span>
            </button>
        </footer>
    </div>

    <!-- Modal de fin de batalla -->
    <div class="modal-overlay" id="battleEndModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="battleResultTitle">¡Victoria!</h2>
                <div class="result-icon" id="resultIcon">
                    <i class="fas fa-trophy"></i>
                </div>
            </div>
            
            <div class="modal-body">
                <!-- Resumen de personajes final -->
                <div class="final-characters-summary" id="finalCharactersSummary">
                    <div class="character-final-status">
                        <div class="character-info">
                            <img id="finalPlayerImage" class="final-character-image" src="" alt="Jugador">
                            <div class="character-details">
                                <h4 id="finalPlayerName">Jugador</h4>
                                <div class="final-health">
                                    <span id="finalPlayerHealth">0</span> / <span id="finalPlayerMaxHealth">0</span> HP
                                </div>
                            </div>
                        </div>
                        <div class="vs-indicator">VS</div>
                        <div class="character-info">
                            <img id="finalEnemyImage" class="final-character-image" src="" alt="Enemigo">
                            <div class="character-details">
                                <h4 id="finalEnemyName">Enemigo</h4>
                                <div class="final-health">
                                    <span id="finalEnemyHealth">0</span> / <span id="finalEnemyMaxHealth">0</span> HP
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Estadísticas detalladas de batalla -->
                <div class="battle-summary">
                    <h3 class="summary-title">Estadísticas de Batalla</h3>
                    
                    <div class="stats-grid">
                        <div class="summary-item">
                            <i class="fas fa-clock"></i>
                            <span class="label">Duración:</span>
                            <span class="value" id="battleDuration">0:00</span>
                        </div>
                        <div class="summary-item">
                            <i class="fas fa-repeat"></i>
                            <span class="label">Rondas:</span>
                            <span class="value" id="totalRounds">1</span>
                        </div>
                        <div class="summary-item">
                            <i class="fas fa-sword"></i>
                            <span class="label">Daño infligido:</span>
                            <span class="value" id="totalDamageDealt">0</span>
                        </div>
                        <div class="summary-item">
                            <i class="fas fa-shield"></i>
                            <span class="label">Daño recibido:</span>
                            <span class="value" id="totalDamageReceived">0</span>
                        </div>
                        <div class="summary-item">
                            <i class="fas fa-star"></i>
                            <span class="label">Golpes críticos:</span>
                            <span class="value" id="criticalHits">0</span>
                        </div>
                        <div class="summary-item">
                            <i class="fas fa-magic"></i>
                            <span class="label">Habilidades usadas:</span>
                            <span class="value" id="specialAbilitiesUsed">0</span>
                        </div>
                    </div>
                </div>

                <!-- Sección de resultado específico -->
                <div class="result-message" id="resultMessage">
                    <p id="resultDescription"></p>
                </div>

                <!-- Recompensas -->
                <div class="rewards-section" id="rewardsSection">
                    <h3>Recompensas</h3>
                    <div class="rewards-list" id="rewardsList">
                        <!-- Las recompensas se añadirán dinámicamente -->
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn-primary" id="continueBtn">Continuar</button>
                <button class="btn-secondary" id="playAgainBtn">Jugar de nuevo</button>
            </div>
        </div>
    </div>

    <!-- Modal de configuración -->
    <div class="modal-overlay" id="settingsModal">
        <div class="modal-content settings-content">
            <div class="modal-header">
                <h2>Configuración</h2>
                <button class="close-btn" id="closeSettings">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="setting-group">
                    <label for="effectsVolume">Efectos de sonido</label>
                    <input type="range" id="effectsVolume" min="0" max="100" value="50">
                </div>
                <div class="setting-group">
                    <label for="musicVolume">Música</label>
                    <input type="range" id="musicVolume" min="0" max="100" value="30">
                </div>
                <div class="setting-group">
                    <label for="animationSpeed">Velocidad de animaciones</label>
                    <select id="animationSpeed">
                        <option value="slow">Lenta</option>
                        <option value="normal" selected>Normal</option>
                        <option value="fast">Rápida</option>
                    </select>
                </div>
                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="showDamageNumbers" checked>
                        Mostrar números de daño
                    </label>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="js/mobile-utils.js<?php echo v('game/js/mobile-utils.js'); ?>"></script>
    <script type="module" src="../characters/index.js<?php echo v('characters/index.js'); ?>"></script>
    <script type="module" src="js/BattleSystem.js<?php echo v('game/js/BattleSystem.js'); ?>"></script>
    <script type="module" src="js/BattleUI.js<?php echo v('game/js/BattleUI.js'); ?>"></script>
    <script type="module" src="js/BattleEffects.js<?php echo v('game/js/BattleEffects.js'); ?>"></script>
    <script type="module" src="js/battle.js<?php echo v('game/js/battle.js'); ?>"></script>
</body>
</html>

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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>Einherjar Cards - Juego de Cartas</title>
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <link rel="stylesheet" href="assets/css/game.css">
</head>
<body>
    <!-- Mensaje de orientación para móviles -->
    <div class="orientation-message" id="orientationMessage">
        <div class="orientation-content">
            <i class="fas fa-mobile-screen-button"></i>
            <h2>Gira tu dispositivo</h2>
            <p>Para una mejor experiencia, juega en modo horizontal</p>
            <i class="fas fa-rotate-right rotation-icon"></i>
        </div>
    </div>

    <div class="game-container">
        <!-- INFO OPONENTE (TOP LEFT) -->
        <div class="opponent-hud">
            <div class="hud-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="hud-info">
                <div class="hud-name">IA Oponente</div>
                <div class="hud-stats">
                    <div class="hud-hp">
                        <i class="fas fa-heart"></i>
                        <span id="opponentHP">30</span>
                    </div>
                    <div class="hud-energy">
                        <i class="fas fa-bolt"></i>
                        <span id="opponentEnergy">3</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- INFO JUGADOR (BOTTOM RIGHT) -->
        <div class="player-hud">
            <div class="hud-info">
                <div class="hud-name"><?php echo htmlspecialchars($userData['username']); ?></div>
                <div class="hud-stats">
                    <div class="hud-hp">
                        <i class="fas fa-heart"></i>
                        <span id="playerHP">30</span>
                    </div>
                    <div class="hud-energy">
                        <i class="fas fa-bolt"></i>
                        <span id="playerEnergy">3</span>/<span id="playerMaxEnergy">10</span>
                    </div>
                </div>
            </div>
            <div class="hud-avatar">
                <i class="fas fa-user"></i>
            </div>
        </div>

        <!-- CONTROLES (TOP RIGHT) -->
        <div class="game-controls">
            <button id="endTurnBtn" class="btn-end-turn">
                <i class="fas fa-forward"></i> Terminar Turno
            </button>
            <a href="index.php" class="btn-exit">
                <i class="fas fa-door-open"></i>
            </a>
        </div>

        <!-- INDICADOR DE TURNO (CENTER TOP) -->
        <div class="turn-indicator" id="turnIndicator">
            <i class="fas fa-hourglass-half"></i> Tu Turno
        </div>

        <!-- CAMPO DE BATALLA YU-GI-OH STYLE -->
        <div class="duel-field">
            <!-- ZONA OPONENTE (TOP) -->
            <div class="field-section opponent-section">
                <!-- Extra Deck / Deck del oponente -->
                <div class="deck-zone opponent-deck">
                    <div class="deck-pile" id="opponentDeckPile">
                        <i class="fas fa-layer-group"></i>
                        <span id="opponentDeckCount">15</span>
                    </div>
                </div>

                <!-- Mano del oponente (cartas boca abajo) -->
                <div class="hand-zone opponent-hand" id="opponentHand">
                    <!-- Cartas boca abajo -->
                </div>

                <!-- Campo de monstruos oponente (3 slots) -->
                <div class="monster-zone opponent-monsters" id="opponentField">
                    <div class="card-slot"></div>
                    <div class="card-slot"></div>
                    <div class="card-slot"></div>
                </div>
            </div>

            <!-- ZONA CENTRAL (BATTLE AREA) -->
            <div class="field-section center-section">
                <div class="battle-area">
                    <div class="battle-effects" id="battleEffects">
                        <!-- Animaciones de batalla -->
                    </div>
                </div>
            </div>

            <!-- ZONA JUGADOR (BOTTOM) -->
            <div class="field-section player-section">
                <!-- Campo de monstruos jugador (3 slots) -->
                <div class="monster-zone player-monsters" id="playerField">
                    <div class="card-slot"></div>
                    <div class="card-slot"></div>
                    <div class="card-slot"></div>
                </div>

                <!-- Mano del jugador (cartas visibles) -->
                <div class="hand-zone player-hand" id="playerHand">
                    <!-- Cartas en mano -->
                </div>

                <!-- Deck del jugador -->
                <div class="deck-zone player-deck">
                    <div class="deck-pile" id="playerDeckPile">
                        <i class="fas fa-layer-group"></i>
                        <span id="playerDeckCount">15</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- GAME LOG (LEFT SIDEBAR) -->
        <div class="game-log-sidebar" id="gameLogSidebar">
            <div class="log-header">
                <i class="fas fa-scroll"></i> Registro de Batalla
            </div>
            <div class="log-content" id="gameLog">
                <p><i class="fas fa-circle-info"></i> ¡Partida iniciada!</p>
            </div>
        </div>

        <!-- Panel de detalles de carta (al hacer hover/click) -->
        <div class="card-detail-panel" id="cardDetailPanel" style="display: none;">
            <h3 id="detailName"></h3>
            <img id="detailImage" src="" alt="">
            <p id="detailType"></p>
            <p id="detailCost"></p>
            <p id="detailStats"></p>
            <p id="detailDescription"></p>
            <button id="closeDetailBtn">Cerrar</button>
        </div>
    </div>

    <script type="module" src="assets/js/game.js"></script>
</body>
</html>

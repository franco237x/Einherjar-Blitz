<?php
session_start();
if (!isset($_SESSION['selected_champion_data'])) {
    header('Location: seleccion.php');
    exit();
}
$champion = $_SESSION['selected_champion_data'];

// Enemigo más desafiante estilo HSR
$enemy = [
    'name' => 'Automaton Grizzly',
    'title' => 'Centinela de las Ruinas',
    'max_health' => 1200,
    'attack_min' => 80,
    'attack_max' => 120,
    'armor' => 50,
    'image' => 'default.jpg'
];
?>
<!DOCTYPE html>
<html lang="es">
<head>    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Batalla Estelar - Einherjar Blitz</title>
    <link rel="stylesheet" href="juego_clean.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⭐</text></svg>">
</head>
<body>    <div id="rotateMessage">
        <div style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📱↻</div>
            <h2>Rotación Requerida</h2>
            <p>Por favor gira tu dispositivo a orientación horizontal para disfrutar de la experiencia de batalla completa.</p>
        </div>    </div>
    <div id="game">
        <!-- Área de batalla con personajes -->
        <div class="battle-area">
            <!-- Campeón -->
            <div class="character-fullbody" id="champion-card">
                <div class="character-overlay">
                    <div class="character-name"><?php echo htmlspecialchars($champion['name']); ?></div>
                    <div class="character-title"><?php echo htmlspecialchars($champion['title']); ?></div>
                </div>
                
                <img src="images/<?php echo htmlspecialchars($champion['image']); ?>" 
                     alt="<?php echo htmlspecialchars($champion['name']); ?>" 
                     class="fullbody-image">
                
                <!-- Stats flotantes -->
                <div class="floating-stats left">
                    <div class="floating-health">
                        <div class="health-bar">
                            <div id="champion-health" style="width:100%"></div>
                        </div>
                        <span class="health-text"><span id="champion-health-text"><?php echo $champion['max_health']; ?></span>/<?php echo $champion['max_health']; ?></span>
                    </div>
                    <div class="floating-stats-details">
                        <span>⚔️ <?php echo $champion['attack_min']; ?>-<?php echo $champion['attack_max']; ?></span>
                        <span>🛡️ <?php echo $champion['armor']; ?></span>
                    </div>
                </div>
            </div>

            <!-- Enemigo -->
            <div class="character-fullbody" id="enemy-card">
                <div class="character-overlay">
                    <div class="character-name"><?php echo htmlspecialchars($enemy['name']); ?></div>
                    <div class="character-title"><?php echo htmlspecialchars($enemy['title']); ?></div>
                </div>
                
                <img src="images/<?php echo htmlspecialchars($enemy['image']); ?>" 
                     alt="<?php echo htmlspecialchars($enemy['name']); ?>" 
                     class="fullbody-image">
                
                <!-- Stats flotantes -->
                <div class="floating-stats right">
                    <div class="floating-health">
                        <div class="health-bar">
                            <div id="enemy-health" style="width:100%"></div>
                        </div>
                        <span class="health-text"><span id="enemy-health-text"><?php echo $enemy['max_health']; ?></span>/<?php echo $enemy['max_health']; ?></span>
                    </div>
                    <div class="floating-stats-details">
                        <span>⚔️ <?php echo $enemy['attack_min']; ?>-<?php echo $enemy['attack_max']; ?></span>
                        <span>🛡️ <?php echo $enemy['armor']; ?></span>
                    </div>
                </div>
            </div>
        </div>
        <div id="battle-controls">            <!-- Sistema de Energía Compacto -->
            <div class="energy-system-compact">
                <div class="energy-label">ENERGÍA</div>
                <div class="energy-bar-container">
                    <div class="energy-bar">
                        <div id="champion-energy" style="width:100%"></div>
                    </div>
                    <span id="energy-text">100/100</span>
                </div>
            </div>

            <!-- Botones de Combate MGG Style -->
            <div class="combat-buttons">
                <button id="basic-attack-btn" class="combat-btn basic-attack">
                    <div class="btn-icon">⚔️</div>
                    <div class="btn-text">
                        <span class="btn-title">ATAQUE BÁSICO</span>
                        <span class="btn-desc">0 Energía</span>
                    </div>
                </button>
                
                <button id="elemental-attack-btn" class="combat-btn elemental-attack">
                    <div class="btn-icon">🔥</div>
                    <div class="btn-text">
                        <span class="btn-title">ATAQUE ELEMENTAL</span>
                        <span class="btn-desc">30 Energía</span>
                    </div>
                </button>
                
                <button id="ultimate-attack-btn" class="combat-btn ultimate-attack">
                    <div class="btn-icon">💀</div>
                    <div class="btn-text">
                        <span class="btn-title">HABILIDAD DEFINITIVA</span>
                        <span class="btn-desc">70 Energía</span>
                    </div>
                </button>
            </div>
              <!-- Battle Log Compacto -->
            <div id="battle-log-compact">
                <div class="log-header">⚔️ REGISTRO DE BATALLA</div>
                <div class="log-content"></div>
            </div>
        </div>
    </div><script>
        // Datos del personaje seleccionado para cargar el módulo correcto
        window.championData = {
            id: <?php echo $champion['id']; ?>,
            name: <?php echo json_encode($champion['name']); ?>,
            title: <?php echo json_encode($champion['title']); ?>,
            description: <?php echo json_encode($champion['description']); ?>,
            image: <?php echo json_encode($champion['image']); ?>,
            rarity: <?php echo json_encode($champion['rarity']); ?>,
            attack_min: <?php echo $champion['attack_min']; ?>,
            attack_max: <?php echo $champion['attack_max']; ?>,
            max_health: <?php echo $champion['max_health']; ?>,
            armor: <?php echo $champion['armor']; ?>,
            defense_reduction: <?php echo $champion['defense_reduction']; ?>,
            elemental_resistance: <?php echo $champion['elemental_resistance']; ?>
        };
        
        // Datos del enemigo (mantiene el formato actual)
        window.enemyData = {
            name: <?php echo json_encode($enemy['name']); ?>,
            title: <?php echo json_encode($enemy['title']); ?>,
            attackMin: <?php echo $enemy['attack_min']; ?>,
            attackMax: <?php echo $enemy['attack_max']; ?>,
            health: <?php echo $enemy['max_health']; ?>,
            maxHealth: <?php echo $enemy['max_health']; ?>,
            armor: <?php echo $enemy['armor']; ?>
        };
    </script>
    
    <!-- Cargar el sistema de juego con módulos ES6 -->
    <script type="module" src="juego_new.js"></script>
</body>
</html>
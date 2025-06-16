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
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Batalla Estelar - Einherjar Blitz (Phaser)</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⭐</text></svg>">    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: #1a1a1a;
            color: white;
            font-family: 'Roboto', sans-serif;
            overflow: hidden;
        }
        
        #game-container {
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        canvas {
            display: block;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: -moz-crisp-edges;
            image-rendering: pixelated;
        }
        
        #loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 1000;
        }
        
        .spinner {
            border: 4px solid #333;
            border-top: 4px solid #ff6b35;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div id="loading">
        <div class="spinner"></div>
        <p>Cargando Einherjar Blitz...</p>
    </div>
    
    <div id="game-container">
        <!-- Phaser canvas se insertará aquí automáticamente -->
    </div>

    <!-- Phaser.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
      <!-- Datos del juego desde PHP -->
    <script>
        // Cargar datos del personaje seleccionado desde la sesión PHP
        window.championData = <?php echo json_encode($champion); ?>;
        window.enemyData = <?php echo json_encode($enemy); ?>;
        
        console.log('🎮 Datos cargados:', {
            champion: window.championData,
            enemy: window.enemyData
        });
    </script>
    
    <!-- Sistema de juego con Phaser -->
    <script type="module" src="js/phaser-game/GameConfig.js"></script>
</body>
</html>

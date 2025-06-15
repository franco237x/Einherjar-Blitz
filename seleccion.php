<?php
require_once 'includes/Database.php';

$auth = new AuthController();

// Verificar autenticación
if (!$auth->isAuthenticated()) {
    header('Location: index.php');
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    header('Location: index.php');
    exit();
}

// Definir los 3 nuevos campeones directamente en el código
$allChampions = [
    [
        'id' => 1,
        'name' => 'Shuna Shieda',
        'title' => 'La Furia de los Shiedas',
        'description' => 'La cúspide de poder de los Shiedas, feroz y letal.',
        'image' => 'shuna.jpg',
        'rarity' => 'legendary',
        'attack_min' => 120,
        'attack_max' => 180,
        'max_health' => 950,
        'armor' => 85,
        'defense_reduction' => 75,
        'elemental_resistance' => 180,
        'price' => 0
    ],
    [
        'id' => 2,
        'name' => 'Ozen Kimura',
        'title' => 'La Muralla Inamovible de los Kimura',
        'description' => 'Con una actitud fría como el acero, Ozen es una guerrera formidable.',
        'image' => 'ozen.jpg',
        'rarity' => 'epic',
        'attack_min' => 200,
        'attack_max' => 280,
        'max_health' => 1200,
        'armor' => 150,
        'defense_reduction' => 120,
        'elemental_resistance' => 90,
        'price' => 0
    ],
    [
        'id' => 3,
        'name' => 'Xair Chikyu',
        'title' => 'El viento gélido de los Chikyu',
        'description' => 'Inventor del Bijon, energía que le otorga un poder devastador.',
        'image' => 'xair.png',
        'rarity' => 'rare',
        'attack_min' => 160,
        'attack_max' => 240,
        'max_health' => 800,
        'armor' => 60,
        'defense_reduction' => 45,
        'elemental_resistance' => 250,
        'price' => 0
    ]
];

// Todos los campeones están disponibles gratuitamente
$unlockedChampionIds = [1, 2, 3];

// Procesar selección de personaje
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['champion_id'])) {
    $championId = (int)$_POST['champion_id'];
    
    // Verificar que el campeón existe y está disponible
    $selectedChampion = null;
    foreach ($allChampions as $champion) {
        if ($champion['id'] == $championId) {
            $selectedChampion = $champion;
            break;
        }
    }    if ($selectedChampion) {
        // Guardar selección en sesión
        $_SESSION['selected_champion'] = $championId;
        $_SESSION['selected_champion_data'] = $selectedChampion;
        
        // Redirigir al juego 
        header('Location: juego.php');
        exit();
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Selección de Campeón - Einherjer Blitz</title>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        :root {
            --primary-gold: #c9aa71;
            --dark-gold: #9e8b54;
            --bg-dark: #0a0a0a;
            --bg-secondary: #1a1a1a;
            --bg-card: #151515;
            --text-primary: rgba(255, 255, 255, 0.95);
            --text-secondary: rgba(255, 255, 255, 0.7);
            --border-gold: rgba(201, 170, 113, 0.3);
            --glow-gold: rgba(201, 170, 113, 0.6);
            
            /* Rarities */
            --common: #9d9d9d;
            --rare: #3498db;
            --epic: #9b59b6;
            --legendary: #f39c12;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-dark);
            color: var(--text-primary);
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* Fondo animado */
        .animated-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: linear-gradient(
                45deg,
                #0a0a0a 0%,
                #1a1a1a 25%,
                #0f0f0f 50%,
                #1a1a1a 75%,
                #0a0a0a 100%
            );
            background-size: 400% 400%;
            animation: gradientShift 20s ease infinite;
        }

        @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        /* Header */
        .champion-header {
            background: linear-gradient(135deg, var(--bg-secondary), #252525);
            border-bottom: 2px solid var(--border-gold);
            padding: 1rem 0;
            position: sticky;
            top: 0;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 2rem;
        }

        .header-title {
            font-family: 'Cinzel', serif;
            font-size: 1.8rem;
            color: var(--primary-gold);
        }

        .back-btn {
            background: rgba(201, 170, 113, 0.1);
            border: 1px solid var(--border-gold);
            color: var(--text-primary);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .back-btn:hover {
            background: rgba(201, 170, 113, 0.2);
            color: var(--text-primary);
        }

        /* Layout principal */
        .champion-select-container {
            display: grid;
            grid-template-columns: 300px 1fr 400px;
            height: calc(100vh - 80px);
            gap: 1rem;
            padding: 1rem;
            max-width: 1600px;
            margin: 0 auto;
        }

        /* Panel izquierdo - Lista de campeones */
        .champions-list {
            background: var(--bg-card);
            border: 1px solid var(--border-gold);
            border-radius: 15px;
            padding: 1rem;
            overflow-y: auto;
        }

        .champions-list h3 {
            font-family: 'Cinzel', serif;
            color: var(--primary-gold);
            margin-bottom: 1rem;
            text-align: center;
        }

        .champion-item {
            display: flex;
            align-items: center;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid transparent;
            position: relative;
        }

        .champion-item:hover {
            background: rgba(201, 170, 113, 0.1);
            border-color: var(--border-gold);
        }

        .champion-item.selected {
            background: rgba(201, 170, 113, 0.2);
            border-color: var(--primary-gold);
            box-shadow: 0 0 15px rgba(201, 170, 113, 0.3);
        }

        .champion-item.locked {
            opacity: 0.5;
            cursor: not-allowed;
            filter: grayscale(100%);
        }

        .champion-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid var(--border-gold);
            margin-right: 0.75rem;
            object-fit: cover;
        }

        .champion-info h5 {
            margin: 0;
            font-size: 0.9rem;
            color: var(--text-primary);
        }

        .champion-info p {
            margin: 0;
            font-size: 0.75rem;
            color: var(--text-secondary);
        }

        .rarity-badge {
            position: absolute;
            top: 5px;
            right: 5px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }

        .rarity-common { background: var(--common); }
        .rarity-rare { background: var(--rare); }
        .rarity-epic { background: var(--epic); }
        .rarity-legendary { background: var(--legendary); }

        .lock-icon {
            position: absolute;
            top: 50%;
            right: 10px;
            transform: translateY(-50%);
            color: var(--text-secondary);
        }

        /* Panel central - Vista previa */
        .champion-preview {
            background: var(--bg-card);
            border: 1px solid var(--border-gold);
            border-radius: 15px;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .champion-preview::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent, rgba(201, 170, 113, 0.05), transparent);
            animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes shimmer {
            0%, 100% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
        }

        .champion-image {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            border: 4px solid var(--primary-gold);
            object-fit: cover;
            margin-bottom: 1.5rem;
            box-shadow: 0 0 30px rgba(201, 170, 113, 0.3);
            transition: all 0.5s ease;
        }

        .champion-image:hover {
            transform: scale(1.05);
            box-shadow: 0 0 50px rgba(201, 170, 113, 0.5);
        }

        .champion-name {
            font-family: 'Cinzel', serif;
            font-size: 2rem;
            color: var(--primary-gold);
            margin-bottom: 0.5rem;
        }

        .champion-title {
            font-size: 1.1rem;
            color: var(--text-secondary);
            margin-bottom: 1rem;
            font-style: italic;
        }

        .champion-description {
            color: var(--text-secondary);
            line-height: 1.6;
            margin-bottom: 2rem;
            max-width: 400px;
        }

        .select-btn {
            background: linear-gradient(45deg, var(--primary-gold), var(--dark-gold));
            border: none;
            color: var(--bg-dark);
            padding: 1rem 2rem;
            font-size: 1.1rem;
            font-weight: 600;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .select-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(201, 170, 113, 0.4);
        }

        .select-btn:disabled {
            background: var(--text-secondary);
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        /* Panel derecho - Estadísticas */
        .champion-stats {
            background: var(--bg-card);
            border: 1px solid var(--border-gold);
            border-radius: 15px;
            padding: 1.5rem;
            overflow-y: auto;
        }

        .stats-title {
            font-family: 'Cinzel', serif;
            color: var(--primary-gold);
            margin-bottom: 1.5rem;
            text-align: center;
        }

        .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
        }

        .stat-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-secondary);
        }

        .stat-value {
            font-weight: 600;
            color: var(--text-primary);
        }

        .stat-bar {
            width: 100%;
            height: 6px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 3px;
            overflow: hidden;
            margin-top: 0.5rem;
        }

        .stat-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary-gold), var(--dark-gold));
            border-radius: 3px;
            transition: width 0.8s ease;
        }

        .price-info {
            background: rgba(201, 170, 113, 0.1);
            border: 1px solid var(--border-gold);
            border-radius: 8px;
            padding: 1rem;
            margin-top: 1rem;
            text-align: center;
        }

        .price-value {
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--primary-gold);
        }

        .user-balance {
            font-size: 0.9rem;
            color: var(--text-secondary);
            margin-top: 0.5rem;
        }

        /* Notificaciones de éxito/error */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 9999;
            min-width: 300px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            backdrop-filter: blur(10px);
        }

        .notification.show {
            transform: translateX(0);
        }

        .notification.success {
            background: rgba(46, 204, 113, 0.9);
            border-left: 4px solid #2ecc71;
            color: white;
        }

        .notification.error {
            background: rgba(231, 76, 60, 0.9);
            border-left: 4px solid #e74c3c;
            color: white;
        }

        .notification .notification-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .notification .close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            margin-left: auto;
        }

        /* Efectos de partículas para compras exitosas */
        .celebration-particles {
            position: fixed;
            top: 50%;
            left: 50%;
            width: 100px;
            height: 100px;
            pointer-events: none;
            z-index: 10000;
        }

        .particle {
            position: absolute;
            width: 6px;
            height: 6px;
            background: var(--primary-gold);
            border-radius: 50%;
            animation: explode 1s ease-out forwards;
        }

        @keyframes explode {
            0% {
                transform: translate(-50%, -50%) scale(0);
                opacity: 1;
            }
            100% {
                transform: translate(var(--random-x, 0), var(--random-y, 0)) scale(1);
                opacity: 0;
            }
        }

        /* Responsive */
        @media (max-width: 1200px) {
            .champion-select-container {
                grid-template-columns: 1fr;
                grid-template-rows: auto auto auto;
                height: auto;
            }
            
            .champions-list {
                height: 300px;
            }
        }

        @media (max-width: 768px) {
            .champion-select-container {
                padding: 0.5rem;
                gap: 0.5rem;
            }
            
            .champion-image {
                width: 150px;
                height: 150px;
            }
            
            .champion-name {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="animated-bg"></div>

    <!-- Header -->
    <header class="champion-header">
        <div class="header-content">
            <h1 class="header-title">Selección de Campeón</h1>
            <a href="dashboard.php" class="back-btn">
                <i class="fas fa-arrow-left"></i> Volver al Dashboard
            </a>
        </div>
    </header>

    <!-- Contenedor principal -->
    <div class="champion-select-container">
        <!-- Lista de campeones -->
        <div class="champions-list">
            <h3>Campeones</h3>            <div id="championsList">
                <?php foreach ($allChampions as $champion): ?>
                    <div class="champion-item" 
                         data-champion-id="<?php echo $champion['id']; ?>"
                         onclick="selectChampion(<?php echo $champion['id']; ?>)">
                        <img src="images/<?php echo $champion['image']; ?>" 
                             alt="<?php echo htmlspecialchars($champion['name']); ?>" 
                             class="champion-avatar">
                        <div class="champion-info">
                            <h5><?php echo htmlspecialchars($champion['name']); ?></h5>
                            <p><?php echo htmlspecialchars($champion['title']); ?></p>
                        </div>
                        <div class="rarity-badge rarity-<?php echo $champion['rarity']; ?>"></div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Vista previa del campeón -->
        <div class="champion-preview">
            <div id="championPreview">
                <img src="images/default.jpg" alt="Selecciona un campeón" class="champion-image" id="previewImage">
                <h2 class="champion-name" id="previewName">Selecciona un Campeón</h2>
                <p class="champion-title" id="previewTitle">Elige tu guerrero para la batalla</p>
                <p class="champion-description" id="previewDescription">
                    Explora la lista de campeones disponibles y selecciona el que mejor se adapte a tu estilo de juego.
                </p>
                <form method="POST" id="championForm">
                    <input type="hidden" name="champion_id" id="selectedChampionId" value="">
                    <button type="submit" class="select-btn" id="selectButton" disabled>
                        <i class="fas fa-sword"></i> Seleccionar Campeón
                    </button>
                </form>
            </div>
        </div>

        <!-- Estadísticas del campeón -->
        <div class="champion-stats">
            <h3 class="stats-title">Estadísticas</h3>
            <div id="championStats">
                <div class="stat-item">
                    <div class="stat-label">
                        <i class="fas fa-sword"></i> Ataque
                    </div>
                    <div class="stat-value" id="statAttack">-</div>
                </div>
                <div class="stat-bar">
                    <div class="stat-fill" id="attackBar" style="width: 0%"></div>
                </div>

                <div class="stat-item">
                    <div class="stat-label">
                        <i class="fas fa-shield"></i> Defensa
                    </div>
                    <div class="stat-value" id="statDefense">-</div>
                </div>
                <div class="stat-bar">
                    <div class="stat-fill" id="defenseBar" style="width: 0%"></div>
                </div>

                <div class="stat-item">
                    <div class="stat-label">
                        <i class="fas fa-heart"></i> Vida
                    </div>
                    <div class="stat-value" id="statHealth">-</div>
                </div>
                <div class="stat-bar">
                    <div class="stat-fill" id="healthBar" style="width: 0%"></div>
                </div>                <div class="stat-item">
                    <div class="stat-label">
                        <i class="fas fa-magic"></i> Resistencia
                    </div>
                    <div class="stat-value" id="statMana">-</div>
                </div>
                <div class="stat-bar">
                    <div class="stat-fill" id="manaBar" style="width: 0%"></div>
                </div>                <div class="price-info" id="priceInfo" style="display: none;">
                    <div class="price-value" id="championPrice">Campeón Gratuito</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Notificaciones -->
    <div id="notificationContainer"></div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>    <script>
        // Datos de los campeones
        const champions = <?php echo json_encode($allChampions); ?>;
        
        let selectedChampionId = null;

        // Seleccionar campeón
        function selectChampion(championId) {
            selectedChampionId = championId;
            
            // Actualizar selección visual
            document.querySelectorAll('.champion-item').forEach(item => {
                item.classList.remove('selected');
            });
            document.querySelector(`[data-champion-id="${championId}"]`).classList.add('selected');
            
            // Buscar datos del campeón
            const champion = champions.find(c => c.id == championId);
            if (!champion) return;
            
            // Actualizar vista previa
            updatePreview(champion);
            
            // Actualizar estadísticas
            updateStats(champion);
            
            // Actualizar botón de selección
            document.getElementById('selectedChampionId').value = championId;
            document.getElementById('selectButton').disabled = false;
        }

        // Actualizar vista previa
        function updatePreview(champion) {
            document.getElementById('previewImage').src = `images/${champion.image}`;
            document.getElementById('previewName').textContent = champion.name;
            document.getElementById('previewTitle').textContent = champion.title;
            document.getElementById('previewDescription').textContent = champion.description;
        }        // Actualizar estadísticas
        function updateStats(champion) {
            const maxStat = 300; // Valor máximo para las barras
            
            // Calcular ataque promedio
            const avgAttack = Math.round((champion.attack_min + champion.attack_max) / 2);
            
            document.getElementById('statAttack').textContent = `${champion.attack_min}-${champion.attack_max}`;
            document.getElementById('statDefense').textContent = champion.defense_reduction || champion.armor || 0;
            document.getElementById('statHealth').textContent = champion.max_health;
            document.getElementById('statMana').textContent = champion.elemental_resistance || 100;
            
            // Animar barras
            setTimeout(() => {
                document.getElementById('attackBar').style.width = `${(avgAttack / maxStat) * 100}%`;
                document.getElementById('defenseBar').style.width = `${((champion.defense_reduction || champion.armor || 0) / maxStat) * 100}%`;
                document.getElementById('healthBar').style.width = `${(champion.max_health / 1500) * 100}%`;
                document.getElementById('manaBar').style.width = `${((champion.elemental_resistance || 100) / maxStat) * 100}%`;
            }, 100);
            
            // Ocultar información de precio (todos los campeones son gratuitos)
            document.getElementById('priceInfo').style.display = 'none';
        }        // Seleccionar primer campeón por defecto
        document.addEventListener('DOMContentLoaded', function() {
            // Seleccionar automáticamente el primer campeón
            if (champions.length > 0) {
                selectChampion(champions[0].id);
            }
            
            // Animación de entrada
            document.querySelectorAll('.champion-item').forEach((item, index) => {
                item.style.opacity = '0';
                item.style.transform = 'translateX(-20px)';
                
                setTimeout(() => {
                    item.style.transition = 'all 0.5s ease';
                    item.style.opacity = '1';
                    item.style.transform = 'translateX(0)';
                }, index * 100);
            });
        });        // Prevenir envío si no hay campeón seleccionado
        document.getElementById('championForm').addEventListener('submit', function(e) {
            if (!selectedChampionId) {
                e.preventDefault();
                alert('Por favor, selecciona un campeón primero.');
            }
        });
    </script>
</body>
</html>

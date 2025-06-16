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

// Función para obtener características de los characters usando sus módulos JS
function getCharacterData() {
    return [
        [
            'id' => 1,
            'name' => 'Shuna Shieda',
            'title' => 'La Furia de los Shiedas',
            'description' => 'La cúspide de poder de los Shiedas, feroz y letal. Maestra del elemento Devastación.',
            'image' => 'shuna.jpg',
            'rarity' => 'legendary',
            'attack_min' => 120,
            'attack_max' => 180,
            'max_health' => 950,
            'armor' => 85,
            'defense_reduction' => 75,
            'elemental_resistance' => 180,
            'price' => 0,
            'clan' => 'Shieda',
            'element' => 'Devastación',
            'passives' => ['Aura Abrasadora'],
            'attacks' => ['Látigo Primordial', 'Cuna de Judas', 'Doctrina Perfecta: Infierno en la Tierra']
        ],
        [
            'id' => 2,
            'name' => 'Ozen Kimura',
            'title' => 'La Muralla Inamovible de los Kimura',
            'description' => 'Con una actitud fría como el acero, Ozen es una guerrera formidable del clan Kimura.',
            'image' => 'ozen.jpg',
            'rarity' => 'epic',
            'attack_min' => 200,
            'attack_max' => 280,
            'max_health' => 1200,
            'armor' => 150,
            'defense_reduction' => 120,
            'elemental_resistance' => 90,
            'price' => 0,
            'clan' => 'Kimura',
            'element' => 'Hielo',
            'passives' => ['Resistencia Natural', 'Armadura de Hielo'],
            'attacks' => ['Golpe Helado', 'Barrera de Hielo', 'Glaciar Eterno']
        ],
        [
            'id' => 3,
            'name' => 'Xair Chikyu',
            'title' => 'El viento gélido de los Chikyu',
            'description' => 'Inventor del Bijon, energía que le otorga un poder devastador. Maestro del clan Chikyu.',
            'image' => 'xair.png',
            'rarity' => 'rare',
            'attack_min' => 160,
            'attack_max' => 240,
            'max_health' => 800,
            'armor' => 60,
            'defense_reduction' => 45,
            'elemental_resistance' => 250,
            'price' => 0,
            'clan' => 'Chikyu',
            'element' => 'Viento',
            'passives' => ['Maestría Elemental', 'Bijon'],
            'attacks' => ['Ráfaga Cortante', 'Tormenta de Bijon', 'Huracán Primordial']
        ]
    ];
}

$allChampions = getCharacterData();

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
    }}
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
    
    <!-- CSS del sistema SCSS -->
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="stylesheet" href="assets/css/selection.css">
</head>
<body class="character-selection">
    <!-- Fondo animado -->
    <div class="animated-bg"></div>
    
    <!-- Partículas flotantes -->
    <div class="floating-particles">
        <div class="particle" style="left: 10%; animation-delay: 0s;"></div>
        <div class="particle" style="left: 20%; animation-delay: -2s;"></div>
        <div class="particle" style="left: 30%; animation-delay: -4s;"></div>
        <div class="particle" style="left: 40%; animation-delay: -6s;"></div>
        <div class="particle" style="left: 50%; animation-delay: -8s;"></div>
        <div class="particle" style="left: 60%; animation-delay: -10s;"></div>
        <div class="particle" style="left: 70%; animation-delay: -12s;"></div>
        <div class="particle" style="left: 80%; animation-delay: -14s;"></div>
        <div class="particle" style="left: 90%; animation-delay: -16s;"></div>
    </div>

    <!-- Header -->
    <div class="header">
        <div class="container">
            <h1><i class="fas fa-shield-alt"></i> Selección de Campeón</h1>
            <p class="subtitle">Elige tu guerrero para la batalla</p>
            <div class="user-info">
                Bienvenido, <span class="user-name"><?php echo htmlspecialchars($userData['username']); ?></span>
            </div>
        </div>
    </div>    
    <!-- Contenido principal -->
    <div class="selection-container">
        <!-- Grid de campeones -->
        <div class="champion-grid">
            <?php foreach ($allChampions as $champion): ?>
            <div class="champion-card" data-champion-id="<?php echo $champion['id']; ?>" onclick="selectChampion(<?php echo $champion['id']; ?>)">
                <div class="rarity-badge <?php echo $champion['rarity']; ?>">
                    <?php echo ucfirst($champion['rarity']); ?>
                </div>
                
                <img src="images/<?php echo $champion['image']; ?>" 
                     alt="<?php echo htmlspecialchars($champion['name']); ?>" 
                     class="champion-image">
                
                <div class="champion-info">
                    <h3><?php echo htmlspecialchars($champion['name']); ?></h3>
                    <div class="champion-title"><?php echo htmlspecialchars($champion['title']); ?></div>
                    <div class="champion-description"><?php echo htmlspecialchars($champion['description']); ?></div>
                    
                    <!-- Información adicional del clan y elemento -->
                    <div class="champion-details">
                        <div class="detail-item">
                            <i class="fas fa-shield-alt"></i>
                            <span>Clan: <?php echo htmlspecialchars($champion['clan']); ?></span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-magic"></i>
                            <span>Elemento: <?php echo htmlspecialchars($champion['element']); ?></span>
                        </div>
                    </div>
                    
                    <div class="champion-stats">
                        <div class="stat-item">
                            <span class="stat-label"><i class="fas fa-sword"></i> Ataque</span>
                            <span class="stat-value"><?php echo $champion['attack_min']; ?>-<?php echo $champion['attack_max']; ?></span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label"><i class="fas fa-heart"></i> Vida</span>
                            <span class="stat-value"><?php echo $champion['max_health']; ?></span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label"><i class="fas fa-shield"></i> Armadura</span>
                            <span class="stat-value"><?php echo $champion['armor']; ?></span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label"><i class="fas fa-bolt"></i> Resistencia</span>
                            <span class="stat-value"><?php echo $champion['elemental_resistance']; ?></span>
                        </div>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>

        <!-- Preview del personaje seleccionado -->
        <div class="character-preview" id="characterPreview">
            <div class="preview-header">
                <h2 id="previewName">Selecciona un Campeón</h2>
                <div class="preview-title" id="previewTitle">Elige tu guerrero para comenzar</div>
                <div class="preview-description" id="previewDescription">
                    Selecciona uno de los campeones disponibles para ver sus características detalladas y habilidades especiales.
                </div>
            </div>
            
            <div class="preview-content" id="previewContent" style="display: none;">
                <div class="preview-image-container">
                    <img id="previewImage" src="" alt="" class="preview-image">
                </div>
                
                <div class="preview-stats">
                    <!-- Información adicional del personaje -->
                    <div class="character-details">
                        <div class="detail-row">
                            <span class="detail-label"><i class="fas fa-shield-alt"></i> Clan:</span>
                            <span class="detail-value" id="previewClan"></span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label"><i class="fas fa-magic"></i> Elemento:</span>
                            <span class="detail-value" id="previewElement"></span>
                        </div>
                    </div>
                    
                    <!-- Habilidades pasivas -->
                    <div class="abilities-section">
                        <h4><i class="fas fa-star"></i> Habilidades Pasivas</h4>
                        <div id="passivesList" class="abilities-list"></div>
                    </div>
                    
                    <!-- Ataques -->
                    <div class="abilities-section">
                        <h4><i class="fas fa-fist-raised"></i> Ataques</h4>
                        <div id="attacksList" class="abilities-list"></div>
                    </div>
                    
                    <!-- Estadísticas con barras -->
                    <div class="stats-grid">
                        <div class="stat-group">
                            <div class="stat-label">
                                <i class="fas fa-sword"></i>
                                <span>Ataque</span>
                            </div>
                            <div class="stat-bar">
                                <div class="stat-fill" id="attackBar"></div>
                            </div>
                            <div class="stat-value" id="statAttack">0</div>
                        </div>
                        
                        <div class="stat-group">
                            <div class="stat-label">
                                <i class="fas fa-heart"></i>
                                <span>Vida</span>
                            </div>
                            <div class="stat-bar">
                                <div class="stat-fill" id="healthBar"></div>
                            </div>
                            <div class="stat-value" id="statHealth">0</div>
                        </div>
                        
                        <div class="stat-group">
                            <div class="stat-label">
                                <i class="fas fa-shield"></i>
                                <span>Defensa</span>
                            </div>
                            <div class="stat-bar">
                                <div class="stat-fill" id="defenseBar"></div>
                            </div>
                            <div class="stat-value" id="statDefense">0</div>
                        </div>
                        
                        <div class="stat-group">
                            <div class="stat-label">
                                <i class="fas fa-bolt"></i>
                                <span>Resistencia</span>
                            </div>
                            <div class="stat-bar">
                                <div class="stat-fill" id="manaBar"></div>
                            </div>
                            <div class="stat-value" id="statMana">0</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Botones de acción -->
        <div class="action-buttons">
            <form id="championForm" method="POST">
                <input type="hidden" id="selectedChampionId" name="champion_id" value="">
                <a href="dashboard.php" class="btn-back">
                    <i class="fas fa-arrow-left"></i> Volver al Dashboard
                </a>
                <button type="submit" id="selectButton" class="btn-select" disabled>
                    <i class="fas fa-play"></i> Comenzar Batalla
                </button>
            </form>        </div>
    </div>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script type="module">
        // Importar módulos de characters
        import { CharacterFactory } from './characters/CharacterFactory.js';
        
        // Datos de los campeones con información extendida
        const champions = <?php echo json_encode($allChampions); ?>;
        
        let selectedChampionId = null;
        let characterInstances = new Map();

        // Crear instancias de los characters usando el factory
        async function initializeCharacters() {
            for (const championData of champions) {
                try {
                    const character = await CharacterFactory.createCharacter(championData);
                    characterInstances.set(championData.id, character);
                } catch (error) {
                    console.warn(`No se pudo crear la instancia del personaje ${championData.name}:`, error);
                }
            }
        }

        // Seleccionar campeón
        function selectChampion(championId) {
            selectedChampionId = championId;
            
            // Actualizar selección visual
            document.querySelectorAll('.champion-card').forEach(card => {
                card.classList.remove('selected');
            });
            document.querySelector(`[data-champion-id="${championId}"]`).classList.add('selected');
            
            // Buscar datos del campeón
            const champion = champions.find(c => c.id == championId);
            if (!champion) return;
            
            // Mostrar preview
            document.getElementById('previewContent').style.display = 'block';
            
            // Actualizar vista previa
            updatePreview(champion);
            
            // Actualizar estadísticas
            updateStats(champion);
            
            // Actualizar información del character instance si está disponible
            const characterInstance = characterInstances.get(championId);
            if (characterInstance) {
                updateCharacterDetails(characterInstance);
            }
            
            // Actualizar botón de selección
            document.getElementById('selectedChampionId').value = championId;
            document.getElementById('selectButton').disabled = false;
        }

        // Actualizar vista previa básica
        function updatePreview(champion) {
            document.getElementById('previewImage').src = `images/${champion.image}`;
            document.getElementById('previewName').textContent = champion.name;
            document.getElementById('previewTitle').textContent = champion.title;
            document.getElementById('previewDescription').textContent = champion.description;
            
            // Actualizar información de clan y elemento
            document.getElementById('previewClan').textContent = champion.clan;
            document.getElementById('previewElement').textContent = champion.element;
        }

        // Actualizar detalles del character usando la instancia
        function updateCharacterDetails(character) {
            // Actualizar habilidades pasivas
            const passivesList = document.getElementById('passivesList');
            passivesList.innerHTML = '';
            character.passives.forEach(passive => {
                const passiveElement = document.createElement('div');
                passiveElement.className = 'ability-item';
                passiveElement.innerHTML = `
                    <div class="ability-name">${passive.name}</div>
                    <div class="ability-description">${passive.description}</div>
                `;
                passivesList.appendChild(passiveElement);
            });

            // Actualizar lista de ataques
            const attacksList = document.getElementById('attacksList');
            attacksList.innerHTML = '';
            Object.values(character.attacks).forEach(attack => {
                const attackElement = document.createElement('div');
                attackElement.className = 'ability-item';
                attackElement.innerHTML = `
                    <div class="ability-name">${attack.name}</div>
                    <div class="ability-description">${attack.description}</div>
                    <div class="ability-stats">
                        <span class="energy-cost"><i class="fas fa-bolt"></i> ${attack.energyCost} energía</span>
                        <span class="cooldown"><i class="fas fa-clock"></i> ${attack.cooldown/1000}s</span>
                    </div>
                `;
                attacksList.appendChild(attackElement);
            });
        }

        // Actualizar estadísticas con barras animadas
        function updateStats(champion) {
            const maxStat = 300; // Valor máximo para las barras
            
            // Calcular ataque promedio
            const avgAttack = Math.round((champion.attack_min + champion.attack_max) / 2);
            
            document.getElementById('statAttack').textContent = `${champion.attack_min}-${champion.attack_max}`;
            document.getElementById('statDefense').textContent = champion.defense_reduction || champion.armor || 0;
            document.getElementById('statHealth').textContent = champion.max_health;
            document.getElementById('statMana').textContent = champion.elemental_resistance || 100;
            
            // Animar barras con un pequeño delay para efecto visual
            setTimeout(() => {
                document.getElementById('attackBar').style.width = `${Math.min((avgAttack / maxStat) * 100, 100)}%`;
                document.getElementById('defenseBar').style.width = `${Math.min(((champion.defense_reduction || champion.armor || 0) / maxStat) * 100, 100)}%`;
                document.getElementById('healthBar').style.width = `${Math.min((champion.max_health / 1500) * 100, 100)}%`;
                document.getElementById('manaBar').style.width = `${Math.min(((champion.elemental_resistance || 100) / maxStat) * 100, 100)}%`;
            }, 100);
        }

        // Inicializar aplicación
        document.addEventListener('DOMContentLoaded', async function() {
            // Inicializar characters
            await initializeCharacters();
            
            // Seleccionar automáticamente el primer campeón
            if (champions.length > 0) {
                selectChampion(champions[0].id);
            }
            
            // Animación de entrada para las cartas
            document.querySelectorAll('.champion-card').forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    card.style.transition = 'all 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 150);
            });
        });

        // Prevenir envío si no hay campeón seleccionado
        document.getElementById('championForm').addEventListener('submit', function(e) {
            if (!selectedChampionId) {
                e.preventDefault();
                alert('Por favor, selecciona un campeón primero.');
            }
        });

        // Hacer funciones globales para onclick handlers
        window.selectChampion = selectChampion;
    </script>    <!-- Estilos adicionales para las nuevas características -->
    <style>
        /* Estilos para champion cards */
        .champion-details {
            margin: 1rem 0;
            padding: 1rem;
            background: rgba(201, 170, 113, 0.1);
            border-radius: 8px;
            border-left: 3px solid var(--primary-gold);
        }

        .detail-item {
            display: flex;
            align-items: center;
            margin-bottom: 0.5rem;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .detail-item i {
            color: var(--primary-gold);
            margin-right: 0.5rem;
            width: 16px;
        }

        /* Estilos para character preview */
        .character-details {
            margin-bottom: 2rem;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(201, 170, 113, 0.2);
        }

        .detail-row:last-child {
            border-bottom: none;
        }

        .detail-label {
            color: var(--text-secondary);
            font-weight: 500;
        }

        .detail-value {
            color: var(--primary-gold);
            font-weight: 600;
        }

        /* Estilos para abilities */
        .abilities-section {
            margin-bottom: 2rem;
        }

        .abilities-section h4 {
            color: var(--primary-gold);
            margin-bottom: 1rem;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .abilities-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .ability-item {
            background: rgba(201, 170, 113, 0.1);
            padding: 1rem;
            border-radius: 8px;
            border-left: 3px solid var(--primary-gold);
        }

        .ability-name {
            color: var(--text-primary);
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .ability-description {
            color: var(--text-secondary);
            font-size: 0.9rem;
            line-height: 1.4;
            margin-bottom: 0.5rem;
        }

        .ability-stats {
            display: flex;
            gap: 1rem;
            font-size: 0.8rem;
        }

        .energy-cost, .cooldown {
            color: var(--primary-gold);
            display: flex;
            align-items: center;
            gap: 0.3rem;
        }

        /* Mejoras específicas para imágenes */
        .champion-image {
            object-position: center top !important;
            transition: all 0.3s ease;
        }

        .champion-card:hover .champion-image {
            transform: scale(1.02);
        }

        .preview-image {
            object-position: center top !important;
            transition: all 0.5s ease;
        }

        .preview-image:hover {
            transform: scale(1.02);
        }        /* Mejoras para rarity badges - asegurar que los estilos se apliquen */
        .rarity-badge {
            z-index: 20 !important;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9) !important;
            transform: scale(1.1) !important;
            min-width: 80px !important;
            text-align: center !important;
            font-weight: 800 !important;
            font-size: 0.75rem !important;
            padding: 0.6rem 1rem !important;
        }

        .rarity-badge.legendary {
            background: linear-gradient(135deg, #ffd700 0%, #ffed4e 25%, #ff8c00 50%, #ff6347 75%, #ffd700 100%) !important;
            animation: legendaryGlow 2s ease-in-out infinite alternate !important;
            color: #1a1a1a !important;
            border: 3px solid rgba(255, 215, 0, 0.8) !important;
        }

        .rarity-badge.epic {
            background: linear-gradient(135deg, #9932cc 0%, #8a2be2 25%, #7b68ee 50%, #9370db 75%, #9932cc 100%) !important;
            color: white !important;
            border: 3px solid rgba(153, 50, 204, 0.8) !important;
        }

        .rarity-badge.rare {
            background: linear-gradient(135deg, #1e90ff 0%, #4169e1 25%, #0066cc 50%, #0080ff 75%, #1e90ff 100%) !important;
            color: white !important;
            border: 3px solid rgba(30, 144, 255, 0.8) !important;
        }

        /* Animación mejorada para badges legendarios */
        @keyframes legendaryGlow {
            0% {
                box-shadow: 
                    0 0 25px rgba(255, 215, 0, 0.8),
                    0 0 50px rgba(255, 140, 0, 0.6),
                    inset 0 2px 0 rgba(255, 255, 255, 0.4),
                    0 4px 15px rgba(0, 0, 0, 0.3);
            }
            100% {
                box-shadow: 
                    0 0 35px rgba(255, 215, 0, 1),
                    0 0 70px rgba(255, 140, 0, 0.8),
                    0 0 100px rgba(255, 99, 71, 0.4),
                    inset 0 2px 0 rgba(255, 255, 255, 0.4),
                    0 4px 15px rgba(0, 0, 0, 0.3);
            }
        }
    </style>
</body>
</html>

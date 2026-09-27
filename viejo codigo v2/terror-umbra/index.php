<?php
require_once '../includes/Database.php';
require_once '../includes/version_helper.php';

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    header('Location: ../index.php');
    exit();
}

$userData = $auth->getUserData();
$userId = $userData['id'];
$userName = $userData['username'];
$userEmail = $userData['email'] ?? '';

$db = Database::getInstance();

// Verificar/crear progreso del jugador
$stmt = $db->prepare("SELECT * FROM umbra_progress WHERE user_id = ?");
$stmt->execute([$userId]);
$progress = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$progress) {
    // Primera vez jugando - crear progreso inicial
    $stmt = $db->prepare("
        INSERT INTO umbra_progress 
        (user_id, session_count, chapter, paranoia_level, perception, trust, sanity) 
        VALUES (?, 1, 1, 0, 100, 50, 100)
    ");
    $stmt->execute([$userId]);
    
    $progress = [
        'user_id' => $userId,
        'session_count' => 1,
        'chapter' => 1,
        'paranoia_level' => 0,
        'perception' => 100,
        'trust' => 50,
        'sanity' => 100,
        'has_seen_face' => false,
        'knows_name' => false,
        'room_revealed' => false,
        'made_pact' => false,
        'attempted_escape' => 0,
        'current_room' => 'void',
        'inventory' => '[]',
        'discovered_secrets' => '[]',
        'event_log' => '[]',
        'whispers_heard' => '[]',
        'total_playtime_minutes' => 0
    ];
    
    // Registrar evento de primera sesión
    $stmt = $db->prepare("
        INSERT INTO umbra_player_events (user_id, event_type, event_data, session_number)
        VALUES (?, 'first_visit', ?, 1)
    ");
    $stmt->execute([$userId, json_encode(['timestamp' => date('Y-m-d H:i:s')])]);
    
} else {
    // Jugador que regresa - incrementar sesión
    $newSessionCount = $progress['session_count'] + 1;
    
    $stmt = $db->prepare("
        UPDATE umbra_progress 
        SET session_count = ?, last_played = NOW()
        WHERE user_id = ?
    ");
    $stmt->execute([$newSessionCount, $userId]);
    
    $progress['session_count'] = $newSessionCount;
    
    // Registrar evento de regreso
    $stmt = $db->prepare("
        INSERT INTO umbra_player_events (user_id, event_type, event_data, session_number)
        VALUES (?, 'return_visit', ?, ?)
    ");
    $stmt->execute([$userId, json_encode([
        'timestamp' => date('Y-m-d H:i:s'),
        'previous_chapter' => $progress['chapter'],
        'previous_paranoia' => $progress['paranoia_level']
    ]), $newSessionCount]);
}

// Obtener historial de eventos previos para referencias
$stmt = $db->prepare("
    SELECT event_type, COUNT(*) as count 
    FROM umbra_player_events 
    WHERE user_id = ? 
    GROUP BY event_type
");
$stmt->execute([$userId]);
$eventHistory = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

// Obtener finales alcanzados previamente
$stmt = $db->prepare("SELECT ending_type FROM umbra_endings WHERE user_id = ?");
$stmt->execute([$userId]);
$previousEndings = $stmt->fetchAll(PDO::FETCH_COLUMN);

// Determinar hora del día para eventos especiales
$currentHour = (int)date('H');
$isNightTime = ($currentHour >= 23 || $currentHour < 5);
$isLateNight = ($currentHour >= 1 && $currentHour < 4);

// Datos para JavaScript
$gameData = [
    'userId' => $userId,
    'userName' => $userName,
    'progress' => $progress,
    'sessionCount' => $progress['session_count'],
    'isReturningPlayer' => $progress['session_count'] > 1,
    'previousEndings' => $previousEndings,
    'isNightTime' => $isNightTime,
    'isLateNight' => $isLateNight,
    'currentHour' => $currentHour,
    'eventHistory' => $eventHistory
];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#000000">
    <title>UMBRA</title>
    <link rel="stylesheet" href="assets/css/umbra.css<?php echo v('terror-umbra/assets/css/umbra.css'); ?>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Special+Elite&family=Creepster&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Capa de efectos -->
    <div id="effect-layer">
        <div id="vignette"></div>
        <div id="noise-overlay"></div>
        <div id="glitch-layer"></div>
        <div id="flash-layer"></div>
        <div id="entity-layer"></div>
        <div id="subliminal-layer"></div>
    </div>
    
    <!-- Capa de audio -->
    <audio id="ambient-audio" loop preload="auto"></audio>
    <audio id="effect-audio" preload="auto"></audio>
    <audio id="whisper-audio" preload="auto"></audio>
    
    <!-- Contenedor principal -->
    <div id="game-container">
        <!-- Pantalla de advertencia inicial -->
        <div id="warning-screen" class="screen active">
            <div class="warning-content">
                <div class="warning-symbol">⚠</div>
                <h1>ADVERTENCIA</h1>
                <p class="warning-text">
                    Este juego contiene elementos de <span class="highlight">terror psicológico intenso</span>.
                </p>
                <p class="warning-text">
                    Incluye imágenes perturbadoras, manipulación sensorial y elementos diseñados para causar incomodidad.
                </p>
                <p class="warning-text small">
                    Se recomienda jugar con auriculares en un ambiente oscuro.
                </p>
                <button id="accept-warning" class="ominous-button">
                    <span>ENTRAR</span>
                </button>
                <p class="disclaimer">Al continuar, aceptas que cualquier efecto psicológico es responsabilidad tuya.</p>
            </div>
        </div>
        
        <!-- Pantalla principal del juego -->
        <div id="game-screen" class="screen">
            <!-- Header con stats (oculto inicialmente) -->
            <div id="stats-bar" class="hidden">
                <div class="stat">
                    <span class="stat-label">CORDURA</span>
                    <div class="stat-bar">
                        <div id="sanity-bar" class="bar-fill sanity"></div>
                    </div>
                </div>
                <div class="stat">
                    <span class="stat-label">PERCEPCIÓN</span>
                    <div class="stat-bar">
                        <div id="perception-bar" class="bar-fill perception"></div>
                    </div>
                </div>
                <div class="stat paranoia-stat">
                    <span class="stat-label">PARANOIA</span>
                    <div class="stat-bar inverted">
                        <div id="paranoia-bar" class="bar-fill paranoia"></div>
                    </div>
                </div>
            </div>
            
            <!-- Área de narrativa -->
            <div id="narrative-area">
                <div id="narrative-text"></div>
                <div id="whisper-text" class="hidden"></div>
            </div>
            
            <!-- Área de la habitación (imagen de fondo) -->
            <div id="room-visual"></div>
            
            <!-- Área de opciones -->
            <div id="choices-area"></div>
            
            <!-- Input de texto (para ciertas interacciones) -->
            <div id="input-area" class="hidden">
                <input type="text" id="player-input" placeholder="Escribe aquí..." autocomplete="off">
                <button id="submit-input">►</button>
            </div>
        </div>
        
        <!-- Pantalla de final -->
        <div id="ending-screen" class="screen">
            <div id="ending-content"></div>
            <div id="ending-actions"></div>
        </div>
    </div>
    
    <!-- Cursor personalizado para efectos -->
    <div id="custom-cursor" class="hidden"></div>
    
    <!-- Easter egg: Texto oculto -->
    <div id="hidden-messages" style="display:none;">
        <span data-msg="1">No deberías estar leyendo esto...</span>
        <span data-msg="2">¿Crees que el código te salvará?</span>
        <span data-msg="3"><?php echo $userName; ?>, te estoy esperando.</span>
    </div>

    <script>
        // Datos del juego inyectados desde PHP
        const GAME_DATA = <?php echo json_encode($gameData); ?>;
        const USER_NAME = "<?php echo htmlspecialchars($userName, ENT_QUOTES); ?>";
        const USER_ID = <?php echo $userId; ?>;
        const SESSION_COUNT = <?php echo $progress['session_count']; ?>;
        const IS_RETURNING = <?php echo $progress['session_count'] > 1 ? 'true' : 'false'; ?>;
        const CURRENT_HOUR = <?php echo $currentHour; ?>;
        const IS_NIGHT = <?php echo $isNightTime ? 'true' : 'false'; ?>;
        const IS_LATE_NIGHT = <?php echo $isLateNight ? 'true' : 'false'; ?>;
    </script>
    <script type="module" src="assets/js/umbra-game.js<?php echo v('terror-umbra/assets/js/umbra-game.js'); ?>"></script>
</body>
</html>

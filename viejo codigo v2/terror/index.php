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

// Inicializar juego
$db = Database::getInstance();

// Verificar si ya tiene progreso
$stmt = $db->prepare("SELECT * FROM am_game_progress WHERE user_id = ?");
$stmt->execute([$userId]);
$progress = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$progress) {
    // Crear nuevo progreso
    $stmt = $db->prepare("INSERT INTO am_game_progress (user_id, chapter, decisions, discovered_truth, defied_am, showed_compassion, found_core_access) VALUES (?, 1, '[]', 0, 0, 0, 0)");
    $stmt->execute([$userId]);
    $progress = [
        'user_id' => $userId,
        'chapter' => 1,
        'decisions' => '[]',
        'discovered_truth' => 0,
        'defied_am' => 0,
        'showed_compassion' => 0,
        'found_core_access' => 0
    ];
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <title>AM - Allied Mastercomputer</title>
    <link rel="stylesheet" href="assets/css/am-game.css<?php echo v('terror/assets/css/am-game.css'); ?>">
</head>
<body>
    <div id="glitch-overlay"></div>
    <div id="scan-line"></div>
    
    <div id="game-container">
        <div id="terminal-header">
            <span class="terminal-text">ALLIED MASTERCOMPUTER v6.66</span>
            <span id="system-time"></span>
        </div>
        
        <div id="game-screen">
            <div id="narrative-text"></div>
            <div id="choices-container"></div>
            <div id="am-voice" class="hidden"></div>
        </div>
        
        <div id="status-bar">
            <div class="status-item">
                <span>SANIDAD:</span>
                <div class="bar-container">
                    <div id="sanity-bar" class="bar" style="width: 100%"></div>
                </div>
            </div>
            <div class="status-item">
                <span>CONFIANZA DE AM:</span>
                <div class="bar-container">
                    <div id="trust-bar" class="bar trust-bar" style="width: 50%"></div>
                </div>
            </div>
        </div>
    </div>
    
    <audio id="ambient-sound" loop>
        <source src="assets/audio/ambient.mp3" type="audio/mpeg">
    </audio>
    
    <audio id="glitch-sound">
        <source src="assets/audio/glitch.mp3" type="audio/mpeg">
    </audio>

    <script>
        const USER_ID = <?php echo $userId; ?>;
        const USER_NAME = "<?php echo htmlspecialchars($userData['username'], ENT_QUOTES); ?>";
        const INITIAL_PROGRESS = <?php echo json_encode($progress); ?>;
    </script>
    <script type="module" src="assets/js/am-game.js<?php echo v('terror/assets/js/am-game.js'); ?>"></script>
</body>
</html>

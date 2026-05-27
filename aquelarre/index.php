<?php
require_once '../includes/Database.php';
require_once '../includes/version_helper.php';

$auth = new AuthController();

if (!$auth->isAuthenticated()) {
    header('Location: ../index.php');
    exit();
}

$userData = $auth->getUserData();
$db = Database::getInstance()->getConnection();
$stmtHot = $db->prepare("SELECT aquelarre_hot FROM usuarios WHERE id = ?");
$stmtHot->execute([$userData['id']]);
$hotRow = $stmtHot->fetch(PDO::FETCH_ASSOC);
$hotUnlocked = !empty($hotRow['aquelarre_hot']);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="theme-color" content="#0a0a0a">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>Aquelarre Einherjer</title>
    <link rel="icon" href="data:,">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/chat.css<?php echo v('aquelarre/assets/css/chat.css'); ?>">
</head>
<body class="dark-theme">

    <!-- LOBBY -->
    <div id="witchLobby" class="witch-lobby-overlay">
        <div class="lobby-content">
            <h1 class="lobby-title">Aquelarre Einherjer</h1>
            <p class="lobby-subtitle">Elige a la bruja con quien conversar.</p>
            <div class="witch-cards">
                <div class="witch-card" data-witch="herta">
                    <img class="witch-icon" src="assets/images/herta.jpg" alt="The Herta" loading="lazy">
                    <h3>The Herta</h3>
                    <p>Genio, marioneta, arrogante. Desafia tu intelecto.</p>
                </div>
                <div class="witch-card" data-witch="featherine">
                    <img class="witch-icon" src="assets/images/featherine.jpg" alt="Featherine" loading="lazy">
                    <h3>Featherine</h3>
                    <p>Creadora, observadora. Entretela con tu guion.</p>
                </div>
                <div class="witch-card" data-witch="wanda">
                    <img class="witch-icon" src="assets/images/escarlata.jpg" alt="Bruja Escarlata" loading="lazy">
                    <h3>Bruja Escarlata</h3>
                    <p>Magia del caos. Sumergete en su realidad.</p>
                </div>
            </div>
            <button id="startChatBtn" class="btn-start-disabled" disabled>Comenzar</button>
        </div>
    </div>

    <!-- CHAT INTERFACE -->
    <div class="chat-container" id="chatContainer" style="display: none;">
        <header class="chat-header">
            <a href="../dashboard.php" class="btn-back" aria-label="Volver">
                <i class="fas fa-chevron-left"></i>
                <span class="btn-back-text">Huir</span>
            </a>
            <h1 id="activeWitchName"><i class="fas fa-moon"></i> Aquelarre</h1>
            <div class="header-actions">
                <button id="hotModeToggle" class="hot-toggle" title="Modo Hot" style="display: none;" aria-label="Modo Hot">
                    <i class="fas fa-fire"></i>
                </button>
                <button id="headerPdfBtn" class="header-btn" title="Descargar PDF" aria-label="Descargar PDF">
                    <i class="fas fa-file-pdf"></i>
                </button>
            </div>
        </header>

        <main class="chat-messages" id="chatMessages"></main>

        <footer class="chat-input-area" id="chatInputFooter">
            <div class="input-wrapper">
                <form id="chatForm">
                    <textarea id="userInput" placeholder="Escribe a la bruja..." autocomplete="off" rows="1"></textarea>
                    <div class="input-footer">
                        <span class="input-hint">Chat ilimitado</span>
                        <button type="submit" class="btn-send" id="sendBtn" aria-label="Enviar">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </form>
            </div>
        </footer>
    </div>

    <script>
        window.HOT_UNLOCKED = <?= $hotUnlocked ? 'true' : 'false' ?>;
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="assets/js/chat.js<?php echo v('aquelarre/assets/js/chat.js'); ?>"></script>
</body>
</html>
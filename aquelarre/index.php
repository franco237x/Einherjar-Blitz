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
$stmtTrials = $db->prepare("SELECT witch_name FROM aquelarre_trials WHERE user_id = ?");
$stmtTrials->execute([$userData['id']]);
$completedWitches = $stmtTrials->fetchAll(PDO::FETCH_COLUMN);
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="theme-color" content="#0a0a0a">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>Aquelarre Einherjer</title>
    <link rel="icon" href="data:,">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/chat.css<?php echo v('aquelarre/assets/css/chat.css'); ?>">
</head>

<body class="dark-theme">
    
    <!-- LOBBY SELECTION MODAL -->
    <div id="witchLobby" class="witch-lobby-overlay">
        <div class="lobby-content">
            <h1 class="lobby-title">Aquelarre Einherjer</h1>
            <p class="lobby-subtitle">Elige a la bruja que pondrá a prueba tu valía.</p>
            <div class="witch-cards">
                <?php 
                $isHertaCompleted = in_array('herta', $completedWitches);
                $isFeathCompleted = in_array('featherine', $completedWitches);
                $isWandaCompleted = in_array('wanda', $completedWitches);
                ?>
                <div class="witch-card <?php echo $isHertaCompleted ? 'completed' : ''; ?>" data-witch="herta">
                    <?php if($isHertaCompleted): ?><div class="completed-badge">COMPLETADO</div><?php endif; ?>
                    <img class="witch-icon" src="assets/images/herta.jpg" alt="The Herta">
                    <h3>The Herta</h3>
                    <p>Genio, marioneta, arrogante. Pondrá a prueba tu inteligencia.</p>
                </div>
                <div class="witch-card <?php echo $isFeathCompleted ? 'completed' : ''; ?>" data-witch="featherine">
                    <?php if($isFeathCompleted): ?><div class="completed-badge">COMPLETADO</div><?php endif; ?>
                    <img class="witch-icon" src="assets/images/featherine.jpg" alt="Featherine">
                    <h3>Featherine</h3>
                    <p>Creadora, observadora. ¿Podrá tu guion entretenerla?</p>
                </div>
                <div class="witch-card <?php echo $isWandaCompleted ? 'completed' : ''; ?>" data-witch="wanda">
                    <?php if($isWandaCompleted): ?><div class="completed-badge">COMPLETADO</div><?php endif; ?>
                    <img class="witch-icon" src="assets/images/escarlata.jpg" alt="Bruja Escarlata">
                    <h3>Bruja Escarlata</h3>
                    <p>Magia del caos. Pondrá a prueba tu resiliencia emocional.</p>
                </div>
            </div>
            <button id="startChatBtn" class="btn-start-disabled" disabled>Comenzar Prueba</button>
        </div>
    </div>

    <!-- MAIN CHAT INTERFACE (Hidden originally via CSS or JS) -->
    <div class="chat-container" id="chatContainer" style="display: none;">
        <!-- Header -->
        <header class="chat-header">
            <div class="d-flex align-items-center gap-3">
                <a href="../dashboard.php" class="btn-back">
                    <i class="fas fa-chevron-left"></i>
                    <span>Huir</span>
                </a>
                <h1 id="activeWitchName"><i class="fas fa-moon"></i> Aquelarre</h1>
            </div>
            <div class="header-actions">
                <div class="stat-badge turn-badge" id="turnCounterBadge">
                    <i class="fas fa-hourglass-half"></i> Turnos: <span id="turnCount">0</span>/3
                </div>
                <div class="stat-badge magic-badge">
                    <i class="fas fa-gem"></i> Fragmentos: <span id="magicFragments">0</span>
                </div>
            </div>
        </header>

        <!-- Messages Area -->
        <main class="chat-messages" id="chatMessages">
            <!-- Initial msg will be populated by JS -->
        </main>

        <!-- PDF Download Area -->
        <div id="pdfDownloadArea" style="display: none; padding: 1rem; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
            <p>La prueba ha concluido. El veredicto ha sido sellado.</p>
            <button id="downloadPdfBtn" class="btn btn-primary" style="background: linear-gradient(135deg, #8b5cf6, #d946ef); border: none; font-weight: 600; padding: 10px 20px;">
                <i class="fas fa-file-pdf"></i> Descargar Veredicto (PDF)
            </button>
        </div>

        <!-- Input Area -->
        <footer class="chat-input-area" id="chatInputFooter">
            <div class="input-wrapper">
                <form id="chatForm">
                    <textarea id="userInput" placeholder="Responde a la bruja..." autocomplete="off"
                        rows="1"></textarea>
                    <div class="input-footer">
                        <div class="context-usage">
                            <!-- Token indicator here is less relevant for a 3-turn event, but kept for aesthetics -->
                             <span id="usageInfo" style="font-size: 12px; color: #a1a1aa;">Máx. 3 interacciones</span>
                        </div>
                        <button type="submit" class="btn-send" id="sendBtn">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </form>
            </div>
        </footer>
    </div>

    <!-- html2pdf -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="assets/js/chat.js<?php echo v('aquelarre/assets/js/chat.js'); ?>"></script>
</body>

</html>
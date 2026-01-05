<?php
require_once '../includes/Database.php';
require_once '../includes/version_helper.php';

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
    <meta name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="theme-color" content="#0a0a0a">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>AR-12 Chat - Einherjar Blitz</title>
    <link rel="icon" href="data:,">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/chat.css<?php echo v('AR-12/assets/css/chat.css'); ?>">
</head>

<body class="dark-theme">
    <div class="chat-container">
        <!-- Header -->
        <header class="chat-header">
            <div class="d-flex align-items-center gap-3">
                <a href="../dashboard.php" class="btn-back">
                    <i class="fas fa-chevron-left"></i>
                    <span>Volver</span>
                </a>
                <h1><i class="fas fa-robot"></i> AR-12</h1>
            </div>
            <div class="header-actions">
                <span class="version-badge">v0.8.3</span>
            </div>
        </header>

        <!-- Messages Area -->
        <main class="chat-messages" id="chatMessages">
            <div class="message ai">
                <div class="avatar"><i class="fas fa-robot"></i></div>
                <div class="content">
                    <p>Bienvenido, <strong><?php echo htmlspecialchars($userData['username']); ?></strong>. Soy AR-12,
                        tu asistente de IA. ¿En qué puedo ayudarte hoy?</p>
                </div>
            </div>
        </main>

        <!-- Input Area -->
        <footer class="chat-input-area">
            <div class="input-wrapper">
                <form id="chatForm">
                    <textarea id="userInput" placeholder="Escribe tu mensaje aquí..." autocomplete="off"
                        rows="1"></textarea>
                    <div class="input-footer">
                        <div class="model-selector">
                            <button type="button" class="model-button" id="modelButton">
                                <i class="fas fa-brain"></i>
                                <span>AR-12 Mini</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="model-dropdown" id="modelDropdown">
                                <div class="model-option active" data-value="mini">
                                    <div class="model-info">
                                        <div class="model-name">AR-12 Mini (4B)</div>
                                        <div class="model-desc">Rápido y eficiente</div>
                                    </div>
                                    <i class="fas fa-check"></i>
                                </div>
                                <div class="model-option" data-value="standard">
                                    <div class="model-info">
                                        <div class="model-name">AR-12 Standard (12B)</div>
                                        <div class="model-desc">Equilibrio perfecto</div>
                                    </div>
                                </div>
                                <div class="model-option model-pro" data-value="pro">
                                    <div class="model-info">
                                        <div class="model-name">AR-12 Pro (27B)</div>
                                        <div class="model-desc">Máximo rendimiento</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="context-usage">
                            <div class="usage-circle" id="contextCircle">
                                <span id="contextPercent">0%</span>
                            </div>
                            <div class="usage-label">
                                <div class="label-title">Contexto</div>
                                <div class="label-sub" id="contextChars">0 / 2048 tokens</div>
                            </div>
                        </div>
                        <div id="usageInfo" class="usage-badge"></div>
                        <button type="submit" class="btn-send" id="sendBtn">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                    </div>
                </form>
            </div>
        </footer>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="assets/js/chat.js<?php echo v('AR-12/assets/js/chat.js'); ?>"></script>
</body>

</html>
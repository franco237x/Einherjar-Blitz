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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AR-12 Chat - Einherjar Blitz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/dashboard.css">
    <link rel="stylesheet" href="assets/css/chat.css">
</head>
<body class="dark-theme">
    <div class="chat-container">
        <header class="chat-header">
            <div class="d-flex align-items-center">
                <a href="../dashboard.php" class="btn-back me-3"><i class="fas fa-chevron-left"></i> Volver</a>
                <h1 class="m-0"><i class="fas fa-robot"></i> AR-12 Chat</h1>
            </div>
        </header>
        
        <main class="chat-messages" id="chatMessages">
            <div class="message ai">
                <div class="avatar"><i class="fas fa-robot"></i></div>
                <div class="content">
                    Bienvenido, <?php echo htmlspecialchars($userData['username']); ?>. Soy AR-12. ¿En qué puedo ayudarte hoy?
                </div>
            </div>
        </main>
        
        <footer class="chat-input-area">
            <div class="input-wrapper">
                <form id="chatForm">
                    <input type="text" id="userInput" placeholder="Escribe tu mensaje aquí..." autocomplete="off">
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
                                        <div class="model-name">AR-12 Mini</div>
                                        <div class="model-desc">Rápido y eficiente</div>
                                    </div>
                                    <i class="fas fa-check"></i>
                                </div>
                            </div>
                        </div>
                        <div id="usageInfo" class="usage-badge"></div>
                        <button type="submit" class="btn-send"><i class="fas fa-arrow-up"></i></button>
                    </div>
                </form>
            </div>
        </footer>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="assets/js/chat.js"></script>
</body>
</html>
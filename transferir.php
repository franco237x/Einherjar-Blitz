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

$db = Database::getInstance();
$message = '';
$messageType = '';

// Procesar transferencia
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['transfer'])) {
    $recipientUsername = trim($_POST['recipient_username'] ?? '');
    $amount = intval($_POST['amount'] ?? 0);
    $password = $_POST['password'] ?? '';
    
    try {
        // Validaciones básicas
        if (empty($recipientUsername)) {
            throw new Exception('Debes especificar un usuario destinatario');
        }
        
        if ($amount <= 0) {
            throw new Exception('La cantidad debe ser mayor a 0');
        }
        
        if ($amount > $userData['llaves']) {
            throw new Exception('No tienes suficientes llaves para transferir');
        }
        
        if ($recipientUsername === $userData['username']) {
            throw new Exception('No puedes transferir llaves a ti mismo');
        }
        
        if (empty($password)) {
            throw new Exception('Debes confirmar tu contraseña');
        }
        
        // Verificar contraseña del usuario actual
        $stmt = $db->prepare("SELECT password_hash FROM usuarios WHERE id = ?");
        $stmt->execute([$userData['id']]);
        $userAuth = $stmt->fetch();
        
        if (!$userAuth || !password_verify($password, $userAuth['password_hash'])) {
            throw new Exception('Contraseña incorrecta');
        }
        
        // Verificar que el usuario destinatario existe
        $stmt = $db->prepare("SELECT id, username FROM usuarios WHERE username = ? AND is_active = 1");
        $stmt->execute([$recipientUsername]);
        $recipient = $stmt->fetch();
        
        if (!$recipient) {
            throw new Exception('El usuario destinatario no existe');
        }
        
        // Iniciar transacción
        $db->beginTransaction();
        
        // Descontar llaves del remitente
        $stmt = $db->prepare("UPDATE usuarios SET llaves = llaves - ? WHERE id = ?");
        $stmt->execute([$amount, $userData['id']]);
        
        // Añadir llaves al destinatario
        $stmt = $db->prepare("UPDATE usuarios SET llaves = llaves + ? WHERE id = ?");
        $stmt->execute([$amount, $recipient['id']]);
        
        // Registrar la transferencia en transacciones_einherjer
        $stmt = $db->prepare("
            INSERT INTO transacciones_einherjer (user_id, username, tipo, cantidad, descripcion, destinatario) 
            VALUES (?, ?, 'transferencia', ?, ?, ?)
        ");
        $stmt->execute([
            $userData['id'], 
            $userData['username'], 
            $amount, 
            "Transferencia de {$amount} llaves a {$recipientUsername}",
            $recipientUsername
        ]);
        
        // Confirmar transacción
        $db->commit();
        
        // Actualizar datos del usuario en memoria
        $userData['llaves'] -= $amount;
        
        $message = "¡Transferencia exitosa! Has enviado {$amount} llaves a {$recipientUsername}";
        $messageType = 'success';
        
    } catch (Exception $e) {
        // Revertir transacción en caso de error
        if ($db->getConnection()->inTransaction()) {
            $db->rollback();
        }
        
        $message = $e->getMessage();
        $messageType = 'error';
        
        error_log("Transfer error: " . $e->getMessage());
    }
}

// Obtener historial de transferencias recientes (enviadas y recibidas)
$transferHistory = [];
try {
    $stmt = $db->prepare("
        SELECT 
            user_id,
            username as sender_username,
            tipo,
            cantidad,
            descripcion,
            destinatario,
            fecha,
            CASE 
                WHEN user_id = ? THEN 'sent'
                WHEN destinatario = ? THEN 'received'
            END as transfer_type
        FROM transacciones_einherjer
        WHERE (user_id = ? OR destinatario = ?) AND tipo = 'transferencia'
        ORDER BY fecha DESC
        LIMIT 10
    ");
    $stmt->execute([$userData['id'], $userData['username'], $userData['id'], $userData['username']]);
    $transferHistory = $stmt->fetchAll();
} catch (Exception $e) {
    error_log("Error getting transfer history: " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="es" class="h-100">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transferir Llaves - Einherjer Blitz 3.0</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Dashboard CSS -->
    <link rel="stylesheet" href="assets/css/dashboard.css">
    
    <style>
        .transfer-form {
            max-width: 600px;
            margin: 0 auto;
        }
        
        .balance-display {
            background: linear-gradient(135deg, var(--bg-card), var(--bg-secondary));
            border: 1px solid var(--border-gold);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .balance-amount {
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary-gold);
            margin-bottom: 0.5rem;
        }
        
        .transfer-card {
            background: linear-gradient(135deg, var(--bg-card), var(--bg-secondary));
            border: 1px solid var(--border-gold);
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
        }
        
        .form-label {
            color: var(--text-primary) !important;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        
        .form-text {
            color: rgba(255, 255, 255, 0.6) !important;
        }
        
        .form-control {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-gold);
            color: var(--text-primary) !important;
            border-radius: 8px;
            padding: 0.75rem 1rem;
        }
        
        .form-control:focus {
            background: rgba(255, 255, 255, 0.08);
            border-color: var(--primary-gold);
            box-shadow: 0 0 0 0.2rem rgba(201, 170, 113, 0.25);
            color: var(--text-primary) !important;
        }
        
        .form-control::placeholder {
            color: rgba(255, 255, 255, 0.5) !important;
        }
        
        .btn-transfer {
            background: linear-gradient(135deg, var(--primary-gold), var(--dark-gold));
            border: none;
            color: var(--bg-dark);
            font-weight: 600;
            padding: 0.75rem 2rem;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .btn-transfer:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(201, 170, 113, 0.3);
            color: var(--bg-dark);
        }
        
        .btn-back {
            background: transparent;
            border: 1px solid var(--border-gold);
            color: var(--text-primary);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .btn-back:hover {
            background: var(--primary-gold);
            color: var(--bg-dark);
            text-decoration: none;
        }
        
        .alert-custom {
            border: none;
            border-radius: 8px;
            padding: 1rem 1.5rem;
            margin-bottom: 2rem;
        }
        
        .alert-success {
            background: rgba(40, 167, 69, 0.2);
            color: #28a745;
            border-left: 4px solid #28a745;
        }
        
        .alert-error {
            background: rgba(220, 53, 69, 0.2);
            color: #dc3545;
            border-left: 4px solid #dc3545;
        }
        
        .history-section {
            max-width: 800px;
            margin: 2rem auto 0;
        }
        
        .history-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-gold);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 0.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: var(--text-primary) !important;
        }
        
        .history-type-sent {
            border-left: 4px solid #dc3545;
        }
        
        .history-type-received {
            border-left: 4px solid #28a745;
        }
        
        .amount-input-group {
            position: relative;
        }
        
        .quick-amounts {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
            flex-wrap: wrap;
        }
        
        .quick-amount-btn {
            background: rgba(201, 170, 113, 0.2);
            border: 1px solid var(--border-gold);
            color: var(--text-primary) !important;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .quick-amount-btn:hover {
            background: var(--primary-gold);
            color: var(--bg-dark) !important;
        }
        
        /* Asegurar que todo el texto sea visible */
        * {
            color: inherit;
        }
        
        .text-muted {
            color: rgba(255, 255, 255, 0.6) !important;
        }
        
        .breadcrumb-item {
            color: rgba(255, 255, 255, 0.7) !important;
        }
        
        .breadcrumb-item.active {
            color: var(--text-primary) !important;
        }
        
        h1, h2, h3, h4, h5, h6 {
            color: var(--text-primary) !important;
        }
        
        p, div, span {
            color: inherit;
        }
        
        .fw-bold, .strong, strong {
            color: var(--text-primary) !important;
        }
        
        /* Estilos para el autocompletado */
        .autocomplete-container {
            position: relative;
        }
        
        .autocomplete-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--bg-card);
            border: 1px solid var(--border-gold);
            border-top: none;
            border-radius: 0 0 8px 8px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        }
        
        .autocomplete-item {
            padding: 0.75rem 1rem;
            cursor: pointer;
            transition: background-color 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            border-bottom: 1px solid rgba(201, 170, 113, 0.1);
        }
        
        .autocomplete-item:hover,
        .autocomplete-item.selected {
            background: rgba(201, 170, 113, 0.2);
        }
        
        .autocomplete-item:last-child {
            border-bottom: none;
        }
        
        .autocomplete-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 1px solid var(--border-gold);
            object-fit: cover;
        }
        
        .autocomplete-info {
            flex: 1;
        }
        
        .autocomplete-username {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.25rem;
        }
        
        .autocomplete-rank {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
        
        .no-results {
            padding: 1rem;
            text-align: center;
            color: var(--text-secondary);
            font-style: italic;
        }
    </style>
</head>
<body class="d-flex flex-column h-100">
    <!-- Header -->
    <header class="dashboard-header">
        <div class="container-fluid">
            <div class="header-content">
                <div class="brand-section">
                    <a href="dashboard.php" class="brand-link">
                        <i class="fas fa-shield-alt"></i>
                        <span>Einherjer Blitz</span>
                    </a>
                </div>
                
                <div class="user-section">
                    <div class="user-info">
                        <img src="images/<?php echo htmlspecialchars($userData['perfil_imagen']); ?>" 
                             alt="Avatar" class="user-avatar">
                        <div class="user-details">
                            <h4><?php echo htmlspecialchars($userData['username']); ?></h4>
                            <p><?php echo htmlspecialchars($userData['rango']); ?></p>
                        </div>
                    </div>
                    <button class="logout-btn" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Contenido principal -->
    <main class="flex-grow-1">
        <div class="container-fluid py-4">
            
            <!-- Breadcrumb -->
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="dashboard.php" class="text-gold">Dashboard</a></li>
                    <li class="breadcrumb-item active text-light" aria-current="page">Transferir Llaves</li>
                </ol>
            </nav>

            <!-- Título de la página -->
            <div class="text-center mb-4">
                <h1 class="welcome-title">
                    <i class="fas fa-exchange-alt me-2"></i>
                    Transferir Llaves
                </h1>
                <p class="welcome-subtitle">Envía llaves a otros jugadores de forma segura</p>
            </div>

            <!-- Mostrar mensajes -->
            <?php if (!empty($message)): ?>
                <div class="alert alert-custom alert-<?php echo $messageType; ?>">
                    <i class="fas fa-<?php echo $messageType === 'success' ? 'check-circle' : 'exclamation-triangle'; ?> me-2"></i>
                    <?php echo htmlspecialchars($message); ?>
                </div>
            <?php endif; ?>

            <!-- Balance actual -->
            <div class="transfer-form">
                <div class="balance-display">
                    <div class="balance-amount">
                        <i class="fas fa-key me-2"></i>
                        <?php echo number_format($userData['llaves']); ?>
                    </div>
                    <div class="text-muted">Llaves disponibles</div>
                </div>

                <!-- Formulario de transferencia -->
                <div class="transfer-card">
                    <h3 class="mb-4 text-center text-gold">
                        <i class="fas fa-paper-plane me-2"></i>
                        Nueva Transferencia
                    </h3>
                    
                    <form method="POST" id="transferForm">
                        <div class="mb-3">
                            <label for="recipient_username" class="form-label">
                                <i class="fas fa-user me-2"></i>
                                Usuario Destinatario
                            </label>
                            <div class="autocomplete-container">
                                <input type="text" 
                                       class="form-control" 
                                       id="recipient_username" 
                                       name="recipient_username" 
                                       placeholder="Escribe el nombre del usuario..."
                                       required
                                       autocomplete="off">
                                <div class="autocomplete-dropdown" id="autocomplete-dropdown"></div>
                            </div>
                            <div class="form-text text-muted">Escribe al menos 2 caracteres para buscar usuarios</div>
                        </div>

                        <div class="mb-3">
                            <label for="amount" class="form-label">
                                <i class="fas fa-coins me-2"></i>
                                Cantidad de Llaves
                            </label>
                            <div class="amount-input-group">
                                <input type="number" 
                                       class="form-control" 
                                       id="amount" 
                                       name="amount" 
                                       placeholder="Cantidad a transferir"
                                       min="1" 
                                       max="<?php echo $userData['llaves']; ?>"
                                       required>
                                <div class="quick-amounts">
                                    <span class="quick-amount-btn" onclick="setAmount(10)">10</span>
                                    <span class="quick-amount-btn" onclick="setAmount(50)">50</span>
                                    <span class="quick-amount-btn" onclick="setAmount(100)">100</span>
                                    <span class="quick-amount-btn" onclick="setAmount(500)">500</span>
                                    <span class="quick-amount-btn" onclick="setAmount(<?php echo $userData['llaves']; ?>)">Todo</span>
                                </div>
                            </div>
                            <div class="form-text text-muted">Máximo: <?php echo number_format($userData['llaves']); ?> llaves</div>
                        </div>

                        <div class="mb-4">
                            <label for="password" class="form-label">
                                <i class="fas fa-lock me-2"></i>
                                Confirmar Contraseña
                            </label>
                            <input type="password" 
                                   class="form-control" 
                                   id="password" 
                                   name="password" 
                                   placeholder="Tu contraseña actual"
                                   required>
                            <div class="form-text text-muted">Por seguridad, confirma tu contraseña</div>
                        </div>

                        <div class="d-grid gap-2 d-md-flex justify-content-md-center">
                            <a href="dashboard.php" class="btn btn-back me-md-2">
                                <i class="fas fa-arrow-left me-2"></i>
                                Volver
                            </a>
                            <button type="submit" name="transfer" class="btn btn-transfer">
                                <i class="fas fa-paper-plane me-2"></i>
                                Transferir Llaves
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Historial de transferencias -->
            <?php if (!empty($transferHistory)): ?>
            <div class="history-section">
                <div class="glass-card">
                    <h3 class="mb-4 text-center text-gold">
                        <i class="fas fa-history me-2"></i>
                        Historial de Transferencias
                    </h3>
                    <p class="text-center text-muted mb-4">
                        <small>
                            <i class="fas fa-arrow-up text-danger me-2"></i>Enviadas
                            <span class="mx-3">|</span>
                            <i class="fas fa-arrow-down text-success me-2"></i>Recibidas
                        </small>
                    </p>
                    
                    <?php foreach ($transferHistory as $transfer): ?>
                        <?php if ($transfer['transfer_type'] === 'sent'): ?>
                            <div class="history-item history-type-sent">
                                <div>
                                    <div class="d-flex align-items-center mb-1">
                                        <i class="fas fa-arrow-up me-2 text-danger"></i>
                                        <strong>
                                            Enviado a <?php echo htmlspecialchars($transfer['destinatario']); ?>
                                        </strong>
                                    </div>
                                    <small class="text-muted">
                                        <?php echo date('d/m/Y H:i', strtotime($transfer['fecha'])); ?>
                                    </small>
                                </div>
                                <div class="text-end">
                                    <div class="text-danger fw-bold">
                                        -<?php echo number_format($transfer['cantidad']); ?> llaves
                                    </div>
                                </div>
                            </div>
                        <?php else: ?>
                            <div class="history-item history-type-received">
                                <div>
                                    <div class="d-flex align-items-center mb-1">
                                        <i class="fas fa-arrow-down me-2 text-success"></i>
                                        <strong>
                                            Recibido de <?php echo htmlspecialchars($transfer['sender_username']); ?>
                                        </strong>
                                    </div>
                                    <small class="text-muted">
                                        <?php echo date('d/m/Y H:i', strtotime($transfer['fecha'])); ?>
                                    </small>
                                </div>
                                <div class="text-end">
                                    <div class="text-success fw-bold">
                                        +<?php echo number_format($transfer['cantidad']); ?> llaves
                                    </div>
                                </div>
                            </div>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>
        </div>
    </main>

    <!-- Footer -->
    <footer class="footer mt-auto py-3 border-top border-gold-opacity">
        <div class="container-fluid">
            <div class="row align-items-center">
                <div class="col-md-6 text-center text-md-start">
                    <small class="text-muted">
                        &copy; 2024 Einherjer Blitz 3.0. Sistema de Transferencias.
                    </small>
                </div>
                <div class="col-md-6 text-center text-md-end">
                    <small class="text-muted">
                        Sesión: <?php echo htmlspecialchars($userData['username']); ?>
                    </small>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Dashboard JS -->
    <script src="assets/js/dashboard.js"></script>
    
    <script>
        // Variables globales para el autocompletado
        let searchTimeout;
        let selectedIndex = -1;
        let currentResults = [];
        
        // Función para establecer cantidad rápida
        function setAmount(amount) {
            const maxAmount = <?php echo $userData['llaves']; ?>;
            const finalAmount = Math.min(amount, maxAmount);
            document.getElementById('amount').value = finalAmount;
        }
        
        // Sistema de autocompletado
        function initAutocomplete() {
            const input = document.getElementById('recipient_username');
            const dropdown = document.getElementById('autocomplete-dropdown');
            
            input.addEventListener('input', function(e) {
                const query = e.target.value.trim();
                selectedIndex = -1;
                
                if (query.length < 2) {
                    hideDropdown();
                    return;
                }
                
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => searchUsers(query), 300);
            });
            
            input.addEventListener('keydown', function(e) {
                const dropdown = document.getElementById('autocomplete-dropdown');
                const items = dropdown.querySelectorAll('.autocomplete-item');
                
                switch(e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                        updateSelection(items);
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        selectedIndex = Math.max(selectedIndex - 1, -1);
                        updateSelection(items);
                        break;
                    case 'Enter':
                        e.preventDefault();
                        if (selectedIndex >= 0 && items[selectedIndex]) {
                            selectUser(currentResults[selectedIndex]);
                        }
                        break;
                    case 'Escape':
                        hideDropdown();
                        break;
                }
            });
            
            // Cerrar dropdown al hacer click fuera
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.autocomplete-container')) {
                    hideDropdown();
                }
            });
        }
        
        function searchUsers(query) {
            fetch(`api/search_users.php?q=${encodeURIComponent(query)}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(text => {
                    try {
                        const data = JSON.parse(text);
                        if (data.users) {
                            currentResults = data.users;
                            showResults(data.users);
                        } else if (data.error) {
                            console.error('API Error:', data.error);
                            hideDropdown();
                        }
                    } catch (parseError) {
                        console.error('JSON Parse Error:', parseError);
                        console.error('Response text:', text);
                        hideDropdown();
                    }
                })
                .catch(error => {
                    console.error('Fetch Error:', error);
                    hideDropdown();
                });
        }
        
        function showResults(users) {
            const dropdown = document.getElementById('autocomplete-dropdown');
            
            if (users.length === 0) {
                dropdown.innerHTML = '<div class="no-results">No se encontraron usuarios</div>';
            } else {
                dropdown.innerHTML = users.map((user, index) => `
                    <div class="autocomplete-item" data-index="${index}" onclick="selectUser(currentResults[${index}])">
                        <img src="images/${user.avatar}" alt="Avatar" class="autocomplete-avatar">
                        <div class="autocomplete-info">
                            <div class="autocomplete-username">${user.username}</div>
                            <div class="autocomplete-rank">${user.rango}</div>
                        </div>
                    </div>
                `).join('');
            }
            
            dropdown.style.display = 'block';
            selectedIndex = -1;
        }
        
        function updateSelection(items) {
            items.forEach((item, index) => {
                item.classList.toggle('selected', index === selectedIndex);
            });
        }
        
        function selectUser(user) {
            document.getElementById('recipient_username').value = user.username;
            hideDropdown();
        }
        
        function hideDropdown() {
            document.getElementById('autocomplete-dropdown').style.display = 'none';
            selectedIndex = -1;
            currentResults = [];
        }
        
        // Validación del formulario
        document.getElementById('transferForm').addEventListener('submit', function(e) {
            const amount = parseInt(document.getElementById('amount').value);
            const maxAmount = <?php echo $userData['llaves']; ?>;
            const recipientUsername = document.getElementById('recipient_username').value.trim();
            const currentUsername = "<?php echo addslashes($userData['username']); ?>";
            
            if (amount > maxAmount) {
                e.preventDefault();
                alert('No puedes transferir más llaves de las que tienes disponibles.');
                return;
            }
            
            if (recipientUsername.toLowerCase() === currentUsername.toLowerCase()) {
                e.preventDefault();
                alert('No puedes transferir llaves a ti mismo.');
                return;
            }
            
            if (!confirm(`¿Estás seguro de que quieres transferir ${amount} llaves a ${recipientUsername}?`)) {
                e.preventDefault();
                return;
            }
        });
        
        // Inicializar cuando se cargue la página
        document.addEventListener('DOMContentLoaded', function() {
            initAutocomplete();
        });
    </script>
</body>
</html>

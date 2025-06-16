<?php
require_once 'includes/Database.php';

$auth = new AuthController();
$sessionManager = SessionManager::getInstance();

// Si ya está autenticado, redirigir al dashboard
if ($auth->isAuthenticated()) {
    header('Location: dashboard.php');
    exit();
}

$loginError = '';
$registerSuccess = '';

// Procesar login y registro
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    
    $action = $_POST['action'] ?? '';
    
    if ($action === 'login') {
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        $useUniqueId = isset($_POST['use_unique_id']) && $_POST['use_unique_id'] === 'true';
        
        if (empty($username) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Usuario y contraseña son requeridos']);
            exit();
        }
        
        $success = false;
        if ($useUniqueId) {
            $success = $auth->loginWithUniqueId($username, $password);
        } else {
            $success = $auth->login($username, $password);
        }
        
        if ($success) {
            echo json_encode([
                'success' => true, 
                'message' => 'Login exitoso',
                'redirect' => 'dashboard.php'
            ]);
        } else {
            echo json_encode([
                'success' => false, 
                'message' => $useUniqueId ? 'Usuario o ID único incorrectos' : 'Usuario o contraseña incorrectos'
            ]);
        }
        exit();
    }
    
    if ($action === 'register') {
        $username = trim($_POST['reg_username'] ?? '');
        $email = trim($_POST['reg_email'] ?? '');
        $password = $_POST['reg_password'] ?? '';
        $confirmPassword = $_POST['reg_confirm_password'] ?? '';
        
        if (empty($username) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Usuario y contraseña son requeridos']);
            exit();
        }
        
        if ($password !== $confirmPassword) {
            echo json_encode(['success' => false, 'message' => 'Las contraseñas no coinciden']);
            exit();
        }
        
        if (strlen($password) < 6) {
            echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres']);
            exit();
        }
        
        $result = $auth->register($username, $password, $email);
        echo json_encode($result);
        exit();
    }
}
?>
<!DOCTYPE html>
<html lang="es" class="h-100">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Einherjer Blitz 3.0 - Portal del Guerrero</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/main.css">
    
    <!-- Meta tags -->
    <meta name="description" content="Einherjer Blitz 3.0 - El juego de estrategia y combate más épico">
    <meta name="keywords" content="juego, estrategia, combate, einherjer, blitz">
    <meta name="author" content="Einherjer Blitz Team">
    
    <!-- Favicons -->
    <link rel="icon" type="image/png" sizes="32x32" href="images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="images/favicon-16x16.png">
</head>
<body class="d-flex flex-column h-100">
    <!-- Fondo animado y partículas -->
    <div class="animated-bg"></div>
    <div class="particles" id="particles"></div>
    
    <!-- Navbar superior -->
    <nav class="navbar navbar-expand-lg fixed-top glass-nav">
        <div class="container">
            <a class="navbar-brand fw-bold text-gold" href="#">
                <i class="fas fa-shield-alt me-2"></i>
                Einherjer Blitz
            </a>
            <span class="version-badge ms-auto">v3.0</span>
        </div>
    </nav>

    <!-- Contenido principal -->
    <main class="flex-grow-1 d-flex align-items-center py-5">
        <div class="container">
            <!-- Hero Section -->
            <div class="row align-items-center min-vh-100 py-5">
                
                <!-- Columna izquierda - Información del juego -->
                <div class="col-lg-6 col-md-12 text-center text-lg-start mb-5 mb-lg-0">
                    <div class="hero-content">
                        <h1 class="display-1 fw-bold text-gradient mb-4" data-aos="fade-up">
                            EINHERJER<br>BLITZ
                        </h1>
                        <p class="lead text-light-secondary mb-4" data-aos="fade-up" data-aos-delay="100">
                            Portal del Guerrero - Versión 3.0
                        </p>
                        <p class="fs-5 text-light-secondary mb-5" data-aos="fade-up" data-aos-delay="200">
                            Únete a la batalla épica más intensa. Estrategia, combate y gloria te esperan en el reino de los guerreros más poderosos.
                        </p>
                        
                        <!-- Features destacadas -->
                        <div class="row g-3 mb-5" data-aos="fade-up" data-aos-delay="300">
                            <div class="col-sm-6">
                                <div class="feature-item">
                                    <i class="fas fa-sword text-gold me-2"></i>
                                    <span>Combates Épicos</span>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="feature-item">
                                    <i class="fas fa-users text-gold me-2"></i>
                                    <span>Multijugador</span>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="feature-item">
                                    <i class="fas fa-trophy text-gold me-2"></i>
                                    <span>Rankings Globales</span>
                                </div>
                            </div>
                            <div class="col-sm-6">
                                <div class="feature-item">
                                    <i class="fas fa-magic text-gold me-2"></i>
                                    <span>Poderes Únicos</span>
                                </div>
                            </div>
                        </div>

                        <!-- Botón CTA para móvil -->
                        <div class="d-lg-none" data-aos="fade-up" data-aos-delay="400">
                            <button class="btn btn-primary btn-lg w-100" onclick="showMobileAuth()">
                                <i class="fas fa-play me-2"></i>
                                Comenzar Aventura
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Columna derecha - Formulario de autenticación (Desktop) -->
                <div class="col-lg-6 col-md-12 d-none d-lg-block">
                    <div class="auth-container mx-auto" style="max-width: 400px;" data-aos="fade-left">
                        <div class="card glass-card">
                            <div class="card-body p-4">
                                
                                <!-- Header del formulario -->
                                <div class="text-center mb-4">
                                    <h3 class="card-title text-gold fw-bold mb-2">
                                        <i class="fas fa-crown me-2"></i>
                                        Acceso al Reino
                                    </h3>
                                    <p class="text-light-secondary small">
                                        Inicia tu leyenda o crea una nueva
                                    </p>
                                </div>

                                <!-- Tabs de navegación -->
                                <ul class="nav nav-pills nav-fill mb-4" id="authTabs" role="tablist">
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link active" id="login-tab" data-bs-toggle="pill" 
                                                data-bs-target="#login-content" type="button" role="tab">
                                            <i class="fas fa-sign-in-alt me-1"></i>
                                            Entrar
                                        </button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="register-tab" data-bs-toggle="pill" 
                                                data-bs-target="#register-content" type="button" role="tab">
                                            <i class="fas fa-user-plus me-1"></i>
                                            Registrar
                                        </button>
                                    </li>
                                </ul>

                                <!-- Contenido de las tabs -->
                                <div class="tab-content" id="authTabContent">
                                    
                                    <!-- Tab de Login -->
                                    <div class="tab-pane fade show active" id="login-content" role="tabpanel">
                                        <form id="loginForm" onsubmit="handleLogin(event)">
                                            
                                            <!-- Campo usuario -->
                                            <div class="mb-3">
                                                <label class="form-label text-light">
                                                    <i class="fas fa-user me-1"></i>
                                                    Usuario
                                                </label>
                                                <input type="text" class="form-control form-control-dark" 
                                                       name="username" placeholder="Tu nombre de usuario" required>
                                            </div>

                                            <!-- Campo contraseña -->
                                            <div class="mb-3">
                                                <label class="form-label text-light" id="passwordLabel">
                                                    <i class="fas fa-lock me-1"></i>
                                                    Contraseña
                                                </label>
                                                <div class="input-group">
                                                    <input type="password" class="form-control form-control-dark" 
                                                           name="password" id="passwordField" placeholder="Tu contraseña" required>
                                                    <button class="btn btn-outline-secondary" type="button" 
                                                            onclick="togglePassword('passwordField')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            <!-- Checkbox ID único -->
                                            <div class="form-check mb-3">
                                                <input class="form-check-input" type="checkbox" id="useUniqueId" 
                                                       onchange="togglePasswordMode()">
                                                <label class="form-check-label text-light-secondary small" for="useUniqueId">
                                                    Usar ID único (usuarios antiguos)
                                                </label>
                                            </div>

                                            <!-- Botón submit -->
                                            <button type="submit" class="btn btn-primary w-100 mb-3" id="loginBtn">
                                                <i class="fas fa-sign-in-alt me-2"></i>
                                                Iniciar Sesión
                                                <span class="spinner-border spinner-border-sm ms-2 d-none" id="loginSpinner"></span>
                                            </button>
                                        </form>
                                    </div>

                                    <!-- Tab de Registro -->
                                    <div class="tab-pane fade" id="register-content" role="tabpanel">
                                        <form id="registerForm" onsubmit="handleRegister(event)">
                                            
                                            <!-- Campo usuario -->
                                            <div class="mb-3">
                                                <label class="form-label text-light">
                                                    <i class="fas fa-user me-1"></i>
                                                    Nombre de Usuario
                                                </label>
                                                <input type="text" class="form-control form-control-dark" 
                                                       name="reg_username" placeholder="Elige tu nombre de guerrero" required>
                                            </div>

                                            <!-- Campo email -->
                                            <div class="mb-3">
                                                <label class="form-label text-light">
                                                    <i class="fas fa-envelope me-1"></i>
                                                    Email <small class="text-muted">(opcional)</small>
                                                </label>
                                                <input type="email" class="form-control form-control-dark" 
                                                       name="reg_email" placeholder="tu.email@ejemplo.com">
                                            </div>

                                            <!-- Campo contraseña -->
                                            <div class="mb-3">
                                                <label class="form-label text-light">
                                                    <i class="fas fa-lock me-1"></i>
                                                    Contraseña
                                                </label>
                                                <div class="input-group">
                                                    <input type="password" class="form-control form-control-dark" 
                                                           name="reg_password" id="regPasswordField" 
                                                           placeholder="Mínimo 6 caracteres" required>
                                                    <button class="btn btn-outline-secondary" type="button" 
                                                            onclick="togglePassword('regPasswordField')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            <!-- Confirmar contraseña -->
                                            <div class="mb-3">
                                                <label class="form-label text-light">
                                                    <i class="fas fa-check me-1"></i>
                                                    Confirmar Contraseña
                                                </label>
                                                <input type="password" class="form-control form-control-dark" 
                                                       name="reg_confirm_password" placeholder="Repite tu contraseña" required>
                                            </div>

                                            <!-- Botón submit -->
                                            <button type="submit" class="btn btn-primary w-100" id="registerBtn">
                                                <i class="fas fa-user-plus me-2"></i>
                                                Crear Cuenta
                                                <span class="spinner-border spinner-border-sm ms-2 d-none" id="registerSpinner"></span>
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                <!-- Área de alertas -->
                                <div id="alertContainer" class="mt-3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="footer mt-auto py-4 border-top border-gold-opacity">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-6 text-center text-md-start">
                    <p class="mb-0 text-light-secondary">
                        &copy; 2024 Einherjer Blitz 3.0. Todos los derechos reservados.
                    </p>
                </div>
                <div class="col-md-6 text-center text-md-end">
                    <div class="footer-links">
                        <a href="#" class="text-light-secondary text-decoration-none me-3 hover-gold">
                            <i class="fas fa-shield-alt me-1"></i>Términos
                        </a>
                        <a href="#" class="text-light-secondary text-decoration-none me-3 hover-gold">
                            <i class="fas fa-user-secret me-1"></i>Privacidad
                        </a>
                        <a href="#" class="text-light-secondary text-decoration-none hover-gold">
                            <i class="fas fa-question-circle me-1"></i>Ayuda
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </footer>

    <!-- Modal para autenticación móvil -->
    <div class="modal fade" id="mobileAuthModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-fullscreen-sm-down modal-dialog-centered">
            <div class="modal-content bg-dark border-gold">
                <div class="modal-header border-gold-opacity">
                    <h5 class="modal-title text-gold">
                        <i class="fas fa-crown me-2"></i>
                        Acceso al Reino
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    
                    <!-- Tabs móviles -->
                    <ul class="nav nav-pills nav-fill mb-4" id="mobileAuthTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="mobile-login-tab" data-bs-toggle="pill" 
                                    data-bs-target="#mobile-login-content" type="button" role="tab">
                                <i class="fas fa-sign-in-alt me-1"></i>
                                Entrar
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="mobile-register-tab" data-bs-toggle="pill" 
                                    data-bs-target="#mobile-register-content" type="button" role="tab">
                                <i class="fas fa-user-plus me-1"></i>
                                Registrar
                            </button>
                        </li>
                    </ul>

                    <!-- Contenido tabs móviles -->
                    <div class="tab-content" id="mobileAuthTabContent">
                        
                        <!-- Login móvil -->
                        <div class="tab-pane fade show active" id="mobile-login-content" role="tabpanel">
                            <form id="mobileLoginForm" onsubmit="handleMobileLogin(event)">
                                <div class="mb-3">
                                    <label class="form-label text-light">
                                        <i class="fas fa-user me-1"></i>
                                        Usuario
                                    </label>
                                    <input type="text" class="form-control form-control-dark" 
                                           name="username" placeholder="Tu nombre de usuario" required>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label text-light" id="mobilePasswordLabel">
                                        <i class="fas fa-lock me-1"></i>
                                        Contraseña
                                    </label>
                                    <div class="input-group">
                                        <input type="password" class="form-control form-control-dark" 
                                               name="password" id="mobilePasswordField" placeholder="Tu contraseña" required>
                                        <button class="btn btn-outline-secondary" type="button" 
                                                onclick="togglePassword('mobilePasswordField')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="mobileUseUniqueId" 
                                           onchange="toggleMobilePasswordMode()">
                                    <label class="form-check-label text-light-secondary small" for="mobileUseUniqueId">
                                        Usar ID único (usuarios antiguos)
                                    </label>
                                </div>

                                <button type="submit" class="btn btn-primary w-100" id="mobileLoginBtn">
                                    <i class="fas fa-sign-in-alt me-2"></i>
                                    Iniciar Sesión
                                    <span class="spinner-border spinner-border-sm ms-2 d-none" id="mobileLoginSpinner"></span>
                                </button>
                            </form>
                        </div>

                        <!-- Registro móvil -->
                        <div class="tab-pane fade" id="mobile-register-content" role="tabpanel">
                            <form id="mobileRegisterForm" onsubmit="handleMobileRegister(event)">
                                <div class="mb-3">
                                    <label class="form-label text-light">
                                        <i class="fas fa-user me-1"></i>
                                        Nombre de Usuario
                                    </label>
                                    <input type="text" class="form-control form-control-dark" 
                                           name="reg_username" placeholder="Elige tu nombre de guerrero" required>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label text-light">
                                        <i class="fas fa-envelope me-1"></i>
                                        Email <small class="text-muted">(opcional)</small>
                                    </label>
                                    <input type="email" class="form-control form-control-dark" 
                                           name="reg_email" placeholder="tu.email@ejemplo.com">
                                </div>

                                <div class="mb-3">
                                    <label class="form-label text-light">
                                        <i class="fas fa-lock me-1"></i>
                                        Contraseña
                                    </label>
                                    <div class="input-group">
                                        <input type="password" class="form-control form-control-dark" 
                                               name="reg_password" id="mobileRegPasswordField" 
                                               placeholder="Mínimo 6 caracteres" required>
                                        <button class="btn btn-outline-secondary" type="button" 
                                                onclick="togglePassword('mobileRegPasswordField')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label text-light">
                                        <i class="fas fa-check me-1"></i>
                                        Confirmar Contraseña
                                    </label>
                                    <input type="password" class="form-control form-control-dark" 
                                           name="reg_confirm_password" placeholder="Repite tu contraseña" required>
                                </div>

                                <button type="submit" class="btn btn-primary w-100" id="mobileRegisterBtn">
                                    <i class="fas fa-user-plus me-2"></i>
                                    Crear Cuenta
                                    <span class="spinner-border spinner-border-sm ms-2 d-none" id="mobileRegisterSpinner"></span>
                                </button>
                            </form>
                        </div>
                    </div>

                    <!-- Área de alertas móvil -->
                    <div id="mobileAlertContainer" class="mt-3"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- AOS Animation Library -->
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    
    <!-- Custom JavaScript -->
    <script src="assets/js/main.js"></script>
</body>
</html>

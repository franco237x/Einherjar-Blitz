<?php
require_once 'includes/Database.php';
require_once 'includes/version_helper.php';
require_once 'includes/Security.php';

$auth = new AuthController();
$security = Security::getInstance();
$sessionManager = SessionManager::getInstance();

// Establecer headers de seguridad
$security->setSecurityHeaders();

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

    // Validar CSRF token
    $csrfToken = $_POST['csrf_token'] ?? '';
    if (!$security->validateCSRFToken($csrfToken)) {
        echo json_encode(['success' => false, 'message' => 'Token de seguridad inválido. Recarga la página.']);
        exit();
    }

    if ($action === 'login') {
        // Verificar rate limiting
        $rateCheck = $security->checkRateLimit('login', 5, 300);
        if (!$rateCheck['allowed']) {
            echo json_encode([
                'success' => false,
                'message' => $rateCheck['message'],
                'blocked' => true,
                'remaining_seconds' => $rateCheck['remaining_seconds']
            ]);
            exit();
        }

        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        $useUniqueId = isset($_POST['use_unique_id']) && $_POST['use_unique_id'] === 'true';
        $rememberMe = isset($_POST['remember_me']) && $_POST['remember_me'] === 'true';

        if (empty($username) || empty($password)) {
            $security->recordAttempt('login');
            echo json_encode([
                'success' => false,
                'message' => 'Usuario y contraseña son requeridos',
                'attempts_remaining' => $security->getAttemptsRemaining('login')
            ]);
            exit();
        }

        $success = false;
        if ($useUniqueId) {
            $success = $auth->loginWithUniqueId($username, $password);
        } else {
            $success = $auth->login($username, $password);
        }

        if ($success) {
            // Resetear intentos después de login exitoso
            $security->resetAttempts('login');

            // Si "recordarme" está activo, extender la sesión
            if ($rememberMe) {
                // Extender cookie de sesión a 30 días
                $params = session_get_cookie_params();
                setcookie(session_name(), session_id(), [
                    'expires' => time() + (30 * 24 * 60 * 60),
                    'path' => $params['path'],
                    'domain' => $params['domain'],
                    'secure' => $params['secure'],
                    'httponly' => $params['httponly'],
                    'samesite' => 'Lax'
                ]);
            }

            echo json_encode([
                'success' => true,
                'message' => 'Login exitoso',
                'redirect' => 'dashboard.php'
            ]);
        } else {
            $security->recordAttempt('login');
            echo json_encode([
                'success' => false,
                'message' => $useUniqueId ? 'Usuario o ID único incorrectos' : 'Usuario o contraseña incorrectos',
                'attempts_remaining' => $security->getAttemptsRemaining('login')
            ]);
        }
        exit();
    }

    if ($action === 'register') {
        // Rate limiting para registro
        $rateCheck = $security->checkRateLimit('register', 3, 600);
        if (!$rateCheck['allowed']) {
            echo json_encode([
                'success' => false,
                'message' => $rateCheck['message'],
                'blocked' => true
            ]);
            exit();
        }

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

        $security->recordAttempt('register');
        $result = $auth->register($username, $password, $email);
        echo json_encode($result);
        exit();
    }
}

// Generar token CSRF para los formularios
$csrfToken = $security->getCSRFToken();
$attemptsRemaining = $security->getAttemptsRemaining('login');
?>
<!DOCTYPE html>
<html lang="es" class="h-100">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Einherjer Blitz 3.0 - Portal del Guerrero</title>

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
        rel="stylesheet">

    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/main.css<?php echo v('assets/css/main.css'); ?>">

    <!-- Meta tags -->
    <meta name="description" content="Einherjer Blitz 3.0 - El juego de estrategia y combate más épico">
    <meta name="keywords" content="juego, estrategia, combate, einherjer, blitz">
    <meta name="author" content="Einherjer Blitz Team">
    <meta name="theme-color" content="#0a0a0a">

    <!-- PWA -->
    <link rel="manifest" href="manifest.json">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="favicon.png">

    <!-- Google Sign-In -->
    <script src="https://accounts.google.com/gsi/client" async defer></script>
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
            <span class="version-badge">v3.0</span>
        </div>
    </nav>

    <!-- Contenido principal -->
    <main class="flex-grow-1 d-flex align-items-center py-5">
        <div class="container">
            <!-- Hero Section -->
            <div class="row align-items-center min-vh-100 py-5">

                <!-- Columna izquierda - Información del juego -->
                <div class="col-lg-6 col-md-12 text-center text-lg-start mb-4 mb-lg-0">
                    <div class="hero-content">
                        <h1 class="display-1 fw-bold text-gradient mb-3">
                            EINHERJER<br>BLITZ
                        </h1>
                        <p class="lead text-light-secondary mb-3">
                            Portal del Guerrero - Versión 3.0
                        </p>
                        <p class="text-light-secondary mb-4 d-none d-md-block">
                            Únete a la batalla épica más intensa. Estrategia, combate y gloria te esperan en el reino de
                            los guerreros más poderosos.
                        </p>

                        <!-- Features destacadas - Solo en desktop -->
                        <div class="row g-2 mb-4 d-none d-lg-flex">
                            <div class="col-6">
                                <div class="feature-item">
                                    <i class="fas fa-gamepad text-gold"></i>
                                    <span>Combates Épicos</span>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="feature-item">
                                    <i class="fas fa-users text-gold"></i>
                                    <span>Multijugador</span>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="feature-item">
                                    <i class="fas fa-trophy text-gold"></i>
                                    <span>Rankings Globales</span>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="feature-item">
                                    <i class="fas fa-magic text-gold"></i>
                                    <span>Poderes Únicos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Columna derecha - Formulario de autenticación -->
                <div class="col-lg-6 col-md-12">
                    <div class="auth-container mx-auto" style="max-width: 400px;">
                        <div class="card glass-card">
                            <div class="card-body p-4">

                                <!-- Header del formulario -->
                                <div class="text-center mb-4">
                                    <h3 class="card-title text-gold fw-bold mb-2">
                                        <i class="fas fa-crown me-2"></i>
                                        Acceso al Reino
                                    </h3>
                                    <p class="text-light-secondary small mb-0">
                                        Inicia tu leyenda o crea una nueva
                                    </p>
                                </div>

                                <!-- Google Sign-In Button -->
                                <div class="mb-3">
                                    <div id="googleSignInButton" class="d-flex justify-content-center"></div>
                                    <button type="button" class="btn btn-google w-100" id="googleLoginBtn"
                                        style="display: none;">
                                        <svg viewBox="0 0 24 24" width="20" height="20">
                                            <path fill="#4285F4"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        <span>Continuar con Google</span>
                                    </button>
                                </div>

                                <!-- Divider -->
                                <div class="social-divider">
                                    <span>o usa tu cuenta</span>
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
                                        <!-- Rate limit warning -->
                                        <?php if ($attemptsRemaining < 5): ?>
                                            <div class="rate-limit-warning" id="rateLimitWarning">
                                                <i class="fas fa-exclamation-triangle"></i>
                                                <span>Intentos restantes: <strong
                                                        id="attemptsCount"><?php echo $attemptsRemaining; ?></strong></span>
                                            </div>
                                        <?php endif; ?>

                                        <form id="authForm" data-mode="login">
                                            <input type="hidden" name="csrf_token"
                                                value="<?php echo htmlspecialchars($csrfToken); ?>">
                                            <input type="hidden" name="action" value="login">

                                            <!-- Campo usuario -->
                                            <div class="mb-3">
                                                <label class="form-label text-light">
                                                    <i class="fas fa-user me-1"></i>
                                                    Usuario
                                                </label>
                                                <input type="text" class="form-control form-control-dark"
                                                    name="username" id="loginUsername"
                                                    placeholder="Tu nombre de usuario" autocomplete="username" required>
                                            </div>

                                            <!-- Campo contraseña -->
                                            <div class="mb-3">
                                                <label class="form-label text-light" id="passwordLabel">
                                                    <i class="fas fa-lock me-1"></i>
                                                    Contraseña
                                                </label>
                                                <div class="input-group">
                                                    <input type="password" class="form-control form-control-dark"
                                                        name="password" id="loginPassword" placeholder="Tu contraseña"
                                                        autocomplete="current-password" required>
                                                    <button class="btn btn-outline-secondary" type="button"
                                                        onclick="togglePassword('loginPassword')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            <!-- Remember me & Unique ID -->
                                            <div
                                                class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                                <div class="form-check form-check-custom">
                                                    <input class="form-check-input" type="checkbox" id="rememberMe"
                                                        name="remember_me">
                                                    <label class="form-check-label" for="rememberMe">
                                                        Recordarme
                                                    </label>
                                                </div>
                                                <div class="form-check form-check-custom">
                                                    <input class="form-check-input" type="checkbox" id="useUniqueId"
                                                        onchange="togglePasswordMode()">
                                                    <label class="form-check-label" for="useUniqueId">
                                                        Usar ID único
                                                    </label>
                                                </div>
                                            </div>

                                            <!-- Botón submit -->
                                            <button type="submit" class="btn btn-primary w-100 mb-3" id="loginBtn">
                                                <i class="fas fa-sign-in-alt me-2"></i>
                                                Iniciar Sesión
                                                <span class="spinner-border spinner-border-sm ms-2 d-none"
                                                    id="loginSpinner"></span>
                                            </button>

                                            <!-- Enlace de recuperación -->
                                            <div class="text-center">
                                                <a href="reset_password.php"
                                                    class="text-gold text-decoration-none small">
                                                    <i class="fas fa-key me-1"></i>
                                                    ¿Olvidaste tu contraseña?
                                                </a>
                                            </div>
                                        </form>
                                    </div>

                                    <!-- Tab de Registro -->
                                    <div class="tab-pane fade" id="register-content" role="tabpanel">
                                        <form id="registerForm">
                                            <input type="hidden" name="csrf_token"
                                                value="<?php echo htmlspecialchars($csrfToken); ?>">
                                            <input type="hidden" name="action" value="register">

                                            <!-- Campo usuario -->
                                            <div class="mb-3">
                                                <label class="form-label text-light">
                                                    <i class="fas fa-user me-1"></i>
                                                    Nombre de Usuario
                                                </label>
                                                <input type="text" class="form-control form-control-dark"
                                                    name="reg_username" id="regUsername"
                                                    placeholder="Elige tu nombre de guerrero" autocomplete="username"
                                                    required>
                                            </div>

                                            <!-- Campo email -->
                                            <div class="mb-3">
                                                <label class="form-label text-light">
                                                    <i class="fas fa-envelope me-1"></i>
                                                    Email <small class="text-muted">(para recuperar cuenta)</small>
                                                </label>
                                                <input type="email" class="form-control form-control-dark"
                                                    name="reg_email" id="regEmail" placeholder="tu.email@ejemplo.com"
                                                    autocomplete="email">
                                            </div>

                                            <!-- Campo contraseña con indicador de fuerza -->
                                            <div class="mb-3">
                                                <label class="form-label text-light">
                                                    <i class="fas fa-lock me-1"></i>
                                                    Contraseña
                                                </label>
                                                <div class="input-group">
                                                    <input type="password" class="form-control form-control-dark"
                                                        name="reg_password" id="regPassword"
                                                        placeholder="Mínimo 6 caracteres" autocomplete="new-password"
                                                        required>
                                                    <button class="btn btn-outline-secondary" type="button"
                                                        onclick="togglePassword('regPassword')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                                <!-- Password strength indicator -->
                                                <div class="password-strength mt-2" id="passwordStrength"
                                                    style="display: none;">
                                                    <div class="strength-bar">
                                                        <div class="strength-fill" id="strengthFill"></div>
                                                    </div>
                                                    <div class="strength-text" id="strengthText">
                                                        <span id="strengthLabel"></span>
                                                        <span id="strengthHint"></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Confirmar contraseña -->
                                            <div class="mb-3">
                                                <label class="form-label text-light">
                                                    <i class="fas fa-check me-1"></i>
                                                    Confirmar Contraseña
                                                </label>
                                                <input type="password" class="form-control form-control-dark"
                                                    name="reg_confirm_password" id="regConfirmPassword"
                                                    placeholder="Repite tu contraseña" autocomplete="new-password"
                                                    required>
                                            </div>

                                            <!-- Botón submit -->
                                            <button type="submit" class="btn btn-primary w-100" id="registerBtn">
                                                <i class="fas fa-user-plus me-2"></i>
                                                Crear Cuenta
                                                <span class="spinner-border spinner-border-sm ms-2 d-none"
                                                    id="registerSpinner"></span>
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
    <footer class="footer mt-auto py-3 border-top border-gold-opacity">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-6 text-center text-md-start">
                    <p class="mb-0 text-light-secondary small">
                        &copy; 2026 Einherjer Blitz 3.0. Todos los derechos reservados.
                    </p>
                </div>
                <div class="col-md-6 text-center text-md-end d-none d-md-block">
                    <div class="footer-links">
                        <a href="#" class="text-light-secondary text-decoration-none me-3 hover-gold small">
                            <i class="fas fa-shield-alt me-1"></i>Términos
                        </a>
                        <a href="#" class="text-light-secondary text-decoration-none me-3 hover-gold small">
                            <i class="fas fa-user-secret me-1"></i>Privacidad
                        </a>
                        <a href="#" class="text-light-secondary text-decoration-none hover-gold small">
                            <i class="fas fa-question-circle me-1"></i>Ayuda
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

    <!-- AOS Animation Library -->
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>

    <!-- Google Sign-In Configuration -->
    <script>
        // Google Client ID - Replace with your actual client ID
        const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

        window.onload = function () {
            // Initialize Google Sign-In if client ID is configured
            if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
                google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleSignIn,
                    auto_select: false,
                    cancel_on_tap_outside: true
                });

                google.accounts.id.renderButton(
                    document.getElementById('googleSignInButton'),
                    {
                        theme: 'filled_black',
                        size: 'large',
                        width: '100%',
                        text: 'continue_with',
                        shape: 'rectangular',
                        logo_alignment: 'center'
                    }
                );
            } else {
                // Show fallback button if no client ID
                document.getElementById('googleLoginBtn').style.display = 'flex';
                document.getElementById('googleLoginBtn').addEventListener('click', function () {
                    showAlert('Login con Google próximamente disponible', 'warning');
                });
            }
        };

        function handleGoogleSignIn(response) {
            // Send the credential to your server
            fetch('api/google-auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    credential: response.credential,
                    csrf_token: '<?php echo htmlspecialchars($csrfToken); ?>'
                })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showAlert('¡Bienvenido! Redirigiendo...', 'success');
                        setTimeout(() => {
                            window.location.href = data.redirect || 'dashboard.php';
                        }, 1000);
                    } else {
                        showAlert(data.message || 'Error al iniciar sesión con Google', 'danger');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showAlert('Error de conexión', 'danger');
                });
        }
    </script>

    <!-- Custom JavaScript -->
    <script src="assets/js/main.js<?php echo v('assets/js/main.js'); ?>"></script>
</body>

</html>
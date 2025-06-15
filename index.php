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

// Procesar login
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
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Einherjer Blitz - Portal del Guerrero</title>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        :root {
            --primary-gold: #c9aa71;
            --dark-gold: #9e8b54;
            --bg-dark: #0a0a0a;
            --bg-secondary: #1a1a1a;
            --text-primary: rgba(255, 255, 255, 0.95);
            --text-secondary: rgba(255, 255, 255, 0.7);
            --border-gold: rgba(201, 170, 113, 0.3);
            --glow-gold: rgba(201, 170, 113, 0.6);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-dark);
            color: var(--text-primary);
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
        }

        /* Fondo animado */
        .animated-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -2;
            background: linear-gradient(
                45deg,
                #0a0a0a 0%,
                #1a1a1a 25%,
                #0f0f0f 50%,
                #1a1a1a 75%,
                #0a0a0a 100%
            );
            background-size: 400% 400%;
            animation: gradientShift 20s ease infinite;
        }

        @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        /* Partículas flotantes */
        .particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
        }

        .particle {
            position: absolute;
            width: 2px;
            height: 2px;
            background: var(--primary-gold);
            border-radius: 50%;
            opacity: 0.3;
            animation: float 15s infinite linear;
        }

        @keyframes float {
            0% {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 0.3;
            }
            90% {
                opacity: 0.3;
            }
            100% {
                transform: translateY(-10vh) rotate(360deg);
                opacity: 0;
            }
        }

        /* Header principal */
        .main-header {
            text-align: center;
            padding: 4rem 0 2rem;
            position: relative;
        }

        .game-title {
            font-family: 'Cinzel', serif;
            font-size: clamp(3rem, 8vw, 6rem);
            font-weight: 700;
            background: linear-gradient(45deg, var(--primary-gold), #fff, var(--primary-gold));
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-transform: uppercase;
            letter-spacing: 0.5rem;
            margin-bottom: 1rem;
            text-shadow: 0 0 30px var(--glow-gold);
            animation: titleGlow 3s ease-in-out infinite alternate;
        }

        @keyframes titleGlow {
            from {
                filter: drop-shadow(0 0 20px var(--glow-gold));
            }
            to {
                filter: drop-shadow(0 0 40px var(--glow-gold));
            }
        }

        .game-subtitle {
            font-size: 1.5rem;
            color: var(--text-secondary);
            font-weight: 300;
            letter-spacing: 0.2rem;
            margin-bottom: 2rem;
        }

        .version-badge {
            display: inline-block;
            background: rgba(201, 170, 113, 0.1);
            border: 1px solid var(--border-gold);
            padding: 0.5rem 1.5rem;
            border-radius: 25px;
            font-size: 0.9rem;
            color: var(--primary-gold);
            margin-bottom: 3rem;
        }

        /* Contenedor principal */
        .main-container {
            display: flex;
            max-width: 1400px;
            margin: 0 auto;
            gap: 4rem;
            padding: 0 2rem;
            align-items: center;
            min-height: 60vh;
        }

        /* Panel del trono (lado izquierdo) */
        .throne-panel {
            flex: 1;
            text-align: center;
            position: relative;
        }

        .throne-container {
            position: relative;
            width: 300px;
            height: 400px;
            margin: 0 auto;
            perspective: 1000px;
        }

        .throne {
            width: 100%;
            height: 100%;
            background: linear-gradient(
                180deg,
                #2a2a2a 0%,
                #3a3a3a 30%,
                #2a2a2a 70%,
                #1a1a1a 100%
            );
            clip-path: polygon(
                10% 10%,
                20% 10%,
                20% 0%,
                80% 0%,
                80% 10%,
                90% 10%,
                90% 25%,
                95% 25%,
                95% 100%,
                5% 100%,
                5% 25%,
                10% 25%
            );
            border: 2px solid var(--border-gold);
            position: relative;
            transform: rotateX(10deg) rotateY(-5deg);
            transition: all 0.6s ease;
            box-shadow: 
                0 0 30px rgba(0, 0, 0, 0.8),
                inset 0 0 20px rgba(201, 170, 113, 0.1);
        }

        .throne:hover {
            transform: rotateX(0deg) rotateY(0deg) scale(1.05);
            box-shadow: 
                0 0 50px var(--glow-gold),
                inset 0 0 30px rgba(201, 170, 113, 0.2);
        }

        .throne::before {
            content: '';
            position: absolute;
            top: 15%;
            left: 25%;
            right: 25%;
            height: 40%;
            background: linear-gradient(135deg, transparent, rgba(201, 170, 113, 0.1));
            border-radius: 50% 50% 0 0;
        }

        .stairs {
            position: absolute;
            bottom: -20px;
            left: 50%;
            transform: translateX(-50%);
            width: 350px;
            height: 60px;
        }

        .stair {
            width: 100%;
            height: 8px;
            background: linear-gradient(90deg, transparent, var(--bg-secondary), transparent);
            border-bottom: 1px solid var(--border-gold);
            margin-bottom: 4px;
            opacity: 0.7;
        }

        .stair:nth-child(1) { width: 100%; }
        .stair:nth-child(2) { width: 90%; margin: 0 auto 4px; }
        .stair:nth-child(3) { width: 80%; margin: 0 auto 4px; }
        .stair:nth-child(4) { width: 70%; margin: 0 auto 4px; }
        .stair:nth-child(5) { width: 60%; margin: 0 auto 4px; }

        /* Panel de login (lado derecho) */
        .auth-panel {
            flex: 1;
            max-width: 500px;
        }

        .auth-container {
            background: rgba(26, 26, 26, 0.8);
            border: 1px solid var(--border-gold);
            border-radius: 15px;
            padding: 3rem;
            backdrop-filter: blur(10px);
            box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.3),
                0 0 20px rgba(201, 170, 113, 0.1);
            position: relative;
            overflow: hidden;
        }

        .auth-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--primary-gold), transparent);
            opacity: 0.6;
        }

        .auth-header {
            text-align: center;
            margin-bottom: 2.5rem;
        }

        .auth-title {
            font-family: 'Cinzel', serif;
            font-size: 2rem;
            color: var(--primary-gold);
            margin-bottom: 0.5rem;
        }

        .auth-subtitle {
            color: var(--text-secondary);
            font-size: 0.95rem;
        }

        /* Pestañas de autenticación */
        .auth-tabs {
            display: flex;
            margin-bottom: 2rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 0.3rem;
        }

        .auth-tab {
            flex: 1;
            padding: 0.8rem;
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.3s ease;
            font-weight: 500;
        }

        .auth-tab.active {
            background: var(--primary-gold);
            color: var(--bg-dark);
        }

        .auth-tab:hover:not(.active) {
            background: rgba(201, 170, 113, 0.1);
            color: var(--text-primary);
        }

        /* Formularios */
        .auth-form {
            display: none;
        }

        .auth-form.active {
            display: block;
        }

        .form-group {
            margin-bottom: 1.5rem;
            position: relative;
        }

        .form-label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
            font-weight: 500;
            font-size: 0.9rem;
        }

        .form-control {
            width: 100%;
            padding: 1rem 1.2rem;
            background: rgba(0, 0, 0, 0.4);
            border: 2px solid rgba(201, 170, 113, 0.2);
            border-radius: 10px;
            color: var(--text-primary);
            font-size: 1rem;
            transition: all 0.3s ease;
        }

        .form-control:focus {
            outline: none;
            border-color: var(--primary-gold);
            box-shadow: 0 0 0 0.2rem rgba(201, 170, 113, 0.1);
            background: rgba(0, 0, 0, 0.6);
        }

        .form-control::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }

        .input-icon {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
            cursor: pointer;
            transition: color 0.3s ease;
        }

        .input-icon:hover {
            color: var(--primary-gold);
        }

        /* Checkbox personalizado */
        .form-check {
            display: flex;
            align-items: center;
            gap: 0.8rem;
            margin-bottom: 1.5rem;
        }

        .form-check-input {
            width: 18px;
            height: 18px;
            border: 2px solid var(--border-gold);
            background: transparent;
            border-radius: 4px;
            cursor: pointer;
            position: relative;
        }

        .form-check-input:checked {
            background: var(--primary-gold);
            border-color: var(--primary-gold);
        }

        .form-check-input:checked::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: var(--bg-dark);
            font-size: 12px;
            font-weight: bold;
        }

        .form-check-label {
            color: var(--text-secondary);
            font-size: 0.9rem;
            cursor: pointer;
        }

        /* Botones */
        .btn-primary {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(45deg, var(--primary-gold), var(--dark-gold));
            border: none;
            border-radius: 10px;
            color: var(--bg-dark);
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            position: relative;
            overflow: hidden;
        }

        .btn-primary::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s ease;
        }

        .btn-primary:hover::before {
            left: 100%;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(201, 170, 113, 0.3);
        }

        .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        /* Alertas */
        .alert {
            padding: 1rem;
            border-radius: 10px;
            margin-bottom: 1rem;
            border: 1px solid;
            animation: slideIn 0.3s ease;
        }

        .alert-success {
            background: rgba(34, 197, 94, 0.1);
            border-color: rgba(34, 197, 94, 0.3);
            color: #22c55e;
        }

        .alert-danger {
            background: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.3);
            color: #ef4444;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Loading spinner */
        .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid var(--bg-dark);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-left: 0.5rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Footer */
        .main-footer {
            text-align: center;
            padding: 3rem 0;
            margin-top: 4rem;
            border-top: 1px solid var(--border-gold);
            color: var(--text-secondary);
        }

        .footer-links {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-bottom: 1rem;
            flex-wrap: wrap;
        }

        .footer-link {
            color: var(--text-secondary);
            text-decoration: none;
            transition: color 0.3s ease;
        }

        .footer-link:hover {
            color: var(--primary-gold);
        }        /* Flecha deslizante */
        .slide-arrow {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 60px;
            background: linear-gradient(45deg, var(--primary-gold), var(--dark-gold));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1000;
            transition: all 0.3s ease;
            animation: arrowBounce 2s ease-in-out infinite;
            box-shadow: 0 4px 20px rgba(201, 170, 113, 0.4);
        }

        .slide-arrow:hover {
            transform: translateX(-50%) scale(1.1);
            box-shadow: 0 6px 30px rgba(201, 170, 113, 0.6);
        }

        .slide-arrow i {
            color: var(--bg-dark);
            font-size: 1.5rem;
            transition: transform 0.3s ease;
        }

        .slide-arrow.active i {
            transform: rotate(180deg);
        }

        @keyframes arrowBounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateX(-50%) translateY(0);
            }
            40% {
                transform: translateX(-50%) translateY(-10px);
            }
            60% {
                transform: translateX(-50%) translateY(-5px);
            }
        }

        /* Panel de login deslizante */
        .auth-slide-panel {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: linear-gradient(135deg, var(--bg-dark) 0%, rgba(26, 26, 26, 0.98) 100%);
            transform: translateY(100%);
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 999;
            overflow-y: auto;
            backdrop-filter: blur(10px);
        }

        .auth-slide-panel.active {
            transform: translateY(0);
        }

        .auth-slide-content {
            padding: 2rem;
            max-width: 400px;
            margin: 0 auto;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .close-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            background: rgba(201, 170, 113, 0.1);
            border: 1px solid var(--border-gold);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: var(--primary-gold);
            transition: all 0.3s ease;
        }

        .close-btn:hover {
            background: var(--primary-gold);
            color: var(--bg-dark);
            transform: rotate(90deg);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .main-container {
                flex-direction: column;
                gap: 2rem;
                text-align: center;
                padding: 0 1rem;
            }

            .game-title {
                font-size: 2.5rem;
                letter-spacing: 0.1rem;
            }

            .game-subtitle {
                font-size: 1.2rem;
            }

            .throne-container {
                width: 200px;
                height: 250px;
            }

            .auth-panel {
                display: none; /* Ocultar en móvil */
            }

            .auth-container {
                padding: 1.5rem;
                border-radius: 20px;
            }

            .auth-title {
                font-size: 1.8rem;
            }

            .form-control {
                padding: 0.8rem 1rem;
                font-size: 16px; /* Evitar zoom en iOS */
                border-radius: 12px;
            }

            .btn-primary {
                padding: 1rem;
                font-size: 1.1rem;
                border-radius: 12px;
            }

            .footer-links {
                flex-direction: column;
                gap: 1rem;
            }

            /* Hacer visible la flecha solo en móvil */
            .slide-arrow {
                display: flex;
            }
        }

        @media (max-width: 480px) {
            .main-header {
                padding: 1.5rem 0 1rem;
            }

            .game-title {
                font-size: 2rem;
                letter-spacing: 0.05rem;
            }

            .version-badge {
                font-size: 0.8rem;
                padding: 0.4rem 1rem;
            }

            .throne-container {
                width: 180px;
                height: 220px;
            }

            .auth-slide-content {
                padding: 1.5rem;
            }

            .auth-container {
                padding: 1.2rem;
            }

            .form-group {
                margin-bottom: 1.2rem;
            }
        }

        @media (min-width: 769px) {
            .slide-arrow {
                display: none; /* Ocultar en desktop */
            }
            
            .auth-slide-panel {
                display: none; /* Usar panel normal en desktop */
            }
        }
    </style>
</head>
<body>
    <div class="animated-bg"></div>
    
    <!-- Partículas flotantes -->
    <div class="particles" id="particles"></div>

    <!-- Header principal -->
    <header class="main-header">
        <h1 class="game-title">Einherjer Blitz</h1>
        <p class="game-subtitle">Portal del Guerrero</p>
        <span class="version-badge">Versión 4.0 - Modernizada</span>
    </header>

    <!-- Contenedor principal -->
    <main class="main-container">
        <!-- Panel del trono -->
        <section class="throne-panel">
            <div class="throne-container">
                <div class="throne"></div>
                <div class="stairs">
                    <div class="stair"></div>
                    <div class="stair"></div>
                    <div class="stair"></div>
                    <div class="stair"></div>
                    <div class="stair"></div>
                </div>
            </div>
            <h2 style="color: var(--primary-gold); margin-top: 2rem; font-family: 'Cinzel', serif;">
                El Trono te Espera
            </h2>
            <p style="color: var(--text-secondary); margin-top: 1rem;">
                Únete a la batalla épica y reclama tu lugar entre los guerreros más poderosos
            </p>
        </section>

        <!-- Panel de autenticación -->
        <section class="auth-panel">
            <div class="auth-container">
                <div class="auth-header">
                    <h2 class="auth-title">Acceso al Reino</h2>
                    <p class="auth-subtitle">Inicia tu viaje o crea una nueva leyenda</p>
                </div>

                <!-- Pestañas -->
                <div class="auth-tabs">
                    <button class="auth-tab active" onclick="switchTab('login')">
                        <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                    </button>
                    <button class="auth-tab" onclick="switchTab('register')">
                        <i class="fas fa-user-plus"></i> Registrarse
                    </button>
                </div>

                <!-- Contenedor de alertas -->
                <div id="alertContainer"></div>

                <!-- Formulario de Login -->
                <form class="auth-form active" id="loginForm" onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-user"></i> Nombre de Usuario
                        </label>
                        <input type="text" class="form-control" name="username" placeholder="Ingresa tu nombre de usuario" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-key"></i> <span id="passwordLabel">Contraseña</span>
                        </label>
                        <div style="position: relative;">
                            <input type="password" class="form-control" name="password" id="passwordField" placeholder="Ingresa tu contraseña" required>
                            <i class="fas fa-eye input-icon" id="togglePassword" onclick="togglePasswordVisibility()"></i>
                        </div>
                    </div>

                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="useUniqueId" onchange="togglePasswordMode()">
                        <label class="form-check-label" for="useUniqueId">
                            Usar ID único (usuarios antiguos)
                        </label>
                    </div>

                    <button type="submit" class="btn-primary" id="loginBtn">
                        <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                        <span class="spinner d-none" id="loginSpinner"></span>
                    </button>
                </form>

                <!-- Formulario de Registro -->
                <form class="auth-form" id="registerForm" onsubmit="handleRegister(event)">
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-user"></i> Nombre de Usuario
                        </label>
                        <input type="text" class="form-control" name="reg_username" placeholder="Elige tu nombre de guerrero" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-envelope"></i> Email (opcional)
                        </label>
                        <input type="email" class="form-control" name="reg_email" placeholder="tu.email@ejemplo.com">
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-lock"></i> Contraseña
                        </label>
                        <div style="position: relative;">
                            <input type="password" class="form-control" name="reg_password" id="regPasswordField" placeholder="Crea una contraseña segura" required>
                            <i class="fas fa-eye input-icon" onclick="toggleRegPasswordVisibility()"></i>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-lock"></i> Confirmar Contraseña
                        </label>
                        <input type="password" class="form-control" name="reg_confirm_password" placeholder="Confirma tu contraseña" required>
                    </div>

                    <button type="submit" class="btn-primary" id="registerBtn">
                        <i class="fas fa-user-plus"></i> Crear Cuenta
                        <span class="spinner d-none" id="registerSpinner"></span>
                    </button>
                </form>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="main-footer">
        <div class="footer-links">
            <a href="#" class="footer-link">
                <i class="fas fa-shield-alt"></i> Términos de Servicio
            </a>
            <a href="#" class="footer-link">
                <i class="fas fa-user-secret"></i> Política de Privacidad
            </a>
            <a href="#" class="footer-link">
                <i class="fas fa-question-circle"></i> Ayuda
            </a>
            <a href="#" class="footer-link">
                <i class="fas fa-envelope"></i> Contacto
            </a>
        </div>
        <p>&copy; 2024 Einherjer Blitz. Todos los derechos reservados.</p>    </footer>

    <!-- Flecha deslizante para móvil -->
    <div class="slide-arrow" id="slideArrow" onclick="toggleMobileLogin()">
        <i class="fas fa-chevron-up"></i>
    </div>

    <!-- Panel de login deslizante para móvil -->
    <div class="auth-slide-panel" id="authSlidePanel">
        <div class="auth-slide-content">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h3 style="color: var(--primary-gold); font-family: 'Cinzel', serif; margin: 0;">
                    <i class="fas fa-sword"></i> Acceso al Reino
                </h3>
                <button class="close-btn" onclick="toggleMobileLogin()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="auth-container">
                <!-- Pestañas móviles -->
                <div class="auth-tabs">
                    <button class="auth-tab active" onclick="switchMobileTab('login')">
                        <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                    </button>
                    <button class="auth-tab" onclick="switchMobileTab('register')">
                        <i class="fas fa-user-plus"></i> Registrarse
                    </button>
                </div>

                <!-- Contenedor de alertas móvil -->
                <div id="mobileAlertContainer"></div>

                <!-- Formulario de Login móvil -->
                <form class="auth-form active" id="mobileLoginForm" onsubmit="handleMobileLogin(event)">
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-user"></i> Nombre de Usuario
                        </label>
                        <input type="text" class="form-control" name="username" placeholder="Ingresa tu nombre de usuario" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-key"></i> <span id="mobilePasswordLabel">Contraseña</span>
                        </label>
                        <div style="position: relative;">
                            <input type="password" class="form-control" name="password" id="mobilePasswordField" placeholder="Ingresa tu contraseña" required>
                            <i class="fas fa-eye input-icon" id="mobileTogglePassword" onclick="toggleMobilePasswordVisibility()"></i>
                        </div>
                    </div>

                    <div class="form-check mb-3">
                        <input type="checkbox" class="form-check-input" id="mobileUseUniqueId" onchange="toggleMobilePasswordMode()">
                        <label class="form-check-label" for="mobileUseUniqueId" style="color: var(--text-secondary);">
                            Usar ID único (usuarios antiguos)
                        </label>
                    </div>

                    <button type="submit" class="btn-primary w-100" id="mobileLoginBtn">
                        <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                        <span class="spinner d-none" id="mobileLoginSpinner"></span>
                    </button>
                </form>

                <!-- Formulario de Registro móvil -->
                <form class="auth-form" id="mobileRegisterForm" onsubmit="handleMobileRegister(event)">
                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-user"></i> Nombre de Usuario
                        </label>
                        <input type="text" class="form-control" name="reg_username" placeholder="Elige tu nombre de guerrero" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-envelope"></i> Email (opcional)
                        </label>
                        <input type="email" class="form-control" name="reg_email" placeholder="tu.email@ejemplo.com">
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-lock"></i> Contraseña
                        </label>
                        <div style="position: relative;">
                            <input type="password" class="form-control" name="reg_password" id="mobileRegPasswordField" placeholder="Crea una contraseña segura" required>
                            <i class="fas fa-eye input-icon" onclick="toggleMobileRegPasswordVisibility()"></i>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <i class="fas fa-lock"></i> Confirmar Contraseña
                        </label>
                        <input type="password" class="form-control" name="reg_confirm_password" placeholder="Confirma tu contraseña" required>
                    </div>

                    <button type="submit" class="btn-primary w-100" id="mobileRegisterBtn">
                        <i class="fas fa-user-plus"></i> Crear Cuenta
                        <span class="spinner d-none" id="mobileRegisterSpinner"></span>
                    </button>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Crear partículas flotantes
        function createParticles() {
            const particlesContainer = document.getElementById('particles');
            const particleCount = 50;

            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 15 + 's';
                particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
                particlesContainer.appendChild(particle);
            }
        }

        // Cambiar entre pestañas
        function switchTab(tab) {
            // Actualizar pestañas
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');

            // Actualizar formularios
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            document.getElementById(tab + 'Form').classList.add('active');

            // Limpiar alertas
            clearAlerts();
        }

        // Alternar visibilidad de contraseña
        function togglePasswordVisibility() {
            const passwordField = document.getElementById('passwordField');
            const toggleIcon = document.getElementById('togglePassword');

            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                toggleIcon.className = 'fas fa-eye-slash input-icon';
            } else {
                passwordField.type = 'password';
                toggleIcon.className = 'fas fa-eye input-icon';
            }
        }

        function toggleRegPasswordVisibility() {
            const passwordField = document.getElementById('regPasswordField');
            const toggleIcon = passwordField.nextElementSibling;

            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                toggleIcon.className = 'fas fa-eye-slash input-icon';
            } else {
                passwordField.type = 'password';
                toggleIcon.className = 'fas fa-eye input-icon';
            }
        }

        // Alternar modo de contraseña para usuarios antiguos
        function togglePasswordMode() {
            const useUniqueId = document.getElementById('useUniqueId').checked;
            const passwordLabel = document.getElementById('passwordLabel');
            const passwordField = document.getElementById('passwordField');

            if (useUniqueId) {
                passwordLabel.innerHTML = '<i class="fas fa-fingerprint"></i> ID Único';
                passwordField.placeholder = 'Ingresa tu ID único';
            } else {
                passwordLabel.innerHTML = '<i class="fas fa-key"></i> Contraseña';
                passwordField.placeholder = 'Ingresa tu contraseña';
            }
        }

        // Mostrar alerta
        function showAlert(message, type = 'danger') {
            const alertContainer = document.getElementById('alertContainer');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i> ${message}`;
            
            alertContainer.innerHTML = '';
            alertContainer.appendChild(alert);

            setTimeout(() => {
                alert.remove();
            }, 5000);
        }

        // Limpiar alertas
        function clearAlerts() {
            document.getElementById('alertContainer').innerHTML = '';
        }

        // Manejar login
        async function handleLogin(event) {
            event.preventDefault();
            
            const loginBtn = document.getElementById('loginBtn');
            const loginSpinner = document.getElementById('loginSpinner');
            const formData = new FormData(event.target);
            
            // Agregar campos adicionales
            formData.append('action', 'login');
            formData.append('use_unique_id', document.getElementById('useUniqueId').checked);

            // Mostrar loading
            loginBtn.disabled = true;
            loginSpinner.classList.remove('d-none');
            clearAlerts();

            try {
                const response = await fetch('index.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    showAlert('¡Bienvenido de vuelta, guerrero!', 'success');
                    setTimeout(() => {
                        window.location.href = result.redirect;
                    }, 1500);
                } else {
                    showAlert(result.message);
                }
            } catch (error) {
                showAlert('Error de conexión. Inténtalo de nuevo.');
            } finally {
                loginBtn.disabled = false;
                loginSpinner.classList.add('d-none');
            }
        }

        // Manejar registro
        async function handleRegister(event) {
            event.preventDefault();
            
            const registerBtn = document.getElementById('registerBtn');
            const registerSpinner = document.getElementById('registerSpinner');
            const formData = new FormData(event.target);
            
            formData.append('action', 'register');

            // Mostrar loading
            registerBtn.disabled = true;
            registerSpinner.classList.remove('d-none');
            clearAlerts();

            try {
                const response = await fetch('index.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    showAlert(`¡Cuenta creada exitosamente! Tu ID único es: ${result.unique_id}. Guárdalo bien.`, 'success');
                    setTimeout(() => {
                        switchTab('login');
                        // Pre-llenar el formulario de login
                        document.querySelector('#loginForm [name="username"]').value = formData.get('reg_username');
                    }, 3000);
                } else {
                    showAlert(result.message);
                }
            } catch (error) {
                showAlert('Error de conexión. Inténtalo de nuevo.');
            } finally {
                registerBtn.disabled = false;
                registerSpinner.classList.add('d-none');
            }
        }

        // Efectos visuales para el trono
        document.querySelector('.throne').addEventListener('mouseenter', function() {
            this.style.animation = 'throneGlow 2s ease-in-out infinite alternate';
        });

        document.querySelector('.throne').addEventListener('mouseleave', function() {
            this.style.animation = '';
        });

        // Inicializar la página
        document.addEventListener('DOMContentLoaded', function() {
            createParticles();
            
            // Animación de entrada
            document.body.style.opacity = '0';
            setTimeout(() => {
                document.body.style.transition = 'opacity 1s ease';
                document.body.style.opacity = '1';
            }, 100);
        });        // Funciones para el login móvil
        function toggleMobileLogin() {
            const panel = document.getElementById('authSlidePanel');
            const arrow = document.getElementById('slideArrow');
            
            panel.classList.toggle('active');
            arrow.classList.toggle('active');
        }

        function switchMobileTab(tab) {
            // Actualizar pestañas móviles
            document.querySelectorAll('.auth-slide-panel .auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelector(`.auth-slide-panel [onclick="switchMobileTab('${tab}')"]`).classList.add('active');

            // Actualizar formularios móviles
            document.querySelectorAll('.auth-slide-panel .auth-form').forEach(f => f.classList.remove('active'));
            document.getElementById('mobile' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Form').classList.add('active');

            // Limpiar alertas móviles
            clearMobileAlerts();
        }

        function toggleMobilePasswordVisibility() {
            const passwordField = document.getElementById('mobilePasswordField');
            const toggleIcon = document.getElementById('mobileTogglePassword');

            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                toggleIcon.className = 'fas fa-eye-slash input-icon';
            } else {
                passwordField.type = 'password';
                toggleIcon.className = 'fas fa-eye input-icon';
            }
        }

        function toggleMobileRegPasswordVisibility() {
            const passwordField = document.getElementById('mobileRegPasswordField');
            const toggleIcon = passwordField.nextElementSibling;

            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                toggleIcon.className = 'fas fa-eye-slash input-icon';
            } else {
                passwordField.type = 'password';
                toggleIcon.className = 'fas fa-eye input-icon';
            }
        }

        function toggleMobilePasswordMode() {
            const useUniqueId = document.getElementById('mobileUseUniqueId').checked;
            const passwordLabel = document.getElementById('mobilePasswordLabel');
            const passwordField = document.getElementById('mobilePasswordField');

            if (useUniqueId) {
                passwordLabel.innerHTML = 'ID Único';
                passwordField.placeholder = 'Ingresa tu ID único';
            } else {
                passwordLabel.innerHTML = 'Contraseña';
                passwordField.placeholder = 'Ingresa tu contraseña';
            }
        }

        function showMobileAlert(message, type = 'danger') {
            const alertContainer = document.getElementById('mobileAlertContainer');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i> ${message}`;
            
            alertContainer.innerHTML = '';
            alertContainer.appendChild(alert);

            setTimeout(() => {
                alert.remove();
            }, 5000);
        }

        function clearMobileAlerts() {
            document.getElementById('mobileAlertContainer').innerHTML = '';
        }

        async function handleMobileLogin(event) {
            event.preventDefault();
            
            const loginBtn = document.getElementById('mobileLoginBtn');
            const loginSpinner = document.getElementById('mobileLoginSpinner');
            const formData = new FormData(event.target);
            
            formData.append('action', 'login');
            formData.append('use_unique_id', document.getElementById('mobileUseUniqueId').checked);

            loginBtn.disabled = true;
            loginSpinner.classList.remove('d-none');
            clearMobileAlerts();

            try {
                const response = await fetch('index.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    showMobileAlert('¡Bienvenido de vuelta, guerrero!', 'success');
                    setTimeout(() => {
                        window.location.href = result.redirect;
                    }, 1500);
                } else {
                    showMobileAlert(result.message);
                }
            } catch (error) {
                showMobileAlert('Error de conexión. Inténtalo de nuevo.');
            } finally {
                loginBtn.disabled = false;
                loginSpinner.classList.add('d-none');
            }
        }

        async function handleMobileRegister(event) {
            event.preventDefault();
            
            const registerBtn = document.getElementById('mobileRegisterBtn');
            const registerSpinner = document.getElementById('mobileRegisterSpinner');
            const formData = new FormData(event.target);
            
            formData.append('action', 'register');

            registerBtn.disabled = true;
            registerSpinner.classList.remove('d-none');
            clearMobileAlerts();

            try {
                const response = await fetch('index.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    showMobileAlert(`¡Cuenta creada exitosamente! Tu ID único es: ${result.unique_id}. Guárdalo bien.`, 'success');
                    setTimeout(() => {
                        switchMobileTab('login');
                        document.querySelector('#mobileLoginForm [name="username"]').value = formData.get('reg_username');
                    }, 3000);
                } else {
                    showMobileAlert(result.message);
                }
            } catch (error) {
                showMobileAlert('Error de conexión. Inténtalo de nuevo.');
            } finally {
                registerBtn.disabled = false;
                registerSpinner.classList.add('d-none');
            }
        }

        // Agregar animación al trono
        const style = document.createElement('style');
        style.textContent = `
            @keyframes throneGlow {
                0%, 100% {
                    box-shadow: 0 0 50px var(--glow-gold), inset 0 0 30px rgba(201, 170, 113, 0.2);
                    filter: brightness(1.2);
                }
                50% {
                    box-shadow: 0 0 80px var(--glow-gold), inset 0 0 50px rgba(201, 170, 113, 0.4);
                    filter: brightness(1.5);
                }
            }
        `;
        document.head.appendChild(style);
    </script>
</body>
</html>

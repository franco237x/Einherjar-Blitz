<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva Contraseña - Einherjar Blitz</title>
    <!-- FontAwesome para iconos -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
            overflow-x: hidden;
        }

        body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="1" fill="%23FFD700" opacity="0.3"/><circle cx="80" cy="30" r="0.5" fill="%23FFA500" opacity="0.5"/><circle cx="40" cy="70" r="0.8" fill="%23FFD700" opacity="0.4"/><circle cx="90" cy="80" r="0.6" fill="%23FF8C00" opacity="0.3"/></svg>');
            animation: twinkle 3s ease-in-out infinite alternate;
            pointer-events: none;
        }

        @keyframes twinkle {
            0% { opacity: 0.3; }
            100% { opacity: 0.8; }
        }

        .reset-container {
            background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.5),
                0 0 30px rgba(255, 215, 0, 0.2),
                inset 0 1px 0 rgba(255, 215, 0, 0.2);
            width: 100%;
            max-width: 500px;
            text-align: center;
            border: 2px solid rgba(255, 215, 0, 0.3);
            position: relative;
            z-index: 2;
        }

        .logo {
            width: 100px;
            height: 100px;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #FFD700, #FFA500, #FF8C00);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000;
            font-size: 28px;
            font-weight: bold;
            box-shadow: 
                0 10px 30px rgba(255, 215, 0, 0.4),
                0 0 20px rgba(255, 215, 0, 0.3);
            animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
            from { box-shadow: 0 10px 30px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.3); }
            to { box-shadow: 0 10px 40px rgba(255, 215, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.5); }
        }

        h1 {
            color: #FFD700;
            margin-bottom: 10px;
            font-size: 28px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            font-weight: bold;
        }

        .subtitle {
            color: #e0e0e0;
            margin-bottom: 30px;
            font-size: 16px;
            line-height: 1.5;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        }

        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #FFD700;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        input[type="password"] {
            width: 100%;
            padding: 15px 55px 15px 15px;
            border: 2px solid rgba(255, 215, 0, 0.3);
            border-radius: 10px;
            font-size: 16px;
            background: rgba(15, 15, 15, 0.8);
            color: #e0e0e0;
            transition: all 0.3s ease;
            box-sizing: border-box;
        }

        input[type="text"] {
            width: 100%;
            padding: 15px 55px 15px 15px;
            border: 2px solid rgba(255, 215, 0, 0.3);
            border-radius: 10px;
            font-size: 16px;
            background: rgba(15, 15, 15, 0.8);
            color: #e0e0e0;
            transition: all 0.3s ease;
            box-sizing: border-box;
        }

        input[type="password"]:focus,
        input[type="text"]:focus {
            outline: none;
            border-color: #FFD700;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
            background: rgba(20, 20, 20, 0.9);
        }

        .password-container {
            position: relative;
            display: flex;
            align-items: center;
        }

        .toggle-password {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #FFD700;
            font-size: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 10;
            padding: 8px;
            border-radius: 5px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .toggle-password:hover {
            color: #FFA500;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
            background: rgba(255, 215, 0, 0.1);
        }

        .toggle-password:active {
            transform: translateY(-50%) scale(0.95);
        }

        .password-requirements {
            font-size: 12px;
            color: #ccc;
            margin-top: 8px;
            text-align: left;
            background: rgba(10, 10, 10, 0.6);
            padding: 12px;
            border-radius: 8px;
            border: 1px solid rgba(255, 215, 0, 0.2);
        }

        .requirement {
            display: flex;
            align-items: center;
            margin: 4px 0;
            transition: all 0.3s ease;
        }

        .requirement .check {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #333;
            margin-right: 10px;
            transition: all 0.3s ease;
            border: 2px solid #555;
        }

        .requirement.valid .check {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            border-color: #FFD700;
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        .requirement.valid {
            color: #FFD700;
        }

        .btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #000;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(255, 215, 0, 0.4);
            background: linear-gradient(135deg, #FFA500, #FFD700);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            background: linear-gradient(135deg, #666, #555);
            box-shadow: none;
        }

        .message {
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
            font-weight: 500;
        }

        .message.success {
            background: linear-gradient(135deg, rgba(40, 167, 69, 0.2), rgba(40, 167, 69, 0.1));
            color: #28a745;
            border: 1px solid rgba(40, 167, 69, 0.3);
            box-shadow: 0 0 15px rgba(40, 167, 69, 0.2);
        }

        .message.error {
            background: linear-gradient(135deg, rgba(220, 53, 69, 0.2), rgba(220, 53, 69, 0.1));
            color: #dc3545;
            border: 1px solid rgba(220, 53, 69, 0.3);
            box-shadow: 0 0 15px rgba(220, 53, 69, 0.2);
        }

        .back-link {
            margin-top: 25px;
        }

        .back-link a {
            color: #FFD700;
            text-decoration: none;
            font-size: 14px;
            transition: all 0.3s ease;
            font-weight: 500;
        }

        .back-link a:hover {
            color: #FFA500;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        .loading {
            display: none;
            margin-top: 15px;
            color: #FFD700;
        }

        .spinner {
            border: 3px solid rgba(255, 215, 0, 0.2);
            border-top: 3px solid #FFD700;
            border-radius: 50%;
            width: 25px;
            height: 25px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="reset-container">
        <div class="logo">🗡️</div>
        <h1>Nueva Clave de Guerrero</h1>
        <p class="subtitle">Forja tu nueva contraseña de batalla. Que sea digna de un verdadero guerrero de Einherjar</p>
        
        <div id="message"></div>
        
        <form id="newPasswordForm" action="process_new_password.php" method="POST">
            <input type="hidden" name="token" value="<?php echo htmlspecialchars($_GET['token'] ?? ''); ?>">
            
            <div class="form-group">
                <label for="password">🔐 Nueva Contraseña de Batalla:</label>
                <div class="password-container">
                    <input type="password" id="password" name="password" required placeholder="Crea una clave poderosa...">
                    <button type="button" class="toggle-password" onclick="togglePassword('password', this)">
                        <i class="fas fa-eye" title="Mostrar contraseña"></i>
                    </button>
                </div>
                <div class="password-requirements">
                    <div class="requirement" id="req-length">
                        <span class="check"></span>
                        <span>⚔️ Mínimo 8 caracteres de fuerza</span>
                    </div>
                    <div class="requirement" id="req-uppercase">
                        <span class="check"></span>
                        <span>🛡️ Al menos una mayúscula (A-Z)</span>
                    </div>
                    <div class="requirement" id="req-lowercase">
                        <span class="check"></span>
                        <span>🏹 Al menos una minúscula (a-z)</span>
                    </div>
                    <div class="requirement" id="req-number">
                        <span class="check"></span>
                        <span>💎 Al menos un número (0-9)</span>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label for="confirm_password">🔒 Confirmar Clave de Guerrero:</label>
                <div class="password-container">
                    <input type="password" id="confirm_password" name="confirm_password" required placeholder="Repite tu clave...">
                    <button type="button" class="toggle-password" onclick="togglePassword('confirm_password', this)">
                        <i class="fas fa-eye" title="Mostrar contraseña"></i>
                    </button>
                </div>
            </div>
            
            <button type="submit" class="btn" id="submitBtn" disabled>
                ⚡ Forjar Nueva Contraseña ⚡
            </button>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Forjando nueva contraseña...</p>
            </div>
        </form>
        
        <div class="back-link">
            <a href="index.php">← Regresar al Portal de Guerreros</a>
        </div>
    </div>

    <script>
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm_password');
        const submitBtn = document.getElementById('submitBtn');
        const form = document.getElementById('newPasswordForm');
        
        // Función para toggle de contraseña
        function togglePassword(inputId, button) {
            const input = document.getElementById(inputId);
            const icon = button.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
                icon.title = 'Ocultar contraseña';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
                icon.title = 'Mostrar contraseña';
            }
        }
        
        // Validación de contraseña en tiempo real
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            
            // Validar longitud
            const lengthReq = document.getElementById('req-length');
            if (password.length >= 8) {
                lengthReq.classList.add('valid');
            } else {
                lengthReq.classList.remove('valid');
            }
            
            // Validar mayúscula
            const uppercaseReq = document.getElementById('req-uppercase');
            if (/[A-Z]/.test(password)) {
                uppercaseReq.classList.add('valid');
            } else {
                uppercaseReq.classList.remove('valid');
            }
            
            // Validar minúscula
            const lowercaseReq = document.getElementById('req-lowercase');
            if (/[a-z]/.test(password)) {
                lowercaseReq.classList.add('valid');
            } else {
                lowercaseReq.classList.remove('valid');
            }
            
            // Validar número
            const numberReq = document.getElementById('req-number');
            if (/[0-9]/.test(password)) {
                numberReq.classList.add('valid');
            } else {
                numberReq.classList.remove('valid');
            }
            
            checkFormValidity();
        });
        
        confirmPasswordInput.addEventListener('input', checkFormValidity);
        
        function checkFormValidity() {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            const isPasswordValid = password.length >= 8 && 
                                  /[A-Z]/.test(password) && 
                                  /[a-z]/.test(password) && 
                                  /[0-9]/.test(password);
            
            const passwordsMatch = password === confirmPassword && password.length > 0;
            
            submitBtn.disabled = !(isPasswordValid && passwordsMatch);
        }
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const loading = document.getElementById('loading');
            const messageDiv = document.getElementById('message');
            
            // Limpiar mensajes anteriores
            messageDiv.innerHTML = '';
            
            // Mostrar loading
            submitBtn.disabled = true;
            loading.style.display = 'block';
            
            // Enviar formulario
            fetch(form.action, {
                method: 'POST',
                body: new FormData(form)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    messageDiv.innerHTML = '<div class="message success">' + data.message + '</div>';
                    setTimeout(() => {
                        window.location.href = 'index.php';
                    }, 2000);
                } else {
                    messageDiv.innerHTML = '<div class="message error">' + data.message + '</div>';
                    submitBtn.disabled = false;
                }
            })
            .catch(error => {
                messageDiv.innerHTML = '<div class="message error">Error de conexión. Por favor, intenta de nuevo.</div>';
                submitBtn.disabled = false;
            })
            .finally(() => {
                loading.style.display = 'none';
            });
        });
        
        // Verificar token al cargar la página
        window.addEventListener('load', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            
            if (!token) {
                document.getElementById('message').innerHTML = '<div class="message error">Token inválido o expirado</div>';
                document.getElementById('newPasswordForm').style.display = 'none';
            }
        });
    </script>
</body>
</html>

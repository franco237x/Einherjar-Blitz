<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperar Contraseña - Einherjar Blitz</title>
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
            max-width: 450px;
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

        input[type="email"] {
            width: 100%;
            padding: 15px;
            border: 2px solid rgba(255, 215, 0, 0.3);
            border-radius: 10px;
            font-size: 16px;
            background: rgba(15, 15, 15, 0.8);
            color: #e0e0e0;
            transition: all 0.3s ease;
            box-sizing: border-box;
        }

        input[type="email"]:focus {
            outline: none;
            border-color: #FFD700;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
            background: rgba(20, 20, 20, 0.9);
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
            background: #666;
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
        <div class="logo">⚔️</div>
        <h1>Recuperación de Acceso</h1>
        <p class="subtitle">Has olvidado tu clave de guerrero. Ingresa tu email para recibir un enlace de recuperación del Consejo de Einherjar</p>
        
        <div id="message"></div>
        
        <form id="resetForm" action="process_reset_request.php" method="POST">
            <div class="form-group">
                <label for="email">🏰 Email de Guerrero:</label>
                <input type="email" id="email" name="email" required placeholder="tu-email@dominio.com">
            </div>
            
            <button type="submit" class="btn" id="submitBtn">
                🛡️ Enviar Enlace Mágico de Recuperación
            </button>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Contactando al Consejo de Einherjar...</p>
            </div>
        </form>
        
        <div class="back-link">
            <a href="index.php">← Regresar al Portal de Guerreros</a>
        </div>
    </div>

    <script>
        document.getElementById('resetForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const form = this;
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
                    form.reset();
                } else {
                    messageDiv.innerHTML = '<div class="message error">' + data.message + '</div>';
                }
            })
            .catch(error => {
                messageDiv.innerHTML = '<div class="message error">Error de conexión. Por favor, intenta de nuevo.</div>';
            })
            .finally(() => {
                submitBtn.disabled = false;
                loading.style.display = 'none';
            });
        });
    </script>
</body>
</html>

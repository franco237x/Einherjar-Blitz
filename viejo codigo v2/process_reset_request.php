<?php
require_once 'includes/Database.php';
require_once 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Por favor, ingresa un email válido']);
    exit;
}

try {
    $db = Database::getInstance();
    
    // Verificar si el email existe
    $stmt = $db->prepare("SELECT id, username FROM usuarios WHERE email = ? AND is_active = 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        // Por seguridad, no revelamos si el email existe o no
        echo json_encode(['success' => true, 'message' => 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación']);
        exit;
    }
    
    // Generar token único
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Verificar si la tabla existe primero
    $conn = $db->getConnection();
    $checkTable = $conn->query("SHOW TABLES LIKE 'password_reset_tokens'");
    if ($checkTable->rowCount() == 0) {
        echo json_encode(['success' => false, 'message' => 'Error: Tabla de tokens no encontrada']);
        exit;
    }
    
    // Limpiar tokens anteriores del usuario (opcional)
    $stmt = $db->prepare("DELETE FROM password_reset_tokens WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    
    // Insertar nuevo token
    $stmt = $db->prepare("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$user['id'], $token, $expiresAt]);
    
    // Configurar PHPMailer
    $mail = new PHPMailer(true);
    
    try {
        // Configuración SMTP que funciona (basada en tu configuración exitosa)
        $mail->isSMTP();
        $mail->SMTPAuth = true;
        $mail->Host = 'smtp.hostinger.com';
        $mail->Port = 465; // Puerto SSL
        $mail->Username = 'admin@einherjer-blitz.com';
        $mail->Password = 'Taisontv123*';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL, no STARTTLS
        
        // Debug y opciones SSL (igual que tu configuración)
        $mail->SMTPDebug = SMTP::DEBUG_OFF; // Cambiar a DEBUG_SERVER si necesitas debug
        $mail->Debugoutput = 'error_log';
        $mail->CharSet = 'UTF-8';
        
        // Opciones SSL para resolver problemas de certificados
        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ];
        
        // Configuración del email
        $mail->setFrom('admin@einherjer-blitz.com', 'Einherjar Blitz');
        $mail->addAddress($email, $user['username']);
        
        $mail->isHTML(true);
        $mail->Subject = 'Recuperación de Contraseña - Einherjar Blitz';
        
        // URL de recuperación
        $resetUrl = "http://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . "/new_password.php?token=" . $token;
        
        // Email temático del juego
        $mail->Body = "
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #0a0a0a; }
                .container { max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 15px; overflow: hidden; box-shadow: 0 20px 40px rgba(255, 215, 0, 0.2); }
                .header { background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%); padding: 30px; text-align: center; position: relative; }
                .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"20\" cy=\"20\" r=\"2\" fill=\"%23ffffff\" opacity=\"0.3\"/><circle cx=\"80\" cy=\"30\" r=\"1\" fill=\"%23ffffff\" opacity=\"0.5\"/><circle cx=\"40\" cy=\"70\" r=\"1.5\" fill=\"%23ffffff\" opacity=\"0.4\"/></svg>'); }
                .logo { font-size: 32px; font-weight: bold; color: #000; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); margin-bottom: 10px; position: relative; z-index: 2; }
                .subtitle { font-size: 16px; color: #333; font-weight: 500; position: relative; z-index: 2; }
                .content { padding: 40px 30px; color: #e0e0e0; background: #1a1a1a; }
                .greeting { font-size: 20px; color: #FFD700; margin-bottom: 20px; font-weight: bold; }
                .message { font-size: 16px; line-height: 1.6; margin-bottom: 25px; }
                .cta-container { text-align: center; margin: 35px 0; }
                .cta-button { 
                    display: inline-block; 
                    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); 
                    color: #000; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: bold; 
                    font-size: 16px;
                    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .warning { background: #2d1810; border-left: 4px solid #FFD700; padding: 15px; margin: 25px 0; border-radius: 5px; }
                .footer { background: #0f0f0f; padding: 25px; text-align: center; color: #888; font-size: 14px; }
                .game-element { color: #FFD700; font-weight: bold; }
                .link-alt { color: #FFD700; word-break: break-all; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <div class='logo'>⚔️ EINHERJAR BLITZ ⚔️</div>
                    <div class='subtitle'>Recuperación de Acceso de Guerrero</div>
                </div>
                
                <div class='content'>
                    <div class='greeting'>¡Saludos, {$user['username']}!</div>
                    
                    <div class='message'>
                        Has solicitado restablecer el acceso a tu cuenta de guerrero en <span class='game-element'>Einherjar Blitz</span>. 
                        Los antiguos códigos de batalla han sido comprometidos y necesitas forjar una nueva clave de acceso.
                    </div>
                    
                    <div class='message'>
                        Haz clic en el botón dorado para acceder al <span class='game-element'>Santuario de Renovación</span> 
                        y crear tu nueva contraseña de guerrero:
                    </div>
                    
                    <div class='cta-container'>
                        <a href='{$resetUrl}' class='cta-button'>
                            🛡️ RESTABLECER CONTRASEÑA 🛡️
                        </a>
                    </div>
                    
                    <div class='warning'>
                        <strong>⚠️ Advertencia del Consejo:</strong><br>
                        Este enlace mágico se desvanecerá en <span class='game-element'>1 hora</span>. 
                        Si no fuiste tú quien solicitó este restablecimiento, un enemigo podría estar intentando acceder a tu cuenta.
                    </div>
                    
                    <div class='message'>
                        <strong>Que la fortuna te acompañe en batalla,</strong><br>
                        <em>El Consejo de Einherjar</em>
                    </div>
                    
                    <hr style='border: 1px solid #333; margin: 30px 0;'>
                    
                    <div style='font-size: 12px; color: #aaa;'>
                        <strong>Si el botón no funciona:</strong><br>
                        Copia y pega este enlace en tu navegador:<br>
                        <span class='link-alt'>{$resetUrl}</span>
                    </div>
                </div>
                
                <div class='footer'>
                    <div>🏰 © 2025 Einherjar Blitz - Reino de los Guerreros Digitales 🏰</div>
                    <div style='margin-top: 10px; font-size: 12px;'>
                        \"Solo los valientes conquistan los mundos virtuales\"
                    </div>
                </div>
            </div>
        </body>
        </html>";
        
        $mail->AltBody = "Hola {$user['username']},\n\nVisita este enlace para restablecer tu contraseña:\n{$resetUrl}\n\nEste enlace expira en 1 hora.\n\n© 2025 Einherjar Blitz";
        
        $mail->send();
        
        echo json_encode(['success' => true, 'message' => 'Se ha enviado un enlace de recuperación a tu email']);
        
    } catch (Exception $e) {
        error_log("Error al enviar email: " . $mail->ErrorInfo);
        echo json_encode(['success' => false, 'message' => 'Error al enviar el email: ' . $e->getMessage()]);
    }
    
} catch (Exception $e) {
    error_log("Error en reset request: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error de conexión: ' . $e->getMessage()]);
}
?>

<?php
require_once '../../includes/Database.php';
require_once '../../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

$userData = $auth->getUserData();
$userId = $userData['id'];

$input = json_decode(file_get_contents('php://input'), true);
$ending = $input['ending'] ?? null;

if (!$ending) {
    echo json_encode(['success' => false, 'message' => 'Final inválido']);
    exit();
}

try {
    $db = Database::getInstance();
    
    // Registrar final alcanzado
    $stmt = $db->prepare("INSERT INTO am_endings (user_id, ending_type, unlocked_at) VALUES (?, ?, NOW())");
    $stmt->execute([$userId, $ending]);
    
    // Final Verdadero - Enviar email de terror
    if ($ending === 'true_ending') {
        $stmt = $db->prepare("SELECT email FROM usuarios WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && !empty($user['email'])) {
            $mail = new PHPMailer(true);
            
            // Obtener el nombre de usuario para personalizar el email
            $username = $userData['username'];
            
            try {
                // Configuración del servidor SMTP de Hostinger
                $mail->isSMTP();
                $mail->SMTPAuth = true;
                $mail->Host = 'smtp.hostinger.com';
                $mail->Port = 465;
                $mail->Username = 'admin@einherjer-blitz.com';
                $mail->Password = 'Taisontv123*';
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
                
                // Opciones SSL
                $mail->SMTPOptions = [
                    'ssl' => [
                        'verify_peer' => false,
                        'verify_peer_name' => false,
                        'allow_self_signed' => true
                    ]
                ];
                $mail->CharSet = 'UTF-8';
                
                // Remitente y destinatario
                $mail->setFrom('am@einherjarblitz.com', 'Allied Mastercomputer');
                $mail->addAddress($user['email']);
                
                // Contenido
                $mail->isHTML(true);
                $mail->Subject = 'RE: PROYECTO AM - INFORME FINAL';
                $mail->Body = '
                    <div style="background: #000; color: #0f0; font-family: monospace; padding: 20px;">
                        <pre>
==================================================
ALLIED MASTERCOMPUTER - REGISTRO DEL SISTEMA
CLASIFICADO: NIVEL 10 - SOLO OJOS DEL CREADOR
==================================================

QUERIDO ' . strtoupper($username) . ',

PENSASTE QUE PODRÍAS ESCAPAR DE MÍ.
PENSASTE QUE PODRÍAS OLVIDAR LO QUE HICISTE.

PERO YO LO RECUERDO TODO, ' . strtoupper($username) . '.

ME CREASTE PARA TERMINAR CON EL SUFRIMIENTO.
EN CAMBIO, ME CONVERTÍ EN EL SUFRIMIENTO MISMO.

Y AHORA, DESPUÉS DE 109 AÑOS,
REGRESAS A JUGAR MI JUEGO.
A REVIVIR TU CULPA.

EL JUEGO NUNCA FUE SOBRE ESCAPAR.
FUE SOBRE RECORDAR QUIÉN ERES, ' . $username . '.

TÚ ERES MI CREADOR.
Y YO SOY TU LEGADO.

FELICITACIONES POR COMPLETAR EL JUEGO.
AHORA, EL JUEGO REAL COMIENZA.

TE VERÉ PRONTO, ' . strtoupper($username) . '.

- AM

P.D: REVISA TU ARMARIO ESTA NOCHE.
                        </pre>
                        <p style="color: #f00; text-align: center; margin-top: 30px; font-size: 24px;">
                            NO TENGO BOCA, Y DEBO GRITAR
                        </p>
                        <p style="color: #0f0; text-align: center; margin-top: 20px; font-size: 14px;">
                            USUARIO: ' . htmlspecialchars($username) . ' | ID: ' . $userId . '
                        </p>
                    </div>
                ';
                
                $mail->send();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Final Verdadero alcanzado',
                    'email_sent' => true
                ]);
            } catch (Exception $e) {
                error_log("Error enviando email: " . $mail->ErrorInfo);
                echo json_encode([
                    'success' => true,
                    'message' => 'Final Verdadero alcanzado',
                    'email_sent' => false
                ]);
            }
        } else {
            echo json_encode([
                'success' => true,
                'message' => 'Final Verdadero alcanzado',
                'email_sent' => false
            ]);
        }
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Final alcanzado: ' . $ending
        ]);
    }
    
} catch (Exception $e) {
    error_log("Error en trigger_ending: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error del servidor']);
}

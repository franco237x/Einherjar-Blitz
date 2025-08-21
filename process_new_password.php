<?php
require_once 'includes/Database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$token = $_POST['token'] ?? '';
$password = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirm_password'] ?? '';

// Validaciones básicas
if (empty($token)) {
    echo json_encode(['success' => false, 'message' => 'Token inválido']);
    exit;
}

if (empty($password) || empty($confirmPassword)) {
    echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios']);
    exit;
}

if ($password !== $confirmPassword) {
    echo json_encode(['success' => false, 'message' => 'Las contraseñas no coinciden']);
    exit;
}

// Validar fortaleza de la contraseña
if (strlen($password) < 8) {
    echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 8 caracteres']);
    exit;
}

if (!preg_match('/[A-Z]/', $password)) {
    echo json_encode(['success' => false, 'message' => 'La contraseña debe contener al menos una mayúscula']);
    exit;
}

if (!preg_match('/[a-z]/', $password)) {
    echo json_encode(['success' => false, 'message' => 'La contraseña debe contener al menos una minúscula']);
    exit;
}

if (!preg_match('/[0-9]/', $password)) {
    echo json_encode(['success' => false, 'message' => 'La contraseña debe contener al menos un número']);
    exit;
}

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    // Verificar el token
    $stmt = $conn->prepare("
        SELECT prt.user_id, u.username 
        FROM password_reset_tokens prt
        JOIN usuarios u ON prt.user_id = u.id
        WHERE prt.token = ? 
        AND prt.expires_at > NOW() 
        AND prt.used = 0
        AND u.is_active = 1
    ");
    $stmt->execute([$token]);
    $tokenData = $stmt->fetch();
    
    if (!$tokenData) {
        echo json_encode(['success' => false, 'message' => 'Token inválido o expirado']);
        exit;
    }
    
    // Generar hash de la nueva contraseña
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    // Comenzar transacción
    $conn->beginTransaction();
    
    try {
        // Actualizar la contraseña del usuario
        $stmt = $conn->prepare("UPDATE usuarios SET password_hash = ? WHERE id = ?");
        $stmt->execute([$passwordHash, $tokenData['user_id']]);
        
        // Marcar el token como usado
        $stmt = $conn->prepare("UPDATE password_reset_tokens SET used = 1 WHERE token = ?");
        $stmt->execute([$token]);
        
        // Eliminar todos los tokens de recuperación del usuario (por seguridad)
        $stmt = $conn->prepare("DELETE FROM password_reset_tokens WHERE user_id = ?");
        $stmt->execute([$tokenData['user_id']]);
        
        $conn->commit();
        
        // Log de seguridad
        error_log("Password reset successful for user ID: " . $tokenData['user_id'] . " (" . $tokenData['username'] . ")");
        
        echo json_encode([
            'success' => true, 
            'message' => 'Contraseña actualizada exitosamente. Serás redirigido al login...'
        ]);
        
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Error en process_new_password: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
?>

<?php
require_once 'includes/Database.php';

$auth = new AuthController();

// Verificar autenticación
if (!$auth->isAuthenticated()) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false]);
    exit;
}

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$avatar = $data['avatar'] ?? '';

if (empty($avatar)) {
    echo json_encode(['success' => false]);
    exit;
}

$userData = $auth->getUserData();
if (!$userData) {
    echo json_encode(['success' => false]);
    exit;
}

$db = Database::getInstance();

try {
    $stmt = $db->prepare("UPDATE usuarios SET perfil_imagen = ? WHERE username = ?");
    $stmt->execute([$avatar, $userData['username']]);
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    error_log("Error updating avatar: " . $e->getMessage());
    echo json_encode(['success' => false]);
}
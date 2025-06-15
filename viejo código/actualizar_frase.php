<?php
require_once 'includes/Database.php';

$auth = new AuthController();

// Verificar autenticación
if (!$auth->isAuthenticated()) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$frase = $data['frase'] ?? '';

if (empty($frase)) {
    echo json_encode(['success' => false, 'message' => 'Frase vacía']);
    exit;
}

$userData = $auth->getUserData();
if (!$userData) {
    echo json_encode(['success' => false, 'message' => 'Error obteniendo datos del usuario']);
    exit;
}

$db = Database::getInstance();

try {
    $stmt = $db->prepare("UPDATE usuarios SET frase = ? WHERE username = ?");
    $stmt->execute([$frase, $userData['username']]);
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    error_log("Error updating phrase: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error en la base de datos']);
}
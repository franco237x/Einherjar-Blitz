<?php
header('Content-Type: application/json');
require_once '../../includes/Database.php';

$auth = new AuthController();

if (!$auth->isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

// Leer datos de la petición
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['username'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Username requerido']);
    exit();
}

$username = trim($input['username']);

if (empty($username)) {
    echo json_encode(['success' => false, 'message' => 'Username vacío']);
    exit();
}

$db = Database::getInstance();

try {
    // Verificar que el usuario existe y está activo
    $userQuery = $db->prepare("SELECT id, username FROM usuarios WHERE username = ? AND is_active = 1");
    $userQuery->execute([$username]);
    $user = $userQuery->fetch();

    if ($user) {
        echo json_encode([
            'success' => true,
            'message' => 'Usuario válido',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error del servidor']);
}
?>

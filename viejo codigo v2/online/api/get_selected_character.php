<?php
/**
 * Get Selected Character - API Helper
 */

require_once '../../includes/Database.php';

header('Content-Type: application/json');

$auth = new AuthController();

if (!$auth->isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

$characterId = $_SESSION['selected_character_online'] ?? null;

if ($characterId) {
    echo json_encode([
        'success' => true,
        'character_id' => $characterId
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'No hay personaje seleccionado'
    ]);
}

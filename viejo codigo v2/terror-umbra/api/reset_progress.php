<?php
require_once '../../includes/Database.php';

header('Content-Type: application/json');

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit();
}

$userId = $auth->getUserData()['id'];

$db = Database::getInstance();

try {
    // Resetear progreso
    $stmt = $db->prepare("
        UPDATE umbra_progress SET
            chapter = 1,
            paranoia_level = 0,
            perception = 100,
            trust = 50,
            sanity = 100,
            has_seen_face = FALSE,
            knows_name = FALSE,
            room_revealed = FALSE,
            attempted_escape = 0,
            current_room = 'void',
            session_count = session_count + 1,
            last_played = NOW()
        WHERE user_id = ?
    ");
    $stmt->execute([$userId]);
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

<?php
require_once '../../includes/Database.php';

header('Content-Type: application/json');

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit();
}

$userData = $auth->getUserData();
$userId = $userData['id'];
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['ending'])) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit();
}

$db = Database::getInstance();

try {
    // Obtener progreso actual
    $stmt = $db->prepare("SELECT session_count FROM umbra_progress WHERE user_id = ?");
    $stmt->execute([$userId]);
    $progress = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Guardar final alcanzado
    $stmt = $db->prepare("
        INSERT INTO umbra_endings 
        (user_id, ending_type, session_number, final_paranoia, final_perception)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $userId,
        $input['ending'],
        $progress['session_count'] ?? 1,
        $input['paranoia_level'] ?? 0,
        $input['perception'] ?? 100
    ]);
    
    // Registrar evento
    $stmt = $db->prepare("
        INSERT INTO umbra_player_events 
        (user_id, event_type, event_data, session_number)
        VALUES (?, 'ending_reached', ?, ?)
    ");
    $stmt->execute([
        $userId,
        json_encode([
            'ending' => $input['ending'],
            'sanity' => $input['sanity'] ?? 0,
            'paranoia' => $input['paranoia_level'] ?? 0
        ]),
        $progress['session_count'] ?? 1
    ]);
    
    echo json_encode(['success' => true, 'ending' => $input['ending']]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

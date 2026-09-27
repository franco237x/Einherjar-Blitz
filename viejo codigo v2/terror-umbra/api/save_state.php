<?php
require_once '../../includes/Database.php';

header('Content-Type: application/json');

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit();
}

$userId = $auth->getUserData()['id'];
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
    exit();
}

$db = Database::getInstance();

try {
    $stmt = $db->prepare("
        UPDATE umbra_progress SET
            chapter = :chapter,
            paranoia_level = :paranoia,
            perception = :perception,
            trust = :trust,
            sanity = :sanity,
            has_seen_face = :seen_face,
            knows_name = :knows_name,
            room_revealed = :room_revealed,
            made_pact = :made_pact,
            attempted_escape = :escape_count,
            current_room = :current_room,
            last_played = NOW()
        WHERE user_id = :user_id
    ");
    
    $stmt->execute([
        ':chapter' => $input['chapter'] ?? 1,
        ':paranoia' => $input['paranoia_level'] ?? 0,
        ':perception' => $input['perception'] ?? 100,
        ':trust' => $input['trust'] ?? 50,
        ':sanity' => $input['sanity'] ?? 100,
        ':seen_face' => $input['has_seen_face'] ?? false,
        ':knows_name' => $input['knows_name'] ?? false,
        ':room_revealed' => $input['room_revealed'] ?? false,
        ':made_pact' => $input['made_pact'] ?? false,
        ':escape_count' => $input['attempted_escape'] ?? 0,
        ':current_room' => $input['current_room'] ?? 'void',
        ':user_id' => $userId
    ]);
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

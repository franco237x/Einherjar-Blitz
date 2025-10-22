<?php
require_once '../../includes/Database.php';

header('Content-Type: application/json');

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

$userData = $auth->getUserData();
$userId = $userData['id'];

try {
    $db = Database::getInstance();
    
    // Resetear progreso del usuario
    $stmt = $db->prepare("UPDATE am_game_progress SET 
        chapter = 1, 
        decisions = '[]', 
        discovered_truth = 0, 
        defied_am = 0, 
        showed_compassion = 0, 
        found_core_access = 0,
        sanity = 100,
        trust = 50,
        updated_at = NOW()
        WHERE user_id = ?");
    
    $stmt->execute([$userId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Progreso reseteado'
    ]);
    
} catch (Exception $e) {
    error_log("Error en reset_progress: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error del servidor']);
}

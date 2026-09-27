<?php
/**
 * Rewards API - Einherjar Blitz Online Mode
 * Handles match history and rewards retrieval
 */

require_once '../../includes/Database.php';

header('Content-Type: application/json');

$auth = new AuthController();

// Verificar autenticación
if (!$auth->isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
    exit();
}

$db = Database::getInstance()->getConnection();
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'match_history':
            getMatchHistory($db, $userData);
            break;
        
        case 'get_match_history':
            getMatchHistory($db, $userData);
            break;
        
        case 'get_battle_result':
            getBattleResult($db, $userData);
            break;
        
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error del servidor: ' . $e->getMessage()
    ]);
}

/**
 * Obtener historial de partidas del jugador
 */
function getMatchHistory($db, $userData) {
    $userId = $userData['id'];
    $limit = intval($_GET['limit'] ?? 20);
    
    $stmt = $db->prepare("
        SELECT 
            id,
            battle_id,
            opponent_username,
            player_character_id,
            opponent_character_id,
            result,
            cups_change,
            duration_seconds,
            damage_dealt,
            damage_received,
            rounds_played,
            created_at
        FROM online_match_history
        WHERE player_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    ");
    $stmt->execute([$userId, $limit]);
    
    $matches = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $matches[] = [
            'id' => $row['id'],
            'battle_id' => $row['battle_id'],
            'opponent_username' => $row['opponent_username'],
            'player_character' => $row['player_character_id'],
            'opponent_character' => $row['opponent_character_id'],
            'result' => $row['result'],
            'cups_change' => $row['cups_change'],
            'duration' => $row['duration_seconds'],
            'damage_dealt' => $row['damage_dealt'],
            'damage_received' => $row['damage_received'],
            'rounds' => $row['rounds_played'],
            'date' => $row['created_at']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'matches' => $matches
    ]);
}

/**
 * Obtener resultado de una batalla específica
 */
function getBattleResult($db, $userData) {
    $battleId = $_GET['battle_id'] ?? null;
    $userId = $userData['id'];
    
    if (!$battleId) {
        echo json_encode(['success' => false, 'message' => 'ID de batalla no proporcionado']);
        return;
    }
    
    // Obtener información de la batalla
    $stmt = $db->prepare("
        SELECT * FROM online_battles 
        WHERE id = ? 
        AND (player1_id = ? OR player2_id = ?)
    ");
    $stmt->execute([$battleId, $userId, $userId]);
    $battle = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$battle) {
        echo json_encode(['success' => false, 'message' => 'Batalla no encontrada']);
        return;
    }
    
    // Obtener historial de la partida
    $stmt = $db->prepare("
        SELECT * FROM online_match_history 
        WHERE battle_id = ? AND player_id = ?
    ");
    $stmt->execute([$battleId, $userId]);
    $history = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $isPlayer1 = $battle['player1_id'] == $userId;
    $state = json_decode($battle['battle_state'], true);
    
    echo json_encode([
        'success' => true,
        'result' => [
            'won' => $battle['winner_id'] == $userId,
            'winner_id' => $battle['winner_id'],
            'end_reason' => $battle['end_reason'],
            'cups_change' => $history['cups_change'] ?? 0,
            'duration' => $history['duration_seconds'] ?? 0,
            'rounds' => $state['round'] ?? 1,
            'damage_dealt' => $history['damage_dealt'] ?? 0,
            'damage_received' => $history['damage_received'] ?? 0,
            'opponent' => [
                'username' => $isPlayer1 ? $battle['player2_username'] : $battle['player1_username'],
                'rango' => $isPlayer1 ? $battle['player2_rango'] : $battle['player1_rango'],
                'copas' => $isPlayer1 ? $battle['player2_copas'] : $battle['player1_copas']
            ]
        ]
    ]);
}

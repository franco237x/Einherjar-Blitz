<?php
/**
 * Matchmaking API - Einherjar Blitz Online Mode
 * Handles player queue, matchmaking, and online statistics
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
$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {
        case 'join_queue':
            joinQueue($db, $userData);
            break;
        
        case 'leave_queue':
            leaveQueue($db, $userData);
            break;
        
        case 'check_match':
            checkMatch($db, $userData);
            break;
        
        case 'get_stats':
            getOnlineStats($db);
            break;
        
        case 'heartbeat':
            updateHeartbeat($db, $userData);
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
 * Buscar CUALQUIER oponente (sin restricción de copas) para búsqueda ampliada
 */
function findAnyOpponent($db, $userId) {
    $stmt = $db->prepare("
        SELECT user_id, username, rango, copas, character_id 
        FROM online_queue 
        WHERE user_id != ? 
        AND status = 'searching'
        AND last_heartbeat > DATE_SUB(NOW(), INTERVAL 30 SECOND)
        ORDER BY joined_at ASC
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Unirse a la cola de matchmaking
 */
function joinQueue($db, $userData) {
    $userId = $userData['id'];
    $username = $userData['username'];
    $rango = $userData['rango'];
    $copas = $userData['copas'];
    
    // Obtener character_id del POST
    $characterId = $_POST['character_id'] ?? null;
    
    if (!$characterId) {
        echo json_encode(['success' => false, 'message' => 'Debes seleccionar un personaje']);
        return;
    }
    
    // Verificar si ya está en la cola
    $stmt = $db->prepare("SELECT id FROM online_queue WHERE user_id = ? AND status = 'searching'");
    $stmt->execute([$userId]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        echo json_encode(['success' => true, 'message' => 'Ya estás en la cola', 'in_queue' => true]);
        return;
    }
    
    // Buscar un oponente compatible (±200 copas)
    $minCopas = $copas - 200;
    $maxCopas = $copas + 200;
    
    $stmt = $db->prepare("
        SELECT id, user_id, username, rango, copas, character_id 
        FROM online_queue 
        WHERE user_id != ? 
        AND status = 'searching'
        AND copas BETWEEN ? AND ?
        AND last_heartbeat > DATE_SUB(NOW(), INTERVAL 30 SECOND)
        ORDER BY ABS(copas - ?) ASC
        LIMIT 1
    ");
    $stmt->execute([$userId, $minCopas, $maxCopas, $copas]);
    $opponent = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($opponent) {
        // ¡Match encontrado! Crear batalla
        $battleId = createBattle($db, $userId, $opponent['user_id'], [
            'player1' => $userData,
            'player2' => [
                'id' => $opponent['user_id'],
                'username' => $opponent['username'],
                'rango' => $opponent['rango'],
                'copas' => $opponent['copas']
            ],
            'player1_character' => $characterId,
            'player2_character' => $opponent['character_id']
        ]);
        
        // Actualizar cola de ambos jugadores
        $stmt = $db->prepare("UPDATE online_queue SET status = 'matched', match_id = ? WHERE id = ?");
        $stmt->execute([$battleId, $opponent['id']]);
        
        // Añadir al jugador actual a la cola como matched
        $stmt = $db->prepare("
            INSERT INTO online_queue (user_id, username, rango, copas, character_id, status, match_id)
            VALUES (?, ?, ?, ?, ?, 'matched', ?)
        ");
        $stmt->execute([$userId, $username, $rango, $copas, $characterId, $battleId]);
        
        echo json_encode([
            'success' => true,
            'matched' => true,
            'battle_id' => $battleId,
            'opponent' => [
                'username' => $opponent['username'],
                'rango' => $opponent['rango'],
                'copas' => $opponent['copas']
            ]
        ]);
    } else {
        // No hay match, añadir a la cola
        $stmt = $db->prepare("
            INSERT INTO online_queue (user_id, username, rango, copas, character_id, status)
            VALUES (?, ?, ?, ?, ?, 'searching')
        ");
        $stmt->execute([$userId, $username, $rango, $copas, $characterId]);
        
        echo json_encode([
            'success' => true,
            'in_queue' => true,
            'matched' => false,
            'message' => 'Buscando oponente...'
        ]);
    }
}

/**
 * Salir de la cola de matchmaking
 */
function leaveQueue($db, $userData) {
    $userId = $userData['id'];
    
    $stmt = $db->prepare("DELETE FROM online_queue WHERE user_id = ? AND status = 'searching'");
    $stmt->execute([$userId]);
    
    echo json_encode(['success' => true, 'message' => 'Has salido de la cola']);
}

/**
 * Verificar si se encontró un match
 */
function checkMatch($db, $userData) {
    $userId = $userData['id'];
    
    $stmt = $db->prepare("
        SELECT status, match_id, joined_at, character_id
        FROM online_queue 
        WHERE user_id = ? 
        ORDER BY id DESC 
        LIMIT 1
    ");
    $stmt->execute([$userId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        echo json_encode(['success' => true, 'in_queue' => false, 'matched' => false]);
        return;
    }
    
    // Calcular tiempo en cola
    $timeInQueue = time() - strtotime($result['joined_at']);
    $waitingTooLong = $timeInQueue > 10; // 10 segundos
    
    // Si lleva más de 10 segundos, intentar match con CUALQUIERA
    if ($waitingTooLong && $result['status'] === 'searching') {
        $opponent = findAnyOpponent($db, $userId);
        
        if ($opponent) {
            // Match encontrado - crear batalla
            $characterId = $result['character_id'];
            
            $battleId = createBattle($db, $userId, $opponent['user_id'], [
                'player1' => $userData,
                'player2' => [
                    'id' => $opponent['user_id'],
                    'username' => $opponent['username'],
                    'rango' => $opponent['rango'],
                    'copas' => $opponent['copas']
                ],
                'player1_character' => $characterId,
                'player2_character' => $opponent['character_id']
            ]);
            
            // Actualizar ambos registros en la cola
            $stmt = $db->prepare("UPDATE online_queue SET status = 'matched', match_id = ? WHERE user_id IN (?, ?)");
            $stmt->execute([$battleId, $userId, $opponent['user_id']]);
            
            echo json_encode([
                'success' => true,
                'matched' => true,
                'battle_id' => $battleId,
                'opponent' => [
                    'username' => $opponent['username'],
                    'rango' => $opponent['rango'],
                    'copas' => $opponent['copas']
                ],
                'extended_search' => true,
                'message' => '¡Oponente encontrado!'
            ]);
            return;
        }
        
        // Si lleva más de 30 segundos y no hay nadie, cancelar automáticamente
        if ($timeInQueue > 30) {
            $stmt = $db->prepare("DELETE FROM online_queue WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            echo json_encode([
                'success' => true,
                'in_queue' => false,
                'matched' => false,
                'cancelled' => true,
                'message' => 'No se encontraron oponentes disponibles. Intenta de nuevo más tarde.'
            ]);
            return;
        }
        
        // Aún esperando pero ampliando búsqueda
        echo json_encode([
            'success' => true,
            'in_queue' => true,
            'matched' => false,
            'extended_search' => true,
            'time_in_queue' => $timeInQueue,
            'message' => 'Ampliando búsqueda a todos los rangos...'
        ]);
        return;
    }
    
    // Búsqueda normal (primeros 10 segundos)
    if ($result['status'] === 'searching') {
        echo json_encode([
            'success' => true,
            'in_queue' => true,
            'matched' => false,
            'time_in_queue' => $timeInQueue,
            'message' => 'Buscando oponente...'
        ]);
        return;
    }
    
    if ($result['status'] === 'matched' && $result['match_id']) {
        // Obtener información de la batalla
        $stmt = $db->prepare("
            SELECT 
                id,
                player1_id,
                player2_id,
                player1_username,
                player2_username,
                player1_rango,
                player2_rango,
                player1_copas,
                player2_copas
            FROM online_battles 
            WHERE id = ? AND status = 'active'
        ");
        $stmt->execute([$result['match_id']]);
        $battle = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($battle) {
            // Determinar quién es el oponente
            $isPlayer1 = $battle['player1_id'] == $userId;
            $opponent = [
                'username' => $isPlayer1 ? $battle['player2_username'] : $battle['player1_username'],
                'rango' => $isPlayer1 ? $battle['player2_rango'] : $battle['player1_rango'],
                'copas' => $isPlayer1 ? $battle['player2_copas'] : $battle['player1_copas']
            ];
            
            echo json_encode([
                'success' => true,
                'matched' => true,
                'battle_id' => $battle['id'],
                'opponent' => $opponent
            ]);
        } else {
            echo json_encode(['success' => true, 'in_queue' => false, 'matched' => false]);
        }
    } else {
        echo json_encode(['success' => true, 'in_queue' => true, 'matched' => false]);
    }
}

/**
 * Obtener estadísticas de jugadores online
 */
function getOnlineStats($db) {
    // Jugadores en la cola
    $stmt = $db->prepare("
        SELECT COUNT(*) as count 
        FROM online_queue 
        WHERE status = 'searching' 
        AND last_heartbeat > DATE_SUB(NOW(), INTERVAL 30 SECOND)
    ");
    $stmt->execute();
    $searching = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Batallas activas
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM online_battles WHERE status = 'active'");
    $stmt->execute();
    $inBattle = $stmt->fetch(PDO::FETCH_ASSOC)['count'] * 2;
    
    // Total online (aprox)
    $totalOnline = $searching + $inBattle;
    
    // Tiempo promedio de espera (en segundos)
    $stmt = $db->prepare("
        SELECT AVG(TIMESTAMPDIFF(SECOND, joined_at, NOW())) as avg_wait
        FROM online_queue
        WHERE status = 'searching'
        AND last_heartbeat > DATE_SUB(NOW(), INTERVAL 30 SECOND)
    ");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $avgWait = $result['avg_wait'] ?? 0;
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'players_online' => $totalOnline,
            'searching' => $searching,
            'in_battle' => $inBattle,
            'avg_wait_time' => round($avgWait)
        ]
    ]);
}

/**
 * Actualizar heartbeat del jugador en la cola
 */
function updateHeartbeat($db, $userData) {
    $userId = $userData['id'];
    
    $stmt = $db->prepare("
        UPDATE online_queue 
        SET last_heartbeat = NOW() 
        WHERE user_id = ? AND status = 'searching'
    ");
    $stmt->execute([$userId]);
    
    echo json_encode(['success' => true]);
}

/**
 * Crear una nueva batalla online
 */
function createBattle($db, $player1Id, $player2Id, $data) {
    // Estado inicial de la batalla
    $initialState = [
        'player1' => [
            'health' => 1000,
            'maxHealth' => 1000,
            'energy' => 100,
            'maxEnergy' => 100,
            'statusEffects' => [],
            'stats' => []
        ],
        'player2' => [
            'health' => 1000,
            'maxHealth' => 1000,
            'energy' => 100,
            'maxEnergy' => 100,
            'statusEffects' => [],
            'stats' => []
        ],
        'round' => 1,
        'turnHistory' => []
    ];
    
    $battleStateJson = json_encode($initialState);
    
    $stmt = $db->prepare("
        INSERT INTO online_battles (
            player1_id, player2_id,
            player1_username, player2_username,
            player1_character_id, player2_character_id,
            player1_rango, player2_rango,
            player1_copas, player2_copas,
            battle_state, current_turn
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'player1')
    ");
    
    $stmt->execute([
        $player1Id,
        $player2Id,
        $data['player1']['username'],
        $data['player2']['username'],
        $data['player1_character'],
        $data['player2_character'],
        $data['player1']['rango'],
        $data['player2']['rango'],
        $data['player1']['copas'],
        $data['player2']['copas'],
        $battleStateJson
    ]);
    
    return $db->lastInsertId();
}

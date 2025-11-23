<?php
/**
 * Battle Session API - Einherjar Blitz Online Mode
 * Handles real-time battle state synchronization and turn management
 */

require_once '../../includes/Database.php';
require_once 'character_stats.php';

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
        case 'initialize':
            initializeBattle($db, $userData);
            break;
        
        case 'get_state':
            getBattleState($db, $userData);
            break;
        
        case 'submit_action':
            submitAction($db, $userData);
            break;
        
        case 'heartbeat':
            updateBattleHeartbeat($db, $userData);
            break;
        
        case 'surrender':
            surrenderBattle($db, $userData);
            break;
        
        case 'end_battle':
            endBattle($db, $userData);
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
 * Inicializar batalla y obtener datos iniciales
 */
function initializeBattle($db, $userData) {
    $battleId = $_POST['battle_id'] ?? null;
    $userId = $userData['id'];
    
    if (!$battleId) {
        echo json_encode(['success' => false, 'message' => 'ID de batalla no proporcionado']);
        return;
    }
    
    // Obtener batalla
    $stmt = $db->prepare("
        SELECT * FROM online_battles 
        WHERE id = ? 
        AND (player1_id = ? OR player2_id = ?)
        AND status = 'active'
    ");
    $stmt->execute([$battleId, $userId, $userId]);
    $battle = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$battle) {
        echo json_encode(['success' => false, 'message' => 'Batalla no encontrada']);
        return;
    }
    
    $isPlayer1 = $battle['player1_id'] == $userId;
    
    echo json_encode([
        'success' => true,
        'battle' => [
            'id' => $battle['id'],
            'player_number' => $isPlayer1 ? 1 : 2,
            'player' => [
                'id' => $userId,
                'username' => $isPlayer1 ? $battle['player1_username'] : $battle['player2_username'],
                'character_id' => $isPlayer1 ? $battle['player1_character_id'] : $battle['player2_character_id'],
                'rango' => $isPlayer1 ? $battle['player1_rango'] : $battle['player2_rango'],
                'copas' => $isPlayer1 ? $battle['player1_copas'] : $battle['player2_copas']
            ],
            'opponent' => [
                'id' => $isPlayer1 ? $battle['player2_id'] : $battle['player1_id'],
                'username' => $isPlayer1 ? $battle['player2_username'] : $battle['player1_username'],
                'character_id' => $isPlayer1 ? $battle['player2_character_id'] : $battle['player1_character_id'],
                'rango' => $isPlayer1 ? $battle['player2_rango'] : $battle['player1_rango'],
                'copas' => $isPlayer1 ? $battle['player2_copas'] : $battle['player1_copas']
            ],
            'current_turn' => $battle['current_turn'],
            'state' => json_decode($battle['battle_state'], true)
        ]
    ]);
}

/**
 * Obtener estado actual de la batalla
 */
function getBattleState($db, $userData) {
    $battleId = $_GET['battle_id'] ?? null;
    $userId = $userData['id'];
    
    if (!$battleId) {
        echo json_encode(['success' => false, 'message' => 'ID de batalla no proporcionado']);
        return;
    }
    
    $stmt = $db->prepare("
        SELECT 
            id,
            player1_id,
            player2_id,
            battle_state,
            current_turn,
            turn_started_at,
            status,
            winner_id,
            end_reason,
            player1_last_heartbeat,
            player2_last_heartbeat
        FROM online_battles 
        WHERE id = ? 
        AND (player1_id = ? OR player2_id = ?)
    ");
    $stmt->execute([$battleId, $userId, $userId]);
    $battle = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$battle) {
        echo json_encode(['success' => false, 'message' => 'Batalla no encontrada']);
        return;
    }
    
    $isPlayer1 = $battle['player1_id'] == $userId;
    
    // Verificar si el oponente está conectado (heartbeat reciente)
    $opponentHeartbeat = $isPlayer1 ? $battle['player2_last_heartbeat'] : $battle['player1_last_heartbeat'];
    $opponentConnected = (strtotime($opponentHeartbeat) > strtotime('-15 seconds'));
    
    // Calcular tiempo restante del turno
    $turnElapsed = time() - strtotime($battle['turn_started_at']);
    $turnTimeLeft = max(0, 30 - $turnElapsed);
    
    echo json_encode([
        'success' => true,
        'state' => json_decode($battle['battle_state'], true),
        'current_turn' => $battle['current_turn'],
        'is_my_turn' => ($isPlayer1 && $battle['current_turn'] == 'player1') || (!$isPlayer1 && $battle['current_turn'] == 'player2'),
        'turn_time_left' => $turnTimeLeft,
        'status' => $battle['status'],
        'winner_id' => $battle['winner_id'],
        'end_reason' => $battle['end_reason'],
        'opponent_connected' => $opponentConnected
    ]);
}

/**
 * Enviar acción del jugador
 */
function submitAction($db, $userData) {
    $battleId = $_POST['battle_id'] ?? null;
    $action = $_POST['battle_action'] ?? null;
    $userId = $userData['id'];
    
    if (!$battleId || !$action) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        return;
    }
    
    try {
        $db->beginTransaction();
        
        // Obtener batalla actual
        $stmt = $db->prepare("
            SELECT * FROM online_battles 
            WHERE id = ? 
            AND (player1_id = ? OR player2_id = ?)
            AND status = 'active'
            FOR UPDATE
        ");
        $stmt->execute([$battleId, $userId, $userId]);
        $battle = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$battle) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => 'Batalla no encontrada o no activa']);
            return;
        }
        
        $isPlayer1 = $battle['player1_id'] == $userId;
        $playerKey = $isPlayer1 ? 'player1' : 'player2';
        
        // Verificar que es el turno del jugador
        $expectedTurn = $isPlayer1 ? 'player1' : 'player2';
        if ($battle['current_turn'] != $expectedTurn) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => 'No es tu turno']);
            return;
        }
        
        // Decodificar estado actual
        $state = json_decode($battle['battle_state'], true);
        
        // Añadir acción al historial
        $actionData = json_decode($action, true);
        $state['turnHistory'][] = [
            'player' => $playerKey,
            'action' => $actionData,
            'timestamp' => time()
        ];
        
        // Actualizar estado según la acción
        $state = applyAction($state, $playerKey, $actionData);
        
        // Cambiar turno
        $nextTurn = $isPlayer1 ? 'player2' : 'player1';
        
        // Verificar si la batalla terminó
        $battleEnded = false;
        $winnerId = null;
        $endReason = null;
        
        if ($state['player1']['health'] <= 0) {
            $battleEnded = true;
            $winnerId = $battle['player2_id'];
            $endReason = 'knockout';
        } elseif ($state['player2']['health'] <= 0) {
            $battleEnded = true;
            $winnerId = $battle['player1_id'];
            $endReason = 'knockout';
        }
        
        // Actualizar batalla
        $newState = json_encode($state);
        $newStatus = $battleEnded ? 'finished' : 'active';
        
        $stmt = $db->prepare("
            UPDATE online_battles 
            SET battle_state = ?,
                current_turn = ?,
                turn_started_at = NOW(),
                status = ?,
                winner_id = ?,
                end_reason = ?
            WHERE id = ?
        ");
        $stmt->execute([$newState, $nextTurn, $newStatus, $winnerId, $endReason, $battleId]);
        
        // Si la batalla terminó, procesar recompensas
        if ($battleEnded) {
            // Actualizar el objeto battle con el estado final
            $battle['battle_state'] = $newState;
            $battle['winner_id'] = $winnerId;
            $battle['status'] = $newStatus;
            processRewards($db, $battle, $winnerId, $state);
        }
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'state' => $state,
            'current_turn' => $nextTurn,
            'battle_ended' => $battleEnded,
            'winner_id' => $winnerId
        ]);
    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
}

/**
 * Aplicar acción al estado de la batalla
 */
function applyAction($state, $playerKey, $action) {
    $opponentKey = $playerKey == 'player1' ? 'player2' : 'player1';
    
    // Get character stats
    $playerCharId = $state[$playerKey]['character_id'];
    $opponentCharId = $state[$opponentKey]['character_id'];
    $playerCharStats = CharacterStats::getCharacterStats($playerCharId);
    $opponentCharStats = CharacterStats::getCharacterStats($opponentCharId);
    
    switch ($action['type']) {
        case 'attack':
            // Calculate damage using character stats
            $attackResult = CharacterStats::calculateAttackDamage(
                $playerCharStats, 
                $state[$playerKey]['statusEffects']
            );
            $baseDamage = $attackResult['damage'];
            
            // Check initial shield state
            $initialShield = isset($state[$opponentKey]['shield']) ? $state[$opponentKey]['shield'] : 0;
            
            // Apply damage to opponent considering their armor, passives, and shield
            $finalDamage = CharacterStats::calculateDamageTaken(
                $baseDamage,
                $opponentCharStats,
                $state[$opponentKey]['statusEffects'],
                $state[$opponentKey] // Pass state for shield absorption
            );
            
            $state[$opponentKey]['health'] = max(0, $state[$opponentKey]['health'] - $finalDamage);
            
            // Check for dodge
            $dodged = ($finalDamage === 0 && $baseDamage > 0);
            
            // Check if shield absorbed damage (shield went down but no health damage)
            $finalShield = isset($state[$opponentKey]['shield']) ? $state[$opponentKey]['shield'] : 0;
            $shieldAbsorbed = ($initialShield > 0 && $finalDamage === 0 && !$dodged);
            
            $state['lastAction'] = [
                'type' => 'attack',
                'damage' => $finalDamage > 0 ? $finalDamage : ($initialShield - $finalShield),
                'critical' => $attackResult['critical'],
                'dodged' => $dodged,
                'shieldAbsorbed' => $shieldAbsorbed,
                'characterName' => $playerCharStats['name'],
                'targetName' => $opponentCharStats['name'],
                'shieldBroken' => ($initialShield > 0 && $finalShield == 0 && $baseDamage > 0)
            ];
            break;
        
        case 'defend':
            // Añadir efecto de defensa y regenerar energía
            $state[$playerKey]['statusEffects'][] = [
                'type' => 'defending',
                'duration' => 1
            ];
            $energyGain = 15;
            $state[$playerKey]['energy'] = min(
                $state[$playerKey]['maxEnergy'],
                $state[$playerKey]['energy'] + $energyGain
            );
            $state['lastAction'] = [
                'type' => 'defend',
                'energyGained' => $energyGain,
                'characterName' => $playerCharStats['name']
            ];
            break;
        
        case 'special':
            $energyCost = $playerCharStats['special_cost'];
            
            // Verify energy
            if ($state[$playerKey]['energy'] < $energyCost) {
                $state['lastAction'] = [
                    'type' => 'special',
                    'error' => 'Energía insuficiente',
                    'characterName' => $playerCharStats['name']
                ];
                break;
            }
            
            // Consume energy
            $state[$playerKey]['energy'] = max(0, $state[$playerKey]['energy'] - $energyCost);
            
            // Execute special ability
            $specialResult = CharacterStats::executeSpecialAbility(
                $playerCharId,
                $state[$playerKey],
                $state[$opponentKey]
            );
            
            // Ozen special case: restore energy AFTER consumption
            if (isset($specialResult['restoreEnergy']) && $specialResult['restoreEnergy']) {
                $state[$playerKey]['energy'] = $state[$playerKey]['maxEnergy'];
                $specialResult['energyRestored'] = $state[$playerKey]['maxEnergy'];
            }
            
            // Apply damage if any
            if (isset($specialResult['damage']) && $specialResult['damage'] > 0) {
                $finalDamage = CharacterStats::calculateDamageTaken(
                    $specialResult['damage'],
                    $opponentCharStats,
                    $state[$opponentKey]['statusEffects'],
                    $state[$opponentKey] // Pass state for shield absorption
                );
                $state[$opponentKey]['health'] = max(0, $state[$opponentKey]['health'] - $finalDamage);
                $specialResult['actualDamage'] = $finalDamage;
            }   
            
            // Add character and ability info for logging
            $specialResult['characterName'] = $playerCharStats['name'];
            $specialResult['abilityName'] = $playerCharStats['special_name'];
            
            $state['lastAction'] = array_merge(['type' => 'special'], $specialResult);
            break;
        
        case 'heal':
            $healAmount = floor($state[$playerKey]['maxHealth'] * 0.10); // 10% of max health
            $energyCost = 20;
            
            // Verify energy
            if ($state[$playerKey]['energy'] < $energyCost) {
                $state['lastAction'] = [
                    'type' => 'heal',
                    'error' => 'Energía insuficiente'
                ];
                break;
            }
            
            // Zack special case: doesn't heal, gains energy instead
            if ($playerCharId == 5) {
                $state[$playerKey]['energy'] = min(
                    $state[$playerKey]['maxEnergy'],
                    $state[$playerKey]['energy'] + 30 // Net gain of 10 after cost
                );
                $state['lastAction'] = [
                    'type' => 'heal',
                    'message' => 'Zack no puede regenerarse, pero gana energía',
                    'energyGained' => 30,
                    'characterName' => $playerCharStats['name']
                ];
            } else {
                $state[$playerKey]['energy'] = max(0, $state[$playerKey]['energy'] - $energyCost);
                $actualHeal = min($healAmount, $state[$playerKey]['maxHealth'] - $state[$playerKey]['health']);
                $state[$playerKey]['health'] = min(
                    $state[$playerKey]['maxHealth'],
                    $state[$playerKey]['health'] + $actualHeal
                );
                $state['lastAction'] = [
                    'type' => 'heal',
                    'amount' => $actualHeal,
                    'characterName' => $playerCharStats['name']
                ];
            }
            break;
    }
    
    // Regenerar energía (+10 por turno)
    $state[$playerKey]['energy'] = min(
        $state[$playerKey]['maxEnergy'],
        $state[$playerKey]['energy'] + 10
    );
    
    // Process status effects (burn, etc.)
    CharacterStats::processStatusEffects($state);
    
    // Incrementar ronda si ambos jugadores han jugado
    if (count($state['turnHistory']) % 2 == 0) {
        $state['round']++;
    }
    
    return $state;
}

/**
 * Actualizar heartbeat del jugador en la batalla
 */
function updateBattleHeartbeat($db, $userData) {
    $battleId = $_POST['battle_id'] ?? null;
    $userId = $userData['id'];
    
    if (!$battleId) {
        echo json_encode(['success' => false, 'message' => 'ID de batalla no proporcionado']);
        return;
    }
    
    // Determinar qué campo actualizar
    $stmt = $db->prepare("SELECT player1_id FROM online_battles WHERE id = ?");
    $stmt->execute([$battleId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        echo json_encode(['success' => false, 'message' => 'Batalla no encontrada']);
        return;
    }
    
    $isPlayer1 = $result['player1_id'] == $userId;
    $field = $isPlayer1 ? 'player1_last_heartbeat' : 'player2_last_heartbeat';
    
    $stmt = $db->prepare("UPDATE online_battles SET $field = NOW() WHERE id = ?");
    $stmt->execute([$battleId]);
    
    echo json_encode(['success' => true]);
}

/**
 * Rendirse en la batalla
 */
function surrenderBattle($db, $userData) {
    $battleId = $_POST['battle_id'] ?? null;
    $userId = $userData['id'];
    
    if (!$battleId) {
        echo json_encode(['success' => false, 'message' => 'ID de batalla no proporcionado']);
        return;
    }
    
    $stmt = $db->prepare("
        SELECT * FROM online_battles 
        WHERE id = ? 
        AND (player1_id = ? OR player2_id = ?)
        AND status = 'active'
    ");
    $stmt->execute([$battleId, $userId, $userId]);
    $battle = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$battle) {
        echo json_encode(['success' => false, 'message' => 'Batalla no encontrada']);
        return;
    }
    
    // El oponente gana
    $winnerId = $battle['player1_id'] == $userId ? $battle['player2_id'] : $battle['player1_id'];
    
    $stmt = $db->prepare("
        UPDATE online_battles 
        SET status = 'finished',
            winner_id = ?,
            end_reason = 'surrender'
        WHERE id = ?
    ");
    $stmt->execute([$winnerId, $battleId]);
    
    // Procesar recompensas
    processRewards($db, $battle, $winnerId);
    
    echo json_encode(['success' => true, 'message' => 'Te has rendido']);
}

/**
 * Finalizar batalla (cleanup)
 */
function endBattle($db, $userData) {
    $battleId = $_POST['battle_id'] ?? null;
    $userId = $userData['id'];
    
    if (!$battleId) {
        echo json_encode(['success' => false, 'message' => 'ID de batalla no proporcionado']);
        return;
    }
    
    // Limpiar de la cola
    $stmt = $db->prepare("DELETE FROM online_queue WHERE user_id = ?");
    $stmt->execute([$userId]);
    
    echo json_encode(['success' => true]);
}

/**
 * Procesar recompensas al final de la batalla
 */
function processRewards($db, $battle, $winnerId, $state = null) {
    $player1Id = $battle['player1_id'];
    $player2Id = $battle['player2_id'];
    $player1Copas = $battle['player1_copas'];
    $player2Copas = $battle['player2_copas'];
    
    // Si no se pasó el estado, decodificarlo del battle_state
    if ($state === null) {
        $state = json_decode($battle['battle_state'], true);
    }
    
    // Calcular cambio de copas basado en diferencia de ranking
    $copasDiff = abs($player1Copas - $player2Copas);
    $baseCupChange = 30;
    
    if ($copasDiff > 500) {
        $baseCupChange = 40; // Más copas si derrotas a alguien más fuerte
    } elseif ($copasDiff < 100) {
        $baseCupChange = 25; // Menos copas si es rango similar
    }
    
    // El ganador gana copas, el perdedor pierde copas
    $player1CupChange = 0;
    $player2CupChange = 0;
    
    if ($winnerId == $player1Id) {
        $player1CupChange = $baseCupChange;
        $player2CupChange = -$baseCupChange;
    } else {
        $player1CupChange = -$baseCupChange;
        $player2CupChange = $baseCupChange;
    }
    
    // Actualizar copas y victorias/derrotas
    $stmt = $db->prepare("
        UPDATE usuarios 
        SET copas = GREATEST(0, copas + ?),
            victorias = victorias + ?
        WHERE id = ?
    ");
    $winIncrement = 1;
    $winnerCupChange = $winnerId == $player1Id ? $player1CupChange : $player2CupChange;
    $stmt->execute([$winnerCupChange, $winIncrement, $winnerId]);
    
    $stmt = $db->prepare("
        UPDATE usuarios 
        SET copas = GREATEST(0, copas + ?),
            derrotas = derrotas + 1
        WHERE id = ?
    ");
    $loserId = $winnerId == $player1Id ? $player2Id : $player1Id;
    $loserCupChange = $winnerId == $player1Id ? $player2CupChange : $player1CupChange;
    $stmt->execute([$loserCupChange, $loserId]);
    
    // Calcular duración de la batalla
    $duration = time() - strtotime($battle['created_at']);
    
    // Guardar en historial para ambos jugadores
    saveMatchHistory($db, $battle['id'], $player1Id, $player2Id, $winnerId, $player1CupChange, $duration, $state, $battle);
    saveMatchHistory($db, $battle['id'], $player2Id, $player1Id, $winnerId, $player2CupChange, $duration, $state, $battle);
}

/**
 * Guardar partida en el historial
 */
function saveMatchHistory($db, $battleId, $playerId, $opponentId, $winnerId, $cupChange, $duration, $state, $battle) {
    $result = $playerId == $winnerId ? 'win' : 'loss';
    $isPlayer1 = $playerId == $battle['player1_id'];
    
    $playerState = $isPlayer1 ? $state['player1'] : $state['player2'];
    $opponentState = $isPlayer1 ? $state['player2'] : $state['player1'];
    
    $damageDealt = $opponentState['maxHealth'] - $opponentState['health'];
    $damageReceived = $playerState['maxHealth'] - $playerState['health'];
    
    $stmt = $db->prepare("
        INSERT INTO online_match_history (
            battle_id, player_id, opponent_id,
            player_username, opponent_username,
            player_character_id, opponent_character_id,
            result, cups_change, duration_seconds,
            damage_dealt, damage_received, rounds_played
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $playerUsername = $isPlayer1 ? $battle['player1_username'] : $battle['player2_username'];
    $opponentUsername = $isPlayer1 ? $battle['player2_username'] : $battle['player1_username'];
    $playerCharId = $isPlayer1 ? $battle['player1_character_id'] : $battle['player2_character_id'];
    $opponentCharId = $isPlayer1 ? $battle['player2_character_id'] : $battle['player1_character_id'];
    $rounds = $state['round'];
    
    $stmt->execute([
        $battleId, $playerId, $opponentId,
        $playerUsername, $opponentUsername,
        $playerCharId, $opponentCharId,
        $result, $cupChange, $duration,
        $damageDealt, $damageReceived, $rounds
    ]);
}

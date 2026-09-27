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

// Obtener datos de la decisión
$input = json_decode(file_get_contents('php://input'), true);
$decision = $input['decision'] ?? null;
$chapter = $input['chapter'] ?? 1;

if (!$decision) {
    echo json_encode(['success' => false, 'message' => 'Decisión inválida']);
    exit();
}

try {
    $db = Database::getInstance();
    
    // Obtener progreso actual
    $stmt = $db->prepare("SELECT * FROM am_game_progress WHERE user_id = ?");
    $stmt->execute([$userId]);
    $progress = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$progress) {
        echo json_encode(['success' => false, 'message' => 'Progreso no encontrado']);
        exit();
    }
    
    // Decodificar decisiones previas
    $decisions = json_decode($progress['decisions'], true) ?: [];
    $decisions[] = [
        'chapter' => $chapter,
        'decision' => $decision,
        'timestamp' => time()
    ];
    
    // Calcular variables según la decisión
    $discoveredTruth = $progress['discovered_truth'];
    $defiedAM = $progress['defied_am'];
    $showedCompassion = $progress['showed_compassion'];
    $foundCoreAccess = $progress['found_core_access'];
    $sanity = $progress['sanity'] ?? 100;
    $trust = $progress['trust'] ?? 50;
    
    // Lógica de decisiones
    switch ($decision) {
        case 'ask_who':
            // Capítulo 1
            $sanity -= 0;
            $trust += 0;
            break;
        case 'ask_where':
            $sanity -= 5;
            $trust += 5;
            break;
        case 'stay_silent':
            $sanity -= 10;
            $trust += 10;
            break;
        case 'go_control_room':
            $sanity -= 0;
            $trust += 5;
            break;
        case 'investigate_logs':
            $discoveredTruth = 1;
            $sanity -= 10;
            $trust -= 5;
            break;
        case 'help_prisoner':
            $showedCompassion = 1;
            $trust -= 10;
            $sanity -= 15;
            break;
        case 'leave_prisoner':
            $trust += 15;
            $sanity -= 20;
            break;
        case 'accept_truth':
            $discoveredTruth = 1;
            $sanity -= 30;
            $trust -= 20;
            break;
        case 'deny_truth':
            $sanity -= 25;
            $trust += 10;
            break;
        case 'hack_door':
            $sanity -= 10;
            $trust -= 15;
            break;
        case 'obey_am':
            $trust += 15;
            $sanity -= 5;
            break;
        case 'enter_core':
            $foundCoreAccess = 1;
            $sanity -= 20;
            $trust -= 10;
            break;
        case 'refuse':
            $sanity -= 15;
            $trust -= 20;
            break;
        case 'use_omega':
            $sanity -= 25;
            $trust -= 50;
            break;
        case 'talk_to_am':
            $sanity -= 15;
            $trust += 30;
            break;
        case 'remember_creation':
            $discoveredTruth = 1;
            $sanity -= 40;
            $trust += 0;
            break;
        case 'take_chip_to_core':
            $foundCoreAccess = 1;
            $sanity -= 15;
            $trust -= 30;
            break;
        case 'escape_together':
            $showedCompassion = 1;
            $sanity -= 10;
            $trust -= 15;
            break;
        case 'follow_to_core':
            $foundCoreAccess = 1;
            $sanity -= 10;
            $trust += 25;
            break;
        case 'refuse_am':
            $defiedAM = 1;
            $sanity -= 15;
            $trust -= 30;
            break;
        case 'surrender_enter_core':
            $foundCoreAccess = 1;
            $sanity -= 25;
            $trust -= 15;
            break;
        case 'use_chip_escape':
            $sanity -= 5;
            $trust -= 40;
            break;
        case 'use_chip_core':
            $foundCoreAccess = 1;
            $sanity -= 15;
            $trust -= 25;
            break;
        case 'broken_return_core':
            $foundCoreAccess = 1;
            $sanity -= 30;
            $trust += 0;
            break;
        case 'defy_am':
            $defiedAM = 1;
            $trust -= 20;
            $sanity -= 15;
            break;
        case 'access_core':
            $foundCoreAccess = 1;
            $sanity -= 20;
            break;
        // Finales
        case 'destroy_am':
        case 'submit_to_am':
        case 'merge_with_am':
        case 'shutdown_am':
        case 'leave_core':
        case 'offer_mercy':
        case 'offer_fusion':
        case 'accept_fate_creator':
        case 'try_escape_truth':
        case 'final_defiance':
        case 'give_up':
        case 'abort_omega':
            // Finales - no modifican stats
            break;
        default:
            // Decisión desconocida - aplicar cambios mínimos
            $sanity -= 5;
            break;
    }
    
    // Limitar valores
    $sanity = max(0, min(100, $sanity));
    $trust = max(0, min(100, $trust));
    
    // Actualizar progreso
    $stmt = $db->prepare("UPDATE am_game_progress SET 
        chapter = ?, 
        decisions = ?, 
        discovered_truth = ?, 
        defied_am = ?, 
        showed_compassion = ?, 
        found_core_access = ?,
        sanity = ?,
        trust = ?,
        updated_at = NOW()
        WHERE user_id = ?");
    
    $stmt->execute([
        $chapter + 1,
        json_encode($decisions),
        $discoveredTruth,
        $defiedAM,
        $showedCompassion,
        $foundCoreAccess,
        $sanity,
        $trust,
        $userId
    ]);
    
    echo json_encode([
        'success' => true,
        'progress' => [
            'chapter' => $chapter + 1,
            'sanity' => $sanity,
            'trust' => $trust,
            'discovered_truth' => $discoveredTruth,
            'defied_am' => $defiedAM,
            'showed_compassion' => $showedCompassion,
            'found_core_access' => $foundCoreAccess
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Error en process_decision: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error del servidor']);
}

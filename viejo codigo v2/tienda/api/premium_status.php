<?php
/**
 * API: Gestionar estado premium del marketplace
 * Endpoint: GET /tienda/api/premium_status.php
 * Solo administradores pueden activar/desactivar premium
 */

require_once '../../includes/Database.php';

header('Content-Type: application/json');

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Sesión inválida']);
    exit();
}

try {
    $db = Database::getInstance();
    
    // GET: Verificar estado premium
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $db->prepare("
            SELECT * FROM marketplace_premium 
            WHERE user_id = ? AND premium_active = 1
        ");
        $stmt->execute([$userData['id']]);
        $premium = $stmt->fetch();
        
        echo json_encode([
            'success' => true,
            'is_premium' => (bool)$premium,
            'premium_data' => $premium ?: null
        ]);
        exit();
    }
    
    // POST: Activar premium (requiere ser admin)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Verificar si es administrador
        if (strtolower($userData['rango']) !== 'admin') {
            throw new Exception('Solo administradores pueden activar premium');
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $input = $_POST;
        }
        
        $targetUserId = isset($input['target_user_id']) ? (int)$input['target_user_id'] : 0;
        $durationDays = isset($input['duration_days']) ? (int)$input['duration_days'] : 30;
        
        if ($targetUserId <= 0) {
            throw new Exception('ID de usuario inválido');
        }
        
        // Verificar que el usuario existe
        $userStmt = $db->prepare("SELECT id, username FROM usuarios WHERE id = ?");
        $userStmt->execute([$targetUserId]);
        $targetUser = $userStmt->fetch();
        
        if (!$targetUser) {
            throw new Exception('Usuario no encontrado');
        }
        
        $db->beginTransaction();
        
        // Verificar si ya tiene premium
        $checkStmt = $db->prepare("SELECT id FROM marketplace_premium WHERE user_id = ?");
        $checkStmt->execute([$targetUserId]);
        $existing = $checkStmt->fetch();
        
        if ($existing) {
            // Actualizar premium existente
            $endDate = date('Y-m-d H:i:s', strtotime("+{$durationDays} days"));
            $updateStmt = $db->prepare("
                UPDATE marketplace_premium 
                SET premium_active = 1, 
                    premium_start_date = NOW(), 
                    premium_end_date = ?
                WHERE user_id = ?
            ");
            $updateStmt->execute([$endDate, $targetUserId]);
        } else {
            // Crear nuevo premium
            $endDate = date('Y-m-d H:i:s', strtotime("+{$durationDays} days"));
            $insertStmt = $db->prepare("
                INSERT INTO marketplace_premium (
                    user_id, 
                    username, 
                    premium_active, 
                    premium_end_date
                ) VALUES (?, ?, 1, ?)
            ");
            $insertStmt->execute([$targetUserId, $targetUser['username'], $endDate]);
        }
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Premium activado para ' . $targetUser['username'],
            'end_date' => $endDate
        ]);
        exit();
    }
    
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    
} catch (Exception $e) {
    if ($db->getConnection()->inTransaction()) {
        $db->rollback();
    }
    
    error_log("Error in premium_status.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

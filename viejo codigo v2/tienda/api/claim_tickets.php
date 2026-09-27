<?php
require_once '../../includes/Database.php';

header('Content-Type: application/json');

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
    exit();
}

$db = Database::getInstance();

// Obtener datos de la solicitud
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

try {
    if ($action === 'claim_all') {
        $db->beginTransaction();
        
        // Obtener todos los tickets pendientes del usuario
        $ticketsStmt = $db->prepare("
            SELECT * FROM tienda_tickets 
            WHERE user_id = ? AND claimed = 0
            FOR UPDATE
        ");
        $ticketsStmt->execute([$userData['id']]);
        $tickets = $ticketsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($tickets)) {
            $db->rollback();
            echo json_encode([
                'success' => false,
                'message' => 'No hay tickets pendientes para reclamar'
            ]);
            exit();
        }
        
        // Marcar todos como reclamados
        $claimStmt = $db->prepare("
            UPDATE tienda_tickets 
            SET claimed = 1, claimed_date = NOW()
            WHERE user_id = ? AND claimed = 0
        ");
        $claimStmt->execute([$userData['id']]);
        $claimedCount = $claimStmt->rowCount();
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Tickets reclamados exitosamente',
            'tickets_claimed' => $claimedCount,
            'tickets' => $tickets
        ]);
        
    } elseif ($action === 'claim_single') {
        $ticketId = $input['ticket_id'] ?? 0;
        
        $db->beginTransaction();
        
        // Verificar que el ticket pertenece al usuario
        $verifyStmt = $db->prepare("
            SELECT * FROM tienda_tickets 
            WHERE id = ? AND user_id = ? AND claimed = 0
            FOR UPDATE
        ");
        $verifyStmt->execute([$ticketId, $userData['id']]);
        $ticket = $verifyStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$ticket) {
            $db->rollback();
            echo json_encode([
                'success' => false,
                'message' => 'Ticket no encontrado o ya reclamado'
            ]);
            exit();
        }
        
        // Marcar como reclamado
        $claimStmt = $db->prepare("
            UPDATE tienda_tickets 
            SET claimed = 1, claimed_date = NOW()
            WHERE id = ? AND user_id = ?
        ");
        $claimStmt->execute([$ticketId, $userData['id']]);
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Ticket reclamado exitosamente',
            'ticket' => $ticket
        ]);
        
    } elseif ($action === 'get_report') {
        // Obtener todos los tickets para generar reporte
        $ticketsStmt = $db->prepare("
            SELECT * FROM tienda_tickets 
            WHERE user_id = ? AND claimed = 0
            ORDER BY created_at DESC
        ");
        $ticketsStmt->execute([$userData['id']]);
        $tickets = $ticketsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'tickets' => $tickets,
            'user' => [
                'username' => $userData['username'],
                'id' => $userData['id']
            ]
        ]);
        
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Acción no válida'
        ]);
    }
    
} catch (Exception $e) {
    if ($db->getConnection()->inTransaction()) {
        $db->rollback();
    }
    
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

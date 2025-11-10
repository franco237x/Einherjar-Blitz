<?php
/**
 * API: Crear anuncio en marketplace desde inventario (recompensa o ticket)
 * Endpoint: POST /tienda/api/create_listing_from_inventory.php
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

try {
    $db = Database::getInstance();
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }
    
    // Parámetros requeridos
    $sourceType = trim($input['source_type'] ?? ''); // 'recompensa' o 'ticket'
    $sourceId = (int)($input['source_id'] ?? 0);
    $priceEsferas = isset($input['price_esferas']) ? (int)$input['price_esferas'] : 0;
    $priceLlaves = isset($input['price_llaves']) ? (int)$input['price_llaves'] : 0;
    $priceCupones = isset($input['price_cupones']) ? (int)$input['price_cupones'] : 0;
    $description = trim($input['description'] ?? '');
    
    // Validaciones
    if (!in_array($sourceType, ['recompensa', 'ticket'])) {
        throw new Exception('Tipo de fuente inválido');
    }
    
    if ($sourceId <= 0) {
        throw new Exception('ID de artículo inválido');
    }
    
    if ($priceEsferas <= 0 && $priceLlaves <= 0 && $priceCupones <= 0) {
        throw new Exception('Debes establecer al menos un precio');
    }
    
    $db->beginTransaction();
    
    $itemName = '';
    $itemCategory = 'General';
    $itemImageUrl = null;
    $rewardId = null;
    $ticketId = null;
    
    if ($sourceType === 'recompensa') {
        // Verificar que la recompensa existe y pertenece al usuario
        $recompensaStmt = $db->prepare("
            SELECT * FROM recompensas_usuario 
            WHERE id = ? AND user_id = ?
            AND tipo_recompensa NOT LIKE '%_vendido%'
            AND tipo_recompensa NOT LIKE '%_marketplace%'
            FOR UPDATE
        ");
        $recompensaStmt->execute([$sourceId, $userData['id']]);
        $recompensa = $recompensaStmt->fetch();
        
        if (!$recompensa) {
            throw new Exception('Recompensa no encontrada o no disponible para venta');
        }
        
        $itemName = $recompensa['recompensa_obtenida'];
        $itemCategory = $recompensa['tipo_recompensa'];
        $rewardId = $recompensa['id'];
        
        // Marcar recompensa como en marketplace
        $updateRecompensa = $db->prepare("
            UPDATE recompensas_usuario 
            SET tipo_recompensa = CONCAT(tipo_recompensa, '_marketplace')
            WHERE id = ?
        ");
        $updateRecompensa->execute([$sourceId]);
        
    } else if ($sourceType === 'ticket') {
        // Verificar que el ticket existe, pertenece al usuario y no está reclamado
        $ticketStmt = $db->prepare("
            SELECT * FROM tienda_tickets 
            WHERE id = ? AND user_id = ? AND claimed = 0
            AND ticket_type IN ('tienda', 'marketplace_compra')
            FOR UPDATE
        ");
        $ticketStmt->execute([$sourceId, $userData['id']]);
        $ticket = $ticketStmt->fetch();
        
        if (!$ticket) {
            throw new Exception('Ticket no encontrado o no disponible para venta');
        }
        
        $itemName = $ticket['item_name'];
        $itemCategory = $ticket['categoria'] ?? 'Tienda';
        $itemImageUrl = $ticket['imagen_url'];
        $ticketId = $ticket['id'];
        
        // Marcar ticket como "en venta" (lo reclamamos pero indicamos que está en marketplace)
        $updateTicket = $db->prepare("
            UPDATE tienda_tickets 
            SET claimed = 1, 
                claimed_date = NOW(),
                notes = CONCAT(COALESCE(notes, ''), ' [EN MARKETPLACE]')
            WHERE id = ?
        ");
        $updateTicket->execute([$sourceId]);
    }
    
    // Crear el listing en marketplace
    $createListing = $db->prepare("
        INSERT INTO marketplace_listings (
            seller_id,
            seller_username,
            item_name,
            item_description,
            item_category,
            item_image_url,
            price_esferas,
            price_llaves,
            price_cupones,
            stock_quantity,
            is_active,
            reward_id,
            ticket_id,
            source_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
    ");
    
    $createListing->execute([
        $userData['id'],
        $userData['username'],
        $itemName,
        $description ?: "Artículo en venta",
        $itemCategory,
        $itemImageUrl,
        $priceEsferas,
        $priceLlaves,
        $priceCupones,
        $rewardId,
        $ticketId,
        $sourceType
    ]);
    
    $listingId = $db->lastInsertId();
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => '¡Anuncio publicado exitosamente!',
        'listing_id' => $listingId,
        'item_name' => $itemName
    ]);
    
} catch (Exception $e) {
    if ($db->getConnection()->inTransaction()) {
        $db->rollback();
    }
    
    error_log("Error in create_listing_from_inventory.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

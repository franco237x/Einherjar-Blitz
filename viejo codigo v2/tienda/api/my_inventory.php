<?php
/**
 * API: Obtener inventario de recompensas del usuario
 * Endpoint: GET /tienda/api/my_inventory.php
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
    
    $inventory = [];
    
    // 1. Obtener recompensas del gacha disponibles (no vendidas, no en marketplace)
    $recompensasStmt = $db->prepare("
        SELECT 
            id,
            'recompensa' as source_type,
            recompensa_obtenida as item_name,
            tipo_recompensa as item_type,
            valor as item_value,
            fecha_obtencion as obtained_date,
            NULL as imagen_url,
            NULL as categoria
        FROM recompensas_usuario
        WHERE user_id = ? 
        AND tipo_recompensa NOT LIKE '%_vendido%'
        AND tipo_recompensa NOT LIKE '%_marketplace%'
        ORDER BY fecha_obtencion DESC
    ");
    $recompensasStmt->execute([$userData['id']]);
    $recompensas = $recompensasStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 2. Obtener tickets no reclamados de tienda/marketplace (compras)
    $ticketsStmt = $db->prepare("
        SELECT 
            id,
            'ticket' as source_type,
            item_name,
            ticket_type as item_type,
            cantidad as quantity,
            precio_pagado as item_value,
            moneda_usada as currency,
            created_at as obtained_date,
            imagen_url,
            categoria
        FROM tienda_tickets
        WHERE user_id = ? 
        AND claimed = 0
        AND ticket_type IN ('tienda', 'marketplace_compra')
        ORDER BY created_at DESC
    ");
    $ticketsStmt->execute([$userData['id']]);
    $tickets = $ticketsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 3. Verificar si ya tienen listings activos
    foreach ($recompensas as &$item) {
        $listingCheck = $db->prepare("
            SELECT id FROM marketplace_listings 
            WHERE reward_id = ? AND is_active = 1 AND is_sold = 0
        ");
        $listingCheck->execute([$item['id']]);
        $item['has_active_listing'] = (bool)$listingCheck->fetch();
        $item['display_name'] = $item['item_name'] . ' (Gacha)';
    }
    
    foreach ($tickets as &$item) {
        $listingCheck = $db->prepare("
            SELECT id FROM marketplace_listings 
            WHERE ticket_id = ? AND is_active = 1 AND is_sold = 0
        ");
        $listingCheck->execute([$item['id']]);
        $item['has_active_listing'] = (bool)$listingCheck->fetch();
        $item['display_name'] = $item['item_name'] . ' (Tienda)';
    }
    
    // Combinar ambos arrays
    $inventory = array_merge($recompensas, $tickets);
    
    echo json_encode([
        'success' => true,
        'inventory' => $inventory,
        'total' => count($inventory),
        'recompensas_count' => count($recompensas),
        'tickets_count' => count($tickets)
    ]);
    
} catch (Exception $e) {
    error_log("Error in my_inventory.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener tu inventario: ' . $e->getMessage()
    ]);
}

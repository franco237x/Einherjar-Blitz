<?php
/**
 * API: Obtener inventario del usuario (recompensas + tickets no reclamados)
 * Endpoint: GET /tienda/api/get_inventory.php
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
    
    // 1. Obtener recompensas del gacha (recompensas_usuario)
    // Excluir las que ya están en el marketplace o vendidas
    $recompensasStmt = $db->prepare("
        SELECT 
            id,
            'recompensa' as source_type,
            recompensa_obtenida as item_name,
            tipo_recompensa as item_type,
            valor as item_value,
            fecha_obtencion as obtained_date,
            NULL as imagen_url
        FROM recompensas_usuario
        WHERE user_id = ? 
        AND tipo_recompensa NOT LIKE '%_vendido%'
        AND tipo_recompensa NOT LIKE '%_marketplace%'
        ORDER BY fecha_obtencion DESC
    ");
    $recompensasStmt->execute([$userData['id']]);
    $recompensas = $recompensasStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 2. Obtener tickets no reclamados (tienda_tickets)
    // Solo tickets de compra (tienda y marketplace_compra)
    $ticketsStmt = $db->prepare("
        SELECT 
            id,
            'ticket' as source_type,
            item_name,
            ticket_type as item_type,
            cantidad as quantity,
            precio_pagado as paid_price,
            moneda_usada as currency,
            created_at as obtained_date,
            imagen_url,
            categoria as category
        FROM tienda_tickets
        WHERE user_id = ? 
        AND claimed = 0
        AND ticket_type IN ('tienda', 'marketplace_compra')
        ORDER BY created_at DESC
    ");
    $ticketsStmt->execute([$userData['id']]);
    $tickets = $ticketsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Combinar ambos inventarios
    $inventory = [
        'recompensas' => $recompensas,
        'tickets' => $tickets,
        'total_items' => count($recompensas) + count($tickets)
    ];
    
    echo json_encode([
        'success' => true,
        'inventory' => $inventory
    ]);
    
} catch (Exception $e) {
    error_log("Error in get_inventory.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener inventario: ' . $e->getMessage()
    ]);
}

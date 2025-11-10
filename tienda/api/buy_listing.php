<?php
/**
 * API: Comprar un artículo del marketplace
 * Endpoint: POST /tienda/api/buy_listing.php
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
    
    $listingId = isset($input['listing_id']) ? (int)$input['listing_id'] : 0;
    $paymentMethod = trim($input['payment_method'] ?? ''); // llaves, esferas, cupones
    
    if ($listingId <= 0) {
        throw new Exception('ID de anuncio inválido');
    }
    
    if (!in_array($paymentMethod, ['llaves', 'esferas', 'cupones'])) {
        throw new Exception('Método de pago inválido');
    }
    
    $db->beginTransaction();
    
    // Obtener el listing con bloqueo
    $listingStmt = $db->prepare("
        SELECT * FROM marketplace_listings 
        WHERE id = ? AND is_active = 1 AND is_sold = 0 AND stock_quantity > 0
        FOR UPDATE
    ");
    $listingStmt->execute([$listingId]);
    $listing = $listingStmt->fetch();
    
    if (!$listing) {
        throw new Exception('El anuncio no está disponible o ya fue vendido');
    }
    
    // No puedes comprar tu propio anuncio
    if ((int)$listing['seller_id'] === (int)$userData['id']) {
        throw new Exception('No puedes comprar tu propio anuncio');
    }
    
    // Determinar precio según método de pago
    $price = 0;
    $priceField = '';
    $userField = '';
    
    switch ($paymentMethod) {
        case 'llaves':
            $price = (int)$listing['price_llaves'];
            $priceField = 'price_llaves';
            $userField = 'llaves';
            break;
        case 'esferas':
            $price = (int)$listing['price_esferas'];
            $priceField = 'price_esferas';
            $userField = 'recompensas';
            break;
        case 'cupones':
            $price = (int)$listing['price_cupones'];
            $priceField = 'price_cupones';
            // Los cupones se manejan diferente (no se deducen del usuario)
            break;
    }
    
    if ($price <= 0) {
        throw new Exception('Este artículo no está disponible con ese método de pago');
    }
    
    // Obtener datos del comprador con bloqueo
    $buyerStmt = $db->prepare("SELECT id, username, llaves, recompensas FROM usuarios WHERE id = ? FOR UPDATE");
    $buyerStmt->execute([$userData['id']]);
    $buyer = $buyerStmt->fetch();
    
    if (!$buyer) {
        throw new Exception('Error al validar tu usuario');
    }
    
    // Validar fondos (solo para llaves y esferas)
    if ($paymentMethod !== 'cupones') {
        if ((int)$buyer[$userField] < $price) {
            throw new Exception('No tienes suficientes ' . ucfirst($paymentMethod));
        }
        
        // Deducir del comprador
        $deductStmt = $db->prepare("UPDATE usuarios SET $userField = $userField - ? WHERE id = ?");
        $deductStmt->execute([$price, $userData['id']]);
    }
    
    // Obtener datos del vendedor con bloqueo
    $sellerStmt = $db->prepare("SELECT id, username, llaves, recompensas FROM usuarios WHERE id = ? FOR UPDATE");
    $sellerStmt->execute([$listing['seller_id']]);
    $seller = $sellerStmt->fetch();
    
    if (!$seller) {
        throw new Exception('Error al validar el vendedor');
    }
    
    // Pagar al vendedor
    $createSellerTicket = false; // Por defecto no crear ticket
    
    if ($paymentMethod === 'llaves') {
        // Acreditar directamente las llaves al vendedor
        $payStmt = $db->prepare("UPDATE usuarios SET llaves = llaves + ? WHERE id = ?");
        $payStmt->execute([$price, $seller['id']]);
    } elseif ($paymentMethod === 'esferas') {
        // Acreditar directamente las esferas al vendedor
        $payStmt = $db->prepare("UPDATE usuarios SET recompensas = recompensas + ? WHERE id = ?");
        $payStmt->execute([$price, $seller['id']]);
    } elseif ($paymentMethod === 'cupones') {
        // Los cupones NO se acreditan automáticamente - se crea ticket para reclamar
        $createSellerTicket = true;
    }
    
    // Registrar transacción
    $transactionStmt = $db->prepare("
        INSERT INTO marketplace_transactions (
            listing_id,
            seller_id,
            seller_username,
            buyer_id,
            buyer_username,
            item_name,
            paid_llaves,
            paid_esferas,
            paid_cupones,
            transaction_type,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
    ");
    
    $transactionStmt->execute([
        $listingId,
        $seller['id'],
        $seller['username'],
        $buyer['id'],
        $buyer['username'],
        $listing['item_name'],
        $paymentMethod === 'llaves' ? $price : 0,
        $paymentMethod === 'esferas' ? $price : 0,
        $paymentMethod === 'cupones' ? $price : 0,
        $paymentMethod
    ]);
    
    $transactionId = $db->lastInsertId();
    
    // NUEVO: Crear ticket para el comprador
    $monedaUsada = $paymentMethod === 'cupones' ? 'cupones_azules' : $paymentMethod;
    $insertTicket = $db->prepare("
        INSERT INTO tienda_tickets (
            user_id, username, ticket_type, item_name, item_description,
            cantidad, precio_pagado, moneda_usada, categoria, imagen_url,
            transaction_id, seller_id, seller_username, listing_id
        ) VALUES (?, ?, 'marketplace_compra', ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $insertTicket->execute([
        $buyer['id'],
        $buyer['username'],
        $listing['item_name'],
        $listing['description'] ?? null,
        $price,
        $monedaUsada,
        $listing['item_category'] ?? 'Marketplace',
        $listing['item_image_url'] ?? null,
        $transactionId,
        $seller['id'],
        $seller['username'],
        $listingId
    ]);
    
    // NUEVO: Crear ticket para el vendedor SOLO si es pago con cupones
    if ($createSellerTicket) {
        $insertSellerTicket = $db->prepare("
            INSERT INTO tienda_tickets (
                user_id, username, ticket_type, item_name, item_description,
                cantidad, precio_pagado, moneda_usada, categoria, imagen_url,
                transaction_id, listing_id, notes
            ) VALUES (?, ?, 'marketplace_venta', ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
        ");
        $insertSellerTicket->execute([
            $seller['id'],
            $seller['username'],
            $listing['item_name'],
            $listing['description'] ?? null,
            $price,
            $monedaUsada,
            $listing['item_category'] ?? 'Marketplace',
            $listing['item_image_url'] ?? null,
            $transactionId,
            $listingId,
            'Vendido a: ' . $buyer['username']
        ]);
    }
    
    // Actualizar stock o marcar como vendido
    if ((int)$listing['stock_quantity'] <= 1) {
        $updateStmt = $db->prepare("
            UPDATE marketplace_listings 
            SET is_sold = 1, stock_quantity = 0, sold_at = NOW() 
            WHERE id = ?
        ");
        $updateStmt->execute([$listingId]);
    } else {
        $updateStmt = $db->prepare("
            UPDATE marketplace_listings 
            SET stock_quantity = stock_quantity - 1 
            WHERE id = ?
        ");
        $updateStmt->execute([$listingId]);
    }
    
    // Si el listing tenía reward_id, marcar la recompensa original como vendida
    if ($listing['reward_id']) {
        $markSoldStmt = $db->prepare("
            UPDATE recompensas_usuario 
            SET tipo_recompensa = CONCAT(tipo_recompensa, '_vendido')
            WHERE id = ?
        ");
        $markSoldStmt->execute([$listing['reward_id']]);
    }
    
    // Si el listing tenía ticket_id, el ticket ya está marcado como claimed
    // No necesitamos hacer nada adicional, solo verificar que está marcado
    if (isset($listing['ticket_id']) && $listing['ticket_id']) {
        // El ticket ya debería estar marcado como claimed cuando se creó el listing
        // Solo agregamos una nota adicional si es necesario
        $updateTicketNote = $db->prepare("
            UPDATE tienda_tickets 
            SET notes = CONCAT(COALESCE(notes, ''), ' [VENDIDO]')
            WHERE id = ?
        ");
        $updateTicketNote->execute([$listing['ticket_id']]);
    }
    
    $db->commit();
    
    // Mensaje personalizado según método de pago
    $message = '¡Compra exitosa! ' . $listing['item_name'] . ' ha sido agregado a tu inventario.';
    if ($paymentMethod === 'cupones') {
        $message .= ' El vendedor recibirá sus cupones cuando los reclame.';
    } else {
        $message .= ' El vendedor ha recibido su pago automáticamente.';
    }
    
    echo json_encode([
        'success' => true,
        'message' => $message,
        'transaction_id' => $transactionId,
        'item_name' => $listing['item_name'],
        'paid_amount' => $price,
        'payment_method' => $paymentMethod,
        'seller_paid_auto' => !$createSellerTicket
    ]);
    
} catch (Exception $e) {
    if ($db->getConnection()->inTransaction()) {
        $db->rollback();
    }
    
    error_log("Error in buy_listing.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

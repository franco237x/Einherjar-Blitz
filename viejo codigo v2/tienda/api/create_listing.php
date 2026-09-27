<?php
/**
 * API: Crear un nuevo anuncio en el marketplace
 * Endpoint: POST /tienda/api/create_listing.php
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
    
    // Verificar si el usuario es premium
    $premiumStmt = $db->prepare("SELECT * FROM marketplace_premium WHERE user_id = ? AND premium_active = 1");
    $premiumStmt->execute([$userData['id']]);
    $isPremium = $premiumStmt->fetch();
    
    // Leer datos del POST
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        $input = $_POST;
    }
    
    // Nuevo formato: reward_id puede ser "tipo:id" (ej: "ticket:123" o "recompensa:456")
    $inventorySelection = trim($input['reward_id'] ?? '');
    $sourceType = null;
    $sourceId = null;
    $rewardId = null;
    $ticketId = null;
    
    // Parsear selección de inventario
    if (!empty($inventorySelection) && strpos($inventorySelection, ':') !== false) {
        list($sourceType, $sourceId) = explode(':', $inventorySelection, 2);
        $sourceId = (int)$sourceId;
        
        if ($sourceType === 'recompensa') {
            $rewardId = $sourceId;
        } elseif ($sourceType === 'ticket') {
            $ticketId = $sourceId;
        }
    } elseif (!empty($inventorySelection)) {
        // Soporte legacy: si es solo un número, asumir que es recompensa
        $rewardId = (int)$inventorySelection;
        $sourceType = 'recompensa';
    }
    
    $itemName = trim($input['item_name'] ?? '');
    $itemDescription = trim($input['item_description'] ?? '');
    $itemImage = trim($input['item_image'] ?? '');
    $priceLlaves = isset($input['price_llaves']) ? (int)$input['price_llaves'] : 0;
    $priceEsferas = isset($input['price_esferas']) ? (int)$input['price_esferas'] : 0;
    $priceCupones = isset($input['price_cupones']) ? (int)$input['price_cupones'] : 0;
    $stockQuantity = isset($input['stock_quantity']) ? (int)$input['stock_quantity'] : 1;
    
    // CRÍTICO: Validar stock
    if ($stockQuantity < 1) {
        throw new Exception('El stock debe ser al menos 1');
    }
    
    // Si es desde inventario (recompensa o ticket), FORZAR stock = 1
    if (!empty($inventorySelection)) {
        if ($stockQuantity > 1) {
            throw new Exception('Los artículos del inventario solo pueden venderse con cantidad 1. Tienes UNA unidad de este artículo.');
        }
        $stockQuantity = 1; // Forzar a 1 por seguridad
    }
    
    // Solo premium puede vender más de 1 unidad (artículos personalizados)
    if ($stockQuantity > 1 && !$isPremium) {
        throw new Exception('Solo usuarios premium pueden vender múltiples unidades de artículos personalizados.');
    }
    
    // Validaciones básicas
    if (empty($itemName)) {
        throw new Exception('El nombre del artículo es obligatorio');
    }
    
    if ($priceLlaves <= 0 && $priceEsferas <= 0 && $priceCupones <= 0) {
        throw new Exception('Debes establecer al menos un precio (Llaves, Esferas o Cupones)');
    }
    
    $db->beginTransaction();
    
    $itemCategory = 'General';
    $itemImageUrl = null;
    
    // Validar y procesar según el tipo de fuente
    if ($rewardId !== null) {
        // Validar recompensa del gacha
        $rewardStmt = $db->prepare("
            SELECT id, recompensa_obtenida, tipo_recompensa 
            FROM recompensas_usuario 
            WHERE id = ? AND user_id = ? 
            AND tipo_recompensa NOT LIKE '%_vendido%'
            AND tipo_recompensa NOT LIKE '%_marketplace%'
        ");
        $rewardStmt->execute([$rewardId, $userData['id']]);
        $reward = $rewardStmt->fetch();
        
        if (!$reward) {
            throw new Exception('La recompensa no existe o ya fue vendida');
        }
        
        // Marcar recompensa como en marketplace
        $updateReward = $db->prepare("
            UPDATE recompensas_usuario 
            SET tipo_recompensa = CONCAT(tipo_recompensa, '_marketplace')
            WHERE id = ?
        ");
        $updateReward->execute([$rewardId]);
        
        // Si no se especificó nombre, usar el de la recompensa
        if (empty($itemName)) {
            $itemName = $reward['recompensa_obtenida'];
        }
        $itemCategory = $reward['tipo_recompensa'];
        
    } elseif ($ticketId !== null) {
        // Validar ticket de tienda
        $ticketStmt = $db->prepare("
            SELECT id, item_name, categoria, imagen_url 
            FROM tienda_tickets 
            WHERE id = ? AND user_id = ? AND claimed = 0
            AND ticket_type IN ('tienda', 'marketplace_compra')
        ");
        $ticketStmt->execute([$ticketId, $userData['id']]);
        $ticket = $ticketStmt->fetch();
        
        if (!$ticket) {
            throw new Exception('El ticket no existe o ya fue reclamado');
        }
        
        // Marcar ticket como claimed (en marketplace)
        $updateTicket = $db->prepare("
            UPDATE tienda_tickets 
            SET claimed = 1, 
                claimed_date = NOW(),
                notes = CONCAT(COALESCE(notes, ''), ' [EN MARKETPLACE]')
            WHERE id = ?
        ");
        $updateTicket->execute([$ticketId]);
        
        // Usar datos del ticket
        if (empty($itemName)) {
            $itemName = $ticket['item_name'];
        }
        $itemCategory = $ticket['categoria'] ?? 'Tienda';
        $itemImageUrl = $ticket['imagen_url'];
        
    } else {
        // Solo usuarios premium pueden vender sin inventario
        if (!$isPremium) {
            throw new Exception('Solo usuarios premium pueden vender artículos personalizados. Debes seleccionar un artículo de tu inventario.');
        }
    }
    
    // Manejo de imagen
    $finalImage = $itemImageUrl; // Usar imagen del ticket/recompensa por defecto
    
    // Si es premium y subió una imagen personalizada
    if ($isPremium && isset($_FILES['item_image']) && $_FILES['item_image']['error'] === UPLOAD_ERR_OK) {
        // Validaciones de seguridad para la imagen
        $file = $_FILES['item_image'];
        $fileSize = $file['size'];
        $fileTmpName = $file['tmp_name'];
        $fileName = $file['name'];
        
        // Límite de 5MB
        $maxFileSize = 5 * 1024 * 1024; // 5MB en bytes
        if ($fileSize > $maxFileSize) {
            throw new Exception('La imagen no puede superar los 5MB');
        }
        
        // Validar tipo MIME real del archivo
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $fileTmpName);
        finfo_close($finfo);
        
        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($mimeType, $allowedMimes)) {
            throw new Exception('Solo se permiten imágenes (JPG, PNG, GIF, WEBP)');
        }
        
        // Validar extensión del archivo
        $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!in_array($extension, $allowedExtensions)) {
            throw new Exception('Extensión de archivo no permitida');
        }
        
        // Validar dimensiones de la imagen (max 2000x2000px)
        $imageInfo = getimagesize($fileTmpName);
        if ($imageInfo === false) {
            throw new Exception('El archivo no es una imagen válida');
        }
        
        list($width, $height) = $imageInfo;
        $maxDimension = 2000;
        if ($width > $maxDimension || $height > $maxDimension) {
            throw new Exception("Las dimensiones de la imagen no pueden superar {$maxDimension}x{$maxDimension} píxeles");
        }
        
        // Todo OK, proceder con la carga
        $uploadDir = '../../images/marketplace/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $filename = uniqid('marketplace_' . $userData['id'] . '_') . '.' . $extension;
        $uploadPath = $uploadDir . $filename;
        
        if (move_uploaded_file($fileTmpName, $uploadPath)) {
            $finalImage = '../images/marketplace/' . $filename;
        } else {
            throw new Exception('Error al subir la imagen');
        }
    } elseif (!empty($itemImage)) {
        $finalImage = $itemImage;
    }
    
    // Determinar si es premium listing
    $isPremiumListing = $isPremium ? 1 : 0;
    
    // Determinar source_type para la BD
    $sourceTypeDB = $sourceType ?? 'manual';
    
    // Crear el listing
    $insertStmt = $db->prepare("
        INSERT INTO marketplace_listings (
            seller_id, 
            seller_username, 
            item_name, 
            item_description, 
            item_image,
            item_category,
            item_image_url,
            reward_id,
            ticket_id,
            source_type,
            price_llaves, 
            price_esferas, 
            price_cupones,
            is_premium_listing,
            stock_quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $insertStmt->execute([
        $userData['id'],
        $userData['username'],
        $itemName,
        $itemDescription,
        $finalImage,
        $itemCategory,
        $finalImage, // item_image_url
        $rewardId,
        $ticketId,
        $sourceTypeDB,
        $priceLlaves,
        $priceEsferas,
        $priceCupones,
        $isPremiumListing,
        $stockQuantity
    ]);
    
    $listingId = $db->lastInsertId();
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Anuncio creado exitosamente',
        'listing_id' => $listingId,
        'is_premium' => $isPremiumListing
    ]);
    
} catch (Exception $e) {
    if ($db->getConnection()->inTransaction()) {
        $db->rollback();
    }
    
    error_log("Error in create_listing.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

<?php
/**
 * API: Obtener listados del marketplace
 * Endpoint: GET /tienda/api/marketplace_listings.php
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
    
    // Parámetros opcionales
    $listingId = $_GET['listing_id'] ?? null; // ID específico de listing
    $filter = $_GET['filter'] ?? 'all'; // all, esferas, llaves, cupones
    $sortBy = $_GET['sort'] ?? 'recent'; // recent, price_low, price_high, popular
    $searchQuery = $_GET['search'] ?? '';
    $premiumOnly = isset($_GET['premium']) && $_GET['premium'] === '1';
    
    // Construir query base
    $sql = "SELECT 
                ml.*,
                u.perfil_imagen as seller_avatar,
                u.rango as seller_rank,
                mp.premium_active as seller_is_premium,
                mp.highlighted_listing as seller_has_highlight,
                (SELECT COUNT(*) FROM marketplace_transactions WHERE listing_id = ml.id AND status = 'completed') as sales_count
            FROM marketplace_listings ml
            JOIN usuarios u ON ml.seller_id = u.id
            LEFT JOIN marketplace_premium mp ON ml.seller_id = mp.user_id AND mp.premium_active = 1
            WHERE ml.is_active = 1 AND ml.is_sold = 0 AND ml.stock_quantity > 0";
    
    $params = [];
    
    // Si se solicita un listing específico, filtrar por ID
    if ($listingId !== null) {
        $sql .= " AND ml.id = ?";
        $params[] = (int)$listingId;
    }
    
    // Filtro por tipo de precio
    if ($filter === 'esferas') {
        $sql .= " AND ml.price_esferas > 0";
    } elseif ($filter === 'llaves') {
        $sql .= " AND ml.price_llaves > 0";
    } elseif ($filter === 'cupones') {
        $sql .= " AND ml.price_cupones > 0";
    }
    
    // Filtro premium
    if ($premiumOnly) {
        $sql .= " AND ml.is_premium_listing = 1";
    }
    
    // Búsqueda
    if (!empty($searchQuery)) {
        $sql .= " AND (ml.item_name LIKE ? OR ml.item_description LIKE ? OR ml.seller_username LIKE ?)";
        $searchParam = '%' . $searchQuery . '%';
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
    }
    
    // Ordenamiento
    switch ($sortBy) {
        case 'price_low':
            $sql .= " ORDER BY 
                CASE 
                    WHEN ml.price_esferas > 0 THEN ml.price_esferas
                    WHEN ml.price_llaves > 0 THEN ml.price_llaves * 100
                    ELSE ml.price_cupones * 500
                END ASC";
            break;
        case 'price_high':
            $sql .= " ORDER BY 
                CASE 
                    WHEN ml.price_esferas > 0 THEN ml.price_esferas
                    WHEN ml.price_llaves > 0 THEN ml.price_llaves * 100
                    ELSE ml.price_cupones * 500
                END DESC";
            break;
        case 'popular':
            $sql .= " ORDER BY ml.views_count DESC, ml.created_at DESC";
            break;
        default: // recent
            $sql .= " ORDER BY ml.is_premium_listing DESC, ml.created_at DESC";
    }
    
    $sql .= " LIMIT 50";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $listings = $stmt->fetchAll();
    
    // Procesar resultados
    foreach ($listings as &$listing) {
        $listing['seller_avatar'] = $listing['seller_avatar'] ?? '../images/default-avatar.png';
        $listing['item_image'] = $listing['item_image'] ?? '../images/default-item.png';
        $listing['is_own_listing'] = (int)$listing['seller_id'] === (int)$userData['id'];
        $listing['seller_is_premium'] = (bool)$listing['seller_is_premium'];
        $listing['seller_has_highlight'] = (bool)$listing['seller_has_highlight'];
    }
    
    echo json_encode([
        'success' => true,
        'listings' => $listings,
        'total' => count($listings),
        'filters' => [
            'current_filter' => $filter,
            'sort_by' => $sortBy,
            'search_query' => $searchQuery
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Error in marketplace_listings.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener listados del marketplace'
    ]);
}

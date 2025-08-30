<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../includes/Database.php';

$auth = new AuthController();

if (!$auth->isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

try {
    $db = Database::getInstance();
    $userData = $auth->getUserData();
    $currentUserId = $userData['id'];
    
    // Get pagination parameters
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(50, intval($_GET['limit']))) : 6; // Default 6, max 50
    $offset = ($page - 1) * $limit;
    
    // Get total count for pagination info  
    $countQuery = $db->prepare("SELECT COUNT(DISTINCT t.id) as total FROM terrenos t WHERE t.activo = 1");
    $countQuery->execute();
    $totalCount = $countQuery->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get active terrains with metrics and ownership info (with pagination)
    $query = $db->prepare("
        SELECT 
            t.*,
            COALESCE(m.cambio_24h, 0) as cambio_24h,
            COALESCE(m.volumen_24h, 0) as volumen_24h,
            COALESCE(m.numero_holders, 0) as numero_holders,
            (t.precio_actual * t.supply_circulante) as market_cap,
            CASE 
                WHEN t.owner_id = ? THEN 'yours'
                WHEN t.owner_id IS NULL THEN 'unowned' 
                ELSE 'owned_by_other'
            END as ownership_status,
            u.username as owner_username
        FROM terrenos t
        LEFT JOIN terrenos_metricas m ON t.id = m.terreno_id 
            AND DATE(m.fecha) = CURDATE()
        LEFT JOIN usuarios u ON t.owner_id = u.id
        WHERE t.activo = 1
        ORDER BY market_cap DESC
        LIMIT ? OFFSET ?
    ");
    
    $query->execute([$currentUserId, $limit, $offset]);
    $terrains = $query->fetchAll(PDO::FETCH_ASSOC);
    
    // Process each terrain
    foreach ($terrains as &$terrain) {
        // Calculate change percentage if not available
        if ($terrain['cambio_24h'] == 0 && $terrain['precio_inicial'] > 0) {
            $terrain['cambio_24h'] = (($terrain['precio_actual'] - $terrain['precio_inicial']) / $terrain['precio_inicial']) * 100;
        }
        
        // Format numbers
        $terrain['precio_actual'] = floatval($terrain['precio_actual']);
        $terrain['precio_inicial'] = floatval($terrain['precio_inicial']);
        $terrain['cambio_24h'] = round($terrain['cambio_24h'], 2);
        $terrain['market_cap'] = floatval($terrain['market_cap']);
        $terrain['supply_total'] = intval($terrain['supply_total']);
        $terrain['supply_circulante'] = intval($terrain['supply_circulante']);
    }
    
    // Calculate pagination metadata
    $totalPages = ceil($totalCount / $limit);
    $hasMore = $page < $totalPages;
    
    echo json_encode([
        'success' => true,
        'terrains' => $terrains,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $limit,
            'total' => $totalCount,
            'total_pages' => $totalPages,
            'has_more' => $hasMore
        ]
    ]);

} catch (Exception $e) {
    error_log("Error in terrains.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error interno del servidor',
        'terrains' => []
    ]);
}
?>

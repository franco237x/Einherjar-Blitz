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

$terrainId = $_GET['terrain_id'] ?? null;
$period = $_GET['period'] ?? '7d'; // 24h, 7d, 30d, 90d

if (!$terrainId) {
    echo json_encode(['success' => false, 'message' => 'ID de terreno requerido']);
    exit();
}

try {
    $db = Database::getInstance();
    
    // Determine date range based on period
    $dateCondition = '';
    switch ($period) {
        case '24h':
            $dateCondition = "AND fecha >= DATE_SUB(NOW(), INTERVAL 1 DAY)";
            break;
        case '7d':
            $dateCondition = "AND fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            break;
        case '30d':
            $dateCondition = "AND fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            break;
        case '90d':
            $dateCondition = "AND fecha >= DATE_SUB(NOW(), INTERVAL 90 DAY)";
            break;
        default:
            $dateCondition = "AND fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    }
    
    // Get price history
    $query = $db->prepare("
        SELECT 
            precio,
            volumen_24h,
            market_cap,
            DATE_FORMAT(fecha, '%Y-%m-%d %H:%i:%s') as fecha
        FROM terrenos_precio_historial 
        WHERE terreno_id = ? $dateCondition
        ORDER BY fecha ASC
        LIMIT 1000
    ");
    
    $query->execute([$terrainId]);
    $history = $query->fetchAll(PDO::FETCH_ASSOC);
    
    // If no history exists, create initial entry
    if (empty($history)) {
        $terrainQuery = $db->prepare("SELECT * FROM terrenos WHERE id = ?");
        $terrainQuery->execute([$terrainId]);
        $terrain = $terrainQuery->fetch(PDO::FETCH_ASSOC);
        
        if ($terrain) {
            $history = [[
                'precio' => $terrain['precio_actual'],
                'volumen_24h' => 0,
                'market_cap' => $terrain['precio_actual'] * $terrain['supply_circulante'],
                'fecha' => date('Y-m-d H:i:s')
            ]];
        }
    }
    
    // Format data for Chart.js
    foreach ($history as &$entry) {
        $entry['precio'] = floatval($entry['precio']);
        $entry['volumen_24h'] = floatval($entry['volumen_24h']);
        $entry['market_cap'] = floatval($entry['market_cap']);
    }
    
    // Calculate statistics
    $prices = array_column($history, 'precio');
    $minPrice = !empty($prices) ? min($prices) : 0;
    $maxPrice = !empty($prices) ? max($prices) : 0;
    $avgPrice = !empty($prices) ? array_sum($prices) / count($prices) : 0;
    $currentPrice = !empty($prices) ? end($prices) : 0;
    $firstPrice = !empty($prices) ? reset($prices) : 0;
    
    $priceChange = 0;
    if ($firstPrice > 0) {
        $priceChange = (($currentPrice - $firstPrice) / $firstPrice) * 100;
    }
    
    echo json_encode([
        'success' => true,
        'history' => $history,
        'statistics' => [
            'min_price' => $minPrice,
            'max_price' => $maxPrice,
            'avg_price' => round($avgPrice, 8),
            'current_price' => $currentPrice,
            'price_change' => round($priceChange, 2),
            'period' => $period,
            'data_points' => count($history)
        ]
    ]);

} catch (Exception $e) {
    error_log("Error in price_history.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error interno del servidor',
        'history' => [],
        'statistics' => [
            'min_price' => 0,
            'max_price' => 0,
            'avg_price' => 0,
            'current_price' => 0,
            'price_change' => 0,
            'period' => $period,
            'data_points' => 0
        ]
    ]);
}
?>

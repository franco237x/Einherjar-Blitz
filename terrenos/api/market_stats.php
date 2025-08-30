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
    
    // Get total market cap
    $marketCapQuery = $db->prepare("
        SELECT SUM(precio_actual * supply_circulante) as total_market_cap
        FROM terrenos 
        WHERE activo = 1
    ");
    $marketCapQuery->execute();
    $totalMarketCap = $marketCapQuery->fetch(PDO::FETCH_ASSOC)['total_market_cap'] ?? 0;
    
    // Get 24h volume
    $volumeQuery = $db->prepare("
        SELECT SUM(total_esferas) as volume_24h
        FROM terrenos_transacciones 
        WHERE fecha >= DATE_SUB(NOW(), INTERVAL 1 DAY)
    ");
    $volumeQuery->execute();
    $volume24h = $volumeQuery->fetch(PDO::FETCH_ASSOC)['volume_24h'] ?? 0;
    
    // Get total investors
    $investorsQuery = $db->prepare("
        SELECT COUNT(DISTINCT user_id) as total_investors
        FROM terrenos_inversiones
    ");
    $investorsQuery->execute();
    $totalInvestors = $investorsQuery->fetch(PDO::FETCH_ASSOC)['total_investors'] ?? 0;
    
    // Calculate market change (average of all terrains)
    $changeQuery = $db->prepare("
        SELECT AVG(
            CASE 
                WHEN precio_inicial > 0 
                THEN ((precio_actual - precio_inicial) / precio_inicial * 100)
                ELSE 0 
            END
        ) as market_change_24h
        FROM terrenos 
        WHERE activo = 1
    ");
    $changeQuery->execute();
    $marketChange24h = $changeQuery->fetch(PDO::FETCH_ASSOC)['market_change_24h'] ?? 0;
    
    // Determine market trend
    $marketTrend = 'neutral';
    if ($marketChange24h > 0) {
        $marketTrend = 'up';
    } elseif ($marketChange24h < 0) {
        $marketTrend = 'down';
    }
    
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_market_cap' => round($totalMarketCap, 2),
            'volume_24h' => round($volume24h, 2),
            'total_investors' => (int)$totalInvestors,
            'market_change_24h' => round($marketChange24h, 2),
            'market_trend' => $marketTrend
        ]
    ]);

} catch (Exception $e) {
    error_log("Error in market_stats.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error interno del servidor',
        'stats' => [
            'total_market_cap' => 0,
            'volume_24h' => 0,
            'total_investors' => 0,
            'market_change_24h' => 0,
            'market_trend' => 'neutral'
        ]
    ]);
}
?>

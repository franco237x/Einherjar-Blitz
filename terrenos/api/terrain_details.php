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

$terrainId = $_GET['id'] ?? null;

if (!$terrainId) {
    echo json_encode(['success' => false, 'message' => 'ID de terreno requerido']);
    exit();
}

try {
    $db = Database::getInstance();
    
    // Get terrain details with metrics
    $query = $db->prepare("
        SELECT 
            t.*,
            COALESCE(m.cambio_24h, 0) as cambio_24h,
            COALESCE(m.volumen_24h, 0) as volumen_24h,
            COALESCE(m.numero_holders, 0) as numero_holders,
            COALESCE(m.volatilidad_24h, 0) as volatilidad_24h,
            COALESCE(m.rsi, 50) as rsi,
            (t.precio_actual * t.supply_circulante) as market_cap
        FROM terrenos t
        LEFT JOIN terrenos_metricas m ON t.id = m.terreno_id 
            AND DATE(m.fecha) = CURDATE()
        WHERE t.id = ? AND t.activo = 1
    ");
    
    $query->execute([$terrainId]);
    $terrain = $query->fetch(PDO::FETCH_ASSOC);
    
    if (!$terrain) {
        echo json_encode(['success' => false, 'message' => 'Terreno no encontrado']);
        exit();
    }
    
    // Get recent events affecting this terrain
    $eventsQuery = $db->prepare("
        SELECT * FROM terrenos_eventos 
        WHERE (terreno_id = ? OR terreno_id IS NULL) 
            AND activo = 1 
            AND (fecha_fin IS NULL OR fecha_fin > NOW())
        ORDER BY fecha_inicio DESC 
        LIMIT 5
    ");
    $eventsQuery->execute([$terrainId]);
    $events = $eventsQuery->fetchAll(PDO::FETCH_ASSOC);
    
    // Get top investors
    $investorsQuery = $db->prepare("
        SELECT 
            u.username,
            ti.cantidad_acciones,
            ti.inversion_total,
            (ti.cantidad_acciones / ?) * 100 as porcentaje_propiedad
        FROM terrenos_inversiones ti
        JOIN usuarios u ON ti.user_id = u.id
        WHERE ti.terreno_id = ?
        ORDER BY ti.cantidad_acciones DESC
        LIMIT 10
    ");
    $investorsQuery->execute([$terrain['supply_circulante'], $terrainId]);
    $topInvestors = $investorsQuery->fetchAll(PDO::FETCH_ASSOC);
    
    // Get recent transactions
    $transactionsQuery = $db->prepare("
        SELECT 
            tt.*,
            u.username
        FROM terrenos_transacciones tt
        JOIN usuarios u ON tt.user_id = u.id
        WHERE tt.terreno_id = ?
        ORDER BY tt.fecha DESC
        LIMIT 20
    ");
    $transactionsQuery->execute([$terrainId]);
    $recentTransactions = $transactionsQuery->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate additional metrics
    $terrain['precio_actual'] = floatval($terrain['precio_actual']);
    $terrain['precio_inicial'] = floatval($terrain['precio_inicial']);
    $terrain['market_cap'] = floatval($terrain['market_cap']);
    $terrain['supply_utilization'] = $terrain['supply_total'] > 0 ? 
        ($terrain['supply_circulante'] / $terrain['supply_total']) * 100 : 0;
    
    // Calculate price change from initial
    if ($terrain['precio_inicial'] > 0) {
        $terrain['cambio_desde_inicial'] = (($terrain['precio_actual'] - $terrain['precio_inicial']) / $terrain['precio_inicial']) * 100;
    } else {
        $terrain['cambio_desde_inicial'] = 0;
    }
    
    // Format data
    foreach ($topInvestors as &$investor) {
        $investor['cantidad_acciones'] = intval($investor['cantidad_acciones']);
        $investor['inversion_total'] = floatval($investor['inversion_total']);
        $investor['porcentaje_propiedad'] = round($investor['porcentaje_propiedad'], 2);
    }
    
    foreach ($recentTransactions as &$transaction) {
        $transaction['cantidad_acciones'] = intval($transaction['cantidad_acciones']);
        $transaction['precio_unitario'] = floatval($transaction['precio_unitario']);
        $transaction['total_esferas'] = floatval($transaction['total_esferas']);
    }
    
    echo json_encode([
        'success' => true,
        'terrain' => $terrain,
        'events' => $events,
        'top_investors' => $topInvestors,
        'recent_transactions' => $recentTransactions
    ]);

} catch (Exception $e) {
    error_log("Error in terrain_details.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error interno del servidor',
        'terrain' => null,
        'events' => [],
        'top_investors' => [],
        'recent_transactions' => []
    ]);
}
?>

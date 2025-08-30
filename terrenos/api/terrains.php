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
    
    // Get all active terrains with metrics
    $query = $db->prepare("
        SELECT 
            t.*,
            COALESCE(m.cambio_24h, 0) as cambio_24h,
            COALESCE(m.volumen_24h, 0) as volumen_24h,
            COALESCE(m.numero_holders, 0) as numero_holders,
            (t.precio_actual * t.supply_circulante) as market_cap
        FROM terrenos t
        LEFT JOIN terrenos_metricas m ON t.id = m.terreno_id 
            AND DATE(m.fecha) = CURDATE()
        WHERE t.activo = 1
        ORDER BY market_cap DESC
    ");
    
    $query->execute();
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
    
    echo json_encode([
        'success' => true,
        'terrains' => $terrains
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

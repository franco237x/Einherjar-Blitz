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

$userData = $auth->getUserData();

try {
    $db = Database::getInstance();
    
    // Get user's investments with current terrain prices
    $query = $db->prepare("
        SELECT 
            ti.*,
            t.nombre as terrain_nombre,
            t.precio_actual,
            (ti.cantidad_acciones * t.precio_actual) as valor_actual,
            ((ti.cantidad_acciones * t.precio_actual) - ti.inversion_total) as ganancia_perdida,
            (((ti.cantidad_acciones * t.precio_actual) - ti.inversion_total) / ti.inversion_total * 100) as porcentaje_cambio
        FROM terrenos_inversiones ti
        JOIN terrenos t ON ti.terreno_id = t.id
        WHERE ti.user_id = ?
        ORDER BY ti.inversion_total DESC
    ");
    
    $query->execute([$userData['id']]);
    $investments = $query->fetchAll(PDO::FETCH_ASSOC);
    
    // Format numbers
    foreach ($investments as &$investment) {
        $investment['cantidad_acciones'] = intval($investment['cantidad_acciones']);
        $investment['precio_compra_promedio'] = floatval($investment['precio_compra_promedio']);
        $investment['inversion_total'] = floatval($investment['inversion_total']);
        $investment['precio_actual'] = floatval($investment['precio_actual']);
        $investment['valor_actual'] = floatval($investment['valor_actual']);
        $investment['ganancia_perdida'] = floatval($investment['ganancia_perdida']);
        $investment['porcentaje_cambio'] = round($investment['porcentaje_cambio'], 2);
    }
    
    // Calculate portfolio summary
    $totalInvested = array_sum(array_column($investments, 'inversion_total'));
    $totalCurrentValue = array_sum(array_column($investments, 'valor_actual'));
    $totalPnL = $totalCurrentValue - $totalInvested;
    $totalPnLPercent = $totalInvested > 0 ? ($totalPnL / $totalInvested) * 100 : 0;
    
    echo json_encode([
        'success' => true,
        'investments' => $investments,
        'portfolio_summary' => [
            'total_invested' => $totalInvested,
            'total_current_value' => $totalCurrentValue,
            'total_pnl' => $totalPnL,
            'total_pnl_percent' => round($totalPnLPercent, 2)
        ]
    ]);

} catch (Exception $e) {
    error_log("Error in user_investments.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error interno del servidor',
        'investments' => [],
        'portfolio_summary' => [
            'total_invested' => 0,
            'total_current_value' => 0,
            'total_pnl' => 0,
            'total_pnl_percent' => 0
        ]
    ]);
}
?>

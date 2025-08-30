<?php
header('Content-Type: application/json');
require_once '../../includes/Database.php';

$auth = new AuthController();

if (!$auth->isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Usuario no válido']);
    exit();
}

$db = Database::getInstance();

try {
    // Obtener portfolio actualizado del usuario
    $portfolioQuery = $db->prepare("
        SELECT p.*, t.nombre, t.descripcion, t.precio_actual, t.supply_circulante, 
               t.categoria, t.imagen_url, t.cambio_24h, t.volumen_24h,
               (t.precio_actual / t.supply_circulante) as precio_por_accion_actual,
               (p.total_acciones * (t.precio_actual / t.supply_circulante)) as valor_actual_calculado
        FROM user_portfolio p 
        JOIN terrenos t ON p.terrain_id = t.id 
        WHERE p.user_id = ? AND p.total_acciones > 0
        ORDER BY p.valor_actual DESC
    ");
    $portfolioQuery->execute([$userData['id']]);
    $portfolio = $portfolioQuery->fetchAll();

    // Actualizar valores actuales en la base de datos
    foreach ($portfolio as $item) {
        $currentValue = $item['valor_actual_calculado'];
        $gainLoss = $currentValue - $item['inversion_total'];
        $percentChange = $item['inversion_total'] > 0 ? ($gainLoss / $item['inversion_total']) * 100 : 0;

        $updateQuery = $db->prepare("
            UPDATE user_portfolio 
            SET valor_actual = ?, ganancia_perdida = ?, porcentaje_change = ? 
            WHERE id = ?
        ");
        $updateQuery->execute([$currentValue, $gainLoss, $percentChange, $item['id']]);
    }

    // Calcular totales
    $totalInversion = array_sum(array_column($portfolio, 'inversion_total'));
    $totalValorActual = array_sum(array_column($portfolio, 'valor_actual_calculado'));
    $totalGananciaPerdida = $totalValorActual - $totalInversion;
    $totalPorcentajeChange = $totalInversion > 0 ? ($totalGananciaPerdida / $totalInversion) * 100 : 0;

    // Obtener transacciones recientes
    $transactionsQuery = $db->prepare("
        SELECT wt.*, t.nombre as terrain_nombre, u.username as destinatario_username
        FROM wallet_transactions wt 
        LEFT JOIN terrenos t ON wt.terrain_id = t.id
        LEFT JOIN usuarios u ON wt.destinatario_id = u.id
        WHERE wt.user_id = ? 
        ORDER BY wt.fecha_transaccion DESC 
        LIMIT 20
    ");
    $transactionsQuery->execute([$userData['id']]);
    $transactions = $transactionsQuery->fetchAll();

    // Preparar datos de rendimiento por categoría
    $performanceByCategory = [];
    foreach ($portfolio as $item) {
        $categoria = $item['categoria'];
        if (!isset($performanceByCategory[$categoria])) {
            $performanceByCategory[$categoria] = [
                'categoria' => $categoria,
                'total_inversion' => 0,
                'total_valor_actual' => 0,
                'total_ganancia_perdida' => 0,
                'porcentaje_change' => 0,
                'count' => 0
            ];
        }
        
        $performanceByCategory[$categoria]['total_inversion'] += $item['inversion_total'];
        $performanceByCategory[$categoria]['total_valor_actual'] += $item['valor_actual_calculado'];
        $performanceByCategory[$categoria]['count']++;
    }

    // Calcular porcentajes por categoría
    foreach ($performanceByCategory as &$category) {
        $category['total_ganancia_perdida'] = $category['total_valor_actual'] - $category['total_inversion'];
        $category['porcentaje_change'] = $category['total_inversion'] > 0 ? 
            ($category['total_ganancia_perdida'] / $category['total_inversion']) * 100 : 0;
    }

    echo json_encode([
        'success' => true,
        'portfolio' => $portfolio,
        'summary' => [
            'total_inversion' => $totalInversion,
            'total_valor_actual' => $totalValorActual,
            'total_ganancia_perdida' => $totalGananciaPerdida,
            'total_porcentaje_change' => $totalPorcentajeChange,
            'total_inversions' => count($portfolio)
        ],
        'performance_by_category' => array_values($performanceByCategory),
        'recent_transactions' => $transactions,
        'user_balances' => [
            'esferas' => $userData['recompensas'],
            'llaves' => $userData['llaves']
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
}
?>

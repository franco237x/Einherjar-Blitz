<?php
header('Content-Type: application/json');
require_once '../../includes/Database.php';

$auth = new AuthController();

if (!$auth->isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de terreno requerido']);
    exit();
}

$terrainId = (int)$_GET['id'];
$db = Database::getInstance();

try {
    // Obtener datos del terreno
    $terrainQuery = $db->prepare("
        SELECT id, nombre, descripcion, precio_inicial, precio_actual, supply_total, 
               supply_circulante, volumen_24h, cambio_24h, imagen_url, categoria, 
               ubicacion, activo, fecha_creacion,
               (precio_actual / supply_circulante) as precio_por_accion,
               ROUND(((precio_actual - precio_inicial) / precio_inicial * 100), 2) as cambio_total_percent
        FROM terrenos 
        WHERE id = ? AND activo = 1
    ");
    
    $terrainQuery->execute([$terrainId]);
    $terrain = $terrainQuery->fetch();

    if (!$terrain) {
        echo json_encode(['success' => false, 'message' => 'Terreno no encontrado']);
        exit();
    }

    // Obtener estadísticas adicionales del terreno
    $statsQuery = $db->prepare("
        SELECT 
            COUNT(DISTINCT user_id) as total_inversores,
            SUM(total_acciones) as acciones_en_circulacion,
            AVG(valor_promedio_compra) as precio_promedio_compra,
            SUM(inversion_total) as inversion_total_acumulada
        FROM user_portfolio 
        WHERE terrain_id = ? AND total_acciones > 0
    ");
    
    $statsQuery->execute([$terrainId]);
    $stats = $statsQuery->fetch();

    // Obtener transacciones recientes del terreno
    $txQuery = $db->prepare("
        SELECT wt.tipo, wt.cantidad_esferas, wt.cantidad_acciones, wt.precio_por_accion, 
               wt.fecha_transaccion, u.username
        FROM wallet_transactions wt
        JOIN usuarios u ON wt.user_id = u.id
        WHERE wt.terrain_id = ? 
        ORDER BY wt.fecha_transaccion DESC 
        LIMIT 10
    ");
    
    $txQuery->execute([$terrainId]);
    $recentTransactions = $txQuery->fetchAll();

    // Datos del histórico de precios (simulado para demostración)
    $priceHistory = [];
    $currentTime = time();
    for ($i = 23; $i >= 0; $i--) {
        $time = $currentTime - ($i * 3600); // Cada hora hacia atrás
        $basePrice = $terrain['precio_por_accion'];
        $variation = (sin($i * 0.5) * 0.05 + (rand(-10, 10) / 1000)) * $basePrice;
        $priceHistory[] = [
            'timestamp' => $time,
            'price' => max(0.0001, $basePrice + $variation),
            'volume' => rand(100, 2000)
        ];
    }

    echo json_encode([
        'success' => true,
        'terrain' => $terrain,
        'stats' => [
            'total_inversores' => (int)($stats['total_inversores'] ?? 0),
            'acciones_en_circulacion' => (float)($stats['acciones_en_circulacion'] ?? 0),
            'precio_promedio_compra' => (float)($stats['precio_promedio_compra'] ?? 0),
            'inversion_total_acumulada' => (float)($stats['inversion_total_acumulada'] ?? 0)
        ],
        'recent_transactions' => $recentTransactions,
        'price_history' => $priceHistory
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
}
?>

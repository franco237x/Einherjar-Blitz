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

// Leer datos de la petición
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['terrain_id']) || !isset($input['shares_to_sell'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos faltantes o formato JSON inválido']);
    exit();
}

$terrainId = (int)$input['terrain_id'];
$sharesToSell = (float)$input['shares_to_sell'];

if ($sharesToSell <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Cantidad de acciones inválida']);
    exit();
}

$db = Database::getInstance();

try {
    $db->beginTransaction();

    // Verificar que el terreno existe y está activo
    $terrainQuery = $db->prepare("
        SELECT id, nombre, precio_actual, supply_circulante, activo 
        FROM terrenos 
        WHERE id = ? AND activo = 1
    ");
    $terrainQuery->execute([$terrainId]);
    $terrain = $terrainQuery->fetch();

    if (!$terrain) {
        throw new Exception('Terreno no encontrado o no activo');
    }

    // Verificar que el usuario tiene suficientes acciones
    $portfolioQuery = $db->prepare("
        SELECT id, total_acciones, valor_promedio_compra, inversion_total, valor_actual 
        FROM user_portfolio 
        WHERE user_id = ? AND terrain_id = ?
    ");
    $portfolioQuery->execute([$userData['id'], $terrainId]);
    $portfolio = $portfolioQuery->fetch();

    if (!$portfolio) {
        throw new Exception('Acciones insuficientes');
    }

    // Validar que el usuario tenga acciones suficientes
    if ($portfolio['total_acciones'] < $sharesToSell) {
        throw new Exception('No tienes suficientes acciones para esta venta');
    }

    // PROTECCIÓN ANTI-MANIPULACIÓN: Verificar cooldown de 5 minutos
    $cooldownQuery = $db->prepare("
        SELECT COUNT(*) as recent_transactions 
        FROM wallet_transactions 
        WHERE user_id = ? AND terrain_id = ? 
        AND fecha_transaccion > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        AND tipo IN ('compra_terreno', 'venta_terreno')
    ");
    $cooldownQuery->execute([$userData['id'], $terrainId]);
    $recentTx = $cooldownQuery->fetch(PDO::FETCH_ASSOC);
    
    if ($recentTx['recent_transactions'] >= 3) {
        throw new Exception('Demasiadas transacciones recientes. Espera 5 minutos antes de operar este terreno nuevamente.');
    }

    // Calcular precio actual por acción
    $currentPricePerShare = $terrain['precio_actual'] / $terrain['supply_circulante'];
    
    // Calcular valor de venta
    $grossSaleValue = $sharesToSell * $currentPricePerShare;
    $feeAmount = $grossSaleValue * 0.0025; // 0.25% fee
    $netSaleValue = $grossSaleValue - $feeAmount;

    // Actualizar portfolio del usuario
    $newTotalShares = $portfolio['total_acciones'] - $sharesToSell;
    
    if ($newTotalShares <= 0.00001) { // Prácticamente cero
        // Eliminar entrada del portfolio si no quedan acciones
        $deletePortfolioQuery = $db->prepare("DELETE FROM user_portfolio WHERE id = ?");
        $deletePortfolioQuery->execute([$portfolio['id']]);
    } else {
        // Calcular nueva inversión proporcional
        $proportionSold = $sharesToSell / $portfolio['total_acciones'];
        $investmentReduction = $portfolio['inversion_total'] * $proportionSold;
        $newTotalInvestment = $portfolio['inversion_total'] - $investmentReduction;
        $newCurrentValue = $newTotalShares * $currentPricePerShare;
        $newGainLoss = $newCurrentValue - $newTotalInvestment;
        $newPercentChange = $newTotalInvestment > 0 ? ($newGainLoss / $newTotalInvestment) * 100 : 0;

        $updatePortfolioQuery = $db->prepare("
            UPDATE user_portfolio 
            SET total_acciones = ?, inversion_total = ?, valor_actual = ?, 
                ganancia_perdida = ?, porcentaje_change = ?
            WHERE id = ?
        ");
        
        $updatePortfolioQuery->execute([
            $newTotalShares,
            $newTotalInvestment,
            $newCurrentValue,
            $newGainLoss,
            $newPercentChange,
            $portfolio['id']
        ]);
    }

    // Agregar esferas al usuario
    $updateUserQuery = $db->prepare("UPDATE usuarios SET recompensas = recompensas + ? WHERE id = ?");
    $updateUserQuery->execute([$netSaleValue, $userData['id']]);

    // Generar hash único para la transacción
    $transactionHash = hash('sha256', $userData['id'] . $terrainId . $sharesToSell . 'sell' . time());

    // Registrar transacción de venta
    $insertTransactionQuery = $db->prepare("
        INSERT INTO wallet_transactions 
        (user_id, tipo, subtipo, cantidad_esferas, terrain_id, precio_por_accion, cantidad_acciones, fee_amount, hash_transaccion, descripcion, metadata) 
        VALUES (?, 'venta_terreno', 'sale', ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $metadata = json_encode([
        'terrain_name' => $terrain['nombre'],
        'market_cap' => $terrain['precio_actual'],
        'supply_circulante' => $terrain['supply_circulante'],
        'gross_value' => $grossSaleValue
    ]);

    $insertTransactionQuery->execute([
        $userData['id'],
        $netSaleValue,
        $terrainId,
        $currentPricePerShare,
        $sharesToSell,
        $feeAmount,
        $transactionHash,
        "Venta de {$sharesToSell} acciones de {$terrain['nombre']}",
        $metadata
    ]);

    // Actualizar volumen 24h del terreno
    $updateVolumeQuery = $db->prepare("UPDATE terrenos SET volumen_24h = volumen_24h + ? WHERE id = ?");
    $updateVolumeQuery->execute([$grossSaleValue, $terrainId]);

    // PROTECCIÓN: Actualizar precio con límites anti-manipulación
    $priceDecrease = $grossSaleValue * 0.015; // Aumentado a 1.5% para equilibrar con compras
    
    // Límite máximo de disminución por transacción: 5% del precio actual
    $maxDecrease = $terrain['precio_actual'] * 0.05;
    $priceDecrease = min($priceDecrease, $maxDecrease);
    
    // No baja más del 50% del precio original
    $newPrice = max($terrain['precio_actual'] - $priceDecrease, $terrain['precio_actual'] * 0.5);
    $updatePriceStmt = $db->prepare("UPDATE terrenos SET precio_actual = ? WHERE id = ?");
    $updatePriceStmt->execute([$newPrice, $terrainId]);

    $db->commit();

    echo json_encode([
        'success' => true, 
        'message' => 'Venta realizada exitosamente',
        'data' => [
            'shares_sold' => $sharesToSell,
            'price_per_share' => $currentPricePerShare,
            'gross_value' => $grossSaleValue,
            'fee' => $feeAmount,
            'net_received' => $netSaleValue,
            'remaining_shares' => $newTotalShares,
            'transaction_hash' => $transactionHash
        ]
    ]);

} catch (Exception $e) {
    $db->rollback();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'debug' => [
        'terrain_id' => $terrainId,
        'shares_to_sell' => $sharesToSell,
        'user_id' => $userData['id']
    ]]);
}
?>

<?php
// Suprimir errores y warnings para evitar que interfieran con JSON
error_reporting(0);
ini_set('display_errors', 0);

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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$terrainId = $input['terrain_id'] ?? null;
$sharesToSell = floatval($input['shares'] ?? 0);

if (!$terrainId || $sharesToSell <= 0) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
    exit();
}

try {
    $db = Database::getInstance();
    $db->beginTransaction();
    
    // Get terrain details
    $terrainQuery = $db->prepare("SELECT * FROM terrenos WHERE id = ? AND activo = 1 FOR UPDATE");
    $terrainQuery->execute([$terrainId]);
    $terrain = $terrainQuery->fetch(PDO::FETCH_ASSOC);
    
    if (!$terrain) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Terreno no encontrado']);
        exit();
    }
    
    // Check if terrain has valid price
    if ($terrain['precio_actual'] <= 0) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Este terreno no tiene precio establecido']);
        exit();
    }
    
    // Get user investment
    $investmentQuery = $db->prepare("
        SELECT * FROM terrenos_inversiones WHERE user_id = ? AND terreno_id = ?
    ");
    $investmentQuery->execute([$userData['id'], $terrainId]);
    $investment = $investmentQuery->fetch(PDO::FETCH_ASSOC);
    
    if (!$investment || $investment['cantidad_acciones'] < $sharesToSell) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'No tienes suficientes tokens para vender']);
        exit();
    }
    
    $currentPrice = floatval($terrain['precio_actual']);
    
    // Calculate price impact for selling (high volatility algorithm)
    $supplyImpact = $sharesToSell / $terrain['supply_total'];
    $sellPressure = 1 - ($supplyImpact * 0.3); // Increased from 0.05 to 0.3 for stronger sell pressure
    $volumeImpact = 1 - (($sharesToSell * $currentPrice) / ($terrain['precio_actual'] * $terrain['supply_total']) * 0.15); // Increased from 0.03 to 0.15
    
    // Additional sell pressure based on market conditions
    $marketPanic = 1 - ($sharesToSell / $terrain['supply_total'] * 1.5); // New factor for panic selling
    
    $sellPrice = $currentPrice * $sellPressure * $volumeImpact * $marketPanic;
    $sellPrice = max($sellPrice, $terrain['precio_inicial'] * 0.25); // Minimum price floor at 25% (can drop to 75%)
    
    // Apply transaction fee and slippage penalty on sells
    $transactionFee = 0.025; // 2.5% fee (higher than buying to discourage rapid trading)
    $slippagePenalty = 0.98; // 2% slippage penalty (you get less than market price)
    $effectiveSellPrice = $sellPrice * $slippagePenalty;
    
    $totalEarnings = $sharesToSell * $effectiveSellPrice * (1 - $transactionFee);
    $newSupplyCirculante = $terrain['supply_circulante'] - $sharesToSell;
    
    // Update terrain price and supply
    $updateTerrainQuery = $db->prepare("
        UPDATE terrenos 
        SET precio_actual = ?, supply_circulante = ?, ultima_actualizacion = NOW()
        WHERE id = ?
    ");
    $updateTerrainQuery->execute([$sellPrice, $newSupplyCirculante, $terrainId]);
    
    // Update user investment
    $newQuantity = $investment['cantidad_acciones'] - $sharesToSell;
    $newTotalInvestment = $investment['inversion_total'] - ($sharesToSell * $investment['precio_compra_promedio']);
    
    if ($newQuantity > 0) {
        // Update existing investment
        $updateInvestmentQuery = $db->prepare("
            UPDATE terrenos_inversiones 
            SET cantidad_acciones = ?, inversion_total = ?, ultima_actualizacion = NOW()
            WHERE user_id = ? AND terreno_id = ?
        ");
        $updateInvestmentQuery->execute([$newQuantity, $newTotalInvestment, $userData['id'], $terrainId]);
    } else {
        // Remove investment completely
        $deleteInvestmentQuery = $db->prepare("
            DELETE FROM terrenos_inversiones WHERE user_id = ? AND terreno_id = ?
        ");
        $deleteInvestmentQuery->execute([$userData['id'], $terrainId]);
    }
    
    // Record transaction with fee
    $grossEarnings = $sharesToSell * $effectiveSellPrice;
    $feeAmount = $grossEarnings - $totalEarnings;
    $insertTransactionQuery = $db->prepare("
        INSERT INTO terrenos_transacciones 
        (user_id, terreno_id, tipo, cantidad_acciones, precio_unitario, total_esferas, fee_transaccion, precio_antes, precio_despues)
        VALUES (?, ?, 'venta', ?, ?, ?, ?, ?, ?)
    ");
    $insertTransactionQuery->execute([
        $userData['id'], $terrainId, $sharesToSell, $effectiveSellPrice, $totalEarnings, $feeAmount, $currentPrice, $sellPrice
    ]);
    
    // Update user spheres
    $newBalance = $userData['recompensas'] + $totalEarnings;
    $updateUserQuery = $db->prepare("UPDATE usuarios SET recompensas = ? WHERE id = ?");
    $updateUserQuery->execute([$newBalance, $userData['id']]);
    
    // Record transaction in general transactions table
    $grossProfit = ($sharesToSell * $effectiveSellPrice) - ($sharesToSell * $investment['precio_compra_promedio']);
    $netProfit = $totalEarnings - ($sharesToSell * $investment['precio_compra_promedio']);
    $feesAndSlippage = $grossProfit - $netProfit;
    $profitText = $netProfit >= 0 ? "ganancia" : "pérdida";
    
    $insertGeneralTransactionQuery = $db->prepare("
        INSERT INTO transacciones_einherjer (user_id, username, tipo, cantidad, descripcion)
        VALUES (?, ?, 'venta', ?, ?)
    ");
    $insertGeneralTransactionQuery->execute([
        $userData['id'], 
        $userData['username'], 
        $totalEarnings, 
        "Venta terreno: " . $terrain['nombre'] . " ($profitText: " . round($netProfit, 2) . ", comisiones: " . round($feesAndSlippage, 2) . ")"
    ]);
    
    // Add price to history
    $insertPriceHistoryQuery = $db->prepare("
        INSERT INTO terrenos_precio_historial (terreno_id, precio, supply_circulante, market_cap)
        VALUES (?, ?, ?, ?)
    ");
    $insertPriceHistoryQuery->execute([
        $terrainId, $sellPrice, $newSupplyCirculante, ($sellPrice * $newSupplyCirculante)
    ]);
    
    // Update terrain metrics
    $updateMetricsQuery = $db->prepare("
        INSERT INTO terrenos_metricas (terreno_id, volumen_24h, numero_holders, cambio_24h, fecha)
        VALUES (?, ?, (SELECT COUNT(*) FROM terrenos_inversiones WHERE terreno_id = ?), ?, CURDATE())
        ON DUPLICATE KEY UPDATE
        volumen_24h = volumen_24h + VALUES(volumen_24h),
        numero_holders = VALUES(numero_holders),
        cambio_24h = (? - ?) / ? * 100
    ");
    $updateMetricsQuery->execute([
        $terrainId, $totalEarnings, $terrainId, 0, $sellPrice, $terrain['precio_inicial'], $terrain['precio_inicial']
    ]);
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Venta realizada con éxito',
        'transaction' => [
            'terrain_name' => $terrain['nombre'],
            'shares_sold' => $sharesToSell,
            'price_per_share' => $sellPrice,
            'total_earnings' => $totalEarnings,
            'profit' => $profit,
            'new_price' => $sellPrice
        ],
        'new_balance' => $newBalance
    ]);

} catch (Exception $e) {
    if (isset($db)) {
        $db->rollBack();
    }
    error_log("Error in sell.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error interno del servidor'
    ]);
}
?>

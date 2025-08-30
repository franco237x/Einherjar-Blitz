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
$investmentAmount = floatval($input['amount'] ?? 0);

if (!$terrainId || $investmentAmount <= 0) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
    exit();
}

if ($investmentAmount > $userData['recompensas']) {
    echo json_encode(['success' => false, 'message' => 'Esferas insuficientes']);
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
    
    // Check if terrain has valid price (not 0)
    if ($terrain['precio_actual'] <= 0) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Este terreno aún no tiene precio establecido']);
        exit();
    }
    
    // Calculate shares and new price with transaction fee
    $currentPrice = floatval($terrain['precio_actual']);
    $transactionFee = 0.02; // 2% transaction fee
    $availableAmount = $investmentAmount * (1 - $transactionFee);
    $sharesToBuy = floor($availableAmount / $currentPrice);
    $actualCost = $sharesToBuy * $currentPrice;
    $totalCostWithFee = $actualCost / (1 - $transactionFee); // Include fee in total cost
    
    if ($sharesToBuy <= 0) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Cantidad insuficiente para comprar acciones']);
        exit();
    }
    
    if ($sharesToBuy > ($terrain['supply_total'] - $terrain['supply_circulante'])) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'No hay suficientes acciones disponibles']);
        exit();
    }
    
    // Calculate price impact (high volatility algorithm)
    $supplyPercent = ($terrain['supply_circulante'] + $sharesToBuy) / $terrain['supply_total'];
    $demandMultiplier = 1 + ($supplyPercent * 0.5); // Increased from 0.1 to 0.5 for higher impact
    $volumeMultiplier = 1 + (($actualCost / ($terrain['precio_actual'] * $terrain['supply_total'])) * 0.25); // Increased from 0.05 to 0.25
    
    // Additional buying pressure based on purchase size
    $purchasePressure = 1 + ($sharesToBuy / $terrain['supply_total'] * 2.0); // New factor for direct purchase impact
    
    $newPrice = $currentPrice * $demandMultiplier * $volumeMultiplier * $purchasePressure;
    $newSupplyCirculante = $terrain['supply_circulante'] + $sharesToBuy;
    
    // Update terrain
    $updateTerrainQuery = $db->prepare("
        UPDATE terrenos 
        SET precio_actual = ?, supply_circulante = ?, ultima_actualizacion = NOW()
        WHERE id = ?
    ");
    $updateTerrainQuery->execute([$newPrice, $newSupplyCirculante, $terrainId]);
    
    // Update or insert user investment
    $existingInvestmentQuery = $db->prepare("
        SELECT * FROM terrenos_inversiones WHERE user_id = ? AND terreno_id = ?
    ");
    $existingInvestmentQuery->execute([$userData['id'], $terrainId]);
    $existingInvestment = $existingInvestmentQuery->fetch(PDO::FETCH_ASSOC);
    
    if ($existingInvestment) {
        // Update existing investment
        $newQuantity = $existingInvestment['cantidad_acciones'] + $sharesToBuy;
        $newTotalInvestment = $existingInvestment['inversion_total'] + $actualCost;
        $newAveragePrice = $newTotalInvestment / $newQuantity;
        
        $updateInvestmentQuery = $db->prepare("
            UPDATE terrenos_inversiones 
            SET cantidad_acciones = ?, inversion_total = ?, precio_compra_promedio = ?, ultima_actualizacion = NOW()
            WHERE user_id = ? AND terreno_id = ?
        ");
        $updateInvestmentQuery->execute([$newQuantity, $newTotalInvestment, $newAveragePrice, $userData['id'], $terrainId]);
    } else {
        // Create new investment
        $insertInvestmentQuery = $db->prepare("
            INSERT INTO terrenos_inversiones (user_id, terreno_id, cantidad_acciones, inversion_total, precio_compra_promedio)
            VALUES (?, ?, ?, ?, ?)
        ");
        $insertInvestmentQuery->execute([$userData['id'], $terrainId, $sharesToBuy, $actualCost, $currentPrice]);
    }
    
    // Record transaction with fee
    $feeAmount = $totalCostWithFee - $actualCost;
    $insertTransactionQuery = $db->prepare("
        INSERT INTO terrenos_transacciones 
        (user_id, terreno_id, tipo, cantidad_acciones, precio_unitario, total_esferas, fee_transaccion, precio_antes, precio_despues)
        VALUES (?, ?, 'compra', ?, ?, ?, ?, ?, ?)
    ");
    $insertTransactionQuery->execute([
        $userData['id'], $terrainId, $sharesToBuy, $currentPrice, $totalCostWithFee, $feeAmount, $currentPrice, $newPrice
    ]);
    
    // Update user spheres (deduct total cost including fee)
    $newBalance = $userData['recompensas'] - $totalCostWithFee;
    $updateUserQuery = $db->prepare("UPDATE usuarios SET recompensas = ? WHERE id = ?");
    $updateUserQuery->execute([$newBalance, $userData['id']]);
    
    // Record transaction in general transactions table
    $insertGeneralTransactionQuery = $db->prepare("
        INSERT INTO transacciones_einherjer (user_id, username, tipo, cantidad, descripcion)
        VALUES (?, ?, 'compra', ?, ?)
    ");
    $insertGeneralTransactionQuery->execute([
        $userData['id'], 
        $userData['username'], 
        -$totalCostWithFee, 
        "Inversión en terreno: " . $terrain['nombre'] . " (incluye comisión 2%)"
    ]);
    
    // Add price to history
    $insertPriceHistoryQuery = $db->prepare("
        INSERT INTO terrenos_precio_historial (terreno_id, precio, supply_circulante, market_cap)
        VALUES (?, ?, ?, ?)
    ");
    $insertPriceHistoryQuery->execute([
        $terrainId, $newPrice, $newSupplyCirculante, ($newPrice * $newSupplyCirculante)
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
        $terrainId, $actualCost, $terrainId, 0, $newPrice, $terrain['precio_inicial'], $terrain['precio_inicial']
    ]);
    
    $db->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Inversión realizada con éxito',
        'transaction' => [
            'terrain_name' => $terrain['nombre'],
            'shares_bought' => $sharesToBuy,
            'price_per_share' => $currentPrice,
            'total_cost' => $actualCost,
            'new_price' => $newPrice
        ],
        'new_balance' => $newBalance
    ]);

} catch (Exception $e) {
    if (isset($db)) {
        $db->rollBack();
    }
    error_log("Error in invest.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error interno del servidor'
    ]);
}
?>

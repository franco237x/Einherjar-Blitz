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

if (!$input || !isset($input['terrain_id']) || !isset($input['investment_amount']) || !isset($input['shares_amount'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos faltantes o formato JSON inválido']);
    exit();
}

$terrainId = (int)$input['terrain_id'];
$investmentAmount = (float)$input['investment_amount'];
$sharesAmount = (float)$input['shares_amount'];
$pricePerShare = isset($input['price_per_share']) ? (float)$input['price_per_share'] : 0;
$feeAmount = isset($input['fee_amount']) ? (float)$input['fee_amount'] : 0;

$db = Database::getInstance();

try {
    $db->beginTransaction();

    // Validar que el usuario tenga suficientes esferas
    if ($userData['recompensas'] < $investmentAmount) {
        throw new Exception('No tienes suficientes esferas para esta inversión');
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

    // Obtener datos del terreno
    $terrainQuery = $db->prepare("
        SELECT id, nombre, precio_actual, supply_circulante, activo 
        FROM terrenos 
        WHERE id = ? AND activo = 1
    ");
    $terrainQuery->execute([$terrainId]);
    $terrain = $terrainQuery->fetch();

    // PROTECCIÓN: Límite de inversión por usuario por terreno (máximo 25% del market cap)
    $maxInvestment = $terrain['precio_actual'] * 0.25;
    if ($investmentAmount > $maxInvestment) {
        throw new Exception('No puedes invertir más del 25% del valor total del terreno en una sola transacción.');
    }

    if (!$terrain) {
        throw new Exception('Terreno no encontrado o no activo');
    }

    // Calcular precio actual por acción
    $currentPricePerShare = $terrain['precio_actual'] / $terrain['supply_circulante'];
    
    // Verificar que el precio no haya cambiado significativamente (tolerancia del 5%)
    if ($pricePerShare > 0) {
        $priceDifference = abs($currentPricePerShare - $pricePerShare) / $pricePerShare;
        if ($priceDifference > 0.05) {
            throw new Exception('El precio ha cambiado. Por favor actualiza la página');
        }
    }

    // Descontar esferas del usuario
    $updateUserQuery = $db->prepare("UPDATE usuarios SET recompensas = recompensas - ? WHERE id = ?");
    $updateUserQuery->execute([$investmentAmount, $userData['id']]);

    // Verificar si el usuario ya tiene inversiones en este terreno
    $portfolioQuery = $db->prepare("
        SELECT id, total_acciones, valor_promedio_compra, inversion_total 
        FROM user_portfolio 
        WHERE user_id = ? AND terrain_id = ?
    ");
    $portfolioQuery->execute([$userData['id'], $terrainId]);
    $existingPortfolio = $portfolioQuery->fetch();

    $netInvestment = $investmentAmount - $feeAmount;

    if ($existingPortfolio) {
        // Actualizar inversión existente
        $newTotalShares = $existingPortfolio['total_acciones'] + $sharesAmount;
        $newTotalInvestment = $existingPortfolio['inversion_total'] + $netInvestment;
        $newAveragePrice = $newTotalInvestment / $newTotalShares;
        $newCurrentValue = $newTotalShares * $currentPricePerShare;

        $updatePortfolioQuery = $db->prepare("
            UPDATE user_portfolio 
            SET total_acciones = ?, valor_promedio_compra = ?, inversion_total = ?, 
                valor_actual = ?, ganancia_perdida = ?, porcentaje_change = ?
            WHERE id = ?
        ");
        
        $gainLoss = $newCurrentValue - $newTotalInvestment;
        $percentChange = $newTotalInvestment > 0 ? ($gainLoss / $newTotalInvestment) * 100 : 0;

        $updatePortfolioQuery->execute([
            $newTotalShares,
            $newAveragePrice,
            $newTotalInvestment,
            $newCurrentValue,
            $gainLoss,
            $percentChange,
            $existingPortfolio['id']
        ]);
    } else {
        // Crear nueva entrada en portfolio
        $currentValue = $sharesAmount * $currentPricePerShare;
        $gainLoss = $currentValue - $netInvestment;
        $percentChange = $netInvestment > 0 ? ($gainLoss / $netInvestment) * 100 : 0;

        $insertPortfolioQuery = $db->prepare("
            INSERT INTO user_portfolio 
            (user_id, terrain_id, total_acciones, valor_promedio_compra, inversion_total, valor_actual, ganancia_perdida, porcentaje_change) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $insertPortfolioQuery->execute([
            $userData['id'],
            $terrainId,
            $sharesAmount,
            $currentPricePerShare,
            $netInvestment,
            $currentValue,
            $gainLoss,
            $percentChange
        ]);
    }

    // Registrar transacción en investments table
    $insertInvestmentQuery = $db->prepare("
        INSERT INTO terrain_investments 
        (user_id, terrain_id, cantidad_acciones, precio_compra, valor_inversion) 
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $insertInvestmentQuery->execute([
        $userData['id'],
        $terrainId,
        $sharesAmount,
        $currentPricePerShare,
        $netInvestment
    ]);

    // Generar hash único para la transacción
    $transactionHash = hash('sha256', $userData['id'] . $terrainId . $investmentAmount . time());

    // Registrar transacción en wallet_transactions
    $insertTransactionQuery = $db->prepare("
        INSERT INTO wallet_transactions 
        (user_id, tipo, subtipo, cantidad_esferas, terrain_id, precio_por_accion, cantidad_acciones, fee_amount, hash_transaccion, descripcion, metadata) 
        VALUES (?, 'compra_terreno', 'investment', ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $metadata = json_encode([
        'terrain_name' => $terrain['nombre'],
        'market_cap' => $terrain['precio_actual'],
        'supply_circulante' => $terrain['supply_circulante']
    ]);

    $insertTransactionQuery->execute([
        $userData['id'],
        $investmentAmount,
        $terrainId,
        $currentPricePerShare,
        $sharesAmount,
        $feeAmount,
        $transactionHash,
        "Inversión en {$terrain['nombre']} - {$sharesAmount} acciones",
        $metadata
    ]);

    // Actualizar volumen 24h del terreno
    $updateVolumeQuery = $db->prepare("UPDATE terrenos SET volumen_24h = volumen_24h + ? WHERE id = ?");
    $updateVolumeQuery->execute([$investmentAmount, $terrainId]);

    // PROTECCIÓN: Actualizar precio con límites anti-manipulación
    $priceIncrease = $investmentAmount * 0.015; // Reducido a 1.5% para evitar pump & dump
    
    // Límite máximo de aumento por transacción: 5% del precio actual
    $maxIncrease = $terrain['precio_actual'] * 0.05;
    $priceIncrease = min($priceIncrease, $maxIncrease);
    
    $newPrice = $terrain['precio_actual'] + $priceIncrease;
    $updatePriceStmt = $db->prepare("UPDATE terrenos SET precio_actual = ? WHERE id = ?");
    $updatePriceStmt->execute([$newPrice, $terrainId]);

    $db->commit();

    echo json_encode([
        'success' => true, 
        'message' => 'Inversión realizada exitosamente',
        'data' => [
            'shares_purchased' => $sharesAmount,
            'price_per_share' => $currentPricePerShare,
            'total_paid' => $investmentAmount,
            'fee' => $feeAmount,
            'transaction_hash' => $transactionHash
        ]
    ]);

} catch (Exception $e) {
    $db->rollback();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'debug' => [
        'terrain_id' => $terrainId,
        'investment_amount' => $investmentAmount,
        'shares_amount' => $sharesAmount,
        'user_balance' => $userData['recompensas']
    ]]);
}
?>

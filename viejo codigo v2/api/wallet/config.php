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

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // Obtener configuración actual del wallet
        $configQuery = $db->prepare("
            SELECT fee_trading, slippage_tolerance, auto_reinvest, notifications_enabled, privacy_mode 
            FROM wallet_config 
            WHERE user_id = ?
        ");
        $configQuery->execute([$userData['id']]);
        $config = $configQuery->fetch();

        if (!$config) {
            // Crear configuración por defecto si no existe
            $insertQuery = $db->prepare("
                INSERT INTO wallet_config (user_id) VALUES (?)
            ");
            $insertQuery->execute([$userData['id']]);
            
            $config = [
                'fee_trading' => 0.0025,
                'slippage_tolerance' => 0.0050,
                'auto_reinvest' => 0,
                'notifications_enabled' => 1,
                'privacy_mode' => 0
            ];
        }

        echo json_encode(['success' => true, 'config' => $config]);

    } elseif ($method === 'POST') {
        // Actualizar configuración del wallet
        $input = json_decode(file_get_contents('php://input'), true);

        $feeTrading = isset($input['fee_trading']) ? (float)$input['fee_trading'] : 0.0025;
        $slippageTolerance = isset($input['slippage_tolerance']) ? (float)$input['slippage_tolerance'] : 0.0050;
        $autoReinvest = isset($input['auto_reinvest']) ? (int)$input['auto_reinvest'] : 0;
        $notificationsEnabled = isset($input['notifications_enabled']) ? (int)$input['notifications_enabled'] : 1;
        $privacyMode = isset($input['privacy_mode']) ? (int)$input['privacy_mode'] : 0;

        // Validar rangos
        $feeTrading = max(0.0001, min(0.01, $feeTrading)); // Entre 0.01% y 1%
        $slippageTolerance = max(0.001, min(0.1, $slippageTolerance)); // Entre 0.1% y 10%

        $updateQuery = $db->prepare("
            UPDATE wallet_config 
            SET fee_trading = ?, slippage_tolerance = ?, auto_reinvest = ?, 
                notifications_enabled = ?, privacy_mode = ? 
            WHERE user_id = ?
        ");

        $result = $updateQuery->execute([
            $feeTrading, $slippageTolerance, $autoReinvest, 
            $notificationsEnabled, $privacyMode, $userData['id']
        ]);

        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Configuración actualizada exitosamente']);
        } else {
            throw new Exception('Error al actualizar la configuración');
        }

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
}
?>

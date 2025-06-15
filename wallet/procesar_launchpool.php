<?php
require_once '../includes/AuthController.php';
require_once '../includes/Database.php';

header('Content-Type: application/json');

$auth = new AuthController();

if (!$auth->isAuthenticated()) {
    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$amount = floatval($data['amount'] ?? 0);

if ($amount <= 0) {
    echo json_encode(['success' => false, 'message' => 'Cantidad inválida']);
    exit();
}

$userData = $auth->getUserData();
$username = $userData['username'];

try {
    $db = Database::getInstance();
    
    // Verificar si ya tiene una inversión activa
    $sql_check = "SELECT id FROM launchpool_inversiones WHERE username = ? AND estado = 'activo'";
    $stmt = $db->prepare($sql_check);
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Ya tienes una inversión activa']);
        exit();
    }

    // Verificar balance
    $sql_balance = "SELECT SUM(cantidad) as balance FROM transacciones_einherjer WHERE username = ?";
    $stmt = $db->prepare($sql_balance);
    $stmt->execute([$username]);
    $balance = $stmt->fetch()['balance'] ?? 0;

    if ($balance < $amount) {
        echo json_encode(['success' => false, 'message' => 'Balance insuficiente']);
        exit();
    }

    // Iniciar transacción
    $db->beginTransaction();

    try {
        // Registrar inversión
        $fecha_fin = date('Y-m-d H:i:s', strtotime('+3 days'));
        $sql_inversion = "INSERT INTO launchpool_inversiones (username, cantidad, fecha_inicio, fecha_fin, estado) 
                         VALUES (?, ?, NOW(), ?, 'activo')";
        $stmt = $db->prepare($sql_inversion);
        $stmt->execute([$username, $amount, $fecha_fin]);

        // Descontar EINHERJER
        $sql_update = "INSERT INTO transacciones_einherjer (username, cantidad, tipo, fecha) 
                      VALUES (?, ?, 'launchpool', NOW())";
        $cantidad_negativa = -$amount;
        $stmt = $db->prepare($sql_update);
        $stmt->execute([$username, $cantidad_negativa]);

        $db->commit();
        echo json_encode(['success' => true, 'message' => 'Inversión realizada con éxito']);
    } catch (Exception $e) {
        $db->rollback();
        error_log("Error en procesar_launchpool.php: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error al procesar la inversión']);
    }
} catch (Exception $e) {
    error_log("Error en procesar_launchpool.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error de base de datos']);
}
?>

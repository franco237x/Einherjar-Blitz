<?php
require_once 'includes/Database.php';

$auth = new AuthController();

// Verificar autenticación
if (!$auth->isAuthenticated()) {
    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
    exit();
}

header('Content-Type: application/json');

$response = [
    'success' => false,
    'message' => '',
    'newBalance' => 0,
    'newLlaves' => 0
];

if (!isset($_POST['codigo'])) {
    echo json_encode(['success' => false, 'message' => 'Código no proporcionado']);
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    echo json_encode(['success' => false, 'message' => 'Error obteniendo datos del usuario']);
    exit();
}

$username = $userData['username'];
$codigo = $_POST['codigo'];
$db = Database::getInstance();

try {
    $db->beginTransaction();

    // Verificar si el cupón existe y no ha sido usado
    $stmt = $db->prepare("SELECT * FROM cupones WHERE codigo = ? AND usado = 0");
    $stmt->execute([$codigo]);
    $cupon = $stmt->fetch();

    if (!$cupon) {
        $response['message'] = 'Cupón inválido o ya utilizado';
        echo json_encode($response);
        $db->rollback();
        exit();
    }

    // Verificar si el usuario ya usó este cupón
    $stmt_check = $db->prepare("SELECT id FROM cupones_usados WHERE username = ? AND codigo_cupon = ?");
    $stmt_check->execute([$username, $codigo]);
    
    if ($stmt_check->fetch()) {
        $response['message'] = 'Ya has usado este cupón anteriormente';
        echo json_encode($response);
        $db->rollback();
        exit();
    }

    // Aplicar recompensa del cupón
    $recompensa_esferas = $cupon['recompensa_esferas'] ?? 0;
    $recompensa_llaves = $cupon['recompensa_llaves'] ?? 0;

    // Actualizar datos del usuario
    $stmt_update = $db->prepare("UPDATE usuarios SET recompensas = recompensas + ?, llaves = llaves + ? WHERE username = ?");
    $stmt_update->execute([$recompensa_esferas, $recompensa_llaves, $username]);

    // Marcar cupón como usado
    $stmt_mark = $db->prepare("UPDATE cupones SET usado = 1, fecha_uso = NOW(), usuario_uso = ? WHERE codigo = ?");
    $stmt_mark->execute([$username, $codigo]);

    // Registrar uso del cupón
    $stmt_register = $db->prepare("INSERT INTO cupones_usados (username, codigo_cupon, fecha_uso) VALUES (?, ?, NOW())");
    $stmt_register->execute([$username, $codigo]);

    // Obtener nuevos balances
    $stmt_balance = $db->prepare("SELECT recompensas, llaves FROM usuarios WHERE username = ?");
    $stmt_balance->execute([$username]);
    $balance = $stmt_balance->fetch();

    $db->commit();

    $response['success'] = true;
    $response['message'] = "Cupón canjeado exitosamente. Has recibido: {$recompensa_esferas} esferas y {$recompensa_llaves} llaves";
    $response['newBalance'] = $balance['recompensas'];
    $response['newLlaves'] = $balance['llaves'];

    echo json_encode($response);

} catch (Exception $e) {
    $db->rollback();
    error_log("Error redeeming coupon: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error del servidor']);
}
    $stmt = $conn->prepare("SELECT * FROM cupones WHERE codigo = ? AND usado = FALSE");
    $stmt->bind_param("s", $codigo);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception('Cupón inválido o ya utilizado');
    }

    $cupon = $result->fetch_assoc();
    
    // Marcar el cupón como usado
    $stmt = $conn->prepare("UPDATE cupones SET usado = TRUE, fecha_uso = NOW(), usuario_uso = ? WHERE codigo = ?");
    $stmt->bind_param("ss", $username, $codigo);
    $stmt->execute();

    // Actualizar esferas y llaves del usuario
    $stmt = $conn->prepare("UPDATE usuarios SET recompensas = recompensas + ?, llaves = llaves + ? WHERE username = ?");
    $stmt->bind_param("iis", $cupon['descuento'], $cupon['llaves'], $username);
    $stmt->execute();

    // Obtener nuevo balance
    $stmt = $conn->prepare("SELECT recompensas, llaves FROM usuarios WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $user_data = $result->fetch_assoc();

    $conn->commit();

    $mensaje = '¡Cupón canjeado exitosamente!';
    if ($cupon['descuento'] > 0) {
        $mensaje .= ' Has recibido ' . $cupon['descuento'] . ' esferas';
    }
    if ($cupon['llaves'] > 0) {
        $mensaje .= ($cupon['descuento'] > 0 ? ' y ' : ' Has recibido ') . $cupon['llaves'] . ' llaves';
    }

    $response['success'] = true;
    $response['message'] = $mensaje;
    $response['newBalance'] = $user_data['recompensas'];
    $response['newLlaves'] = $user_data['llaves'];

} catch (Exception $e) {
    $conn->rollback();
    $response['message'] = $e->getMessage();
} finally {
    $conn->close();
}

echo json_encode($response);
?>
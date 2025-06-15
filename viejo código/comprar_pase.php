<?php
require_once 'includes/Database.php';

$auth = new AuthController();

// Verificar si el usuario está autenticado
if (!$auth->isAuthenticated()) {
    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
    exit();
}

header('Content-Type: application/json');

// Obtener datos del usuario
$userData = $auth->getUserData();
if (!$userData) {
    echo json_encode(['success' => false, 'message' => 'Error obteniendo datos del usuario']);
    exit();
}

$username = $userData['username'];
$costo_pase = 500; // Costo en esferas
$db = Database::getInstance();

// Iniciar transacción
$db->beginTransaction();

try {
    // Verificar si el usuario ya tiene el pase premium
    $check_pase = $db->prepare("SELECT premium FROM pase_batalla WHERE username = ?");
    $check_pase->execute([$username]);
    $pase_data = $check_pase->fetch();

    if ($pase_data && $pase_data['premium']) {
        throw new Exception('Ya tienes el Pase Premium activo');
    }

    // Verificar si el usuario tiene suficientes esferas
    if ($userData['recompensas'] < $costo_pase) {
        throw new Exception('No tienes suficientes esferas para comprar el Pase Premium');
    }

    // Restar esferas al usuario
    $update_esferas = $db->prepare("UPDATE usuarios SET recompensas = recompensas - ? WHERE username = ?");
    $update_esferas->execute([$costo_pase, $username]);

    // Actualizar o crear registro en pase_batalla
    if ($result_pase->num_rows > 0) {
        $update_pase = $conn->prepare("UPDATE pase_batalla SET premium = TRUE WHERE username = ?");
        $update_pase->bind_param("s", $username);
        $update_pase->execute();
    } else {
        $insert_pase = $conn->prepare("INSERT INTO pase_batalla (username, nivel, puntos, premium) VALUES (?, 1, 0, TRUE)");
        $insert_pase->bind_param("s", $username);
        $insert_pase->execute();
    }

    // Confirmar transacción
    $conn->commit();
    echo json_encode(['success' => true, 'message' => '¡Has adquirido el Pase Premium con éxito!']);

    // Actualizar o insertar el pase premium
    if ($pase_data) {
        $update_pase = $db->prepare("UPDATE pase_batalla SET premium = 1 WHERE username = ?");
        $update_pase->execute([$username]);
    } else {
        $insert_pase = $db->prepare("INSERT INTO pase_batalla (username, premium) VALUES (?, 1)");
        $insert_pase->execute([$username]);
    }

    // Confirmar transacción
    $db->commit();
    echo json_encode(['success' => true, 'message' => 'Pase Premium comprado exitosamente']);

} catch (Exception $e) {
    // Revertir transacción en caso de error
    $db->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>

<?php
require_once 'includes/Database.php';

$auth = new AuthController();

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $response = array();
    
    if (!$auth->isAuthenticated()) {
        $response['success'] = false;
        $response['message'] = "Sesión no válida. Por favor, inicie sesión nuevamente.";
        echo json_encode($response);
        exit();
    }

    $userData = $auth->getUserData();
    if (!$userData) {
        $response['success'] = false;
        $response['message'] = "Error obteniendo datos del usuario";
        echo json_encode($response);
        exit();
    }

    $db = Database::getInstance();

    try {
        $db->beginTransaction();

        $usuario_actual = $userData['username'];
        $destinatario = $_POST['destinatario'] ?? '';
        $cantidad_a_transferir = intval($_POST['cantidad'] ?? 0);

        if (empty($destinatario)) {
            throw new Exception("Debe especificar un destinatario.");
        }

        // Verificar que el destinatario existe
        $stmt_check = $db->prepare("SELECT username FROM usuarios WHERE username = ?");
        $stmt_check->execute([$destinatario]);
        if (!$stmt_check->fetch()) {
            throw new Exception("El usuario destinatario no existe.");
        }

        // Obtener llaves del usuario actual
        $stmt_llaves = $db->prepare("SELECT llaves FROM usuarios WHERE username = ? FOR UPDATE");
        $stmt_llaves->execute([$usuario_actual]);
        $user_data = $stmt_llaves->fetch();
        $llaves_actuales = $user_data['llaves'];

        if ($cantidad_a_transferir <= 0) {
            throw new Exception("La cantidad a transferir debe ser mayor a 0.");
        }

        if ($cantidad_a_transferir > $llaves_actuales) {
            throw new Exception("No tienes suficientes llaves para realizar esta transferencia.");
        }

        // Realizar la transferencia
        $stmt_enviar = $db->prepare("UPDATE usuarios SET llaves = llaves - ? WHERE username = ?");
        $stmt_enviar->execute([$cantidad_a_transferir, $usuario_actual]);

        $stmt_recibir = $db->prepare("UPDATE usuarios SET llaves = llaves + ? WHERE username = ?");
        $stmt_recibir->execute([$cantidad_a_transferir, $destinatario]);

        $db->commit();

        // Obtener llaves actualizadas
        $stmt_nuevo_balance = $db->prepare("SELECT llaves FROM usuarios WHERE username = ?");
        $stmt_nuevo_balance->execute([$usuario_actual]);
        $nuevo_balance_data = $stmt_nuevo_balance->fetch();
        $nuevo_balance = $nuevo_balance_data['llaves'];

        $response['success'] = true;
        $response['message'] = "Transferencia exitosa";
        $response['nuevoBalance'] = $nuevo_balance;
        $response['detalles'] = [
            'cantidad' => $cantidad_a_transferir,
            'destinatario' => $destinatario
        ];

    } catch (Exception $e) {
        $db->rollback();
        $response['success'] = false;
        $response['message'] = $e->getMessage();
    }

    echo json_encode($response);
    exit();
} else {
    $response['success'] = false;
    $response['message'] = "Método no permitido";
    echo json_encode($response);
    exit();
}
?>

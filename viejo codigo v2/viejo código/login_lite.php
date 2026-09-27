<?php
require_once 'includes/Database.php';

$auth = new AuthController();

header('Content-Type: application/json');

// Desactivar la visualización de errores para evitar que se envíe HTML en la respuesta JSON
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'error_log.txt');

// Obtener los datos enviados
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['username']) || !isset($data['unique_id'])) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos.']);
    exit();
}

$username = $data['username'];
$unique_id = $data['unique_id'];

try {
    // Intentar login con ID único
    $success = $auth->loginWithUniqueId($username, $unique_id);

    if ($success) {
        echo json_encode(['success' => true, 'username' => $username]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Usuario o ID único incorrectos.']);
    }
} catch (Exception $e) {
    error_log('Error en login_lite: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor.']);
}
?>
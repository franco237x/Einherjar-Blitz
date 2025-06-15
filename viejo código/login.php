<?php
require_once 'includes/Database.php';

$auth = new AuthController();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    header('Content-Type: application/json');
    $response = array();

    $input_username = $_POST["username"] ?? '';
    $input_id = $_POST["unique_id"] ?? '';

    if (empty($input_username) || empty($input_id)) {
        $response['success'] = false;
        $response['message'] = "Usuario y ID único son requeridos";
        echo json_encode($response);
        exit();
    }

    // Intentar login con ID único
    $success = $auth->loginWithUniqueId($input_username, $input_id);

    if ($success) {
        $response['success'] = true;
        $response['message'] = "Login exitoso";
        $response['redirect'] = "dashboard.php";
    } else {
        $response['success'] = false;
        $response['message'] = "Usuario o ID único incorrecto";
    }

    echo json_encode($response);
    exit();
}
?>
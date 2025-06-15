<?php
require_once 'includes/Database.php';

$auth = new AuthController();

// Realizar logout
$auth->logout();

// Responder con JSON si es una petición AJAX
if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Sesión cerrada exitosamente']);
    exit();
}

// Redireccionar al índice si es una petición normal
header('Location: index.php');
exit();
?>
<?php
require_once 'includes/Database.php';

$auth = new AuthController();

try {
    // Realizar logout
    $auth->logout();
    
    // Responder con JSON si es una petición AJAX
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true, 
            'message' => 'Sesión cerrada exitosamente',
            'redirect' => 'index.php'
        ]);
        exit();
    }
    
    // También manejar peticiones POST
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true, 
            'message' => 'Sesión cerrada exitosamente',
            'redirect' => 'index.php'
        ]);
        exit();
    }
    
} catch (Exception $e) {
    // Error en el logout
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest' || $_SERVER['REQUEST_METHOD'] === 'POST') {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false, 
            'message' => 'Error al cerrar sesión',
            'error' => $e->getMessage()
        ]);
        exit();
    }
}

// Redireccionar al índice si es una petición normal
header('Location: index.php');
exit();
?>

<?php
// Deshabilitar la salida de errores de PHP para mantener JSON limpio
ini_set('display_errors', 0);
error_reporting(0);

require_once '../includes/Database.php';

header('Content-Type: application/json');

try {
    $auth = new AuthController();

    // Verificar autenticación
    if (!$auth->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado']);
        exit();
    }

    $userData = $auth->getUserData();
    if (!$userData) {
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado']);
        exit();
    }

    // Verificar que sea una petición GET
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        exit();
    }

    $query = trim($_GET['q'] ?? '');

    // Validar que el query tenga al menos 2 caracteres
    if (strlen($query) < 2) {
        echo json_encode(['users' => []]);
        exit();
    }

    $db = Database::getInstance();
    
    // Buscar usuarios que coincidan con el query y excluir al usuario actual
    $stmt = $db->prepare("
        SELECT username, rango, perfil_imagen
        FROM usuarios 
        WHERE username LIKE ? 
        AND is_active = 1 
        AND id != ?
        ORDER BY 
            CASE 
                WHEN username = ? THEN 1
                WHEN username LIKE ? THEN 2
                ELSE 3
            END,
            username ASC
        LIMIT 10
    ");
    
    $searchTerm = '%' . $query . '%';
    $exactMatch = $query;
    $startsWith = $query . '%';
    
    $stmt->execute([$searchTerm, $userData['id'], $exactMatch, $startsWith]);
    $users = $stmt->fetchAll();
    
    // Formatear la respuesta
    $response = [
        'users' => array_map(function($user) {
            return [
                'username' => $user['username'],
                'rango' => $user['rango'],
                'avatar' => $user['perfil_imagen']
            ];
        }, $users)
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log("User search error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor']);
}
?>

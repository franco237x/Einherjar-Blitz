<?php
require_once 'includes/Database.php';

$auth = new AuthController();

// Verificar autenticación
if (!$auth->isAuthenticated()) {
    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
    exit();
}

header('Content-Type: application/json');

$userData = $auth->getUserData();
if (!$userData) {
    echo json_encode(['success' => false, 'message' => 'Error obteniendo datos del usuario']);
    exit();
}

$username = $userData['username'];
$db = Database::getInstance();

try {
    $db->beginTransaction();
    
    // Actualizar jefes derrotados y agregar copas
    $stmt = $db->prepare("UPDATE usuarios SET jefes_derrotados = jefes_derrotados + 1, copas = copas + 10 WHERE username = ?");
    $stmt->execute([$username]);
    
    // Actualizar pase de batalla
    actualizarPuntosJefe($username, $db);
    
    $db->commit();
    
    echo json_encode(['success' => true, 'message' => 'Contador de jefes derrotados y copas actualizado correctamente para el usuario: ' . $username]);
} catch (Exception $e) {
    $db->rollback();
    error_log("Error updating boss defeat: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error al actualizar el contador de jefes derrotados y copas para el usuario: ' . $username]);
}

function actualizarPuntosJefe($username, $db) {
    try {
        // Verificar si el usuario tiene entrada en pase_batalla
        $check = $db->prepare("SELECT id FROM pase_batalla WHERE username = ?");
        $check->execute([$username]);
        
        if (!$check->fetch()) {
            // Crear entrada si no existe
            $insert = $db->prepare("INSERT INTO pase_batalla (username, user_id, progreso, temporada) SELECT ?, id, 0, 'actual' FROM usuarios WHERE username = ?");
            $insert->execute([$username, $username]);
        }
        
        // Actualizar puntos del pase de batalla
        $stmt = $db->prepare("
            UPDATE pase_batalla SET 
                progreso = progreso + 1
            WHERE username = ?
        ");
        $stmt->execute([$username]);
    } catch (Exception $e) {
        error_log("Error updating battle pass points: " . $e->getMessage());
    }
}
?>

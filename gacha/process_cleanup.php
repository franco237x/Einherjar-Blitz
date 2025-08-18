<?php
session_start();
header('Content-Type: application/json');

try {
    // Verificar autenticación
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
        echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
        exit;
    }

    $user_id = $_SESSION['user_id'];
    $username = $_SESSION['username'];

    // Obtener datos POST
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    if (!in_array($action, ['clear_all', 'auto_claim_cleanup'])) {
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
        exit;
    }

    require_once '../includes/Database.php';
    $db = Database::getInstance();
    $conn = $db->getConnection();

    // Iniciar transacción
    $conn->beginTransaction();

    // Contar recompensas antes de eliminar
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM recompensas_usuario WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $count_result = $stmt->fetch(PDO::FETCH_ASSOC);
    $total_recompensas = $count_result['total'];

    if ($total_recompensas === 0) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'message' => 'No hay recompensas para eliminar']);
        exit;
    }

    // Crear respaldo de las recompensas eliminadas (opcional)
    $stmt = $conn->prepare("
        INSERT INTO recompensas_eliminadas (
            original_id, user_id, username, recompensa_obtenida, 
            tipo_recompensa, valor, fecha_obtencion, fecha_eliminacion
        )
        SELECT 
            id, user_id, username, recompensa_obtenida, 
            tipo_recompensa, valor, fecha_obtencion, NOW()
        FROM recompensas_usuario 
        WHERE user_id = ?
    ");
    
    // Ejecutar respaldo solo si la tabla existe
    try {
        $stmt->execute([$user_id]);
    } catch (PDOException $e) {
        // Si la tabla no existe, continuamos sin respaldo
        // Esto es opcional y no afecta la funcionalidad principal
    }

    // Eliminar las recompensas del usuario
    $stmt = $conn->prepare("DELETE FROM recompensas_usuario WHERE user_id = ?");
    $stmt->execute([$user_id]);

    // Registrar la acción en el log de transacciones
    $descripcion = $action === 'auto_claim_cleanup' 
        ? "Limpieza automática tras reclamo - {$total_recompensas} elementos eliminados"
        : "Limpieza manual de recompensas - {$total_recompensas} elementos eliminados";
        
    $stmt = $conn->prepare("
        INSERT INTO transacciones_einherjer (user_id, username, tipo, cantidad, descripcion) 
        VALUES (?, ?, 'sistema', ?, ?)
    ");
    $stmt->execute([
        $user_id, 
        $username, 
        $total_recompensas, 
        $descripcion
    ]);

    // Confirmar transacción
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Recompensas eliminadas exitosamente',
        'deleted_count' => $total_recompensas
    ]);

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollBack();
    }
    echo json_encode([
        'success' => false, 
        'message' => 'Error del servidor: ' . $e->getMessage()
    ]);
}
?>

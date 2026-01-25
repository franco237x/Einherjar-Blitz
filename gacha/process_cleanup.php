<?php
/**
 * Process Cleanup - Gacha System
 * Handles cleanup of claimed rewards
 */

session_start();
header('Content-Type: application/json');

try {
    // Verify authentication
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
        exit;
    }

    $user_id = $_SESSION['user_id'];

    // Get input
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    require_once '../includes/Database.php';

    $db = Database::getInstance();
    $conn = $db->getConnection();

    switch ($action) {
        case 'clear_all':
        case 'auto_claim_cleanup':
            // Start transaction
            $conn->beginTransaction();

            // Get rewards to backup
            $stmt = $conn->prepare("SELECT * FROM recompensas_usuario WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $rewards = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $deleted_count = count($rewards);

            if ($deleted_count > 0) {
                // Backup to deleted rewards table
                $stmt = $conn->prepare("
                    INSERT INTO recompensas_eliminadas 
                    (user_id, username, recompensa_obtenida, tipo_recompensa, valor, fecha_obtencion, fecha_eliminacion)
                    SELECT user_id, username, recompensa_obtenida, tipo_recompensa, valor, fecha_obtencion, NOW()
                    FROM recompensas_usuario 
                    WHERE user_id = ?
                ");
                $stmt->execute([$user_id]);

                // Delete rewards
                $stmt = $conn->prepare("DELETE FROM recompensas_usuario WHERE user_id = ?");
                $stmt->execute([$user_id]);
            }

            $conn->commit();

            echo json_encode([
                'success' => true,
                'message' => 'Recompensas eliminadas correctamente',
                'deleted_count' => $deleted_count
            ]);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
<?php
/**
 * API: Gestionar mis anuncios del marketplace
 * Endpoint: GET/DELETE /tienda/api/my_listings.php
 */

require_once '../../includes/Database.php';

header('Content-Type: application/json');

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Sesión inválida']);
    exit();
}

try {
    $db = Database::getInstance();
    
    // GET: Obtener mis anuncios
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $db->prepare("
            SELECT 
                ml.*,
                (SELECT COUNT(*) FROM marketplace_transactions WHERE listing_id = ml.id AND status = 'completed') as sales_count
            FROM marketplace_listings ml
            WHERE ml.seller_id = ?
            ORDER BY ml.is_active DESC, ml.created_at DESC
        ");
        
        $stmt->execute([$userData['id']]);
        $listings = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'listings' => $listings,
            'total' => count($listings)
        ]);
        exit();
    }
    
    // DELETE: Eliminar/desactivar un anuncio
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);
        $listingId = isset($input['listing_id']) ? (int)$input['listing_id'] : 0;
        
        if ($listingId <= 0) {
            throw new Exception('ID de anuncio inválido');
        }
        
        $db->beginTransaction();
        
        // Verificar que el anuncio pertenece al usuario
        $checkStmt = $db->prepare("
            SELECT id, is_sold, reward_id 
            FROM marketplace_listings 
            WHERE id = ? AND seller_id = ?
        ");
        $checkStmt->execute([$listingId, $userData['id']]);
        $listing = $checkStmt->fetch();
        
        if (!$listing) {
            throw new Exception('El anuncio no existe o no te pertenece');
        }
        
        if ((int)$listing['is_sold'] === 1) {
            throw new Exception('No puedes eliminar un anuncio ya vendido');
        }
        
        // Desactivar el anuncio
        $deleteStmt = $db->prepare("UPDATE marketplace_listings SET is_active = 0 WHERE id = ?");
        $deleteStmt->execute([$listingId]);
        
        // Si tenía reward_id, liberar la recompensa (quitar sufijo _vendido si se agregó prematuramente)
        if ($listing['reward_id']) {
            $releaseStmt = $db->prepare("
                UPDATE recompensas_usuario 
                SET tipo_recompensa = REPLACE(tipo_recompensa, '_vendido', '')
                WHERE id = ?
            ");
            $releaseStmt->execute([$listing['reward_id']]);
        }
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Anuncio eliminado correctamente'
        ]);
        exit();
    }
    
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    
} catch (Exception $e) {
    if ($db->getConnection()->inTransaction()) {
        $db->rollback();
    }
    
    error_log("Error in my_listings.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

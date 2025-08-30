<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../includes/Database.php';

$auth = new AuthController();

// Verificar autenticación
if (!$auth->isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
    exit();
}

try {
    $db = Database::getInstance();
    
    // Get limit and offset from query parameters
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 50) : 10;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    // Get total count of transactions
    $countStmt = $db->prepare("SELECT COUNT(*) as total FROM transacciones_einherjer WHERE user_id = ?");
    $countStmt->execute([$userData['id']]);
    $totalTransactions = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Obtener transacciones del usuario con paginación
    $stmt = $db->prepare("
        SELECT tipo, cantidad, descripcion, fecha, destinatario 
        FROM transacciones_einherjer 
        WHERE user_id = ? 
        ORDER BY fecha DESC 
        LIMIT " . (int)$limit . " OFFSET " . (int)$offset . "
    ");
    
    $stmt->execute([$userData['id']]);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Si no hay transacciones, crear algunas de ejemplo para mostrar el sistema
    if (empty($transactions)) {
        // Insertar transacciones de ejemplo para demostración
        $exampleTransactions = [
            [
                'tipo' => 'deposito',
                'cantidad' => 100,
                'descripcion' => 'Recompensa por completar nivel',
                'destinatario' => null
            ],
            [
                'tipo' => 'minado',
                'cantidad' => 50,
                'descripcion' => 'Esferas obtenidas por minado',
                'destinatario' => null
            ],
            [
                'tipo' => 'compra',
                'cantidad' => -25,
                'descripcion' => 'Compra en la tienda',
                'destinatario' => null
            ]
        ];
        
        foreach ($exampleTransactions as $transaction) {
            $insertStmt = $db->prepare("
                INSERT INTO transacciones_einherjer (user_id, username, tipo, cantidad, descripcion, destinatario) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $insertStmt->execute([
                $userData['id'],
                $userData['username'],
                $transaction['tipo'],
                $transaction['cantidad'],
                $transaction['descripcion'],
                $transaction['destinatario']
            ]);
        }
        
        // Volver a obtener las transacciones
        $stmt->execute([$userData['id']]);
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Obtener estadísticas de transacciones
    $statsStmt = $db->prepare("
        SELECT 
            COUNT(*) as total_transactions,
            SUM(CASE WHEN cantidad > 0 THEN cantidad ELSE 0 END) as total_income,
            SUM(CASE WHEN cantidad < 0 THEN ABS(cantidad) ELSE 0 END) as total_spent,
            MAX(fecha) as last_transaction_date
        FROM transacciones_einherjer 
        WHERE user_id = ?
    ");
    
    $statsStmt->execute([$userData['id']]);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'transactions' => $transactions,
        'total' => $totalTransactions,
        'limit' => $limit,
        'offset' => $offset,
        'hasMore' => ($offset + $limit) < $totalTransactions,
        'stats' => $stats,
        'user_balance' => [
            'keys' => $userData['llaves'],
            'spheres' => $userData['recompensas'],
            'level' => $userData['nivel']
        ]
    ]);

} catch (Exception $e) {
    error_log("Error in get_transactions.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error interno del servidor',
        'transactions' => [],
        'stats' => [
            'total_transactions' => 0,
            'total_income' => 0,
            'total_spent' => 0,
            'last_transaction_date' => null
        ]
    ]);
}
?>

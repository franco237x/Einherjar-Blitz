<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../includes/Database.php';

// Cargar configuración
$config = require_once 'config.php';

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit();
}

try {
    $auth = new AuthController();
    
    // Verificar autenticación
    if (!$auth->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado']);
        exit();
    }
    
    $userData = $auth->getUserData();
    if (!$userData) {
        http_response_code(401);
        echo json_encode(['error' => 'Usuario no válido']);
        exit();
    }
    
    // Obtener datos del request
    $input = json_decode(file_get_contents('php://input'), true);
    $package = $input['package'] ?? 'basic';
    
    // Usar paquetes de la configuración
    $packages = $config['packages'];
    
    if (!isset($packages[$package])) {
        http_response_code(400);
        echo json_encode(['error' => 'Paquete no válido']);
        exit();
    }
    
    $selectedPackage = $packages[$package];
    
    // Crear orden de pago con DlocalGo
    $paymentData = [
        'amount' => $selectedPackage['price'],
        'currency' => $selectedPackage['currency'],
        'country' => 'MX',
        'order_id' => 'KEYS_' . $userData['id'] . '_' . time(),
        'description' => $selectedPackage['name'] . ' - ' . $selectedPackage['keys'] . ' llaves',
        'notification_url' => $config['urls']['webhook'],
        'success_url' => $config['urls']['success'],
        'error_url' => $config['urls']['failure'],
        'payer' => [
            'name' => $userData['username'],
            'email' => $userData['email'] ?? $userData['username'] . '@einherjar.com'
        ]
    ];
    
    // Llamar a DlocalGo API
    $paymentResponse = createDlocalGoPayment($paymentData, $config['dlocalgo']);
    
    if ($paymentResponse['success']) {
        // Guardar orden pendiente en base de datos
        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT INTO payment_orders (user_id, order_id, package_type, keys_amount, price, currency, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
        ");
        $stmt->execute([
            $userData['id'],
            $paymentData['order_id'],
            $package,
            $selectedPackage['keys'],
            $selectedPackage['price'],
            $selectedPackage['currency']
        ]);
        
        echo json_encode([
            'success' => true,
            'payment_url' => $paymentResponse['payment_url'],
            'order_id' => $paymentData['order_id']
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear el pago: ' . ($paymentResponse['message'] ?? 'Error desconocido')]);
    }
    
} catch (Exception $e) {
    error_log('Buy keys error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor']);
}

function createDlocalGoPayment($data, $dlocalgoConfig) {
    // Usar Basic Auth: API_KEY como usuario, SECRET_KEY como contraseña
    $auth = base64_encode($dlocalgoConfig['api_key'] . ':' . $dlocalgoConfig['secret_key']);
    
    $headers = [
        'Content-Type: application/json',
        'Authorization: Basic ' . $auth,
        'Accept: application/json'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $dlocalgoConfig['api_url']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        error_log('CURL Error: ' . $curlError);
        return ['success' => false, 'message' => 'Error de conexión'];
    }
    
    if ($httpCode === 200 || $httpCode === 201) {
        $responseData = json_decode($response, true);
        
        if (isset($responseData['redirect_url'])) {
            return [
                'success' => true,
                'payment_url' => $responseData['redirect_url']
            ];
        } else {
            // Fallback al URL directo si no hay redirect_url
            return [
                'success' => true,
                'payment_url' => 'https://checkout.dlocalgo.com/validate/recurring/yjNXAb92dBlFV9RxG0iYJ7aUcCw9iNWq'
            ];
        }
    }
    
    // Log del error para debugging
    error_log('DlocalGo API Error - HTTP Code: ' . $httpCode . ' Response: ' . $response);
    
    return [
        'success' => false, 
        'message' => 'Error HTTP: ' . $httpCode
    ];
}
?>

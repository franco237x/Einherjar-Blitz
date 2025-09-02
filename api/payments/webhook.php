<?php
header('Content-Type: application/json');
require_once '../../includes/Database.php';

// Cargar configuración
$config = require_once 'config.php';

// Log de entrada para debugging
error_log('Webhook received: ' . $_SERVER['REQUEST_METHOD'] . ' from ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit();
}

try {
    // Obtener datos del webhook
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Log del payload recibido
    error_log('Webhook payload: ' . $input);
    
    // Validar que el JSON sea válido
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('Invalid JSON received: ' . json_last_error_msg());
        http_response_code(400);
        echo json_encode(['error' => 'JSON inválido']);
        exit();
    }
    
    // Validar firma del webhook
    $signature = $_SERVER['HTTP_X_SIGNATURE'] ?? $_SERVER['HTTP_SIGNATURE'] ?? '';
    if (!validateWebhookSignature($input, $signature, $config['dlocalgo']['secret_key'])) {
        error_log('Webhook signature validation failed. Signature: ' . $signature);
        http_response_code(401);
        echo json_encode(['error' => 'Firma no válida']);
        exit();
    }
    
    // Extraer información del pago con múltiples posibles campos
    $orderId = $data['order_id'] ?? $data['external_reference'] ?? $data['merchant_order_id'] ?? '';
    $status = $data['status'] ?? $data['payment_status'] ?? '';
    $paymentId = $data['id'] ?? $data['payment_id'] ?? '';
    
    error_log("Processing webhook - Order ID: $orderId, Status: $status, Payment ID: $paymentId");
    
    if (empty($orderId)) {
        error_log('No order ID found in webhook data: ' . print_r($data, true));
        http_response_code(400);
        echo json_encode(['error' => 'Order ID requerido']);
        exit();
    }
    
    $db = Database::getInstance();
    
    // Buscar la orden en la base de datos
    $stmt = $db->prepare("SELECT * FROM payment_orders WHERE order_id = ?");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
    
    if (!$order) {
        error_log("Order not found: $orderId");
        http_response_code(404);
        echo json_encode(['error' => 'Orden no encontrada']);
        exit();
    }
    
    error_log("Found order: " . print_r($order, true));
    
    // Procesar según el estado del pago - más estados posibles
    if (in_array(strtoupper($status), ['PAID', 'COMPLETED', 'APPROVED', 'SUCCESS'])) {
        // Pago exitoso - actualizar orden y agregar llaves
        $stmt = $db->prepare("
            UPDATE payment_orders 
            SET status = 'completed', payment_id = ?, completed_at = NOW() 
            WHERE order_id = ? AND status = 'pending'
        ");
        $result = $stmt->execute([$paymentId, $orderId]);
        
        if ($result && $stmt->rowCount() > 0) {
            // Agregar llaves al usuario
            $stmt = $db->prepare("
                UPDATE usuarios 
                SET llaves = llaves + ? 
                WHERE id = ?
            ");
            $stmt->execute([$order['keys_amount'], $order['user_id']]);
            
            // Registrar transacción
            $stmt = $db->prepare("
                INSERT INTO wallet_transactions (user_id, tipo, cantidad_esferas, descripcion, fecha_transaccion) 
                VALUES (?, 'compra_llaves', 0, ?, NOW())
            ");
            $stmt->execute([
                $order['user_id'],
                "Compra de {$order['keys_amount']} llaves - {$order['package_type']} - ${$order['price']} {$order['currency']}"
            ]);
            
            error_log("Payment processed successfully for order: $orderId");
            echo json_encode(['success' => true, 'message' => 'Pago procesado exitosamente']);
        } else {
            error_log("Order already processed: $orderId");
            echo json_encode(['success' => false, 'message' => 'Orden ya procesada']);
        }
        
    } elseif (in_array(strtoupper($status), ['FAILED', 'CANCELLED', 'REJECTED', 'ERROR'])) {
        // Pago fallido - actualizar estado
        $stmt = $db->prepare("
            UPDATE payment_orders 
            SET status = 'failed', completed_at = NOW() 
            WHERE order_id = ?
        ");
        $stmt->execute([$orderId]);
        
        error_log("Payment failed for order: $orderId");
        echo json_encode(['success' => true, 'message' => 'Pago fallido registrado']);
        
    } else {
        // Estado pendiente o desconocido
        error_log("Unknown payment status: $status for order: $orderId");
        echo json_encode(['success' => true, 'message' => 'Estado recibido: ' . $status]);
    }
    
} catch (Exception $e) {
    error_log('Webhook error: ' . $e->getMessage() . ' Stack: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor']);
}

function validateWebhookSignature($payload, $signature, $secretKey) {
    // Validar que tengamos secret key configurada
    if (empty($secretKey)) {
        error_log('Webhook signature validation skipped - no secret key configured');
        return false; // Rechazar en producción si no hay secret key
    }
    
    if (empty($signature)) {
        error_log('No signature provided in webhook');
        return false;
    }
    
    // Implementar validación de firma según documentación de DlocalGo
    $expectedSignature = hash_hmac('sha256', $payload, $secretKey);
    
    $isValid = hash_equals($expectedSignature, $signature);
    error_log('Signature validation: ' . ($isValid ? 'VALID' : 'INVALID'));
    
    return $isValid;
}
?>

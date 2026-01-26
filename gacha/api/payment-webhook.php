<?php
/**
 * Payment Webhook Handler
 * Einherjer Blitz 3.0 - Gacha System
 * 
 * Receives notifications from MercadoPago
 */

header('Content-Type: application/json');

require_once '../../includes/Database.php';
require_once '../config/payment.php';

$database = Database::getInstance();
$conn = $database->getConnection();

$source = $_GET['source'] ?? '';

if ($source === 'mercadopago') {
    handleMercadoPagoWebhook($conn);
}

function handleMercadoPagoWebhook($conn)
{
    global $mercadopago_config;

    $input = json_decode(file_get_contents('php://input'), true);

    // Log webhook for debugging
    error_log('MercadoPago Webhook: ' . json_encode($input));

    // MercadoPago sends topic and id
    $topic = $input['topic'] ?? $input['type'] ?? '';
    $resource_id = $input['data']['id'] ?? $input['id'] ?? '';

    if ($topic === 'payment' && $resource_id) {
        // Get payment details from MercadoPago
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => 'https://api.mercadopago.com/v1/payments/' . $resource_id,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $mercadopago_config['access_token']
            ]
        ]);

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($http_code === 200) {
            $payment = json_decode($response, true);

            $external_reference = $payment['external_reference'] ?? '';
            $status = $payment['status'] ?? '';

            if ($external_reference) {
                // Find the purchase record
                $stmt = $conn->prepare("SELECT * FROM key_purchases WHERE external_reference = ?");
                $stmt->execute([$external_reference]);
                $purchase = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($purchase && $purchase['status'] === 'pending') {
                    if ($status === 'approved') {
                        $conn->beginTransaction();

                        try {
                            // Update purchase status
                            $stmt = $conn->prepare("
                                UPDATE key_purchases 
                                SET status = 'approved', completed_at = NOW(), payment_id = ?, webhook_data = ?
                                WHERE id = ?
                            ");
                            $stmt->execute([$resource_id, json_encode($payment), $purchase['id']]);

                            // Add keys to user
                            $total_keys = $purchase['keys_purchased'] + $purchase['bonus_keys'];
                            $stmt = $conn->prepare("UPDATE usuarios SET llaves = llaves + ? WHERE id = ?");
                            $stmt->execute([$total_keys, $purchase['user_id']]);

                            // Log transaction
                            $stmt = $conn->prepare("
                                INSERT INTO transacciones_einherjer (user_id, username, tipo, cantidad, descripcion)
                                VALUES (?, ?, 'deposito', ?, ?)
                            ");
                            $stmt->execute([
                                $purchase['user_id'],
                                $purchase['username'],
                                $total_keys,
                                "Compra MercadoPago: {$total_keys} llaves"
                            ]);

                            $conn->commit();
                            error_log('MercadoPago: Payment approved for user ' . $purchase['user_id'] . ', keys: ' . $total_keys);
                        } catch (Exception $e) {
                            $conn->rollBack();
                            error_log('MercadoPago Webhook Error: ' . $e->getMessage());
                        }
                    } elseif (in_array($status, ['rejected', 'cancelled', 'refunded'])) {
                        $stmt = $conn->prepare("UPDATE key_purchases SET status = 'rejected', webhook_data = ? WHERE id = ?");
                        $stmt->execute([json_encode($payment), $purchase['id']]);
                    }
                }
            }
        }
    }

    // Always respond with 200 OK to acknowledge receipt
    http_response_code(200);
    echo json_encode(['received' => true]);
}

<?php
/**
 * PayPal API Integration
 * Einherjer Blitz 3.0 - Gacha System
 */

session_start();
header('Content-Type: application/json');

require_once '../../includes/Database.php';
require_once '../config/payment.php';

// Get database connection
$database = Database::getInstance();
$conn = $database->getConnection();

// Handle different actions
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'create_order':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            exit;
        }
        createOrder($input, $_SESSION['user_id'], $_SESSION['username'], $conn);
        break;
    case 'capture':
        captureOrder($conn);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}

function getPayPalAccessToken()
{
    global $paypal_config;

    $base_url = $paypal_config['sandbox']
        ? 'https://api-m.sandbox.paypal.com'
        : 'https://api-m.paypal.com';

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $base_url . '/v1/oauth2/token',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
        CURLOPT_USERPWD => $paypal_config['client_id'] . ':' . $paypal_config['client_secret'],
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Accept-Language: en_US'
        ]
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    $result = json_decode($response, true);
    return $result['access_token'] ?? null;
}

function createOrder($input, $user_id, $username, $conn)
{
    global $key_packages, $paypal_config;

    $package_id = $input['package_id'] ?? '';

    // Find the selected package
    $selectedPackage = null;
    foreach ($key_packages as $package) {
        if ($package['id'] === $package_id) {
            $selectedPackage = $package;
            break;
        }
    }

    if (!$selectedPackage) {
        echo json_encode(['success' => false, 'message' => 'Paquete no encontrado']);
        exit;
    }

    // Get PayPal access token
    $access_token = getPayPalAccessToken();
    if (!$access_token) {
        echo json_encode(['success' => false, 'message' => 'Error de conexión con PayPal']);
        exit;
    }

    // Generate external reference
    $external_reference = 'EB_' . $user_id . '_' . time() . '_' . bin2hex(random_bytes(4));

    // Create pending purchase record
    $stmt = $conn->prepare("
        INSERT INTO key_purchases 
        (user_id, username, payment_provider, payment_id, external_reference, package_id, keys_purchased, bonus_keys, amount_paid, currency, status)
        VALUES (?, ?, 'paypal', '', ?, ?, ?, ?, ?, 'USD', 'pending')
    ");
    $stmt->execute([
        $user_id,
        $username,
        $external_reference,
        $selectedPackage['id'],
        $selectedPackage['keys'],
        $selectedPackage['bonus'],
        $selectedPackage['price']
    ]);
    $purchase_id = $conn->lastInsertId();

    // Build PayPal order
    $base_url = $paypal_config['sandbox']
        ? 'https://api-m.sandbox.paypal.com'
        : 'https://api-m.paypal.com';

    $order_data = [
        'intent' => 'CAPTURE',
        'purchase_units' => [
            [
                'reference_id' => $external_reference,
                'description' => $selectedPackage['keys'] . ' Llaves - Einherjer Blitz',
                'amount' => [
                    'currency_code' => 'USD',
                    'value' => number_format($selectedPackage['price'], 2, '.', '')
                ]
            ]
        ],
        'application_context' => [
            'return_url' => getBaseUrl() . $paypal_config['return_url'] . '&ref=' . $external_reference,
            'cancel_url' => getBaseUrl() . $paypal_config['cancel_url'],
            'brand_name' => 'Einherjer Blitz',
            'user_action' => 'PAY_NOW'
        ]
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $base_url . '/v2/checkout/orders',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($order_data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $access_token
        ]
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $result = json_decode($response, true);

    if ($http_code === 201 && isset($result['id'])) {
        // Update purchase with order ID
        $stmt = $conn->prepare("UPDATE key_purchases SET payment_id = ? WHERE id = ?");
        $stmt->execute([$result['id'], $purchase_id]);

        // Find approval URL
        $approval_url = null;
        foreach ($result['links'] as $link) {
            if ($link['rel'] === 'approve') {
                $approval_url = $link['href'];
                break;
            }
        }

        echo json_encode([
            'success' => true,
            'approval_url' => $approval_url,
            'order_id' => $result['id']
        ]);
    } else {
        // Delete failed purchase record
        $stmt = $conn->prepare("DELETE FROM key_purchases WHERE id = ?");
        $stmt->execute([$purchase_id]);

        error_log('PayPal Error: ' . $response);
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear la orden de pago'
        ]);
    }
}

function captureOrder($conn)
{
    global $paypal_config;

    $token = $_GET['token'] ?? '';
    $external_reference = $_GET['ref'] ?? '';

    if (empty($token) || empty($external_reference)) {
        header('Location: ../comprar-llaves.php?status=failure');
        exit;
    }

    // Get PayPal access token
    $access_token = getPayPalAccessToken();
    if (!$access_token) {
        header('Location: ../comprar-llaves.php?status=failure');
        exit;
    }

    // Capture the order
    $base_url = $paypal_config['sandbox']
        ? 'https://api-m.sandbox.paypal.com'
        : 'https://api-m.paypal.com';

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $base_url . '/v2/checkout/orders/' . $token . '/capture',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => '{}',
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $access_token
        ]
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $result = json_decode($response, true);

    if ($http_code === 201 && isset($result['status']) && $result['status'] === 'COMPLETED') {
        // Find the purchase record
        $stmt = $conn->prepare("SELECT * FROM key_purchases WHERE external_reference = ? AND status = 'pending'");
        $stmt->execute([$external_reference]);
        $purchase = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($purchase) {
            $conn->beginTransaction();

            try {
                // Update purchase status
                $stmt = $conn->prepare("
                    UPDATE key_purchases 
                    SET status = 'approved', completed_at = NOW(), webhook_data = ?
                    WHERE id = ?
                ");
                $stmt->execute([json_encode($result), $purchase['id']]);

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
                    "Compra PayPal: {$total_keys} llaves"
                ]);

                $conn->commit();
                header('Location: ../comprar-llaves.php?status=success');
            } catch (Exception $e) {
                $conn->rollBack();
                error_log('PayPal Capture Error: ' . $e->getMessage());
                header('Location: ../comprar-llaves.php?status=failure');
            }
        } else {
            header('Location: ../comprar-llaves.php?status=failure');
        }
    } else {
        // Update purchase as rejected
        $stmt = $conn->prepare("UPDATE key_purchases SET status = 'rejected' WHERE external_reference = ?");
        $stmt->execute([$external_reference]);

        header('Location: ../comprar-llaves.php?status=failure');
    }
    exit;
}

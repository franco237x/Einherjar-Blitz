<?php
/**
 * Mercado Pago API Integration
 * Einherjer Blitz 3.0 - Gacha System
 */

session_start();
header('Content-Type: application/json');

require_once '../../includes/Database.php';
require_once '../config/payment.php';

// Verify user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

$user_id = $_SESSION['user_id'];
$username = $_SESSION['username'];

// Get database connection
$database = Database::getInstance();
$conn = $database->getConnection();

// Handle different actions
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

switch ($action) {
    case 'create_preference':
        createPreference($input, $user_id, $username, $conn);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}

function createPreference($input, $user_id, $username, $conn)
{
    global $key_packages, $mercadopago_config;

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

    // Generate external reference
    $external_reference = 'EB_' . $user_id . '_' . time() . '_' . bin2hex(random_bytes(4));

    // Create pending purchase record
    $stmt = $conn->prepare("
        INSERT INTO key_purchases 
        (user_id, username, payment_provider, payment_id, external_reference, package_id, keys_purchased, bonus_keys, amount_paid, currency, status)
        VALUES (?, ?, 'mercadopago', '', ?, ?, ?, ?, ?, 'USD', 'pending')
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

    // Build preference data for Mercado Pago
    $preference_data = [
        'items' => [
            [
                'id' => $selectedPackage['id'],
                'title' => $selectedPackage['keys'] . ' Llaves - Einherjer Blitz',
                'description' => 'Paquete de ' . $selectedPackage['keys'] . ' llaves' .
                    ($selectedPackage['bonus'] > 0 ? ' + ' . $selectedPackage['bonus'] . ' bonus' : ''),
                'quantity' => 1,
                'currency_id' => 'USD',
                'unit_price' => $selectedPackage['price']
            ]
        ],
        'payer' => [
            'name' => $username
        ],
        'external_reference' => $external_reference,
        'back_urls' => [
            'success' => getBaseUrl() . $mercadopago_config['success_url'],
            'failure' => getBaseUrl() . $mercadopago_config['failure_url'],
            'pending' => getBaseUrl() . $mercadopago_config['pending_url']
        ],
        'auto_return' => 'approved',
        'notification_url' => getBaseUrl() . $mercadopago_config['notification_url'] . '?source=mercadopago'
    ];

    // Make API call to Mercado Pago
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'https://api.mercadopago.com/checkout/preferences',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($preference_data),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $mercadopago_config['access_token']
        ]
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $result = json_decode($response, true);

    if ($http_code === 201 && isset($result['id'])) {
        // Update purchase with preference ID
        $stmt = $conn->prepare("UPDATE key_purchases SET payment_id = ? WHERE id = ?");
        $stmt->execute([$result['id'], $purchase_id]);

        // Return the checkout URL
        $init_point = $mercadopago_config['sandbox']
            ? $result['sandbox_init_point']
            : $result['init_point'];

        echo json_encode([
            'success' => true,
            'init_point' => $init_point,
            'preference_id' => $result['id']
        ]);
    } else {
        // Delete failed purchase record
        $stmt = $conn->prepare("DELETE FROM key_purchases WHERE id = ?");
        $stmt->execute([$purchase_id]);

        error_log('MercadoPago Error: ' . $response);
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear la preferencia de pago'
        ]);
    }
}

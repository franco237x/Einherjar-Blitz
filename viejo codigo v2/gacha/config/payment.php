<?php
/**
 * Payment Configuration for Key Purchases
 * Einherjer Blitz 3.0 - Gacha System
 */

// Key packages available for purchase (price per key: $0.50 USD)
$key_packages = [
    [
        'id' => 'pack_5',
        'keys' => 5,
        'price' => 2.50,
        'currency' => 'USD',
        'popular' => false,
        'bonus' => 0
    ],
    [
        'id' => 'pack_10',
        'keys' => 10,
        'price' => 5.00,
        'currency' => 'USD',
        'popular' => true,
        'bonus' => 0
    ],
    [
        'id' => 'pack_25',
        'keys' => 25,
        'price' => 10.00,  // Small discount
        'currency' => 'USD',
        'popular' => false,
        'bonus' => 2  // 2 bonus keys
    ],
    [
        'id' => 'pack_50',
        'keys' => 50,
        'price' => 20.00,  // Better discount
        'currency' => 'USD',
        'popular' => false,
        'bonus' => 5  // 5 bonus keys
    ],
    [
        'id' => 'pack_100',
        'keys' => 100,
        'price' => 35.00,  // Best value
        'currency' => 'USD',
        'popular' => false,
        'bonus' => 15  // 15 bonus keys
    ],
];

// Mercado Pago Configuration
$mercadopago_config = [
    'access_token' => 'YOUR_MERCADOPAGO_ACCESS_TOKEN',
    'public_key' => 'YOUR_MERCADOPAGO_PUBLIC_KEY',
    'sandbox' => true,  // Set to false in production
    'notification_url' => '/gacha/api/payment-webhook.php',
    'success_url' => '/gacha/comprar-llaves.php?status=success',
    'failure_url' => '/gacha/comprar-llaves.php?status=failure',
    'pending_url' => '/gacha/comprar-llaves.php?status=pending',
];

// PayPal Configuration
$paypal_config = [
    'client_id' => 'YOUR_PAYPAL_CLIENT_ID',
    'client_secret' => 'YOUR_PAYPAL_CLIENT_SECRET',
    'sandbox' => true,  // Set to false in production
    'return_url' => '/gacha/api/paypal.php?action=capture',
    'cancel_url' => '/gacha/comprar-llaves.php?status=cancelled',
];

// Monetag Ads Configuration
$monetag_config = [
    'zone_id' => '205584',
    'ads_per_key' => 4,           // Number of ads to earn 1 key
    'max_daily_ads' => 20,        // Maximum ads per day (= 5 keys max)
    'cooldown_seconds' => 30,     // Minimum seconds between ad views
];

// Get base URL for redirects
function getBaseUrl()
{
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    return $protocol . '://' . $host;
}

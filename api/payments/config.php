<?php
// Configuración de DlocalGo
return [
    'dlocalgo' => [
        'api_key' => 'RTwsitOcVAFCktlYFnRDmQCOxyJBRLdb', // Tu API key de DlocalGo
        'secret_key' => '24l8GNzspKk0rvyzX8u5jz49MMThEMOy3bMrf2kJ', // Secret key para validar webhooks
        'api_url' => 'https://api.dlocalgo.com/v1/payments',
        'environment' => 'production', // 'sandbox' o 'production'
    ],
    
    'packages' => [
        'basic' => [
            'keys' => 2,
            'price' => 1.00,
            'currency' => 'USD',
            'name' => 'Paquete Básico'
        ],
        'premium' => [
            'keys' => 10,
            'price' => 5.00,
            'currency' => 'USD',
            'name' => 'Paquete Premium'
        ],
        'deluxe' => [
            'keys' => 25,
            'price' => 10.00,
            'currency' => 'USD',
            'name' => 'Paquete Deluxe'
        ]
    ],
    
    'urls' => [
        'webhook' => 'https://einherjarblitz.com/api/payments/webhook.php',
        'success' => 'https://einherjarblitz.com/gacha/?payment=success',
        'failure' => 'https://einherjarblitz.com/gacha/?payment=failed'
    ]
];
?>

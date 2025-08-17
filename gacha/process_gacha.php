<?php
session_start();
header('Content-Type: application/json');

try {
    // Verificar si el usuario está logueado
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
        echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
        exit;
    }

    $user_id = $_SESSION['user_id'];
    $username = $_SESSION['username'];

    // Obtener datos POST
    $input = json_decode(file_get_contents('php://input'), true);
    $chest_type = $input['chest_type'] ?? '';

    if (empty($chest_type)) {
        echo json_encode(['success' => false, 'message' => 'Tipo de cofre no especificado']);
        exit;
    }

    // Verificar si el cofre de terrenos está bloqueado
    if ($chest_type === 'terrains') {
        echo json_encode([
            'success' => false, 
            'message' => 'Los cofres de terrenos están temporalmente deshabilitados. ¡Próximamente disponibles!'
        ]);
        exit;
    }

    // Incluir la base de datos
    require_once '../includes/Database.php';

    // Configuración de cofres
    $chest_config = [
        'uma_musume' => [
            'name' => 'Cofre Uma Musume',
            'cost' => 1,
            'rewards' => [
                // Comunes (peso 40) - Caballos base
                ['Haru Urara', 'invocation', 1, 40],
                ['Mejiro Ryan', 'invocation', 1, 40],
                ['Seiun Sky', 'invocation', 1, 40],
                ['Hishi Amazon', 'invocation', 1, 40],
                ['Sweep Tosho', 'invocation', 1, 40],

                // Raros (peso 25) - Caballos conocidos
                ['Rice Shower', 'invocation', 1, 25],
                ['Fine Motion', 'invocation', 1, 25],
                ['Mejiro Ardan', 'invocation', 1, 25],
                ['Inari One', 'invocation', 1, 25],
                ['Meisho Tebesa', 'invocation', 1, 25],

                // Épicos (peso 15) - Caballos populares
                ['Gold City', 'invocation', 1, 15],
                ['Super Creek', 'invocation', 1, 15],
                ['Agnes Tachyon', 'invocation', 1, 15],
                ['Manhattan Cafe', 'invocation', 1, 15],
                ['Air Groove', 'invocation', 1, 15],
                
                // Legendarios (peso 10) - Caballos icónicos
                ['Special Week', 'invocation', 1, 10],
                ['Silence Suzuka', 'invocation', 1, 10],
                ['Tokai Teio', 'invocation', 1, 10],
                ['Vodka', 'invocation', 1, 10],
                ['Daiwa Scarlet', 'invocation', 1, 10],

                // Súper Raros (peso 5) - Caballos legendarios
                ['Oguri Cap', 'invocation', 1, 5],
                ['Symboli Rudolf', 'invocation', 1, 5],
                ['Mejiro McQueen', 'invocation', 1, 5],
                ['Grass Wonder', 'invocation', 1, 5],
                ['Maruzensky', 'invocation', 1, 5],
                
                // Ultra Raros (peso 3) - Élite absoluta
                ['Narita Brian', 'invocation', 1, 3],
                ['Tamamo Cross', 'invocation', 1, 3],
                ['Eishin Flash', 'invocation', 1, 3],
                
                // Míticos (peso 2) - Los más raros
                ['Kitasan Black', 'invocation', 1, 2],
                ['Satono Diamond', 'invocation', 1, 2],
                ['Duramente', 'invocation', 1, 2],
                ['Sakura Chiyono O', 'invocation', 1, 2],
                
                // Objeto único mítico
                ['Zanahoria Dorada', 'special', 1, 1]
            ]
        ],
        'warhammer' => [
            'name' => 'Cofre Warhammer 40K',
            'cost' => 5,
            'rewards' => [
                // Comunes (peso 35) - Lugares y Primarca
                ['Ojo del Terror', 'invocation', 1, 35],
                ['Roboute Guilliman', 'invocation', 1, 35],
                ['Sanguinius', 'invocation', 1, 35],

                // Raros (peso 25) - Objetos poderosos
                ['Espada de los Mil Nombres', 'weapon', 1, 25],
                ['Drach\'nyen', 'weapon', 1, 25],
                
                // Épicos (peso 20) - Artefactos supremos
                ['Trono Dorado', 'artifact', 1, 20],
                
                // Legendarios (peso 10) - Dioses del Caos
                ['Khorne', 'invocation', 1, 10],
                ['Tzeentch', 'invocation', 1, 10],
                ['Nurgle', 'invocation', 1, 10],
                ['Slaanesh', 'invocation', 1, 10],

                // Míticos (peso 5) - Seres supremos
                ['Horus Lupercal', 'invocation', 1, 5],
                ['El Emperador de la Humanidad', 'invocation', 1, 5],

                // Ultra Mítico (peso 5) - Terreno único
                ['Terra', 'terrain', 1, 5]
            ]
        ],
        'terrains' => [
            'name' => 'Cofre de Terrenos',
            'cost' => 25,
            'rewards' => [
                ['Mineral de Hierro', 'resource', 10, 30],
                ['Mineral de Plata', 'resource', 5, 25],
                ['Mineral de Oro', 'resource', 3, 20],
                ['Cristal Elemental', 'crystal', 1, 15],
                ['Gema Rara', 'gem', 1, 7],
                ['Diamante Perfecto', 'diamond', 1, 2],
                ['Terreno Legendario', 'terrain', 1, 1]
            ]
        ]
    ];

    if (!isset($chest_config[$chest_type])) {
        echo json_encode(['success' => false, 'message' => 'Tipo de cofre inválido']);
        exit;
    }

    $config = $chest_config[$chest_type];

    $database = Database::getInstance();
    $conn = $database->getConnection();
    
    // Verificar llaves del usuario
    $stmt = $conn->prepare("SELECT llaves FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $user_data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user_data) {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        exit;
    }
    
    $current_keys = $user_data['llaves'];
    
    if ($current_keys < $config['cost']) {
        echo json_encode([
            'success' => false, 
            'message' => "Llaves insuficientes. Necesitas {$config['cost']} llaves, tienes {$current_keys}"
        ]);
        exit;
    }
    
    // Iniciar transacción
    $conn->beginTransaction();
    
    // Descontar llaves
    $stmt = $conn->prepare("UPDATE usuarios SET llaves = llaves - ? WHERE id = ?");
    $stmt->execute([$config['cost'], $user_id]);
    
    // Calcular recompensa basada en probabilidades
    $reward = calculateReward($config['rewards']);
    
    // Registrar recompensa en la base de datos
    $stmt = $conn->prepare("
        INSERT INTO recompensas_usuario (user_id, username, recompensa_obtenida, tipo_recompensa, valor, fecha_obtencion) 
        VALUES (?, ?, ?, ?, ?, NOW())
    ");
    $stmt->execute([
        $user_id, 
        $username, 
        $reward['name'], 
        $reward['type'], 
        $reward['value']
    ]);
    
    // Registrar transacción
    $stmt = $conn->prepare("
        INSERT INTO transacciones_einherjer (user_id, username, tipo, cantidad, descripcion) 
        VALUES (?, ?, 'compra', ?, ?)
    ");
    $stmt->execute([
        $user_id, 
        $username, 
        $config['cost'], 
        "Apertura de {$config['name']}"
    ]);
    
    // Confirmar transacción
    $conn->commit();
    
    // Determinar rareza basada en la probabilidad
    $rarity = determineRarity($reward['weight']);
    
    echo json_encode([
        'success' => true,
        'reward' => [
            'name' => $reward['name'],
            'type' => $reward['type'],
            'value' => $reward['value'],
            'rarity' => $rarity,
            'chest_type' => $chest_type
        ],
        'remaining_keys' => $current_keys - $config['cost']
    ]);
    
} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
}

function calculateReward($rewards) {
    // Calcular peso total
    $total_weight = array_sum(array_column($rewards, 3));
    
    // Generar número aleatorio
    $random = mt_rand(1, $total_weight);
    
    // Encontrar recompensa basada en peso
    $current_weight = 0;
    foreach ($rewards as $reward) {
        $current_weight += $reward[3];
        if ($random <= $current_weight) {
            return [
                'name' => $reward[0],
                'type' => $reward[1],
                'value' => $reward[2],
                'weight' => $reward[3]
            ];
        }
    }
    
    // Fallback (no debería ocurrir)
    return [
        'name' => $rewards[0][0],
        'type' => $rewards[0][1],
        'value' => $rewards[0][2],
        'weight' => $rewards[0][3]
    ];
}

function determineRarity($weight) {
    if ($weight >= 30) return 'common';
    if ($weight >= 15) return 'rare';
    if ($weight >= 5) return 'epic';
    if ($weight >= 2) return 'legendary';
    return 'mythical';
}
?>

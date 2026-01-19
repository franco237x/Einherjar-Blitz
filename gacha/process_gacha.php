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

    // Funciones auxiliares para verificar terrenos únicos
    function getAvailableTerrains($conn)
    {
        // Lista completa de terrenos únicos disponibles
        $all_terrains = [
            'Hipódromo Valhalla (Uma Musume)',
            'Krypton (DC Comics)',
            'Chaldea (Fate)',
            'Skypeia (One Piece)',
            'Academia de Héroes (Boku No Hero)',
            'Negocio Devil May Cry (DMC)',
            'Atlantis (DC Comics)',
            'Torre de los Vengadores (Marvel)',
            'Fundación SCP',
            'Extensión de Terreno',
            'Dad Key',
            'Hallownest (Hollow Knight)',
            'Apokolips (DC Comics)',
        ];

        // Obtener terrenos ya reclamados
        $stmt = $conn->prepare("
            SELECT DISTINCT recompensa_obtenida 
            FROM recompensas_usuario 
            WHERE tipo_recompensa = 'terrain' OR tipo_recompensa = 'special'
            UNION
            SELECT DISTINCT recompensa_obtenida 
            FROM recompensas_eliminadas 
            WHERE tipo_recompensa = 'terrain' OR tipo_recompensa = 'special'
        ");
        $stmt->execute();
        $claimed_terrains = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // Retornar solo terrenos disponibles
        return array_diff($all_terrains, $claimed_terrains);
    }

    function isTerrainAvailable($terrain_name, $available_terrains)
    {
        return in_array($terrain_name, $available_terrains);
    }

    // Incluir la base de datos
    require_once '../includes/Database.php';

    // Configuración de cofres
    $chest_config = [
        'terrains' => [
            'name' => 'Cofre de Terrenos',
            'cost' => 25,
            'rewards' => [
                // Solo terrenos únicos - se asignarán dinámicamente desde la lista específica
                ['Terreno Único', 'terrain', 1, 100] // 100% probabilidad de terreno
            ]
        ],
        'elden_souls' => [
            'name' => 'Cofre Elden Ring/Dark Souls',
            'cost' => 5,
            'rewards' => [
                // Elden Ring - Invocaciones
                ['Invocación: Godrick', 'invocation', 1, 10],
                ['Invocación: Radahn', 'invocation', 1, 10],
                ['Invocación: Radagon', 'invocation', 1, 9],
                ['Invocación: Maliketh', 'invocation', 1, 7],
                ['Invocación: Malenia', 'invocation', 1, 3],
                // Elden Ring - Armas
                ['Arma: Cetro del Devorador', 'weapon', 1, 15],
                ['Arma: Espada magna de la hoja injertada', 'weapon', 1, 12],
                ['Arma: Espada Magna de la Orden Dorada', 'weapon', 1, 10],
                // Dark Souls - Invocaciones
                ['Invocación: Ornstein y Smough', 'invocation', 1, 7],
                ['Invocación: Gwyn', 'invocation', 1, 5],
                ['Invocación: Artorias', 'invocation', 1, 4],
                ['Invocación: Rey sin Nombre', 'invocation', 1, 3],
                ['Invocación: Alma de Cenizas', 'invocation', 1, 2],
                // Dark Souls - Armas
                ['Arma: Espadón de Artorias', 'weapon', 1, 5],
                ['Arma: Arco Luna Oscura', 'weapon', 1, 7],
                // Dark Souls - Exclusivos
                ['Poder: Primera Llama', 'special', 1, 1]
            ]
        ],

    ];

    if (!isset($chest_config[$chest_type])) {
        echo json_encode(['success' => false, 'message' => 'Tipo de cofre inválido']);
        exit;
    }

    $config = $chest_config[$chest_type];

    $database = Database::getInstance();
    $conn = $database->getConnection();

    // Variable para terrenos disponibles
    $available_terrains = [];

    // Verificación especial para cofre de terrenos
    if ($chest_type === 'terrains') {
        $available_terrains = getAvailableTerrains($conn);

        if (empty($available_terrains)) {
            echo json_encode([
                'success' => false,
                'message' => 'Cofre Agotado - Todos los terrenos han sido reclamados. Vuelve cuando se agreguen nuevos terrenos.'
            ]);
            exit;
        }
    }

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
        $faltantes = $config['cost'] - $current_keys;
        echo json_encode([
            'success' => false,
            'message' => "¡El cofre está sellado! Te faltan {$faltantes} llave(s) mágica(s) para abrirlo.",
            'keys_needed' => $config['cost'],
            'keys_current' => $current_keys
        ]);
        exit;
    }

    // Iniciar transacción
    $conn->beginTransaction();

    // Descontar llaves
    $stmt = $conn->prepare("UPDATE usuarios SET llaves = llaves - ? WHERE id = ?");
    $stmt->execute([$config['cost'], $user_id]);

    // Calcular recompensa basada en probabilidades
    if ($chest_type === 'terrains') {
        $reward = calculateTerrainReward($config['rewards'], $available_terrains);
    } else {
        $reward = calculateReward($config['rewards']);
    }

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

function calculateTerrainReward($rewards, $available_terrains)
{
    // El cofre de terrenos SIEMPRE da un terreno disponible
    if (empty($available_terrains)) {
        // Esto no debería pasar porque ya se verifica antes, pero por seguridad
        throw new Exception('No hay terrenos disponibles');
    }

    // Definir tipos especiales con mayor rareza
    $special_items = ['Extensión de Terreno', 'Dad Key'];
    $terrain_list = array_diff($available_terrains, $special_items);
    $special_available = array_intersect($available_terrains, $special_items);

    // 20% probabilidad de objeto especial si están disponibles
    $give_special = mt_rand(1, 100) <= 20;

    if ($give_special && !empty($special_available)) {
        // Dar objeto especial
        $selected_item = $special_available[array_rand($special_available)];
        $type = 'special';
        $weight = 5; // Peso para objetos especiales (legendario)
    } else if (!empty($terrain_list)) {
        // Dar terreno normal
        $selected_item = $terrain_list[array_rand($terrain_list)];
        $type = 'terrain';
        $weight = 10; // Peso para terrenos normales
    } else if (!empty($special_available)) {
        // Solo quedan objetos especiales
        $selected_item = $special_available[array_rand($special_available)];
        $type = 'special';
        $weight = 5;
    } else {
        // Esto no debería pasar
        throw new Exception('Error interno: no hay terrenos disponibles');
    }

    return [
        'name' => $selected_item,
        'type' => $type,
        'value' => 1,
        'weight' => $weight
    ];
}

function calculateReward($rewards)
{
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

function determineRarity($weight)
{
    if ($weight >= 30)
        return 'common';
    if ($weight >= 15)
        return 'rare';
    if ($weight >= 5)
        return 'epic';
    if ($weight >= 2)
        return 'legendary';
    return 'mythical';
}
?>
<?php
/**
 * API para actualizar perfil de usuario
 * Actualiza: perfil_imagen y frase
 */

require_once '../includes/Database.php';

header('Content-Type: application/json');

$auth = new AuthController();

if (!$auth->isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

$userData = $auth->getUserData();
$db = Database::getInstance();

// Solo aceptar POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit();
}

// Obtener datos del JSON
$input = json_decode(file_get_contents('php://input'), true);

$action = $input['action'] ?? '';

try {
    switch ($action) {
        case 'update_avatar':
            updateAvatar($db, $userData['id'], $input);
            break;
        
        case 'update_phrase':
            updatePhrase($db, $userData['id'], $input);
            break;
        
        case 'update_profile':
            updateFullProfile($db, $userData['id'], $input);
            break;
        
        default:
            throw new Exception('Acción no válida');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

/**
 * Actualizar solo el avatar
 */
function updateAvatar($db, $userId, $data) {
    $avatar = $data['avatar'] ?? '';
    
    // Lista de avatares disponibles (imágenes de personajes)
    $availableAvatars = [
        'default.jpg',
        'nathan.png',
        'ozen.jpg',
        'raiden.jpeg',
        'shuna.jpg',
        'xair.png',
        'yozora.jpeg',
        'zack.jpg',
        'kuaidul.jpg'
    ];
    
    if (!in_array($avatar, $availableAvatars)) {
        throw new Exception('Avatar no válido');
    }
    
    $stmt = $db->prepare("UPDATE usuarios SET perfil_imagen = ? WHERE id = ?");
    $stmt->execute([$avatar, $userId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Avatar actualizado correctamente',
        'avatar' => $avatar
    ]);
}

/**
 * Actualizar solo la frase
 */
function updatePhrase($db, $userId, $data) {
    $phrase = trim($data['phrase'] ?? '');
    
    // Validar longitud
    if (strlen($phrase) > 100) {
        throw new Exception('La frase no puede tener más de 100 caracteres');
    }
    
    if (empty($phrase)) {
        $phrase = 'Guerrero de Einherjer';
    }
    
    $stmt = $db->prepare("UPDATE usuarios SET frase = ? WHERE id = ?");
    $stmt->execute([$phrase, $userId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Frase actualizada correctamente',
        'phrase' => $phrase
    ]);
}

/**
 * Actualizar perfil completo
 */
function updateFullProfile($db, $userId, $data) {
    $avatar = $data['avatar'] ?? '';
    $phrase = trim($data['phrase'] ?? '');
    
    // Validar avatar
    $availableAvatars = [
        'default.jpg',
        'nathan.png',
        'ozen.jpg',
        'raiden.jpeg',
        'shuna.jpg',
        'xair.png',
        'yozora.jpeg',
        'zack.jpg',
        'kuaidul.jpg'
    ];
    
    if (!in_array($avatar, $availableAvatars)) {
        throw new Exception('Avatar no válido');
    }
    
    // Validar frase
    if (strlen($phrase) > 100) {
        throw new Exception('La frase no puede tener más de 100 caracteres');
    }
    
    if (empty($phrase)) {
        $phrase = 'Guerrero de Einherjer';
    }
    
    $stmt = $db->prepare("UPDATE usuarios SET perfil_imagen = ?, frase = ? WHERE id = ?");
    $stmt->execute([$avatar, $phrase, $userId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Perfil actualizado correctamente',
        'avatar' => $avatar,
        'phrase' => $phrase
    ]);
}

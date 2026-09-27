<?php
/**
 * Google OAuth Authentication API
 * Einherjer Blitz 3.0
 */

require_once '../includes/Database.php';
require_once '../includes/Security.php';

header('Content-Type: application/json');

$security = Security::getInstance();
$auth = new AuthController();

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit();
}

// Validate CSRF token
$csrfToken = $input['csrf_token'] ?? '';
if (!$security->validateCSRFToken($csrfToken)) {
    echo json_encode(['success' => false, 'message' => 'Token de seguridad inválido']);
    exit();
}

// Get the Google credential (JWT token)
$credential = $input['credential'] ?? '';

if (empty($credential)) {
    echo json_encode(['success' => false, 'message' => 'Credencial de Google requerida']);
    exit();
}

try {
    // Decode the JWT token (Google ID Token)
    // The token has three parts: header.payload.signature
    $parts = explode('.', $credential);

    if (count($parts) !== 3) {
        throw new Exception('Token inválido');
    }

    // Decode the payload (second part)
    $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);

    if (!$payload) {
        throw new Exception('No se pudo decodificar el token');
    }

    // Verify token expiration
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        throw new Exception('Token expirado');
    }

    // Extract user info from Google token
    $googleId = $payload['sub'] ?? null;
    $email = $payload['email'] ?? null;
    $emailVerified = $payload['email_verified'] ?? false;
    $name = $payload['name'] ?? '';
    $picture = $payload['picture'] ?? '';
    $givenName = $payload['given_name'] ?? '';

    if (!$googleId || !$email) {
        throw new Exception('Información de usuario incompleta');
    }

    // TODO: In production, verify the token signature with Google's public keys
    // For now, we'll trust the token structure
    // See: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

    // Check if user exists by Google ID or email
    $db = Database::getInstance()->getConnection();

    // First, try to find user by google_id
    $stmt = $db->prepare("SELECT * FROM users WHERE google_id = ? LIMIT 1");
    $stmt->execute([$googleId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Try to find by email
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // Link existing account with Google
            $updateStmt = $db->prepare("UPDATE users SET google_id = ? WHERE id = ?");
            $updateStmt->execute([$googleId, $user['id']]);
        }
    }

    if (!$user) {
        // Create new user with Google account
        $username = preg_replace('/[^a-zA-Z0-9_]/', '', $givenName ?: explode('@', $email)[0]);

        // Ensure username is unique
        $baseUsername = $username ?: 'guerrero';
        $counter = 0;

        do {
            $checkUsername = $counter > 0 ? $baseUsername . $counter : $baseUsername;
            $stmt = $db->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
            $stmt->execute([$checkUsername]);
            $exists = $stmt->fetch();
            $counter++;
        } while ($exists && $counter < 100);

        $username = $checkUsername;

        // Generate unique ID for the user
        $uniqueId = strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));

        // Create the user
        $insertStmt = $db->prepare("
            INSERT INTO users (username, email, google_id, unique_id, password, perfil_imagen, frase, nivel, experiencia, copas, victorias, derrotas, llaves, recompensas, horas_jugadas, rango, created_at) 
            VALUES (?, ?, ?, ?, '', 'default.jpg', 'Guerrero de Einherjer', 1, 0, 0, 0, 0, 10, 500, 0, 'Novato', NOW())
        ");

        $insertStmt->execute([$username, $email, $googleId, $uniqueId]);

        // Fetch the newly created user
        $stmt = $db->prepare("SELECT * FROM users WHERE google_id = ? LIMIT 1");
        $stmt->execute([$googleId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            throw new Exception('Error al crear usuario');
        }
    }

    // Log the user in
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['authenticated'] = true;
    $_SESSION['login_time'] = time();

    // Reset rate limiting
    $security->resetAttempts('login');

    echo json_encode([
        'success' => true,
        'message' => '¡Bienvenido, ' . htmlspecialchars($user['username']) . '!',
        'redirect' => 'dashboard.php',
        'user' => [
            'username' => $user['username'],
            'email' => $user['email']
        ]
    ]);

} catch (Exception $e) {
    error_log('Google Auth Error: ' . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'Error de autenticación: ' . $e->getMessage()
    ]);
}

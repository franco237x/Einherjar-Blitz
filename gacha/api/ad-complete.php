<?php
/**
 * Ad Completion API
 * Einherjer Blitz 3.0 - Gacha System
 * 
 * Tracks ad views and grants keys (4 ads = 1 key)
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

// Get today's date
$today = date('Y-m-d');

// Check current ad views for today
$stmt = $conn->prepare("SELECT * FROM ad_views WHERE user_id = ? AND view_date = ?");
$stmt->execute([$user_id, $today]);
$adData = $stmt->fetch(PDO::FETCH_ASSOC);

$viewsToday = $adData ? $adData['views_count'] : 0;
$keysEarnedToday = $adData ? $adData['keys_earned'] : 0;

// Check daily limit
if ($viewsToday >= $monetag_config['max_daily_ads']) {
    echo json_encode([
        'success' => false,
        'message' => 'Has alcanzado el límite diario de anuncios',
        'views_today' => $viewsToday,
        'keys_earned_today' => $keysEarnedToday
    ]);
    exit;
}

// Check cooldown (anti-abuse measure)
if ($adData && $adData['last_view_at']) {
    $lastView = strtotime($adData['last_view_at']);
    $now = time();

    if (($now - $lastView) < $monetag_config['cooldown_seconds']) {
        $remaining = $monetag_config['cooldown_seconds'] - ($now - $lastView);
        echo json_encode([
            'success' => false,
            'message' => "Espera {$remaining} segundos antes de ver otro anuncio",
            'cooldown_remaining' => $remaining
        ]);
        exit;
    }
}

// Start transaction
$conn->beginTransaction();

try {
    // Increment view count
    $newViewsToday = $viewsToday + 1;
    $keyEarned = false;
    $newKeysEarnedToday = $keysEarnedToday;

    // Check if user earned a key (every 4 ads)
    if ($newViewsToday % $monetag_config['ads_per_key'] === 0) {
        $keyEarned = true;
        $newKeysEarnedToday++;

        // Add key to user
        $stmt = $conn->prepare("UPDATE usuarios SET llaves = llaves + 1 WHERE id = ?");
        $stmt->execute([$user_id]);

        // Log transaction
        $stmt = $conn->prepare("
            INSERT INTO transacciones_einherjer (user_id, username, tipo, cantidad, descripcion)
            VALUES (?, ?, 'deposito', 1, 'Llave gratuita por ver anuncios')
        ");
        $stmt->execute([$user_id, $username]);
    }

    // Update or insert ad_views record
    if ($adData) {
        $stmt = $conn->prepare("
            UPDATE ad_views 
            SET views_count = ?, keys_earned = ?, last_view_at = NOW()
            WHERE user_id = ? AND view_date = ?
        ");
        $stmt->execute([$newViewsToday, $newKeysEarnedToday, $user_id, $today]);
    } else {
        $stmt = $conn->prepare("
            INSERT INTO ad_views (user_id, view_date, views_count, keys_earned, last_view_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$user_id, $today, $newViewsToday, $newKeysEarnedToday]);
    }

    $conn->commit();

    echo json_encode([
        'success' => true,
        'views_today' => $newViewsToday,
        'keys_earned_today' => $newKeysEarnedToday,
        'key_earned' => $keyEarned,
        'progress' => $newViewsToday % $monetag_config['ads_per_key'],
        'ads_remaining' => $monetag_config['max_daily_ads'] - $newViewsToday
    ]);

} catch (Exception $e) {
    $conn->rollBack();
    error_log('Ad Complete Error: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error al registrar el anuncio'
    ]);
}

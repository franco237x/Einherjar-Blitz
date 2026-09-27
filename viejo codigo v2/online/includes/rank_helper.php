<?php
require_once '../includes/Database.php';

$auth = new AuthController();

// Verificar autenticación
if (!$auth->isAuthenticated()) {
    header('Location: ../index.php');
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    header('Location: ../index.php');
    exit();
}

// Función para determinar el rango correcto basado en copas
function getRankByCups($copas) {
    if ($copas >= 12000) return 'Gran Maestro';
    if ($copas >= 8000) return 'Diamante';
    if ($copas >= 5000) return 'Platino';
    if ($copas >= 2500) return 'Oro';
    if ($copas >= 1000) return 'Plata';
    return 'Bronce';
}

// Actualizar rango automáticamente si es necesario
$correctRank = getRankByCups($userData['copas']);
if ($correctRank !== $userData['rango']) {
    try {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("UPDATE usuarios SET rango = ? WHERE id = ?");
        $stmt->execute([$correctRank, $userData['id']]);
        $userData['rango'] = $correctRank;
    } catch (Exception $e) {
        error_log("Error updating rank: " . $e->getMessage());
    }
}

// Calcular progreso del rango
function calculateRankProgress($copas, $rango) {
    $rankThresholds = [
        'Bronce' => ['min' => 0, 'max' => 1000],
        'Plata' => ['min' => 1000, 'max' => 2500],
        'Oro' => ['min' => 2500, 'max' => 5000],
        'Platino' => ['min' => 5000, 'max' => 8000],
        'Diamante' => ['min' => 8000, 'max' => 12000],
        'Gran Maestro' => ['min' => 12000, 'max' => 20000]
    ];
    
    $currentRank = $rankThresholds[$rango] ?? $rankThresholds['Bronce'];
    $progress = (($copas - $currentRank['min']) / ($currentRank['max'] - $currentRank['min'])) * 100;
    $progress = max(0, min(100, $progress));
    
    return [
        'progress' => $progress,
        'current' => $copas - $currentRank['min'],
        'needed' => $currentRank['max'] - $copas,
        'total' => $currentRank['max'] - $currentRank['min']
    ];
}

$rankProgress = calculateRankProgress($userData['copas'], $userData['rango']);

// Obtener imagen del rango
function getRankImage($rango) {
    $rankImages = [
        'Bronce' => 'bronce.png',
        'Plata' => 'plata.png',
        'Oro' => 'oro.png',
        'Platino' => 'platino.png',
        'Diamante' => 'diamante.png',
        'Gran Maestro' => 'granmaestro.png'
    ];
    return $rankImages[$rango] ?? 'bronce.png';
}

$rankImage = getRankImage($userData['rango']);
?>

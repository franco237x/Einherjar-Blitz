<?php
require_once '../includes/Database.php';

header('Content-Type: text/html; charset=utf-8');

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    http_response_code(401);
    echo '<div class="alert alert-danger">Debes iniciar sesión para ver el historial.</div>';
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    http_response_code(401);
    echo '<div class="alert alert-danger">Sesión inválida.</div>';
    exit();
}

try {
    $db = Database::getInstance();
    $stmt = $db->prepare("SELECT recompensa_obtenida, tipo_recompensa, valor, fecha_obtencion FROM recompensas_usuario WHERE user_id = ? AND tipo_recompensa = 'tienda' ORDER BY fecha_obtencion DESC LIMIT 20");
    $stmt->execute([$userData['id']]);
    $historial = $stmt->fetchAll();

    if (!$historial) {
        echo '<div class="historial-lista"><div class="historial-item"><div><strong>Aún no hay compras</strong><br><small>Visita la tienda para adquirir tu primer artículo.</small></div><div><span>-</span></div></div></div>';
        exit();
    }

    echo '<div class="historial-lista">';
    foreach ($historial as $item) {
        $fecha = date('d/m/Y H:i', strtotime($item['fecha_obtencion']));
        $valor = (int) $item['valor'];
        $isChampions = $valor === 1000;
        $clase = $isChampions ? 'historial-item champions' : 'historial-item';
        echo '<div class="' . $clase . '">';
        echo '<div><strong>' . htmlspecialchars($item['recompensa_obtenida']) . '</strong><br><small>' . htmlspecialchars($fecha) . '</small></div>';
        echo '<div><span>' . number_format($valor) . ' Esferas</span></div>';
        echo '</div>';
    }
    echo '</div>';
} catch (Exception $e) {
    http_response_code(500);
    echo '<div class="alert alert-danger">No se pudo cargar el historial.</div>';
}

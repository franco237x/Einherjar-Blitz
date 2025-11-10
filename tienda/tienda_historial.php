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
    
    // Obtener historial de tickets de tienda (nuevo sistema)
    $stmt = $db->prepare("
        SELECT 
            item_name as recompensa_obtenida,
            'tienda' as tipo_recompensa,
            precio_pagado as valor,
            created_at as fecha_obtencion,
            claimed
        FROM tienda_tickets 
        WHERE user_id = ? 
        AND ticket_type = 'tienda'
        ORDER BY created_at DESC 
        LIMIT 20
    ");
    $stmt->execute([$userData['id']]);
    $historial = $stmt->fetchAll();

    if (!$historial || count($historial) === 0) {
        echo '<div class="historial-lista"><div class="historial-item"><div><strong>Aún no hay compras</strong><br><small>Visita la tienda para adquirir tu primer artículo.</small></div><div><span>-</span></div></div></div>';
        exit();
    }

    echo '<div class="historial-lista">';
    foreach ($historial as $item) {
        $fecha = date('d/m/Y H:i', strtotime($item['fecha_obtencion']));
        $valor = (int) $item['valor'];
        $claimed = (int) $item['claimed'];
        $isChampions = $valor >= 1000;
        $clase = $isChampions ? 'historial-item champions' : 'historial-item';
        
        echo '<div class="' . $clase . '">';
        echo '<div>';
        echo '<strong>' . htmlspecialchars($item['recompensa_obtenida']) . '</strong>';
        if ($claimed) {
            echo ' <span style="color: #4bc0c0; font-size: 0.85rem;"><i class="fas fa-check-circle"></i> Reclamado</span>';
        } else {
            echo ' <span style="color: #ffc107; font-size: 0.85rem;"><i class="fas fa-clock"></i> Pendiente</span>';
        }
        echo '<br><small>' . htmlspecialchars($fecha) . '</small>';
        echo '</div>';
        echo '<div><span>' . number_format($valor) . ' Esferas</span></div>';
        echo '</div>';
    }
    echo '</div>';
} catch (Exception $e) {
    http_response_code(500);
    echo '<div class="alert alert-danger">No se pudo cargar el historial: ' . htmlspecialchars($e->getMessage()) . '</div>';
}

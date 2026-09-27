<?php
/**
 * Generate Report - Gacha System
 * Creates PDF/TXT reports of rewards
 */

session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: ../index.php');
    exit;
}

require_once '../includes/Database.php';

$format = $_POST['format'] ?? 'txt';
$user_id = $_SESSION['user_id'];
$username = $_SESSION['username'] ?? 'Usuario';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();

    // Get rewards
    $stmt = $conn->prepare("SELECT * FROM recompensas_usuario WHERE user_id = ? ORDER BY fecha_obtencion DESC");
    $stmt->execute([$user_id]);
    $rewards = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($rewards)) {
        echo "No hay recompensas para exportar.";
        exit;
    }

    $date = date('Y-m-d H:i:s');
    $filename = "recompensas_{$username}_" . date('Ymd_His');

    if ($format === 'txt') {
        header('Content-Type: text/plain; charset=utf-8');
        header("Content-Disposition: attachment; filename=\"{$filename}.txt\"");

        echo "═══════════════════════════════════════════════════════════════\n";
        echo "              REPORTE DE RECOMPENSAS - EINHERJER BLITZ 3.0\n";
        echo "═══════════════════════════════════════════════════════════════\n\n";
        echo "Usuario: {$username}\n";
        echo "Fecha de generación: {$date}\n";
        echo "Total de recompensas: " . count($rewards) . "\n\n";
        echo "───────────────────────────────────────────────────────────────\n\n";

        foreach ($rewards as $index => $reward) {
            $num = $index + 1;
            echo "#{$num}\n";
            echo "  Recompensa: {$reward['recompensa_obtenida']}\n";
            echo "  Tipo: " . ucfirst($reward['tipo_recompensa']) . "\n";
            echo "  Cantidad: {$reward['valor']}\n";
            echo "  Fecha: {$reward['fecha_obtencion']}\n\n";
        }

        echo "───────────────────────────────────────────────────────────────\n";
        echo "Generado automáticamente por Einherjer Blitz 3.0\n";
        echo "© 2026 - Todos los derechos reservados\n";

    } else {
        // PDF format - simple HTML to PDF
        header('Content-Type: text/html; charset=utf-8');

        echo "<!DOCTYPE html><html><head><title>Recompensas - {$username}</title>";
        echo "<style>body{font-family:Arial,sans-serif;padding:20px;background:#1a1a1a;color:#fff;}";
        echo "h1{color:#c9aa71;}.reward{background:#252525;padding:15px;margin:10px 0;border-radius:8px;border-left:4px solid #c9aa71;}";
        echo ".label{color:#888;}.value{color:#fff;font-weight:bold;}</style></head><body>";
        echo "<h1>📜 Reporte de Recompensas</h1>";
        echo "<p>Usuario: <strong>{$username}</strong> | Fecha: {$date}</p>";
        echo "<p>Total: <strong>" . count($rewards) . "</strong> recompensas</p><hr>";

        foreach ($rewards as $reward) {
            echo "<div class='reward'>";
            echo "<div class='value'>{$reward['recompensa_obtenida']}</div>";
            echo "<div class='label'>Tipo: " . ucfirst($reward['tipo_recompensa']) . " | Cantidad: {$reward['valor']}</div>";
            echo "<div class='label'>Obtenido: {$reward['fecha_obtencion']}</div>";
            echo "</div>";
        }

        echo "<hr><p style='text-align:center;color:#666;'>© 2026 Einherjer Blitz 3.0</p>";
        echo "</body></html>";
    }

} catch (Exception $e) {
    echo "Error al generar reporte: " . $e->getMessage();
}
?>
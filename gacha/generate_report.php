<?php
session_start();
require_once '../includes/Database.php';

// Verificar autenticación
if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
    die('No autorizado');
}

$user_id = $_SESSION['user_id'];
$username = $_SESSION['username'];

// Obtener formato y acción
$format = $_POST['format'] ?? 'txt';
$action = $_POST['action'] ?? 'download';
$auto_clean = $_POST['auto_clean'] ?? 'false';

try {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    
    // Obtener datos del usuario
    $stmt = $conn->prepare("SELECT * FROM usuarios WHERE id = ?");
    $stmt->execute([$user_id]);
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Obtener recompensas
    $stmt = $conn->prepare("
        SELECT * FROM recompensas_usuario 
        WHERE user_id = ? 
        ORDER BY fecha_obtencion DESC
    ");
    $stmt->execute([$user_id]);
    $recompensas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($recompensas)) {
        die('No hay recompensas para generar reporte');
    }
    
    // Agrupar por tipo
    $recompensas_agrupadas = [];
    $totales = [];
    
    foreach ($recompensas as $recompensa) {
        $tipo = $recompensa['tipo_recompensa'];
        if (!isset($recompensas_agrupadas[$tipo])) {
            $recompensas_agrupadas[$tipo] = [];
            $totales[$tipo] = 0;
        }
        $recompensas_agrupadas[$tipo][] = $recompensa;
        $totales[$tipo]++;
    }
    
    if ($format === 'pdf') {
        generatePDF($userData, $recompensas, $recompensas_agrupadas, $totales, $auto_clean);
    } else {
        generateTXT($userData, $recompensas, $recompensas_agrupadas, $totales, $auto_clean);
    }
    
} catch (Exception $e) {
    die('Error: ' . $e->getMessage());
}

function generatePDF($userData, $recompensas, $recompensas_agrupadas, $totales, $auto_clean = 'false') {
    // Intentar usar TCPDF si está disponible
    if (class_exists('TCPDF')) {
        generateTCPDF($userData, $recompensas, $recompensas_agrupadas, $totales, $auto_clean);
    } else {
        // Si no hay TCPDF, generar HTML que se puede convertir a PDF
        generateHTMLPDF($userData, $recompensas, $recompensas_agrupadas, $totales, $auto_clean);
    }
}

function generateHTMLPDF($userData, $recompensas, $recompensas_agrupadas, $totales, $auto_clean = 'false') {
    $filename = "recompensas_" . $userData['username'] . "_" . date('Y-m-d_H-i-s') . ".html";
    
    $html = generateReportHTML($userData, $recompensas, $recompensas_agrupadas, $totales, $auto_clean);
    
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');
    
    echo $html;
}

function generateReportHTML($userData, $recompensas, $recompensas_agrupadas, $totales, $auto_clean = 'false') {
    $html = '<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Recompensas - ' . htmlspecialchars($userData['username']) . '</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #d4af37;
            padding-bottom: 20px;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 30px;
            border-radius: 15px;
        }
        
        .logo {
            font-size: 2.8em;
            background: linear-gradient(45deg, #d4af37, #f4e076);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(212, 175, 55, 0.3);
        }
        
        .subtitle {
            color: #495057;
            font-size: 1.3em;
            font-weight: 500;
        }
        
        .user-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #fff3cd 0%, #fef2c7 100%);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border: 2px solid #d4af37;
            box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #d4af37;
            text-shadow: 0 2px 4px rgba(212, 175, 55, 0.3);
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 1.5em;
            color: #d4af37;
            border-bottom: 2px solid #d4af37;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .reward-item {
            background: #f8f9fa;
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 6px;
            border-left: 4px solid #d4af37;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .reward-name {
            font-weight: bold;
            color: #333;
        }
        
        .reward-type {
            background: #d4af37;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-left: 10px;
        }
        
        .reward-date {
            color: #666;
            font-size: 0.9em;
        }
        
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #d4af37;
            color: #666;
        }
        
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">⚔️ EINHERJER BLITZ 3.0 ⚔️</div>
        <div class="subtitle">Reporte de Recompensas del Sistema Gacha</div>
    </div>
    
    <div class="user-info">
        <h2>Información del Guerrero</h2>
        <p><strong>Usuario:</strong> ' . htmlspecialchars($userData['username']) . '</p>
        <p><strong>Email:</strong> ' . htmlspecialchars($userData['email'] ?? 'No disponible') . '</p>
        <p><strong>Fecha del reporte:</strong> ' . date('d/m/Y H:i:s') . '</p>
        <p><strong>Total de recompensas:</strong> ' . count($recompensas) . '</p>';
        
    if ($auto_clean === 'true') {
        $html .= '<div class="alert alert-success mt-3" style="background: #d4edda; border: 1px solid #c3e6cb; padding: 12px; border-radius: 8px;">
            <strong>🎉 RECOMPENSAS RECLAMADAS OFICIALMENTE</strong><br>
            <small>Estas recompensas han sido eliminadas automáticamente de tu inventario tras la descarga. Se mantiene respaldo en el historial del sistema.</small>
        </div>';
    }
    
    $html .= '</div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-number">' . count($recompensas) . '</div>
            <div>Total Recompensas</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">' . ($totales['invocation'] ?? 0) . '</div>
            <div>Invocaciones</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">' . ($totales['special'] ?? 0) . '</div>
            <div>Especiales</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">' . ($totales['resources'] ?? 0) . '</div>
            <div>Recursos</div>
        </div>
    </div>';
    
    foreach ($recompensas_agrupadas as $tipo => $items) {
        $tipo_nombre = ucfirst($tipo);
        switch ($tipo) {
            case 'invocation': $tipo_nombre = 'Invocaciones'; break;
            case 'special': $tipo_nombre = 'Objetos Especiales'; break;
            case 'resources': $tipo_nombre = 'Recursos'; break;
            case 'weapon': $tipo_nombre = 'Armas'; break;
        }
        
        $html .= '<div class="section">
            <h2 class="section-title">' . $tipo_nombre . ' (' . count($items) . ')</h2>';
        
        foreach ($items as $item) {
            $html .= '<div class="reward-item">
                <div>
                    <span class="reward-name">' . htmlspecialchars($item['recompensa_obtenida']) . '</span>
                    <span class="reward-type">' . ucfirst($item['tipo_recompensa']) . '</span>
                    ' . ($item['valor'] > 1 ? '<small> (x' . $item['valor'] . ')</small>' : '') . '
                </div>
                <div class="reward-date">' . date('d/m/Y H:i', strtotime($item['fecha_obtencion'])) . '</div>
            </div>';
        }
        
        $html .= '</div>';
    }
    
    $html .= '<div class="footer">
        <p>Este reporte fue generado automáticamente por el Sistema Gacha de Einherjer Blitz 3.0</p>
        <p>Fecha de generación: ' . date('d/m/Y H:i:s') . '</p>
        <p>© 2024 Einherjer Blitz 3.0 - Todos los derechos reservados</p>
    </div>
</body>
</html>';
    
    return $html;
}

function generateTXT($userData, $recompensas, $recompensas_agrupadas, $totales, $auto_clean = 'false') {
    $filename = "recompensas_" . $userData['username'] . "_" . date('Y-m-d_H-i-s') . ".txt";
    
    $content = "======================================================\n";
    $content .= "           EINHERJER BLITZ 3.0 - REPORTE DE RECOMPENSAS\n";
    $content .= "======================================================\n\n";
    
    $content .= "INFORMACIÓN DEL GUERRERO:\n";
    $content .= "-" . str_repeat("-", 50) . "\n";
    $content .= "Usuario: " . $userData['username'] . "\n";
    $content .= "Email: " . ($userData['email'] ?? 'No disponible') . "\n";
    $content .= "Fecha del reporte: " . date('d/m/Y H:i:s') . "\n";
    $content .= "Total de recompensas: " . count($recompensas) . "\n";
    
    if ($auto_clean === 'true') {
        $content .= "\n*** RECOMPENSAS RECLAMADAS OFICIALMENTE ***\n";
        $content .= "Las recompensas han sido eliminadas automáticamente del inventario.\n";
        $content .= "Se mantiene respaldo en el historial del sistema.\n";
    }
    
    $content .= "\n";
    
    $content .= "RESUMEN POR CATEGORÍAS:\n";
    $content .= "-" . str_repeat("-", 50) . "\n";
    $content .= sprintf("%-20s %s\n", "Total Recompensas:", count($recompensas));
    $content .= sprintf("%-20s %s\n", "Invocaciones:", $totales['invocation'] ?? 0);
    $content .= sprintf("%-20s %s\n", "Especiales:", $totales['special'] ?? 0);
    $content .= sprintf("%-20s %s\n", "Recursos:", $totales['resources'] ?? 0);
    $content .= sprintf("%-20s %s\n", "Armas:", $totales['weapon'] ?? 0);
    $content .= "\n";
    
    foreach ($recompensas_agrupadas as $tipo => $items) {
        $tipo_nombre = ucfirst($tipo);
        switch ($tipo) {
            case 'invocation': $tipo_nombre = 'INVOCACIONES'; break;
            case 'special': $tipo_nombre = 'OBJETOS ESPECIALES'; break;
            case 'resources': $tipo_nombre = 'RECURSOS'; break;
            case 'weapon': $tipo_nombre = 'ARMAS'; break;
        }
        
        $content .= $tipo_nombre . " (" . count($items) . "):\n";
        $content .= "=" . str_repeat("=", 60) . "\n";
        
        foreach ($items as $index => $item) {
            $content .= sprintf("%3d. %-35s [%s] %s\n",
                $index + 1,
                $item['recompensa_obtenida'],
                ucfirst($item['tipo_recompensa']),
                date('d/m/Y H:i', strtotime($item['fecha_obtencion']))
            );
            
            if ($item['valor'] > 1) {
                $content .= "     Cantidad: " . $item['valor'] . "\n";
            }
        }
        $content .= "\n";
    }
    
    $content .= "\n" . str_repeat("=", 60) . "\n";
    $content .= "RECOMPENSAS DETALLADAS (Orden cronológico):\n";
    $content .= str_repeat("=", 60) . "\n\n";
    
    foreach ($recompensas as $index => $recompensa) {
        $content .= sprintf("%3d. %s\n", $index + 1, $recompensa['recompensa_obtenida']);
        $content .= "     Tipo: " . ucfirst($recompensa['tipo_recompensa']) . "\n";
        if ($recompensa['valor'] > 1) {
            $content .= "     Cantidad: " . $recompensa['valor'] . "\n";
        }
        $content .= "     Fecha: " . date('d/m/Y H:i:s', strtotime($recompensa['fecha_obtencion'])) . "\n";
        $content .= "     " . str_repeat("-", 50) . "\n";
    }
    
    $content .= "\n" . str_repeat("=", 60) . "\n";
    $content .= "Este reporte fue generado automáticamente\n";
    $content .= "Sistema Gacha - Einherjer Blitz 3.0\n";
    $content .= "Fecha de generación: " . date('d/m/Y H:i:s') . "\n";
    $content .= "© 2024 Einherjer Blitz 3.0\n";
    $content .= str_repeat("=", 60) . "\n";
    
    // Configurar headers para descarga
    header('Content-Type: text/plain; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($content));
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: Sat, 26 Jul 1997 05:00:00 GMT');
    
    echo $content;
}

function generateTCPDF($userData, $recompensas, $recompensas_agrupadas, $totales) {
    require_once('tcpdf/tcpdf.php');
    
    $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
    
    // Configuración del documento
    $pdf->SetCreator('Einherjer Blitz 3.0');
    $pdf->SetAuthor($userData['username']);
    $pdf->SetTitle('Reporte de Recompensas - ' . $userData['username']);
    $pdf->SetSubject('Recompensas del Sistema Gacha');
    
    // Configuración de página
    $pdf->SetDefaultMonospacedFont(PDF_FONT_MONOSPACED);
    $pdf->SetMargins(PDF_MARGIN_LEFT, PDF_MARGIN_TOP, PDF_MARGIN_RIGHT);
    $pdf->SetHeaderMargin(PDF_MARGIN_HEADER);
    $pdf->SetFooterMargin(PDF_MARGIN_FOOTER);
    $pdf->SetAutoPageBreak(TRUE, PDF_MARGIN_BOTTOM);
    $pdf->setImageScale(PDF_IMAGE_SCALE_RATIO);
    
    $pdf->AddPage();
    
    // Contenido del PDF
    $html = generateReportHTML($userData, $recompensas, $recompensas_agrupadas, $totales);
    $pdf->writeHTML($html, true, false, true, false, '');
    
    // Salida del PDF
    $filename = "recompensas_" . $userData['username'] . "_" . date('Y-m-d_H-i-s') . ".pdf";
    $pdf->Output($filename, 'D');
}
?>

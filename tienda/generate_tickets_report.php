<?php
require_once '../includes/Database.php';

$auth = new AuthController();

if (!$auth->isAuthenticated()) {
    header('Location: ../index.php');
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    header('Location: ../index.php');
    exit();
}

$db = Database::getInstance();

// Verificar formato solicitado
$format = $_POST['format'] ?? 'txt';
$action = $_POST['action'] ?? 'download';

if (!in_array($format, ['txt', 'pdf'])) {
    $format = 'txt';
}

try {
    // Obtener todos los tickets pendientes
    $ticketsStmt = $db->prepare("
        SELECT * FROM tienda_tickets 
        WHERE user_id = ? AND claimed = 0
        ORDER BY ticket_type, created_at DESC
    ");
    $ticketsStmt->execute([$userData['id']]);
    $tickets = $ticketsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($tickets)) {
        $_SESSION['store_feedback'] = [
            'success' => false,
            'text' => 'No tienes tickets pendientes para descargar'
        ];
        header('Location: tickets.php');
        exit();
    }
    
    // Marcar tickets como reclamados ANTES de generar el archivo
    $db->beginTransaction();
    $claimStmt = $db->prepare("
        UPDATE tienda_tickets 
        SET claimed = 1, claimed_date = NOW()
        WHERE user_id = ? AND claimed = 0
    ");
    $claimStmt->execute([$userData['id']]);
    $db->commit();
    
    // Generar el contenido según el formato
    if ($format === 'txt') {
        generateTXT($tickets, $userData);
    } else {
        generatePDF($tickets, $userData);
    }
    
} catch (Exception $e) {
    if ($db->getConnection()->inTransaction()) {
        $db->rollback();
    }
    
    $_SESSION['store_feedback'] = [
        'success' => false,
        'text' => 'Error al generar el reporte: ' . $e->getMessage()
    ];
    header('Location: tickets.php');
    exit();
}

function generateTXT($tickets, $userData) {
    $content = "=====================================\n";
    $content .= "   EINHERJER BLITZ - MIS TICKETS\n";
    $content .= "=====================================\n\n";
    $content .= "Usuario: " . $userData['username'] . "\n";
    $content .= "Fecha: " . date('d/m/Y H:i:s') . "\n";
    $content .= "Total de Tickets: " . count($tickets) . "\n";
    $content .= "=====================================\n\n";
    
    // Agrupar por tipo
    $grouped = [
        'tienda' => [],
        'marketplace_compra' => [],
        'marketplace_venta' => []
    ];
    
    foreach ($tickets as $ticket) {
        $grouped[$ticket['ticket_type']][] = $ticket;
    }
    
    // Tickets de Tienda
    if (!empty($grouped['tienda'])) {
        $content .= "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        $content .= "  COMPRAS EN TIENDA (" . count($grouped['tienda']) . ")\n";
        $content .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
        
        foreach ($grouped['tienda'] as $ticket) {
            $content .= "• " . $ticket['item_name'] . "\n";
            $content .= "  Cantidad: " . $ticket['cantidad'] . " unidad(es)\n";
            $content .= "  Precio: " . number_format($ticket['precio_pagado']) . " ";
            $content .= ucfirst($ticket['moneda_usada']) . "\n";
            $content .= "  Categoría: " . ($ticket['categoria'] ?? 'General') . "\n";
            $content .= "  Fecha: " . date('d/m/Y H:i', strtotime($ticket['created_at'])) . "\n";
            if ($ticket['item_description']) {
                $content .= "  Descripción: " . $ticket['item_description'] . "\n";
            }
            $content .= "\n";
        }
    }
    
    // Tickets de Marketplace - Compras
    if (!empty($grouped['marketplace_compra'])) {
        $content .= "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        $content .= "  COMPRAS EN MARKETPLACE (" . count($grouped['marketplace_compra']) . ")\n";
        $content .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
        
        foreach ($grouped['marketplace_compra'] as $ticket) {
            $content .= "• " . $ticket['item_name'] . "\n";
            $content .= "  Cantidad: " . $ticket['cantidad'] . " unidad(es)\n";
            $content .= "  Precio: " . number_format($ticket['precio_pagado']) . " ";
            $content .= ucfirst($ticket['moneda_usada']) . "\n";
            $content .= "  Vendedor: " . ($ticket['seller_username'] ?? 'Desconocido') . "\n";
            $content .= "  Fecha: " . date('d/m/Y H:i', strtotime($ticket['created_at'])) . "\n";
            if ($ticket['item_description']) {
                $content .= "  Descripción: " . $ticket['item_description'] . "\n";
            }
            $content .= "\n";
        }
    }
    
    // Tickets de Marketplace - Ventas
    if (!empty($grouped['marketplace_venta'])) {
        $content .= "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        $content .= "  VENTAS EN MARKETPLACE (" . count($grouped['marketplace_venta']) . ")\n";
        $content .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
        
        foreach ($grouped['marketplace_venta'] as $ticket) {
            $content .= "• " . $ticket['item_name'] . "\n";
            $content .= "  Cantidad: " . $ticket['cantidad'] . " unidad(es)\n";
            $content .= "  Ingreso: " . number_format($ticket['precio_pagado']) . " ";
            $content .= ucfirst($ticket['moneda_usada']) . "\n";
            $content .= "  Fecha: " . date('d/m/Y H:i', strtotime($ticket['created_at'])) . "\n";
            if ($ticket['notes']) {
                $content .= "  Notas: " . $ticket['notes'] . "\n";
            }
            $content .= "\n";
        }
    }
    
    // Resumen
    $content .= "\n=====================================\n";
    $content .= "           RESUMEN\n";
    $content .= "=====================================\n";
    $content .= "Compras en Tienda: " . count($grouped['tienda']) . "\n";
    $content .= "Compras Marketplace: " . count($grouped['marketplace_compra']) . "\n";
    $content .= "Ventas Marketplace: " . count($grouped['marketplace_venta']) . "\n";
    $content .= "Total Tickets: " . count($tickets) . "\n";
    $content .= "=====================================\n\n";
    $content .= "Generado el: " . date('d/m/Y H:i:s') . "\n";
    $content .= "© " . date('Y') . " Einherjer Blitz\n";
    
    // Enviar archivo
    $filename = 'Tickets_' . $userData['username'] . '_' . date('Y-m-d_His') . '.txt';
    
    header('Content-Type: text/plain; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($content));
    header('Cache-Control: no-cache');
    header('Pragma: no-cache');
    
    echo $content;
    exit();
}

function generatePDF($tickets, $userData) {
    // Verificar si existe TCPDF
    $tcpdfPath = '../vendor/tecnickcom/tcpdf/tcpdf.php';
    
    if (!file_exists($tcpdfPath)) {
        // Fallback a HTML si no hay TCPDF
        generateHTMLPDF($tickets, $userData);
        return;
    }
    
    require_once($tcpdfPath);
    
    // Crear PDF
    $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
    
    // Configuración del documento
    $pdf->SetCreator('Einherjer Blitz');
    $pdf->SetAuthor($userData['username']);
    $pdf->SetTitle('Mis Tickets - ' . $userData['username']);
    $pdf->SetSubject('Tickets de Compras y Ventas');
    
    // Configuración de página
    $pdf->SetMargins(15, 15, 15);
    $pdf->SetAutoPageBreak(true, 15);
    $pdf->setImageScale(PDF_IMAGE_SCALE_RATIO);
    
    // Fuente
    $pdf->SetFont('helvetica', '', 10);
    
    // Primera página
    $pdf->AddPage();
    
    // Encabezado
    $pdf->SetFont('helvetica', 'B', 24);
    $pdf->SetTextColor(201, 170, 113);
    $pdf->Cell(0, 15, 'EINHERJER BLITZ', 0, 1, 'C');
    
    $pdf->SetFont('helvetica', '', 14);
    $pdf->SetTextColor(150, 150, 150);
    $pdf->Cell(0, 8, 'Mis Tickets', 0, 1, 'C');
    
    $pdf->Ln(5);
    
    // Información del usuario
    $pdf->SetFont('helvetica', '', 10);
    $pdf->SetTextColor(100, 100, 100);
    $pdf->Cell(0, 6, 'Usuario: ' . $userData['username'], 0, 1);
    $pdf->Cell(0, 6, 'Fecha: ' . date('d/m/Y H:i:s'), 0, 1);
    $pdf->Cell(0, 6, 'Total de Tickets: ' . count($tickets), 0, 1);
    
    $pdf->Ln(5);
    
    // Línea separadora
    $pdf->SetDrawColor(201, 170, 113);
    $pdf->SetLineWidth(0.5);
    $pdf->Line(15, $pdf->GetY(), 195, $pdf->GetY());
    
    $pdf->Ln(8);
    
    // Agrupar tickets
    $grouped = [
        'tienda' => [],
        'marketplace_compra' => [],
        'marketplace_venta' => []
    ];
    
    foreach ($tickets as $ticket) {
        $grouped[$ticket['ticket_type']][] = $ticket;
    }
    
    // Función para dibujar un ticket
    $drawTicket = function($ticket, $pdf, $typeLabel) {
        $pdf->SetFillColor(245, 245, 245);
        $pdf->Rect($pdf->GetX(), $pdf->GetY(), 180, 35, 'F');
        
        $y = $pdf->GetY();
        
        // Nombre del artículo
        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->SetXY(20, $y + 3);
        $pdf->Cell(0, 6, $ticket['item_name'], 0, 1);
        
        // Detalles
        $pdf->SetFont('helvetica', '', 9);
        $pdf->SetTextColor(80, 80, 80);
        $pdf->SetX(20);
        $pdf->Cell(40, 5, 'Cantidad: ' . $ticket['cantidad'], 0, 0);
        $pdf->Cell(60, 5, 'Precio: ' . number_format($ticket['precio_pagado']) . ' ' . ucfirst($ticket['moneda_usada']), 0, 1);
        
        if ($ticket['seller_username']) {
            $pdf->SetX(20);
            $pdf->Cell(100, 5, 'Vendedor: ' . $ticket['seller_username'], 0, 1);
        }
        
        $pdf->SetX(20);
        $pdf->Cell(0, 5, 'Fecha: ' . date('d/m/Y H:i', strtotime($ticket['created_at'])), 0, 1);
        
        $pdf->Ln(5);
    };
    
    // Compras en Tienda
    if (!empty($grouped['tienda'])) {
        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->SetTextColor(75, 192, 192);
        $pdf->Cell(0, 8, 'COMPRAS EN TIENDA (' . count($grouped['tienda']) . ')', 0, 1);
        $pdf->Ln(3);
        
        foreach ($grouped['tienda'] as $ticket) {
            $drawTicket($ticket, $pdf, 'Tienda');
        }
        
        $pdf->Ln(5);
    }
    
    // Compras en Marketplace
    if (!empty($grouped['marketplace_compra'])) {
        if ($pdf->GetY() > 250) $pdf->AddPage();
        
        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->SetTextColor(255, 159, 64);
        $pdf->Cell(0, 8, 'COMPRAS EN MARKETPLACE (' . count($grouped['marketplace_compra']) . ')', 0, 1);
        $pdf->Ln(3);
        
        foreach ($grouped['marketplace_compra'] as $ticket) {
            if ($pdf->GetY() > 250) $pdf->AddPage();
            $drawTicket($ticket, $pdf, 'Compra');
        }
        
        $pdf->Ln(5);
    }
    
    // Ventas en Marketplace
    if (!empty($grouped['marketplace_venta'])) {
        if ($pdf->GetY() > 250) $pdf->AddPage();
        
        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->SetTextColor(153, 102, 255);
        $pdf->Cell(0, 8, 'VENTAS EN MARKETPLACE (' . count($grouped['marketplace_venta']) . ')', 0, 1);
        $pdf->Ln(3);
        
        foreach ($grouped['marketplace_venta'] as $ticket) {
            if ($pdf->GetY() > 250) $pdf->AddPage();
            $drawTicket($ticket, $pdf, 'Venta');
        }
    }
    
    // Footer con resumen
    $pdf->Ln(10);
    $pdf->SetDrawColor(201, 170, 113);
    $pdf->SetLineWidth(0.5);
    $pdf->Line(15, $pdf->GetY(), 195, $pdf->GetY());
    $pdf->Ln(5);
    
    $pdf->SetFont('helvetica', '', 9);
    $pdf->SetTextColor(100, 100, 100);
    $pdf->Cell(0, 5, 'Generado el ' . date('d/m/Y H:i:s') . ' - © ' . date('Y') . ' Einherjer Blitz', 0, 1, 'C');
    
    // Salida
    $filename = 'Tickets_' . $userData['username'] . '_' . date('Y-m-d_His') . '.pdf';
    $pdf->Output($filename, 'D');
    exit();
}

function generateHTMLPDF($tickets, $userData) {
    // Generar HTML como alternativa si no hay TCPDF
    $html = '<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mis Tickets - ' . htmlspecialchars($userData['username']) . '</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #fff; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #c9aa71; padding-bottom: 20px; }
        .header h1 { color: #c9aa71; margin: 0; font-size: 32px; }
        .header p { color: #999; margin: 5px 0; }
        .info { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
        .section { margin: 30px 0; }
        .section h2 { color: #c9aa71; border-bottom: 2px solid #c9aa71; padding-bottom: 10px; }
        .ticket { background: #f9f9f9; border-left: 4px solid #c9aa71; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .ticket h3 { margin: 0 0 10px 0; color: #333; }
        .ticket p { margin: 5px 0; color: #666; }
        .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
        @media print { body { background: #fff; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>EINHERJER BLITZ</h1>
        <p>Mis Tickets de Compras y Ventas</p>
    </div>
    
    <div class="info">
        <p><strong>Usuario:</strong> ' . htmlspecialchars($userData['username']) . '</p>
        <p><strong>Fecha:</strong> ' . date('d/m/Y H:i:s') . '</p>
        <p><strong>Total de Tickets:</strong> ' . count($tickets) . '</p>
    </div>';
    
    // Agrupar tickets
    $grouped = [
        'tienda' => [],
        'marketplace_compra' => [],
        'marketplace_venta' => []
    ];
    
    foreach ($tickets as $ticket) {
        $grouped[$ticket['ticket_type']][] = $ticket;
    }
    
    // Compras en Tienda
    if (!empty($grouped['tienda'])) {
        $html .= '<div class="section">
            <h2>COMPRAS EN TIENDA (' . count($grouped['tienda']) . ')</h2>';
        
        foreach ($grouped['tienda'] as $ticket) {
            $html .= '<div class="ticket">
                <h3>' . htmlspecialchars($ticket['item_name']) . '</h3>
                <p><strong>Cantidad:</strong> ' . $ticket['cantidad'] . ' unidad(es)</p>
                <p><strong>Precio:</strong> ' . number_format($ticket['precio_pagado']) . ' ' . ucfirst($ticket['moneda_usada']) . '</p>
                <p><strong>Fecha:</strong> ' . date('d/m/Y H:i', strtotime($ticket['created_at'])) . '</p>';
            
            if ($ticket['item_description']) {
                $html .= '<p><strong>Descripción:</strong> ' . htmlspecialchars($ticket['item_description']) . '</p>';
            }
            
            $html .= '</div>';
        }
        
        $html .= '</div>';
    }
    
    // Compras en Marketplace
    if (!empty($grouped['marketplace_compra'])) {
        $html .= '<div class="section">
            <h2>COMPRAS EN MARKETPLACE (' . count($grouped['marketplace_compra']) . ')</h2>';
        
        foreach ($grouped['marketplace_compra'] as $ticket) {
            $html .= '<div class="ticket" style="border-left-color: #ff9f40;">
                <h3>' . htmlspecialchars($ticket['item_name']) . '</h3>
                <p><strong>Cantidad:</strong> ' . $ticket['cantidad'] . ' unidad(es)</p>
                <p><strong>Precio:</strong> ' . number_format($ticket['precio_pagado']) . ' ' . ucfirst($ticket['moneda_usada']) . '</p>
                <p><strong>Vendedor:</strong> ' . htmlspecialchars($ticket['seller_username'] ?? 'Desconocido') . '</p>
                <p><strong>Fecha:</strong> ' . date('d/m/Y H:i', strtotime($ticket['created_at'])) . '</p>';
            
            if ($ticket['item_description']) {
                $html .= '<p><strong>Descripción:</strong> ' . htmlspecialchars($ticket['item_description']) . '</p>';
            }
            
            $html .= '</div>';
        }
        
        $html .= '</div>';
    }
    
    // Ventas en Marketplace
    if (!empty($grouped['marketplace_venta'])) {
        $html .= '<div class="section">
            <h2>VENTAS EN MARKETPLACE (' . count($grouped['marketplace_venta']) . ')</h2>';
        
        foreach ($grouped['marketplace_venta'] as $ticket) {
            $html .= '<div class="ticket" style="border-left-color: #9966ff;">
                <h3>' . htmlspecialchars($ticket['item_name']) . '</h3>
                <p><strong>Cantidad:</strong> ' . $ticket['cantidad'] . ' unidad(es)</p>
                <p><strong>Ingreso:</strong> ' . number_format($ticket['precio_pagado']) . ' ' . ucfirst($ticket['moneda_usada']) . '</p>
                <p><strong>Fecha:</strong> ' . date('d/m/Y H:i', strtotime($ticket['created_at'])) . '</p>';
            
            if ($ticket['notes']) {
                $html .= '<p><strong>Notas:</strong> ' . htmlspecialchars($ticket['notes']) . '</p>';
            }
            
            $html .= '</div>';
        }
        
        $html .= '</div>';
    }
    
    $html .= '<div class="footer">
        <p>Generado el ' . date('d/m/Y H:i:s') . ' - © ' . date('Y') . ' Einherjer Blitz</p>
    </div>
</body>
</html>';
    
    echo $html;
    exit();
}

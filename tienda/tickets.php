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

$db = Database::getInstance();

// Obtener tickets pendientes del usuario
try {
    $ticketsStmt = $db->prepare("
        SELECT * FROM tienda_tickets 
        WHERE user_id = ? AND claimed = 0
        ORDER BY created_at DESC
    ");
    $ticketsStmt->execute([$userData['id']]);
    $tickets = $ticketsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Obtener estadísticas
    $statsStmt = $db->prepare("
        SELECT * FROM tienda_tickets_stats 
        WHERE user_id = ?
    ");
    $statsStmt->execute([$userData['id']]);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$stats) {
        $stats = [
            'total_tickets' => 0,
            'tickets_claimed' => 0,
            'tickets_pending' => 0,
            'total_tienda' => 0,
            'total_marketplace_compras' => 0,
            'total_marketplace_ventas' => 0
        ];
    }
    
    // Contar tickets por tipo
    $tipos_count = [];
    $monedas_count = [];
    foreach ($tickets as $ticket) {
        $tipo = $ticket['ticket_type'];
        if (!isset($tipos_count[$tipo])) {
            $tipos_count[$tipo] = 0;
        }
        $tipos_count[$tipo]++;
        
        $moneda = $ticket['moneda_usada'];
        if (!isset($monedas_count[$moneda])) {
            $monedas_count[$moneda] = 0;
        }
        $monedas_count[$moneda]++;
    }
    
} catch (Exception $e) {
    $error_message = "Error al obtener tickets: " . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="es" class="h-100">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mis Tickets | Einherjer Blitz</title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --bg-dark: #0a0a0a;
            --bg-gradient: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            --gold: #c9aa71;
            --gold-hover: #d4b776;
            --gold-shadow: rgba(201, 170, 113, 0.3);
            --text-light: #ffffffd9;
            --text-muted: #aaaaaa;
            --card-bg: #111;
            --card-border: rgba(201,170,113,0.2);
            --card-hover: rgba(201,170,113,0.1);
            --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: var(--bg-gradient);
            font-family: 'Inter', sans-serif;
            color: var(--text-light);
            min-height: 100vh;
        }
        
        .tickets-header {
            padding: 1.8rem 2.5rem 1.4rem;
            border-bottom: 1px solid var(--card-border);
            background: linear-gradient(120deg, rgba(0,0,0,0.65), rgba(37, 29, 11, 0.3));
            position: sticky;
            top: 0;
            z-index: 100;
            backdrop-filter: blur(10px);
        }
        
        .back-link {
            color: var(--gold);
            text-decoration: none;
            font-size: 0.9rem;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            opacity: 0.85;
            transition: var(--transition-smooth);
            margin-bottom: 0.5rem;
            font-weight: 500;
        }
        
        .back-link:hover {
            opacity: 1;
            transform: translateX(-3px);
        }
        
        .page-title {
            font-family: 'Cinzel', serif;
            color: var(--gold);
            font-size: 2.3rem;
            margin: 0.5rem 0 0.3rem;
            letter-spacing: 0.06em;
            text-shadow: 0 4px 12px var(--gold-shadow);
        }
        
        .page-subtitle {
            color: var(--text-muted);
            font-size: 0.95rem;
            margin: 0;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.2rem;
            margin: 2rem 2.5rem;
        }
        
        .stat-card {
            background: rgba(10,10,10,0.65);
            border: 1px solid var(--card-border);
            border-radius: 14px;
            padding: 1.5rem;
            text-align: center;
            transition: var(--transition-smooth);
        }
        
        .stat-card:hover {
            border-color: rgba(201,170,113,0.4);
            transform: translateY(-2px);
        }
        
        .stat-icon {
            font-size: 2.5rem;
            color: var(--gold);
            margin-bottom: 0.8rem;
        }
        
        .stat-value {
            font-family: 'Cinzel', serif;
            font-size: 2rem;
            color: var(--text-light);
            margin-bottom: 0.3rem;
        }
        
        .stat-label {
            font-size: 0.85rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .content-section {
            padding: 2rem 2.5rem;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .section-title {
            font-family: 'Cinzel', serif;
            color: var(--gold);
            font-size: 1.5rem;
        }
        
        .btn-claim-all {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: var(--gold);
            color: #111;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition-smooth);
            text-decoration: none;
        }
        
        .btn-claim-all:hover {
            background: var(--gold-hover);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px var(--gold-shadow);
            color: #111;
        }
        
        .tickets-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.5rem;
        }
        
        .ticket-card {
            background: rgba(10,10,10,0.65);
            border: 1px solid var(--card-border);
            border-radius: 16px;
            overflow: hidden;
            transition: var(--transition-smooth);
            position: relative;
        }
        
        .ticket-card:hover {
            transform: translateY(-4px);
            border-color: rgba(201,170,113,0.35);
            box-shadow: 0 12px 24px rgba(0,0,0,0.4);
        }
        
        .ticket-type-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            padding: 0.4rem 0.8rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .ticket-type-tienda {
            background: rgba(75, 192, 192, 0.2);
            border: 1px solid rgba(75, 192, 192, 0.4);
            color: #4bc0c0;
        }
        
        .ticket-type-marketplace_compra {
            background: rgba(255, 159, 64, 0.2);
            border: 1px solid rgba(255, 159, 64, 0.4);
            color: #ff9f40;
        }
        
        .ticket-type-marketplace_venta {
            background: rgba(153, 102, 255, 0.2);
            border: 1px solid rgba(153, 102, 255, 0.4);
            color: #9966ff;
        }
        
        .ticket-image {
            width: 100%;
            height: 180px;
            object-fit: cover;
            background: linear-gradient(135deg, rgba(201,170,113,0.1), rgba(0,0,0,0.5));
        }
        
        .ticket-body {
            padding: 1.3rem;
        }
        
        .ticket-title {
            font-family: 'Cinzel', serif;
            font-size: 1.2rem;
            color: var(--text-light);
            margin-bottom: 0.5rem;
        }
        
        .ticket-meta {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .ticket-meta-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.4rem 0.6rem;
            background: rgba(0,0,0,0.35);
            border-radius: 6px;
            font-size: 0.9rem;
        }
        
        .ticket-meta-label {
            color: var(--text-muted);
        }
        
        .ticket-meta-value {
            color: var(--gold);
            font-weight: 600;
        }
        
        .ticket-quantity {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            background: rgba(201,170,113,0.15);
            padding: 0.3rem 0.7rem;
            border-radius: 999px;
            font-size: 0.85rem;
            color: var(--gold);
            font-weight: 600;
        }
        
        .ticket-date {
            font-size: 0.8rem;
            color: var(--text-muted);
            margin-top: 0.5rem;
        }
        
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: var(--text-muted);
        }
        
        .empty-illustration {
            font-size: 5rem;
            color: rgba(201,170,113,0.25);
            margin-bottom: 1.5rem;
        }
        
        .empty-title {
            font-family: 'Cinzel', serif;
            font-size: 1.8rem;
            color: var(--text-muted);
            margin-bottom: 0.5rem;
        }
        
        .empty-text {
            font-size: 1rem;
            margin-bottom: 2rem;
        }
        
        .btn-go-shop {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: var(--gold);
            color: #111;
            border: none;
            padding: 0.9rem 1.8rem;
            border-radius: 10px;
            font-weight: 600;
            text-decoration: none;
            transition: var(--transition-smooth);
        }
        
        .btn-go-shop:hover {
            background: var(--gold-hover);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px var(--gold-shadow);
            color: #111;
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        
        .loading-content {
            text-align: center;
        }
        
        .spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(201,170,113,0.2);
            border-top-color: var(--gold);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .tickets-header {
                padding: 1.2rem 1.35rem;
            }
            
            .page-title {
                font-size: 1.8rem;
            }
            
            .stats-grid {
                margin: 1.5rem 1.35rem;
                grid-template-columns: repeat(2, 1fr);
                gap: 0.8rem;
            }
            
            .stat-card {
                padding: 1rem;
            }
            
            .stat-icon {
                font-size: 2rem;
            }
            
            .stat-value {
                font-size: 1.5rem;
            }
            
            .content-section {
                padding: 1.5rem 1.35rem;
            }
            
            .section-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }
            
            .section-header > div {
                width: 100%;
                flex-direction: column;
            }
            
            .btn-claim-all {
                width: 100%;
                justify-content: center;
            }
            
            .tickets-grid {
                grid-template-columns: 1fr;
            }
        }
        
        @media (max-width: 576px) {
            .page-title {
                font-size: 1.5rem;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .btn-claim-all span {
                font-size: 0.9rem;
            }
        }
    </style>
</head>
<body class="d-flex flex-column h-100">
    
    <!-- Loading Overlay -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-content">
            <div class="spinner"></div>
            <h4 style="color: var(--text-light);">Procesando...</h4>
            <p style="color: var(--text-muted);">Por favor espera</p>
        </div>
    </div>
    
    <!-- Header -->
    <header class="tickets-header">
        <a href="tienda.php" class="back-link">
            <i class="fas fa-arrow-left"></i>
            <span>Volver a Tienda</span>
        </a>
        <h1 class="page-title">
            <i class="fas fa-ticket-alt me-2"></i>
            Mis Tickets
        </h1>
        <p class="page-subtitle">Gestiona y descarga tus compras de la tienda y marketplace</p>
    </header>

    <!-- Estadísticas -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-ticket-alt"></i></div>
            <div class="stat-value"><?= count($tickets) ?></div>
            <div class="stat-label">Pendientes</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-shopping-cart"></i></div>
            <div class="stat-value"><?= $stats['total_tienda'] ?></div>
            <div class="stat-label">Compras Tienda</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-shopping-bag"></i></div>
            <div class="stat-value"><?= $stats['total_marketplace_compras'] ?></div>
            <div class="stat-label">Compras Marketplace</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-coins"></i></div>
            <div class="stat-value"><?= $stats['total_marketplace_ventas'] ?></div>
            <div class="stat-label">Ventas Marketplace</div>
        </div>
    </div>

    <!-- Main Content -->
    <main class="flex-grow-1">
        <div class="content-section">
            
            <?php if (isset($error_message)): ?>
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <?= htmlspecialchars($error_message) ?>
                </div>
            <?php endif; ?>
            
            <?php if (!empty($tickets)): ?>
                <div class="section-header">
                    <h2 class="section-title">Tickets Pendientes</h2>
                    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                        <button class="btn-claim-all" onclick="downloadReport('pdf')" style="background: rgba(201,170,113,0.2); border: 1px solid var(--gold); color: var(--gold);">
                            <i class="fas fa-file-pdf"></i>
                            <span>Descargar PDF</span>
                        </button>
                        <button class="btn-claim-all" onclick="downloadReport('txt')" style="background: rgba(201,170,113,0.2); border: 1px solid var(--gold); color: var(--gold);">
                            <i class="fas fa-file-alt"></i>
                            <span>Descargar TXT</span>
                        </button>
                    </div>
                </div>
                
                <div class="tickets-grid">
                    <?php foreach ($tickets as $ticket): ?>
                        <div class="ticket-card">
                            <span class="ticket-type-badge ticket-type-<?= htmlspecialchars($ticket['ticket_type']) ?>">
                                <?php
                                $typeLabels = [
                                    'tienda' => 'Tienda',
                                    'marketplace_compra' => 'Compra',
                                    'marketplace_venta' => 'Venta'
                                ];
                                echo $typeLabels[$ticket['ticket_type']] ?? 'Ticket';
                                ?>
                            </span>
                            
                            <?php if ($ticket['imagen_url']): ?>
                                <img src="<?= htmlspecialchars($ticket['imagen_url']) ?>" 
                                     alt="<?= htmlspecialchars($ticket['item_name']) ?>" 
                                     class="ticket-image"
                                     onerror="this.src='https://via.placeholder.com/400x300/1a1a1a/c9aa71?text=Einherjer+Blitz'">
                            <?php else: ?>
                                <div class="ticket-image" style="display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-box-open" style="font-size: 3rem; color: rgba(201,170,113,0.3);"></i>
                                </div>
                            <?php endif; ?>
                            
                            <div class="ticket-body">
                                <h3 class="ticket-title"><?= htmlspecialchars($ticket['item_name']) ?></h3>
                                
                                <?php if ($ticket['cantidad'] > 1): ?>
                                    <div class="ticket-quantity">
                                        <i class="fas fa-boxes"></i>
                                        <span>x<?= $ticket['cantidad'] ?></span>
                                    </div>
                                <?php endif; ?>
                                
                                <div class="ticket-meta">
                                    <div class="ticket-meta-item">
                                        <span class="ticket-meta-label">
                                            <i class="fas fa-<?= $ticket['moneda_usada'] === 'esferas' ? 'globe' : ($ticket['moneda_usada'] === 'llaves' ? 'key' : 'ticket') ?> me-1"></i>
                                            Precio:
                                        </span>
                                        <span class="ticket-meta-value">
                                            <?= number_format($ticket['precio_pagado']) ?>
                                            <?php
                                            $monedaLabels = [
                                                'esferas' => 'Esferas',
                                                'llaves' => 'Llaves',
                                                'cupones_azules' => 'Cupones'
                                            ];
                                            echo $monedaLabels[$ticket['moneda_usada']] ?? '';
                                            ?>
                                        </span>
                                    </div>
                                    
                                    <?php if ($ticket['seller_username']): ?>
                                        <div class="ticket-meta-item">
                                            <span class="ticket-meta-label">
                                                <i class="fas fa-user me-1"></i>
                                                Vendedor:
                                            </span>
                                            <span class="ticket-meta-value"><?= htmlspecialchars($ticket['seller_username']) ?></span>
                                        </div>
                                    <?php endif; ?>
                                </div>
                                
                                <div class="ticket-date">
                                    <i class="fas fa-calendar me-1"></i>
                                    <?= date('d/m/Y H:i', strtotime($ticket['created_at'])) ?>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <div class="empty-state">
                    <div class="empty-illustration">
                        <i class="fas fa-ticket-alt"></i>
                    </div>
                    <h2 class="empty-title">No tienes tickets pendientes</h2>
                    <p class="empty-text">¡Ve a la tienda o marketplace y realiza tu primera compra!</p>
                    <a href="tienda.php" class="btn-go-shop">
                        <i class="fas fa-shopping-cart"></i>
                        <span>Ir a la Tienda</span>
                    </a>
                </div>
            <?php endif; ?>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    
    <script>
        function showLoading() {
            document.getElementById('loadingOverlay').style.display = 'flex';
        }
        
        function hideLoading() {
            document.getElementById('loadingOverlay').style.display = 'none';
        }
        
        function downloadReport(format) {
            Swal.fire({
                title: '¿Descargar reporte?',
                html: `
                    <div class="text-start">
                        <p><strong>Vas a descargar <?= count($tickets) ?> tickets en formato ${format.toUpperCase()}</strong></p>
                        <div class="alert alert-info" style="background: rgba(75,192,192,0.1); border: 1px solid rgba(75,192,192,0.3); color: #4bc0c0; border-radius: 8px; padding: 12px;">
                            <i class="fas fa-info-circle me-2"></i>
                            Los tickets quedarán registrados en tu historial. Descarga este reporte para tener un respaldo.
                        </div>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: `Descargar ${format.toUpperCase()}`,
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#c9aa71',
                cancelButtonColor: '#6c757d',
                background: '#1a1a1a',
                color: '#ffffff'
            }).then((result) => {
                if (result.isConfirmed) {
                    executeDownload(format);
                }
            });
        }
        
        function executeDownload(format) {
            showLoading();
            
            // Crear formulario temporal para descarga
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = 'generate_tickets_report.php';
            
            const formatInput = document.createElement('input');
            formatInput.type = 'hidden';
            formatInput.name = 'format';
            formatInput.value = format;
            form.appendChild(formatInput);
            
            const actionInput = document.createElement('input');
            actionInput.type = 'hidden';
            actionInput.name = 'action';
            actionInput.value = 'download';
            form.appendChild(actionInput);
            
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
            
            setTimeout(() => {
                hideLoading();
                Swal.fire({
                    title: '¡Tickets Reclamados!',
                    html: `
                        <div class="text-start">
                            <p><strong>✅ Tu archivo ${format.toUpperCase()} se ha descargado</strong></p>
                            <p><strong>📋 Los tickets han sido marcados como reclamados</strong></p>
                            <div class="alert alert-info mt-3" style="background: rgba(75,192,192,0.1); border: 1px solid rgba(75,192,192,0.3); color: #4bc0c0; border-radius: 8px; padding: 12px;">
                                <i class="fas fa-info-circle me-2"></i>
                                La página se recargará para actualizar tu lista.
                            </div>
                        </div>
                    `,
                    icon: 'success',
                    confirmButtonColor: '#c9aa71',
                    background: '#1a1a1a',
                    color: '#ffffff',
                    confirmButtonText: 'Entendido'
                }).then(() => {
                    location.reload();
                });
            }, 1500);
        }
    </script>
</body>
</html>

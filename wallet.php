<?php
require_once 'includes/Database.php';

$auth = new AuthController();

// Verificar autenticación
if (!$auth->isAuthenticated()) {
    header('Location: index.php');
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    header('Location: index.php');
    exit();
}

$db = Database::getInstance();

// Obtener portfolio del usuario
$portfolioQuery = $db->prepare("
    SELECT p.*, t.nombre, t.descripcion, t.precio_actual, t.supply_circulante, 
           t.categoria, t.imagen_url, t.cambio_24h,
           (t.precio_actual / t.supply_circulante) as precio_por_accion,
           (p.total_acciones * (t.precio_actual / t.supply_circulante)) as valor_actual_calculado
    FROM user_portfolio p 
    JOIN terrenos t ON p.terrain_id = t.id 
    WHERE p.user_id = ? AND p.total_acciones > 0
    ORDER BY p.valor_actual DESC
");
$portfolioQuery->execute([$userData['id']]);
$portfolio = $portfolioQuery->fetchAll();

// Calcular totales del portfolio
$totalInversion = 0;
$totalValorActual = 0;
foreach ($portfolio as $item) {
    $totalInversion += $item['inversion_total'];
    $totalValorActual += $item['valor_actual_calculado'];
}
$totalGananciaPercent = $totalInversion > 0 ? (($totalValorActual - $totalInversion) / $totalInversion) * 100 : 0;

// Obtener transacciones recientes
$transactionsQuery = $db->prepare("
    SELECT wt.*, t.nombre as terrain_nombre, u.username as destinatario_username
    FROM wallet_transactions wt 
    LEFT JOIN terrenos t ON wt.terrain_id = t.id
    LEFT JOIN usuarios u ON wt.destinatario_id = u.id
    WHERE wt.user_id = ? 
    ORDER BY wt.fecha_transaccion DESC 
    LIMIT 10
");
$transactionsQuery->execute([$userData['id']]);
$transactions = $transactionsQuery->fetchAll();

// Obtener terrenos disponibles
$terrainsQuery = $db->prepare("
    SELECT *, (precio_actual / supply_circulante) as precio_por_accion
    FROM terrenos 
    WHERE activo = 1 
    ORDER BY precio_actual DESC
");
$terrainsQuery->execute();
$terrains = $terrainsQuery->fetchAll();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wallet - Einherjar Blitz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    
    <!-- Dashboard CSS -->
    <link rel="stylesheet" href="assets/css/dashboard.css">
    
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <meta name="description" content="Wallet de Einherjer Blitz 3.0 - Gestiona tus inversiones">
    <meta name="robots" content="noindex, nofollow">
</head>
<body class="d-flex flex-column h-100">
    <!-- Header -->
    <header class="dashboard-header">
        <div class="container-fluid">
            <div class="header-content">
                <div class="brand-section">
                    <a href="dashboard.php" class="brand-link">
                        <i class="fas fa-shield-alt"></i>
                        <span>Einherjer Blitz</span>
                    </a>
                </div>
                
                <div class="user-section">
                    <div class="user-info">
                        <img src="images/<?php echo htmlspecialchars($userData['perfil_imagen']); ?>" 
                             alt="Avatar" class="user-avatar">
                        <div class="user-details">
                            <h4><?php echo htmlspecialchars($userData['username']); ?></h4>
                            <p><?php echo htmlspecialchars($userData['rango']); ?></p>
                        </div>
                    </div>
                    <button class="logout-btn" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-grow-1">
        <div class="container py-4">
            
            <!-- Breadcrumb -->
            <nav aria-label="breadcrumb" class="mb-4">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="dashboard.php">Dashboard</a></li>
                    <li class="breadcrumb-item active">Wallet</li>
                </ol>
            </nav>

            <!-- Welcome Section -->
            <section class="welcome-section">
                <h1 class="welcome-title">
                    <i class="fas fa-wallet me-3"></i>Tu Wallet
                </h1>
                <p class="welcome-subtitle">Gestiona tus inversiones y patrimonio digital</p>
                
                <!-- Investment Guide (Collapsible) -->
                <div class="mt-3">
                    <button class="btn btn-outline-warning btn-sm" type="button" data-bs-toggle="collapse" data-bs-target="#investmentGuide" aria-expanded="false" aria-controls="investmentGuide">
                        <i class="fas fa-question-circle me-2"></i>¿Cómo funciona el sistema de inversión?
                        <i class="fas fa-chevron-down ms-2"></i>
                    </button>
                    
                    <div class="collapse mt-2" id="investmentGuide">
                        <div class="alert alert-info" style="background: linear-gradient(135deg, #1a4d5c, #2a5f6f); border: 1px solid #3a7f8f; color: #ffffff;">
                            <div class="d-flex align-items-start">
                                <i class="fas fa-lightbulb fa-2x text-warning me-3 mt-1"></i>
                                <div>
                                    <h5 class="text-warning mb-2"><i class="fas fa-graduation-cap me-2"></i>¿Cómo Ganar Dinero Invirtiendo?</h5>
                                    <div class="row g-3">
                                        <div class="col-md-4">
                                            <div class="text-center p-2" style="background: rgba(255,255,255,0.1); border-radius: 8px;">
                                                <i class="fas fa-shopping-cart fa-2x text-success mb-2"></i>
                                                <h6 class="text-success">1. COMPRAR</h6>
                                                <small>Inviertes ESF en un terreno. El precio sube automáticamente 1.5% por tu compra.</small>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="text-center p-2" style="background: rgba(255,255,255,0.1); border-radius: 8px;">
                                                <i class="fas fa-chart-line fa-2x text-warning mb-2"></i>
                                                <h6 class="text-warning">2. ESPERAR</h6>
                                                <small>Otros jugadores invierten después de ti, subiendo más el precio del terreno.</small>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="text-center p-2" style="background: rgba(255,255,255,0.1); border-radius: 8px;">
                                                <i class="fas fa-money-bill-wave fa-2x text-info mb-2"></i>
                                                <h6 class="text-info">3. VENDER</h6>
                                                <small>Vendes a precio más alto = GANANCIA. El precio baja 1% por tu venta.</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mt-3 p-2" style="background: rgba(255,193,7,0.2); border-radius: 8px; border-left: 4px solid #ffc107;">
                                        <strong class="text-warning">💡 Ejemplo:</strong> 
                                        <span class="text-white">Inviertes 100 ESF → Precio sube → Otros invierten → Tu inversión vale 120 ESF → Vendes = +20 ESF de ganancia</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Portfolio Summary -->
            <section class="row mb-4">
                <div class="col-md-3">
                    <div class="glass-card stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-coins"></i>
                        </div>
                        <div class="stat-value"><?php echo number_format($userData['recompensas']); ?></div>
                        <div class="stat-label">Esferas</div>
                        <div class="stat-sublabel">Moneda principal</div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="glass-card stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-key"></i>
                        </div>
                        <div class="stat-value"><?php echo number_format($userData['llaves']); ?></div>
                        <div class="stat-label">Llaves</div>
                        <div class="stat-sublabel">Para cofres</div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="glass-card stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-chart-pie"></i>
                        </div>
                        <div class="stat-value"><?php echo number_format($totalValorActual, 2); ?></div>
                        <div class="stat-label">Portfolio</div>
                        <div class="stat-sublabel">Valor total</div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="glass-card stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-trending-up"></i>
                        </div>
                        <div class="stat-value text-<?php echo $totalGananciaPercent >= 0 ? 'success' : 'danger'; ?>">
                            <?php echo ($totalGananciaPercent >= 0 ? '+' : '') . number_format($totalGananciaPercent, 2); ?>%
                        </div>
                        <div class="stat-label">Rendimiento</div>
                        <div class="stat-sublabel">Total</div>
                    </div>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="row">
                <!-- Main Content -->
                <div class="col-lg-8">
                    <!-- Available Terrains -->
                    <div class="glass-card p-4 mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h3 class="text-gold mb-0">
                                    <i class="fas fa-chart-area me-2"></i>Terrenos Disponibles
                                </h3>
                                <p class="text-white-50 mb-0 mt-1">
                                    <i class="fas fa-info-circle me-1"></i>Invierte en terrenos para generar ganancias. Cada terreno tiene un dueño fijo y precios que fluctúan.
                                </p>
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                                <select class="form-select form-select-sm bg-dark text-white border-gold" style="width: auto;">
                                    <option value="">Todas las categorías</option>
                                    <option value="fortaleza">Fortalezas</option>
                                    <option value="natural">Naturales</option>
                                    <option value="comercial">Comerciales</option>
                                    <option value="industrial">Industriales</option>
                                </select>
                            </div>
                        </div>
                        
                        <?php
                        // Paginación
                        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
                        $limit = 3;
                        $offset = ($page - 1) * $limit;
                        
                        // Obtener total de terrenos
                        $totalStmt = $db->prepare("SELECT COUNT(*) as total FROM terrenos");
                        $totalStmt->execute();
                        $totalTerrains = $totalStmt->fetch(PDO::FETCH_ASSOC)['total'];
                        $totalPages = ceil($totalTerrains / $limit);
                        
                        // Obtener terrenos paginados
                        $stmt = $db->prepare("SELECT * FROM terrenos ORDER BY precio_actual DESC LIMIT ? OFFSET ?");
                        $stmt->execute([$limit, $offset]);
                        $availableTerrains = $stmt->fetchAll(PDO::FETCH_ASSOC);
                        ?>
                        
                        <div class="row g-4">
                            <?php foreach ($availableTerrains as $terrain):
                                $pricePerShare = $terrain['precio_actual'] / $terrain['supply_circulante'];
                                
                                // Obtener nombre del dueño
                                $ownerStmt = $db->prepare("SELECT username FROM usuarios WHERE id = ?");
                                $ownerStmt->execute([$terrain['owner_id']]);
                                $owner = $ownerStmt->fetch(PDO::FETCH_ASSOC);
                                $ownerName = $owner ? $owner['username'] : 'Sistema';
                                
                                // Calcular cambio de precio simulado
                                $priceChange = rand(-15, 25) / 10; // -1.5% a +2.5%
                            ?>
                            <div class="col-12">
                                <div class="terrain-card" style="background: linear-gradient(135deg, rgba(21, 21, 21, 0.95), rgba(33, 33, 33, 0.95)); border: 2px solid rgba(201, 170, 113, 0.3); border-radius: 15px; padding: 20px; transition: all 0.3s ease; position: relative; overflow: hidden;">
                                    <!-- Efecto de brillo -->
                                    <div style="position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(201, 170, 113, 0.1), transparent); animation: shimmer 3s infinite;"></div>
                                    
                                    <div class="row align-items-center">
                                        <!-- Información del Terreno -->
                                        <div class="col-md-8">
                                            <div class="d-flex align-items-center mb-3">
                                                <div class="terrain-icon-large me-3" style="width: 60px; height: 60px; background: linear-gradient(135deg, #c9aa71, #9e8b54); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(201, 170, 113, 0.3);">
                                                    <i class="fas fa-<?php echo $terrain['categoria'] === 'fortaleza' ? 'chess-rook' : ($terrain['categoria'] === 'natural' ? 'tree' : ($terrain['categoria'] === 'comercial' ? 'store' : 'hammer')); ?> text-dark" style="font-size: 1.5rem;"></i>
                                                </div>
                                                <div>
                                                    <h4 class="text-white mb-1 fw-bold"><?php echo htmlspecialchars($terrain['nombre']); ?></h4>
                                                    <div class="d-flex align-items-center gap-3">
                                                        <span class="badge bg-warning text-dark px-3 py-2" style="font-size: 0.9rem;"><?php echo ucfirst($terrain['categoria']); ?></span>
                                                        <span class="text-gold fw-bold"><i class="fas fa-crown me-1"></i><?php echo htmlspecialchars($ownerName); ?></span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="row g-3">
                                                <div class="col-sm-4">
                                                    <div class="stat-box text-center p-3" style="background: rgba(201, 170, 113, 0.1); border-radius: 10px; border: 1px solid rgba(201, 170, 113, 0.2);" title="Precio que pagas por cada acción del terreno">
                                                        <div class="text-white-50 small"><i class="fas fa-coins me-1"></i>Precio por Acción</div>
                                                        <div class="text-white fw-bold h5 mb-0"><?php echo number_format($pricePerShare, 2); ?> <small class="text-gold">ESF</small></div>
                                                    </div>
                                                </div>
                                                <div class="col-sm-4">
                                                    <div class="stat-box text-center p-3" style="background: rgba(201, 170, 113, 0.1); border-radius: 10px; border: 1px solid rgba(201, 170, 113, 0.2);" title="Valor total del terreno en el mercado">
                                                        <div class="text-white-50 small"><i class="fas fa-chart-pie me-1"></i>Valor Total</div>
                                                        <div class="text-gold fw-bold h5 mb-0"><?php echo number_format($terrain['precio_actual'], 0); ?> <small>ESF</small></div>
                                                    </div>
                                                </div>
                                                <div class="col-sm-4">
                                                    <div class="stat-box text-center p-3" style="background: rgba(201, 170, 113, 0.1); border-radius: 10px; border: 1px solid rgba(201, 170, 113, 0.2);" title="Cambio de precio en las últimas 24 horas">
                                                        <div class="text-white-50 small"><i class="fas fa-chart-line me-1"></i>Cambio 24h</div>
                                                        <div class="fw-bold h5 mb-0 text-<?php echo $priceChange >= 0 ? 'success' : 'danger'; ?>">
                                                            <i class="fas fa-<?php echo $priceChange >= 0 ? 'arrow-up' : 'arrow-down'; ?> me-1"></i>
                                                            <?php echo ($priceChange >= 0 ? '+' : '') . number_format($priceChange, 1); ?>%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Botón de Inversión -->
                                        <div class="col-md-4 text-center">
                                            <button class="btn btn-warning btn-lg px-4 py-3 fw-bold" 
                                                    onclick="openInvestModal(<?php echo $terrain['id']; ?>)"
                                                    style="border-radius: 15px;">
                                                <i class="fas fa-rocket me-2"></i>INVERTIR AHORA
                                            </button>
                                            <div class="mt-3 p-2" style="background: rgba(40, 167, 69, 0.2); border-radius: 8px; border: 1px solid rgba(40, 167, 69, 0.3);">
                                                <div class="text-success small fw-bold mb-1">
                                                    <i class="fas fa-chart-line me-1"></i>Potencial de Ganancia
                                                </div>
                                                <div class="text-white-50 small">
                                                    Al invertir aquí, el precio sube automáticamente. Si otros invierten después, ¡tú ganas!
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                        
                        <!-- Paginación -->
                        <?php if ($totalPages > 1): ?>
                        <div class="d-flex justify-content-center mt-4">
                            <nav>
                                <ul class="pagination">
                                    <?php if ($page > 1): ?>
                                    <li class="page-item">
                                        <a class="page-link bg-dark text-gold border-gold" href="?page=<?php echo $page - 1; ?>">
                                            <i class="fas fa-chevron-left"></i>
                                        </a>
                                    </li>
                                    <?php endif; ?>
                                    
                                    <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                                    <li class="page-item <?php echo $i == $page ? 'active' : ''; ?>">
                                        <a class="page-link <?php echo $i == $page ? 'bg-warning text-dark' : 'bg-dark text-gold'; ?> border-gold" href="?page=<?php echo $i; ?>">
                                            <?php echo $i; ?>
                                        </a>
                                    </li>
                                    <?php endfor; ?>
                                    
                                    <?php if ($page < $totalPages): ?>
                                    <li class="page-item">
                                        <a class="page-link bg-dark text-gold border-gold" href="?page=<?php echo $page + 1; ?>">
                                            <i class="fas fa-chevron-right"></i>
                                        </a>
                                    </li>
                                    <?php endif; ?>
                                </ul>
                            </nav>
                        </div>
                        <?php endif; ?>
                    </div>

                    <!-- Portfolio Overview -->
                    <div class="glass-card p-4 mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h4 class="text-gold mb-0">
                                    <i class="fas fa-briefcase me-2"></i>Mi Portfolio
                                </h4>
                                <p class="text-white-50 mb-0 mt-1">
                                    <i class="fas fa-info-circle me-1"></i>Aquí puedes ver todas tus inversiones y ganancias en tiempo real.
                                </p>
                            </div>
                        </div>

                        <?php if (empty($portfolio)): ?>
                        <div class="text-center py-5">
                            <i class="fas fa-chart-line fa-3x text-gold mb-3" style="opacity: 0.6;"></i>
                            <h5 class="text-white">No tienes inversiones aún</h5>
                            <p class="text-white-50">Comienza a invertir en terrenos para hacer crecer tu patrimonio</p>
                            <button class="btn btn-warning btn-lg" data-bs-toggle="modal" data-bs-target="#investModal">
                                <i class="fas fa-rocket me-2"></i>Comenzar a Invertir
                            </button>
                        </div>
                        <?php else: ?>
                        <div class="table-responsive">
                            <table class="table table-hover table-dark" style="color: var(--text-primary); background-color: #1a1a1a;">
                                <thead style="background: linear-gradient(135deg, #1a1a1a, #252525); border-bottom: 2px solid var(--border-gold);">
                                    <tr>
                                        <th class="text-gold">Terreno</th>
                                        <th class="text-gold">Acciones</th>
                                        <th class="text-gold">Precio Actual</th>
                                        <th class="text-gold">Valor Total</th>
                                        <th class="text-gold">Ganancia/Pérdida</th>
                                        <th class="text-gold">Cambio 24h</th>
                                        <th class="text-gold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody style="background: transparent;">
                                    <?php foreach ($portfolio as $item): 
                                        $ganancia = $item['valor_actual_calculado'] - $item['inversion_total'];
                                        $gananciaPercent = $item['inversion_total'] > 0 ? (($ganancia) / $item['inversion_total']) * 100 : 0;
                                    ?>
                                    <tr style="background-color: #1a1a1a !important; border-bottom: 1px solid rgba(201, 170, 113, 0.2);">
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <div class="terrain-icon me-3" style="width: 32px; height: 32px; background: linear-gradient(135deg, #c9aa71, #9e8b54); border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                                                    <i class="fas fa-<?php echo $item['categoria'] === 'fortaleza' ? 'chess-rook' : ($item['categoria'] === 'natural' ? 'tree' : ($item['categoria'] === 'comercial' ? 'store' : 'hammer')); ?> text-dark" style="font-size: 0.9rem;"></i>
                                                </div>
                                                <div>
                                                    <strong class="text-white"><?php echo htmlspecialchars($item['nombre']); ?></strong>
                                                    <small class="text-gold d-block"><?php echo ucfirst($item['categoria']); ?></small>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="text-white"><?php echo number_format($item['total_acciones'], 4); ?></td>
                                        <td class="text-white"><?php echo number_format($item['precio_por_accion'], 4); ?> <small class="text-gold">ESF</small></td>
                                        <td class="text-white"><?php echo number_format($item['valor_actual_calculado'], 2); ?> <small class="text-gold">ESF</small></td>
                                        <td class="text-<?php echo $ganancia >= 0 ? 'success' : 'danger'; ?>">
                                            <strong><?php echo ($ganancia >= 0 ? '+' : '') . number_format($ganancia, 2); ?></strong><br>
                                            <small>(<?php echo ($gananciaPercent >= 0 ? '+' : '') . number_format($gananciaPercent, 2); ?>%)</small>
                                        </td>
                                        <td class="text-<?php echo $item['cambio_24h'] >= 0 ? 'success' : 'danger'; ?>">
                                            <strong><?php echo ($item['cambio_24h'] >= 0 ? '+' : '') . number_format($item['cambio_24h'], 2); ?>%</strong>
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-warning me-1" 
                                                    onclick="openInvestModal(<?php echo $item['terrain_id']; ?>)"
                                                    title="Invertir más">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" 
                                                    onclick="openSellModal(<?php echo $item['terrain_id']; ?>, <?php echo $item['total_acciones']; ?>)"
                                                    title="Vender">
                                                <i class="fas fa-minus"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Sidebar -->
                <div class="col-lg-4">
                    <!-- Quick Actions -->
                    <div class="glass-card p-4 mb-4">
                        <h4 class="text-gold mb-3">
                            <i class="fas fa-bolt me-2"></i>Acciones Rápidas
                        </h4>
                        <div class="text-center py-4">
                            <i class="fas fa-clock fa-3x text-gold mb-3" style="opacity: 0.6;"></i>
                            <h5 class="text-white mb-2">Próximamente</h5>
                            <p class="text-white-50">Nuevas funcionalidades en desarrollo</p>
                        </div>
                    </div>

                    <!-- Recent Transactions -->
                    <div class="glass-card p-4">
                        <h4 class="text-gold mb-3">
                            <i class="fas fa-history me-2"></i>Transacciones Recientes
                        </h4>
                        <?php if (empty($transactions)): ?>
                        <div class="text-center py-4">
                            <i class="fas fa-receipt fa-2x text-gold mb-2" style="opacity: 0.5;"></i>
                            <p class="text-white-50">No hay transacciones recientes</p>
                        </div>
                        <?php else: ?>
                        <div class="list-group list-group-flush">
                            <?php foreach (array_slice($transactions, 0, 5) as $tx): ?>
                            <div class="list-group-item bg-transparent border-gold-opacity p-3" style="border-bottom: 1px solid rgba(201, 170, 113, 0.2);">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <small class="text-white-50 d-block mb-1">
                                            <?php echo date('d/m/Y H:i', strtotime($tx['fecha_transaccion'])); ?>
                                        </small>
                                        <div class="text-white fw-bold">
                                            <?php 
                                            switch($tx['tipo']) {
                                                case 'compra_terreno':
                                                    echo '<i class="fas fa-arrow-up text-success me-2"></i><span class="text-white">Compra: ' . $tx['terrain_nombre'] . '</span>';
                                                    break;
                                                case 'venta_terreno':
                                                    echo '<i class="fas fa-arrow-down text-danger me-2"></i><span class="text-white">Venta: ' . $tx['terrain_nombre'] . '</span>';
                                                    break;
                                                case 'transferencia_esferas':
                                                    echo '<i class="fas fa-exchange-alt text-warning me-2"></i><span class="text-white">Transferencia</span>';
                                                    break;
                                                default:
                                                    echo '<i class="fas fa-circle text-info me-2"></i><span class="text-white">' . ucfirst($tx['tipo']) . '</span>';
                                            }
                                            ?>
                                        </div>
                                    </div>
                                    <div class="text-end">
                                        <?php if ($tx['cantidad_esferas'] != 0): ?>
                                        <div class="text-<?php echo $tx['cantidad_esferas'] > 0 ? 'success' : 'danger'; ?> fw-bold">
                                            <?php echo ($tx['cantidad_esferas'] > 0 ? '+' : '') . number_format($tx['cantidad_esferas'], 2); ?> ESF
                                        </div>
                                        <?php endif; ?>
                                        <?php if ($tx['cantidad_acciones'] > 0): ?>
                                        <small class="text-gold">
                                            <?php echo number_format($tx['cantidad_acciones'], 4); ?> acciones
                                        </small>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                        <div class="text-center mt-3">
                            <button class="btn btn-outline-warning btn-sm">Ver Todas</button>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Investment Modal -->
    <div class="modal fade" id="investModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content bg-card border-gold">
                <div class="modal-header border-gold-opacity">
                    <h5 class="modal-title text-gold">
                        <i class="fas fa-chart-line me-2"></i>Invertir en Terrenos
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <?php foreach ($terrains as $terrain): ?>
                        <div class="col-md-6 mb-3">
                            <div class="glass-card p-3" style="background: linear-gradient(135deg, #1a1a1a, #252525); border: 1px solid rgba(201, 170, 113, 0.3);">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="terrain-image me-3" style="width: 50px; height: 50px; background: linear-gradient(135deg, #c9aa71, #9e8b54); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                        <i class="fas fa-<?php echo $terrain['categoria'] === 'fortaleza' ? 'chess-rook' : ($terrain['categoria'] === 'natural' ? 'tree' : ($terrain['categoria'] === 'comercial' ? 'store' : 'hammer')); ?> text-dark" style="font-size: 1.5rem;"></i>
                                    </div>
                                    <div>
                                        <h6 class="text-gold mb-1 fw-bold"><?php echo htmlspecialchars($terrain['nombre']); ?></h6>
                                        <small class="text-warning"><?php echo ucfirst($terrain['categoria']); ?></small>
                                    </div>
                                </div>
                                <p class="text-white-50 small mb-3"><?php echo htmlspecialchars(substr($terrain['descripcion'], 0, 80)) . '...'; ?></p>
                                
                                <div class="mb-2">
                                    <div class="d-flex justify-content-between mb-1">
                                        <small class="text-white-50">Precio por acción:</small>
                                        <strong class="text-gold"><?php echo number_format($terrain['precio_por_accion'], 4); ?> ESF</strong>
                                    </div>
                                    <div class="d-flex justify-content-between mb-1">
                                        <small class="text-white-50">Market Cap:</small>
                                        <span class="text-white"><?php echo number_format($terrain['precio_actual'], 0); ?> ESF</span>
                                    </div>
                                    <div class="d-flex justify-content-between mb-3">
                                        <small class="text-white-50">Ubicación:</small>
                                        <span class="text-white-50"><?php echo htmlspecialchars($terrain['ubicacion']); ?></span>
                                    </div>
                                </div>
                                
                                <button class="btn btn-warning w-100" 
                                        onclick="selectTerrain(<?php echo $terrain['id']; ?>, '<?php echo htmlspecialchars($terrain['nombre']); ?>', <?php echo $terrain['precio_por_accion']; ?>)">
                                    <i class="fas fa-shopping-cart me-2"></i>Invertir
                                </button>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Transfer Modal -->
    <div class="modal fade" id="transferModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content bg-card border-gold">
                <div class="modal-header border-gold-opacity">
                    <h5 class="modal-title text-gold">
                        <i class="fas fa-exchange-alt me-2"></i>Transferir Esferas
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="transferForm">
                        <div class="mb-3">
                            <label class="form-label">Destinatario (Username)</label>
                            <input type="text" class="form-control bg-dark text-white border-gold-opacity" 
                                   id="transferRecipient" placeholder="Ingresa el username">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Cantidad de Esferas</label>
                            <input type="number" class="form-control bg-dark text-white border-gold-opacity" 
                                   id="transferAmount" placeholder="0.00" min="1" step="0.01">
                            <small class="text-muted">Disponible: <?php echo number_format($userData['recompensas'], 2); ?> ESF</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Mensaje (opcional)</label>
                            <textarea class="form-control bg-dark text-white border-gold-opacity" 
                                      id="transferMessage" rows="2" placeholder="Mensaje opcional"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer border-gold-opacity">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-warning" onclick="executeTransfer()">
                        <i class="fas fa-paper-plane me-1"></i>Transferir
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="footer mt-auto py-3 border-top border-gold-opacity">
        <div class="container-fluid">
            <div class="row align-items-center">
                <div class="col-md-6 text-center text-md-start">
                    <small class="text-muted">
                        &copy; 2024 Einherjer Blitz 3.0. Wallet Digital.
                    </small>
                </div>
                <div class="col-md-6 text-center text-md-end">
                    <small class="text-muted">
                        Usuario: <?php echo htmlspecialchars($userData['username']); ?> | 
                        Última actualización: <?php echo date('d/m/Y H:i'); ?>
                    </small>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Dashboard JS -->
    <script src="assets/js/dashboard.js"></script>
    
    <!-- Wallet JS -->
    <script src="assets/js/wallet.js"></script>
    
    <script>
        // Variables globales
        window.userData = {
            id: <?php echo $userData['id']; ?>,
            username: "<?php echo htmlspecialchars($userData['username']); ?>",
            esferas: <?php echo $userData['recompensas']; ?>,
            llaves: <?php echo $userData['llaves']; ?>
        };
    </script>
</body>
</html>

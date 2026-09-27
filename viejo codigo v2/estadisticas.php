<?php
require_once 'includes/Database.php';
require_once 'includes/version_helper.php';

$auth = new AuthController();

if (!$auth->isAuthenticated()) {
    header('Location: index.php');
    exit();
}

$userData = $auth->getUserData();
$db = Database::getInstance();

// Obtener estadísticas online del usuario
$stmt = $db->prepare("
    SELECT 
        COUNT(*) as batallas_online,
        COALESCE(SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END), 0) as victorias_online,
        COALESCE(SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END), 0) as derrotas_online,
        COALESCE(SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END), 0) as empates_online
    FROM online_match_history
    WHERE player_id = ?
");
$stmt->execute([$userData['id']]);
$onlineStats = $stmt->fetch(PDO::FETCH_ASSOC);

// Asegurar que los valores no sean null (por si acaso)
$onlineStats['batallas_online'] = intval($onlineStats['batallas_online'] ?? 0);
$onlineStats['victorias_online'] = intval($onlineStats['victorias_online'] ?? 0);
$onlineStats['derrotas_online'] = intval($onlineStats['derrotas_online'] ?? 0);
$onlineStats['empates_online'] = intval($onlineStats['empates_online'] ?? 0);

// Calcular winrates
$totalOffline = $userData['victorias'] + $userData['derrotas'];
$winrateOffline = $totalOffline > 0 ? round(($userData['victorias'] / $totalOffline) * 100, 1) : 0;

$totalOnline = $onlineStats['victorias_online'] + $onlineStats['derrotas_online'];
$winrateOnline = $totalOnline > 0 ? round(($onlineStats['victorias_online'] / $totalOnline) * 100, 1) : 0;

$totalBatallas = $totalOffline + $totalOnline;
$totalVictorias = $userData['victorias'] + $onlineStats['victorias_online'];
$totalDerrotas = $userData['derrotas'] + $onlineStats['derrotas_online'];
$winrateTotal = $totalBatallas > 0 ? round(($totalVictorias / $totalBatallas) * 100, 1) : 0;
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estadísticas - <?php echo htmlspecialchars($userData['username']); ?></title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/dashboard.css<?php echo v('assets/css/dashboard.css'); ?>">
</head>
<body class="d-flex flex-column h-100">
    <!-- Header -->
    <header class="dashboard-header">
        <div class="container-fluid">
            <div class="header-content">
                <div class="brand-section">
                    <a href="dashboard.php" class="brand-link">
                        <i class="fas fa-arrow-left me-2"></i>
                        <span>Volver al Dashboard</span>
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
                </div>
            </div>
        </div>
    </header>

    <main class="flex-grow-1">
        <div class="container-fluid py-4">
            <section class="welcome-section">
                <h1 class="welcome-title">
                    <i class="fas fa-chart-bar"></i> Estadísticas Completas
                </h1>
                <p class="welcome-subtitle">Resumen de tu desempeño en Einherjar Blitz</p>
            </section>

            <!-- Estadísticas Generales -->
            <section class="stats-grid mb-4">
                <div class="glass-card stat-card">
                    <div class="stat-icon"><i class="fas fa-gamepad"></i></div>
                    <div class="stat-value"><?php echo number_format($totalBatallas); ?></div>
                    <div class="stat-label">Batallas Totales</div>
                    <div class="stat-sublabel">Online + Offline</div>
                </div>

                <div class="glass-card stat-card">
                    <div class="stat-icon"><i class="fas fa-trophy"></i></div>
                    <div class="stat-value"><?php echo $winrateTotal; ?>%</div>
                    <div class="stat-label">Winrate Total</div>
                    <div class="stat-sublabel"><?php echo $totalVictorias; ?>W / <?php echo $totalDerrotas; ?>L</div>
                </div>

                <div class="glass-card stat-card">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-value"><?php echo number_format($userData['horas_jugadas']); ?>h</div>
                    <div class="stat-label">Horas Jugadas</div>
                    <div class="stat-sublabel">Tiempo registrado</div>
                </div>
            </section>

            <!-- Comparativa Offline vs Online -->
            <div class="row g-4 mb-4">
                <!-- Estadísticas Offline -->
                <div class="col-lg-6">
                    <div class="glass-card p-4">
                        <h3 class="text-gold mb-4">
                            <i class="fas fa-robot"></i> Modo Offline (vs IA)
                        </h3>
                        
                        <div class="row g-3">
                            <div class="col-6">
                                <div class="stat-box text-center p-3 bg-dark-subtle rounded">
                                    <div class="h2 text-success mb-1"><?php echo $userData['victorias']; ?></div>
                                    <small class="text-secondary">Victorias</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-box text-center p-3 bg-dark-subtle rounded">
                                    <div class="h2 text-danger mb-1"><?php echo $userData['derrotas']; ?></div>
                                    <small class="text-secondary">Derrotas</small>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="stat-box text-center p-3 bg-dark-subtle rounded">
                                    <div class="h2 text-warning mb-1"><?php echo $winrateOffline; ?>%</div>
                                    <small class="text-secondary">Winrate Offline</small>
                                </div>
                            </div>
                        </div>
                        
                        <div class="progress-bar-custom mt-4">
                            <div class="progress-fill bg-success" style="width: <?php echo $winrateOffline; ?>%"></div>
                        </div>
                        <div class="progress-text">
                            <span><?php echo $userData['victorias']; ?> Victorias</span>
                            <span><?php echo $userData['derrotas']; ?> Derrotas</span>
                        </div>
                    </div>
                </div>

                <!-- Estadísticas Online -->
                <div class="col-lg-6">
                    <div class="glass-card p-4">
                        <h3 class="text-gold mb-4">
                            <i class="fas fa-users"></i> Modo Online (PvP)
                        </h3>
                        
                        <div class="row g-3">
                            <div class="col-6">
                                <div class="stat-box text-center p-3 bg-dark-subtle rounded">
                                    <div class="h2 text-success mb-1"><?php echo $onlineStats['victorias_online']; ?></div>
                                    <small class="text-secondary">Victorias</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-box text-center p-3 bg-dark-subtle rounded">
                                    <div class="h2 text-danger mb-1"><?php echo $onlineStats['derrotas_online']; ?></div>
                                    <small class="text-secondary">Derrotas</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-box text-center p-3 bg-dark-subtle rounded">
                                    <div class="h2 text-info mb-1"><?php echo $onlineStats['empates_online']; ?></div>
                                    <small class="text-secondary">Empates</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="stat-box text-center p-3 bg-dark-subtle rounded">
                                    <div class="h2 text-warning mb-1"><?php echo $winrateOnline; ?>%</div>
                                    <small class="text-secondary">Winrate</small>
                                </div>
                            </div>
                        </div>
                        
                        <div class="progress-bar-custom mt-4">
                            <div class="progress-fill bg-primary" style="width: <?php echo $winrateOnline; ?>%"></div>
                        </div>
                        <div class="progress-text">
                            <span><?php echo $onlineStats['victorias_online']; ?> Victorias</span>
                            <span><?php echo $onlineStats['derrotas_online']; ?> Derrotas</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Otros Stats -->
            <div class="glass-card p-4">
                <h3 class="text-gold mb-4">
                    <i class="fas fa-crown"></i> Logros y Progresión
                </h3>
                
                <div class="row g-3">
                    <div class="col-md-3 col-6">
                        <div class="stat-box text-center p-3 bg-dark-subtle rounded">
                            <i class="fas fa-star fs-1 text-warning mb-2"></i>
                            <div class="h4 mb-1"><?php echo $userData['nivel']; ?></div>
                            <small class="text-secondary">Nivel</small>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="stat-box text-center p-3 bg-dark-subtle rounded">
                            <i class="fas fa-trophy fs-1 text-warning mb-2"></i>
                            <div class="h4 mb-1"><?php echo number_format($userData['copas']); ?></div>
                            <small class="text-secondary">Copas</small>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="stat-box text-center p-3 bg-dark-subtle rounded">
                            <i class="fas fa-skull fs-1 text-danger mb-2"></i>
                            <div class="h4 mb-1"><?php echo $userData['jefes_derrotados']; ?></div>
                            <small class="text-secondary">Jefes</small>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="stat-box text-center p-3 bg-dark-subtle rounded">
                            <i class="fas fa-dragon fs-1 text-danger mb-2"></i>
                            <div class="h4 mb-1"><?php echo $userData['megajefes_derrotados']; ?></div>
                            <small class="text-secondary">Megajefes</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>

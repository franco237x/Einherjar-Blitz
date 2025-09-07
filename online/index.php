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

// Calcular progreso del rango (arbitrario basado en copas)
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
<!DOCTYPE html>
<html lang="es" class="h-100">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modo Online - Einherjer Blitz 3.0</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Dashboard CSS (reusando estilos) -->
    <link rel="stylesheet" href="../assets/css/dashboard.css">
    
    <!-- Online Mode CSS -->
    <link rel="stylesheet" href="assets/css/online.css">
    
    <meta name="description" content="Modo Online de Einherjer Blitz 3.0 - Batalla contra otros jugadores">
    <meta name="robots" content="noindex, nofollow">
</head>
<body class="d-flex flex-column h-100">
    <!-- Header -->
    <header class="dashboard-header">
        <div class="container-fluid">
            <div class="header-content">
                <div class="brand-section">
                    <a href="../dashboard.php" class="brand-link">
                        <i class="fas fa-shield-alt"></i>
                        <span>Einherjer Blitz</span>
                    </a>
                    <span class="mode-indicator">
                        <i class="fas fa-globe"></i>
                        Modo Online
                    </span>
                </div>
                
                <div class="user-section">
                    <div class="user-info">
                        <img src="../images/<?php echo htmlspecialchars($userData['perfil_imagen']); ?>" 
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
        <div class="container-fluid py-4">
            
            <!-- Sección del Rango -->
            <section class="rank-section">
                <div class="row">
                    <div class="col-lg-4">
                        <div class="glass-card rank-display">
                            <div class="rank-image-container">
                                <img src="../images/<?php echo $rankImage; ?>" 
                                     alt="<?php echo htmlspecialchars($userData['rango']); ?>" 
                                     class="rank-image">
                                <div class="rank-glow"></div>
                            </div>
                            <h2 class="rank-title"><?php echo htmlspecialchars($userData['rango']); ?></h2>
                            <div class="rank-stats">
                                <div class="stat-item">
                                    <i class="fas fa-trophy"></i>
                                    <span><?php echo number_format($userData['copas']); ?> Copas</span>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-chart-line"></i>
                                    <span><?php echo round(($userData['victorias'] / max(1, $userData['victorias'] + $userData['derrotas'])) * 100, 1); ?>% WR</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-8">
                        <div class="glass-card rank-progress-card">
                            <h3 class="progress-title">
                                <i class="fas fa-arrow-up"></i>
                                Progreso de Rango
                            </h3>
                            
                            <div class="rank-progress-bar">
                                <div class="progress-fill" style="width: <?php echo $rankProgress['progress']; ?>%"></div>
                                <div class="progress-text">
                                    <span><?php echo number_format($rankProgress['current']); ?></span>
                                    <span><?php echo number_format($rankProgress['total']); ?></span>
                                </div>
                            </div>
                            
                            <div class="progress-info">
                                <p class="mb-2">
                                    <strong><?php echo number_format($rankProgress['needed']); ?> copas</strong> 
                                    para el siguiente rango
                                </p>
                                <div class="recent-matches">
                                    <span class="matches-label">Historial de partidas:</span>
                                    <div class="match-results">
                                        <span class="text-muted">Próximamente disponible</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Sección de Acciones Principales -->
            <section class="main-actions">
                <div class="row g-4">
                    
                    <!-- Selección de Personaje -->
                    <div class="col-lg-6">
                        <div class="glass-card character-selection disabled">
                            <div class="card-header">
                                <h3>
                                    <i class="fas fa-user-ninja"></i>
                                    Seleccionar Personaje
                                </h3>
                            </div>
                            <div class="coming-soon-content">
                                <i class="fas fa-tools fa-3x text-muted mb-3"></i>
                                <h5 class="text-muted">Próximamente</h5>
                                <p class="text-muted">La selección de personajes estará disponible pronto</p>
                            </div>
                        </div>
                    </div>

                    <!-- Búsqueda de Partida -->
                    <div class="col-lg-6">
                        <div class="glass-card match-search disabled">
                            <div class="card-header">
                                <h3>
                                    <i class="fas fa-search"></i>
                                    Buscar Partida
                                </h3>
                            </div>
                            
                            <div class="coming-soon-content">
                                <i class="fas fa-gamepad fa-3x text-muted mb-3"></i>
                                <h5 class="text-muted">Próximamente</h5>
                                <p class="text-muted">El sistema de matchmaking estará disponible pronto</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Estadísticas Online -->
            <section class="online-stats">
                <div class="row g-4">
                    <div class="col-md-3">
                        <div class="glass-card stat-card disabled">
                            <div class="stat-icon">
                                <i class="fas fa-globe"></i>
                            </div>
                            <div class="stat-value">---</div>
                            <div class="stat-label">Jugadores Online</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="glass-card stat-card disabled">
                            <div class="stat-icon">
                                <i class="fas fa-search"></i>
                            </div>
                            <div class="stat-value">---</div>
                            <div class="stat-label">Buscando Partida</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="glass-card stat-card disabled">
                            <div class="stat-icon">
                                <i class="fas fa-sword"></i>
                            </div>
                            <div class="stat-value">---</div>
                            <div class="stat-label">En Batalla</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="glass-card stat-card disabled">
                            <div class="stat-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="stat-value">---</div>
                            <div class="stat-label">Tiempo de Espera</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Elementos Estéticos -->
            <section class="aesthetic-elements">
                <div class="glass-card coming-soon-banner">
                    <div class="text-center py-4">
                        <i class="fas fa-rocket fa-4x text-gold mb-3"></i>
                        <h3 class="text-gold mb-3">Modo Online en Desarrollo</h3>
                        <p class="text-muted mb-0">
                            Estamos trabajando en traerte la mejor experiencia de juego online. 
                            ¡Mantente atento a las actualizaciones!
                        </p>
                    </div>
                </div>
            </section>

        </div>
    </main>

    <!-- Footer -->
    <footer class="footer mt-auto py-3 border-top border-gold-opacity">
        <div class="container-fluid">
            <div class="row align-items-center">
                <div class="col-md-6 text-center text-md-start">
                    <small class="text-muted">
                        &copy; 2024 Einherjer Blitz 3.0 - Modo Online
                    </small>
                </div>
                <div class="col-md-6 text-center text-md-end">
                    <small class="text-muted">
                        Ping: <span id="pingValue" class="text-muted">---</span> | 
                        Servidor: <span id="serverLocation" class="text-muted">Detectando...</span>
                    </small>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Dashboard JS -->
    <script src="../assets/js/dashboard.js"></script>
    
    <!-- Online Mode JS -->
    <script src="assets/js/online.js"></script>
    
    <!-- Variables PHP para JavaScript -->
    <script>
        window.userData = {
            username: "<?php echo htmlspecialchars($userData['username']); ?>",
            rank: "<?php echo htmlspecialchars($userData['rango']); ?>",
            cups: <?php echo $userData['copas']; ?>,
            wins: <?php echo $userData['victorias']; ?>,
            losses: <?php echo $userData['derrotas']; ?>,
            rankProgress: <?php echo $rankProgress['progress']; ?>
        };
    </script>
</body>
</html>
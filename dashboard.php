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

// Calcular winrate
$totalBattles = $userData['victorias'] + $userData['derrotas'];
$winrate = $totalBattles > 0 ? round(($userData['victorias'] / $totalBattles) * 100, 1) : 0;

// Calcular progreso del nivel
$expForNextLevel = $userData['nivel'] * 1000; // Fórmula simple para EXP necesaria
$currentExp = $userData['experiencia'] % 1000; // EXP actual en el nivel
$progressPercent = ($currentExp / 1000) * 100;
?>
<!DOCTYPE html>
<html lang="es" class="h-100">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Einherjer Blitz 3.0</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Dashboard CSS -->
    <link rel="stylesheet" href="assets/css/dashboard.css">
    
    <!-- Meta tags -->
    <meta name="description" content="Dashboard de Einherjer Blitz 3.0 - Tu centro de comando">
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

    <!-- Dashboard principal -->
    <main class="flex-grow-1">
        <div class="container-fluid py-4">
            
            <!-- Sección de bienvenida -->
            <section class="welcome-section">
                <h1 class="welcome-title">¡Bienvenido, <?php echo htmlspecialchars($userData['username']); ?>!</h1>
                <p class="welcome-subtitle"><?php echo htmlspecialchars($userData['frase']); ?></p>
            </section>

            <!-- Grid de estadísticas -->
            <section class="stats-grid">
                <div class="glass-card stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="stat-value"><?php echo number_format($userData['copas']); ?></div>
                    <div class="stat-label">Copas</div>
                    <div class="stat-sublabel">Rango: <?php echo htmlspecialchars($userData['rango']); ?></div>
                </div>

                <div class="glass-card stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-medal"></i>
                    </div>
                    <div class="stat-value"><?php echo $userData['nivel']; ?></div>
                    <div class="stat-label">Nivel</div>
                    <div class="stat-sublabel">EXP: <?php echo number_format($userData['experiencia']); ?></div>
                </div>

                <div class="glass-card stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-value"><?php echo $winrate; ?>%</div>
                    <div class="stat-label">Winrate</div>
                    <div class="stat-sublabel"><?php echo $userData['victorias']; ?>W / <?php echo $userData['derrotas']; ?>L</div>
                </div>

                <div class="glass-card stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-key"></i>
                    </div>
                    <div class="stat-value"><?php echo number_format($userData['llaves']); ?></div>
                    <div class="stat-label">Llaves</div>
                    <div class="stat-sublabel">Para cofres</div>
                </div>

                <div class="glass-card stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-globe"></i>
                    </div>
                    <div class="stat-value"><?php echo number_format($userData['recompensas']); ?></div>
                    <div class="stat-label">Esferas</div>
                    <div class="stat-sublabel">Moneda del juego</div>
                </div>

                <div class="glass-card stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-skull"></i>
                    </div>
                    <div class="stat-value"><?php echo number_format($userData['jefes_derrotados']); ?></div>
                    <div class="stat-label">Jefes Derrotados</div>
                    <div class="stat-sublabel">Mega: <?php echo $userData['megajefes_derrotados']; ?></div>
                </div>
            </section>

            <!-- Progreso del nivel -->
            <section class="progress-section glass-card">
                <div class="row align-items-center mb-3">
                    <div class="col">
                        <h3 class="progress-title mb-0">Progreso de Nivel</h3>
                    </div>
                    <div class="col-auto">
                        <span class="text-secondary">Nivel <?php echo $userData['nivel']; ?> → <?php echo $userData['nivel'] + 1; ?></span>
                    </div>
                </div>
                
                <div class="progress-bar-custom">
                    <div class="progress-fill" style="width: <?php echo $progressPercent; ?>%"></div>
                </div>
                <div class="progress-text">
                    <span><?php echo number_format($currentExp); ?> EXP</span>
                    <span><?php echo number_format(1000 - $currentExp); ?> EXP restante</span>
                </div>
            </section>

            <!-- Grid de navegación -->
            <section class="nav-grid">
                <a href="seleccion.php" class="nav-card glass-card">
                    <div class="nav-icon">
                        <i class="fas fa-gamepad"></i>
                    </div>
                    <div class="nav-title">Jugar</div>
                    <div class="nav-description">Entra en batalla</div>
                </a>

                <div class="nav-card glass-card disabled">
                    <div class="nav-icon">
                        <i class="fas fa-chart-bar"></i>
                    </div>
                    <div class="nav-title">Estadísticas</div>
                    <div class="nav-description">Próximamente</div>
                </div>

                <a href="gacha/index.php" class="nav-card glass-card">
                    <div class="nav-icon">
                        <i class="fas fa-gift"></i>
                    </div>
                    <div class="nav-title">Cofres</div>
                    <div class="nav-description">Sistema Gacha</div>
                </a>

                <div class="nav-card glass-card disabled">
                    <div class="nav-icon">
                        <i class="fas fa-store"></i>
                    </div>
                    <div class="nav-title">Tienda</div>
                    <div class="nav-description">Próximamente</div>
                </div>

                <div class="nav-card glass-card disabled">
                    <div class="nav-icon">
                        <i class="fas fa-wallet"></i>
                    </div>
                    <div class="nav-title">Wallet</div>
                    <div class="nav-description">Próximamente</div>
                </div>

                <div class="nav-card glass-card disabled">
                    <div class="nav-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="nav-title">Modo Online</div>
                    <div class="nav-description">Próximamente</div>
                </div>
            </section>

            <!-- Acciones rápidas -->
            <section class="quick-actions glass-card">
                <h3 class="quick-actions-title">Acciones Rápidas</h3>
                <div class="actions-grid">
                    <div class="action-btn disabled">
                        <i class="fas fa-exchange-alt"></i>
                        <span>Transferir</span>
                    </div>
                    <div class="action-btn disabled">
                        <i class="fas fa-scroll"></i>
                        <span>Pase de Batalla</span>
                    </div>
                    <div class="action-btn disabled">

                        <i class="fas fa-user-edit"></i>
                        <span>Editar Perfil</span>
                        </div>
                    </a>
                    <div class="action-btn disabled">
                        <i class="fas fa-dragon"></i>
                        <span>Mega Jefe</span>
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
                        &copy; 2024 Einherjer Blitz 3.0. Dashboard del Guerrero.
                    </small>
                </div>
                <div class="col-md-6 text-center text-md-end">
                    <small class="text-muted">
                        Sesión: <?php echo htmlspecialchars($userData['username']); ?> | 
                        Última conexión: <?php echo date('d/m/Y H:i'); ?>
                    </small>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Dashboard JS -->
    <script src="assets/js/dashboard.js"></script>
    
    <!-- Variables PHP para JavaScript -->
    <script>
        // Pasar datos PHP a JavaScript
        window.userData = {
            level: <?php echo $userData['nivel']; ?>,
            experience: <?php echo $userData['experiencia']; ?>,
            progressPercent: <?php echo $progressPercent; ?>,
            username: "<?php echo htmlspecialchars($userData['username']); ?>"
        };
    </script>
</body>
</html>
         
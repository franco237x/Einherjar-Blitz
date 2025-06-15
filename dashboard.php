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
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Einherjer Blitz</title>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        :root {
            --primary-gold: #c9aa71;
            --dark-gold: #9e8b54;
            --bg-dark: #0a0a0a;
            --bg-secondary: #1a1a1a;
            --bg-card: #151515;
            --text-primary: rgba(255, 255, 255, 0.95);
            --text-secondary: rgba(255, 255, 255, 0.7);
            --border-gold: rgba(201, 170, 113, 0.3);
            --glow-gold: rgba(201, 170, 113, 0.6);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-dark);
            color: var(--text-primary);
            min-height: 100vh;
        }

        /* Header moderno */
        .main-header {
            background: linear-gradient(135deg, var(--bg-secondary), #252525);
            border-bottom: 2px solid var(--border-gold);
            padding: 1rem 0;
            position: sticky;
            top: 0;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 2rem;
        }

        .logo {
            font-family: 'Cinzel', serif;
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--primary-gold);
            text-decoration: none;
        }

        .user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid var(--primary-gold);
            object-fit: cover;
        }

        .user-details h4 {
            margin: 0;
            color: var(--text-primary);
            font-size: 1rem;
        }

        .user-details p {
            margin: 0;
            color: var(--text-secondary);
            font-size: 0.85rem;
        }

        .logout-btn {
            background: none;
            border: 1px solid var(--border-gold);
            color: var(--text-secondary);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .logout-btn:hover {
            background: rgba(201, 170, 113, 0.1);
            color: var(--primary-gold);
        }

        /* Dashboard principal */
        .dashboard {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }

        .welcome-section {
            text-align: center;
            margin-bottom: 3rem;
        }

        .welcome-title {
            font-family: 'Cinzel', serif;
            font-size: 2.5rem;
            color: var(--primary-gold);
            margin-bottom: 1rem;
        }

        .welcome-subtitle {
            color: var(--text-secondary);
            font-size: 1.1rem;
        }

        /* Grid de estadísticas */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }

        .stat-card {
            background: var(--bg-card);
            border: 1px solid var(--border-gold);
            border-radius: 15px;
            padding: 2rem;
            text-align: center;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--primary-gold), transparent);
            opacity: 0.6;
        }

        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(201, 170, 113, 0.2);
        }

        .stat-icon {
            font-size: 2.5rem;
            color: var(--primary-gold);
            margin-bottom: 1rem;
        }

        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
        }

        .stat-label {
            color: var(--text-secondary);
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .stat-sublabel {
            color: var(--text-secondary);
            font-size: 0.8rem;
            margin-top: 0.5rem;
        }

        /* Grid de navegación */
        .nav-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }

        .nav-card {
            background: var(--bg-card);
            border: 1px solid var(--border-gold);
            border-radius: 15px;
            padding: 2rem;
            text-align: center;
            text-decoration: none;
            color: var(--text-primary);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .nav-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--primary-gold), transparent);
            opacity: 0.6;
        }

        .nav-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(201, 170, 113, 0.2);
            color: var(--text-primary);
            text-decoration: none;
        }

        .nav-icon {
            font-size: 2rem;
            color: var(--primary-gold);
            margin-bottom: 1rem;
        }

        .nav-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .nav-description {
            color: var(--text-secondary);
            font-size: 0.85rem;
        }

        /* Sección de progreso */
        .progress-section {
            background: var(--bg-card);
            border: 1px solid var(--border-gold);
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 3rem;
        }

        .progress-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        .progress-title {
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            color: var(--primary-gold);
        }

        .progress-bar-custom {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            height: 20px;
            overflow: hidden;
            margin-bottom: 1rem;
            position: relative;
        }

        .progress-fill {
            background: linear-gradient(90deg, var(--primary-gold), var(--dark-gold));
            height: 100%;
            border-radius: 10px;
            transition: width 1s ease;
            position: relative;
        }

        .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            animation: progressShine 2s ease-in-out infinite;
        }

        @keyframes progressShine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        .progress-text {
            display: flex;
            justify-content: space-between;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        /* Disabled nav cards */
        .nav-card.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }

        .nav-card.disabled:hover {
            transform: none;
            box-shadow: none;
        }

        .nav-card.disabled .nav-icon {
            color: var(--text-secondary);
        }

        /* Quick actions */
        .quick-actions {
            background: var(--bg-card);
            border: 1px solid var(--border-gold);
            border-radius: 15px;
            padding: 2rem;
        }

        .quick-actions-title {
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            color: var(--primary-gold);
            margin-bottom: 1.5rem;
            text-align: center;
        }

        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
        }

        .action-btn {
            background: rgba(201, 170, 113, 0.1);
            border: 1px solid var(--border-gold);
            color: var(--text-primary);
            padding: 1rem;
            border-radius: 10px;
            text-decoration: none;
            text-align: center;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
        }

        .action-btn:hover {
            background: rgba(201, 170, 113, 0.2);
            color: var(--text-primary);
            transform: translateY(-2px);
        }

        .action-btn i {
            font-size: 1.5rem;
            color: var(--primary-gold);
        }

        .action-btn.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }

        .action-btn.disabled:hover {
            transform: none;
            background: rgba(201, 170, 113, 0.1);
        }

        .action-btn.disabled i {
            color: var(--text-secondary);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }

            .dashboard {
                padding: 1rem;
            }

            .welcome-title {
                font-size: 2rem;
            }

            .stats-grid,
            .nav-grid {
                grid-template-columns: 1fr;
            }

            .progress-header {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="main-header">
        <div class="header-content">
            <a href="dashboard.php" class="logo">Einherjer Blitz</a>
            
            <div class="user-info">
                <img src="images/<?php echo htmlspecialchars($userData['perfil_imagen']); ?>" 
                     alt="Avatar" class="user-avatar">
                <div class="user-details">
                    <h4><?php echo htmlspecialchars($userData['username']); ?></h4>
                    <p><?php echo htmlspecialchars($userData['rango']); ?></p>
                </div>
                <button class="logout-btn" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Salir
                </button>
            </div>
        </div>
    </header>

    <!-- Dashboard principal -->
    <main class="dashboard">
        <!-- Sección de bienvenida -->
        <section class="welcome-section">
            <h1 class="welcome-title">¡Bienvenido, <?php echo htmlspecialchars($userData['username']); ?>!</h1>
            <p class="welcome-subtitle"><?php echo htmlspecialchars($userData['frase']); ?></p>
        </section>

        <!-- Grid de estadísticas -->
        <section class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="stat-value"><?php echo number_format($userData['copas']); ?></div>
                <div class="stat-label">Copas</div>
                <div class="stat-sublabel">Rango: <?php echo htmlspecialchars($userData['rango']); ?></div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-medal"></i>
                </div>
                <div class="stat-value"><?php echo $userData['nivel']; ?></div>
                <div class="stat-label">Nivel</div>
                <div class="stat-sublabel">EXP: <?php echo number_format($userData['experiencia']); ?></div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-value"><?php echo $winrate; ?>%</div>
                <div class="stat-label">Winrate</div>
                <div class="stat-sublabel"><?php echo $userData['victorias']; ?>W / <?php echo $userData['derrotas']; ?>L</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-key"></i>
                </div>
                <div class="stat-value"><?php echo number_format($userData['llaves']); ?></div>
                <div class="stat-label">Llaves</div>
                <div class="stat-sublabel">Para cofres</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-globe"></i>
                </div>
                <div class="stat-value"><?php echo number_format($userData['recompensas']); ?></div>
                <div class="stat-label">Esferas</div>
                <div class="stat-sublabel">Moneda del juego</div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-skull"></i>
                </div>
                <div class="stat-value"><?php echo number_format($userData['jefes_derrotados']); ?></div>
                <div class="stat-label">Jefes Derrotados</div>
                <div class="stat-sublabel">Mega: <?php echo $userData['megajefes_derrotados']; ?></div>
            </div>
        </section>

        <!-- Progreso del nivel -->
        <section class="progress-section">
            <div class="progress-header">
                <h3 class="progress-title">Progreso de Nivel</h3>
                <span class="text-secondary">Nivel <?php echo $userData['nivel']; ?> → <?php echo $userData['nivel'] + 1; ?></span>
            </div>
            
            <?php
            $expForNextLevel = $userData['nivel'] * 1000; // Fórmula simple para EXP necesaria
            $currentExp = $userData['experiencia'] % 1000; // EXP actual en el nivel
            $progressPercent = ($currentExp / 1000) * 100;
            ?>
            
            <div class="progress-bar-custom">
                <div class="progress-fill" style="width: <?php echo $progressPercent; ?>%"></div>
            </div>
            <div class="progress-text">
                <span><?php echo number_format($currentExp); ?> EXP</span>
                <span><?php echo number_format(1000 - $currentExp); ?> EXP restante</span>
            </div>
        </section>        <!-- Grid de navegación -->
        <section class="nav-grid">            <a href="seleccion.php" class="nav-card">
                <div class="nav-icon">
                    <i class="fas fa-gamepad"></i>
                </div>
                <div class="nav-title">Jugar</div>
                <div class="nav-description">Entra en batalla</div>
            </a>

            <div class="nav-card disabled">
                <div class="nav-icon">
                    <i class="fas fa-chart-bar"></i>
                </div>
                <div class="nav-title">Estadísticas</div>
                <div class="nav-description">Próximamente</div>
            </div>

            <div class="nav-card disabled">
                <div class="nav-icon">
                    <i class="fas fa-gift"></i>
                </div>
                <div class="nav-title">Cofres</div>
                <div class="nav-description">Próximamente</div>
            </div>

            <div class="nav-card disabled">
                <div class="nav-icon">
                    <i class="fas fa-store"></i>
                </div>
                <div class="nav-title">Tienda</div>
                <div class="nav-description">Próximamente</div>
            </div>

            <div class="nav-card disabled">
                <div class="nav-icon">
                    <i class="fas fa-wallet"></i>
                </div>
                <div class="nav-title">Wallet</div>
                <div class="nav-description">Próximamente</div>
            </div>

            <div class="nav-card disabled">
                <div class="nav-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="nav-title">Modo Online</div>
                <div class="nav-description">Próximamente</div>
            </div>
        </section>        <!-- Acciones rápidas -->
        <section class="quick-actions">
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
                <a href="actualizar_avatar.php" class="action-btn">
                    <i class="fas fa-user-edit"></i>
                    <span>Editar Perfil</span>
                </a>
                <div class="action-btn disabled">
                    <i class="fas fa-dragon"></i>
                    <span>Mega Jefe</span>
                </div>
            </div>
        </section>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Función de logout
        async function logout() {
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                try {
                    const response = await fetch('logout.php', {
                        method: 'POST'
                    });
                    
                    if (response.ok) {
                        window.location.href = 'index.php';
                    }
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                    // Redirigir de todas formas
                    window.location.href = 'index.php';
                }
            }
        }

        // Animaciones al cargar
        document.addEventListener('DOMContentLoaded', function() {
            // Animar las tarjetas de estadísticas
            const statCards = document.querySelectorAll('.stat-card');
            statCards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    card.style.transition = 'all 0.6s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });

            // Animar la barra de progreso
            setTimeout(() => {
                const progressFill = document.querySelector('.progress-fill');
                if (progressFill) {
                    progressFill.style.width = '0%';
                    setTimeout(() => {
                        progressFill.style.transition = 'width 1.5s ease';
                        progressFill.style.width = '<?php echo $progressPercent; ?>%';
                    }, 500);
                }
            }, 800);
        });

        // Efecto de hover para las tarjetas
        document.querySelectorAll('.stat-card, .nav-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    </script>
</body>
</html>

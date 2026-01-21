<?php
require_once 'includes/Database.php';
require_once 'includes/version_helper.php';
require_once 'includes/Security.php';

$auth = new AuthController();
$security = Security::getInstance();

// Establecer headers de seguridad
$security->setSecurityHeaders();

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
$expForNextLevel = $userData['nivel'] * 1000;
$currentExp = $userData['experiencia'] % 1000;
$progressPercent = ($currentExp / 1000) * 100;

// Notificaciones (placeholder - puedes implementar sistema real)
$notificationCount = 0; // Cambiar cuando implementes notificaciones reales
?>
<!DOCTYPE html>
<html lang="es" class="h-100">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Dashboard - Einherjer Blitz</title>

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
        rel="stylesheet">

    <!-- Dashboard CSS -->
    <link rel="stylesheet" href="assets/css/dashboard.css<?php echo v('assets/css/dashboard.css'); ?>">

    <!-- Meta tags -->
    <meta name="description" content="Dashboard de Einherjer Blitz">
    <meta name="robots" content="noindex, nofollow">
    <meta name="theme-color" content="#0a0a0a">

    <!-- PWA -->
    <link rel="manifest" href="manifest.json">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="favicon.png">
</head>

<body class="d-flex flex-column h-100">
    <!-- Partículas de fondo -->
    <div class="dashboard-particles" id="particles"></div>

    <!-- Header -->
    <header class="dashboard-header">
        <div class="container-fluid px-3 px-md-4">
            <div class="header-content">
                <div class="brand-section">
                    <a href="dashboard.php" class="brand-link">
                        <i class="fas fa-shield-alt"></i>
                        <span class="d-none d-sm-inline">Einherjer Blitz</span>
                        <span class="d-sm-none">EB</span>
                    </a>
                </div>

                <div class="user-section">
                    <!-- Notification Bell -->
                    <button class="notification-btn" onclick="showNotifications()" aria-label="Notificaciones">
                        <i class="fas fa-bell"></i>
                        <?php if ($notificationCount > 0): ?>
                            <span
                                class="notification-badge"><?php echo $notificationCount > 9 ? '9+' : $notificationCount; ?></span>
                        <?php endif; ?>
                    </button>

                    <!-- User Avatar with Level Badge -->
                    <div class="user-avatar-wrapper">
                        <img src="images/<?php echo htmlspecialchars($userData['perfil_imagen']); ?>" alt="Avatar"
                            class="user-avatar" id="headerAvatar">
                        <span class="level-badge" id="levelBadge"><?php echo $userData['nivel']; ?></span>
                    </div>

                    <!-- User Info (visible on tablet+) -->
                    <div class="user-info">
                        <div class="user-details">
                            <h4><?php echo htmlspecialchars($userData['username']); ?></h4>
                            <p><?php echo htmlspecialchars($userData['rango']); ?></p>
                        </div>
                    </div>

                    <!-- Logout Button -->
                    <button class="logout-btn" onclick="logout()" aria-label="Cerrar sesión">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Dashboard principal -->
    <main class="flex-grow-1">
        <div class="container-fluid px-3 px-md-4 py-4">

            <!-- Sección de bienvenida -->
            <section class="welcome-section">
                <h1 class="welcome-title">¡Bienvenido, <?php echo htmlspecialchars($userData['username']); ?>!</h1>
                <p class="welcome-subtitle"><?php echo htmlspecialchars($userData['frase']); ?></p>
            </section>

            <!-- Grid de estadísticas -->
            <section class="stats-grid">
                <div class="stat-card" onclick="navigateTo('estadisticas.php')">
                    <div class="stat-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="stat-value"><?php echo number_format($userData['copas']); ?></div>
                    <div class="stat-label">Copas</div>
                    <div class="stat-sublabel"><?php echo htmlspecialchars($userData['rango']); ?></div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-medal"></i>
                    </div>
                    <div class="stat-value"><?php echo $userData['nivel']; ?></div>
                    <div class="stat-label">Nivel</div>
                    <div class="stat-sublabel"><?php echo number_format($userData['experiencia']); ?> EXP</div>
                </div>

                <div class="stat-card" onclick="navigateTo('estadisticas.php')">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-value"><?php echo $winrate; ?>%</div>
                    <div class="stat-label">Winrate</div>
                    <div class="stat-sublabel"><?php echo $userData['victorias']; ?>W /
                        <?php echo $userData['derrotas']; ?>L
                    </div>
                </div>

                <div class="stat-card" onclick="navigateTo('gacha/index.php')">
                    <div class="stat-icon">
                        <i class="fas fa-key"></i>
                    </div>
                    <div class="stat-value"><?php echo number_format($userData['llaves']); ?></div>
                    <div class="stat-label">Llaves</div>
                    <div class="stat-sublabel">Para cofres</div>
                </div>

                <div class="stat-card" onclick="navigateTo('tienda/tienda.php')">
                    <div class="stat-icon">
                        <i class="fas fa-globe"></i>
                    </div>
                    <div class="stat-value"><?php echo number_format($userData['recompensas']); ?></div>
                    <div class="stat-label">Esferas</div>
                    <div class="stat-sublabel">Moneda del juego</div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-value"><?php echo number_format($userData['horas_jugadas']); ?>h</div>
                    <div class="stat-label">Horas</div>
                    <div class="stat-sublabel">Tiempo total</div>
                </div>
            </section>

            <!-- Progreso del nivel -->
            <section class="progress-section glass-card">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h3 class="progress-title mb-0">Progreso de Nivel</h3>
                    <span class="text-secondary small">Nivel <?php echo $userData['nivel']; ?> →
                        <?php echo $userData['nivel'] + 1; ?></span>
                </div>

                <div class="progress-bar-custom">
                    <div class="progress-fill" style="width: <?php echo $progressPercent; ?>%"></div>
                </div>
                <div class="progress-text">
                    <span><?php echo number_format($currentExp); ?> EXP</span>
                    <span><?php echo number_format(1000 - $currentExp); ?> restante</span>
                </div>
            </section>

            <!-- Grid de navegación -->
            <section class="nav-grid">
                <a href="seleccion.php" class="nav-card">
                    <div class="nav-icon">
                        <i class="fas fa-gamepad"></i>
                    </div>
                    <div class="nav-title">Jugar</div>
                    <div class="nav-description">Entra en batalla</div>
                </a>

                <a href="estadisticas.php" class="nav-card">
                    <div class="nav-icon">
                        <i class="fas fa-chart-bar"></i>
                    </div>
                    <div class="nav-title">Estadísticas</div>
                    <div class="nav-description">Ver detalle</div>
                </a>

                <a href="gacha/index.php" class="nav-card">
                    <div class="nav-icon">
                        <i class="fas fa-gift"></i>
                    </div>
                    <div class="nav-title">Cofres</div>
                    <div class="nav-description">Sistema Gacha</div>
                </a>

                <a href="tienda/tienda.php" class="nav-card">
                    <div class="nav-icon">
                        <i class="fas fa-store"></i>
                    </div>
                    <div class="nav-title">Tienda</div>
                    <div class="nav-description">Compra objetos</div>
                </a>

                <a href="conversion.php" class="nav-card">
                    <div class="nav-icon">
                        <i class="fas fa-sync"></i>
                    </div>
                    <div class="nav-title">Conversión</div>
                    <div class="nav-description">Llaves ↔ Esferas</div>
                </a>

                <a href="online/index.php" class="nav-card">
                    <div class="nav-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="nav-title">Online</div>
                    <div class="nav-description">Juega con amigos</div>
                </a>

                <a href="AR-12/index.php" class="nav-card nav-card-cosmic">
                    <div class="nav-icon">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="nav-title">AR-12 Chat</div>
                    <div class="nav-description">Asistente IA</div>
                </a>
            </section>

            <!-- Acciones rápidas -->
            <section class="quick-actions glass-card">
                <h3 class="quick-actions-title">Acciones Rápidas</h3>
                <div class="actions-grid">
                    <a href="transferir.php" class="action-btn">
                        <i class="fas fa-exchange-alt"></i>
                        <span>Transferir</span>
                    </a>
                    <button class="action-btn" onclick="openProfileModal()">
                        <i class="fas fa-user-edit"></i>
                        <span>Perfil</span>
                    </button>
                    <div class="action-btn disabled" title="Próximamente">
                        <i class="fas fa-dragon"></i>
                        <span>Mega Jefe</span>
                    </div>
                </div>
            </section>
        </div>
    </main>

    <!-- Bottom Navigation (Mobile) -->
    <nav class="bottom-nav d-md-none">
        <a href="seleccion.php" class="bottom-nav-item">
            <i class="fas fa-gamepad"></i>
            <span>Jugar</span>
        </a>
        <a href="gacha/index.php" class="bottom-nav-item">
            <i class="fas fa-gift"></i>
            <span>Cofres</span>
        </a>
        <a href="dashboard.php" class="bottom-nav-item active">
            <i class="fas fa-home"></i>
            <span>Inicio</span>
        </a>
        <a href="tienda/tienda.php" class="bottom-nav-item">
            <i class="fas fa-store"></i>
            <span>Tienda</span>
        </a>
        <button class="bottom-nav-item" onclick="openProfileModal()">
            <i class="fas fa-user"></i>
            <span>Perfil</span>
        </button>
    </nav>

    <!-- Footer (hidden on mobile when bottom nav is visible) -->
    <footer class="footer mt-auto py-3 d-none d-md-block">
        <div class="container-fluid px-4">
            <div class="row align-items-center">
                <div class="col-md-6 text-center text-md-start">
                    <small class="text-muted">
                        &copy; 2026 Einherjer Blitz.
                    </small>
                </div>
                <div class="col-md-6 text-center text-md-end">
                    <small class="text-muted">
                        Sesión: <?php echo htmlspecialchars($userData['username']); ?> |
                        <?php echo date('d/m/Y H:i'); ?>
                    </small>
                </div>
            </div>
        </div>
    </footer>

    <!-- Keyboard Shortcuts Hint (Desktop only) -->
    <div class="keyboard-hint" id="keyboardHint">
        <kbd>J</kbd> Jugar
        <kbd>T</kbd> Tienda
        <kbd>G</kbd> Cofres
    </div>

    <!-- Modal de Editar Perfil -->
    <div class="modal fade" id="profileModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
            <div class="modal-content bg-dark border-gold">
                <div class="modal-header border-gold-opacity">
                    <h5 class="modal-title text-gold">
                        <i class="fas fa-user-edit me-2"></i>Editar Perfil
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <!-- Avatar Selection -->
                    <div class="mb-4">
                        <label class="form-label text-gold">Selecciona tu Avatar</label>
                        <div class="avatar-grid" id="avatarGrid">
                            <?php
                            $avatars = [
                                ['file' => 'default.jpg', 'name' => 'Default'],
                                ['file' => 'nathan.png', 'name' => 'Nathan'],
                                ['file' => 'ozen.jpg', 'name' => 'Ozen'],
                                ['file' => 'raiden.jpeg', 'name' => 'Raiden'],
                                ['file' => 'shuna.jpg', 'name' => 'Shuna'],
                                ['file' => 'xair.png', 'name' => 'Xair'],
                                ['file' => 'yozora.jpeg', 'name' => 'Yozora'],
                                ['file' => 'zack.jpg', 'name' => 'Zack'],
                                ['file' => 'kuaidul.jpg', 'name' => 'Kuaidul']
                            ];

                            foreach ($avatars as $avatar) {
                                $isActive = $avatar['file'] === $userData['perfil_imagen'] ? 'active' : '';
                                echo '<div class="avatar-option ' . $isActive . '" data-avatar="' . $avatar['file'] . '" onclick="selectAvatar(this)">';
                                echo '<img src="images/' . $avatar['file'] . '" alt="' . $avatar['name'] . '">';
                                echo '<span>' . $avatar['name'] . '</span>';
                                echo '</div>';
                            }
                            ?>
                        </div>
                    </div>

                    <!-- Phrase Input -->
                    <div class="mb-3">
                        <label for="phraseInput" class="form-label text-gold">Tu Frase Personal</label>
                        <input type="text" class="form-control bg-dark-subtle text-light border-gold-opacity"
                            id="phraseInput" maxlength="100" value="<?php echo htmlspecialchars($userData['frase']); ?>"
                            placeholder="Escribe tu frase...">
                        <div class="form-text text-secondary">
                            <span id="charCount"><?php echo strlen($userData['frase']); ?></span>/100 caracteres
                        </div>
                    </div>

                    <!-- Preview Section -->
                    <div class="profile-preview p-3">
                        <h6 class="text-gold mb-2">Vista Previa</h6>
                        <div class="d-flex align-items-center">
                            <img id="previewAvatar"
                                src="images/<?php echo htmlspecialchars($userData['perfil_imagen']); ?>" alt="Preview"
                                class="rounded-circle me-3"
                                style="width: 60px; height: 60px; object-fit: cover; border: 2px solid var(--primary-gold);">
                            <div>
                                <h5 class="mb-1 text-light"><?php echo htmlspecialchars($userData['username']); ?></h5>
                                <p class="mb-0 text-secondary small" id="previewPhrase">
                                    <?php echo htmlspecialchars($userData['frase']); ?>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-gold-opacity">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-gold" onclick="saveProfile()" id="saveProfileBtn">
                        <i class="fas fa-save me-1"></i>Guardar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

    <!-- Dashboard JS -->
    <script src="assets/js/dashboard.js<?php echo v('assets/js/dashboard.js'); ?>"></script>

    <!-- Variables PHP para JavaScript -->
    <script>
        window.userData = {
            level: <?php echo $userData['nivel']; ?>,
            experience: <?php echo $userData['experiencia']; ?>,
            progressPercent: <?php echo $progressPercent; ?>,
            username: "<?php echo htmlspecialchars($userData['username']); ?>",
            avatar: "<?php echo htmlspecialchars($userData['perfil_imagen']); ?>",
            phrase: "<?php echo htmlspecialchars(addslashes($userData['frase'])); ?>"
        };
    </script>
</body>

</html>
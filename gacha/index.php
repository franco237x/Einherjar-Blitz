<?php
require_once '../includes/Database.php';
require_once '../includes/version_helper.php';

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

// Inicializar conexión a BD
$database = Database::getInstance();
$conn = $database->getConnection();
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gacha | Einherjer Blitz 3.0</title>

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- Google Fonts -->
    <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap"
        rel="stylesheet">

    <!-- Gacha CSS -->
    <link rel="stylesheet" href="assets/css/gacha.css<?php echo v('gacha/assets/css/gacha.css'); ?>">
</head>

<body class="gacha-page">

    <!-- Particles Background -->
    <div class="particles-bg" id="particles"></div>

    <!-- Header -->
    <header class="gacha-header">
        <div class="container">
            <div class="brand-section">
                <a href="../dashboard.php" class="back-btn">
                    <i class="fas fa-arrow-left"></i>
                </a>
                <h1 class="page-title">
                    <i class="fas fa-gift me-2"></i>Sistema Gacha
                </h1>
            </div>

            <div class="header-actions d-flex align-items-center gap-3">
                <div class="user-resources">
                    <div class="resource">
                        <i class="fas fa-key"></i>
                        <span id="keysCount"><?php echo number_format($userData['llaves']); ?></span>
                    </div>
                    <div class="resource">
                        <i class="fas fa-globe"></i>
                        <span><?php echo number_format($userData['recompensas']); ?></span>
                    </div>
                </div>
                <a href="claim_rewards.php" class="btn btn-sm fw-bold d-flex align-items-center gap-2"
                    style="background: var(--primary-gold); border: 1px solid var(--border-gold); color: #1a1a1a; padding: 0.5rem 1rem; border-radius: 2rem;">
                    <i class="fas fa-gift"></i>
                    <span>Reclamar</span>
                </a>
            </div>
        </div>
    </header>

    <?php
    // Fetch recent history
    $stmt = $conn->prepare("SELECT * FROM recompensas_usuario WHERE user_id = ? ORDER BY fecha_obtencion DESC LIMIT 5");
    $stmt->execute([$userData['id']]);
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (!$history)
        $history = [];
    ?>

    <!-- Main Content -->
    <main class="gacha-main">
        <div class="container">

            <!-- Chest Grid -->
            <div class="chest-grid">

                <!-- Terrains Chest -->
                <div class="chest-card terrains" onclick="openChest('terrains', 25)">
                    <img src="assets/images/banners/terrains-banner.jpg" alt="Terrains Banner" class="chest-banner-img">
                    <div class="chest-overlay"></div>

                    <div class="chest-badge">
                        <i class="fas fa-mountain"></i>
                        <span>Terrenos</span>
                    </div>
                    <div class="chest-cost">
                        <i class="fas fa-key"></i>
                        <span>25</span>
                    </div>

                    <div class="chest-icon-float">
                        <i class="fas fa-mountain"></i>
                    </div>

                    <div class="chest-info">
                        <h3 class="chest-name">Cofre de Terrenos</h3>
                        <p class="chest-desc">Terrenos únicos e irrepetibles</p>
                        <button class="btn-open">
                            <i class="fas fa-unlock-alt me-2"></i>Abrir Cofre
                        </button>
                    </div>
                </div>

                <!-- Elden/Souls Chest -->
                <div class="chest-card elden-souls" onclick="openChest('elden_souls', 5)">
                    <img src="assets/images/banners/elden-souls-banner.jpg" alt="Elden Souls Banner"
                        class="chest-banner-img">
                    <div class="chest-overlay"></div>

                    <div class="chest-badge">
                        <i class="fas fa-fire"></i>
                        <span>Elden/Souls</span>
                    </div>
                    <div class="chest-cost">
                        <i class="fas fa-key"></i>
                        <span>5</span>
                    </div>

                    <div class="chest-icon-float">
                        <i class="fas fa-fire"></i>
                    </div>

                    <div class="chest-info">
                        <h3 class="chest-name">Cofre Elden Ring / Dark Souls</h3>
                        <p class="chest-desc">Invocaciones y armas legendarias</p>
                        <button class="btn-open">
                            <i class="fas fa-unlock-alt me-2"></i>Abrir Cofre
                        </button>
                    </div>
                </div>

            </div>

            <!-- History Section -->
            <section class="history-section">
                <h3>
                    <i class="fas fa-history me-2"></i>Aperturas Recientes
                </h3>
                <div id="historyList"></div>
            </section>

        </div>
    </main>

    <!-- Gacha Modal - Full Screen for Epic Animation -->
    <div class="gacha-overlay" id="gachaOverlay">
        <div class="gacha-animation-container" id="animationContainer">
            <!-- Dynamic content -->
        </div>
    </div>

    <!-- Footer -->
    <footer class="gacha-footer">
        <div class="container text-center">
            <small>© 2026 Einherjer Blitz 3.0 | <?php echo htmlspecialchars($userData['username']); ?></small>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

    <!-- GSAP for Animations -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

    <!-- User Data -->
    <script>
        window.userData = {
            keys: <?php echo $userData['llaves']; ?>,
            spheres: <?php echo $userData['recompensas']; ?>,
            username: "<?php echo htmlspecialchars($userData['username']); ?>",
            history: <?php echo json_encode($history); ?>
        };
    </script>

    <!-- Gacha JS -->
    <script src="assets/js/gacha.js<?php echo v('gacha/assets/js/gacha.js'); ?>"></script>

</body>

</html>
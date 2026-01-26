<?php
require_once '../includes/Database.php';
require_once '../includes/version_helper.php';
require_once 'config/payment.php';

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

$database = Database::getInstance();
$conn = $database->getConnection();

// Get today's ad views for this user
$today = date('Y-m-d');
$stmt = $conn->prepare("SELECT * FROM ad_views WHERE user_id = ? AND view_date = ?");
$stmt->execute([$userData['id'], $today]);
$adData = $stmt->fetch(PDO::FETCH_ASSOC);

$viewsToday = $adData ? $adData['views_count'] : 0;
$keysEarnedToday = $adData ? $adData['keys_earned'] : 0;
$progressToNextKey = $viewsToday % $monetag_config['ads_per_key'];
$maxAdsReached = $viewsToday >= $monetag_config['max_daily_ads'];
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ver Anuncios | Einherjer Blitz 3.0</title>

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

    <style>
        .ads-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }

        .progress-card {
            background: linear-gradient(145deg, rgba(30, 30, 50, 0.95), rgba(20, 20, 35, 0.98));
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 20px;
            padding: 2rem;
            text-align: center;
            margin-bottom: 2rem;
        }

        .key-progress {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin: 2rem 0;
        }

        .progress-dot {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            border: 3px solid rgba(212, 175, 55, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
        }

        .progress-dot.completed {
            background: linear-gradient(145deg, rgba(0, 212, 100, 0.3), rgba(0, 180, 80, 0.2));
            border-color: #00d464;
            color: #00d464;
            box-shadow: 0 0 20px rgba(0, 212, 100, 0.3);
        }

        .progress-dot.current {
            border-color: var(--primary-gold);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {

            0%,
            100% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4);
            }

            50% {
                transform: scale(1.05);
                box-shadow: 0 0 20px 10px rgba(212, 175, 55, 0.2);
            }
        }

        .key-reward {
            width: 80px;
            height: 80px;
            margin-left: 1rem;
            background: linear-gradient(145deg, rgba(212, 175, 55, 0.2), rgba(180, 150, 50, 0.1));
            border: 3px solid var(--primary-gold);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            color: var(--primary-gold);
        }

        .stats-row {
            display: flex;
            justify-content: center;
            gap: 3rem;
            margin-top: 1.5rem;
            flex-wrap: wrap;
        }

        .stat-item {
            text-align: center;
        }

        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary-gold);
        }

        .stat-label {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.6);
        }

        .ad-area {
            background: linear-gradient(145deg, rgba(20, 20, 35, 0.95), rgba(15, 15, 25, 0.98));
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 3rem 2rem;
            text-align: center;
            min-height: 300px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin-bottom: 2rem;
        }

        .ad-placeholder {
            width: 100%;
            max-width: 468px;
            height: 60px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px dashed rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.4);
            margin-bottom: 2rem;
        }

        .btn-watch-ad {
            background: linear-gradient(135deg, #00d464, #00a850);
            border: none;
            padding: 1rem 3rem;
            border-radius: 50px;
            color: #fff;
            font-weight: 700;
            font-size: 1.2rem;
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .btn-watch-ad:hover:not(:disabled) {
            transform: scale(1.05);
            box-shadow: 0 10px 40px rgba(0, 212, 100, 0.4);
        }

        .btn-watch-ad:disabled {
            background: linear-gradient(135deg, #666, #444);
            cursor: not-allowed;
        }

        .btn-watch-ad.loading {
            pointer-events: none;
        }

        .btn-watch-ad.loading i {
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            from {
                transform: rotate(0deg);
            }

            to {
                transform: rotate(360deg);
            }
        }

        .daily-limit-warning {
            background: linear-gradient(145deg, rgba(255, 193, 7, 0.2), rgba(200, 150, 0, 0.1));
            border: 1px solid rgba(255, 193, 7, 0.4);
            border-radius: 12px;
            padding: 1rem;
            margin-top: 1rem;
            color: #ffc107;
        }

        .key-earned-toast {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            background: linear-gradient(145deg, rgba(0, 50, 30, 0.95), rgba(0, 40, 25, 0.98));
            border: 2px solid #00d464;
            border-radius: 20px;
            padding: 2rem 3rem;
            z-index: 9999;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .key-earned-toast.show {
            transform: translate(-50%, -50%) scale(1);
        }

        .key-earned-toast .key-icon {
            font-size: 4rem;
            color: var(--primary-gold);
            margin-bottom: 1rem;
            animation: bounce 0.5s ease-in-out;
        }

        @keyframes bounce {

            0%,
            100% {
                transform: translateY(0);
            }

            50% {
                transform: translateY(-20px);
            }
        }

        .key-earned-toast h3 {
            color: #00d464;
            margin-bottom: 0.5rem;
        }

        /* Cooldown Toast */
        .cooldown-toast {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            background: linear-gradient(145deg, rgba(40, 30, 60, 0.98), rgba(30, 20, 50, 0.98));
            border: 2px solid rgba(255, 193, 7, 0.6);
            border-radius: 20px;
            padding: 2rem 3rem;
            z-index: 9999;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            min-width: 280px;
        }

        .cooldown-toast.show {
            transform: translate(-50%, -50%) scale(1);
        }

        .cooldown-toast .cooldown-icon {
            font-size: 3rem;
            color: #ffc107;
            margin-bottom: 1rem;
            animation: pulse-warning 1.5s ease-in-out infinite;
        }

        @keyframes pulse-warning {

            0%,
            100% {
                transform: scale(1);
                opacity: 1;
            }

            50% {
                transform: scale(1.1);
                opacity: 0.8;
            }
        }

        .cooldown-toast h3 {
            color: #ffc107;
            margin-bottom: 0.5rem;
            font-size: 1.2rem;
        }

        .cooldown-toast p {
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 1rem;
            font-size: 0.9rem;
        }

        .cooldown-timer {
            font-size: 2.5rem;
            font-weight: 700;
            color: #fff;
            background: rgba(255, 193, 7, 0.2);
            border-radius: 12px;
            padding: 0.5rem 1.5rem;
            display: inline-block;
        }

        .cooldown-timer span {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.5);
        }

        .toast-close {
            position: absolute;
            top: 10px;
            right: 12px;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.2s ease;
            padding: 5px;
            line-height: 1;
        }

        .toast-close:hover {
            color: #fff;
            transform: scale(1.2);
        }

        /* ===== MOBILE FIRST RESPONSIVE ===== */
        @media (max-width: 768px) {
            .ads-container {
                padding: 1rem;
            }

            .progress-card {
                padding: 1.25rem;
                border-radius: 16px;
            }

            .progress-card h2 {
                font-size: 1.1rem;
            }

            .key-progress {
                gap: 0.5rem;
                margin: 1.5rem 0;
            }

            .progress-dot {
                width: 45px;
                height: 45px;
                font-size: 1.1rem;
            }

            .key-reward {
                width: 55px;
                height: 55px;
                font-size: 1.4rem;
                margin-left: 0.5rem;
            }

            .stats-row {
                gap: 1.5rem;
            }

            .stat-value {
                font-size: 1.5rem;
            }

            .stat-label {
                font-size: 0.75rem;
            }

            .ad-area {
                padding: 2rem 1rem;
                min-height: 250px;
                border-radius: 12px;
            }

            .ad-placeholder {
                height: 50px;
                font-size: 0.85rem;
            }

            .btn-watch-ad {
                padding: 0.85rem 2rem;
                font-size: 1rem;
                border-radius: 40px;
            }

            .daily-limit-warning {
                font-size: 0.85rem;
                padding: 0.75rem;
            }

            .alt-method {
                padding: 1.25rem;
                border-radius: 12px;
            }

            .alt-method h4 {
                font-size: 0.95rem;
            }

            .alt-method p {
                font-size: 0.8rem;
            }

            .btn-buy {
                padding: 0.6rem 1.2rem;
                font-size: 0.9rem;
            }

            /* Toast mobile */
            .cooldown-toast,
            .key-earned-toast {
                width: 90%;
                max-width: 320px;
                padding: 1.5rem;
            }

            .cooldown-toast .cooldown-icon,
            .key-earned-toast .key-icon {
                font-size: 2.5rem;
            }

            .cooldown-timer {
                font-size: 2rem;
                padding: 0.4rem 1.2rem;
            }

            .gacha-header .container {
                padding: 0 1rem;
            }

            .page-title {
                font-size: 1rem;
            }
        }

        @media (max-width: 380px) {
            .progress-dot {
                width: 38px;
                height: 38px;
                font-size: 1rem;
            }

            .key-reward {
                width: 48px;
                height: 48px;
                font-size: 1.2rem;
            }

            .stats-row {
                gap: 1rem;
            }

            .stat-value {
                font-size: 1.3rem;
            }
        }

        .alt-method {
            background: linear-gradient(145deg, rgba(30, 30, 50, 0.9), rgba(20, 20, 35, 0.95));
            border: 1px solid rgba(0, 158, 227, 0.3);
            border-radius: 16px;
            padding: 1.5rem;
            text-align: center;
        }

        .alt-method h4 {
            color: #009ee3;
            margin-bottom: 0.5rem;
            font-size: 1rem;
        }

        .alt-method p {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }

        .btn-buy {
            background: linear-gradient(135deg, var(--primary-gold), #b8941f);
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            color: #1a1a1a;
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
        }

        .btn-buy:hover {
            transform: scale(1.05);
            color: #1a1a1a;
        }
    </style>
</head>

<body class="gacha-page">

    <!-- Particles Background -->
    <div class="particles-bg" id="particles"></div>

    <!-- Key Earned Toast -->
    <div class="key-earned-toast" id="keyEarnedToast">
        <div class="key-icon"><i class="fas fa-key"></i></div>
        <h3>¡Llave Obtenida!</h3>
        <p>Has ganado 1 llave gratis</p>
    </div>

    <!-- Cooldown Toast -->
    <div class="cooldown-toast" id="cooldownToast">
        <button class="toast-close" onclick="closeCooldownToast()">
            <i class="fas fa-times"></i>
        </button>
        <div class="cooldown-icon"><i class="fas fa-hourglass-half"></i></div>
        <h3>¡Espera un momento!</h3>
        <p>Podrás ver otro anuncio en</p>
        <div class="cooldown-timer"><span id="cooldownSeconds">30</span> <span>seg</span></div>
    </div>

    <!-- Header -->
    <header class="gacha-header">
        <div class="container">
            <div class="brand-section">
                <a href="index.php" class="back-btn">
                    <i class="fas fa-arrow-left"></i>
                </a>
                <h1 class="page-title">
                    <i class="fas fa-tv me-2"></i>Ver Anuncios
                </h1>
            </div>

            <div class="header-actions d-flex align-items-center gap-3">
                <div class="user-resources">
                    <div class="resource">
                        <i class="fas fa-key"></i>
                        <span id="keysCount">
                            <?php echo number_format($userData['llaves']); ?>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="gacha-main" style="padding-top: 100px;">
        <div class="ads-container">

            <!-- Progress Card -->
            <div class="progress-card">
                <h2 style="color: var(--primary-gold); margin-bottom: 0.5rem;">
                    <i class="fas fa-gift me-2"></i>Progreso hacia tu llave
                </h2>
                <p style="color: rgba(255,255,255,0.6); margin-bottom: 0;">
                    Ve
                    <?php echo $monetag_config['ads_per_key']; ?> anuncios para ganar 1 llave gratis
                </p>

                <div class="key-progress">
                    <?php for ($i = 0; $i < $monetag_config['ads_per_key']; $i++): ?>
                        <div
                            class="progress-dot <?php echo $i < $progressToNextKey ? 'completed' : ($i === $progressToNextKey ? 'current' : ''); ?>">
                            <?php if ($i < $progressToNextKey): ?>
                                <i class="fas fa-check"></i>
                            <?php else: ?>
                                <?php echo $i + 1; ?>
                            <?php endif; ?>
                        </div>
                    <?php endfor; ?>
                    <div class="key-reward">
                        <i class="fas fa-key"></i>
                    </div>
                </div>

                <div class="stats-row">
                    <div class="stat-item">
                        <div class="stat-value" id="viewsToday">
                            <?php echo $viewsToday; ?>
                        </div>
                        <div class="stat-label">Anuncios hoy</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="keysEarnedToday">
                            <?php echo $keysEarnedToday; ?>
                        </div>
                        <div class="stat-label">Llaves ganadas hoy</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">
                            <?php echo $monetag_config['max_daily_ads'] - $viewsToday; ?>
                        </div>
                        <div class="stat-label">Anuncios restantes</div>
                    </div>
                </div>
            </div>

            <!-- Ad Area -->
            <div class="ad-area">
                <?php if ($maxAdsReached): ?>
                    <i class="fas fa-clock fa-4x mb-3" style="color: rgba(255,255,255,0.3);"></i>
                    <h3 style="color: rgba(255,255,255,0.6);">Límite diario alcanzado</h3>
                    <p style="color: rgba(255,255,255,0.4);">Vuelve mañana para ver más anuncios</p>
                <?php else: ?>
                    <!-- Monetag Ad Zone - Click triggers popunder -->
                    <div class="ad-placeholder" id="adContainer">
                        <span>Haz clic en "Ver Anuncio" para continuar</span>
                    </div>

                    <button class="btn-watch-ad" id="watchAdBtn" onclick="watchAd()">
                        <i class="fas fa-play-circle"></i>
                        Ver Anuncio
                    </button>

                    <p style="color: rgba(255,255,255,0.4); margin-top: 1rem; font-size: 0.85rem;">
                        <i class="fas fa-info-circle me-1"></i>
                        Espera a que termine el anuncio para recibir tu recompensa
                    </p>
                <?php endif; ?>

                <?php if ($viewsToday >= $monetag_config['max_daily_ads'] - 5 && !$maxAdsReached): ?>
                    <div class="daily-limit-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Te quedan pocos anuncios hoy. ¡Aprovéchalos!
                    </div>
                <?php endif; ?>
            </div>

            <!-- Alternative -->
            <div class="alt-method">
                <h4><i class="fas fa-bolt me-2"></i>¿Quieres llaves al instante?</h4>
                <p>Compra paquetes de llaves con Mercado Pago o PayPal</p>
                <a href="comprar-llaves.php" class="btn-buy">
                    <i class="fas fa-shopping-cart"></i>
                    Comprar Llaves
                </a>
            </div>

        </div>
    </main>

    <!-- Footer -->
    <footer class="gacha-footer">
        <div class="container text-center">
            <small>© 2026 Einherjer Blitz 3.0 |
                <?php echo htmlspecialchars($userData['username']); ?>
            </small>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

    <!-- Monetag Script -->
    <script src="https://quge5.com/88/tag.min.js" data-zone="205584" async data-cfasync="false"></script>

    <script>
        // Configuration
        const config = {
            adsPerKey: <?php echo $monetag_config['ads_per_key']; ?>,
            maxDailyAds: <?php echo $monetag_config['max_daily_ads']; ?>,
            cooldownSeconds: <?php echo $monetag_config['cooldown_seconds']; ?>
        };

        let viewsToday = <?php echo $viewsToday; ?>;
        let keysEarnedToday = <?php echo $keysEarnedToday; ?>;
        let isWatching = false;
        let lastAdTime = 0;

        // Watch ad function
        async function watchAd() {
            if (isWatching) return;

            // Check cooldown
            const now = Date.now();
            if (now - lastAdTime < config.cooldownSeconds * 1000) {
                const remaining = Math.ceil((config.cooldownSeconds * 1000 - (now - lastAdTime)) / 1000);
                showCooldownToast(remaining);
                return;
            }

            if (viewsToday >= config.maxDailyAds) {
                showLimitToast();
                return;
            }

            isWatching = true;
            const btn = document.getElementById('watchAdBtn');
            btn.innerHTML = '<i class="fas fa-spinner"></i> Cargando anuncio...';
            btn.classList.add('loading');

            // The Monetag popunder script triggers on button click
            // Wait a moment for the ad to register, then credit the user
            setTimeout(async () => {
                // Report ad completion to server
                try {
                    const response = await fetch('api/ad-complete.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            timestamp: Date.now()
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        viewsToday = data.views_today;
                        keysEarnedToday = data.keys_earned_today;
                        lastAdTime = Date.now();

                        // Update UI
                        document.getElementById('viewsToday').textContent = viewsToday;
                        document.getElementById('keysEarnedToday').textContent = keysEarnedToday;

                        // Update remaining ads
                        const remainingEl = document.querySelector('.stats-row .stat-item:last-child .stat-value');
                        if (remainingEl) {
                            remainingEl.textContent = config.maxDailyAds - viewsToday;
                        }

                        // Update progress dots
                        updateProgressDots();

                        // Show key earned toast if applicable
                        if (data.key_earned) {
                            showKeyEarnedToast();
                            // Update keys count
                            const keysEl = document.getElementById('keysCount');
                            keysEl.textContent = parseInt(keysEl.textContent.replace(/,/g, '')) + 1;
                        }

                        // Check if max reached
                        if (viewsToday >= config.maxDailyAds) {
                            location.reload();
                        }
                    } else {
                        alert(data.message || 'Error al registrar el anuncio');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error de conexión');
                }

                btn.innerHTML = '<i class="fas fa-play-circle"></i> Ver Anuncio';
                btn.classList.remove('loading');
                isWatching = false;
            }, 2000); // Wait 2 seconds for ad popup to register
        }

        function updateProgressDots() {
            const progress = viewsToday % config.adsPerKey;
            const dots = document.querySelectorAll('.progress-dot');

            dots.forEach((dot, index) => {
                dot.classList.remove('completed', 'current');
                if (index < progress) {
                    dot.classList.add('completed');
                    dot.innerHTML = '<i class="fas fa-check"></i>';
                } else if (index === progress) {
                    dot.classList.add('current');
                    dot.textContent = index + 1;
                } else {
                    dot.textContent = index + 1;
                }
            });
        }

        function showKeyEarnedToast() {
            const toast = document.getElementById('keyEarnedToast');
            toast.classList.add('show');

            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        // Cooldown toast with countdown
        let cooldownInterval = null;
        function showCooldownToast(seconds) {
            const toast = document.getElementById('cooldownToast');
            const secondsEl = document.getElementById('cooldownSeconds');

            // Clear any existing interval
            if (cooldownInterval) clearInterval(cooldownInterval);

            secondsEl.textContent = seconds;
            toast.classList.add('show');

            // Countdown animation
            cooldownInterval = setInterval(() => {
                seconds--;
                secondsEl.textContent = seconds;

                if (seconds <= 0) {
                    clearInterval(cooldownInterval);
                    toast.classList.remove('show');
                }
            }, 1000);
        }

        // Close cooldown toast manually
        function closeCooldownToast() {
            if (cooldownInterval) clearInterval(cooldownInterval);
            document.getElementById('cooldownToast').classList.remove('show');
        }

        // Daily limit toast (reuses cooldown toast with different message)
        function showLimitToast() {
            const toast = document.getElementById('cooldownToast');
            const icon = toast.querySelector('.cooldown-icon i');
            const title = toast.querySelector('h3');
            const desc = toast.querySelector('p');
            const timer = toast.querySelector('.cooldown-timer');

            // Change content temporarily
            icon.className = 'fas fa-calendar-times';
            title.textContent = '¡Límite alcanzado!';
            desc.textContent = 'Vuelve mañana para ver más anuncios';
            timer.innerHTML = '<i class="fas fa-moon"></i>';

            toast.classList.add('show');

            setTimeout(() => {
                toast.classList.remove('show');
                // Reset content
                setTimeout(() => {
                    icon.className = 'fas fa-hourglass-half';
                    title.textContent = '¡Espera un momento!';
                    desc.textContent = 'Podrás ver otro anuncio en';
                    timer.innerHTML = '<span id="cooldownSeconds">30</span> <span>seg</span>';
                }, 400);
            }, 3000);
        }

        // Simple particle effect
        function createParticles() {
            const container = document.getElementById('particles');
            for (let i = 0; i < 30; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.cssText = `
                    position: absolute;
                    width: ${Math.random() * 4 + 2}px;
                    height: ${Math.random() * 4 + 2}px;
                    background: rgba(212, 175, 55, ${Math.random() * 0.5 + 0.2});
                    border-radius: 50%;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    animation: float ${Math.random() * 10 + 10}s linear infinite;
                `;
                container.appendChild(particle);
            }
        }
        createParticles();
    </script>

</body>

</html>
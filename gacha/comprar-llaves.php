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

// Handle status messages
$statusMessage = '';
$statusType = '';
if (isset($_GET['status'])) {
    switch ($_GET['status']) {
        case 'success':
            $statusMessage = '¡Pago completado! Tus llaves han sido acreditadas.';
            $statusType = 'success';
            break;
        case 'pending':
            $statusMessage = 'Tu pago está pendiente de confirmación.';
            $statusType = 'warning';
            break;
        case 'failure':
        case 'cancelled':
            $statusMessage = 'El pago fue cancelado o rechazado.';
            $statusType = 'error';
            break;
    }
}

// Get user's purchase history
$stmt = $conn->prepare("
    SELECT * FROM key_purchases 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 10
");
$stmt->execute([$userData['id']]);
$purchaseHistory = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprar Llaves | Einherjer Blitz 3.0</title>

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
        /* Key Purchase Page Styles */
        .packages-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .package-card {
            background: linear-gradient(145deg, rgba(30, 30, 50, 0.95), rgba(20, 20, 35, 0.98));
            border: 1px solid rgba(212, 175, 55, 0.3);
            border-radius: 16px;
            padding: 1.5rem;
            text-align: center;
            position: relative;
            transition: all 0.3s ease;
            overflow: hidden;
        }

        .package-card:hover {
            transform: translateY(-5px);
            border-color: var(--primary-gold);
            box-shadow: 0 10px 40px rgba(212, 175, 55, 0.2);
        }

        .package-card.popular {
            border-color: #00d4ff;
            box-shadow: 0 0 30px rgba(0, 212, 255, 0.2);
        }

        .package-card.popular::before {
            content: 'POPULAR';
            position: absolute;
            top: 10px;
            right: -35px;
            background: linear-gradient(90deg, #00d4ff, #0099cc);
            color: #fff;
            padding: 5px 40px;
            font-size: 0.7rem;
            font-weight: 700;
            transform: rotate(45deg);
        }

        .package-keys {
            font-size: 3rem;
            font-weight: 700;
            color: var(--primary-gold);
            line-height: 1;
            margin-bottom: 0.5rem;
        }

        .package-keys i {
            font-size: 1.5rem;
            margin-left: 0.5rem;
            vertical-align: middle;
        }

        .package-label {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 1rem;
        }

        .package-bonus {
            background: linear-gradient(90deg, rgba(0, 212, 100, 0.2), rgba(0, 180, 80, 0.1));
            border: 1px solid rgba(0, 212, 100, 0.4);
            border-radius: 20px;
            padding: 0.3rem 0.8rem;
            font-size: 0.75rem;
            color: #00d464;
            display: inline-block;
            margin-bottom: 1rem;
        }

        .package-price {
            font-size: 1.8rem;
            font-weight: 600;
            color: #fff;
            margin-bottom: 1.5rem;
        }

        .package-price span {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.6);
        }

        .payment-buttons {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .btn-mercadopago {
            background: linear-gradient(135deg, #009ee3, #00b1ea);
            border: none;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            color: #fff;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
        }

        .btn-mercadopago:hover:not(.disabled) {
            transform: scale(1.02);
            box-shadow: 0 5px 20px rgba(0, 158, 227, 0.4);
        }

        .btn-paypal {
            background: linear-gradient(135deg, #0070ba, #003087);
            border: none;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            color: #fff;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
        }

        .btn-paypal:hover:not(.disabled) {
            transform: scale(1.02);
            box-shadow: 0 5px 20px rgba(0, 112, 186, 0.4);
        }

        .btn-mercadopago.disabled,
        .btn-paypal.disabled {
            opacity: 0.6;
            cursor: not-allowed;
            filter: grayscale(30%);
        }

        .coming-soon-badge {
            background: linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(200, 150, 0, 0.1));
            border: 1px solid rgba(255, 193, 7, 0.5);
            color: #ffc107;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            font-size: 0.9rem;
        }

        .section-title {
            font-family: 'Cinzel', serif;
            font-size: 1.8rem;
            color: var(--primary-gold);
            text-align: center;
            margin-bottom: 2rem;
        }

        .section-title i {
            margin-right: 0.5rem;
        }

        .alt-method {
            background: linear-gradient(145deg, rgba(30, 30, 50, 0.9), rgba(20, 20, 35, 0.95));
            border: 1px solid rgba(0, 212, 100, 0.3);
            border-radius: 16px;
            padding: 2rem;
            text-align: center;
            max-width: 500px;
            margin: 3rem auto 0;
        }

        .alt-method h4 {
            color: #00d464;
            margin-bottom: 1rem;
        }

        .alt-method p {
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 1.5rem;
        }

        .btn-ads {
            background: linear-gradient(135deg, #00d464, #00a850);
            border: none;
            padding: 1rem 2rem;
            border-radius: 10px;
            color: #fff;
            font-weight: 600;
            font-size: 1.1rem;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
            text-decoration: none;
        }

        .btn-ads:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 25px rgba(0, 212, 100, 0.4);
            color: #fff;
        }

        .history-section {
            max-width: 800px;
            margin: 3rem auto 0;
        }

        .history-item {
            background: rgba(30, 30, 50, 0.8);
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 0.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .history-item .provider {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .history-item .provider img {
            height: 20px;
        }

        .status-approved {
            color: #00d464;
        }

        .status-pending {
            color: #ffc107;
        }

        .status-rejected {
            color: #dc3545;
        }

        .alert-floating {
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            min-width: 300px;
            animation: slideDown 0.5s ease;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }

            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
    </style>
</head>

<body class="gacha-page">

    <!-- Particles Background -->
    <div class="particles-bg" id="particles"></div>

    <!-- Status Alert -->
    <?php if ($statusMessage): ?>
        <div
            class="alert alert-<?php echo $statusType === 'success' ? 'success' : ($statusType === 'warning' ? 'warning' : 'danger'); ?> alert-floating">
            <i
                class="fas fa-<?php echo $statusType === 'success' ? 'check-circle' : ($statusType === 'warning' ? 'clock' : 'times-circle'); ?> me-2"></i>
            <?php echo $statusMessage; ?>
        </div>
    <?php endif; ?>

    <!-- Header -->
    <header class="gacha-header">
        <div class="container">
            <div class="brand-section">
                <a href="index.php" class="back-btn">
                    <i class="fas fa-arrow-left"></i>
                </a>
                <h1 class="page-title">
                    <i class="fas fa-shopping-cart me-2"></i>Comprar Llaves
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
        <div class="container">

            <h2 class="section-title">
                <i class="fas fa-gem"></i> Paquetes de Llaves
            </h2>

            <!-- Package Grid -->
            <div class="packages-grid">
                <?php foreach ($key_packages as $package): ?>
                    <div class="package-card <?php echo $package['popular'] ? 'popular' : ''; ?>">
                        <div class="package-keys">
                            <?php echo $package['keys']; ?>
                            <i class="fas fa-key"></i>
                        </div>
                        <div class="package-label">Llaves</div>

                        <?php if ($package['bonus'] > 0): ?>
                            <div class="package-bonus">
                                +
                                <?php echo $package['bonus']; ?> BONUS
                            </div>
                        <?php endif; ?>

                        <div class="package-price">
                            $
                            <?php echo number_format($package['price'], 2); ?>
                            <span>USD</span>
                        </div>

                        <div class="payment-buttons">
                            <div class="coming-soon-badge">
                                <i class="fas fa-clock me-2"></i>Próximamente
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>

            <!-- Free Alternative -->
            <div class="alt-method">
                <h4><i class="fas fa-tv me-2"></i>¿Sin dinero? ¡Obtén llaves gratis!</h4>
                <p>Ve anuncios y gana llaves. Cada 4 anuncios = 1 llave gratuita.</p>
                <a href="ver-anuncios.php" class="btn-ads">
                    <i class="fas fa-play-circle"></i>
                    Ver Anuncios
                </a>
            </div>

            <!-- Purchase History -->
            <?php if (!empty($purchaseHistory)): ?>
                <div class="history-section">
                    <h3 class="section-title" style="font-size: 1.3rem;">
                        <i class="fas fa-history"></i> Historial de Compras
                    </h3>
                    <?php foreach ($purchaseHistory as $purchase): ?>
                        <div class="history-item">
                            <div class="provider">
                                <i
                                    class="fas fa-<?php echo $purchase['payment_provider'] === 'mercadopago' ? 'credit-card' : 'paypal'; ?>"></i>
                                <span>
                                    <?php echo ucfirst($purchase['payment_provider']); ?>
                                </span>
                            </div>
                            <div>
                                <?php echo $purchase['keys_purchased'] + $purchase['bonus_keys']; ?> llaves
                            </div>
                            <div>
                                $
                                <?php echo number_format($purchase['amount_paid'], 2); ?>
                            </div>
                            <div class="status-<?php echo $purchase['status']; ?>">
                                <?php
                                switch ($purchase['status']) {
                                    case 'approved':
                                        echo '<i class="fas fa-check-circle"></i> Completado';
                                        break;
                                    case 'pending':
                                        echo '<i class="fas fa-clock"></i> Pendiente';
                                        break;
                                    case 'rejected':
                                        echo '<i class="fas fa-times-circle"></i> Rechazado';
                                        break;
                                }
                                ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

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

    <!-- Payment Scripts -->
    <script>
        // User data
        const userData = {
            userId: <?php echo $userData['id']; ?>,
            username: "<?php echo htmlspecialchars($userData['username']); ?>"
        };

        // Pay with Mercado Pago
        async function payWithMercadoPago(packageId) {
            try {
                const response = await fetch('api/mercadopago.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'create_preference',
                        package_id: packageId
                    })
                });

                const data = await response.json();

                if (data.success && data.init_point) {
                    window.location.href = data.init_point;
                } else {
                    alert(data.message || 'Error al crear el pago');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión. Intenta nuevamente.');
            }
        }

        // Pay with PayPal
        async function payWithPayPal(packageId) {
            try {
                const response = await fetch('api/paypal.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'create_order',
                        package_id: packageId
                    })
                });

                const data = await response.json();

                if (data.success && data.approval_url) {
                    window.location.href = data.approval_url;
                } else {
                    alert(data.message || 'Error al crear el pago');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión. Intenta nuevamente.');
            }
        }

        // Auto-hide alert after 5 seconds
        setTimeout(() => {
            const alert = document.querySelector('.alert-floating');
            if (alert) {
                alert.style.animation = 'slideDown 0.5s ease reverse';
                setTimeout(() => alert.remove(), 500);
            }
        }, 5000);

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
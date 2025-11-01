<?php
require_once '../includes/Database.php';

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

// ============================================
// CONFIGURACIÓN DE IMÁGENES (Cambiar aquí)
// ============================================
$logoUrl = 'https://pm1.aminoapps.com/6239/c94a7073aaf0e4feb54ca6a385c8376705a77f5b_00.jpg'; // Logo central del orbital
$iconUrl = 'https://pm1.aminoapps.com/6239/c94a7073aaf0e4feb54ca6a385c8376705a77f5b_00.jpg'; // Icono de la página (favicon)
// ============================================

$levels = [
    [
        'level' => 1,
        'title' => 'Despertar Cósmico',
        'free' => '75 Esencias Azules',
        'premium' => '125 Esencias Azules',
        'elite' => '250 Esencias Azules'
    ],
    [
        'level' => 2,
        'title' => 'Ecos del Vacío',
        'free' => 'Cofre Clasificatoria x2',
        'premium' => 'Cofre Clasificatoria x2',
        'elite' => 'Cofre Buenos Deseos x2'
    ],
    [
        'level' => 3,
        'title' => 'Ojos del Abismo',
        'free' => 'Poder Ocular: Jogan',
        'premium' => 'Poder: Terror Cósmico',
        'elite' => 'Poder: Energía de Dios (OPM)'
    ],
    [
        'level' => 4,
        'title' => 'Tesoros Oscuros',
        'free' => 'Cofre de León x1',
        'premium' => 'Cofre de León x2',
        'elite' => 'Esferas del Dragón'
    ],
    [
        'level' => 5,
        'title' => 'Resonancia del Cosmos',
        'free' => '75 Esencias Azules',
        'premium' => '125 Esencias Azules',
        'elite' => '250 Esencias Azules'
    ],
    [
        'level' => 6,
        'title' => 'Sabiduría Prohibida',
        'free' => 'Libro Legendario: Gojo Satoru',
        'premium' => 'Libro Legendario: Blast',
        'elite' => 'Libro Exclusivo: Garou Terror Cósmico'
    ],
    [
        'level' => 7,
        'title' => 'Pactos Infernales',
        'free' => 'Contrato: Demonio de la Oscuridad',
        'premium' => 'Contrato: Demonio del Cosmo',
        'elite' => 'Contrato: Demonio Motosierra'
    ],
    [
        'level' => 8,
        'title' => 'Entidades Selladas',
        'free' => 'Ser Sellado: Rey Espíritu',
        'premium' => 'Ser Sellado: Eternity',
        'elite' => 'Ser Sellado: Primer Firmamento'
    ],
    [
        'level' => 9,
        'title' => 'Poder Absoluto',
        'free' => 'Esferas del Dragón',
        'premium' => 'Esferas del Dragón',
        'elite' => 'Super Esferas del Dragón'
    ],
    [
        'level' => 10,
        'title' => 'Señores del Vacío',
        'free' => 'Invocación: Empty Void',
        'premium' => 'Invocación: Solaris',
        'elite' => 'Invocación: Dormammu'
    ],
];

$passTypes = [
    [
        'id' => 'free',
        'name' => 'Gratis',
        'price' => 'Gratis',
        'description' => 'Adéntrate en las sombras del cosmos. Desbloquea el poder del vacío y contratos con demonios que acechan en la oscuridad.',
        'benefits' => [
            'Invocación: Empty Void',
            'Poder Ocular: Jogan',
            'Libro Legendario: Gojo Satoru',
            'Contrato: Demonio de la Oscuridad'
        ]
    ],
    [
        'id' => 'premium',
        'name' => 'Premium',
        'price' => '1,250 Esencias Azules',
        'description' => 'Domina el terror cósmico. Invoca entidades estelares y sella seres de poder incalculable en tu arsenal.',
        'benefits' => [
            'Invocación: Solaris',
            'Poder: Terror Cósmico',
            'Libro Legendario: Blast',
            'Contrato: Demonio del Cosmo'
        ]
    ],
    [
        'id' => 'elite',
        'name' => 'Élite',
        'price' => '1 Sub de Kick o $5 USD',
        'description' => 'Abraza el caos absoluto del universo. Convoca a Dormammu y controla el primer firmamento. El poder definitivo te espera.',
        'benefits' => [
            'Invocación: Dormammu',
            'Poder: Energía de Dios (OPM)',
            'Libro Exclusivo: Garou Terror Cósmico',
            'Contrato: Demonio Motosierra',
            'Ser Sellado: Primer Firmamento'
        ]
    ],
];
?>
<!DOCTYPE html>
<html lang="es" class="pase-hero">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terror Cósmico - Pase de Batalla</title>
    <meta name="description" content="Adéntrate en el vacío infinito. El terror cósmico aguarda, y solo los más valientes sobrevivirán.">

    <link rel="icon" type="image/png" href="<?php echo htmlspecialchars($iconUrl); ?>">
    <link rel="apple-touch-icon" href="<?php echo htmlspecialchars($iconUrl); ?>">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;600;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/pase.css">
    <link rel="stylesheet" href="assets/css/cosmic-effects.css">
</head>
<body>
    <canvas id="nebula-background" aria-hidden="true"></canvas>
    <header class="hero-header">
        <div class="hero-overlay"></div>
        <nav class="hero-nav">
            <a href="../dashboard.php" class="nav-logo">
                <i class="fas fa-shield-alt"></i>
                <span>Einherjer Blitz</span>
            </a>
            <div class="nav-actions">
                <a href="../dashboard.php" class="btn-return">
                    <i class="fas fa-arrow-left"></i>
                    <span>Volver al Dashboard</span>
                </a>
            </div>
        </nav>
        <div class="hero-content">
            <div class="hero-copy">
                <span class="season-tag">� Terror Cósmico 2025</span>
                <h1>El Vacío Infinito</h1>
                <p>El universo tiembla ante el despertar de antiguas entidades. Contratos demoniacos, poderes prohibidos y seres sellados esperan ser liberados. ¿Te atreves a desafiar el terror del cosmos?</p>
                <div class="cta-group">
                    <a href="#pase-tipologias" class="cta-primary">Enfrentar el Vacío</a>
                    <a href="#linea-progresion" class="cta-secondary">Explorar Abismo</a>
                </div>
                <div class="hero-meta">
                    <div>
                        <span class="meta-label">Jugador</span>
                        <span class="meta-value"><?php echo htmlspecialchars($userData['username']); ?></span>
                    </div>
                    <div>
                        <span class="meta-label">Rango</span>
                        <span class="meta-value"><?php echo htmlspecialchars($userData['rango']); ?></span>
                    </div>
                    <div>
                        <span class="meta-label">Nivel Actual</span>
                        <span class="meta-value"><?php echo (int) $userData['nivel']; ?></span>
                    </div>
                </div>
            </div>
            <div class="hero-visual">
                <div class="orbital">
                    <div class="orbital-ring"></div>
                    <div class="orbital-core"></div>
                    <div class="orbital-glow"></div>
                    <div class="hero-silhouette" style="background-image: url('<?php echo htmlspecialchars($logoUrl); ?>');" aria-hidden="true"></div>
                </div>
                <div class="floating-card">
                    <span class="small-label">Premio Máximo → Nivel 10 Élite</span>
                    <h4>Invocación: Dormammu</h4>
                    <p>El señor de la dimensión oscura. Además: Primer Firmamento sellado, Garou Terror Cósmico, Demonio Motosierra y Super Esferas del Dragón.</p>
                </div>
            </div>
        </div>
    </header>

    <main>
        <section id="pase-tipologias" class="pass-types">
            <header class="section-header">
                <span class="section-kicker">Elige tu destino</span>
                <h2>Tres senderos hacia el caos</h2>
                <p>El Terror Cósmico se manifiesta en tres niveles de poder. Desde el despertar hasta el dominio absoluto del vacío.</p>
            </header>
            <div class="pass-type-grid">
                <?php foreach ($passTypes as $type): ?>
                <article class="pass-card" data-pass="<?php echo htmlspecialchars($type['id']); ?>">
                    <div class="pass-card-glow"></div>
                    <div class="pass-card-header">
                        <span class="pass-badge"><?php echo htmlspecialchars($type['name']); ?></span>
                        <span class="pass-price"><?php echo htmlspecialchars($type['price']); ?></span>
                    </div>
                    <p class="pass-description"><?php echo htmlspecialchars($type['description']); ?></p>
                    <ul class="pass-benefits">
                        <?php foreach ($type['benefits'] as $benefit): ?>
                        <li><i class="fas fa-check"></i><?php echo htmlspecialchars($benefit); ?></li>
                        <?php endforeach; ?>
                    </ul>
                    <button class="btn-select" data-pass-target="<?php echo htmlspecialchars($type['id']); ?>">
                        <span>Descubrir Poder</span>
                        <i class="fas fa-eye"></i>
                    </button>
                </article>
                <?php endforeach; ?>
            </div>
            
            <div class="purchase-info">
                <div class="info-icon">
                    <i class="fas fa-skull"></i>
                </div>
                <div class="info-content">
                    <h3>¿Cómo adquirir el poder del vacío?</h3>
                    <p>Para comprar el <strong>Pase Premium</strong> o <strong>Élite</strong>, contáctame directamente por mensaje privado. El poder cósmico será tuyo de forma inmediata tras la confirmación.</p>
                </div>
            </div>
        </section>

        <section id="linea-progresion" class="progression-trail">
            <header class="section-header">
                <span class="section-kicker">10 niveles de oscuridad</span>
                <h2>El descenso al abismo</h2>
                <p>Atraviesa los 10 niveles del terror cósmico y desbloquea poderes antiguos. Cada nivel te acerca más al vacío infinito.</p>
            </header>

            <div class="trail-wrapper">
                <div class="trail-controls">
                    <button class="trail-btn" data-direction="prev" aria-label="Nivel anterior">
                        <i class="fas fa-angle-left"></i>
                    </button>
                    <div class="trail-progress">
                        <span class="trail-progress-bar"></span>
                    </div>
                    <button class="trail-btn" data-direction="next" aria-label="Nivel siguiente">
                        <i class="fas fa-angle-right"></i>
                    </button>
                </div>

                <div class="trail-scroll" data-active-pass="elite">
                    <?php foreach ($levels as $level): ?>
                    <article class="level-card" data-level="<?php echo (int) $level['level']; ?>">
                        <div class="level-number"><?php echo str_pad($level['level'], 2, '0', STR_PAD_LEFT); ?></div>
                        <h3><?php echo htmlspecialchars($level['title']); ?></h3>
                        <div class="level-rewards">
                            <div class="reward-block" data-pass="free">
                                <span class="reward-label">Gratis</span>
                                <p><?php echo htmlspecialchars($level['free']); ?></p>
                            </div>
                            <div class="reward-block" data-pass="premium">
                                <span class="reward-label">Premium</span>
                                <p><?php echo htmlspecialchars($level['premium']); ?></p>
                            </div>
                            <div class="reward-block" data-pass="elite">
                                <span class="reward-label">Élite</span>
                                <p><?php echo htmlspecialchars($level['elite']); ?></p>
                            </div>
                        </div>
                        <div class="level-glow"></div>
                    </article>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>

        <section class="season-flux">
            <div class="flux-grid">
                <article class="flux-card">
                    <h3>👁️ Poderes Prohibidos</h3>
                    <p>Desbloquea poderes oculares legendarios como el Jogan y habilidades cósmicas que desafían las leyes del universo.</p>
                </article>
                <article class="flux-card">
                    <h3>😈 Contratos Demoniacos</h3>
                    <p>Firma pactos con demonios de la oscuridad, el cosmos y la motosierra. Su poder será tuyo, pero el precio es alto.</p>
                </article>
                <article class="flux-card">
                    <h3>🌑 Entidades Selladas</h3>
                    <p>Libera seres de inmenso poder: desde el Rey Espíritu hasta Eternity y el mismísimo Primer Firmamento.</p>
                </article>
            </div>
        </section>
    </main>

    <footer class="hero-footer">
        <div class="footer-content">
            <span>&copy; <?php echo date('Y'); ?> Einherjer Blitz. Terror Cósmico 2025.</span>
            <span>El Vacío Llama. El Abismo Espera.</span>
        </div>
    </footer>

    <script>
        window.heroPassConfig = {
            levels: <?php echo json_encode($levels, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT); ?>,
            defaultPass: 'elite'
        };
    </script>
    <script src="assets/js/pase.js" defer></script>
</body>
</html>

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
$logoUrl = 'https://pbs.twimg.com/media/F179GwUaYAELd4z.jpg'; // Logo central del orbital
$iconUrl = 'https://pbs.twimg.com/media/F179GwUaYAELd4z.jpg'; // Icono de la página (favicon)
// ============================================

$levels = [
    [
        'level' => 1,
        'title' => 'Inicio Legendario',
        'free' => '75 Esencias Azules',
        'premium' => '125 Esencias Azules',
        'elite' => '250 Esencias Azules'
    ],
    [
        'level' => 2,
        'title' => 'Cofres del Destino',
        'free' => 'Cofre Clasificatoria x2',
        'premium' => 'Cofre Clasificatoria x2',
        'elite' => 'Cofre Buenos Deseos x2'
    ],
    [
        'level' => 3,
        'title' => 'Invocaciones Épicas',
        'free' => 'Invocación: Radiance (Hollow Knight)',
        'premium' => 'Invocación: The Knight (Hollow Knight)',
        'elite' => 'Invocación: Hornet (Silksong)'
    ],
    [
        'level' => 4,
        'title' => 'Tesoros y Objetos',
        'free' => 'Cofre de León x1',
        'premium' => 'Cofre de León x2',
        'elite' => 'Esferas del Dragón'
    ],
    [
        'level' => 5,
        'title' => 'Poder Esencial',
        'free' => '75 Esencias Azules',
        'premium' => '125 Esencias Azules',
        'elite' => '250 Esencias Azules'
    ],
    [
        'level' => 6,
        'title' => 'Arsenal Legendario',
        'free' => 'Arma Legendaria: Espada Santa Excalibur (SAO)',
        'premium' => 'Arma Legendaria: True Longinus',
        'elite' => 'Arma Exclusiva: Nulificador Supremo'
    ],
    [
        'level' => 7,
        'title' => 'Sabiduría Ancestral',
        'free' => 'Libro Legendario: Rudeus Greyrat',
        'premium' => 'Libro Exclusivo: Garou Cósmico',
        'elite' => 'Libro Exclusivo: Accelerator'
    ],
    [
        'level' => 8,
        'title' => 'Objetos Raros',
        'free' => 'Objeto: Pergamino Entrenamiento Instantáneo x3',
        'premium' => 'Objeto: Extensión de Terreno',
        'elite' => 'Objeto: Dad Key'
    ],
    [
        'level' => 9,
        'title' => 'Dragones Ancestrales',
        'free' => 'Esferas del Dragón',
        'premium' => 'Esferas del Dragón',
        'elite' => 'Super Esferas del Dragón'
    ],
    [
        'level' => 10,
        'title' => 'Heroes Definitivos',
        'free' => 'Invocación: Dragon Boy (To be Hero X)',
        'premium' => 'Invocación: Queen (To be Hero X)',
        'elite' => 'Invocación: X (To be Hero)'
    ],
];

$passTypes = [
    [
        'id' => 'free',
        'name' => 'Gratis',
        'price' => 'Gratis',
        'description' => 'Acceso básico a recompensas legendarias. Perfecto para comenzar tu aventura en Einherjar Blitz.',
        'benefits' => [
            'Invocaciones de Hollow Knight',
            'Armas y libros legendarios',
            'Esferas del Dragón',
            'Cofres clasificatoria'
        ]
    ],
    [
        'id' => 'premium',
        'name' => 'Premium',
        'price' => '1,250 Esencias Azules',
        'description' => 'Mejora tus recompensas con invocaciones épicas y objetos exclusivos del universo To be Hero X.',
        'benefits' => [
            'The Knight de Hollow Knight',
            'Arma True Longinus',
            'Libro Garou Cósmico',
            'Invocación Queen (To be Hero X)'
        ]
    ],
    [
        'id' => 'elite',
        'name' => 'Élite',
        'price' => '1 Sub de Kick o $5 USD',
        'description' => 'El máximo poder. Desbloquea las mejores invocaciones, armas exclusivas y objetos únicos del juego.',
        'benefits' => [
            'Hornet de Silksong',
            'Arma Nulificador Supremo',
            'Libro Accelerator',
            'Invocación X (To be Hero)',
            'Super Esferas del Dragón'
        ]
    ],
];
?>
<!DOCTYPE html>
<html lang="es" class="pase-hero">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pase de Batalla - To be Hero X</title>
    <meta name="description" content="Descubre el Pase de Batalla To be Hero X y domina la temporada con recompensas legendarias.">

    <link rel="icon" type="image/png" href="<?php echo htmlspecialchars($iconUrl); ?>">
    <link rel="apple-touch-icon" href="<?php echo htmlspecialchars($iconUrl); ?>">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;600;700&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/pase.css">
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
                <span class="season-tag">Temporada Especial</span>
                <h1>To be Hero X</h1>
                <p>Una temporada interdimensional cargada de estilos neon, cinemáticas heroicas y recompensas que redefinen tu legado.</p>
                <div class="cta-group">
                    <a href="#pase-tipologias" class="cta-primary">Ver Tipos de Pase</a>
                    <a href="#linea-progresion" class="cta-secondary">Explorar Recompensas</a>
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
                    <span class="small-label">Recompensa Máxima → Nivel 10 Élite</span>
                    <h4>Invocación: X (To be Hero)</h4>
                    <p>Consigue al hero más poderoso de la temporada. Además: Super Esferas del Dragón, Libro Accelerator y Arma Nulificador Supremo.</p>
                </div>
            </div>
        </div>
    </header>

    <main>
        <section id="pase-tipologias" class="pass-types">
            <header class="section-header">
                <span class="section-kicker">Elige tu destino</span>
                <h2>Tres rutas hacia la leyenda</h2>
                <p>El Pase de Batalla To be Hero X se adapta a tu estilo. Todas las rutas comparten la narrativa heroica, pero cada una amplifica tu colección de forma única.</p>
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
                        <span>Preview Hero X</span>
                        <i class="fas fa-play"></i>
                    </button>
                </article>
                <?php endforeach; ?>
            </div>
            
            <div class="purchase-info">
                <div class="info-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="info-content">
                    <h3>¿Cómo adquirir tu pase?</h3>
                    <p>Para comprar el <strong>Pase Premium</strong> o <strong>Élite</strong>, contáctame directamente por mensaje privado. Los pases se activan de forma inmediata tras la confirmación del pago.</p>
                </div>
            </div>
        </section>

        <section id="linea-progresion" class="progression-trail">
            <header class="section-header">
                <span class="section-kicker">10 niveles intensos</span>
                <h2>cada ascenso desbloquea un poder diferente</h2>
                <p>Recorre la línea temporal heroica con scroll horizontal o mediante los controles cinéticos. Cada nivel revela un hito de la temporada.</p>
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
                    <h3>Cinemáticas reactivas</h3>
                    <p>Cada compra del Pase Élite desbloquea cinemáticas de entrada y finalización To be Hero X renderizadas en tiempo real, sincronizadas con tus victorias.</p>
                </article>
                <article class="flux-card">
                    <h3>Misiones generativas</h3>
                    <p>Recibe tareas dinámicas según tu estilo de juego. Completa desafíos heroicos para avanzar más rápido en la línea temporal.</p>
                </article>
                <article class="flux-card">
                    <h3>Economía sincronizada</h3>
                    <p>El Pase Premium conecta con la wallet: multiplica ganancias de terrenos temáticos y aplica boosts temporales a tus recursos.</p>
                </article>
            </div>
        </section>
    </main>

    <footer class="hero-footer">
        <div class="footer-content">
            <span>&copy; <?php echo date('Y'); ?> Einherjer Blitz. Temporada To be Hero X.</span>
            <span>Diseñado para conquistar galaxias.</span>
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

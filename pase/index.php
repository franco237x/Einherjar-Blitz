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
$logoUrl = 'https://videos.openai.com/vg-assets/assets%2Ftask_01k6yjsex7e29v63gzbny36ywq%2F1759815549_img_0.webp?se=2025-10-13T03%3A27%3A44Z&sp=r&sv=2024-08-04&sr=b&skoid=3d249c53-07fa-4ba4-9b65-0bf8eb4ea46a&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-10-12T23%3A30%3A02Z&ske=2025-10-13T03%3A35%3A02Z&sks=b&skv=2024-08-04&sig=2RW3cTv4XASAHj5QVfxekROjjKAHdbO/o1UPr6uKusk%3D&az=oaivgprodscus'; // Logo central del orbital
$iconUrl = 'https://videos.openai.com/vg-assets/assets%2Ftask_01k6yjsex7e29v63gzbny36ywq%2F1759815549_img_0.webp?se=2025-10-13T03%3A27%3A44Z&sp=r&sv=2024-08-04&sr=b&skoid=3d249c53-07fa-4ba4-9b65-0bf8eb4ea46a&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-10-12T23%3A30%3A02Z&ske=2025-10-13T03%3A35%3A02Z&sks=b&skv=2024-08-04&sig=2RW3cTv4XASAHj5QVfxekROjjKAHdbO/o1UPr6uKusk%3D&az=oaivgprodscus'; // Icono de la página (favicon)
// ============================================

$levels = [
    [
        'level' => 1,
        'title' => 'Apertura del Torneo',
        'free' => '75 Esencias Azules',
        'premium' => '125 Esencias Azules',
        'elite' => '250 Esencias Azules'
    ],
    [
        'level' => 2,
        'title' => 'Ronda Clasificatoria',
        'free' => 'Cofre Clasificatoria x2',
        'premium' => 'Cofre Clasificatoria x2',
        'elite' => 'Cofre Buenos Deseos x2'
    ],
    [
        'level' => 3,
        'title' => 'Invocaciones Legendarias',
        'free' => 'Invocación: Ash Ketchum',
        'premium' => 'Invocación: Son Goku',
        'elite' => 'Invocación: Seiya de Pegaso'
    ],
    [
        'level' => 4,
        'title' => 'Tesoros del Campeón',
        'free' => 'Cofre de León x1',
        'premium' => 'Cofre de León x2',
        'elite' => 'Esferas del Dragón'
    ],
    [
        'level' => 5,
        'title' => 'Poder de Campeones',
        'free' => '75 Esencias Azules',
        'premium' => '125 Esencias Azules',
        'elite' => '250 Esencias Azules'
    ],
    [
        'level' => 6,
        'title' => 'Arsenal del Guerrero',
        'free' => 'Arma: Katana Nichirin',
        'premium' => 'Arma: Colmillo de Acero',
        'elite' => 'Arma: Lanza Rhongomyniad'
    ],
    [
        'level' => 7,
        'title' => 'Sabiduría Mística',
        'free' => 'Libro: Energía Maldita (básico)',
        'premium' => 'Libro: Darkhold',
        'elite' => 'Libro: Libro de los Vishanti'
    ],
    [
        'level' => 8,
        'title' => 'Objetos Estratégicos',
        'free' => 'Objeto: Pergamino Entrenamiento Instantáneo x3',
        'premium' => 'Espacio de Personaje e Invocación +1',
        'elite' => 'Objeto: Extensión de Terreno'
    ],
    [
        'level' => 9,
        'title' => 'Poder Dracónico',
        'free' => 'Esferas del Dragón',
        'premium' => 'Esferas del Dragón',
        'elite' => 'Super Esferas del Dragón'
    ],
    [
        'level' => 10,
        'title' => 'Gran Final Champions',
        'free' => 'Invocación: All Might',
        'premium' => 'Invocación: Jin Mori',
        'elite' => 'Invocación: Anti-Monitor'
    ],
];

$passTypes = [
    [
        'id' => 'free',
        'name' => 'Gratis',
        'price' => 'Gratis',
        'description' => 'Acceso básico al Champions Einherjer 2025. Obtén recompensas épicas y participa en el torneo más grande del año.',
        'benefits' => [
            'Invocación: Ash Ketchum & All Might',
            'Katana Nichirin',
            'Libro: Energía Maldita',
            'Cofres clasificatoria x2'
        ]
    ],
    [
        'id' => 'premium',
        'name' => 'Premium',
        'price' => '1,250 Esencias Azules',
        'description' => 'Eleva tu juego al nivel de los campeones. Invocaciones legendarias y armas de élite para dominar el torneo.',
        'benefits' => [
            'Invocación: Son Goku & Jin Mori',
            'Arma: Colmillo de Acero',
            'Libro: Darkhold',
            'Espacio de Personaje +1'
        ]
    ],
    [
        'id' => 'elite',
        'name' => 'Élite',
        'price' => '1 Sub de Kick o $5 USD',
        'description' => 'El camino del campeón definitivo. Desbloquea el arsenal más poderoso y las invocaciones más legendarias del Champions 2025.',
        'benefits' => [
            'Invocación: Seiya de Pegaso & Anti-Monitor',
            'Lanza Rhongomyniad',
            'Libro de los Vishanti',
            'Super Esferas del Dragón',
            'Extensión de Terreno'
        ]
    ],
];
?>
<!DOCTYPE html>
<html lang="es" class="pase-hero">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Champions Einherjer 2025 - Pase de Batalla</title>
    <meta name="description" content="Únete al Champions Einherjer 2025 y conquista el torneo más épico. Recompensas legendarias te esperan.">

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
                <span class="season-tag">🏆 Temporada Champions 2025</span>
                <h1>Champions Einherjer</h1>
                <p>El torneo definitivo ha comenzado. Compite, conquista y demuestra que eres el campeón definitivo. Recompensas épicas, batallas legendarias y gloria eterna te esperan.</p>
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
                    <span class="small-label">Premio Máximo → Nivel 10 Élite</span>
                    <h4>Invocación: Anti-Monitor</h4>
                    <p>El campeón absoluto del torneo. Además: Super Esferas del Dragón, Libro de los Vishanti, Lanza Rhongomyniad y Extensión de Terreno.</p>
                </div>
            </div>
        </div>
    </header>

    <main>
        <section id="pase-tipologias" class="pass-types">
            <header class="section-header">
                <span class="section-kicker">Elige tu camino</span>
                <h2>Tres niveles de competencia</h2>
                <p>El Champions Einherjer 2025 ofrece tres tipos de pase. Desde el nivel básico hasta la élite de campeones, cada uno te acerca más a la gloria.</p>
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
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="info-content">
                    <h3>¿Cómo adquirir tu pase Champions?</h3>
                    <p>Para comprar el <strong>Pase Premium</strong> o <strong>Élite</strong>, contáctame directamente por mensaje privado. Los pases se activan de forma inmediata tras la confirmación del pago.</p>
                </div>
            </div>
        </section>

        <section id="linea-progresion" class="progression-trail">
            <header class="section-header">
                <span class="section-kicker">10 niveles de gloria</span>
                <h2>El camino del campeón</h2>
                <p>Recorre los 10 niveles del Champions y desbloquea recompensas cada vez más poderosas. Cada nivel te acerca más a la victoria definitiva.</p>
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
                    <h3>🎮 Competencia Global</h3>
                    <p>Enfréntate a jugadores de todo el mundo en el torneo más competitivo de Einherjar Blitz. Solo los mejores alcanzarán la cima.</p>
                </article>
                <article class="flux-card">
                    <h3>⚔️ Misiones Champions</h3>
                    <p>Completa desafíos exclusivos del Champions 2025 para avanzar más rápido en los niveles y desbloquear recompensas adicionales.</p>
                </article>
                <article class="flux-card">
                    <h3>💎 Recompensas Exclusivas</h3>
                    <p>Invocaciones legendarias, armas míticas y objetos únicos que solo están disponibles durante el Champions Einherjer 2025.</p>
                </article>
            </div>
        </section>
    </main>

    <footer class="hero-footer">
        <div class="footer-content">
            <span>&copy; <?php echo date('Y'); ?> Einherjer Blitz. Champions Einherjer 2025.</span>
            <span>Gloria, Honor y Victoria Eterna.</span>
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

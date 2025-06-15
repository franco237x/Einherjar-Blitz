<?php
if (!isset($username)) {
    exit('Acceso no autorizado');
}

// Obtener información del pase de batalla
$sql_pase = "SELECT * FROM pase_batalla WHERE username = ?";
$stmt_pase = $conn->prepare($sql_pase);
$stmt_pase->bind_param("s", $username);
$stmt_pase->execute();
$result_pase = $stmt_pase->get_result();

// Valores por defecto
$tiene_pase_premium = false;
$nivel_actual = 1;
$puntos_actuales = 0;

if ($result_pase->num_rows > 0) {
    $pase_data = $result_pase->fetch_assoc();
    $tiene_pase_premium = (bool)$pase_data['premium'];
    $nivel_actual = $pase_data['nivel'];
    $puntos_actuales = $pase_data['puntos'];
}

$stmt_pase->close();

// Función para obtener el año basado en el nivel
function getYearFromLevel($nivel) {
    if ($nivel <= 6) return 2020;
    if ($nivel <= 12) return 2021;
    if ($nivel <= 18) return 2022;
    if ($nivel <= 24) return 2023;
    return 2024;
}

$current_year = getYearFromLevel($nivel_actual);
$current_year_level = ($nivel_actual - 1) % 6 + 1; // Nivel dentro del año actual (1-6)

// Estructura de recompensas por nivel dentro de cada año
$recompensas = [
    'free' => [
        // 2020 (niveles 1-6)
        1 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Poder Ocular: Sharingan (1 Aspa)'],
        2 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Unica: Uchiha Madara'],
        3 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Unica: Uchiha Obito'],
        4 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Arma Legendaria: Espada del Amanecer'],
        5 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Pergamino: Mejora +1'],
        6 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Arma Darkin Aleatoria'],
        
        // 2021 (niveles 7-12)
        7 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Poder Ocular: Rinnegan'],
        8 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Unica: Nagato'],
        9 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Arma: Katana'],
        10 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Objeto: Dedo de Sukuna'],
        11 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Mitica: Pantheon (Skin: Matadragones)'],
        12 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Unica: Isshiki Otsutsuki'],
        
        // 2022 (niveles 13-18)
        13 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Poder Ocular: Dharmagan'],
        14 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Legendaria: Gilgamesh'],
        15 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Arma Legendaria: True Longinus'],
        16 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Cofre Clasificatoria'],
        17 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Pergamino Entrenamiento Instantaneo'],
        18 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Arma Divina Aleatoria'],
        
        // 2023 (niveles 19-24)
        19 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Poder Ocular: Rinnegan de Hagoromo'],
        20 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Libro Legendario: Goku'],
        21 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Pergamino: 8 Puertas Internas del Chakra'],
        22 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Exclusiva: Shanks'],
        23 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Poder de God'],
        24 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Objeto: Acta de Defunción'],
        
        // 2024 (niveles 25-30)
        25 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Poder Ocular: Rinne-Sharingan'],
        26 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Exclusiva: Anila'],
        27 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Arma Exclusiva: Espada Crisol'],
        28 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Simbionte: Venom'],
        29 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Pergamino: Ira Espartana'],
        30 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Poder Exclusivo Aleatorio']
    ],
    'premium' => [
        // 2020 (niveles 1-6)
        1 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Poder Ocular: Sharingan (3 Aspas)'],
        2 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Exclusiva: Uchiha Madara (6 Caminos)'],
        3 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Exclusiva: Uchiha Obito (6 Caminos)'],
        4 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Arma Legendaria: Espada del Anochecer'],
        5 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Pergamino: Mejora +1 x2'],
        6 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Arma Darkin Aleatoria'],
        
        // 2021 (niveles 7-12)
        7 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Poder Ocular: Rinnegan'],
        8 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Unica: Nagato + Pain'],
        9 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Arma: Katana x2'],
        10 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Objeto: Dedo de Sukuna x3'],
        11 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Mitica: Soraka (Skin: Portadora del Amanecer y Anochecer)'],
        12 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Unica: Isshiki Otsutsuki'],
        
        // 2022 (niveles 13-18)
        13 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Poder Ocular: Dharmagan'],
        14 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Legendaria: Jeanne D Arc'],
        15 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Arma Legendaria: True Longinus'],
        16 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Cofre Clasificatoria x2'],
        17 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Pergamino Entrenamiento Instantaneo x2'],
        18 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Arma Divina: Hoja del Olimpo'],
        
        // 2023 (niveles 19-24)
        19 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Poder Ocular: Rinnegan de Hagoromo'],
        20 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Libro Legendario: Goku + Ichigo + Luffy'],
        21 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Pergamino: 8 Puertas Internas del Chakra'],
        22 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Exclusiva: Shanks + Roger'],
        23 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Poder de God'],
        24 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Objeto: Acta de Defunción Mejorada por Caos'],
        
        // 2024 (niveles 25-30)
        25 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Poder Ocular: Rinne-Sharingan'],
        26 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Invocacion Exclusiva: Superman New 52 + Superboy Prime'],
        27 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Arma Exclusiva: Espada Venuzdonoa'],
        28 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Simbionte: Venom + Carnage'],
        29 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Pergamino: Ira Espartana + Invocacion: Kratos (Nórdico)'],
        30 => ['imagen' => 'images/tiempo.png', 'descripcion' => 'Poder Exclusivo Aleatorio']
    ]
        // Aquí irían las recompensas premium siguiendo la misma estructura
        // ... (podemos agregarlas si lo necesitas)
];
?>

<div class="timeline-wrapper">
    <div class="timeline-header">
        <h2>Viaje Temporal del Guerrero</h2>
        <?php if (!$tiene_pase_premium): ?>
            <button class="btn-premium" onclick="comprarPasePremium()">
                <i class="fas fa-crown"></i> Desbloquear Premium
            </button>
        <?php endif; ?>
    </div>

    <div class="hex-core">
    <div class="core-center">
        <div class="core-inner"></div>
    </div>
    <div class="hex-ring ring-1"></div>
    <div class="hex-ring ring-2"></div>
    <div class="hex-ring ring-3"></div>
    <div class="shimmer-effect"></div>
    <div class="hex-text"></div>
</div>

   <!-- Agregar después del hex-core -->
   <div class="simple-progress">
    <div class="progress-text">
        <span>Nivel <?php echo $nivel_actual; ?></span>
        <span class="points"><?php echo $puntos_actuales; ?>/10</span>
    </div>
    <div class="progress-container">
        <div class="progress-bar" style="width: <?php echo min(($puntos_actuales / 10) * 100, 100); ?>%"></div>
    </div>
</div>

    <div class="time-axis">
        <?php for($year = 2020; $year <= 2025; $year++): ?>
            <div class="year-marker <?php echo $year == $current_year ? 'active' : ''; ?>" 
                 data-year="<?php echo $year; ?>">
                <div class="year-portal"></div>
                <span><?php echo $year; ?></span>
            </div>
        <?php endfor; ?>
        <div class="time-line"></div>
    </div>

    <div class="timeline-content">
        <?php for($year = 2020; $year <= 2024; $year++): ?>
            <div class="year-section <?php echo $year == $current_year ? 'active' : ''; ?>"
                 data-year="<?php echo $year; ?>">
                <div class="rewards-grid">
                    <?php 
                    // Calcular el nivel base para este año
                    $base_level = ($year - 2020) * 6 + 1;
                    
                    // Mostrar 6 recompensas para este año
                    for($i = 0; $i < 6; $i++): 
                        $absolute_level = $base_level + $i;
                        $is_current = $absolute_level == $nivel_actual;
                        $is_unlocked = $absolute_level <= $nivel_actual;
                    ?>
                        <div class="reward-node <?php echo $is_current ? 'current' : 
                            ($is_unlocked ? 'unlocked' : ''); ?>">
                            <div class="level-indicator"><?php echo $absolute_level; ?></div>
                            <div class="reward-content">
                                <div class="free-reward">
                                    <img src="<?php echo $recompensas['free'][$absolute_level]['imagen']; ?>" 
                                         alt="Free reward">
                                    <span><?php echo $recompensas['free'][$absolute_level]['descripcion']; ?></span>
                                </div>
                                <?php if ($tiene_pase_premium): ?>
                                    <div class="premium-reward">
                                        <img src="<?php echo $recompensas['premium'][$absolute_level]['imagen']; ?>" 
                                             alt="Premium reward">
                                        <span><?php echo $recompensas['premium'][$absolute_level]['descripcion']; ?></span>
                                    </div>
                                <?php endif; ?>
                            </div>
                            <?php if ($i < 5): ?>
                                <div class="node-connector"></div>
                            <?php endif; ?>
                        </div>
                    <?php endfor; ?>
                </div>
            </div>
        <?php endfor; ?>
    </div>
</div>

<style>
:root {
    --color-bg-primary: #0A1428;
    --color-bg-secondary: #091022;
    --color-accent: #C8AA6E;
    --color-accent-glow: #937341;
    --color-text: #F0E6D2;
    --color-muted: #A09B8C;
    --color-hextech: #0AC8B9;
    --color-shimmer: #CDFAFA;
    --color-void: #1E2328;
}

.timeline-wrapper {
    background: linear-gradient(135deg, var(--color-bg-primary), var(--color-bg-secondary));
    padding: 2rem;
    border-radius: 8px;
    border: 1px solid var(--color-accent);
    position: relative;
    overflow: hidden;
    margin: 2rem auto;
    max-width: 1400px;
}

.timeline-wrapper::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('https://i.pinimg.com/736x/33/7f/77/337f77217ad0cd801bc2c0323239952b.jpg') no-repeat;
    opacity: 0.10;
    pointer-events: none;
}

.timeline-header {
    text-align: center;
    margin-bottom: 3rem;
    position: relative;
}

.timeline-header h2 {
    color: var(--color-accent);
    font-size: 2 rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 1rem;
    text-shadow: 0 0 10px var(--color-accent-glow);
}

.time-axis {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 2rem 0;
    position: relative;
    padding: 1rem 0;
}

.time-axis::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, 
        var(--color-hextech), 
        var(--color-shimmer), 
        var(--color-hextech)
    );
    transform: translateY(-50%);
    box-shadow: 0 0 15px var(--color-hextech);
}

.year-marker {
    position: relative;
    z-index: 2;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.year-marker span {
    color: var(--color-muted);
    font-size: 1.2rem;
    font-weight: 600;
    transition: all 0.3s ease;
}

.year-marker.active span {
    color: var(--color-accent);
    text-shadow: 0 0 10px var(--color-accent-glow);
}

.year-portal {
    width: 20px;
    height: 20px;
    background: var(--color-void);
    border: 2px solid var(--color-hextech);
    border-radius: 50%;
    margin: 0 auto 0.5rem;
    position: relative;
    transition: all 0.3s ease;
}

.year-marker.active .year-portal {
    background: var(--color-hextech);
    box-shadow: 0 0 20px var(--color-hextech);
    transform: scale(1.2);
}

.year-section {
    display: none;
    opacity: 0;
    transition: opacity 0.5s ease;
}

.year-section.active {
    display: block;
    opacity: 1;
}

.rewards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    padding: 2rem 0;
}

.reward-node {
    background: var(--color-void);
    border: 1px solid var(--color-muted);
    border-radius: 8px;
    padding: 1.5rem;
    position: relative;
    transition: all 0.3s ease;
}

.reward-node.current {
    border-color: var(--color-hextech);
    box-shadow: 0 0 20px var(--color-hextech);
    transform: scale(1.05);
}

.reward-node.unlocked {
    border-color: var(--color-accent);
}

.level-indicator {
    position: absolute;
    top: -12px;
    left: -12px;
    width: 30px;
    height: 30px;
    background: var(--color-accent);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-void);
    font-weight: bold;
    box-shadow: 0 0 10px var(--color-accent-glow);
}

.reward-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.free-reward, .premium-reward {
    background: rgba(200, 170, 110, 0.1);
    border-radius: 4px;
    padding: 0.8rem;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.premium-reward {
    background: linear-gradient(45deg, 
        rgba(10, 200, 185, 0.1), 
        rgba(200, 170, 110, 0.1)
    );
    border: 1px solid var(--color-hextech);
}

.free-reward img, .premium-reward img {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    object-fit: cover;
}

.btn-premium {
    background: linear-gradient(45deg, var(--color-accent), var(--color-accent-glow));
    border: none;
    padding: 1rem 2rem;
    border-radius: 4px;
    color: var(--color-void);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 1rem;
}

.btn-premium:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px var(--color-accent-glow);
}

/* Efectos de transición */
.node-connector {
    position: absolute;
    top: 50%;
    right: -2rem;
    width: 2rem;
    height: 2px;
    background: var(--color-hextech);
    transform: translateY(-50%);
    opacity: 0.5;
}

/* Animaciones */
@keyframes portalPulse {
    0%, 100% {
        box-shadow: 0 0 10px var(--color-hextech);
    }
    50% {
        box-shadow: 0 0 20px var(--color-hextech);
    }
}

.year-marker.active .year-portal {
    animation: portalPulse 2s infinite;
}

/* Responsive */
@media (max-width: 768px) {
    .rewards-grid {
        grid-template-columns: 1fr;
    }

    .time-axis {
        overflow-x: auto;
        padding: 1rem;
    }
}

/* Estilos base del núcleo y sus componentes */
.hex-core {
    position: relative;
    width: 200px;
    height: 200px;
    margin: 2rem auto;
    display: flex;
    justify-content: center;
    align-items: center;
}

.core-center {
    width: 50px;
    height: 50px;
    background: var(--color-hextech);
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    animation: corePulse 2s ease-in-out infinite;
    position: relative;
    z-index: 2;
}

.hex-ring {
    position: absolute;
    border: 2px solid var(--color-hextech);
    opacity: 0.5;
}

.ring-1 {
    width: 80px;
    height: 80px;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    animation: ringRotate 3s linear infinite;
}

.ring-2 {
    width: 120px;
    height: 120px;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    animation: ringRotate 4s linear infinite reverse;
}

.ring-3 {
    width: 160px;
    height: 160px;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    animation: ringRotate 5s linear infinite;
}

.energy-particles {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 1;
}

/* Estilos del diálogo */
.hex-dialogue {
    position: absolute;
    top: 50%;
    right: -320px;
    transform: translateY(-50%);
    background: rgba(10, 20, 40, 0.95);
    border: 2px solid var(--core-color, var(--color-hextech));
    border-radius: 12px;
    padding: 1.2rem;
    color: var(--color-text);
    font-family: 'Cinzel', serif;
    width: 300px;
    text-align: left;
    opacity: 0;
    transition: opacity 0.5s ease;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.7),
                0 0 15px var(--core-color, var(--color-hextech));
    font-size: 0.95rem;
    line-height: 1.6;
    z-index: 100;
}

.hex-dialogue::before {
    content: '';
    position: absolute;
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-right: 10px solid rgba(10, 20, 40, 0.95);
}

.hex-dialogue.typing {
    opacity: 1;
}

/* Animaciones */
@keyframes corePulse {
    0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 20px var(--color-hextech);
    }
    50% {
        transform: scale(1.1);
        box-shadow: 0 0 30px var(--color-hextech);
    }
}

@keyframes ringRotate {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

/* Variables CSS necesarias */
:root {
    --color-hextech: #0AC8B9;
    --color-text: #F0E6D2;
    --color-bg-primary: #0A1428;
    --core-color: var(--color-hextech);
}

/* Estilos para los estados del núcleo */
.hex-core.state-unstable .core-center {
    animation: unstablePulse 0.5s ease-in-out infinite;
}

.hex-core.state-dark .core-center {
    filter: brightness(0.5);
    animation: darkPulse 3s ease-in-out infinite;
}

.hex-core.state-awakening .core-center {
    animation: awakeningPulse 2s ease-in-out infinite;
}

.hex-core.state-joyful .core-center {
    animation: joyfulPulse 1s ease-in-out infinite;
}

.hex-core.state-balanced .core-center {
    animation: balancedPulse 2.5s ease-in-out infinite;
}

.hex-core.state-unknown .core-center {
    animation: unknownPulse 2s ease-in-out infinite;
}

/* Animaciones de estados */
@keyframes unstablePulse {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.2) rotate(15deg); }
}

@keyframes darkPulse {
    0%, 100% { transform: scale(0.9); filter: brightness(0.5); }
    50% { transform: scale(1); filter: brightness(0.3); }
}

@keyframes awakeningPulse {
    0%, 100% { transform: scale(1); filter: brightness(1); }
    50% { transform: scale(1.1); filter: brightness(1.5); }
}

@keyframes joyfulPulse {
    0%, 100% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.1) rotate(5deg); }
    75% { transform: scale(1.1) rotate(-5deg); }
}

@keyframes balancedPulse {
    0%, 100% { transform: scale(1); filter: brightness(1); }
    50% { transform: scale(1.05); filter: brightness(1.2); }
}

@keyframes unknownPulse {
    0%, 100% { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg); }
    50% { transform: scale(1.1) rotate(180deg); filter: hue-rotate(180deg); }
}

/* Agregar a los estilos existentes */
.hex-text {
    position: absolute;
    bottom: -60px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    color: var(--color-text);
    font-family: 'Cinzel', serif;
    font-size: 1.1rem;
    width: 300px;
    opacity: 0;
    transition: all 0.5s ease;
    letter-spacing: 1px;
    background: linear-gradient(
        to bottom,
        rgba(10, 20, 40, 0.9),
        rgba(10, 20, 40, 0.7)
    );
    padding: 1rem;
    border-radius: 4px;
    border: 1px solid var(--core-color, var(--color-hextech));
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}

.hex-text.show {
    opacity: 1;
    transform: translateX(-50%) translateY(-10px);
}

.hex-text.hide {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
}

/* Estilos especiales para el portal 2025 */
.year-marker[data-year="2025"] {
    position: relative;
    overflow: hidden;
}

.year-marker[data-year="2025"]::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        45deg,
        transparent,
        rgba(255, 30, 126, 0.2),
        transparent
    );
    animation: voidPulse 2s ease-in-out infinite;
    z-index: -1;
}

.year-marker[data-year="2025"] .year-portal {
    border-color: rgba(255, 30, 126, 0.5);
    box-shadow: 
        inset 0 0 15px rgba(255, 30, 126, 0.3),
        0 0 15px rgba(255, 30, 126, 0.3);
}

.year-marker[data-year="2025"] .year-text {
    opacity: 0.5;
    text-shadow: 0 0 10px rgba(255, 30, 126, 0.8);
    animation: textGlitch 3s infinite;
}

@keyframes voidPulse {
    0%, 100% {
        opacity: 0.3;
        transform: scale(1);
    }
    50% {
        opacity: 0.6;
        transform: scale(1.1);
    }
}

@keyframes textGlitch {
    0%, 100% {
        opacity: 0.5;
        transform: translateX(0);
    }
    92% {
        opacity: 0.5;
        transform: translateX(0);
    }
    94% {
        opacity: 0.8;
        transform: translateX(3px);
    }
    96% {
        opacity: 0.3;
        transform: translateX(-3px);
    }
    98% {
        opacity: 0.7;
        transform: translateX(1px);
    }
}

/* Efecto de grieta */
.year-marker[data-year="2025"] .year-portal::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 0;
    background: rgba(255, 30, 126, 0.8);
    transform: translate(-50%, -50%);
    animation: crackGrow 4s ease-in-out infinite;
    box-shadow: 
        0 0 10px rgba(255, 30, 126, 0.8),
        0 0 20px rgba(255, 30, 126, 0.4);
}

@keyframes crackGrow {
    0%, 100% {
        height: 0;
        opacity: 0;
    }
    50% {
        height: 80%;
        opacity: 1;
    }
}
.progress-indicator {
    position: absolute;
    bottom: -100px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    width: 200px;
}

.level-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 8px;
}

.current-level {
    font-size: 2rem;
    font-weight: bold;
    color: var(--color-accent);
    text-shadow: 0 0 10px var(--color-accent-glow);
}

.year-label {
    font-size: 1rem;
    color: var(--color-muted);
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(10, 20, 40, 0.5);
}

.points-bar {
    height: 6px;
    background: rgba(200, 170, 110, 0.2);
    border-radius: 3px;
    position: relative;
    overflow: hidden;
}

.points-progress {
    height: 100%;
    background: linear-gradient(90deg, 
        var(--color-accent), 
        var(--color-accent-glow)
    );
    transition: width 0.3s ease;
    box-shadow: 0 0 10px var(--color-accent-glow);
}

.points-text {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.8rem;
    color: var(--color-muted);
    white-space: nowrap;
}

/* Animación cuando los puntos cambian */
@keyframes pointsUpdate {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

.points-text.updating {
    animation: pointsUpdate 0.3s ease;
}
.simple-progress {
    width: 300px;
    margin: 20px auto;
    padding: 15px;
    background: rgba(10, 20, 40, 0.8);
    border: 1px solid var(--color-hextech);
    border-radius: 8px;
    box-shadow: 0 0 15px rgba(10, 200, 185, 0.2);
    position: relative;
    overflow: hidden;
}

.simple-progress::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
        transparent,
        var(--color-hextech),
        transparent
    );
    animation: scanline 2s linear infinite;
}

.progress-text {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    color: var(--color-text);
    font-size: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.progress-text .points {
    color: var(--color-hextech);
    font-weight: bold;
    text-shadow: 0 0 5px var(--color-hextech);
}

.progress-container {
    width: 100%;
    height: 8px;
    background: rgba(10, 200, 185, 0.1);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
}

.progress-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg,
        transparent,
        rgba(10, 200, 185, 0.1),
        transparent
    );
    animation: pulse 2s ease-in-out infinite;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(90deg,
        var(--color-hextech),
        #4DFFF8
    );
    box-shadow: 0 0 10px var(--color-hextech);
    transition: width 0.5s ease;
    position: relative;
}

.progress-bar::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 2px;
    height: 100%;
    background: #fff;
    box-shadow: 0 0 10px #fff;
    animation: glow 1s ease-in-out infinite;
}

@keyframes scanline {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

@keyframes pulse {
    0%, 100% {
        opacity: 0.5;
    }
    50% {
        opacity: 1;
    }
}

@keyframes glow {
    0%, 100% {
        opacity: 0.5;
    }
    50% {
        opacity: 1;
    }
}


/* Cuando el nodo está activo o desbloqueado */
.reward-node.current .node-connector,
.reward-node.unlocked .node-connector {
    background: var(--color-accent);
    opacity: 1;
    box-shadow: 0 0 10px var(--color-accent-glow);
}

/* Nodos desbloqueados */
.reward-node.unlocked {
    border-color: var(--color-accent);
    box-shadow: 0 0 10px rgba(200, 170, 110, 0.2);
}

/* Nodo actual */
.reward-node.current {
    border-color: var(--color-hextech);
    box-shadow: 
        0 0 20px var(--color-hextech),
        0 0 40px rgba(10, 200, 185, 0.2);
    transform: scale(1.05);
    z-index: 2;
}

/* Línea de progreso entre nodos */
.reward-node.unlocked::before {
    content: '';
    position: absolute;
    top: 50%;
    left: -2rem;
    width: 2rem;
    height: 2px;
    background: var(--color-accent);
    transform: translateY(-50%);
    box-shadow: 0 0 10px var(--color-accent-glow);
}

.reward-node.current::before {
    background: var(--color-hextech);
    box-shadow: 0 0 10px var(--color-hextech);
}
</style>

<!-- Agregar en el head del documento principal -->
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap" rel="stylesheet">

<!-- Primero jQuery -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- Luego tu script -->
<script>
function comprarPasePremium() {
    // Mostrar notificación de confirmación
    Swal.fire({
        title: '¿Deseas comprar el Pase Premium?',
        text: "Desbloquearás recompensas exclusivas en todos los niveles",
        icon: 'question',
        background: 'var(--color-bg-primary)',
        color: 'var(--color-text)',
        showCancelButton: true,
        confirmButtonColor: 'var(--color-hextech)',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, comprar',
        cancelButtonText: 'Cancelar',
        showClass: {
            popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Realizar la petición AJAX para comprar el pase
            fetch('comprar_pase.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: '<?php echo $username; ?>'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Mostrar notificación de éxito
                    Swal.fire({
                        title: '¡Pase Premium Desbloqueado!',
                        text: 'Has desbloqueado todas las recompensas premium',
                        icon: 'success',
                        background: 'var(--color-bg-primary)',
                        color: 'var(--color-text)',
                        confirmButtonColor: 'var(--color-hextech)',
                        showClass: {
                            popup: 'animate__animated animate__zoomIn'
                        }
                    }).then(() => {
                        // Recargar la página para mostrar las recompensas premium
                        window.location.reload();
                    });
                } else {
                    // Mostrar error si algo falla
                    Swal.fire({
                        title: 'Error',
                        text: data.message || 'No se pudo completar la compra',
                        icon: 'error',
                        background: 'var(--color-bg-primary)',
                        color: 'var(--color-text)',
                        confirmButtonColor: 'var(--color-hextech)'
                    });
                }
            });
        }
    });
}
</script>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const hexCore = document.querySelector('.hex-core');
    const yearMarkers = document.querySelectorAll('.year-marker');
    const yearSections = document.querySelectorAll('.year-section');
    let currentYear = document.querySelector('.year-marker.active').dataset.year;
    
    // Efectos de partículas Hextech
    const createHextechParticle = () => {
        const particle = document.createElement('div');
        particle.className = 'hextech-particle';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.animationDuration = Math.random() * 2 + 3 + 's';
        document.querySelector('.timeline-wrapper').appendChild(particle);
        
        particle.addEventListener('animationend', () => particle.remove());
    };

    // Generar partículas periódicamente
    setInterval(createHextechParticle, 2000);

    // Función para cambiar de año con efectos
    const changeYear = (newYear) => {
        if (newYear === currentYear) return;

        // Efecto de transición Hextech
        const timeline = document.querySelector('.timeline-wrapper');
        const transition = document.createElement('div');
        transition.className = 'year-transition';
        timeline.appendChild(transition);

        // Actualizar marcadores de año
        yearMarkers.forEach(marker => {
            const year = marker.dataset.year;
            marker.classList.toggle('active', year === newYear);
            
            if (year === newYear) {
                marker.querySelector('.year-portal').classList.add('portal-activate');
                setTimeout(() => {
                    marker.querySelector('.year-portal').classList.remove('portal-activate');
                }, 1000);
            }
        });

        // Transición de secciones
        yearSections.forEach(section => {
            const year = section.dataset.year;
            if (year === currentYear) {
                section.classList.add('fade-out');
            }
            if (year === newYear) {
                setTimeout(() => {
                    section.classList.add('active', 'fade-in');
                    section.classList.remove('fade-out');
                }, 500);
            } else {
                section.classList.remove('active', 'fade-in');
            }
        });

        // Efecto de energía Hextech
        const createEnergyBeam = () => {
            const beam = document.createElement('div');
            beam.className = 'hextech-beam';
            timeline.appendChild(beam);
            setTimeout(() => beam.remove(), 1000);
        };

        for (let i = 0; i < 3; i++) {
            setTimeout(createEnergyBeam, i * 200);
        }

        currentYear = newYear;

        // Limpiar efectos de transición
        setTimeout(() => transition.remove(), 1000);
    };

    // Event listeners para los marcadores de año
    yearMarkers.forEach(marker => {
        marker.addEventListener('click', () => {
            const newYear = marker.dataset.year;
            changeYear(newYear);
        });

        // Efecto hover
        marker.addEventListener('mouseenter', () => {
            if (!marker.classList.contains('active')) {
                marker.querySelector('.year-portal').classList.add('portal-hover');
            }
        });

        marker.addEventListener('mouseleave', () => {
            marker.querySelector('.year-portal').classList.remove('portal-hover');
        });
    });

    // Animación para nodos de recompensa
    const rewardNodes = document.querySelectorAll('.reward-node');
    rewardNodes.forEach(node => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    node.classList.add('reveal');
                }
            });
        }, { threshold: 0.5 });

        observer.observe(node);
    });
});

// Estilos adicionales necesarios para las animaciones
const style = document.createElement('style');
style.textContent = `
    .hextech-particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: var(--color-hextech);
        border-radius: 50%;
        pointer-events: none;
        animation: floatUp linear forwards;
        opacity: 0;
    }

    .hextech-beam {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--color-hextech);
        animation: beamAcross 1s ease-out forwards;
        z-index: 10;
    }

    .year-transition {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at center, var(--color-hextech), transparent);
        opacity: 0;
        animation: pulseTransition 1s ease-out forwards;
        pointer-events: none;
        z-index: 5;
    }

    .portal-activate {
        animation: portalActivate 1s ease-out forwards;
    }

    .portal-hover {
        animation: portalHover 1s ease-in-out infinite;
    }

    .reveal {
        animation: revealNode 0.8s ease-out forwards;
    }

    @keyframes floatUp {
        0% {
            transform: translateY(100vh) scale(0);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100px) scale(1.5);
            opacity: 0;
        }
    }

    @keyframes beamAcross {
        0% {
            transform: scaleX(0);
            opacity: 1;
        }
        100% {
            transform: scaleX(1);
            opacity: 0;
        }
    }

    @keyframes pulseTransition {
        0% {
            opacity: 0;
        }
        50% {
            opacity: 0.3;
        }
        100% {
            opacity: 0;
        }
    }

    @keyframes portalActivate {
        0% {
            transform: scale(1);
            box-shadow: 0 0 10px var(--color-hextech);
        }
        50% {
            transform: scale(1.5);
            box-shadow: 0 0 30px var(--color-hextech);
        }
        100% {
            transform: scale(1);
            box-shadow: 0 0 10px var(--color-hextech);
        }
    }

    @keyframes portalHover {
        0%, 100% {
            transform: scale(1.1);
            box-shadow: 0 0 15px var(--color-hextech);
        }
        50% {
            transform: scale(1.2);
            box-shadow: 0 0 25px var(--color-hextech);
        }
    }

    @keyframes revealNode {
        0% {
            opacity: 0;
            transform: translateY(20px);
        }
        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', function() {
    const hexCore = document.querySelector('.hex-core');
    const yearMarkers = document.querySelectorAll('.year-marker');
    const hexText = document.querySelector('.hex-text');

    const hexMessages = {
        2020: {
            text: "Esto es nuevo, parece agradable...",
            color: "#FF9C00",
            state: "unstable"
        },
        2021: {
            text: "Ellos me dejaron solo... Nunca más...",
            color: "#4A0080",
            state: "dark"
        },
        2022: {
            text: "Ellos creen en mi... No los defraudaré...",
            color: "#B829E1",
            state: "awakening"
        },
        2023: {
            text: "Estamos en paz... Somos una familia...",
            color: "#00FFE5",
            state: "joyful"
        },
        2024: {
            text: "Mi familia es grande, más desafios, lucharemos juntos...",
            color: "#CDFAFA",
            state: "balanced"
        },
        2025: {
            text: "El futuro es incierto... Suerte amigo mío...",
            color: "#FF1E7E",
            state: "unknown"
        }
    };

    let messageTimeout;

    function showMessage(message, color) {
        // Limpiar cualquier timeout existente
        if (messageTimeout) {
            clearTimeout(messageTimeout);
        }

        // Ocultar mensaje actual si existe
        hexText.classList.remove('show');
        hexText.classList.add('hide');

        // Esperar a que termine la animación de ocultamiento
        setTimeout(() => {
            // Actualizar texto y color
            hexText.textContent = message;
            hexText.style.setProperty('--core-color', color);

            // Mostrar nuevo mensaje
            hexText.classList.remove('hide');
            hexText.classList.add('show');

            // Programar ocultamiento
            messageTimeout = setTimeout(() => {
                hexText.classList.remove('show');
                hexText.classList.add('hide');
            }, 3000); // El mensaje desaparece después de 3 segundos
        }, 300);
    }

    yearMarkers.forEach(marker => {
        marker.addEventListener('click', () => {
            const year = parseInt(marker.dataset.year);
            const message = hexMessages[year];
            
            if (message) {
                // Cambiar estado visual del núcleo
                hexCore.className = 'hex-core';
                hexCore.classList.add(`state-${message.state}`);
                
                // Actualizar variables CSS
                hexCore.style.setProperty('--core-color', message.color);
                
                // Mostrar texto con nueva función
                showMessage(message.text, message.color);
            }
        });
    });
});
</script>

<!-- SweetAlert2 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sweetalert2/theme-dark@4/dark.css">
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<!-- Animate.css -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">

<!-- Agregar al JavaScript existente -->

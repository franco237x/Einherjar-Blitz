<?php
require_once 'includes/Database.php';

$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    header('Location: index.php');
    exit();
}
$userData = $auth->getUserData();
if (!$userData) {
    header('Location: index.php');
    exit();
}

// Datos de campeones (puedes extraerlo a BD si lo deseas)
function getCharacterData()
{
    return [
        [
            'id' => 1,
            'name' => 'Shuna Shieda',
            'title' => 'La Furia de los Shiedas',
            'description' => 'La cúspide de poder de los Shiedas, feroz y letal. Maestra del elemento Devastación.',
            'image' => 'shuna.jpg',
            'rarity' => 'legendary',
            'attack_min' => 115,
            'attack_max' => 140,
            'max_health' => 1000,
            'armor' => 15,
            'defense_reduction' => 45,
            'elemental_resistance' => 60,
            'clan' => 'Shieda',
            'element' => 'Devastación'
        ],
        [
            'id' => 2,
            'name' => 'Ozen Kimura',
            'title' => 'La Muralla Inamovible de los Kimura',
            'description' => 'Con una actitud fría como el acero, Ozen es una guerrera formidable del clan Kimura.',
            'image' => 'ozen.jpg',
            'rarity' => 'epic',
            'attack_min' => 100,
            'attack_max' => 170,
            'max_health' => 1200,
            'armor' => 30,
            'defense_reduction' => 5,
            'elemental_resistance' => 65,
            'clan' => 'Kimura',
            'element' => 'Chakra'
        ],
         [
            'id' => 3,
            'name' => 'Xair Chikyu',
            'title' => 'El viento gélido de los Chikyu',
            'description' => 'Inventor del Bijon, energía que le otorga un poder devastador. Maestro del clan Chikyu.',
            'image' => 'xair.png',
            'rarity' => 'rare',
            'attack_min' => 90,
            'attack_max' => 120,
            'max_health' => 900,
            'armor' => 15,
            'defense_reduction' => 15,
            'elemental_resistance' => 100,
            'clan' => 'Chikyu',
            'element' => 'Hielo'
         ],
            [
            'id' => 4,
            'name' => 'Nathan Doffens',
            'title' => 'El relámpago paradójico',
            'description' => 'Un guerrero del clan Doffens, conocido por su velocidad y su habilidad para teletransportarse hacia la victoria.',
            'image' => 'nathan.png',
            'rarity' => 'epic',
            'attack_min' => 70,
            'attack_max' => 115,
            'max_health' => 1000,
            'armor' => 17,
            'defense_reduction' => 30,
            'elemental_resistance' => 50,
            'clan' => 'Doffens',
            'element' => 'Rayo'
            ],
             [
            'id' => 5,
            'name' => 'Zack Hisoka',
            'title' => 'El más grande genio',
            'description' => 'El hombre con el intelecto más brillante del clan Hisoka.',
            'image' => 'zack.png',
            'rarity' => 'legendary',
            'attack_min' => 30,
            'attack_max' => 250,
            'max_health' => 750,
            'armor' => 25,
            'defense_reduction' => 35,
            'elemental_resistance' => 35,
            'clan' => 'Hisoka',
            'element' => 'Ninguno'
           ]
    ];
}

$champions = getCharacterData();
$selected = $_SESSION['selected_champion'] ?? null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['champion_id'])) {
    $champId = (int) $_POST['champion_id'];
    foreach ($champions as $c) {
        if ($c['id'] === $champId) {
            $_SESSION['selected_champion'] = $champId;
            $_SESSION['selected_champion_data'] = $c;
            header('Location: game/battle.html');
            exit();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Seleccionar Campeón</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #0a0a0a;
            --bg-gradient: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            --gold: #c9aa71;
            --gold-hover: #d4b776;
            --gold-shadow: rgba(201, 170, 113, 0.3);
            --text-light: #ffffffd9;
            --text-muted: #aaaaaaaa;
            --card-bg: #111;
            --card-border: rgba(201,170,113,0.2);
            --card-hover: rgba(201,170,113,0.1);
            --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            --transition-bounce: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }

        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            background: var(--bg-gradient);
            color: var(--text-light); 
            height: 100vh; 
            display: flex; 
            flex-direction: column;
            font-weight: 400;
            letter-spacing: 0.01em;
            line-height: 1.5;
            overflow-x: hidden;
        }

        /* Header mejorado */
        header { 
            padding: 1.5rem 1rem; 
            text-align: center; 
            border-bottom: 1px solid var(--card-border);
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            position: relative;
        }

        header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--gold), transparent);
            opacity: 0.6;
        }

        header h1 { 
            font-size: 1.8rem; 
            color: var(--gold); 
            font-family: 'Cinzel', serif; 
            font-weight: 600;
            letter-spacing: 0.08em;
            text-shadow: 0 2px 8px var(--gold-shadow);
            margin-bottom: 0.5rem;
        }

        header .user { 
            font-size: 0.9rem; 
            opacity: 0.7; 
            font-weight: 300;
            letter-spacing: 0.02em;
            color: var(--text-muted);
        }

        /* Lista vertical mejorada */
        .list { 
            flex: 1; 
            overflow-y: auto; 
            display: flex; 
            flex-direction: column; 
            gap: 1rem; 
            padding: 1.5rem 1rem 6rem;
            scroll-behavior: smooth;
        }

        .list::-webkit-scrollbar {
            width: 4px;
        }

        .list::-webkit-scrollbar-track {
            background: transparent;
        }

        .list::-webkit-scrollbar-thumb {
            background: var(--gold);
            border-radius: 2px;
            opacity: 0.5;
        }

        .card { 
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            flex-direction: row; 
            align-items: center; 
            max-width: 100%; 
            flex: 0 0 auto; 
            padding: 1.2rem;
            border-radius: 16px;
            position: relative;
            cursor: pointer;
            transition: var(--transition-smooth);
            backdrop-filter: blur(10px);
            overflow: hidden;
        }

        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, var(--card-hover), transparent);
            transition: var(--transition-smooth);
            z-index: 1;
        }

        .card:hover::before {
            left: 100%;
        }

        .card:hover {
            transform: translateY(-2px);
            border-color: var(--gold);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px var(--gold-shadow);
            background: rgba(17, 17, 17, 0.8);
        }

        .card.selected { 
            border: 2px solid var(--gold);
            background: rgba(201, 170, 113, 0.05);
            transform: translateY(-3px);
            box-shadow: 
                0 12px 40px rgba(0, 0, 0, 0.4), 
                0 0 30px var(--gold-shadow),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .card.selected::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }

        .card img { 
            width: 70px; 
            height: 70px; 
            object-fit: cover; 
            border-radius: 12px;
            margin-right: 1rem;
            transition: var(--transition-smooth);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            position: relative;
            z-index: 2;
        }

        .card:hover img {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        }

        .card-content {
            flex: 1;
            position: relative;
            z-index: 2;
        }

        .card h3 { 
            font-size: 1.1rem; 
            margin: 0 0 0.3rem; 
            font-weight: 600;
            letter-spacing: 0.02em;
            color: var(--text-light);
            font-family: 'Cinzel', serif;
        }

        .card p { 
            font-size: 0.85rem; 
            margin: 0; 
            opacity: 0.7;
            font-weight: 300;
            letter-spacing: 0.01em;
            line-height: 1.4;
            color: var(--text-muted);
        }

        .rarity { 
            position: absolute; 
            top: 12px; 
            right: 12px; 
            background: linear-gradient(45deg, var(--gold), var(--gold-hover));
            color: #1a1a1a; 
            padding: 0.3rem 0.8rem; 
            font-size: 0.7rem; 
            font-weight: 700; 
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            box-shadow: 0 2px 8px var(--gold-shadow);
            z-index: 3;
            transition: var(--transition-smooth);
        }

        .card:hover .rarity {
            transform: scale(1.05);
            box-shadow: 0 4px 12px var(--gold-shadow);
        }

        /* Colores por rareza */
        .rarity.legendary {
            background: linear-gradient(45deg, #ff6b35, #f7931e);
            color: white;
        }

        .rarity.epic {
            background: linear-gradient(45deg, #9b59b6, #8e44ad);
            color: white;
        }

        .rarity.rare {
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
        }

        /* Barra fija inferior mejorada */
        .actions { 
            position: fixed; 
            bottom: 0; 
            left: 0; 
            right: 0; 
            background: rgba(10, 10, 10, 0.95); 
            backdrop-filter: blur(20px); 
            padding: 1rem; 
            display: flex; 
            gap: 1rem; 
            z-index: 100;
            border-top: 1px solid var(--card-border);
        }

        .btn { 
            flex: 1; 
            padding: 1rem 1.5rem; 
            border: none; 
            border-radius: 50px; 
            font-weight: 600; 
            font-size: 1rem;
            cursor: pointer;
            transition: var(--transition-bounce);
            position: relative;
            overflow: hidden;
            letter-spacing: 0.02em;
            text-transform: uppercase;
            font-size: 0.9rem;
        }

        .btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }

        .btn:active::before {
            width: 300px;
            height: 300px;
        }

        .btn.select { 
            background: linear-gradient(45deg, var(--gold), var(--gold-hover)); 
            color: #000;
            box-shadow: 0 4px 15px var(--gold-shadow);
        }

        .btn.select:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px var(--gold-shadow);
            background: linear-gradient(45deg, var(--gold-hover), var(--gold));
        }

        .btn.back { 
            background: transparent; 
            color: var(--text-light); 
            border: 2px solid var(--gold);
        }

        .btn.back:hover {
            background: var(--gold);
            color: #000;
            transform: translateY(-2px);
        }

        .btn:disabled { 
            opacity: 0.4;
            cursor: not-allowed;
            transform: none !important;
        }

        .btn:disabled:hover {
            transform: none;
            box-shadow: none;
        }

        /* Animaciones de entrada */
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .card {
            animation: slideInUp 0.5s ease-out backwards;
        }

        .card:nth-child(1) { animation-delay: 0.1s; }
        .card:nth-child(2) { animation-delay: 0.2s; }
        .card:nth-child(3) { animation-delay: 0.3s; }

        header {
            animation: fadeIn 0.6s ease-out;
        }

        .actions {
            animation: slideInUp 0.6s ease-out 0.3s backwards;
        }

        /* Responsive */
        @media (max-width: 480px) {
            header h1 {
                font-size: 1.5rem;
            }
            
            .card {
                padding: 1rem;
            }
            
            .card img {
                width: 60px;
                height: 60px;
            }
            
            .btn {
                padding: 0.9rem 1.2rem;
                font-size: 0.85rem;
            }
        }
    </style>
</head>
<body>
<header>
    <h1>Elegir Campeón</h1>
    <div class="user">Bienvenido <?=htmlspecialchars($userData['username'])?></div>
</header>

<main class="list" id="list">
    <?php foreach ($champions as $ch): ?>
        <div class="card" data-id="<?=$ch['id']?>">
            <span class="rarity <?=strtolower($ch['rarity'])?>"><?=ucfirst($ch['rarity'])?></span>
            <img src="images/<?=$ch['image']?>" alt="<?=$ch['name']?>"/>
            <div class="card-content">
                <h3><?=$ch['name']?></h3>
                <p><?=$ch['title']?></p>
            </div>
        </div>
    <?php endforeach; ?>
</main>

<form class="actions" method="POST">
    <input type="hidden" name="champion_id" id="championId" />
    <button type="button" class="btn back" onclick="location.href='dashboard.php'"><i class="fas fa-arrow-left"></i></button>
    <button type="submit" class="btn select" id="playBtn" disabled><i class="fas fa-play"></i></button>
</form>

<script>
const cards = document.querySelectorAll('.card');
const playBtn = document.getElementById('playBtn');
const championIdInput = document.getElementById('championId');
let current = null;

// Función para seleccionar carta con animación
function selectCard(card) {
    // Remover selección anterior con transición suave
    if (current) {
        current.classList.remove('selected');
        // Pequeña vibración para feedback táctil en móviles
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
    
    current = card;
    card.classList.add('selected');
    
    // Actualizar formulario
    championIdInput.value = card.dataset.id;
    playBtn.disabled = false;
    
    // Guardar selección en sessionStorage para el battle
    sessionStorage.setItem('selected_champion', card.dataset.id);
    
    // Scroll suave hacia la carta seleccionada si está fuera de vista
    card.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
    
    // Efecto de pulso en el botón de jugar
    playBtn.style.transform = 'scale(1.05)';
    setTimeout(() => {
        playBtn.style.transform = '';
    }, 150);
}

// Event listeners para las cartas
cards.forEach((card, index) => {
    card.addEventListener('click', (e) => {
        e.preventDefault();
        selectCard(card);
    });
    
    // Efecto hover mejorado para dispositivos táctiles
    card.addEventListener('touchstart', () => {
        card.style.transform = 'translateY(-2px) scale(1.02)';
    });
    
    card.addEventListener('touchend', () => {
        setTimeout(() => {
            if (!card.classList.contains('selected')) {
                card.style.transform = '';
            }
        }, 100);
    });
    
    // Animación de entrada escalonada
    card.style.animationDelay = `${0.1 * (index + 1)}s`;
});

// Navegación con teclado
document.addEventListener('keydown', (e) => {
    const currentIndex = current ? Array.from(cards).indexOf(current) : -1;
    
    switch(e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
            e.preventDefault();
            const nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
            selectCard(cards[nextIndex]);
            break;
            
        case 'ArrowUp':
        case 'ArrowLeft':
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
            selectCard(cards[prevIndex]);
            break;
            
        case 'Enter':
        case ' ':
            e.preventDefault();
            if (!playBtn.disabled) {
                playBtn.click();
            }
            break;
    }
});

// Seleccionar primera carta automáticamente con efecto
if (cards.length) {
    setTimeout(() => {
        selectCard(cards[0]);
    }, 500); // Esperar a que termine la animación de entrada
}

// Efecto de carga completada
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// Optimización para dispositivos móviles
if ('ontouchstart' in window) {
    // Prevenir zoom en doble tap
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    });
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}
</script>
</body>
</html>

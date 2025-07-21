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
            'attack_min' => 120,
            'attack_max' => 180,
            'max_health' => 950,
            'armor' => 85,
            'defense_reduction' => 75,
            'elemental_resistance' => 180,
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
            'attack_min' => 200,
            'attack_max' => 280,
            'max_health' => 1200,
            'armor' => 150,
            'defense_reduction' => 120,
            'elemental_resistance' => 90,
            'clan' => 'Kimura',
            'element' => 'Hielo'
        ],
        [
            'id' => 3,
            'name' => 'Xair Chikyu',
            'title' => 'El viento gélido de los Chikyu',
            'description' => 'Inventor del Bijon, energía que le otorga un poder devastador. Maestro del clan Chikyu.',
            'image' => 'xair.png',
            'rarity' => 'rare',
            'attack_min' => 160,
            'attack_max' => 240,
            'max_health' => 800,
            'armor' => 60,
            'defense_reduction' => 45,
            'elemental_resistance' => 250,
            'clan' => 'Chikyu',
            'element' => 'Viento'
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
            header('Location: simple-game/battle.html');
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
    <style>
        :root {
            --bg-dark: #0a0a0a;
            --gold: #c9aa71;
            --text-light: #ffffffd9;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: var(--bg-dark); color: var(--text-light); height: 100vh; display: flex; flex-direction: column; }
        header { padding: 1rem; text-align: center; border-bottom: 1px solid rgba(201,170,113,0.3); }
        header h1 { font-size: 1.4rem; color: var(--gold); font-family: 'Cinzel', serif; }
        header .user { font-size: 0.8rem; margin-top: 0.25rem; opacity: .7; }

        /* Carrusel */
        .carousel { flex: 1; overflow-x: auto; display: flex; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; gap: 1rem; padding: 1rem; }
        .carousel::-webkit-scrollbar { display: none; }
        .card { background: #111; border: 1px solid rgba(201,170,113,0.3); flex: 0 0 80%; max-width: 80%; scroll-snap-align: center; border-radius: 12px; padding: 1rem; position: relative; display: flex; flex-direction: column; align-items: center; }
        .card.selected { outline: 3px solid var(--gold); }
        .card img { width: 100%; height: 220px; object-fit: cover; border-radius: 8px; }
        .rarity { position: absolute; top: 8px; right: 8px; background: var(--gold); color: #1a1a1a; padding: 0.2rem 0.6rem; font-size: 0.7rem; font-weight: 700; border-radius: 6px; }
        .card h3 { font-size: 1.1rem; margin: 0.6rem 0 0.2rem; text-align: center; }
        .card p { font-size: 0.85rem; text-align: center; opacity: .8; }

        /* Barra fija inferior */
        .actions { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(10,10,10,.95); backdrop-filter: blur(6px); padding: .8rem 1rem; display: flex; gap: .8rem; z-index: 100; }
        .btn { flex: 1; padding: 0.9rem 1.2rem; border: none; border-radius: 50px; font-weight: 600; font-size: 1rem; }
        .btn.select { background: linear-gradient(45deg,var(--gold),#9e8b54); color: #000; }
        .btn.back { background: transparent; color: var(--text-light); border: 1px solid var(--gold); }
        .btn:disabled { opacity: .4; }

        /* === Lista vertical === */
        .list { flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:0.8rem; padding:1rem; }
        .list .card { flex-direction:row; align-items:center; max-width:100%; flex:0 0 auto; padding:0.8rem; }
        .list .card img { width:60px; height:60px; object-fit:cover; border-radius:6px; }
        .list .card h3 { font-size:1rem; margin:0; }
        .list .card p { font-size:0.8rem; margin:0; opacity:0.7; }
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
            <span class="rarity"><?=ucfirst($ch['rarity'])?></span>
            <img src="images/<?=$ch['image']?>" alt="<?=$ch['name']?>"/>
            <h3><?=$ch['name']?></h3>
            <p><?=$ch['title']?></p>
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
let current = null;

cards.forEach(card => card.addEventListener('click', () => {
    if (current) current.classList.remove('selected');
    current = card;
    card.classList.add('selected');
    document.getElementById('championId').value = card.dataset.id;
    document.getElementById('playBtn').disabled = false;
}));

// Seleccionar primero automáticamente si existe
if (cards.length) cards[0].click();
</script>
</body>
</html>

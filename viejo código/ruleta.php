<?php
require_once 'includes/Database.php';

$auth = new AuthController();

// Verificar autenticación
if (!$auth->isAuthenticated()) {
    header("Location: index.php");
    exit();
}

// Obtener datos del usuario
$userData = $auth->getUserData();
if (!$userData) {
    header("Location: index.php");
    exit();
}

$username = $userData['username'];
$db = Database::getInstance();

// Obtener llaves y recompensas actuales
$llaves = $userData['llaves'];
$recompensa_actual = $userData['recompensas'];

// Procesar apertura de caja
if (isset($_POST['open_box']) && $llaves >= 1) {
    // 1. Descontar llave primero
    $llaves -= 1;
    $stmt = $db->prepare("UPDATE usuarios SET llaves = ? WHERE username = ?");
    $stmt->execute([$llaves, $username]);

    // 2. Generar recompensa
    $randomNumber = rand(1, 100);
    if ($randomNumber <= 1) {
        $nueva_recompensa = 100; // Legendario
    } elseif ($randomNumber <= 10) {
        $nueva_recompensa = 50;  // Épico
    } elseif ($randomNumber <= 50) {
        $nueva_recompensa = 20;  // Raro
    } else {
        $nueva_recompensa = 5;   // Común
    }    // 3. Actualizar recompensas
    $recompensa_actual += $nueva_recompensa;
    $stmt = $db->prepare("UPDATE usuarios SET recompensas = ? WHERE username = ?");
    $stmt->execute([$recompensa_actual, $username]);

    // 4. Redirigir a recompensa
    header("Location: recompensa.php?recompensa=$nueva_recompensa");
    exit();
}

// Agregar esto después del if de open_box
if (isset($_POST['open_box_multi']) && $llaves >= 10) {
    // 1. Descontar llaves primero
    $llaves -= 10;
    $stmt = $db->prepare("UPDATE usuarios SET llaves = ? WHERE username = ?");
    $stmt->execute([$llaves, $username]);

    // 2. Generar recompensas
    $recompensas = [];
    $total_recompensa = 0;

    for ($i = 0; $i < 10; $i++) {
        $randomNumber = rand(1, 100);
        if ($randomNumber <= 1) {
            $recompensas[] = 100; // Legendario
            $total_recompensa += 100;
        } elseif ($randomNumber <= 10) {
            $recompensas[] = 50;  // Épico
            $total_recompensa += 50;
        } elseif ($randomNumber <= 50) {
            $recompensas[] = 20;  // Raro
            $total_recompensa += 20;
        } else {
            $recompensas[] = 5;   // Común
            $total_recompensa += 5;
        }
    }    // 3. Actualizar recompensas
    $recompensa_actual += $total_recompensa;
    $stmt = $db->prepare("UPDATE usuarios SET recompensas = ? WHERE username = ?");
    $stmt->execute([$recompensa_actual, $username]);

    // 4. Redirigir a recompensa con array de recompensas
    header("Location: recompensa.php?recompensa=" . implode(',', $recompensas));
    exit();
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Gacha</title>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Quicksand:wght@300;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #0A1428;
            --secondary: #091428;
            --accent: #C8AA6E;
            --text: #F0E6D2;
            --gradient: linear-gradient(45deg, #C8AA6E, #785A28);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Quicksand', sans-serif;
            background: var(--primary);
            color: var(--text);
            min-height: 100vh;
            background-image: url('https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt0e1b8fc19ad29fc2/5f4cef73d6449b30c5b11192/hextech-chest-article-header.jpg');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
        }

        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(10, 20, 40, 0.85);
            z-index: -1;
        }

        .header {
            background: rgba(9, 20, 40, 0.95);
            padding: 1rem;
            border-bottom: 2px solid var(--accent);
        }

        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 20px;
        }

        .user-stats {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .stat-item {
            background: rgba(200, 170, 110, 0.1);
            padding: 0.5rem 1rem;
            border: 1px solid var(--accent);
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .main-container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 2rem;
            text-align: center;
        }

        .chest-section {
            background: rgba(9, 20, 40, 0.8);
            border: 1px solid var(--accent);
            border-radius: 8px;
            padding: 2rem;
            margin: 2rem 0;
        }

        .chest-title {
            font-family: 'Cinzel Decorative', cursive;
            font-weight: 900;
            font-size: 2.5rem;
            color: var(--accent);
            margin-bottom: 1.5rem;
            text-transform: uppercase;
            letter-spacing: 3px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }

        .chest-image {
            width: 250px;
            height: 250px;
            border-radius: 50%;
            margin: 2rem auto;
            border: 2px solid var(--accent);
            box-shadow: 0 0 20px rgba(200, 170, 110, 0.3);
            transition: all 0.3s ease;
        }

        .chest-image:hover {
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(200, 170, 110, 0.5);
        }

        .buttons-container {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
        }

        .btn {
            background: var(--gradient);
            color: var(--primary);
            border: none;
            padding: 1rem 2rem;
            font-size: 1rem;
            font-family: 'Beaufort for LOL', serif;
            text-transform: uppercase;
            letter-spacing: 1px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            min-width: 200px;
        }

        .btn:disabled {
            background: #333;
            cursor: not-allowed;
            opacity: 0.7;
        }

        .btn:not(:disabled):hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(200, 170, 110, 0.4);
        }

        .btn::after {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
            );
            transform: rotate(45deg);
            transition: 0.5s;
        }

        .btn:hover::after {
            left: 100%;
        }

        .probabilities {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(9, 20, 40, 0.6);
            border-radius: 8px;
        }

        .probability-item {
            padding: 1rem;
            border: 1px solid var(--accent);
            border-radius: 4px;
            text-align: center;
        }

        @media (max-width: 768px) {
            .nav-container {
                flex-direction: column;
                gap: 1rem;
            }

            .probabilities {
                grid-template-columns: repeat(2, 1fr);
            }

            .buttons-container {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="overlay"></div>
    
    <header class="header">
        <div class="nav-container">
            <div class="user-stats">
                <div class="stat-item">
                    <i class="fas fa-user"></i>
                    <span><?php echo htmlspecialchars($username); ?></span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-key"></i>
                    <span><?php echo $llaves; ?> llaves</span>
                    <a href="transferencia.php" class="transfer-btn" title="Transferir Llaves">
                        <i class="fas fa-exchange-alt"></i>
                    </a>
                </div>
                <div class="stat-item">
                    <i class="fas fa-globe"></i>
                    <span><?php echo $recompensa_actual; ?> esferas</span>
                    <a href="transferencia_esferas.php" class="transfer-btn" title="Transferir Esferas">
                        <i class="fas fa-exchange-alt"></i>
                    </a>
                </div>

            </div>
            <div class="user-stats">
                <a href="tienda.php" class="stat-item">                <i class="fas fa-store"></i> Tienda
                </a>
                <a href="seleccion.php" class="stat-item">
                    <i class="fas fa-home"></i> Inicio
                </a>
            </div>
        </div>
    </header>

    <main class="main-container">
        <section class="chest-section">
            <h1 class="chest-title">Cofre de Esferas</h1>
            
            <img src="https://img.freepik.com/fotos-premium/cofres-tesoro_665280-62729.jpg" 
                 alt="Cofre" 
                 class="chest-image">

            <div class="buttons-container">
                <form method="post">
                    <button type="submit" 
                            name="open_box" 
                            class="btn" 
                            <?php echo $llaves < 1 ? 'disabled' : ''; ?>>
                        <i class="fas fa-unlock-alt"></i> Abrir x1
                    </button>
                </form>
                <form method="post">
                    <button type="submit" 
                            name="open_box_multi" 
                            class="btn" 
                            <?php echo $llaves < 10 ? 'disabled' : ''; ?>>
                        <i class="fas fa-unlock-alt"></i> Abrir x10
                    </button>
                </form>
            </div>

            <div class="probabilities">
                <div class="probability-item">
                    <h3>Común</h3>
                    <p>50%</p>
                    <p>5 Esferas</p>
                </div>
                <div class="probability-item">
                    <h3>Raro</h3>
                    <p>40%</p>
                    <p>20 Esferas</p>
                </div>
                <div class="probability-item">
                    <h3>Épico</h3>
                    <p>9%</p>
                    <p>50 Esferas</p>
                </div>
                <div class="probability-item">
                    <h3>Legendario</h3>
                    <p>1%</p>
                    <p>100 Esferas</p>
                </div>
            </div>
        </section>
    </main>
</body>
</html>

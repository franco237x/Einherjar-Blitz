<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Gacha - Recompensa</title>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Quicksand:wght@300;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #0A1428;
            --secondary: #091428;
            --accent: #C8AA6E;
            --text: #F0E6D2;
            --epic: #b76bff;
            --rare: #6bc3ff;
            --common: #ffffff;
        }

        body {
            margin: 0;
            min-height: 100vh;
            background-color: #000814;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: 'Quicksand', sans-serif;
            color: var(--text);
            position: relative;
        }

        .reward-card {
            background: rgba(10, 20, 40, 0.95);
            border: 1px solid var(--accent);
            border-radius: 10px;
            padding: 2rem;
            width: 300px;
            text-align: center;
            position: relative;
            animation: fadeIn 0.5s ease-out;
            box-shadow: 0 0 20px rgba(200, 170, 110, 0.1);
        }

        .total-reward {
            font-family: 'Cinzel Decorative', cursive;
            font-size: 2.5rem;
            color: var(--accent);
            margin-bottom: 2rem;
            animation: scaleIn 0.5s ease-out 0.2s both;
            text-shadow: 0 0 10px rgba(200, 170, 110, 0.5);
        }

        .spheres-icon {
            width: 120px;
            height: 120px;
            margin-bottom: 1rem;
            border-radius: 80%;
        }




        .breakdown {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            font-size: 1.1rem;
        }

        .reward-item {
            padding: 0.5rem;
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.05);
            transition: transform 0.3s ease;
        }

        .reward-item:hover {
            transform: translateX(5px);
        }

        .reward-title {
            font-size: 0.8em;
            opacity: 0.8;
            margin-bottom: 0.2rem;
        }

        .reward-amount {
            font-size: 1.2em;
            font-weight: bold;
        }

        .epic { 
            color: var(--epic);
            border-left: 3px solid var(--epic);
        }
        .rare { 
            color: var(--rare);
            border-left: 3px solid var(--rare);
        }
        .common { 
            color: var(--common);
            border-left: 3px solid var(--common);
        }

        .btn-volver {
            margin-top: 2rem;
            color: var(--accent);
            text-decoration: none;
            font-size: 0.9rem;
            opacity: 0.8;
            transition: all 0.3s ease;
            padding: 0.5rem 1rem;
            border: 1px solid var(--accent);
            border-radius: 5px;
        }

        .btn-volver:hover {
            opacity: 1;
            background: rgba(200, 170, 110, 0.1);
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="reward-card">
        <?php
        $recompensas = explode(',', $_GET['recompensa']);
        $total = array_sum($recompensas);
        $counts = array_count_values($recompensas);
        ?>
        
        <img src="https://img.freepik.com/fotos-premium/esfera-diamante-oscuro_1166198-3719.jpg" alt="Esferas" class="spheres-icon">
        <div class="total-reward">+<?php echo $total; ?> ESFERAS</div>
        
        <div class="breakdown">
            <?php if (isset($counts[100])): ?>
                <div class="reward-item legendary">
                    <div class="reward-title">LEGENDARIO</div>
                    <div class="reward-amount"><?php echo $counts[100]; ?> × 100 Esferas</div>
                </div>
            <?php endif; ?>
            <?php if (isset($counts[50])): ?>
                <div class="reward-item epic">
                    <div class="reward-title">ÉPICO</div>
                    <div class="reward-amount"><?php echo $counts[50]; ?> × 50 Esferas</div>
                </div>
            <?php endif; ?>
            <?php if (isset($counts[20])): ?>
                <div class="reward-item rare">
                    <div class="reward-title">RARO</div>
                    <div class="reward-amount"><?php echo $counts[20]; ?> × 20 Esferas</div>
                </div>
            <?php endif; ?>
            <?php if (isset($counts[5])): ?>
                <div class="reward-item common">
                    <div class="reward-title">COMÚN</div>
                    <div class="reward-amount"><?php echo $counts[5]; ?> × 5 Esferas</div>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <a href="ruleta.php" class="btn-volver">Volver al Gacha</a>
</body>
</html>

<?php
function obtener_clase_recompensa($cantidad_esferas) {
    if ($cantidad_esferas == 5) {
        return "celeste";
    } elseif ($cantidad_esferas == 20) {
        return "naranja";
    } elseif ($cantidad_esferas == 50) {
        return "morado";
    } elseif ($cantidad_esferas == 100) {
        return "dorado";
    } else {
        return "";
    }
}
?>

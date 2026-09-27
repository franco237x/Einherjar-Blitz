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

$db = Database::getInstance();
$mensaje = null;
$TASA_CONVERSION = 50;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['cantidad_llaves'])) {
    $cantidad = (int) $_POST['cantidad_llaves'];

    if ($cantidad <= 0) {
        $mensaje = ['tipo' => 'error', 'texto' => 'Ingresa una cantidad válida de llaves.'];
    } elseif ($cantidad > (int) $userData['llaves']) {
        $mensaje = ['tipo' => 'error', 'texto' => 'No tienes suficientes llaves para esta conversión.'];
    } else {
        $esferas = $cantidad * $TASA_CONVERSION;
        try {
            $db->beginTransaction();

            $update = $db->prepare("UPDATE usuarios SET llaves = llaves - ?, recompensas = recompensas + ? WHERE id = ?");
            $update->execute([$cantidad, $esferas, $userData['id']]);

            $insertTx = $db->prepare("INSERT INTO transacciones_einherjer (user_id, username, tipo, cantidad, descripcion) VALUES (?, ?, 'transferencia', ?, ?)");
            $descripcion = sprintf('Conversión rápida: %d llaves → %d esferas', $cantidad, $esferas);
            $insertTx->execute([$userData['id'], $userData['username'], $esferas, $descripcion]);

            $db->commit();

            $userData['llaves'] -= $cantidad;
            $userData['recompensas'] += $esferas;
            $mensaje = ['tipo' => 'exito', 'texto' => "Conversión exitosa. Recibiste {$esferas} Esferas por {$cantidad} Llave(s)."];
        } catch (Exception $e) {
            $conn = $db->getConnection();
            if ($conn->inTransaction()) {
                $db->rollback();
            }
            $mensaje = ['tipo' => 'error', 'texto' => 'Hubo un problema al procesar la conversión.'];
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conversión Rápida - Einherjer Blitz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #050505;
            --bg-gradient: radial-gradient(circle at top, #1a1207 0%, #050505 60%);
            --gold: #c9aa71;
            --gold-soft: rgba(201,170,113,0.3);
            --text-light: #f4f4f4;
            --text-muted: #9b9b9b;
            --card-bg: rgba(15, 15, 15, 0.85);
        }
        body {
            margin: 0;
            min-height: 100vh;
            background: var(--bg-gradient);
            color: var(--text-light);
            font-family: 'Inter', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
        }
        .converter-wrapper {
            width: min(480px, 100%);
            background: var(--card-bg);
            border: 1px solid rgba(201,170,113,0.25);
            border-radius: 18px;
            padding: 2.5rem 2rem;
            box-shadow: 0 25px 60px rgba(0,0,0,0.45);
            position: relative;
            overflow: hidden;
        }
        .converter-wrapper::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(201,170,113,0.08), transparent 55%);
            pointer-events: none;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
        }
        .header-title {
            font-family: 'Cinzel', serif;
            font-size: 1.6rem;
            letter-spacing: 0.08em;
            color: var(--gold);
            margin: 0;
        }
        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            color: var(--text-muted);
            text-decoration: none;
            font-size: 0.9rem;
            transition: color 0.3s ease;
        }
        .back-link:hover {color: var(--gold);}
        .rate-card {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.2rem;
            border-radius: 14px;
            background: rgba(0,0,0,0.45);
            border: 1px solid rgba(201,170,113,0.18);
            margin-bottom: 1.5rem;
        }
        .rate-card strong {
            font-family: 'Cinzel', serif;
            font-size: 1.3rem;
        }
        .balance-card {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        .balance-box {
            background: rgba(0,0,0,0.55);
            padding: 1rem;
            border-radius: 12px;
            border: 1px solid rgba(201,170,113,0.15);
        }
        .balance-box .label {color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em;}
        .balance-box .value {font-family: 'Cinzel', serif; font-size: 1.4rem; color: var(--gold);}
        .form-label {color: var(--text-muted); font-size: 0.85rem; letter-spacing: 0.04em;}
        .form-control {
            background: rgba(0,0,0,0.55);
            border: 1px solid rgba(201,170,113,0.2);
            color: var(--text-light);
            padding: 0.75rem 1rem;
            border-radius: 10px;
        }
        .form-control:focus {
            border-color: var(--gold);
            box-shadow: 0 0 0 0.25rem rgba(201,170,113,0.15);
            background: rgba(0,0,0,0.75);
        }
        .btn-convert {
            margin-top: 1.5rem;
            width: 100%;
            padding: 0.8rem;
            border-radius: 12px;
            background: linear-gradient(120deg, #c9aa71, #f0d196);
            border: none;
            color: #1b1305;
            font-weight: 600;
            letter-spacing: 0.05em;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .btn-convert:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(201,170,113,0.35);
        }
        .btn-convert:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        .message {
            margin-bottom: 1rem;
            padding: 0.85rem 1rem;
            border-radius: 10px;
            border: 1px solid transparent;
            display: flex;
            align-items: center;
            gap: 0.6rem;
            font-size: 0.95rem;
        }
        .message i {font-size: 1.2rem;}
        .message.exito {
            background: rgba(46, 80, 38, 0.55);
            border-color: rgba(132, 187, 102, 0.45);
            color: #dff7d5;
        }
        .message.error {
            background: rgba(90, 32, 32, 0.55);
            border-color: rgba(200, 90, 90, 0.45);
            color: #ffd5d5;
        }
        @media (max-width: 576px) {
            .converter-wrapper {padding: 2rem 1.5rem;}
            .balance-card {grid-template-columns: 1fr;}
        }
    </style>
</head>
<body>
    <div class="converter-wrapper">
        <div class="header">
            <h1 class="header-title">Conversión Rápida</h1>
            <a href="dashboard.php" class="back-link"><i class="fas fa-arrow-left"></i> Volver al Dashboard</a>
        </div>

        <div class="rate-card">
            <div>
                <span class="text-uppercase text-muted" style="letter-spacing:0.08em; font-size:0.75rem;">Tasa actual</span>
                <strong>1 Llave = <?php echo $TASA_CONVERSION; ?> Esferas</strong>
            </div>
            <i class="fas fa-balance-scale-right fa-2x" style="color: var(--gold);"></i>
        </div>

        <div class="balance-card">
            <div class="balance-box">
                <div class="label">Llaves disponibles</div>
                <div class="value"><?php echo number_format((int) $userData['llaves']); ?></div>
            </div>
            <div class="balance-box">
                <div class="label">Esferas actuales</div>
                <div class="value"><?php echo number_format((int) $userData['recompensas']); ?></div>
            </div>
        </div>

        <?php if ($mensaje): ?>
            <div class="message <?php echo $mensaje['tipo']; ?>">
                <i class="fas fa-<?php echo $mensaje['tipo'] === 'exito' ? 'check-circle' : 'exclamation-circle'; ?>"></i>
                <span><?php echo htmlspecialchars($mensaje['texto']); ?></span>
            </div>
        <?php endif; ?>

        <form method="POST" autocomplete="off">
            <label for="cantidad_llaves" class="form-label">Cantidad de llaves a convertir</label>
            <input type="number" id="cantidad_llaves" name="cantidad_llaves" class="form-control" min="1" max="<?php echo (int) $userData['llaves']; ?>" placeholder="Ej. 1" required>
            <div class="mt-2 text-muted" style="font-size:0.85rem;">
                Recibirás <span id="previewEsferas">0</span> Esferas.
            </div>

            <button type="submit" class="btn-convert" <?php echo (int) $userData['llaves'] === 0 ? 'disabled' : ''; ?>>Convertir ahora</button>
        </form>
    </div>

    <script>
        const tasa = <?php echo $TASA_CONVERSION; ?>;
        const input = document.getElementById('cantidad_llaves');
        const preview = document.getElementById('previewEsferas');

        function actualizarPreview() {
            const valor = parseInt(input.value, 10);
            if (Number.isNaN(valor) || valor <= 0) {
                preview.textContent = '0';
            } else {
                preview.textContent = new Intl.NumberFormat().format(valor * tasa);
            }
        }

        input.addEventListener('input', actualizarPreview);
        actualizarPreview();
    </script>
</body>
</html>

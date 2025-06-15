<?php
require_once '../includes/AuthController.php';
require_once '../includes/Database.php';

$auth = new AuthController();

if (!$auth->isAuthenticated()) {
    header("Location: ../login.php");
    exit();
}

$userData = $auth->getUserData();
$username = $userData['username'];

try {
    $db = Database::getInstance();
    
    // Obtener balance del usuario
    $sql_balance = "SELECT SUM(cantidad) AS balance FROM transacciones_einherjer WHERE username = ?";
    $stmt = $db->prepare($sql_balance);
    $stmt->execute([$username]);
    $balance = $stmt->fetch()['balance'] ?? 0;

    // Obtener inversión actual del usuario si existe
    $sql_inversion = "SELECT * FROM launchpool_inversiones WHERE username = ? AND estado = 'activo'";
    $stmt = $db->prepare($sql_inversion);
    $stmt->execute([$username]);
    $inversion_actual = $stmt->fetch();
} catch (Exception $e) {
    error_log("Error en launchpool.php: " . $e->getMessage());
    $balance = 0;
    $inversion_actual = false;
}

?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Launchpool - Esferas</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body {
            background-color: #0a0a0a;
            color: #ffffff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .launchpool-container {
            max-width: 800px;
            margin: 50px auto;
            padding: 30px;
            background: linear-gradient(145deg, #1a1a1a, #2a2a2a);
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }

        .pool-header {
            text-align: center;
            margin-bottom: 40px;
        }

        .pool-title {
            color: #f3a712;
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 20px;
        }

        .pool-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }

        .stat-card {
            background: rgba(255,255,255,0.05);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
        }

        .stat-value {
            font-size: 1.5em;
            color: #f3a712;
            font-weight: bold;
        }

        .stat-label {
            color: #888;
            font-size: 0.9em;
        }

        .investment-form {
            background: rgba(255,255,255,0.05);
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
        }

        .timer-container {
            text-align: center;
            margin-top: 30px;
        }

        .timer {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 15px;
        }

        .timer-block {
            background: #f3a712;
            padding: 15px;
            border-radius: 10px;
            min-width: 80px;
        }

        .timer-value {
            font-size: 1.8em;
            font-weight: bold;
            color: #000;
        }

        .timer-label {
            font-size: 0.8em;
            color: #000;
        }

        .btn-invest {
            background: #f3a712;
            border: none;
            padding: 12px 30px;
            border-radius: 10px;
            font-weight: bold;
            transition: all 0.3s ease;
        }

        .btn-invest:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(243, 167, 18, 0.4);
        }

        .reward-calculator {
            background: rgba(255,255,255,0.05);
            padding: 20px;
            border-radius: 15px;
            margin-top: 20px;
        }

        .sphere-icon {
            width: 100px;
            height: 100px;
            margin-bottom: 20px;
        }

        .progress {
            height: 10px;
            background-color: #2a2a2a;
            margin: 20px 0;
        }

        .progress-bar {
            background-color: #f3a712;
        }
    </style>
</head>
<body>
    <div class="launchpool-container">
        <div class="pool-header">
            <img src="esfera.png" alt="Esfera" class="sphere-icon">
            <h1 class="pool-title">Launchpool de Esferas</h1>
            <p>Invierte tus EINHERJER y obtén Esferas en 3 días</p>
        </div>

        <div class="pool-stats">
            <div class="stat-card">
                <div class="stat-value"><?php echo number_format($balance, 2); ?></div>
                <div class="stat-label">Tu balance EINHERJER</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">10x</div>
                <div class="stat-label">Multiplicador de recompensa</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">72h</div>
                <div class="stat-label">Tiempo de bloqueo</div>
            </div>
        </div>

        <?php if (!$inversion_actual): ?>
        <div class="investment-form">
            <h3 class="mb-4">Realizar inversión</h3>
            <form id="investForm">
                <div class="mb-3">
                    <label for="amount" class="form-label">Cantidad de EINHERJER a invertir</label>
                    <input type="number" class="form-control" id="amount" min="0.1" step="0.01" required>
                </div>
                <div class="reward-calculator mb-3">
                    <h4>Recompensa estimada</h4>
                    <p>Recibirás <span id="rewardAmount">0</span> Esferas</p>
                </div>
                <button type="submit" class="btn btn-invest">Invertir EINHERJER</button>
            </form>
        </div>
        <?php else: ?>
        <div class="timer-container">
            <h3>Tiempo restante para reclamar</h3>
            <div class="timer">
                <div class="timer-block">
                    <div class="timer-value" id="days">00</div>
                    <div class="timer-label">Días</div>
                </div>
                <div class="timer-block">
                    <div class="timer-value" id="hours">00</div>
                    <div class="timer-label">Horas</div>
                </div>
                <div class="timer-block">
                    <div class="timer-value" id="minutes">00</div>
                    <div class="timer-label">Minutos</div>
                </div>
                <div class="timer-block">
                    <div class="timer-value" id="seconds">00</div>
                    <div class="timer-label">Segundos</div>
                </div>
            </div>
            <div class="progress mt-4">
                <div class="progress-bar" role="progressbar" style="width: 0%"></div>
            </div>
            <p class="mt-3">
                Has invertido: <?php echo number_format($inversion_actual['cantidad'], 2); ?> EINHERJER<br>
                Recompensa esperada: <?php echo number_format($inversion_actual['cantidad'] * 10, 2); ?> Esferas
            </p>
        </div>
        <?php endif; ?>
    </div>

    <script>
        // Calculadora de recompensas
        document.getElementById('amount')?.addEventListener('input', function(e) {
            const amount = parseFloat(e.target.value) || 0;
            const reward = amount * 10; // Multiplicador de recompensa
            document.getElementById('rewardAmount').textContent = reward.toFixed(2);
        });

        // Manejo del formulario
        document.getElementById('investForm')?.addEventListener('submit', function(e) {
            e.preventDefault();
            const amount = document.getElementById('amount').value;

            fetch('procesar_launchpool.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: amount
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Inversión realizada con éxito');
                    window.location.reload();
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                alert('Error al procesar la inversión');
            });
        });

        <?php if ($inversion_actual): ?>
        // Temporizador
        function updateTimer() {
            const endTime = new Date('<?php echo $inversion_actual['fecha_fin']; ?>').getTime();
            const now = new Date().getTime();
            const distance = endTime - now;

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById('days').textContent = String(days).padStart(2, '0');
            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
            document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');

            // Actualizar barra de progreso
            const totalTime = 3 * 24 * 60 * 60 * 1000; // 3 días en milisegundos
            const elapsed = totalTime - distance;
            const progress = (elapsed / totalTime) * 100;
            document.querySelector('.progress-bar').style.width = `${progress}%`;

            if (distance < 0) {
                clearInterval(timerInterval);
                window.location.reload();
            }
        }

        const timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
        <?php endif; ?>
    </script>
</body>
</html>

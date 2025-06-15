<?php
require_once '../includes/Database.php';

$auth = new AuthController();

// Verificar autenticación
if (!$auth->isAuthenticated()) {
    header("Location: ../index.php");
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    header("Location: ../index.php");
    exit();
}

$username = $userData['username'];
$db = Database::getInstance();

// Obtener balance del usuario
$sql_balance = "SELECT SUM(cantidad) AS balance FROM transacciones_einherjer WHERE username = ?";
$stmt_balance = $db->prepare($sql_balance);
$stmt_balance->execute([$username]);
$result_balance = $stmt_balance->fetch();
$balance = $result_balance['balance'] ?? 0.0;

// Obtener la hora del último minado
$sql_last_mine = "SELECT MAX(fecha) as last_mine FROM transacciones_einherjer WHERE username = ? AND tipo = 'minado'";
$stmt_last_mine = $db->prepare($sql_last_mine);
$stmt_last_mine->execute([$username]);
$result_last_mine = $stmt_last_mine->fetch();
$last_mine_time = null;

if ($result_last_mine && $result_last_mine['last_mine']) {
    $last_mine_time = strtotime($result_last_mine['last_mine']);
}

$can_mine = true;
$remaining_time = 0;

// Verificación de 4 horas
if ($last_mine_time) {
    $current_time = time();
    $time_diff = $current_time - $last_mine_time;

    if ($time_diff < 14400) { // 14400 segundos = 4 horas
        $can_mine = false;
        $remaining_time = 14400 - $time_diff;
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Einherjer Wallet</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body {
            background-color: #141414;
            color: #ffffff;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        .container {
            margin-top: 50px;
        }
        .balance-box {
            background-color: #1e1e1e;
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .btn {
            transition: all 0.3s ease;
            font-weight: 500;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .btn-warning {
            background-color: #f3a712;
            border: none;
            color: #000;
        }
        .btn-warning:hover {
            background-color: #e09300;
            color: #fff;
        }
        .mining-section {
            background-color: #1e1e1e;
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .progress {
            height: 20px;
            background-color: #2a2a2a;
            border-radius: 10px;
        }
        .progress-bar {
            background-color: #f3a712;
            color: #000;
            font-weight: 500;
        }
        .timer {
            font-size: 1.2rem;
            color: #ff6f00;
            font-weight: 500;
        }
        .terrenos-section {
            background-color: #1e1e1e;
            padding: 25px;
            border-radius: 15px;
            margin-top: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .terrenos-section h2 {
            color: #f3a712;
            margin-bottom: 20px;
            text-align: center;
        }

        .terrenos-section h4 {
            color: #f3a712;
            margin-bottom: 15px;
        }

        .user-terrenos {
    margin-bottom: 30px;
}

.user-terreno {
    background-color: #2a2a2a;
    padding: 15px;
    border-radius: 10px;
    height: 100%;
    transition: transform 0.3s ease;
}

.user-terreno:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(243, 167, 18, 0.2);
}

.terreno-info h5 {
    color: #f3a712;
    margin-bottom: 10px;
}

.terreno-info p {
    margin: 5px 0;
    font-size: 0.9rem;
}

.btn-warning.btn-sm {
    margin-top: 10px;
    width: 100%;
}


        .user-terreno, .no-terreno {
            background-color: #2a2a2a;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
        }

        .no-terreno {
            text-align: center;
            color: #888;
        }

        .terreno-info p {
            margin: 5px 0;
        }

        .terrenos-market {
            margin-top: 20px;
        }

        .table-dark {
            background-color: #2a2a2a;
            border-radius: 10px;
            overflow: hidden;
        }

        .table-dark thead th {
            background-color: #1e1e1e;
            border-bottom: 2px solid #f3a712;
        }

        .text-success {
            color: #4caf50 !important;
        }

        .text-danger {
            color: #f44336 !important;
        }

        .btn-mine {
            background-color: #f3a712;
            border: none;
            color: #000;
            padding: 12px 30px;
            font-size: 1.1rem;
            font-weight: 500;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .btn-mine:hover {
            background-color: #e09300;
            color: #fff;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }

        .btn-mine:disabled {
            background-color: #666;
            cursor: not-allowed;
            transform: none;
        }

        .mining-section h2 {
            color: #f3a712;
            margin-bottom: 1rem;
            font-weight: 600;
        }

        .mining-section p {
            color: #aaa;
            margin-bottom: 1.5rem;
        }

        .crypto-logo {
            max-width: 120px;
            border-radius: 70%;
            animation: float 6s ease-in-out infinite, rotate 20s linear infinite;
            box-shadow: 0 0 20px rgba(243, 167, 18, 0.3);
        }


        .logo-container {
            width: 120px;
            height: 120px;
            margin: 0 auto 1.5rem;
            position: relative;
        }

    </style>
</head>
<body>
    <div class="container">
        <div class="balance-box">
            <div class="logo-container">
                <img src="cripto.jpeg" alt="Einherjer Logo" class="crypto-logo">
            </div>
            <h1 class="text-warning mb-4">Einherjer Wallet</h1>
            <div class="mb-4">
                <p class="mb-2">Bienvenido, <?php echo htmlspecialchars($username); ?>.</p>
                <h3 class="mb-3">Tu balance es de <strong id="balance"><?php echo number_format($balance, 10); ?></strong> EINHERJER</h3>
                <!-- Nuevo recuadro de cotización -->
                <div class="exchange-rate p-3 mx-auto" style="max-width: 300px; background-color: #2a2a2a; border-radius: 10px; border: 1px solid #f3a712;">
                    <p class="mb-0" style="color: #f3a712;">
                        <i class="fas fa-exchange-alt me-2"></i>
                        1 EINHERJER = 10 Esencias Azules
                    </p>
                </div>
            </div>
        </div>
        <div class="action-buttons d-flex justify-content-center gap-3 mb-4">
            <a href="#" class="btn btn-warning px-4 py-2">
                <i class="fas fa-store me-2"></i>Tienda
            </a>
            <a href="transferir.php" class="btn btn-secondary px-4 py-2">
                <i class="fas fa-exchange-alt me-2"></i>Transferir
            </a>
            <a href="#" class="btn btn-success px-4 py-2">
                <i class="fas fa-wallet me-2"></i>Depositar
            </a>
            <a href="farm.php" class="btn btn-success px-4 py-2">
                <i class="fas fa-wallet me-2"></i>Zona de Farmeo
            </a>
        </div>
        <div class="mining-section">
            <h2>Minar Einherjer</h2>
            <p>Puedes minar Einherjer cada 4 horas. Límite diario: 10 minados.</p>
            <?php if ($can_mine): ?>
                <button id="mineButton" class="btn-mine d-flex align-items-center justify-content-center mx-auto">
                    <i class="fas fa-hammer me-2"></i>
                    Minar
                </button>
                <div class="progress" id="progressBarContainer" style="display:none;">
                    <div class="progress-bar" id="progressBar">0%</div>
                </div>
                <div id="miningMessage" class="mt-3"></div>
            <?php else: ?>
                <div class="timer">
                    Tiempo restante para minar: 
                    <?php
                        $hours = floor($remaining_time / 3600);
                        $minutes = floor(($remaining_time % 3600) / 60);
                        $seconds = $remaining_time % 60;
                        printf("%02d:%02d:%02d", $hours, $minutes, $seconds);
                    ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
    <!-- Sección de terrenos -->
    <div class="terrenos-section mt-4">
    <h2>Mercado de Terrenos</h2>
    
    <?php    // Consultar todos los terrenos del usuario
    $sql_terrenos_usuario = "SELECT t.nombre, t.precio_actual, tu.fecha_compra, tu.id as terreno_usuario_id 
                           FROM terrenos_usuarios tu 
                           JOIN terrenos_tipos t ON tu.terreno_id = t.id 
                           WHERE tu.username = ?";
    $stmt_terrenos = $db->prepare($sql_terrenos_usuario);
    $stmt_terrenos->execute([$username]);
    $terrenos_result = $stmt_terrenos->fetchAll();
    
    if (count($terrenos_result) > 0) {
        ?>
        <div class="user-terrenos">
            <h4>Tus Terrenos</h4>
            <div class="row">
                <?php foreach ($terrenos_result as $terreno) { ?>
                    <div class="col-md-4 mb-3">
                        <div class="user-terreno">
                            <div class="terreno-info">
                                <h5><?php echo htmlspecialchars($terreno['nombre']); ?></h5>
                                <p>Valor actual: <?php echo number_format($terreno['precio_actual'], 2); ?> EINHERJER</p>
                                <p>Fecha de compra: <?php echo date('d/m/Y', strtotime($terreno['fecha_compra'])); ?></p>
                                <!-- Puedes agregar más información o botones de acción aquí -->

                            </div>
                        </div>
                    </div>                <?php } ?>
            </div>
        </div>
    <?php } else { ?>
        <div class="no-terreno">
            <p>No tienes terrenos</p>
        </div>
    <?php } ?>


    <div class="terrenos-market">
        <h4>Cotización de Terrenos</h4>
        <div class="table-responsive">
            <table class="table table-dark">
                <thead>
                    <tr>
                        <th>Terreno</th>
                        <th>Precio</th>
                        <th>Variación</th>
                    </tr>
                </thead>
                <tbody>
                    <?php                    // Consultar terrenos disponibles en el mercado
                    $sql_terrenos_market = "SELECT * FROM terrenos_tipos ORDER BY precio_actual ASC";
                    $terrenos_market = $db->prepare($sql_terrenos_market);
                    $terrenos_market->execute();
                    $terrenos_market_result = $terrenos_market->fetchAll();                    
                    foreach ($terrenos_market_result as $terreno) {
                        $variacion = (($terreno['precio_actual'] - $terreno['precio_anterior']) / $terreno['precio_anterior']) * 100;
                        $variacion_class = $variacion >= 0 ? 'text-success' : 'text-danger';
                        $variacion_symbol = $variacion >= 0 ? '+' : '';
                        ?>
                        <tr>
                            <td><?php echo htmlspecialchars($terreno['nombre']); ?></td>
                            <td><?php echo number_format($terreno['precio_actual'], 2); ?></td>
                            <td class="<?php echo $variacion_class; ?>">
                                <?php echo $variacion_symbol . number_format($variacion, 2) . '%'; ?>
                            </td>
                        </tr>
                    <?php } ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Nuevo botón de volver -->
<div class="text-center mt-4 mb-4">
    <a href="estadisticas.php" class="btn btn-outline-warning px-4 py-2">
        <i class="fas fa-chart-bar me-2"></i>
        Volver a Estadísticas
    </a>
</div>



    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.min.js"></script>
    <script src="https://kit.fontawesome.com/your-fontawesome-kit.js"></script>
    <script>
        <?php if ($can_mine): ?>
            document.getElementById('mineButton').addEventListener('click', function() {
                var progressBarContainer = document.getElementById('progressBarContainer');
                var progressBar = document.getElementById('progressBar');
                var miningMessage = document.getElementById('miningMessage');
                progressBarContainer.style.display = 'block';
                progressBar.style.width = '0%';
                progressBar.textContent = '0%';
                miningMessage.textContent = '';

                var width = 0;
                var interval = setInterval(function() {
                    if (width >= 100) {
                        clearInterval(interval);
                        // Realizar la solicitud AJAX para minar
                        $.ajax({
                            url: 'minar.php',
                            type: 'POST',
                            data: { minar: 1 },
                            dataType: 'json',
                            success: function(response) {
                                if (response.success) {
                                    miningMessage.style.color = 'green';
                                    miningMessage.textContent = response.message;
                                    document.getElementById('balance').textContent = response.balance;
                                } else {
                                    miningMessage.style.color = 'red';
                                    miningMessage.textContent = response.message;
                                }
                                // Ocultar la barra de progreso
                                progressBarContainer.style.display = 'none';
                                progressBar.style.width = '0%';
                                progressBar.textContent = '0%';
                            },
                            error: function() {
                                miningMessage.style.color = 'red';
                                miningMessage.textContent = 'Error en la solicitud.';
                                progressBarContainer.style.display = 'none';
                                progressBar.style.width = '0%';
                                progressBar.textContent = '0%';
                            }
                        });
                    } else {
                        width += 10;
                        progressBar.style.width = width + '%';
                        progressBar.textContent = width + '%';
                    }
                }, 200); // Ajusta la velocidad de la barra aquí
            });
        <?php endif; ?>

        <?php if (!$can_mine): ?>
            // Función para iniciar el temporizador
            function startTimer(duration, display) {
                var timer = duration, hours, minutes, seconds;
                setInterval(function () {
                    hours = parseInt(timer / 3600, 10);
                    minutes = parseInt((timer % 3600) / 60, 10);
                    seconds = parseInt(timer % 60, 10);

                    hours = hours < 10 ? "0" + hours : hours;
                    minutes = minutes < 10 ? "0" + minutes : minutes;
                    seconds = seconds < 10 ? "0" + seconds : seconds;

                    display.textContent = hours + ":" + minutes + ":" + seconds;

                    if (--timer < 0) {
                        timer = 0;
                        // Refrescar la página cuando el temporizador llegue a cero
                        window.location.reload();
                    }
                }, 1000);
            }

            window.onload = function () {
                var remaining = <?php echo $remaining_time; ?>;
                var display = document.querySelector('.timer');
                startTimer(remaining, display);
            };
        <?php endif; ?>
    </script>
</body>
</html>

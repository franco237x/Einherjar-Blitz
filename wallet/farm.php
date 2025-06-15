<?php
require_once '../includes/Database.php';

$auth = new AuthController();

// Verificar si el usuario está logueado
if (!$auth->isAuthenticated()) {
    header('Location: ../index.php');
    exit;
}

// Obtener datos del usuario
$userData = $auth->getUserData();
if (!$userData) {
    header('Location: ../index.php');
    exit;
}

$db = Database::getInstance();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'mine') {
    try {
        $username = $userData['username'];
        
        // Verificar los últimos 3 minados
        $sql = "SELECT fecha FROM transacciones_einherjer 
                WHERE username = ? AND tipo = 'minado' 
                ORDER BY fecha DESC LIMIT 3";
        $stmt = $db->prepare($sql);        $stmt->execute([$username]);
        $minados = $stmt->fetchAll();

        if (count($minados) >= 3) {
            $ultimo_minado = strtotime($minados[2]['fecha']);
            $tiempo_actual = time();
            $diferencia = $tiempo_actual - $ultimo_minado;
            
            if ($diferencia < 86400) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Debes esperar 24 horas desde tu último minado'
                ]);
                exit;
            }
        }

        // Insertar la nueva transacción
        $sql = "INSERT INTO transacciones_einherjer (username, cantidad, tipo, fecha) 
                VALUES (?, 0.01, 'minado', NOW())";
        $stmt = $db->prepare($sql);
        $stmt->execute([$username]);

        // Calcular minados restantes
        $minados_restantes = 3 - (count($minados) + 1);

        echo json_encode([
            'success' => true,
            'intentos_restantes' => $minados_restantes
        ]);
        exit;
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error en el proceso de minado: ' . $e->getMessage()
        ]);
        exit;
    }
}


// Obtener el número de intentos del día para mostrar en la página
// Obtener los últimos 3 minados del usuario
$username = $_SESSION['username'];
$sql = "SELECT fecha FROM transacciones_einherjer 
        WHERE username = ? AND tipo = 'minado' 
        ORDER BY fecha DESC LIMIT 3";
$stmt = $conn->prepare($sql);
$stmt->execute([$username]);
$minados = $stmt->fetchAll();

// Verificar si hay 3 minados y si han pasado 24 horas desde el último
$puede_minar = true;
$tiempo_espera = 0;
$intentos_hoy = 0;

if (count($minados) >= 3) {
    $ultimo_minado = strtotime($minados[2]['fecha']); // El más antiguo de los 3
    $tiempo_actual = time();
    $diferencia = $tiempo_actual - $ultimo_minado;
    
    if ($diferencia < 86400) { // 86400 segundos = 24 horas
        $puede_minar = false;
        $tiempo_espera = 86400 - $diferencia; // Tiempo restante en segundos
    }
} else {
    $intentos_hoy = 3 - count($minados);
}

// Formatear el tiempo de espera para mostrar
$tiempo_espera_formato = '';
if ($tiempo_espera > 0) {
    $horas = floor($tiempo_espera / 3600);
    $minutos = floor(($tiempo_espera % 3600) / 60);
    $segundos = $tiempo_espera % 60;
    $tiempo_espera_formato = sprintf("%02d:%02d:%02d", $horas, $minutos, $segundos);
}

?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zona de Farm - Einherjer</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body {
            background-color: #141414;
            color: #ffffff;
            font-family: 'Helvetica Neue', Arial, sans-serif;
        }

        .farm-container {
            background-color: #1e1e1e;
            padding: 3rem;
            border-radius: 15px;
            margin-top: 50px;
            box-shadow: 0 4px 20px rgba(243, 167, 18, 0.2);
            text-align: center;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        .timer-display {
            font-size: 4rem;
            font-weight: bold;
            color: #f3a712;
            margin: 2rem 0;
            text-shadow: 0 0 10px rgba(243, 167, 18, 0.3);
        }

        .reward-info {
            background-color: #2a2a2a;
            padding: 1.5rem;
            border-radius: 10px;
            margin: 2rem 0;
            border: 1px solid #f3a712;
        }

        .reward-amount {
            color: #4caf50;
            font-size: 1.5rem;
            font-weight: bold;
        }

        .progress {
            height: 25px;
            background-color: #2a2a2a;
            border-radius: 15px;
            margin: 2rem 0;
        }

        .progress-bar {
            background-color: #f3a712;
            transition: width 1s linear;
        }

        .status-message {
            font-size: 1.2rem;
            margin-top: 1rem;
            color: #4caf50;
        }

        .logo-container {
            margin-bottom: 2rem;
        }

        .logo-container img {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 3px solid #f3a712;
        }

        .title {
            color: #f3a712;
            margin-bottom: 1.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="farm-container">
            <div class="logo-container">
                <img src="cripto.jpeg" alt="Einherjer Logo">
            </div>
            <h1 class="title">Zona de Farm</h1>
            
            <div class="reward-info">
                <p class="mb-2">Recompensa por completar:</p>
                <span class="reward-amount">0.01 EINHERJER</span>
            </div>

            <?php if (!$puede_minar): ?>
    <div class="alert alert-warning">
        Has alcanzado el límite de 3 minados. Tiempo restante: <?php echo $tiempo_espera_formato; ?>
    </div>
<?php else: ?>
    <div id="timerSection">
        <div class="timer-display" id="timer">10</div>
        <div class="progress">
            <div class="progress-bar" id="progressBar" role="progressbar" style="width: 0%"></div>
        </div>
        <p class="status-message" id="statusMessage">
            Minados disponibles: <?php echo $intentos_hoy; ?>
        </p>
    </div>
<?php endif; ?>

            
            <a href="wallet.php" class="btn btn-secondary mt-3">Volver</a>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
    $(document).ready(function() {
        <?php if ($intentos_hoy < 3): ?>
        let timeLeft = 10;
        let progressWidth = 0;
        
        function updateTimer() {
            if (timeLeft > 0) {
                timeLeft--;
                $('#timer').text(timeLeft);
                progressWidth += 10;
                $('#progressBar').css('width', progressWidth + '%');
                setTimeout(updateTimer, 1000);
            } else {
                $.ajax({
                    url: window.location.href,
                    method: 'POST',
                    data: {
                        action: 'mine'
                    },
                    success: function(response) {
                        try {
                            let result = JSON.parse(response);
                            if (result.success) {
                                $('#statusMessage').html('¡Minado exitoso! 0.01 EINHERJER añadidos a tu wallet.<br>Intentos restantes hoy: ' + result.intentos_restantes);
                                $('#statusMessage').removeClass('text-danger').addClass('text-success');
                                
                                // Deshabilitar el timer y mostrar botón para reiniciar
                                $('#timerSection').append('<button class="btn btn-primary mt-3" onclick="location.reload()">Minar de nuevo</button>');
                                
                                // Si no quedan intentos, mostrar mensaje
                                if (result.intentos_restantes <= 0) {
                                    $('#timerSection').prepend('<div class="alert alert-warning mt-3">Has alcanzado el límite diario. Vuelve mañana.</div>');
                                }
                            } else {
                                $('#statusMessage').text(result.message);
                                $('#statusMessage').removeClass('text-success').addClass('text-danger');
                            }
                        } catch (e) {
                            $('#statusMessage').text('Error al procesar la respuesta del servidor');
                            $('#statusMessage').removeClass('text-success').addClass('text-danger');
                        }
                    },
                    error: function() {
                        $('#statusMessage').text('Error en la conexión con el servidor');
                        $('#statusMessage').removeClass('text-success').addClass('text-danger');
                    }
                });
            }
        }

        // Iniciar el temporizador
        updateTimer();
        <?php endif; ?>
    });
    </script>
</body>
</html>

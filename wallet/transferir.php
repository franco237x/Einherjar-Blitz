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
$mensaje = '';
$tipo_mensaje = '';
$db = Database::getInstance();

// Obtener balance actual del usuario
function obtenerBalance($db, $username) {
    $sql = "SELECT SUM(cantidad) AS balance FROM transacciones_einherjer WHERE username = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$username]);
    $result = $stmt->fetch();
    return $result['balance'] ?? 0;
}

$balance_actual = obtenerBalance($db, $username);

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $destinatario = trim($_POST['destinatario'] ?? '');
    $cantidad = floatval($_POST['cantidad'] ?? 0);
    
    // Validaciones
    if ($destinatario == $username) {
        $mensaje = "No puedes transferir Einherjer a ti mismo.";
        $tipo_mensaje = "danger";
    } elseif ($cantidad <= 0) {
        $mensaje = "La cantidad debe ser mayor que 0.";
        $tipo_mensaje = "danger";
    } elseif ($cantidad > $balance_actual) {
        $mensaje = "No tienes suficiente balance para realizar esta transferencia.";
        $tipo_mensaje = "danger";
    } else {
        // Verificar si el destinatario existe
        $sql_check = "SELECT username FROM usuarios WHERE username = ?";
        $stmt_check = $conn->prepare($sql_check);
        $stmt_check->bind_param("s", $destinatario);
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();
        
        if ($result_check->num_rows == 0) {
            $mensaje = "El usuario destinatario no existe.";
            $tipo_mensaje = "danger";
        } else {
            // Iniciar transacción
            $conn->begin_transaction();
            
            try {
                // Registrar la transferencia saliente
                $sql_envio = "INSERT INTO transacciones_einherjer (username, tipo, cantidad, fecha) VALUES (?, 'transferencia_enviada', ?, NOW())";
                $stmt_envio = $conn->prepare($sql_envio);
                $cantidad_negativa = -$cantidad;
                $stmt_envio->bind_param("sd", $username, $cantidad_negativa);
                $stmt_envio->execute();
                
                // Registrar la transferencia entrante
                $sql_recibo = "INSERT INTO transacciones_einherjer (username, tipo, cantidad, fecha) VALUES (?, 'transferencia_recibida', ?, NOW())";
                $stmt_recibo = $conn->prepare($sql_recibo);
                $stmt_recibo->bind_param("sd", $destinatario, $cantidad);
                $stmt_recibo->execute();
                
                $conn->commit();
                $mensaje = "Transferencia realizada con éxito.";
                $tipo_mensaje = "success";
                $balance_actual = obtenerBalance($conn, $username);
                
            } catch (Exception $e) {
                $conn->rollback();
                $mensaje = "Error al realizar la transferencia.";
                $tipo_mensaje = "danger";
            }
        }
        $stmt_check->close();
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transferir Einherjer</title>
    <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background-color: #141414;
            color: #ffffff;
        }
        .container {
            margin-top: 50px;
        }
        .card {
            background-color: #1e1e1e;
            border: none;
            border-radius: 15px;
            padding: 20px;
        }
        .btn-primary {
            background-color: #f3a712;
            border: none;
        }
        .btn-primary:hover {
            background-color: #e09300;
        }
        .btn-secondary {
            background-color: #37474f;
            border: none;
        }
        .btn-secondary:hover {
            background-color: #263238;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card">
                    <h2 class="text-center mb-4">Transferir Einherjer</h2>
                    
                    <?php if ($mensaje): ?>
                        <div class="alert alert-<?php echo $tipo_mensaje; ?>" role="alert">
                            <?php echo $mensaje; ?>
                        </div>
                    <?php endif; ?>
                    
                    <p class="text-center">Balance actual: <?php echo number_format($balance_actual, 10); ?> EINHERJER</p>
                    
                    <form method="POST" action="">
                        <div class="form-group">
                            <label for="destinatario">Usuario destinatario:</label>
                            <input type="text" class="form-control" id="destinatario" name="destinatario" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="cantidad">Cantidad a transferir:</label>
                            <input type="number" class="form-control" id="cantidad" name="cantidad" step="0.0000000001" required>
                        </div>
                        
                        <div class="text-center">
                            <button type="submit" class="btn btn-primary">Transferir</button>
                            <a href="wallet.php" class="btn btn-secondary">Volver</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.5.4/dist/umd/popper.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
</body>
</html>

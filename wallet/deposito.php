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

// Función para obtener el balance actual
function getCurrentBalance($db, $username) {
    $sql = "SELECT SUM(cantidad) AS balance FROM transacciones_einherjer WHERE username = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$username]);
    $result = $stmt->fetch();
    return $result['balance'] ?? 0;
}

$current_balance = getCurrentBalance($conn, $username);

// Procesar el depósito
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['amount']) && isset($_POST['payment_method'])) {
        $amount = floatval($_POST['amount']);
        $payment_method = $_POST['payment_method'];
        
        // Validar el monto
        if ($amount <= 0) {
            $error_message = "El monto debe ser mayor que 0";
        } else {
            // Simular el proceso de pago (en un entorno real, aquí irían las integraciones con las pasarelas de pago)
            $sql = "INSERT INTO transacciones_einherjer (username, cantidad, tipo, metodo_pago, fecha) 
                   VALUES (?, ?, 'deposito', ?, NOW())";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sds", $username, $amount, $payment_method);
            
            if ($stmt->execute()) {
                $success_message = "Depósito exitoso de " . $amount . " EINHERJER";
                $current_balance = getCurrentBalance($conn, $username);
            } else {
                $error_message = "Error al procesar el depósito";
            }
            $stmt->close();
        }
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Depositar EINHERJER</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body {
            background-color: #141414;
            color: #ffffff;
            font-family: 'Helvetica Neue', Arial, sans-serif;
        }
        .container {
            max-width: 800px;
            margin-top: 50px;
        }
        .deposit-card {
            background-color: #1e1e1e;
            border-radius: 15px;
            padding: 2rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .payment-method {
            background-color: #2a2a2a;
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .payment-method:hover {
            background-color: #333;
            transform: translateY(-2px);
        }
        .payment-method.selected {
            border: 2px solid #f3a712;
        }
        .btn-deposit {
            background-color: #f3a712;
            color: #000;
            border: none;
            padding: 12px 30px;
            border-radius: 10px;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        .btn-deposit:hover {
            background-color: #e09300;
            color: #fff;
            transform: translateY(-2px);
        }
        .crypto-info {
            background-color: #2a2a2a;
            border-radius: 10px;
            padding: 1rem;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="deposit-card">
            <h2 class="text-center text-warning mb-4">Depositar EINHERJER</h2>
            
            <?php if (isset($success_message)): ?>
                <div class="alert alert-success"><?php echo $success_message; ?></div>
            <?php endif; ?>
            
            <?php if (isset($error_message)): ?>
                <div class="alert alert-danger"><?php echo $error_message; ?></div>
            <?php endif; ?>

            <div class="text-center mb-4">
                <h4>Balance actual: <?php echo number_format($current_balance, 10); ?> EINHERJER</h4>
            </div>

            <form method="POST" action="">
                <div class="mb-4">
                    <label for="amount" class="form-label">Cantidad a depositar</label>
                    <input type="number" class="form-control" id="amount" name="amount" step="0.0000000001" required>
                </div>

                <div class="mb-4">
                    <label class="form-label">Método de pago</label>
                    <div class="payment-methods">
                        <div class="payment-method" onclick="selectPayment('efectivo')">
                            <input type="radio" name="payment_method" value="efectivo" required>
                            <i class="fas fa-money-bill-wave me-2"></i> Efectivo
                        </div>
                        <div class="payment-method" onclick="selectPayment('tarjeta')">
                            <input type="radio" name="payment_method" value="tarjeta">
                            <i class="fas fa-credit-card me-2"></i> Tarjeta de Crédito/Débito
                        </div>
                        <div class="payment-method" onclick="selectPayment('paypal')">
                            <input type="radio" name="payment_method" value="paypal">
                            <i class="fab fa-paypal me-2"></i> PayPal
                        </div>
                        <div class="payment-method" onclick="selectPayment('mercadopago')">
                            <input type="radio" name="payment_method" value="mercadopago">
                            <i class="fas fa-shopping-cart me-2"></i> Mercado Pago
                        </div>
                        <div class="payment-method" onclick="selectPayment('crypto')">
                            <input type="radio" name="payment_method" value="crypto">
                            <i class="fab fa-bitcoin me-2"></i> Criptomonedas
                        </div>
                    </div>
                </div>

                <div id="cryptoInfo" class="crypto-info" style="display: none;">
                    <h5 class="text-warning">Direcciones de depósito crypto:</h5>
                    <p><strong>Bitcoin:</strong> </p>
                    <p><strong>Ethereum:</strong> </p>
                    <p><strong>USDT (TRC20):</strong> </p>
                </div>

                <div class="text-center mt-4">
                    <button type="submit" class="btn btn-deposit">
                        <i class="fas fa-wallet me-2"></i>Realizar Depósito
                    </button>
                </div>
            </form>

            <div class="text-center mt-4">
                <a href="wallet.php" class="btn btn-outline-warning">
                    <i class="fas fa-arrow-left me-2"></i>Volver
                </a>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        function selectPayment(method) {
            $('.payment-method').removeClass('selected');
            $(`input[value="${method}"]`).prop('checked', true);
            $(`input[value="${method}"]`).closest('.payment-method').addClass('selected');
            
            if (method === 'crypto') {
                $('#cryptoInfo').slideDown();
            } else {
                $('#cryptoInfo').slideUp();
            }
        }
    </script>
</body>
</html>

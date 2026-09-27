<?php
require_once 'includes/AuthController.php';
require_once 'includes/Database.php';

$auth = new AuthController();

if (!$auth->isAuthenticated()) {
    header("Location: login.html");
    exit();
}

$userData = $auth->getUserData();
$username = $userData['username'];

try {
    $db = Database::getInstance();
    
    // Obtener datos del usuario y otros usuarios
    $stmt_datos = $db->prepare("SELECT username, llaves FROM usuarios WHERE username = ?");
    $stmt_datos->execute([$username]);
    $user_data = $stmt_datos->fetch();

    $stmt_otros = $db->prepare("SELECT username FROM usuarios WHERE username != ? ORDER BY username");
    $stmt_otros->execute([$username]);
    $otros_usuarios = $stmt_otros->fetchAll();
} catch (Exception $e) {
    error_log("Error en transferencia.php: " . $e->getMessage());
    die("Error en la conexión a la base de datos");
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transferencia de Llaves</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .main-container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            border: none;
            overflow: hidden;
        }

        .card-header {
            background: transparent;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            padding: 1.5rem;
        }

        .balance-card {
            background: linear-gradient(45deg, #3a7bd5, #00d2ff);
            border-radius: 15px;
            padding: 20px;
            color: white;
            margin-bottom: 2rem;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .key-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }

        .balance-amount {
            font-size: 2rem;
            font-weight: 600;
        }

        .form-select, .form-control {
            border-radius: 10px;
            padding: 12px;
            border: 2px solid #e9ecef;
            font-size: 1rem;
        }

        .form-select:focus, .form-control:focus {
            border-color: #3a7bd5;
            box-shadow: 0 0 0 0.25rem rgba(58, 123, 213, 0.25);
        }

        .btn-transfer {
            background: linear-gradient(45deg, #3a7bd5, #00d2ff);
            border: none;
            padding: 12px 30px;
            border-radius: 10px;
            font-weight: 500;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
        }

        .btn-transfer:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(58, 123, 213, 0.4);
        }

        .btn-back {
            background: #6c757d;
            border: none;
            padding: 12px 30px;
            border-radius: 10px;
            transition: all 0.3s ease;
        }

        .btn-back:hover {
            background: #5a6268;
            transform: translateY(-2px);
        }

        .toast {
            background: white;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .transaction-history {
            max-height: 300px;
            overflow-y: auto;
        }

        .transaction-item {
            padding: 15px;
            border-bottom: 1px solid #eee;
            transition: all 0.3s ease;
        }

        .transaction-item:hover {
            background: #f8f9fa;
        }

        @media (max-width: 768px) {
            .balance-amount {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="main-container">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <!-- Balance Card -->
                <div class="balance-card text-center mb-4">
                    <i class="fas fa-key key-icon"></i>
                    <h3>Tu Balance</h3>
                    <div class="balance-amount">
                        <span id="llaves-actuales"><?php echo $user_data['llaves']; ?></span> llaves
                    </div>
                </div>

                <!-- Transfer Card -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h4 class="mb-0"><i class="fas fa-exchange-alt me-2"></i>Transferir Llaves</h4>
                    </div>
                    <div class="card-body">
                        <form id="transferForm">
                            <div class="mb-4">
                                <label class="form-label">
                                    <i class="fas fa-user me-2"></i>Selecciona el destinatario
                                </label>                                <select class="form-select" name="destinatario" required>
                                    <option value="" selected disabled>Elige un usuario</option>
                                    <?php foreach ($otros_usuarios as $row): ?>
                                        <option value="<?php echo htmlspecialchars($row['username']); ?>">
                                            <?php echo htmlspecialchars($row['username']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div class="mb-4">
                                <label class="form-label">
                                    <i class="fas fa-key me-2"></i>Cantidad de llaves
                                </label>
                                <div class="input-group">
                                    <input type="number" class="form-control" name="cantidad" 
                                           min="1" max="<?php echo $user_data['llaves']; ?>" required>
                                    <span class="input-group-text">llaves</span>
                                </div>
                                <div class="form-text">
                                    Máximo disponible: <?php echo $user_data['llaves']; ?> llaves
                                </div>
                            </div>

                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-transfer text-white">
                                    <i class="fas fa-paper-plane me-2"></i>Realizar Transferencia
                                    <span class="spinner-border spinner-border-sm ms-2 d-none" id="submitSpinner"></span>
                                </button>
                                <a href="ruleta.php" class="btn btn-back text-white">
                                    <i class="fas fa-arrow-left me-2"></i>Volver al Juego
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
        <div id="transferToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <i class="fas fa-info-circle me-2"></i>
                <strong class="me-auto">Notificación</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body"></div>
        </div>
    </div>

    <!-- Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        document.getElementById('transferForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const spinner = document.getElementById('submitSpinner');
            const inputCantidad = this.querySelector('input[name="cantidad"]');
            const maxText = this.querySelector('.form-text');
            
            submitBtn.disabled = true;
            spinner.classList.remove('d-none');

            fetch('procesar_transferencia.php', {
                method: 'POST',
                body: new FormData(this)
            })
            .then(response => response.json())
            .then(data => {
                const toast = new bootstrap.Toast(document.getElementById('transferToast'));
                const toastBody = document.querySelector('.toast-body');
                const toastHeader = document.querySelector('.toast-header i');

                if (data.success) {
                    // Actualizar balance principal
                    document.getElementById('llaves-actuales').textContent = data.nuevoBalance;
                    
                    // Actualizar máximo de llaves en el input y texto
                    inputCantidad.max = data.nuevoBalance;
                    maxText.textContent = `Máximo disponible: ${data.nuevoBalance} llaves`;
                    
                    toastHeader.className = 'fas fa-check-circle text-success me-2';
                    toastBody.innerHTML = `
                        <div class="text-success">
                            <p class="mb-1"><strong>¡Transferencia exitosa!</strong></p>
                            <p class="mb-0">Has transferido ${data.detalles.cantidad} llaves a ${data.detalles.destinatario}</p>
                        </div>`;
                    
                    this.reset();
                } else {
                    toastHeader.className = 'fas fa-exclamation-circle text-danger me-2';
                    toastBody.innerHTML = `
                        <div class="text-danger">
                            <strong>Error:</strong> ${data.message}
                        </div>`;
                }

                toast.show();
            })
            .catch(error => {
                const toast = new bootstrap.Toast(document.getElementById('transferToast'));
                document.querySelector('.toast-header i').className = 'fas fa-exclamation-circle text-danger me-2';
                document.querySelector('.toast-body').innerHTML = `
                    <div class="text-danger">
                        <strong>Error:</strong> Ha ocurrido un error al procesar la transferencia
                    </div>`;
                toast.show();
            })
            .finally(() => {
                submitBtn.disabled = false;
                spinner.classList.add('d-none');
            });
        });
    </script>
</body>
</html>

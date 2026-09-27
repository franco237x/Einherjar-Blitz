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
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tienda Online</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- AOS CSS -->
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
    <!-- Custom CSS -->
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #2e2e2e;
            color: #ffffff;
        }

        h1 {
            color: #ab47bc;
        }

        .esferas-disponibles {
    color: #ab47bc;
    position: fixed;
    top: 10px;
    right: 10px;
    background-color: rgba(24, 24, 24, 0.8);
    padding: 5px 10px;
    border-radius: 20px;
    z-index: 1000;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 5px;
}

.esferas-disponibles p {
    margin: 0;
}

        .tienda-link {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #7e57c2;
            color: white;
            transition: background-color 0.3s ease;
            z-index: 1000;
            font-size: 15px;
        }

        .tienda-link:hover {
            background-color: #5e35b1;
        }

        .producto {
            background-color: #1c1c1c;
            border-radius: 15px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
            transition: transform 0.3s;
            overflow: hidden;
        }

        .producto:hover {
            transform: translateY(-10px);
        }

        .producto h2 {
            color: #ab47bc;
        }

        .producto img {
            transition: transform 0.3s;
        }

        .producto:hover img {
            transform: scale(1.1);
        }

        .producto form input[type="submit"] {
            background-color: #7e57c2;
            transition: background-color 0.3s ease;
        }

        .producto form input[type="submit"]:hover {
            background-color: #5e35b1;
        }

        #loader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }

        .spinner-border {
            width: 5rem;
            height: 5rem;
        }

        .bg-darker {
            background-color: #2e2e2e !important;
        }

        .form-control {
            color: white !important;
        }

        .form-control:focus {
            background-color: #2e2e2e !important;
            color: white !important;
            border-color: #ab47bc !important;
            box-shadow: 0 0 0 0.25rem rgba(171, 71, 188, 0.25) !important;
        }

        .form-control::placeholder {
            color: #888 !important;
        }
    </style>
    <link href="https://cdn.jsdelivr.net/npm/@sweetalert2/theme-dark@4/dark.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body>
    <!-- Loader -->
    <div id="loader">
        <div class="spinner-border text-light" role="status">
            <span class="visually-hidden">Cargando...</span>
        </div>
    </div>

    <div class="container mt-5">
        <h1 class="text-center mb-5" data-aos="fade-down">Bienvenido a la Tienda Online 🛒</h1>

        <div class="row justify-content-center mb-5">
            <div class="col-md-6">
                <div class="card bg-dark border-0 shadow">
                    <div class="card-body p-4">
                        <h3 class="text-center text-primary mb-3">
                            <i class="fas fa-gift me-2"></i>Canjear Cupón
                        </h3>
                        <form id="cuponForm" class="d-flex gap-2">
                            <input type="text" 
                                   class="form-control bg-darker text-white border-primary" 
                                   id="codigoCupon" 
                                   placeholder="Ingresa tu código de cupón" 
                                   required>
                            <button type="submit" class="btn btn-primary px-4">
                                Canjear
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <?php
        if (isset($_SESSION['username'])) {
            $username = $_SESSION['username'];

            $servername = "localhost";
            $username_db = "root";
            $password = "";
            $dbname = "usuarios";

            $conn = new mysqli($servername, $username_db, $password, $dbname);

            if ($conn->connect_error) {
                die("Error en la conexión a la base de datos: " . $conn->connect_error);
            }

            $sql_esferas = "SELECT recompensas FROM usuarios WHERE username = '$username'";
            $result_esferas = $conn->query($sql_esferas);

            if ($result_esferas->num_rows > 0) {
                $row_esferas = $result_esferas->fetch_assoc();
                $esferas_usuario = $row_esferas["recompensas"];
                echo "<div class='esferas-disponibles' data-aos='fade-left'>";
                echo "<p> Tienes🔮 $esferas_usuario esferas</p>";
                echo "</div>";
            } else {
                echo "No se encontraron registros.";
            }

            $sql_productos = "SELECT * FROM productos";
            $result_productos = $conn->query($sql_productos);

            if ($result_productos->num_rows > 0) {
                echo "<div class='row'>";
                while ($row_producto = $result_productos->fetch_assoc()) {
                    echo "<div class='col-md-4 mb-4' data-aos='zoom-in'>";
                    echo "<div class='producto p-4'>";
                    echo "<h2 class='text-center mb-3'>" . $row_producto["Nombre"] . "</h2>";
                    $imagen_url = $row_producto["Imagen_URL"];
                    echo "<img src='$imagen_url' alt='Producto' class='img-fluid rounded mb-3'>";
                    echo "<p class='text-center'>Precio: " . $row_producto["Precio_Esferas"] . " esferas 💎</p>";
                    echo "<p class='text-center'>Stock disponible: " . $row_producto["Stock"] . " 📦</p>";
                    echo "<form onsubmit='event.preventDefault(); realizarCompra(" . $row_producto["ID"] . ", this.querySelector(\"button\"));' class='text-center'>";
                    echo "<button type='submit' class='btn btn-primary' " . ($row_producto["Stock"] <= 0 ? 'disabled' : '') . ">";
                    echo ($row_producto["Stock"] <= 0 ? 'Agotado' : 'Comprar');
                    echo "</button>";
                    echo "</form>";
                    echo "</div>";
                    echo "</div>";
                }
                echo "</div>";
            } else {
                echo "No hay productos disponibles.";
            }

            $conn->close();
        } else {
            echo "<p class='text-center'>Inicia sesión para acceder a la tienda.</p>";
        }
        ?>
    </div>

    <a href="ruleta.php" class="tienda-link btn btn-lg">Volver a la Ruleta</a>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <!-- AOS JS -->
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script>
        AOS.init({
            duration: 1000,
            once: true
        });

        // Ocultar el loader cuando la página haya cargado completamente
        window.addEventListener('load', function() {
            document.getElementById('loader').style.display = 'none';
        });

        function realizarCompra(productId, button) {
            // Deshabilitar el botón
            button.disabled = true;
            
            // Agregar spinner al botón
            const originalText = button.innerHTML;
            button.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Procesando...
            `;

            fetch('procesar_compra.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `product_id=${productId}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Actualizar balance de esferas
                    const balanceElement = document.querySelector('.esferas-disponibles p');
                    balanceElement.textContent = `Tienes 🔮 ${data.newBalance} esferas`;

                    // Actualizar stock del producto
                    const stockElement = button.closest('.producto').querySelector('p:nth-of-type(2)');
                    stockElement.textContent = `Stock disponible: ${data.newStock} 📦`;

                    // Si no hay stock, deshabilitar el botón
                    if (data.newStock <= 0) {
                        button.disabled = true;
                        button.textContent = 'Agotado';
                    }

                    // Mostrar notificación de éxito
                    Swal.fire({
                        icon: 'success',
                        title: '¡Compra exitosa!',
                        text: data.message,
                        showConfirmButton: false,
                        timer: 2000
                    });
                } else {
                    // Mostrar error
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message
                    });
                }
            })
            .catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Ha ocurrido un error al procesar la compra'
                });
            })
            .finally(() => {
                // Restaurar el botón
                button.innerHTML = originalText;
                button.disabled = false;
            });
        }

        document.getElementById('cuponForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const codigo = document.getElementById('codigoCupon').value;
            const submitBtn = this.querySelector('button');
            
            submitBtn.disabled = true;
            
            fetch('canjear_cupon.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `codigo=${codigo}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const balanceElement = document.querySelector('.esferas-disponibles p');
                    balanceElement.textContent = `Tienes 🔮 ${data.newBalance} esferas`;
                    
                    Swal.fire({
                        icon: 'success',
                        title: '¡Cupón canjeado!',
                        text: data.message,
                        showConfirmButton: false,
                        timer: 2000
                    });
                    
                    this.reset();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message
                    });
                }
            })
            .catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Ha ocurrido un error al procesar el cupón'
                });
            })
            .finally(() => {
                submitBtn.disabled = false;
            });
        });
    </script>
</body>
</html>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Registro</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        .register-container {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            width: 300px;
            text-align: center;
        }

        h2 {
            margin-top: 0;
            color: #333;
        }

        label,
        input[type="text"],
        input[type="submit"] {
            display: block;
            width: 100%;
            margin-bottom: 10px;
        }

        input[type="text"],
        input[type="submit"] {
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #ccc;
        }

        input[type="submit"] {
            background-color: #007bff;
            color: #fff;
            cursor: pointer;
        }

        input[type="submit"]:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="register-container">
        <h2>Registro</h2>        <?php
        require_once 'includes/Database.php';

        if ($_SERVER["REQUEST_METHOD"] == "POST") {
            try {
                $db = Database::getInstance();
                
                $input_username = trim($_POST["username"] ?? '');
                $input_id = trim($_POST["unique_id"] ?? '');

                if (empty($input_username) || empty($input_id)) {
                    echo "<h3>Por favor completa todos los campos.</h3>";
                    echo "<a href='login.html'><button>Volver al inicio</button></a>";
                    exit();
                }

                // Check if user already exists
                $sql_check_user = "SELECT username FROM usuarios WHERE username = ?";
                $stmt = $db->prepare($sql_check_user);
                $stmt->execute([$input_username]);

                if ($stmt->fetch()) {
                    echo "<h3>El usuario ya existe.</h3>";
                    echo "<a href='login.html'><button>Volver al inicio</button></a>";
                } else {
                    // Insert new user
                    $sql_insert_user = "INSERT INTO usuarios (username, unique_id) VALUES (?, ?)";
                    $stmt = $db->prepare($sql_insert_user);
                    if ($stmt->execute([$input_username, $input_id])) {
                        echo "<h3>Usuario registrado correctamente.</h3>";
                        echo "<a href='index.html'><button>Volver al inicio</button></a>";
                    } else {
                        echo "<h3>Error en el registro.</h3>";
                        echo "<a href='login.html'><button>Volver al inicio</button></a>";
                    }
                }
            } catch (Exception $e) {
                error_log("Error en registro.php: " . $e->getMessage());
                echo "<h3>Error en el registro. Inténtalo de nuevo.</h3>";
                echo "<a href='login.html'><button>Volver al inicio</button></a>";
            }
            exit();
        }
        ?>

        <form action="<?php echo $_SERVER['PHP_SELF']; ?>" method="post">
            <label for="username">Nombre de usuario:</label>
            <input type="text" id="username" name="username" required>
            
            <label for="unique_id">Ingresa tu ID único:</label>
            <input type="text" id="unique_id" name="unique_id" required>
            
            <input type="submit" value="Registrar">
        </form>
        <p>Ya tienes cuenta? <a href="login.html">Volver al Login</a></p>
    </div>
</body>
</html>
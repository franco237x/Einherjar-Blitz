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
    
    // Consulta SQL para obtener las compras del usuario
    $sqlCompras = "SELECT * FROM recompensas_usuario WHERE username = ?";
    $stmtCompras = $db->prepare($sqlCompras);
    $stmtCompras->execute([$username]);
    $compras = $stmtCompras->fetchAll();

    // Contador de compras
    $numCompras = count($compras);

    // Si el número de compras es un múltiplo de 5, otorgar el cupón
    if ($numCompras >= 5 && $numCompras % 5 == 0) {
        $cuponExclusivo = "Invocación Exclusiva: Yhwach (Rey Espíritu Absorbido)" && "100 Monedas Clasificatoria";
        
        // Actualizar tabla de compras
        $sqlActualizarCompras = "INSERT INTO recompensas_usuario (username, recompensa_obtenida) VALUES (?, ?)";
        $stmtActualizarCompras = $db->prepare($sqlActualizarCompras);
        $stmtActualizarCompras->execute([$username, $cuponExclusivo]);
    }

    // Consulta SQL actualizada para obtener las compras del usuario
    $sqlComprasActualizado = "SELECT * FROM recompensas_usuario WHERE username = ?";
    $stmtComprasActualizado = $db->prepare($sqlComprasActualizado);
    $stmtComprasActualizado->execute([$username]);
    $comprasActualizadas = $stmtComprasActualizado->fetchAll();
} catch (Exception $e) {
    error_log("Error en ticket.php: " . $e->getMessage());
    $comprasActualizadas = [];
    $numCompras = 0;
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Ticket de Compras</title>
    <style>
        /* Estilos CSS para la presentación */
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1, h2 {
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        a {
            color: #0066cc;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Ticket de Compras</h1>
        <h2>Bienvenido, <?php echo $username; ?></h2>
        <p>Número total de compras: <?php echo $numCompras; ?></p>
        <table>
            <tr>
                <th>Número de compra</th>
                <th>Nombre del Artículo</th>
                <th>Fecha de Compra</th>
                <!-- Agrega más columnas según los detalles de tus compras -->
            </tr>            <?php
            // Mostrar las compras del usuario en una tabla
            foreach ($comprasActualizadas as $row) {
                echo "<tr>";
                echo "<td>" . htmlspecialchars($row['id']) . "</td>";
                echo "<td>" . htmlspecialchars($row['recompensa_obtenida']) . "</td>";
                echo "<td>" . htmlspecialchars($row['fecha_obtencion']) . "</td>";
                // Agrega más columnas aquí según los detalles de tus compras
                echo "</tr>";
            }
            ?>
        </table>
        <p>¿Quieres volver a los cofres? <a href="ruleta.php">Haz clic aquí</a>.</p>
    </div>
</body>
</html>

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
    
    $sql_datos_usuario = "SELECT username, recompensas FROM usuarios WHERE username = ?";
    $stmt_datos_usuario = $db->prepare($sql_datos_usuario);
    $stmt_datos_usuario->execute([$username]);
    $row_usuario = $stmt_datos_usuario->fetch();
    
    if ($row_usuario) {
        $nombre_usuario = $row_usuario['username'];
        $cantidad_esferas_usuario = $row_usuario['recompensas'];
    } else {
        $nombre_usuario = $username;
        $cantidad_esferas_usuario = 0;
    }

    $sql_nombres_usuarios = "SELECT username FROM usuarios WHERE username != ?";
    $stmt_nombres_usuarios = $db->prepare($sql_nombres_usuarios);
    $stmt_nombres_usuarios->execute([$username]);
    $otros_usuarios = $stmt_nombres_usuarios->fetchAll();
} catch (Exception $e) {
    error_log("Error en esferas.php: " . $e->getMessage());
    $nombre_usuario = $username;
    $cantidad_esferas_usuario = 0;
    $otros_usuarios = [];
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transferencia de Esferas</title>
    <style>
    body {
        font-family: Arial, sans-serif;
        background-color: #f2f2f2;
        margin: 0;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    h1 {
        color: #333;
        text-align: center;
    }

    p {
        color: #666;
        text-align: center;
        font-size: 18px;
        margin-bottom: 20px;
    }

    form {
        width: 100%;
        max-width: 400px;
        margin-top: 20px;
        padding: 20px;
        background-color: #fff;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    label {
        display: block;
        margin-bottom: 8px;
        color: #333;
        font-weight: bold;
    }

    select,
    input[type="number"],
    input[type="submit"] {
        padding: 10px;
        margin-bottom: 15px;
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    input[type="submit"] {
        background-color: #007bff;
        color: #fff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.3s ease;
    }

    input[type="submit"]:hover {
        background-color: #0056b3;
    }

    a {
        display: inline-block;
        margin-top: 20px;
        padding: 10px 20px;
        background-color: #28a745;
        color: #fff;
        text-decoration: none;
        border-radius: 5px;
        transition: background-color 0.3s ease;
    }

    a:hover {
        background-color: #218838;
    }
</style>

</head>
<body>
    <h1>Bienvenido, <?php echo $nombre_usuario; ?></h1>
    <p>Tienes <?php echo $cantidad_esferas_usuario; ?> esferas.</p>

    <form method="post" action="procesar_transferencia.php">
        <label for="destinatario">Transferir a:</label>        <select id="destinatario" name="destinatario" required>
            <?php
            foreach ($otros_usuarios as $row) {
                echo '<option value="' . htmlspecialchars($row['username']) . '">' . htmlspecialchars($row['username']) . '</option>';
            }
            ?>
        </select>
        <label for="cantidad">Cantidad de esferas a transferir (Máximo: <?php echo $cantidad_esferas_usuario; ?>):</label>
        <input type="number" id="cantidad" name="cantidad" required max="<?php echo $cantidad_esferas_usuario; ?>">
        <input type="submit" value="Transferir">
    </form>    <a href="ruleta.php">Volver</a>
</body>
</html>

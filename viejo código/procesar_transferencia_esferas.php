<?php
require_once 'includes/Database.php';

$auth = new AuthController();

// Verificar si el usuario está autenticado
if (!$auth->isAuthenticated()) {
    header("Location: index.php");
    exit();
}

// Verificar si se han enviado los datos del formulario
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $userData = $auth->getUserData();
    if (!$userData) {
        die("Error obteniendo datos del usuario.");
    }

    $username = $userData['username'];
    $destinatario = $_POST['destinatario'] ?? '';
    $cantidad = intval($_POST['cantidad'] ?? 0);

    // Validar que la cantidad sea un número positivo
    if ($cantidad <= 0) {
        die("La cantidad debe ser un número positivo.");
    }

    if (empty($destinatario)) {
        die("Debe especificar un destinatario.");
    }

    $db = Database::getInstance();

    try {
        // Iniciar transacción
        $db->beginTransaction();

        // Verificar que el usuario tiene suficientes esferas
        $stmt_check = $db->prepare("SELECT recompensas FROM usuarios WHERE username = ?");
        $stmt_check->execute([$username]);
        $row_check = $stmt_check->fetch();

        if (!$row_check || $row_check['recompensas'] < $cantidad) {
            throw new Exception("No tienes suficientes esferas para realizar esta transferencia.");
        }

        // Verificar que el destinatario existe
        $stmt_dest = $db->prepare("SELECT username FROM usuarios WHERE username = ?");
        $stmt_dest->execute([$destinatario]);
        if (!$stmt_dest->fetch()) {
            throw new Exception("El usuario destinatario no existe.");
        }

        // Restar esferas al usuario actual
        $stmt_restar = $db->prepare("UPDATE usuarios SET recompensas = recompensas - ? WHERE username = ?");
        $stmt_restar->execute([$cantidad, $username]);

        // Sumar esferas al destinatario
        $stmt_sumar = $db->prepare("UPDATE usuarios SET recompensas = recompensas + ? WHERE username = ?");
        $stmt_sumar->execute([$cantidad, $destinatario]);

        // Confirmar la transacción
        $db->commit();

        echo "Transferencia realizada con éxito.";
    } catch (Exception $e) {
        // Revertir la transacción en caso de error
        $db->rollback();
        echo "Error: " . $e->getMessage();
    }

    // Redirigir de vuelta a la página de transferencia
    header("Location: transferencia_esferas.php");
    exit();
} else {
    // Si no se enviaron datos por POST, redirigir a la página de transferencia
    header("Location: transferencia_esferas.php");
    exit();
}
?>

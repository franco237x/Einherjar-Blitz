<?php
require_once 'includes/Database.php';

$auth = new AuthController();

header('Content-Type: application/json');

$response = array(
    'success' => false,
    'message' => '',
    'newBalance' => 0,
    'newStock' => 0
);

if (!$auth->isAuthenticated()) {
    $response['message'] = 'No estás autenticado';
    echo json_encode($response);
    exit();
}

if (!isset($_POST['product_id'])) {
    $response['message'] = 'No se ha seleccionado un producto';
    echo json_encode($response);
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    $response['message'] = 'Error obteniendo datos del usuario';
    echo json_encode($response);
    exit();
}

$product_id = $_POST['product_id'];
$username = $userData['username'];
$db = Database::getInstance();

try {
    // Iniciar transacción
    $db->beginTransaction();

    // Obtener información del producto con bloqueo
    $stmt = $db->prepare("SELECT * FROM productos WHERE ID = ? FOR UPDATE");
    $stmt->execute([$product_id]);
    $rowProduct = $stmt->fetch();

    if (!$rowProduct) {
        throw new Exception('Producto no encontrado');
    }

    $stockProducto = $rowProduct["Stock"];
    $precioProducto = $rowProduct["Precio_Esferas"];

    // Obtener esferas del usuario con bloqueo
    $stmt = $db->prepare("SELECT recompensas FROM usuarios WHERE username = ? FOR UPDATE");
    $stmt->execute([$username]);
    $rowEsferas = $stmt->fetch();

    if (!$rowEsferas) {
        throw new Exception('Usuario no encontrado');
    }

    $esferasUsuario = $rowEsferas["recompensas"];

    // Verificar stock y esferas
    if ($stockProducto <= 0) {
        throw new Exception('Producto agotado');
    }

    if ($esferasUsuario < $precioProducto) {
        throw new Exception('No tienes suficientes esferas');
    }

    // Actualizar stock
    $stmt = $db->prepare("UPDATE productos SET Stock = Stock - 1 WHERE ID = ?");
    $stmt->execute([$product_id]);

    // Actualizar esferas del usuario
    $stmt = $db->prepare("UPDATE usuarios SET recompensas = recompensas - ? WHERE username = ?");
    $stmt->execute([$precioProducto, $username]);

    // Registrar la compra
    $stmt = $db->prepare("INSERT INTO recompensas_usuario (username, recompensa_obtenida) VALUES (?, ?)");
    $stmt->execute([$username, $rowProduct["Nombre"]]);

    // Confirmar transacción
    $db->commit();

    // Preparar respuesta exitosa
    $response['success'] = true;
    $response['message'] = '¡Compra realizada con éxito!';
    $response['newBalance'] = $esferasUsuario - $precioProducto;
    $response['newStock'] = $stockProducto - 1;
    $response['productId'] = $product_id;

} catch (Exception $e) {
    // Revertir transacción en caso de error
    $db->rollback();
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>

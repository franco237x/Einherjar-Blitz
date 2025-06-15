<?php
require_once '../includes/Database.php';

$auth = new AuthController();

// Verificar autenticación
if (!$auth->isAuthenticated()) {
    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado.']);
    exit();
}

header('Content-Type: application/json');

$response = ['success' => false, 'message' => ''];

$userData = $auth->getUserData();
if (!$userData) {
    $response['message'] = 'Error obteniendo datos del usuario.';
    echo json_encode($response);
    exit();
}

$username = $userData['username'];
$db = Database::getInstance();

try {
    // Obtener la hora del último minado utilizando el campo 'fecha'
    $sql_last_mine = "SELECT MAX(fecha) as last_mine FROM transacciones_einherjer WHERE username = ? AND tipo = 'minado'";
    $stmt = $db->prepare($sql_last_mine);
    $stmt->execute([$username]);
    $result = $stmt->fetch();

    $current_time = time();
    $last_mine_time = null;

    if ($result && $result['last_mine']) {
        $last_mine_time = strtotime($result['last_mine']);
    }

    // Verificación de 4 horas (14400 segundos)
    if ($last_mine_time && ($current_time - $last_mine_time) < 14400) {
        $remaining_time = 14400 - ($current_time - $last_mine_time);
        $hours = floor($remaining_time / 3600);
        $minutes = floor(($remaining_time % 3600) / 60);
        
        $response['message'] = "Debes esperar {$hours} horas y {$minutes} minutos antes de minar nuevamente.";
        echo json_encode($response);
        exit();
    }

    // Verificar límite diario de 10 minados
    $today = date('Y-m-d');
    $sql_today_mines = "SELECT COUNT(*) as count FROM transacciones_einherjer WHERE username = ? AND tipo = 'minado' AND DATE(fecha) = ?";
    $stmt_today = $db->prepare($sql_today_mines);
    $stmt_today->execute([$username, $today]);
    $today_mines = $stmt_today->fetch();

    if ($today_mines['count'] >= 10) {
        $response['message'] = 'Has alcanzado el límite diario de 10 minados.';
        echo json_encode($response);
        exit();
    }

    $db->beginTransaction();

    // Generar recompensa aleatoria entre 0.1 y 1.0 EINHERJER
    $recompensa = round(mt_rand(10, 100) / 100, 2);

    // Insertar transacción
    $sql_insert = "INSERT INTO transacciones_einherjer (username, cantidad, tipo, descripcion, fecha) VALUES (?, ?, 'minado', 'Minado automático', NOW())";
    $stmt_insert = $db->prepare($sql_insert);
    $stmt_insert->execute([$username, $recompensa]);

    // Calcular nuevo balance
    $sql_balance = "SELECT SUM(cantidad) AS balance FROM transacciones_einherjer WHERE username = ?";
    $stmt_balance = $db->prepare($sql_balance);
    $stmt_balance->execute([$username]);
    $balance_result = $stmt_balance->fetch();
    $nuevo_balance = $balance_result['balance'] ?? 0;

    $db->commit();

    $response['success'] = true;
    $response['message'] = "¡Minado exitoso! Has obtenido {$recompensa} EINHERJER.";
    $response['balance'] = number_format($nuevo_balance, 10);

} catch (Exception $e) {
    $db->rollback();
    error_log("Mining error: " . $e->getMessage());
    $response['message'] = 'Error en el minado.';
}

echo json_encode($response);
$result_last_mine = $stmt->get_result();
$last_mine_time = null;

if ($result_last_mine->num_rows > 0) {
    $row_last_mine = $result_last_mine->fetch_assoc();
    $last_mine_time = strtotime($row_last_mine['last_mine']);
}

$can_mine = true;
$remaining_time = 0;

// Verificación de 4 horas
if ($last_mine_time) {
    $current_time = time();
    $time_diff = $current_time - $last_mine_time;

    if ($time_diff < 14400) { // 14400 segundos = 4 horas
        $can_mine = false;
        $remaining_time = 14400 - $time_diff;
    }
}

// Límite diario: máximo 10 minados por día
$sql_daily_mine = "SELECT COUNT(*) as mine_count FROM transacciones_einherjer WHERE username = ? AND tipo = 'minado' AND DATE(fecha) = CURDATE()";
$stmt_daily = $conn->prepare($sql_daily_mine);
$stmt_daily->bind_param("s", $username);
$stmt_daily->execute();
$result_daily = $stmt_daily->get_result();
$mine_count_today = 0;

if ($result_daily->num_rows > 0) {
    $row_daily = $result_daily->fetch_assoc();
    $mine_count_today = $row_daily['mine_count'];
}

$max_mine_per_day = 10;

if ($mine_count_today >= $max_mine_per_day) {
    $can_mine = false;
    $response['message'] = 'Has alcanzado el límite diario de minados.';
    echo json_encode($response);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['minar']) && $can_mine) {
    // Generar cantidad aleatoria entre 0.001 y 0.1
    $mined_amount = mt_rand(1, 100) / 1000; // Esto generará un número entre 0.001 y 0.1

    // Preparar la sentencia
    $stmt_insert = $conn->prepare("INSERT INTO transacciones_einherjer (username, cantidad, tipo, fecha) VALUES (?, ?, 'minado', NOW())");
    $stmt_insert->bind_param("sd", $username, $mined_amount);

    if ($stmt_insert->execute()) {
        $response['success'] = true;
        $response['message'] = "¡Has minado " . number_format($mined_amount, 6) . " Einherjer!";
        $response['balance'] = getUserBalance($conn, $username);
    } else {
        $response['message'] = "Error al minar: " . $stmt_insert->error;
    }

    $stmt_insert->close();
} else {
    if (!$can_mine) {
        if ($remaining_time > 0) {
            $hours = floor($remaining_time / 3600);
            $minutes = floor(($remaining_time % 3600) / 60);
            $seconds = $remaining_time % 60;
            $response['message'] = sprintf("Debes esperar %02d:%02d:%02d antes de minar nuevamente.", $hours, $minutes, $seconds);
        } else {
            $response['message'] = 'No puedes minar ahora.';
        }
    } else {
        $response['message'] = 'Solicitud inválida.';
    }
}

$stmt->close();
$stmt_daily->close();
$conn->close();

echo json_encode($response);

// Función para obtener el balance del usuario
function getUserBalance($conn, $username) {
    $sql_balance = "SELECT SUM(cantidad) AS balance FROM transacciones_einherjer WHERE username = ?";
    $stmt_balance = $conn->prepare($sql_balance);
    $stmt_balance->bind_param("s", $username);
    $stmt_balance->execute();
    $result_balance = $stmt_balance->get_result();
    $balance = 0.0;

    if ($result_balance->num_rows > 0) {
        $row_balance = $result_balance->fetch_assoc();
        $balance = $row_balance['balance'];
    }

    $stmt_balance->close();
    return number_format($balance, 10);
}
?>

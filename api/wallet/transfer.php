<?php
header('Content-Type: application/json');
require_once '../../includes/Database.php';

$auth = new AuthController();

if (!$auth->isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

$userData = $auth->getUserData();
if (!$userData) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Usuario no válido']);
    exit();
}

// Leer datos de la petición
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['recipient']) || !isset($input['amount'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos faltantes']);
    exit();
}

$recipientUsername = trim($input['recipient']);
$amount = (float)$input['amount'];
$message = isset($input['message']) ? trim($input['message']) : '';

if ($amount <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Cantidad inválida']);
    exit();
}

if ($recipientUsername === $userData['username']) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No puedes transferir a ti mismo']);
    exit();
}

$db = Database::getInstance();

try {
    $db->beginTransaction();

    // Verificar que el usuario tenga suficientes esferas
    if ($userData['recompensas'] < $amount) {
        throw new Exception('Esferas insuficientes');
    }

    // Verificar que el destinatario existe
    $recipientQuery = $db->prepare("SELECT id, username FROM usuarios WHERE username = ? AND is_active = 1");
    $recipientQuery->execute([$recipientUsername]);
    $recipient = $recipientQuery->fetch();

    if (!$recipient) {
        throw new Exception('Usuario destinatario no encontrado');
    }

    // Calcular fee (0.1% para transferencias)
    $feeAmount = $amount * 0.001; // 0.1% fee
    $netAmount = $amount - $feeAmount;

    // Descontar esferas del remitente
    $updateSenderQuery = $db->prepare("UPDATE usuarios SET recompensas = recompensas - ? WHERE id = ?");
    $updateSenderQuery->execute([$amount, $userData['id']]);

    // Agregar esferas al destinatario
    $updateRecipientQuery = $db->prepare("UPDATE usuarios SET recompensas = recompensas + ? WHERE id = ?");
    $updateRecipientQuery->execute([$netAmount, $recipient['id']]);

    // Generar hash único para la transacción
    $transactionHash = hash('sha256', $userData['id'] . $recipient['id'] . $amount . time());

    // Registrar transacción del remitente
    $insertSenderTxQuery = $db->prepare("
        INSERT INTO wallet_transactions 
        (user_id, tipo, subtipo, cantidad_esferas, destinatario_id, fee_amount, hash_transaccion, descripcion, metadata) 
        VALUES (?, 'transferencia_esferas', 'sent', ?, ?, ?, ?, ?, ?)
    ");

    $senderMetadata = json_encode([
        'recipient_username' => $recipient['username'],
        'message' => $message,
        'transfer_type' => 'outgoing'
    ]);

    $insertSenderTxQuery->execute([
        $userData['id'],
        -$amount, // Negativo para el remitente
        $recipient['id'],
        $feeAmount,
        $transactionHash,
        "Transferencia enviada a {$recipient['username']}",
        $senderMetadata
    ]);

    // Registrar transacción del destinatario
    $insertRecipientTxQuery = $db->prepare("
        INSERT INTO wallet_transactions 
        (user_id, tipo, subtipo, cantidad_esferas, destinatario_id, hash_transaccion, descripcion, metadata) 
        VALUES (?, 'transferencia_esferas', 'received', ?, ?, ?, ?, ?)
    ");

    $recipientMetadata = json_encode([
        'sender_username' => $userData['username'],
        'message' => $message,
        'transfer_type' => 'incoming',
        'gross_amount' => $amount,
        'fee_deducted' => $feeAmount
    ]);

    $insertRecipientTxQuery->execute([
        $recipient['id'],
        $netAmount, // Positivo para el destinatario
        $userData['id'],
        $transactionHash,
        "Transferencia recibida de {$userData['username']}",
        $recipientMetadata
    ]);

    // También registrar en la tabla de transacciones legacy si existe
    $legacyTxQuery = $db->prepare("
        INSERT INTO transacciones_einherjer 
        (user_id, username, tipo, cantidad, descripcion, destinatario) 
        VALUES (?, ?, 'transferencia', ?, ?, ?)
    ");

    $legacyTxQuery->execute([
        $userData['id'],
        $userData['username'],
        $amount,
        "Transferencia a {$recipient['username']}: {$message}",
        $recipient['username']
    ]);

    $db->commit();

    echo json_encode([
        'success' => true, 
        'message' => 'Transferencia realizada exitosamente',
        'data' => [
            'recipient' => $recipient['username'],
            'amount_sent' => $amount,
            'fee' => $feeAmount,
            'amount_received' => $netAmount,
            'transaction_hash' => $transactionHash
        ]
    ]);

} catch (Exception $e) {
    $db->rollback();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>

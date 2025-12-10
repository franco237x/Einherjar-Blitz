<?php
require_once '../../includes/Database.php';
require_once '../../includes/version_helper.php';
// Carga la configuración separada
require_once '../config.php'; 

header('Content-Type: application/json');

// 1. Authentication
$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit();
}

// 2. Input Parsing
$input = json_decode(file_get_contents('php://input'), true);
$message = $input['message'] ?? '';

if (empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Mensaje vacío']);
    exit();
}

// 3. Rate Limiting (5 requests max)
$userData = $auth->getUserData();
$userId = $userData['id'];
$db = Database::getInstance()->getConnection();
$today = date('Y-m-d');

$stmt = $db->prepare("SELECT id, request_count FROM ai_chat_usage WHERE user_id = ? AND model_type = 'mini' AND usage_date = ?");
$stmt->execute([$userId, $today]);
$usage = $stmt->fetch();

$currentUsage = $usage ? $usage['request_count'] : 0;

if ($currentUsage >= 5) {
    echo json_encode(['success' => false, 'message' => 'Has alcanzado el límite de 5 preguntas diarias. Vuelve mañana.']);
    exit();
}

// 4. Logic
try {
    // ID DEL MODELO CORRECTO
    // Opciones: 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-robotics-er-1.5-preview'
    $modelToUse = 'gemma-3-1b-it'; // Modelo de pago "mini"

    $systemInstruction = "Eres AR-12 Mini, una IA asistente del universo Einherjar Blitz. Respondes de forma breve y eficiente.";
    
    // Llamada a la API con el modelo corregido
    $apiResult = callGeminiAPI($message, $modelToUse, GEMINI_API_KEY, $systemInstruction);

    // Update usage count
    if ($usage) {
        $update = $db->prepare("UPDATE ai_chat_usage SET request_count = request_count + 1 WHERE id = ?");
        $update->execute([$usage['id']]);
    } else {
        $insert = $db->prepare("INSERT INTO ai_chat_usage (user_id, model_type, usage_date, request_count) VALUES (?, 'mini', ?, 1)");
        $insert->execute([$userId, $today]);
    }

    echo json_encode([
        'success' => true, 
        'response' => $apiResult['text'],
        'usage' => ['remaining' => 5 - ($currentUsage + 1)]
    ]);

} catch (Exception $e) {
    error_log("Chat API Error: " . $e->getMessage());
    // Sugerencia: En producción no mostrar el error crudo al usuario, pero para debug sirve
    echo json_encode(['success' => false, 'message' => 'Error en el sistema: ' . $e->getMessage()]);
}

// --- FUNCIÓN MEJORADA Y ROBUSTA ---

function callGeminiAPI($prompt, $modelName, $apiKey, $systemInstruction = "") {
    if (empty($apiKey)) {
        throw new Exception("API Key no configurada");
    }

    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelName}:generateContent?key={$apiKey}";
    
    // DETECCIÓN DE GEMMA:
    // Los modelos Gemma a veces rechazan el campo 'system_instruction' o funcionan mejor sin él.
    // Si detectamos gemma, concatenamos la instrucción al prompt del usuario.
    $isGemma = strpos($modelName, 'gemma') !== false;

    if ($isGemma && !empty($systemInstruction)) {
        // Modo compatible para Gemma
        $fullPrompt = "Instrucción del sistema: " . $systemInstruction . "\n\nUsuario: " . $prompt;
        $data = [
            "contents" => [
                [
                    "role" => "user",
                    "parts" => [ ["text" => $fullPrompt] ]
                ]
            ]
        ];
    } else {
        // Modo estándar para Gemini (Flash/Pro)
        $data = [
            "contents" => [
                [
                    "role" => "user",
                    "parts" => [ ["text" => $prompt] ]
                ]
            ]
        ];

        if (!empty($systemInstruction)) {
            $data['system_instruction'] = [
                "parts" => [ ["text" => $systemInstruction] ]
            ];
        }
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    // Descomentar solo si tienes error SSL en Localhost
    // curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $result = curl_exec($ch);
    
    if (curl_errno($ch)) {
        throw new Exception("Error cURL: " . curl_error($ch));
    }
    
    curl_close($ch);
    
    $json = json_decode($result, true);
    
    // Manejo de errores detallado de la API
    if (isset($json['error'])) {
        $msg = $json['error']['message'] ?? 'Error desconocido de API';
        // A veces el error incluye detalles valiosos en 'details'
        throw new Exception("API Error ($modelName): " . $msg);
    }

    // Validación de seguridad (Safety Ratings) puede bloquear la respuesta
    if (!isset($json['candidates'][0]['content'])) {
        if (isset($json['promptFeedback']['blockReason'])) {
            throw new Exception("Bloqueado por seguridad: " . $json['promptFeedback']['blockReason']);
        }
        throw new Exception("La API no devolvió contenido de texto. Puede ser un error del modelo.");
    }

    $responseText = $json['candidates'][0]['content']['parts'][0]['text'];
    $usageMetadata = $json['usageMetadata'] ?? [];

    return [
        'text' => $responseText,
        'usage' => $usageMetadata
    ];
}
?>
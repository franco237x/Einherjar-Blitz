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

// 2. User data (sin límite de usos)
$userData = $auth->getUserData();
$userId = $userData['id'];
$db = Database::getInstance()->getConnection();
$today = date('Y-m-d');

$stmt = $db->prepare("SELECT id, request_count, context_limit_tokens, prompt_tokens_used, output_tokens_used FROM ai_chat_usage WHERE user_id = ? AND model_type = 'mini' AND usage_date = ?");
$stmt->execute([$userId, $today]);
$usage = $stmt->fetch();

// Ensure a daily usage row exists without mutating schema at runtime
if (!$usage) {
    $insert = $db->prepare("INSERT INTO ai_chat_usage (user_id, model_type, usage_date) VALUES (?, 'mini', ?)");
    $insert->execute([$userId, $today]);
    $usage = [
        'id' => $db->lastInsertId(),
        'request_count' => 0,
        'context_limit_tokens' => null,
        'prompt_tokens_used' => 0,
        'output_tokens_used' => 0,
    ];
}

// Limite de contexto por tokens (aprox) configurable
$defaultContextTokens = 2048;
$maxContextTokens = (int)($usage['context_limit_tokens'] ?? $defaultContextTokens);
$charsPerToken = 4; // aproximación
$maxContextChars = $maxContextTokens * $charsPerToken;
$wasTruncated = false;
$usedPromptTokens = (int)($usage['prompt_tokens_used'] ?? 0);
$usedOutputTokens = (int)($usage['output_tokens_used'] ?? 0);

// 3. Return current usage if requested (GET) without altering state
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'success' => true,
        'usage' => [
            'promptTokensUsed' => $usedPromptTokens,
            'outputTokensUsed' => $usedOutputTokens,
            'contextTokenLimit' => $maxContextTokens,
            'remainingTokens' => max(0, $maxContextTokens - $usedPromptTokens),
            'truncated' => false
        ]
    ]);
    exit();
}

// 4. Input Parsing (POST)
$input = json_decode(file_get_contents('php://input'), true);
$message = $input['message'] ?? '';

if (empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Mensaje vacío']);
    exit();
}

// Calcular tokens estimados y truncar según disponible
$estimatedPromptTokens = (int) ceil(mb_strlen($message) / max(1, $charsPerToken));
$availableTokens = $maxContextTokens - $usedPromptTokens;

if ($availableTokens <= 0) {
    echo json_encode(['success' => false, 'message' => 'Has llegado al límite de uso semanal.']);
    exit();
}

if ($estimatedPromptTokens > $availableTokens) {
    $allowedChars = max(0, $availableTokens * $charsPerToken);
    $message = mb_substr($message, 0, $allowedChars);
    $wasTruncated = true;
    $estimatedPromptTokens = (int) ceil(mb_strlen($message) / max(1, $charsPerToken));
}

// 5. Logic
try {
    // ID DEL MODELO
    // Opciones: 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemma-2-2b-it'
    $modelToUse = 'gemma-3-1b-it'; // Mini

    $systemInstruction = "Eres AR-12 Mini, una IA asistente del universo Einherjar Blitz. Respondes de forma breve y eficiente.";
    
    // Llamada a la API con el modelo corregido
    $apiResult = callGeminiAPI($message, $modelToUse, GEMINI_API_KEY, $systemInstruction);

    $promptTokens = $apiResult['usage']['promptTokenCount'] ?? null;
    $outputTokens = $apiResult['usage']['candidatesTokenCount'] ?? null;
    // estimación fallback si la API no devuelve conteo
    $promptTokensApprox = $promptTokens ?? (int) ceil(mb_strlen($message) / max(1, $charsPerToken));

    // Persistir tokens en ai_chat_usage (último uso)
    $latestPromptTokens = $promptTokens ?? $promptTokensApprox;
    $latestOutputTokens = $outputTokens ?? 0;
    $newUsedPromptTokens = $usedPromptTokens + $latestPromptTokens;
    $newUsedOutputTokens = $usedOutputTokens + $latestOutputTokens;

    $updateTokens = $db->prepare("UPDATE ai_chat_usage
        SET request_count = request_count + 1,
            prompt_tokens = ?,
            output_tokens = ?,
            prompt_tokens_used = ?,
            output_tokens_used = ?,
            model_type = 'mini',
            context_limit_tokens = ?
        WHERE user_id = ? AND model_type = 'mini' AND usage_date = ?");
    $updateTokens->execute([
        $latestPromptTokens,
        $latestOutputTokens,
        $newUsedPromptTokens,
        $newUsedOutputTokens,
        $maxContextTokens,
        $userId,
        $today
    ]);

    echo json_encode([
        'success' => true,
        'response' => $apiResult['text'],
        'usage' => [
            'promptTokensUsed' => $newUsedPromptTokens,
            'outputTokensUsed' => $newUsedOutputTokens,
            'contextTokenLimit' => $maxContextTokens,
            'remainingTokens' => max(0, $maxContextTokens - $newUsedPromptTokens),
            'truncated' => $wasTruncated
        ]
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
            ],
            "generationConfig" => [
                "maxOutputTokens" => 512,
                "temperature" => 0.7,
                "topP" => 0.9
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
            ],
            "generationConfig" => [
                "maxOutputTokens" => 512,
                "temperature" => 0.7,
                "topP" => 0.9
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
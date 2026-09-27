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
// Determinar el modelo para la consulta (GET o POST inicial)
$modelTypeFull = $_GET['model'] ?? 'mini';
$input = json_decode(file_get_contents('php://input'), true);
if (isset($input['model'])) {
    $modelTypeFull = $input['model'];
}

$validModels = ['mini', 'standard', 'pro'];
if (!in_array($modelTypeFull, $validModels)) {
    $modelTypeFull = 'mini';
}

// 2. User data (sin límite de usos)
$userData = $auth->getUserData();
$userId = $userData['id'];
$db = Database::getInstance()->getConnection();
$today = date('Y-m-d');

$stmt = $db->prepare("SELECT id, request_count, context_limit_tokens, prompt_tokens_used, output_tokens_used FROM ai_chat_usage WHERE user_id = ? AND model_type = ? AND usage_date = ?");
$stmt->execute([$userId, $modelTypeFull, $today]);
$usage = $stmt->fetch();

// Ensure a daily usage row exists for THIS model
if (!$usage) {
    // Definir límites de contexto iniciales según el modelo
    $initialContextLimit = 2048; // Default mini
    if ($modelTypeFull === 'standard')
        $initialContextLimit = 4096;
    if ($modelTypeFull === 'pro')
        $initialContextLimit = 8192;

    $insert = $db->prepare("INSERT INTO ai_chat_usage (user_id, model_type, usage_date, context_limit_tokens) VALUES (?, ?, ?, ?)");
    $insert->execute([$userId, $modelTypeFull, $today, $initialContextLimit]);
    $usage = [
        'id' => $db->lastInsertId(),
        'request_count' => 0,
        'context_limit_tokens' => $initialContextLimit,
        'prompt_tokens_used' => 0,
        'output_tokens_used' => 0,
    ];
}

// Limite de contexto por tokens (aprox) configurable
$defaultContextTokens = 2048;
$maxContextTokens = (int) ($usage['context_limit_tokens'] ?? $defaultContextTokens);
$charsPerToken = 4; // aproximación
$maxContextChars = $maxContextTokens * $charsPerToken;
$wasTruncated = false;
$usedPromptTokens = (int) ($usage['prompt_tokens_used'] ?? 0);
$usedOutputTokens = (int) ($usage['output_tokens_used'] ?? 0);

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
$modelType = $input['model'] ?? 'mini'; // mini, standard, pro

if (empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Mensaje vacío']);
    exit();
}

// Validar tipo de modelo
$allowedModels = ['mini', 'standard', 'pro'];
if (!in_array($modelType, $allowedModels)) {
    $modelType = 'mini';
}

// Obtener uso diario para el modelo ESPECÍFICO
$stmt = $db->prepare("SELECT id, request_count, context_limit_tokens, prompt_tokens_used, output_tokens_used FROM ai_chat_usage WHERE user_id = ? AND model_type = ? AND usage_date = ?");
$stmt->execute([$userId, $modelType, $today]);
$usage = $stmt->fetch();

// Crear fila si no existe
if (!$usage) {
    // Definir límites de contexto iniciales según el modelo
    $initialContextLimit = 2048; // Default mini
    if ($modelType === 'standard')
        $initialContextLimit = 4096;
    if ($modelType === 'pro')
        $initialContextLimit = 8192;

    $insert = $db->prepare("INSERT INTO ai_chat_usage (user_id, model_type, usage_date, context_limit_tokens) VALUES (?, ?, ?, ?)");
    $insert->execute([$userId, $modelType, $today, $initialContextLimit]);
    $usage = [
        'id' => $db->lastInsertId(),
        'request_count' => 0,
        'context_limit_tokens' => $initialContextLimit,
        'prompt_tokens_used' => 0,
        'output_tokens_used' => 0,
    ];
}

$maxContextTokens = (int) ($usage['context_limit_tokens']);
$usedPromptTokens = (int) ($usage['prompt_tokens_used'] ?? 0);
$usedOutputTokens = (int) ($usage['output_tokens_used'] ?? 0);

// Calcular tokens estimados y truncar según disponible
$estimatedPromptTokens = (int) ceil(mb_strlen($message) / max(1, $charsPerToken));
$availableTokens = $maxContextTokens - $usedPromptTokens;

if ($availableTokens <= 0) {
    echo json_encode(['success' => false, 'message' => "Has llegado al límite de uso diario para el modelo $modelType."]);
    exit();
}

if ($estimatedPromptTokens > $availableTokens) {
    $allowedChars = max(0, $availableTokens * $charsPerToken);
    $message = mb_substr($message, 0, $allowedChars);
    $wasTruncated = true;
    $estimatedPromptTokens = (int) ceil(mb_strlen($message) / max(1, $charsPerToken));
}

// 5. Logic
// 5. Logic
try {
    // Mapping de modelos internos
    $modelMap = [
        'mini' => 'gemma-3-4b-it',
        'standard' => 'gemma-3-12b-it',
        'pro' => 'gemma-3-27b-it'
    ];
    $modelToUse = $modelMap[$modelType];

    $systemInstruction = "Eres AR-12 ($modelType), una IA asistente del universo Einherjar Blitz. Respondes de forma eficiente.";

    // PREPARAR STREAMING
    header('Content-Type: text/event-stream');
    header('Cache-Control: no-cache');
    header('Connection: keep-alive');

    // Deshabilitar buffering de PHP/Apache/Nginx para que el stream fluya
    if (function_exists('apache_setenv')) {
        @apache_setenv('no-gzip', 1);
    }
    @ini_set('zlib.output_compression', 0);
    @ini_set('implicit_flush', 1);
    for ($i = 0; $i < ob_get_level(); $i++) {
        ob_end_flush();
    }
    ob_implicit_flush(1);

    // Call streaming API
    $fullResponseText = streamGeminiAPI($message, $modelToUse, GEMINI_API_KEY, $systemInstruction);

    // Calc tokens post-stream
    $promptTokensApprox = (int) ceil(mb_strlen($message) / max(1, $charsPerToken));
    $outputTokensApprox = (int) ceil(mb_strlen($fullResponseText) / max(1, $charsPerToken));

    // Persistir tokens en ai_chat_usage (modelo correcto)
    // NOTA: Gemini Streaming no siempre devuelve metadata de uso al final, así que estimamos por ahora o confiamos en el acumulado.
    // Para simplificar y asegurar, usaremos la estimación de caracteres para el output si la API no manda metadata final.

    $latestPromptTokens = $promptTokensApprox;
    $latestOutputTokens = $outputTokensApprox;
    $newUsedPromptTokens = $usedPromptTokens + $latestPromptTokens;
    $newUsedOutputTokens = $usedOutputTokens + $latestOutputTokens;

    $updateTokens = $db->prepare("UPDATE ai_chat_usage
        SET request_count = request_count + 1,
            prompt_tokens = ?,
            output_tokens = ?,
            prompt_tokens_used = ?,
            output_tokens_used = ?,
            context_limit_tokens = ?
        WHERE user_id = ? AND model_type = ? AND usage_date = ?");
    $updateTokens->execute([
        $latestPromptTokens,
        $latestOutputTokens,
        $newUsedPromptTokens,
        $newUsedOutputTokens,
        $maxContextTokens,
        $userId,
        $modelType,
        $today
    ]);

    // Enviar evento final de 'done' con uso actualizado
    echo "data: " . json_encode([
        'done' => true,
        'usage' => [
            'model' => $modelType,
            'promptTokensUsed' => $newUsedPromptTokens,
            'outputTokensUsed' => $newUsedOutputTokens,
            'contextTokenLimit' => $maxContextTokens,
            'remainingTokens' => max(0, $maxContextTokens - $newUsedPromptTokens),
            'truncated' => $wasTruncated
        ]
    ]) . "\n\n";
    flush();

} catch (Exception $e) {
    error_log("Chat API Error: " . $e->getMessage());
    echo "data: " . json_encode(['error' => $e->getMessage()]) . "\n\n";
    flush();
}

// --- FUNCIÓN STREAMING ---

function streamGeminiAPI($prompt, $modelName, $apiKey, $systemInstruction = "")
{
    if (empty($apiKey)) {
        throw new Exception("API Key no configurada");
    }

    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelName}:streamGenerateContent?alt=sse&key={$apiKey}";

    $isGemma = strpos($modelName, 'gemma') !== false;

    if ($isGemma && !empty($systemInstruction)) {
        $fullPrompt = "Instrucción del sistema: " . $systemInstruction . "\n\nUsuario: " . $prompt;
        $data = [
            "contents" => [["role" => "user", "parts" => [["text" => $fullPrompt]]]]
        ];
    } else {
        $data = [
            "contents" => [["role" => "user", "parts" => [["text" => $prompt]]]]
        ];
        if (!empty($systemInstruction)) {
            $data['system_instruction'] = ["parts" => [["text" => $systemInstruction]]];
        }
    }

    // Configuración estándar
    $data['generationConfig'] = [
        "maxOutputTokens" => 512,
        "temperature" => 0.7,
        "topP" => 0.9
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    // Deshabilitar buffering de Curl para recibir chunks
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $chunk) use (&$fullResponseText) {
        // Gemini manda "data: {...}\n\n"
        // Nosotros retransmitimos eso al cliente o lo parseamos
        // Para simplicidad, vamos a parsear minimamente para sacar el texto y enviarlo limpio
        // O podemos reenviar el SSE crudo de Google si el formato coincide, pero mejor controlamos el formato.

        $lines = explode("\n", $chunk);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strpos($line, 'data: ') === 0) {
                $jsonStr = substr($line, 6);
                if ($jsonStr === '[DONE]')
                    continue; // Google no suele mandar [DONE] así, pero por si acaso

                $data = json_decode($jsonStr, true);
                if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                    $text = $data['candidates'][0]['content']['parts'][0]['text'];
                    $fullResponseText .= $text;

                    // Enviar al cliente
                    echo "data: " . json_encode(['text' => $text]) . "\n\n";
                    flush();
                }
            }
        }
        return strlen($chunk);
    });

    // Variable para acumular todo el texto y guardarlo en DB al final
    $fullResponseText = "";

    // Pasamos referencia a la variable externa usando 'use' en la clausura anónima de arriba... 
    // PERO: PHP stream callback scope es complicado. 
    // Truco: Usar una variable global o una clase. Para este script simple procedural:
    // La closure de arriba no puede escribir en $fullResponseText local de la funcion main.
    // Vamos a hacer una implementación más "manual" del loop de lectura.

    // RE-IMPLEMENTACIÓN SIN CALLBACK PARA CONTROLAR $fullResponseText MEJOR:
    // Mejor usamos CURLOPT_WRITEFUNCTION pero asignamos a una variable estática o global temporal
    // O mejor aun, procesamos el output nosotros.

    // Corrección para scope:
    global $accumulatedText;
    $accumulatedText = "";

    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $chunk) {
        global $accumulatedText;
        $lines = explode("\n", $chunk);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strpos($line, 'data: ') === 0) {
                $jsonStr = substr($line, 6);
                $data = json_decode($jsonStr, true);
                if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                    $text = $data['candidates'][0]['content']['parts'][0]['text'];
                    $accumulatedText .= $text;
                    echo "data: " . json_encode(['text' => $text]) . "\n\n";
                    flush();
                }
            }
        }
        return strlen($chunk);
    });

    curl_exec($ch);

    if (curl_errno($ch)) {
        throw new Exception("Error cURL: " . curl_error($ch));
    }
    curl_close($ch);

    return $accumulatedText;
}
?>
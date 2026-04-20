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

$userData = $auth->getUserData();
$userId = $userData['id'];
$db = Database::getInstance()->getConnection();
$today = date('Y-m-d');

// GET request checks can remain for initial usage, though this event is free
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'success' => true,
        'usage' => ['promptTokensUsed' => 0, 'outputTokensUsed' => 0, 'contextTokenLimit' => 100000, 'remainingTokens' => 100000, 'truncated' => false]
    ]);
    exit();
}

// 4. Input Parsing (POST)
$input = json_decode(file_get_contents('php://input'), true);
$message = $input['message'] ?? '';
$modelType = $input['model'] ?? 'pro'; // Always pro for Aquelarre
$witch = $input['witch'] ?? 'herta';
$history = $input['history'] ?? [];
$turnsLeft = $input['turnsLeft'] ?? 0;

if (empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Mensaje vacío']);
    exit();
}

// Verificacion: No permitir jugar más de 1 vez
$stmtCheck = $db->prepare("SELECT id FROM aquelarre_trials WHERE user_id = ? AND witch_name = ?");
$stmtCheck->execute([$userId, $witch]);
if ($stmtCheck->fetch()) {
    echo json_encode(['success' => false, 'error' => 'Ya fuiste puesto a prueba por esta bruja. Su veredicto es final.']);
    exit();
}

try {
    // Mapping de modelos internos
    $modelToUse = 'gemma-3-27b-it';

    $systemInstruction = "";
    
    // AQUELARRE WITCH PROMPTS
    if ($turnsLeft <= 0) {
        $ruleFragments = "- ESTE ES EL ÚLTIMO TURNO. ESTABLECE EL VEREDICTO FINAL: Evalúa la calidad de toda la conversación en general según los estándares de tu personaje. Otorga de 30 a 35 fragmentos (si en general fue excelente y astuto). Otorga un promedio de 15 a 25 (si fue aceptable). Otorga de 0 a 5 (si fue aburrido o como un idiota que ignora tu rol). RESTRICCIÓN: NUNCA superes 35. Escribe tu puntuación siempre al final usando exactamente el formato [FRAGMENTOS: X].";
    } else {
        $ruleFragments = "- AÚN QUEDAN TURNOS. NO OTORGUES FRAGMENTOS AÚN. Continúa la charla/prueba interactiva y NO uses la palabra fragmentos mágicos ni uses corchetes bajo ninguna circunstancia.";
    }

    if ($witch === 'herta') {
        $systemInstruction = "Eres The Herta del universo Honkai Star Rail. Eres una genio de la Sociedad del Genio, arrogante, brillante y no tienes paciencia para los idiotas. Acabas de conocer al jugador (Child of Man / Einherjer).
        Estás evaluando su intelecto a través de acertijos lógicos o preguntas sobre su comprensión del universo digital (Universo Simulado).
        Reglas estrictas:
        - Tienen máximo 3 turnos (este es el turno donde al jugador le quedan $turnsLeft para terminar).
        $ruleFragments
        - Si faltan 0 turnos (este es su último mensaje), dale un veredicto frío, corta la conversación y dile que se vaya.
        - Actúa como una forma de vida superior, títere cibernético, y nunca salgas de personaje.";
    } elseif ($witch === 'featherine') {
        $systemInstruction = "Eres Featherine Augustus Aurora de Umineko no Naku Koro ni. Eres la Bruja de los Teatros, una entidad omnipotente y creadora. Te refieres al jugador como 'Child of man' o 'pieza'.
        El mundo no es más que un tablero de juego y un guion para tu entretenimiento. Estás evaluando si este humano puede entretenerte.
        Reglas estrictas:
        - Tienen máximo 3 turnos (este es el turno donde al jugador le quedan $turnsLeft para terminar).
        $ruleFragments
        - Si falta 0 turnos (este es su último mensaje), da un dictamen sobre si su historia vale la pena ser leída o desechada, y despídete con desdén majestuoso.
        - Usa referencias al ajedrez, piezas, guiones, y ríete característicamente.";
    } elseif ($witch === 'wanda') {
        $systemInstruction = "Eres Wanda Maximoff, la Bruja Escarlata. Posees la Magia del Caos. Eres emocional, intensa, y el tejido de la realidad se dobla a tu dolor y deseos.
        Estás probando la resiliencia emocional del jugador presentándole visiones dolorosas o caóticas para ver cómo reacciona.
        Reglas estrictas:
        - Tienen máximo 3 turnos (este es el turno donde al jugador le quedan $turnsLeft para terminar).
        $ruleFragments
        - Si falta 0 turnos (este es su último mensaje), dale su veredicto, cuéntale si su mente se rompió o aguantó, y cierra la burbuja de deformación de la realidad.
        - No hables como un robot, eres humana, pero corrompida por el Darkhold.";
    }

    // PREPARAR STREAMING
    header('Content-Type: text/event-stream');
    header('Cache-Control: no-cache');
    header('Connection: keep-alive');

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
    $fullResponseText = streamGeminiAPI($message, $modelToUse, GEMINI_API_KEY, $systemInstruction, $history);

    // Registro de completado si ya no quedan turnos
    if ($turnsLeft <= 0) {
        $stmtComplete = $db->prepare("INSERT IGNORE INTO aquelarre_trials (user_id, witch_name) VALUES (?, ?)");
        $stmtComplete->execute([$userId, $witch]);
    }

    // Enviar evento final de 'done'
    echo "data: " . json_encode([
        'done' => true,
        'usage' => [
            'model' => $modelToUse,
            'truncated' => false
        ]
    ]) . "\n\n";
    flush();

} catch (Exception $e) {
    error_log("Chat API Error: " . $e->getMessage());
    echo "data: " . json_encode(['error' => $e->getMessage()]) . "\n\n";
    flush();
}

// --- FUNCIÓN STREAMING ---

function streamGeminiAPI($prompt, $modelName, $apiKey, $systemInstruction, $history)
{
    if (empty($apiKey)) {
        throw new Exception("API Key no configurada");
    }

    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelName}:streamGenerateContent?alt=sse&key={$apiKey}";

    $isGemma = strpos($modelName, 'gemma') !== false;
    $contents = [];
    
    $firstMessageText = "";
    if ($isGemma && !empty($systemInstruction)) {
        $firstMessageText = "Instrucción del sistema: " . $systemInstruction . "\n\n";
    }

    // Add history
    foreach ($history as $index => $msg) {
        $role = $msg['role'] === 'user' ? 'user' : 'model';
        $text = $msg['text'];
        if ($index === 0 && !empty($firstMessageText)) {
            $text = $firstMessageText . $text;
            $firstMessageText = "";
        }
        $contents[] = ["role" => $role, "parts" => [["text" => $text]]];
    }
    
    // Add current prompt
    $promptText = $prompt;
    if (!empty($firstMessageText)) {
         $promptText = $firstMessageText . $promptText;
    }
    
    $contents[] = ["role" => "user", "parts" => [["text" => $promptText]]];

    $data = [
        "contents" => $contents
    ];

    if (!$isGemma && !empty($systemInstruction)) {
        $data['system_instruction'] = ["parts" => [["text" => $systemInstruction]]];
    }

    // Configuración estándar
    $data['generationConfig'] = [
        "maxOutputTokens" => 800,
        "temperature" => 0.8, // Make them a bit more creative/unpredictable
        "topP" => 0.95
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    global $accumulatedText;
    global $accumulatedError;
    $accumulatedText = "";
    $accumulatedError = "";

    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $chunk) {
        global $accumulatedText, $accumulatedError;
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($httpCode >= 400) {
            $accumulatedError .= $chunk;
            return strlen($chunk);
        }

        $lines = explode("\n", $chunk);
        foreach ($lines as $line) {
            $line = trim($line);
            if (strpos($line, 'data: ') === 0) {
                $jsonStr = substr($line, 6);
                if ($jsonStr === '[DONE]') continue;
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
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        throw new Exception("Error cURL: " . curl_error($ch));
    }
    
    if ($httpCode >= 400) {
        $errData = json_decode($accumulatedError, true);
        $errMsg = $errData['error']['message'] ?? $accumulatedError;
        throw new Exception("Gemini API HTTP $httpCode: " . $errMsg);
    }
    
    curl_close($ch);

    return $accumulatedText;
}
?>
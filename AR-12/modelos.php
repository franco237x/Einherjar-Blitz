<?php
// ver_modelos.php
require_once 'config.php'; // Asegúrate de cargar tu API KEY aquí

$apiKey = GEMINI_API_KEY;
$url = "https://generativelanguage.googleapis.com/v1beta/models?key={$apiKey}";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Solo para desarrollo local
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

echo "<h1>Modelos Disponibles para tu API Key</h1>";
echo "<pre>";

if (isset($data['models'])) {
    foreach ($data['models'] as $model) {
        // Filtramos solo los que sirven para generar texto (generateContent)
        if (in_array("generateContent", $model['supportedGenerationMethods'])) {
            echo "Nombre: " . $model['name'] . "\n";
            echo "Descripción: " . $model['description'] . "\n";
            echo "--------------------------------------------------\n";
        }
    }
} else {
    print_r($data);
}
echo "</pre>";
?>
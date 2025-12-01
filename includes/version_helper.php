<?php
/**
 * Version Helper - Cache Busting automático
 * Agrega timestamps de modificación a archivos CSS/JS para invalidar caché
 */

/**
 * Obtiene la URL del asset con versión basada en fecha de modificación
 * 
 * @param string $path - Ruta relativa al archivo (ej: 'assets/css/style.css')
 * @param string $basePath - Ruta base del proyecto (opcional, se autodetecta)
 * @return string - URL con parámetro de versión
 */
function asset_url($path, $basePath = null) {
    if ($basePath === null) {
        $basePath = dirname(__DIR__) . '/';
    }
    
    $fullPath = $basePath . $path;
    
    // Si el archivo existe, agregar timestamp de modificación
    if (file_exists($fullPath)) {
        $version = filemtime($fullPath);
        return $path . '?v=' . $version;
    }
    
    // Si no existe, devolver sin versión
    return $path;
}

/**
 * Genera tag <link> para CSS con versionado automático
 * 
 * @param string $path - Ruta al archivo CSS
 * @param string $basePath - Ruta base (opcional)
 * @return string - Tag HTML completo
 */
function css_link($path, $basePath = null) {
    $url = asset_url($path, $basePath);
    return '<link rel="stylesheet" href="' . htmlspecialchars($url) . '">';
}

/**
 * Genera tag <script> para JS con versionado automático
 * 
 * @param string $path - Ruta al archivo JS
 * @param string $basePath - Ruta base (opcional)
 * @param bool $module - Si es un módulo ES6
 * @return string - Tag HTML completo
 */
function js_script($path, $basePath = null, $module = false) {
    $url = asset_url($path, $basePath);
    $type = $module ? ' type="module"' : '';
    return '<script src="' . htmlspecialchars($url) . '"' . $type . '></script>';
}

/**
 * Versión simplificada - solo agrega ?v=timestamp a una URL
 * Útil para casos donde ya tienes el tag HTML escrito
 * 
 * @param string $relativePath - Ruta relativa del archivo
 * @return string - Solo el parámetro ?v=timestamp o vacío si no existe
 */
function v($relativePath) {
    // Intentar encontrar el archivo desde diferentes rutas base
    $possibleBases = [
        dirname(__DIR__) . '/',           // Desde includes/
        dirname(__DIR__) . '/../',        // Un nivel arriba
        $_SERVER['DOCUMENT_ROOT'] . '/dashboard/Einherjar Blitz/',
    ];
    
    foreach ($possibleBases as $base) {
        $fullPath = $base . $relativePath;
        if (file_exists($fullPath)) {
            return '?v=' . filemtime($fullPath);
        }
    }
    
    // Fallback: usar timestamp actual (fuerza recarga)
    return '?v=' . time();
}

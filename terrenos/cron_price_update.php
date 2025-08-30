<?php
/**
 * Cron Job para Actualización Automática de Precios de Terrenos - Hostinger Optimized
 * Hostinger Cron: 0/30 * * * * php /home/usuario/public_html/path/to/cron_price_update.php
 */

// Para Hostinger: Permitir tanto CLI como web execution con token de seguridad
$security_token = 'einherjar_terrain_cron_2024';
if (!isset($_GET['token']) && php_sapi_name() !== 'cli') {
    if (!isset($_GET['token']) || $_GET['token'] !== $security_token) {
        die('Acceso no autorizado');
    }
}

// Evitar timeouts y límites de memoria en hosting compartido
set_time_limit(300); // 5 minutos máximo
ini_set('memory_limit', '128M');

// Capturar errores para logging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Ruta relativa más compatible con Hostinger
require_once dirname(__FILE__) . '/../includes/Database.php';

class TerrainPriceUpdater {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function updateAllPrices() {
        $logFile = dirname(__FILE__) . '/logs/price_update.log';
        $this->createLogDir();
        
        try {
            $this->log("Iniciando actualización de precios de terrenos...", $logFile);
            
            // Obtener todos los terrenos activos
            $terrains = $this->getActiveTerrains();
            $updatedCount = 0;
            
            if (empty($terrains)) {
                $this->log("No se encontraron terrenos activos para actualizar", $logFile);
                return;
            }
            
            foreach ($terrains as $terrain) {
                try {
                    if ($this->updateTerrainPrice($terrain)) {
                        $updatedCount++;
                    }
                } catch (Exception $e) {
                    $this->log("Error actualizando {$terrain['nombre']}: " . $e->getMessage(), $logFile);
                    continue; // Continuar con el siguiente terreno
                }
            }
            
            // Actualizar métricas globales
            $this->updateGlobalMetrics($logFile);
            
            // Limpiar historial antiguo (mantener solo últimos 90 días)
            $this->cleanOldHistory($logFile);
            
            $this->log("Actualización completada. $updatedCount terrenos actualizados.", $logFile);
            
            // Para web execution, mostrar resultado JSON
            if (php_sapi_name() !== 'cli') {
                header('Content-Type: application/json');
                echo json_encode([
                    'success' => true,
                    'updated_count' => $updatedCount,
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            }
            
        } catch (Exception $e) {
            $errorMsg = "Error crítico en cron_price_update.php: " . $e->getMessage();
            error_log($errorMsg);
            $this->log($errorMsg, $logFile);
            
            if (php_sapi_name() !== 'cli') {
                header('Content-Type: application/json');
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage(),
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            }
        }
    }
    
    private function getActiveTerrains() {
        $query = $this->db->prepare("
            SELECT t.*, 
                   COALESCE(m.volumen_24h, 0) as volumen_24h,
                   COALESCE(m.numero_holders, 0) as numero_holders
            FROM terrenos t
            LEFT JOIN terrenos_metricas m ON t.id = m.terreno_id 
                AND DATE(m.fecha) = CURDATE()
            WHERE t.activo = 1 AND t.precio_actual > 0
            ORDER BY t.id 
        ");
        $query->execute();
        return $query->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function updateTerrainPrice($terrain) {
        try {
            $this->db->beginTransaction();
            
            $oldPrice = floatval($terrain['precio_actual']);
            $newPrice = $this->calculateNewPrice($terrain);
            
            // Solo actualizar si hay cambio significativo (más de 0.1%)
            $priceChange = abs(($newPrice - $oldPrice) / $oldPrice) * 100;
            if ($priceChange < 0.1) {
                $this->db->rollBack();
                return false;
            }
            
            // Actualizar precio en tabla terrenos
            $updateQuery = $this->db->prepare("
                UPDATE terrenos 
                SET precio_actual = ?, ultima_actualizacion = NOW()
                WHERE id = ?
            ");
            $updateQuery->execute([$newPrice, $terrain['id']]);
            
            // Registrar en historial de precios
            $historyQuery = $this->db->prepare("
                INSERT INTO terrenos_precio_historial 
                (terreno_id, precio, supply_circulante, market_cap, volumen_24h)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $marketCap = $newPrice * $terrain['supply_circulante'];
            $historyQuery->execute([
                $terrain['id'],
                $newPrice,
                $terrain['supply_circulante'],
                $marketCap,
                $terrain['volumen_24h']
            ]);
            
            // Actualizar métricas del terreno
            $this->updateTerrainMetrics($terrain['id'], $oldPrice, $newPrice);
            
            $this->db->commit();
            
            $changePercent = (($newPrice - $oldPrice) / $oldPrice) * 100;
            $this->log("{$terrain['nombre']}: {$oldPrice} → {$newPrice} (" . sprintf('%+.2f', $changePercent) . "%)", dirname(__FILE__) . '/logs/price_update.log');
            
            return true;
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    /**
     * Calcular nuevo precio basado en algoritmos de mercado
     */
    private function calculateNewPrice($terrain) {
        $basePrice = floatval($terrain['precio_actual']);
        
        // Factor 1: Actividad de trading (volumen)
        $volumeFactor = $this->calculateVolumeFactor($terrain);
        
        // Factor 2: Escasez (supply disponible)
        $scarcityFactor = $this->calculateScarcityFactor($terrain);
        
        // Factor 3: Eventos del juego
        $eventsFactor = $this->calculateEventsFactor($terrain['id']);
        
        // Factor 4: Volatilidad aleatoria (simulación de mercado)
        $randomFactor = $this->calculateRandomFactor();
        
        // Factor 5: Tendencia del mercado general
        $marketTrend = $this->calculateMarketTrend();
        
        // Aplicar factores multiplicativos
        $newPrice = $basePrice * $volumeFactor * $scarcityFactor * $eventsFactor * $randomFactor * $marketTrend;
        
        // Limitar cambios extremos (máximo ±20% por hora)
        $maxChange = $basePrice * 0.20;
        $minPrice = $basePrice - $maxChange;
        $maxPrice = $basePrice + $maxChange;
        
        $newPrice = max($minPrice, min($maxPrice, $newPrice));
        
        // Precio mínimo absoluto (10% del precio inicial)
        $absoluteMin = floatval($terrain['precio_inicial']) * 0.1;
        $newPrice = max($absoluteMin, $newPrice);
        
        return round($newPrice, 8);
    }
    
    /**
     * Factor basado en volumen de trading
     */
    private function calculateVolumeFactor($terrain) {
        $volumen24h = floatval($terrain['volumen_24h']);
        $marketCap = floatval($terrain['precio_actual']) * intval($terrain['supply_circulante']);
        
        if ($marketCap <= 0) return 1.0;
        
        $volumeRatio = $volumen24h / $marketCap;
        
        // Volumen alto = precio sube, volumen bajo = precio baja ligeramente
        if ($volumeRatio > 0.1) {
            return 1.02; // +2%
        } elseif ($volumeRatio > 0.05) {
            return 1.01; // +1%
        } elseif ($volumeRatio < 0.01) {
            return 0.995; // -0.5%
        }
        
        return 1.0;
    }
    
    /**
     * Factor basado en escasez de supply
     */
    private function calculateScarcityFactor($terrain) {
        $supplyUtilization = intval($terrain['supply_circulante']) / intval($terrain['supply_total']);
        
        if ($supplyUtilization > 0.9) {
            return 1.015; // Muy escaso +1.5%
        } elseif ($supplyUtilization > 0.7) {
            return 1.008; // Escaso +0.8%
        } elseif ($supplyUtilization > 0.5) {
            return 1.003; // Medio escaso +0.3%
        } elseif ($supplyUtilization < 0.1) {
            return 0.997; // Muy abundante -0.3%
        }
        
        return 1.0;
    }
    
    /**
     * Factor basado en eventos activos
     */
    private function calculateEventsFactor($terrainId) {
        $query = $this->db->prepare("
            SELECT SUM(impacto_precio) as total_impact
            FROM terrenos_eventos 
            WHERE (terreno_id = ? OR terreno_id IS NULL)
                AND activo = 1 
                AND fecha_inicio <= NOW()
                AND (fecha_fin IS NULL OR fecha_fin > NOW())
        ");
        $query->execute([$terrainId]);
        $result = $query->fetch(PDO::FETCH_ASSOC);
        
        $totalImpact = floatval($result['total_impact'] ?? 0);
        
        // Convertir porcentaje a multiplicador (ej: +15% = 1.15)
        return 1 + ($totalImpact / 100);
    }
    
    /**
     * Factor aleatorio para simular volatilidad del mercado
     */
    private function calculateRandomFactor() {
        // Fluctuación aleatoria entre -2% y +2%
        $randomPercent = (mt_rand(-200, 200) / 100) / 100;
        return 1 + $randomPercent;
    }
    
    /**
     * Tendencia general del mercado
     */
    private function calculateMarketTrend() {
        // Obtener cambio promedio de todos los terrenos en las últimas 24h
        $query = $this->db->prepare("
            SELECT AVG(
                CASE 
                    WHEN precio_inicial > 0 
                    THEN ((precio_actual - precio_inicial) / precio_inicial)
                    ELSE 0 
                END
            ) as avg_change
            FROM terrenos 
            WHERE activo = 1 AND precio_actual > 0
        ");
        $query->execute();
        $result = $query->fetch(PDO::FETCH_ASSOC);
        
        $avgChange = floatval($result['avg_change'] ?? 0);
        
        // Si el mercado general está subiendo, aplicar ligero impulso positivo
        if ($avgChange > 0.1) {
            return 1.005; // +0.5%
        } elseif ($avgChange < -0.1) {
            return 0.995; // -0.5%
        }
        
        return 1.0;
    }
    
    /**
     * Actualizar métricas específicas del terreno
     */
    private function updateTerrainMetrics($terrainId, $oldPrice, $newPrice) {
        $changePercent = (($newPrice - $oldPrice) / $oldPrice) * 100;
        
        $query = $this->db->prepare("
            INSERT INTO terrenos_metricas 
            (terreno_id, cambio_24h, numero_holders, fecha)
            VALUES (?, ?, (SELECT COUNT(*) FROM terrenos_inversiones WHERE terreno_id = ?), CURDATE())
            ON DUPLICATE KEY UPDATE
            cambio_24h = VALUES(cambio_24h),
            numero_holders = VALUES(numero_holders)
        ");
        $query->execute([$terrainId, $changePercent, $terrainId]);
    }
    
    /**
     * Actualizar métricas globales del mercado
     */
    private function updateGlobalMetrics($logFile) {
        try {
            // Calcular capitalización total del mercado
            $query = $this->db->prepare("
                SELECT 
                    SUM(precio_actual * supply_circulante) as total_market_cap,
                    COUNT(*) as total_terrains,
                    AVG(precio_actual) as avg_price
                FROM terrenos 
                WHERE activo = 1 AND precio_actual > 0
            ");
            $query->execute();
            $metrics = $query->fetch(PDO::FETCH_ASSOC);
            
            $this->log("Métricas globales - Market Cap: {$metrics['total_market_cap']}, Terrenos: {$metrics['total_terrains']}", $logFile);
            
        } catch (Exception $e) {
            $this->log("Error actualizando métricas globales: " . $e->getMessage(), $logFile);
        }
    }
    
    /**
     * Limpiar historial antiguo
     */
    private function cleanOldHistory($logFile) {
        try {
            $query = $this->db->prepare("
                DELETE FROM terrenos_precio_historial 
                WHERE fecha < DATE_SUB(NOW(), INTERVAL 90 DAY)
                LIMIT 1000
            ");
            $query->execute();
            
            $deletedRows = $query->rowCount();
            if ($deletedRows > 0) {
                $this->log("Limpieza: $deletedRows registros antiguos eliminados", $logFile);
            }
        } catch (Exception $e) {
            $this->log("Error en limpieza de historial: " . $e->getMessage(), $logFile);
        }
    }
    
    /**
     * Crear directorio de logs si no existe
     */
    private function createLogDir() {
        $logDir = dirname(__FILE__) . '/logs';
        if (!file_exists($logDir)) {
            mkdir($logDir, 0755, true);
        }
    }
    
    /**
     * Función de logging optimizada para Hostinger
     */
    private function log($message, $logFile) {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] $message" . PHP_EOL;
        
        // Escribir al archivo de log
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
        
        // También mostrar en CLI si corresponde
        if (php_sapi_name() === 'cli') {
            echo $logMessage;
        }
    }
}

// Ejecutar actualización con manejo de errores robusto
try {
    $updater = new TerrainPriceUpdater();
    $updater->updateAllPrices();
} catch (Exception $e) {
    error_log("Error fatal en cron_price_update.php: " . $e->getMessage());
    
    if (php_sapi_name() !== 'cli') {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error fatal del sistema',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } else {
        echo "[" . date('Y-m-d H:i:s') . "] ERROR FATAL: " . $e->getMessage() . "\n";
    }
}

if (php_sapi_name() === 'cli') {
    echo "[" . date('Y-m-d H:i:s') . "] Proceso completado.\n";
}
?>

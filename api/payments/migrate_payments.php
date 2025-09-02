<?php
require_once '../../includes/Database.php';

try {
    $db = Database::getInstance();
    $connection = $db->getConnection();
    
    // Crear tabla de órdenes de pago
    $createPaymentOrdersTable = "
        CREATE TABLE IF NOT EXISTS payment_orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            order_id VARCHAR(100) UNIQUE NOT NULL,
            package_type ENUM('basic', 'premium', 'deluxe') NOT NULL,
            keys_amount INT NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(3) NOT NULL DEFAULT 'USD',
            status ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
            payment_id VARCHAR(100) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP NULL,
            INDEX idx_user_id (user_id),
            INDEX idx_order_id (order_id),
            INDEX idx_status (status),
            FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $connection->exec($createPaymentOrdersTable);
    echo "✅ Tabla 'payment_orders' creada exitosamente.\n";
    
    // Verificar si la tabla wallet_transactions existe, si no, crearla
    $createWalletTransactionsTable = "
        CREATE TABLE IF NOT EXISTS wallet_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            tipo ENUM('compra_terreno', 'venta_terreno', 'transferencia_esferas', 'compra_llaves') NOT NULL,
            terrain_id INT NULL,
            destinatario_id INT NULL,
            cantidad_esferas DECIMAL(15, 2) DEFAULT 0,
            cantidad_acciones DECIMAL(15, 8) DEFAULT 0,
            precio_por_accion DECIMAL(15, 8) DEFAULT 0,
            fee DECIMAL(15, 2) DEFAULT 0,
            descripcion TEXT,
            fecha_transaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_tipo (tipo),
            INDEX idx_fecha (fecha_transaccion),
            FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $connection->exec($createWalletTransactionsTable);
    echo "✅ Tabla 'wallet_transactions' verificada/creada exitosamente.\n";
    
    echo "\n🎉 Migración de pagos completada exitosamente!\n";
    echo "\n📋 Tablas creadas:\n";
    echo "   - payment_orders: Para gestionar órdenes de pago de llaves\n";
    echo "   - wallet_transactions: Para el historial de transacciones\n";
    echo "\n🔧 Configuración requerida:\n";
    echo "   1. Configurar webhook URL en DlocalGo: tu-dominio.com/api/payments/webhook.php\n";
    echo "   2. Actualizar las URLs de éxito/fallo en buy_keys.php\n";
    echo "   3. Configurar el secret key del webhook en webhook.php\n";
    
} catch (PDOException $e) {
    echo "❌ Error en la migración: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Error general: " . $e->getMessage() . "\n";
    exit(1);
}
?>

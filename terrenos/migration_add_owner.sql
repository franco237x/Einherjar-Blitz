-- Migration para agregar propietario a terrenos existentes
-- Ejecutar este script en la base de datos de producción

-- Agregar columna owner_id a la tabla terrenos
ALTER TABLE `terrenos` 
ADD COLUMN `owner_id` int(11) DEFAULT NULL COMMENT 'ID del propietario (usuario)' AFTER `descripcion`,
ADD KEY `idx_owner_id` (`owner_id`),
ADD CONSTRAINT `fk_terrenos_owner` FOREIGN KEY (`owner_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

-- Verificar que la columna se agregó correctamente
DESCRIBE `terrenos`;

-- Opcional: Asignar propietarios aleatorios a algunos terrenos para pruebas
-- (Descomenta estas líneas si quieres asignar propietarios de prueba)
-- UPDATE `terrenos` SET `owner_id` = 1 WHERE `id` IN (1, 5, 10);
-- UPDATE `terrenos` SET `owner_id` = 2 WHERE `id` IN (2, 7, 12);
-- UPDATE `terrenos` SET `owner_id` = 3 WHERE `id` IN (3, 8, 15);

-- Verificar los cambios
SELECT `id`, `nombre`, `owner_id` FROM `terrenos` LIMIT 10;

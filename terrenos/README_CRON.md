# Configuración del Cron Job para Precios Automáticos

## Instalación del Cron Job

### Linux/Unix:
```bash
# Editar crontab
crontab -e

# Ejecutar cada 30 minutos
*/30 * * * * /usr/bin/php /path/to/your/project/terrenos/cron_price_update.php >> /var/log/terrain_prices.log 2>&1

# Ejecutar cada hora
0 * * * * /usr/bin/php /path/to/your/project/terrenos/cron_price_update.php >> /var/log/terrain_prices.log 2>&1
```

### Windows:
```cmd
# Usar Task Scheduler (Programador de tareas)
# Crear nueva tarea básica que ejecute:
php.exe "C:\path\to\your\project\terrenos\cron_price_update.php"
```

### XAMPP Local (para testing):
```bash
# Ejecutar manualmente
php terrenos/cron_price_update.php
```

## Funcionalidades del Cron Job

### 🎯 Algoritmo de Precios Dinámicos:
- **Factor de Volumen**: Más trading = precios suben
- **Factor de Escasez**: Menos supply disponible = precios suben  
- **Eventos del Juego**: Noticias positivas/negativas afectan precios
- **Volatilidad Aleatoria**: Simulación de mercado real (±2%)
- **Tendencia del Mercado**: Si todo sube, impulso adicional

### 🔒 Limitaciones de Seguridad:
- Máximo cambio por ejecución: ±20%
- Precio mínimo: 10% del precio inicial
- Solo terrenos con precio > 0

### 📊 Métricas Actualizadas:
- Historial de precios por terreno
- Market cap en tiempo real
- Número de holders
- Cambios porcentuales 24h

### 🧹 Limpieza Automática:
- Elimina historial > 90 días
- Mantiene base de datos optimizada

## Logs y Monitoreo

El script genera logs detallados:
```
[2024-08-29 18:45:00] Iniciando actualización de precios de terrenos...
[2024-08-29 18:45:01] Liyue: 180.5 → 183.2 (+1.50%)
[2024-08-29 18:45:02] Cybertron: 250.0 → 248.1 (-0.76%)
[2024-08-29 18:45:03] Actualización completada. 7 terrenos actualizados.
```

## Recomendaciones

- **Producción**: Ejecutar cada 30-60 minutos
- **Desarrollo**: Ejecutar manualmente para testing
- **Monitoreo**: Revisar logs regularmente
- **Backup**: Hacer respaldo de BD antes de implementar

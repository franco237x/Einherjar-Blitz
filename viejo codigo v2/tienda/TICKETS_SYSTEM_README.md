# Sistema de Tickets para Tienda y Marketplace
## Guía de Implementación - Einherjer Blitz

---

## 📋 Descripción General

El **Sistema de Tickets** reemplaza el uso de `recompensas_usuario` para las compras de la **Tienda** y **Marketplace**. Este nuevo sistema separa correctamente:
- **Cantidad de artículos** comprados
- **Precio pagado** por la compra

### Problema Anterior
En el sistema antiguo, se guardaba el **precio** en el campo `valor` de `recompensas_usuario`, causando confusión al mostrar "500 Esferas" como si fueran 500 unidades del artículo.

### Solución
Nuevo sistema de tickets donde:
- `cantidad` = número de unidades del artículo
- `precio_pagado` = cuánto pagó el usuario (en Esferas, Llaves o Cupones)
- `moneda_usada` = tipo de moneda utilizada

---

## 🗃️ Estructura de Base de Datos

### 1. Instalar las tablas

```bash
# Ubicación: /tienda/tickets_setup.sql
# Ejecutar en phpMyAdmin o MySQL Workbench
```

**Tablas creadas:**
- `tienda_tickets` - Tickets principales
- `tienda_tickets_historial` - Historial de tickets reclamados
- `tienda_tickets_stats` - Estadísticas por usuario

**Triggers automáticos:**
- Actualizar estadísticas al crear ticket
- Actualizar estadísticas al reclamar ticket
- Guardar en historial al reclamar

---

## 📁 Archivos Creados

### 1. **tickets_setup.sql**
Base de datos completa con triggers y procedimientos almacenados.

### 2. **tickets.php**
Interfaz principal para ver y reclamar tickets.

**Características:**
- Lista de tickets pendientes
- Estadísticas personales
- Botón "Reclamar Todos"
- Diseño responsivo
- Integración con SweetAlert2

### 3. **api/claim_tickets.php**
API para gestionar tickets.

**Endpoints:**
- `claim_all` - Reclamar todos los tickets del usuario
- `claim_single` - Reclamar un ticket específico
- `get_report` - Obtener reporte de tickets

---

## 🔄 Cambios en Archivos Existentes

### **tienda.php**

**Cambio en línea ~66:**

❌ **ANTES:**
```php
$insertReward = $db->prepare("INSERT INTO recompensas_usuario (user_id, username, recompensa_obtenida, tipo_recompensa, valor) VALUES (?, ?, ?, ?, ?)");
$insertReward->execute([$userData['id'], $userRow['username'], $product['Nombre'], 'tienda', $product['Precio_Esferas']]);
```

✅ **AHORA:**
```php
$insertTicket = $db->prepare("
    INSERT INTO tienda_tickets (
        user_id, username, ticket_type, item_name, item_description,
        cantidad, precio_pagado, moneda_usada, categoria, imagen_url,
        transaction_id
    ) VALUES (?, ?, 'tienda', ?, ?, 1, ?, 'esferas', ?, ?, LAST_INSERT_ID())
");
$insertTicket->execute([
    $userData['id'], 
    $userRow['username'], 
    $product['Nombre'],
    $product['descripcion'] ?? null,
    $product['Precio_Esferas'],
    $product['categoria'] ?? 'General',
    $product['Imagen_URL'] ?? null
]);
```

**Nuevo botón en header:**
```php
<a href="tickets.php" class="history-btn" style="border-color: rgba(75,192,192,0.35); color: #4bc0c0;">
    <i class="fas fa-ticket-alt"></i>
    <span>Mis Tickets</span>
</a>
```

---

### **api/buy_listing.php**

**Cambio en línea ~150:**

❌ **ANTES:**
```php
$rewardStmt = $db->prepare("
    INSERT INTO recompensas_usuario (user_id, username, recompensa_obtenida, tipo_recompensa, valor)
    VALUES (?, ?, ?, 'marketplace', ?)
");
$rewardStmt->execute([
    $buyer['id'],
    $buyer['username'],
    $listing['item_name'],
    $price
]);
```

✅ **AHORA:**
```php
// Ticket para el COMPRADOR
$insertTicket = $db->prepare("
    INSERT INTO tienda_tickets (
        user_id, username, ticket_type, item_name, item_description,
        cantidad, precio_pagado, moneda_usada, categoria, imagen_url,
        transaction_id, seller_id, seller_username, listing_id
    ) VALUES (?, ?, 'marketplace_compra', ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
");
$insertTicket->execute([...]);

// Ticket para el VENDEDOR (registro de venta)
$insertSellerTicket = $db->prepare("
    INSERT INTO tienda_tickets (
        user_id, username, ticket_type, item_name, item_description,
        cantidad, precio_pagado, moneda_usada, categoria, imagen_url,
        transaction_id, listing_id, notes
    ) VALUES (?, ?, 'marketplace_venta', ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
");
$insertSellerTicket->execute([...]);
```

---

## 🎯 Flujo de Usuario

### Comprar en Tienda:
1. Usuario compra un producto
2. Se deduce el precio de sus Esferas
3. Se crea un **ticket tipo 'tienda'**
4. Usuario ve el ticket en `/tienda/tickets.php`
5. Usuario reclama el ticket
6. Ticket se marca como reclamado
7. Se guarda en historial

### Comprar en Marketplace:
1. Usuario compra un anuncio
2. Se deduce el precio (Esferas/Llaves/Cupones)
3. Se crean **2 tickets:**
   - Ticket tipo `marketplace_compra` para el comprador
   - Ticket tipo `marketplace_venta` para el vendedor
4. Ambos usuarios ven sus tickets
5. Cada uno puede reclamarlos independientemente

---

## 📊 Tipos de Tickets

| Tipo | Descripción | Color Badge |
|------|-------------|-------------|
| `tienda` | Compra en tienda oficial | Verde azulado |
| `marketplace_compra` | Compra en marketplace | Naranja |
| `marketplace_venta` | Venta en marketplace | Morado |

---

## 🎨 Interfaz de Tickets

### Estadísticas mostradas:
- Total de tickets pendientes
- Compras en tienda
- Compras en marketplace
- Ventas en marketplace

### Información por ticket:
- Nombre del artículo
- Cantidad comprada
- Precio pagado
- Moneda utilizada
- Vendedor (si aplica)
- Fecha de compra
- Imagen del producto

---

## 🔐 Seguridad

### Validaciones implementadas:
✅ Verificación de autenticación
✅ Verificación de propiedad del ticket
✅ Transacciones con bloqueos (`FOR UPDATE`)
✅ Rollback automático en caso de error
✅ Triggers para mantener consistencia

---

## 📱 Responsividad

El sistema está completamente optimizado para:
- Desktop (1920px+)
- Tablet (768px - 992px)
- Móvil (< 768px)
- Móvil pequeño (< 576px)

---

## 🧪 Pruebas Recomendadas

1. **Compra en Tienda:**
   - [ ] Comprar un producto
   - [ ] Ver el ticket generado
   - [ ] Reclamar el ticket
   - [ ] Verificar estadísticas

2. **Compra en Marketplace:**
   - [ ] Comprar un anuncio con Esferas
   - [ ] Comprar un anuncio con Llaves
   - [ ] Ver tickets de comprador y vendedor
   - [ ] Reclamar ambos tickets

3. **Reclamar Múltiples:**
   - [ ] Acumular varios tickets
   - [ ] Usar "Reclamar Todos"
   - [ ] Verificar historial

---

## 📝 Notas Importantes

### Migración de datos antiguos:
Los datos en `recompensas_usuario` con `tipo_recompensa = 'tienda'` **NO se migran automáticamente**. Si deseas migrar:

```sql
INSERT INTO tienda_tickets (user_id, username, ticket_type, item_name, cantidad, precio_pagado, moneda_usada, created_at)
SELECT 
    user_id, 
    username, 
    'tienda' as ticket_type,
    recompensa_obtenida as item_name,
    1 as cantidad,
    valor as precio_pagado,
    'esferas' as moneda_usada,
    fecha_obtencion as created_at
FROM recompensas_usuario
WHERE tipo_recompensa = 'tienda'
AND id NOT IN (SELECT id FROM tienda_tickets);
```

### Limpieza de tickets expirados:
```sql
CALL sp_cleanup_expired_tickets();
```

---

## 🆘 Soporte y Troubleshooting

### Error: "Tabla no existe"
```bash
# Ejecutar tickets_setup.sql en tu base de datos
mysql -u root einherjer_blitz < tickets_setup.sql
```

### Error: "No se pueden reclamar tickets"
- Verificar que `api/claim_tickets.php` tenga permisos de ejecución
- Verificar que la sesión esté activa
- Revisar logs de PHP

### Tickets no aparecen:
```sql
SELECT * FROM tienda_tickets WHERE user_id = YOUR_USER_ID AND claimed = 0;
```

---

## ✅ Checklist de Implementación

- [x] Ejecutar `tickets_setup.sql`
- [x] Subir `tickets.php`
- [x] Subir `api/claim_tickets.php`
- [x] Modificar `tienda.php` (compra)
- [x] Modificar `api/buy_listing.php` (marketplace)
- [x] Agregar botón "Mis Tickets" en header
- [ ] Realizar pruebas
- [ ] Migrar datos antiguos (opcional)

---

## 🎉 Resultado Final

El usuario ahora ve claramente:
- **"Espada Legendaria x1"** (cantidad correcta)
- **"Precio: 500 Esferas"** (precio pagado)

En lugar de la confusa:
- ~~"Espada Legendaria x500"~~ ❌

---

**Última actualización:** 10 de Noviembre, 2025
**Versión:** 1.0
**Autor:** AI Assistant

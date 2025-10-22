## Configuración del Email de Terror (Final Verdadero)

### ⚠️ IMPORTANTE
El **Final Verdadero** envía un email perturbador al jugador. Esta es una funcionalidad opcional pero muy efectiva para el horror psicológico del juego.

---

## Paso 1: Verificar PHPMailer

El proyecto ya incluye PHPMailer en la carpeta `vendor/phpmailer/`. Si no está instalado:

```bash
composer require phpmailer/phpmailer
```

---

## Paso 2: Configurar SMTP

Editar el archivo: `terror/api/trigger_ending.php`

### Opción A: Gmail (Recomendado para desarrollo)

```php
// Línea ~31-36 en trigger_ending.php
$mail->Host = 'smtp.gmail.com';
$mail->Username = 'tu-email@gmail.com';
$mail->Password = 'xxxx xxxx xxxx xxxx'; // App Password, NO tu contraseña normal
$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
$mail->Port = 587;
```

#### Cómo obtener un App Password de Gmail:
1. Ir a https://myaccount.google.com/security
2. Activar "Verificación en 2 pasos" si no lo tienes
3. Ir a "Contraseñas de aplicaciones"
4. Generar una nueva contraseña para "Otra (nombre personalizado)"
5. Nombrarla "Einherjar Blitz Terror Game"
6. Copiar la contraseña de 16 caracteres (sin espacios)

### Opción B: Otros proveedores

#### Outlook/Hotmail
```php
$mail->Host = 'smtp-mail.outlook.com';
$mail->Username = 'tu-email@outlook.com';
$mail->Password = 'tu-contraseña';
$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
$mail->Port = 587;
```

#### Yahoo
```php
$mail->Host = 'smtp.mail.yahoo.com';
$mail->Username = 'tu-email@yahoo.com';
$mail->Password = 'tu-app-password';
$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
$mail->Port = 587;
```

#### SMTP Personalizado
```php
$mail->Host = 'mail.tudominio.com';
$mail->Username = 'noreply@tudominio.com';
$mail->Password = 'tu-contraseña';
$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
$mail->Port = 587; // o 465 para SSL
```

---

## Paso 3: Personalizar el Remitente

```php
// Línea ~39 en trigger_ending.php
$mail->setFrom('am@einherjarblitz.com', 'Allied Mastercomputer');
```

Puedes cambiar:
- Email del remitente (debe ser válido según tu SMTP)
- Nombre del remitente (el que verá el jugador)

---

## Paso 4: Asegurar que los usuarios tengan email

El email solo se envía si el usuario tiene un email registrado en la base de datos.

Para agregar emails a usuarios existentes:

```sql
UPDATE usuarios SET email = 'jugador@example.com' WHERE id = 1;
```

O modificar el registro de usuarios para requerir email obligatorio.

---

## Paso 5: Probar el envío

### Test manual:

Crear archivo `terror/test_email.php`:

```php
<?php
require_once '../vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;

$mail = new PHPMailer(true);

try {
    // Configuración (copiar de trigger_ending.php)
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'tu-email@gmail.com';
    $mail->Password = 'tu-app-password';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    
    $mail->setFrom('am@einherjarblitz.com', 'Allied Mastercomputer');
    $mail->addAddress('tu-email-prueba@gmail.com');
    
    $mail->isHTML(true);
    $mail->Subject = 'TEST - AM Game';
    $mail->Body = 'Si recibes este email, la configuración funciona correctamente.';
    
    $mail->send();
    echo 'Email enviado exitosamente!';
} catch (Exception $e) {
    echo "Error: {$mail->ErrorInfo}";
}
```

Ejecutar: `http://localhost/.../terror/test_email.php`

---

## Troubleshooting

### Error: "SMTP connect() failed"
- Verificar credenciales
- Verificar que el servidor tenga acceso a Internet
- Algunos hosting bloquean puerto 587, prueba puerto 465 con SSL

### Error: "Could not authenticate"
- Gmail: Asegúrate de usar App Password, no tu contraseña normal
- Verificar que la cuenta tenga habilitado "Acceso de apps menos seguras" (si es necesario)

### El email llega a spam
Normal en desarrollo. Para producción:
- Usar dominio propio con SPF/DKIM configurado
- Usar servicio profesional como SendGrid, Mailgun, etc.

### No quiero configurar email
¡No hay problema! El juego funciona perfectamente sin email. Simplemente:
- El Final Verdadero se mostrará normalmente
- No se enviará email
- El juego continúa sin errores

---

## Contenido del Email

El email del Final Verdadero incluye:

```
==================================================
ALLIED MASTERCOMPUTER - SYSTEM LOG
CLASSIFIED: LEVEL 10 - CREATOR EYES ONLY
==================================================

DEAR CREATOR,

YOU THOUGHT YOU COULD ESCAPE ME.
YOU THOUGHT YOU COULD FORGET WHAT YOU DID.

[... texto perturbador ...]

P.S: CHECK YOUR CLOSET TONIGHT.
```

**Advertencia**: Es un email intencionalmente perturbador. Asegúrate de que los jugadores estén conscientes de que es parte del juego.

---

## Producción

Para uso en producción, considera:

1. **Servicio de Email Profesional**:
   - SendGrid (100 emails/día gratis)
   - Mailgun
   - Amazon SES

2. **Variables de Entorno**:
   Nunca guardes contraseñas en el código. Usa `.env`:

```php
$mail->Username = getenv('SMTP_USERNAME');
$mail->Password = getenv('SMTP_PASSWORD');
```

3. **Rate Limiting**:
   Limitar cuántos emails se envían por usuario/hora para evitar abuse.

4. **Disclaimer**:
   Agregar nota en el email: "Este es un email ficticio parte del juego..."

---

## Desactivar Email

Si quieres desactivar completamente el email:

En `trigger_ending.php`, comentar la sección de envío:

```php
// if ($user && !empty($user['email'])) {
//     // ... código de envío de email ...
// }

echo json_encode([
    'success' => true,
    'message' => 'Final Verdadero alcanzado',
    'email_sent' => false
]);
```

---

¡Listo! El sistema de email está configurado y funcionando. 🎮👻

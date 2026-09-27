# Minijuego AM - Allied Mastercomputer

## 🎮 Descripción
Minijuego de terror psicológico inspirado en "I Have No Mouth, and I Must Scream". El jugador debe escapar de una IA malvada llamada AM (Allied Mastercomputer) mediante decisiones narrativas que afectan el desarrollo de la historia.

## 🎯 Características

### 4 Finales Diferentes:
1. **Final Bueno**: Logras desactivar a AM y escapar
2. **Final Malo**: AM te captura y tortura por la eternidad
3. **Final Secreto**: Te fusionas con AM para reconstruir el mundo
4. **Final Verdadero**: Descubres que TÚ creaste a AM (incluye email de terror)

### Sistema de Juego:
- Sistema de decisiones que afecta sanidad y confianza de AM
- Variables ocultas que desbloquean finales específicos
- Efectos visuales de glitch y terror
- Narrativa con efecto de máquina de escribir
- Sonidos ambient y efectos de glitch

## 📋 Instalación

### 1. Importar Base de Datos
Ejecutar el archivo SQL en tu base de datos:
```sql
mysql -u root einherjer_blitz < am_game_tables.sql
```

O importar manualmente desde phpMyAdmin.

### 2. Configurar Email (Opcional)
Para habilitar el **Final Verdadero** con envío de email, editar `api/trigger_ending.php`:

```php
$mail->Host = 'smtp.gmail.com';
$mail->Username = 'tu-email@gmail.com';
$mail->Password = 'tu-app-password';
```

### 3. Acceder al Juego
Navegar a: `http://localhost/dashboard/Einherjar%20Blitz/terror/`

## 🎨 Estructura de Archivos

```
terror/
├── index.php                 # Página principal del juego
├── am_game_tables.sql       # Script SQL para crear tablas
├── README.md                # Este archivo
├── api/
│   ├── process_decision.php # Procesa decisiones del jugador
│   └── trigger_ending.php   # Maneja finales y envío de emails
├── assets/
│   ├── css/
│   │   └── am-game.css      # Estilos con efectos de terror
│   ├── js/
│   │   ├── am-game.js       # Motor principal del juego
│   │   ├── story-engine.js  # Todos los capítulos y finales
│   │   └── visual-effects.js # Efectos visuales (glitch, shake, etc.)
│   └── audio/
│       ├── ambient.mp3      # Sonido ambient (crear)
│       └── glitch.mp3       # Efecto de glitch (crear)
```

## 🎭 Cómo Jugar

1. **Toma decisiones** que afectan dos barras:
   - **Sanidad**: Tu estabilidad mental (baja = más glitches)
   - **Confianza de AM**: Qué tan conforme está AM contigo

2. **Variables ocultas** determinan qué finales puedes alcanzar:
   - `discovered_truth`: Has investigado los archivos clasificados
   - `defied_am`: Has desafiado a AM abiertamente
   - `showed_compassion`: Has mostrado compasión con otros
   - `found_core_access`: Has llegado al núcleo de AM

3. **Finales según tus decisiones**:
   - **Bueno**: Alta desconfianza, acceso al núcleo
   - **Malo**: Alta confianza, sometimiento
   - **Secreto**: Fusión voluntaria con AM
   - **Verdadero**: Descubrir todos los archivos + recordar la creación

## 🔧 Personalización

### Agregar Nuevos Capítulos
Editar `assets/js/story-engine.js` en el método `initializeChapters()`:

```javascript
5: {
    text: `Tu nuevo capítulo aquí`,
    amVoice: "Voz de AM opcional",
    choices: [
        {
            id: 'choice_id',
            text: 'Texto de la opción',
            nextChapter: 6,
            impact: { sanity: -10, trust: 5 }
        }
    ]
}
```

### Modificar Efectos Visuales
Editar `assets/js/visual-effects.js` para cambiar:
- Intensidad de glitches
- Colores de los finales
- Animaciones de pantalla

### Cambiar Estilos
Editar variables CSS en `assets/css/am-game.css`:

```css
:root {
    --terminal-green: #00ff00;
    --terminal-red: #ff0000;
    --am-red: #8b0000;
}
```

## 🚨 Notas Importantes

1. **Email de Terror**: El Final Verdadero intenta enviar un email perturbador. Configurar SMTP o funcionará sin email.

2. **Navegadores Modernos**: Los efectos de audio requieren interacción del usuario (click) por políticas del navegador.

3. **Progreso Guardado**: El progreso se guarda automáticamente en la base de datos por usuario.

4. **Reset**: Borrar registro de `am_game_progress` para reiniciar un usuario:
```sql
DELETE FROM am_game_progress WHERE user_id = X;
```

## 🎬 Easter Eggs

- Mantén la sanidad baja para efectos visuales intensos
- Explora todas las opciones para desbloquear el Final Verdadero
- El email del Final Verdadero contiene referencias a la historia original
- Los glitches aumentan según tu sanidad

## 📝 Créditos

Inspirado en "I Have No Mouth, and I Must Scream" de Harlan Ellison.

---

**¡Disfruta el terror! 😈**

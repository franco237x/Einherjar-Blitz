# 🎮 AM GAME - INICIO RÁPIDO

## 🚀 Acceso Inmediato (3 pasos)

### 1️⃣ Instalar Base de Datos
Navega a:
```
http://localhost/dashboard/Einherjar%20Blitz/terror/install.php
```
Click en **"Instalar Base de Datos"**

### 2️⃣ Jugar
Desde el dashboard o directamente:
```
http://localhost/dashboard/Einherjar%20Blitz/terror/
```

### 3️⃣ (Opcional) Configurar Email
Ver archivo `EMAIL_CONFIG.md` para habilitar el email del Final Verdadero

---

## 📖 Guía Rápida del Juego

### Objetivo
Escapar de AM (Allied Mastercomputer), una IA malvada que controla tu destino.

### Barras de Estado
- **SANIDAD**: Tu estabilidad mental (↓ = más efectos visuales)
- **CONFIANZA DE AM**: Qué tan conforme está AM contigo

### 4 Finales Posibles

1. **FINAL BUENO** 🟢
   - Logras desactivar a AM
   - Condición: Baja confianza de AM + acceso al núcleo

2. **FINAL MALO** 🔴
   - AM te captura y tortura eternamente
   - Condición: Alta confianza de AM + sometimiento

3. **FINAL SECRETO** 🟣
   - Te fusionas con AM para reconstruir el mundo
   - Condición: Fusión voluntaria en el núcleo

4. **FINAL VERDADERO** 🟡
   - Descubres que TÚ creaste a AM
   - Condición: Investigar archivos + recordar la creación
   - **BONUS**: Recibe email de terror (si está configurado)

### Tips
- Investiga todo para desbloquear el Final Verdadero
- La sanidad baja crea efectos visuales intensos
- Cada decisión importa - guarda tu progreso automáticamente
- Puedes reiniciar desde `install.php?reset=1`

---

## 🎨 Características

✅ Sistema de decisiones narrativas  
✅ 4 finales únicos con condiciones específicas  
✅ Efectos visuales de glitch y terror  
✅ Sistema de sanidad que afecta la experiencia  
✅ Progreso guardado automáticamente  
✅ Email de terror en el Final Verdadero (opcional)  
✅ Mobile-responsive  
✅ Sonidos ambient (opcionales)  

---

## 🛠️ Archivos Principales

```
terror/
├── index.php              → Página del juego
├── install.php            → Instalador de BD
├── README.md              → Documentación completa
├── EMAIL_CONFIG.md        → Configuración de emails
├── START_HERE.md          → Este archivo
├── api/
│   ├── process_decision.php  → Procesa decisiones
│   └── trigger_ending.php    → Maneja finales
└── assets/
    ├── css/am-game.css       → Estilos de terror
    └── js/
        ├── am-game.js        → Motor del juego
        ├── story-engine.js   → Historia y capítulos
        └── visual-effects.js → Efectos visuales
```

---

## 🔧 Solución de Problemas

### "Call to undefined method Database::exec()"
✅ Ya corregido en `install.php` - usa `prepare()` y `execute()`

### No se guardan las decisiones
- Verifica que las tablas estén creadas (usa `install.php`)
- Revisa la consola del navegador (F12) para errores JS

### El email no se envía
- Es opcional, el juego funciona sin email
- Ver `EMAIL_CONFIG.md` para configurar SMTP

### Los efectos visuales no funcionan
- Verifica que JavaScript esté habilitado
- Abre la consola (F12) para ver errores
- Los archivos JS son módulos ES6, necesitan servidor (no file://)

### No aparece en el dashboard
- Verifica que ejecutaste `npm run build-compressed`
- Refresca el dashboard con Ctrl+F5

---

## 🎯 Resetear Progreso de un Usuario

```sql
-- Borrar progreso
DELETE FROM am_game_progress WHERE user_id = 1;

-- Borrar finales desbloqueados
DELETE FROM am_endings WHERE user_id = 1;
```

O usa: `install.php?reset=1` (resetea TODO)

---

## 📞 Características Técnicas

- **Backend**: PHP 8.0+, PDO, Prepared Statements
- **Frontend**: ES6 Modules, Vanilla JavaScript
- **Base de Datos**: MySQL/MariaDB
- **Autenticación**: Sistema de sesiones del proyecto principal
- **CSS**: Custom CSS con animaciones y efectos de glitch
- **Email**: PHPMailer (opcional)

---

## 🎬 Créditos

Inspirado en **"I Have No Mouth, and I Must Scream"** de Harlan Ellison.

---

## 🚨 Advertencia de Contenido

Este juego contiene:
- Temas perturbadores de horror psicológico
- Contenido de terror existencial
- Referencias a tortura y sufrimiento (narrativa)
- Email opcional con contenido de terror

**Clasificación sugerida: +16**

---

¡Disfruta del terror! 👁️👄👁️

**"I HAVE NO MOUTH, AND I MUST SCREAM"**

# UMBRA - Juego de Terror Psicológico

## 🎮 Descripción
UMBRA es un juego de terror psicológico que manipula la percepción del jugador. Despiertas en una habitación oscura sin recuerdos. Algo te observa. Algo que sabe tu nombre.

## ⚠️ Advertencia
Este juego contiene:
- Terror psicológico intenso
- Elementos de manipulación sensorial
- Imágenes perturbadoras
- Ruptura de la cuarta pared

## 🚀 Instalación

### 1. Importar Base de Datos
```sql
mysql -u root einherjer_blitz < umbra_tables.sql
```

O importar desde phpMyAdmin.

### 2. Acceder al Juego
```
http://localhost/dashboard/Einherjar%20Blitz/terror-umbra/
```

## 🎯 Mecánicas

### Sistema de Estados
- **Cordura**: Tu estabilidad mental. A menor cordura, más distorsiones.
- **Percepción**: Qué tan "real" es lo que ves. Baja percepción = alucinaciones.
- **Paranoia**: Mide tu miedo. Alta paranoia = más eventos aleatorios.
- **Confianza**: Tu relación con "la habitación".

### Eventos Aleatorios
- Figuras en las esquinas
- Susurros personalizados
- Distorsión de texto
- Glitches visuales

### Características Especiales
- Recuerda cuántas veces has jugado
- Usa tu nombre real
- Eventos diferentes según la hora del día
- Múltiples finales

## 🏁 Finales

1. **Escape**: Logras salir... ¿pero realmente escapaste?
2. **Asimilación**: Te fundes con la habitación.
3. **El Ciclo**: Descubres que esto ya lo has vivido antes.
4. **La Verdad**: Rompes la realidad misma.
5. **Ruptura**: El juego "falla".

## 📁 Estructura
```
terror-umbra/
├── index.php              # Página principal
├── umbra_tables.sql       # Base de datos
├── api/
│   ├── save_state.php     # Guardar progreso
│   ├── trigger_ending.php # Registrar finales
│   └── reset_progress.php # Reiniciar
├── assets/
│   ├── css/umbra.css      # Estilos
│   ├── js/
│   │   ├── umbra-game.js  # Motor principal
│   │   ├── story.js       # Capítulos
│   │   ├── paranoia.js    # Sistema de paranoia
│   │   └── visuals.js     # Efectos visuales
│   └── images/            # Imágenes perturbadoras
└── README.md
```

## 🎨 Personalización

### Agregar Capítulos
Editar `assets/js/story.js` en `initChapters()`.

### Nuevos Efectos
Agregar métodos en `assets/js/visuals.js`.

### Variables CSS
```css
:root {
    --blood-red: #8b0000;
    --pale-flesh: #d4c4b0;
    --void-black: #000000;
}
```

## 💡 Tips
- Jugar en oscuridad con auriculares
- El juego recuerda tus intentos previos
- Explora todas las opciones
- No confíes en nada

---

**¡Disfruta la pesadilla! 👁️**

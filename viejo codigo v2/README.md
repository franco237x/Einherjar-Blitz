# Einherjer Blitz 3.0 - Portal del Guerrero

## 🛡️ Descripción

**Einherjer Blitz 3.0** es una versión completamente renovada del portal de autenticación para el juego, construida con tecnologías modernas y un diseño responsive optimizado para dispositivos móviles.

## ✨ Características Principales

### 🎨 **Diseño Moderno**
- Interfaz completamente rediseñada con Bootstrap 5
- Tema oscuro con acentos dorados
- Efectos visuales inmersivos (partículas flotantes, animaciones)
- Diseño totalmente responsive para móviles y tablets

### 📱 **Experiencia Móvil Optimizada**
- Modal fullscreen para dispositivos móviles
- Controles táctiles optimizados
- Formularios adaptados para pantallas pequeñas
- Navegación intuitiva

### 🔐 **Sistema de Autenticación Robusto**
- Login con usuario/contraseña
- Compatibilidad con ID únicos (usuarios antiguos)
- Registro de nuevos usuarios
- Validación en tiempo real
- Manejo de errores mejorado

### 🎯 **Tecnologías Utilizadas**
- **Frontend**: Bootstrap 5, SCSS, JavaScript ES6+
- **Backend**: PHP 8+ con sistema de autenticación
- **Librerías**: AOS (Animate On Scroll), Font Awesome
- **Arquitectura**: Mobile-first, Progressive Enhancement

## 📁 Estructura del Proyecto

```
Einherjer Blitz/
├── index.php                 # Página principal con autenticación
├── dashboard.php             # Dashboard del juego
├── assets/
│   ├── scss/
│   │   └── style.scss        # Estilos fuente en SCSS
│   ├── css/
│   │   └── main.css          # CSS compilado
│   └── js/
│       └── main.js           # JavaScript principal
├── includes/
│   └── Database.php          # Sistema de base de datos
├── images/                   # Recursos gráficos
├── characters/               # Sistema de personajes
└── package.json              # Configuración de dependencias
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- PHP 8.0 o superior
- Servidor web (Apache/Nginx)
- Node.js y npm (para compilar SCSS)

### Configuración Inicial

1. **Clonar/Descargar el proyecto**
   ```bash
   # Si usas git
   git clone [repository-url]
   cd "Einherjer Blitz"
   ```

2. **Instalar dependencias de desarrollo**
   ```bash
   npm install
   ```

3. **Compilar estilos SCSS**
   ```bash
   # Compilación única
   npm run build-css
   
   # Modo watch (recompila automáticamente)
   npm run watch-css
   
   # Compilación comprimida para producción
   npm run build-css-compressed
   ```

4. **Configurar la base de datos**
   - Configurar la conexión en `includes/Database.php`
   - Importar las tablas necesarias

## 🎮 Uso

### Para Usuarios
1. Acceder a `index.php`
2. **En Desktop**: Usar el formulario del lado derecho
3. **En Móvil**: Tocar "Comenzar Aventura" para abrir el modal
4. Elegir entre "Entrar" o "Registrar"
5. Completar los datos y acceder al dashboard

### Para Desarrolladores

#### Compilar SCSS
```bash
# Desarrollo con watch
npm run watch-css

# Producción
npm run build-css-compressed
```

#### Estructura del CSS
- **Variables CSS**: Definidas en `:root` para fácil personalización
- **SCSS Modular**: Organizado en secciones lógicas
- **Responsive**: Mobile-first con breakpoints específicos
- **Animaciones**: Keyframes optimizadas para rendimiento

#### JavaScript
- **Clase EinherjerAuth**: Sistema principal de autenticación
- **Async/Await**: Para llamadas AJAX modernas
- **Event Listeners**: Manejo eficiente de eventos
- **Validación**: En tiempo real para mejorar UX

## 🎨 Personalización

### Colores
Modificar variables en `assets/scss/style.scss`:
```scss
$primary-gold: #c9aa71;
$dark-gold: #9e8b54;
$bg-dark: #0a0a0a;
// etc...
```

### Tipografía
Cambiar fuentes en las variables:
```scss
$font-primary: 'Inter', sans-serif;
$font-display: 'Cinzel', serif;
```

### Efectos Visuales
- **Partículas**: Ajustar cantidad en `main.js` (`particleCount`)
- **Animaciones**: Modificar duraciones en keyframes SCSS
- **Glassmorphism**: Ajustar `backdrop-filter` y opacidades

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 576px
- **Tablet**: 576px - 768px
- **Desktop**: > 768px

### Estrategia Mobile-First
1. Estilos base para móvil
2. Media queries progresivas
3. Modal fullscreen en móviles
4. Formulario inline en desktop

## 🔧 API y Endpoints

### POST `/index.php`
**Login**
```javascript
{
  action: 'login',
  username: 'string',
  password: 'string',
  use_unique_id: 'boolean'
}
```

**Registro**
```javascript
{
  action: 'register',
  reg_username: 'string',
  reg_email: 'string', // opcional
  reg_password: 'string',
  reg_confirm_password: 'string'
}
```

### Respuestas JSON
```javascript
// Éxito
{
  success: true,
  message: 'string',
  redirect?: 'string',
  unique_id?: 'string' // solo en registro
}

// Error
{
  success: false,
  message: 'string'
}
```

## 🚀 Optimizaciones de Rendimiento

- **CSS**: Compilación con autoprefixer
- **JavaScript**: ES6+ con fallbacks
- **Imágenes**: Formato optimizado y lazy loading
- **Animaciones**: Hardware acceleration con `transform3d`
- **Bundle**: CSS y JS minificados para producción

## 🐛 Solución de Problemas

### SCSS no compila
```bash
# Verificar instalación de SASS
npm list sass

# Reinstalar si es necesario
npm install sass --save-dev
```

### Problemas de responsive
- Verificar viewport meta tag
- Comprobar media queries en orden correcto
- Validar unidades de medida (rem, em, %)

### JavaScript no funciona
- Verificar consola del navegador
- Comprobar que Bootstrap esté cargado
- Validar que el DOM esté completamente cargado

## 📊 Métricas y Analytics

### Performance
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

### Compatibilidad
- **Navegadores**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Dispositivos**: iPhone 6+, Android 7+
- **Resoluciones**: 320px - 4K

## 🔐 Seguridad

- Validación tanto frontend como backend
- Sanitización de inputs
- Protección contra CSRF
- Headers de seguridad configurados
- Encriptación de contraseñas

## 📈 Roadmap v3.1

- [ ] Autenticación con redes sociales
- [ ] Sistema de temas personalizables
- [ ] PWA (Progressive Web App)
- [ ] Notificaciones push
- [ ] Modo offline básico

## 👥 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o reportar bugs:
- **Issues**: GitHub Issues
- **Email**: soporte@einherjerblitz.com
- **Discord**: [Servidor del juego]

---

**Einherjer Blitz 3.0** - Donde las leyendas cobran vida 🛡️⚔️

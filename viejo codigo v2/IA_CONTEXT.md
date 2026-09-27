# 🛡️ Contexto de Desarrollo - Einherjar Blitz 3.0

Este documento contiene todo el contexto técnico, arquitectura, base de datos y estructura del proyecto **Einherjar Blitz 3.0** para ayudar a los modelos de Inteligencia Artificial (IA) a comprender la base de código rápidamente y realizar modificaciones de forma consistente y estructurada.

---

## 📁 Estructura de Directorios y Archivos

El proyecto está organizado de manera modular bajo un servidor PHP en XAMPP. La distribución de los archivos y carpetas principales es la siguiente:

```text
Einherjar-Blitz/
├── index.php                 # Página de inicio, login y registro principal
├── dashboard.php             # Panel de control del usuario tras iniciar sesión
├── conversion.php            # Sistema de conversión rápida entre Llaves y Esferas
├── estadisticas.php          # Visualización de copas, victorias, derrotas e historial
├── wallet.php                # Interfaz de gestión financiera (esferas, llaves, terrenos)
├── transferir.php            # Formulario de transferencia de activos entre usuarios
├── logout.php                # Cierre de sesión seguro
├── sw.js                     # Service Worker para capacidades PWA
├── manifest.json             # Manifiesto de PWA (Mobile-friendly)
│
├── includes/                 # Componentes del core y utilidades
│   ├── Database.php          # Singleton de base de datos, SessionManager y AuthController
│   ├── Security.php          # Singleton de Seguridad (CSRF, Rate Limiting, CSP Headers)
│   └── version_helper.php    # Cache busting automático (?v=timestamp) para CSS/JS
│
├── api/                      # Endpoints y lógica del backend (API REST básica)
│   ├── google-auth.php       # Autenticación con Google API
│   ├── search_users.php      # Autocompletado de usuarios en transferencias
│   ├── update_profile.php    # Actualización de perfil (avatar y frase)
│   └── wallet/               # Sub-sistema financiero
│       ├── config.php        # Configuración de precios de terrenos
│       ├── invest.php        # Lógica de compra/inversión en terrenos
│       ├── portfolio.php     # Retorno de terrenos del usuario
│       ├── sell.php          # Lógica de venta de terrenos
│       ├── terrain_details.php# Información de rendimiento de terrenos
│       ├── transfer.php      # Ejecución de transferencia de dinero/activos
│       └── validate_user.php # Validación rápida de destinatarios de transferencias
│
├── assets/                   # Recursos estáticos editables
│   ├── scss/
│   │   └── style.scss        # Archivo fuente de estilos en SCSS
│   ├── css/
│   │   ├── main.css          # CSS compilado
│   │   └── dashboard.css     # CSS específico del dashboard
│   └── js/
│       ├── main.js           # Lógica del portal principal (index.php)
│       └── dashboard.js      # Lógica interactiva del dashboard
│
├── admin/                    # Panel administrativo
│   └── aquelarre_hot.php     # Lógica administrativa para el evento Aquelarre
│
├── aquelarre/                # Sub-sistema del evento "Aquelarre"
│   ├── index.php             # Página del evento
│   ├── config.php            # Ajustes locales
│   └── setup_db.php          # Script de base de datos local
│
├── AR-12/                    # Chatbot de IA integrado en el juego
│   ├── index.php             # Interfaz de chat con AR-12
│   ├── setup_db.php          # Inicialización de tablas para límites de chat
│   ├── api/                  # Endpoints de generación
│   └── assets/               # Estilos y JS del chat (chat.js, chat.css)
│
├── gacha/                    # Sistema de obtención de recompensas (Cofres)
│   ├── index.php             # Interfaz de apertura de cofres
│   ├── comprar-llaves.php    # Compra de llaves usando esferas
│   ├── ver-anuncios.php      # Obtención de llaves gratis viendo anuncios (simulado)
│   ├── process_gacha.php     # Algoritmo de probabilidades y apertura
│   ├── claim_rewards.php     # Reclamo de recompensas especiales
│   ├── generate_report.php   # Reporte de probabilidades y tiradas
│   └── process_cleanup.php   # Limpieza de datos temporales
│
├── game/                     # Juego de batallas local (Phaser)
│   ├── battle.php            # Página de batalla local cargada por usuario
│   ├── battle.html           # Estructura del canvas del juego
│   ├── phaser/               # Librerías del motor gráfico Phaser
│   └── js/                   # Controladores del combate
│
├── online/                   # Modo multijugador online
│   ├── index.php             # Sala de espera y emparejamiento (Queue)
│   ├── battle_online.php     # Lógica del combate multijugador activo
│   ├── battle_online.html    # Interfaz del cliente multijugador
│   ├── database_schema.sql   # Tablas requeridas para emparejamiento
│   ├── api/                  # Polling y sincronización de turnos en tiempo real
│   └── includes/             # Ayudantes multijugador
│
├── pase/                     # Sistema de Pase de Batalla
│   ├── index.php             # Vista de recompensas del Pase (Free vs Premium)
│   └── assets/               # Estilos y scripts específicos del pase
│
├── tienda/                   # Tienda del juego y Marketplace de usuarios
│   ├── tienda.php            # Interfaz principal de la tienda (esferas -> productos)
│   ├── marketplace.php       # Compra/Venta de recompensas entre usuarios
│   ├── tickets.php           # Visualización e impresión de comprobantes de compra
│   ├── tienda_content.php    # Lógica de renderizado y filtros
│   ├── tienda_historial.php  # Historial de compras del usuario
│   ├── generate_tickets_report.php # Reporte administrativo de facturación
│   └── *.sql                 # Esquemas e inicializadores del marketplace y tickets
│
├── terror/                   # Minijuego narrativo: "AM Game" (I Have No Mouth and I Must Scream)
│   ├── index.php             # Motor narrativo principal del juego
│   ├── install.php           # Auto-instalador de tablas para progreso del minijuego
│   ├── EMAIL_CONFIG.md       # Configuración SMTP para email del final verdadero
│   ├── START_HERE.md         # Instrucciones rápidas de configuración de AM
│   └── api/                  # Endpoints para procesar decisiones y finales
│
└── terror-umbra/             # Minijuego narrativo: "UMBRA" (Terror psicológico)
    ├── index.php             # Juego con distorsiones visuales según cordura
    ├── umbra_tables.sql      # Tablas requeridas para UMBRA
    └── api/                  # Endpoints de estado de cordura y finales
```

---

## 🗄️ Modelo de Base de Datos (einherjer_blitz)

La base de datos principal es relacional (MySQL/MariaDB). A continuación se resumen las tablas más importantes:

### 1. `usuarios` (Información del jugador y moneda)
* **`id`** (INT, PK, AI)
* **`username`** (VARCHAR(50), UNIQUE)
* **`email`** (VARCHAR(100), UNIQUE)
* **`password_hash`** (VARCHAR(255))
* **`unique_id`** (VARCHAR(16), UNIQUE) - Código único de recuperación/ingreso rápido.
* **`rango`** (VARCHAR(50), default: 'Recluta')
* **`copas`** (INT, default: 0)
* **`llaves`** (INT, default: 0) - Usadas en `gacha/` para abrir cofres.
* **`recompensas`** (INT, default: 0) - **Representa las "Esferas"**, la moneda principal del juego.
* **`nivel`** (INT, default: 1)
* **`experiencia`** (INT, default: 0)
* **`victorias`** / **`derrotas`** (INT, default: 0)
* **`perfil_imagen`** (VARCHAR(255), default: 'default.jpg')
* **`frase`** (VARCHAR(100), default: 'Listo para la batalla')
* **`is_active`** (TINYINT(1), default: 1)
* **`created_at`** (TIMESTAMP)
* **`last_login`** (DATETIME)

### 2. `user_sessions` (Sesiones activas seguras)
* Mapea un `session_token` único a un `user_id` con fecha de expiración (`expires_at`), IP y User Agent.

### 3. `recompensas_usuario` (Inventario del jugador obtenido en gacha)
* Guarda las recompensas desbloqueadas por usuario.
* **`tipo_recompensa`**: `terrain` (terrenos), `weapon` (armas), `invocation` (invocaciones), `special` (llaves especiales, etc.).
* Al venderse en el marketplace, el `tipo_recompensa` se concatena temporalmente a `terrain_vendido` o similar para invalidar su uso pero mantener historial.

### 4. `marketplace_listings` (Publicaciones de venta de jugadores)
* **`id`** (INT, PK)
* **`seller_id`** (FK -> `usuarios.id`)
* **`item_name`** (VARCHAR(150))
* **`reward_id`** (FK -> `recompensas_usuario.id`) - Enlace al inventario.
* **`price_llaves`** / **`price_esferas`** / **`price_cupones`** - Soporta múltiples monedas.
* **`is_premium_listing`** (TINYINT) - Destacado si el usuario es premium.
* **`is_active`** / **`is_sold`** (TINYINT)

### 5. `tienda_tickets` (Comprobantes y reclamaciones de compras/ventas)
* Generado al comprar en la tienda o transaccionar en el marketplace.
* **`ticket_type`**: `tienda`, `marketplace_compra`, `marketplace_venta`.
* **`claimed`** (TINYINT): Indica si el ticket ya fue procesado y su recompensa entregada.

### 6. `transacciones_einherjer` (Historial financiero/wallet)
* **`tipo`**: `minado`, `deposito`, `transferencia`, `retiro`, `compra`.
* **`cantidad`** (DECIMAL(10,2))
* **`destinatario`** (VARCHAR(50)) - Nombre del usuario que recibió los fondos en caso de transferencia.

### 7. `online_battles`, `online_queue`, `online_match_history` (Sistema Multijugador)
* Maneja la cola de emparejamiento por copas, los estados JSON del tablero (`battle_state`), los turnos y el historial multijugador.

---

## 🛠️ Arquitectura Core (includes/)

El backend se basa en el patrón Singleton y abstracciones limpias en PHP:

### 📡 Database.php (Singleton de Acceso y Sesión)
Proporciona tres clases principales:
1. **`Database`**:
   * Conexión segura usando **PDO** (`mysql:host=localhost;dbname=einherjer_blitz;charset=utf8mb4`).
   * Desactiva emulación de prepared statements y activa excepciones PDO.
   * Proporciona `$db->prepare($query)` para evitar inyecciones SQL.
   * Manejo de transacciones (`beginTransaction`, `commit`, `rollback`).
2. **`SessionManager`**:
   * Configura cookies HTTPOnly, bloquea sesiones locales (`session.cookie_secure` configurado en `0` para desarrollo XAMPP local).
   * Valida tokens en base de datos (`user_sessions`) para evitar hijacking.
   * Administra la caducidad y extensión automática de sesiones tras interacción.
3. **`AuthController`**:
   * Abstrae métodos de login (`login`, `loginWithUniqueId`), registro (genera `password_hash` con **ARGON2ID** y un `unique_id` hexadecimal) y reinicio de contraseña.

### 🛡️ Security.php (Singleton de Capa de Seguridad)
1. **CSRF**:
   * Generación automática de tokens guardados en sesión (`generateCSRFToken`).
   * Generación de inputs HTML ocultos (`csrfField`).
   * Validación mediante `validateCSRFToken($_POST['csrf_token'])`.
2. **Rate Limiting**:
   * Método `checkRateLimit($action, $maxAttempts, $windowSeconds)` para prevenir ataques de fuerza bruta en logins u operaciones financieras (almacenado en sesión).
3. **Headers CSP**:
   * Envía las cabeceras `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, y `Content-Security-Policy` restrictiva pero compatible con Bootstrap, Google Auth, y Fonts locales.

### 🔄 version_helper.php (Cache Busting)
* Proporciona la función `v($relativePath)`. Calcula el timestamp de última modificación del archivo usando `filemtime()`.
* **Uso típico en plantillas PHP**:
  ```php
  <link rel="stylesheet" href="assets/css/dashboard.css<?php echo v('assets/css/dashboard.css'); ?>">
  ```
  Esto devuelve algo como `assets/css/dashboard.css?v=1718501234`, forzando al navegador a recargar el archivo si ha cambiado, evitando problemas de caché agresiva.

---

## ⚙️ Reglas y Buenas Prácticas de Desarrollo

Al programar o ampliar **Einherjar Blitz 3.0**, debes seguir estas reglas estrictamente:

### 1. Consultas SQL
* **NUNCA** concatenes variables directamente en sentencias SQL.
* Usa siempre sentencias preparadas de PDO:
  ```php
  $db = Database::getInstance();
  $stmt = $db->prepare("SELECT * FROM usuarios WHERE id = ?");
  $stmt->execute([$userId]);
  $user = $stmt->fetch();
  ```

### 2. Estilos y CSS
* Los archivos CSS ubicados en `assets/css/` son auto-generados. No los edites directamente si provienen de SCSS.
* Edita `assets/scss/style.scss` y compila usando los comandos definidos en `package.json`:
  * `npm run build-css` (Compilación limpia)
  * `npm run watch-css` (Compilación automática en desarrollo)
  * `npm run build-css-compressed` (Producción)

### 3. Sesiones y Autenticación en PHP
* Al inicio de cada script de vista (PHP principal), importa la base de datos y valida la sesión:
  ```php
  require_once 'includes/Database.php';
  $auth = new AuthController();
  if (!$auth->isAuthenticated()) {
      header('Location: index.php');
      exit();
  }
  $userData = $auth->getUserData();
  ```

### 4. Seguridad en Acciones POST / Cambios de Estado
* En todas las peticiones POST (registro, transferencias de dinero, compras de terrenos, etc.), verifica el token CSRF obligatoriamente:
  ```php
  $security = Security::getInstance();
  if (!$security->validateCSRFToken($_POST['csrf_token'] ?? null)) {
      echo json_encode(['success' => false, 'message' => 'Token CSRF inválido']);
      exit();
  }
  ```

### 5. Estética Visual (WOW Factor)
* El proyecto utiliza un tema visual oscuro e inmersivo con acentos dorados (`#c9aa71` y `#9e8b54`) y tipografía estilizada (`Cinzel` y `Inter`).
* Si creas nuevas interfaces o componentes, mantén este diseño premium: sombras suaves de cristal (glassmorphism), bordes semi-transparentes de color dorado, y micro-animaciones en botones e inputs interactivos.

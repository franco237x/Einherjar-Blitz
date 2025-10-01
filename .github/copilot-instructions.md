# Einherjar Blitz - AI Coding Agent Instructions

## Project Overview
Einherjar Blitz is a web-based RPG game with a mobile-first authentication portal, turn-based battle system, gacha mechanics, virtual wallet/economy, and social features. Built with PHP backend and modern JavaScript/SCSS frontend.

## Architecture & Core Patterns

### Authentication Flow (Critical)
All protected pages follow this pattern at the top:
```php
require_once 'includes/Database.php';
$auth = new AuthController();
if (!$auth->isAuthenticated()) {
    header('Location: index.php');
    exit();
}
$userData = $auth->getUserData();
```

**Key classes in `includes/Database.php`:**
- `Database` - Singleton PDO connection with prepared statements
- `SessionManager` - Handles session creation, validation, and cleanup
- `AuthController` - Facade for login/register/logout operations

### Database Access Pattern
```php
$db = Database::getInstance();
$stmt = $db->prepare("SELECT ... WHERE id = ?");
$stmt->execute([$userId]);
```
- Always use prepared statements (never string interpolation)
- Transactions for multi-step operations: `beginTransaction()`, `commit()`, `rollback()`
- Session tokens stored in `user_sessions` table with expiration

### API Response Format
All API endpoints return JSON with this structure:
```json
{ "success": true/false, "message": "...", "data": {...} }
```
Always set `header('Content-Type: application/json')` before JSON responses.

## Key Subsystems

### 1. Character System (`characters/`)
- ES6 modules with character classes extending base character
- Each character has: stats, element type, rarity, abilities (normal/special/ultimate)
- Import pattern: `import { createCharacterById } from '../../characters/index.js'`
- Element effectiveness calculated in `getElementalEffectiveness()`

### 2. Battle System (`game/js/`)
- **BattleSystem.js** - Core turn-based logic, damage calculation
- **BattleUI.js** - DOM updates, animations, visual feedback  
- **BattleEffects.js** - Particle effects, screen shake, visual polish
- Mobile optimizations in `mobile-utils.js`
- Battle flow: `initializeBattle()` → `processPlayerAction()` → `processEnemyTurn()` → repeat

### 3. Gacha System (`gacha/`)
- Weighted random rewards in `process_gacha.php`
- Unique terrains tracked globally (only one user can own each)
- Rewards stored in `recompensas_usuario` table
- Cleanup/claim system with transaction safety

### 4. Wallet/Economy (`wallet.php`, `api/wallet/`)
- Terrain-based investment system (buy/sell shares)
- Portfolio tracking with real-time value calculation
- Transaction history in `wallet_transactions` table
- Config options: fee_trading, slippage_tolerance, auto_reinvest

## Development Workflows

### SCSS Compilation
```bash
npm run watch-all          # Watch all SCSS files
npm run build-compressed   # Production build (minified)
```
- Source: `assets/scss/` → Output: `assets/css/`
- Main files: `style.scss` (auth), `dashboard.scss` (dashboard), `battle-mobile.scss` (game)

### Database Conventions
- Main DB: `einherjer_blitz` (localhost, root, no password by default)
- Tables: `usuarios`, `user_sessions`, `terrenos`, `user_portfolio`, `recompensas_usuario`, etc.
- Password hashing: `password_hash()` / `password_verify()` (never store plain text)

### Mobile-First Responsive
- Breakpoints: Mobile (<576px), Tablet (576-768px), Desktop (>768px)
- Mobile modal pattern on `index.php` - fullscreen auth for touch devices
- CSS variables in `:root` for theming (`$primary-gold: #c9aa71`)

## Important Quirks & Gotchas

1. **Dual Authentication Methods**: Users can login with username/password OR username/unique_id (legacy support)
2. **Session Security**: Sessions auto-extend on validation, regenerate ID on first access
3. **Gacha Terrain Uniqueness**: Check `getAvailableTerrains()` before awarding terrain rewards
4. **API Endpoints**: Some in root (`index.php`, `dashboard.php`), others in `api/` subdirectory
5. **Legacy Code**: `viejo código/` folder contains old implementations - do not modify, reference only

## Testing & Debugging

### Local Environment
- XAMPP/Apache server on Windows
- Access via: `http://localhost/dashboard/Einherjar%20Blitz/`
- PHP 8.0+ required (uses type declarations, null coalescing)

### Common Error Patterns
- **401 errors**: Check `AuthController` session validation
- **Database errors**: Verify PDO connection in `Database::getInstance()`
- **SCSS not updating**: Run `npm run watch-all` and check file permissions

## File Structure Quick Reference
```
index.php              → Landing/auth page
dashboard.php          → Main game hub
includes/Database.php  → All auth/session/DB classes
characters/            → Character definitions (ES6 modules)
game/                  → Battle system (HTML + JS modules)
gacha/                 → Loot box/reward system
wallet.php + api/wallet/ → Economy features
assets/scss/           → SCSS source files
assets/js/             → Frontend logic (auth, dashboard, wallet)
```

## Code Style & Conventions

### PHP
- Class names: PascalCase (`AuthController`, `SessionManager`)
- Methods: camelCase (`getUserData()`, `isAuthenticated()`)
- Always validate user input before DB queries
- Use `try-catch` for database operations, log errors with `error_log()`

### JavaScript
- ES6+ modules with `import/export`
- Classes for major systems (`BattleSystem`, `EinherjerAuth`)
- Async/await for AJAX (fetch API, not jQuery)
- Event delegation for dynamic content

### CSS/SCSS
- BEM-like naming for complex components
- Variables for colors/spacing (defined in `:root`)
- Mobile-first media queries with min-width
- Hardware acceleration for animations (`transform: translate3d()`)

## Security Checklist
- ✅ Prepared statements for all SQL queries
- ✅ `htmlspecialchars()` for all user-generated content in HTML
- ✅ JSON input validation with type checking
- ✅ Session token validation on every protected page
- ✅ CSRF protection via session validation (expand if needed)
- ✅ Password reset tokens expire after use (see `password_reset_tokens` table)

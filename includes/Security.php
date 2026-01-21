<?php
/**
 * Security.php - Clase de seguridad para Einherjer Blitz
 * Maneja CSRF tokens, rate limiting y headers de seguridad
 */

class Security
{
    private static $instance = null;

    private function __construct()
    {
        // Iniciar sesión si no está iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public static function getInstance(): Security
    {
        if (self::$instance === null) {
            self::$instance = new Security();
        }
        return self::$instance;
    }

    /**
     * Genera un token CSRF único
     */
    public function generateCSRFToken(): string
    {
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_token'] = $token;
        $_SESSION['csrf_token_time'] = time();
        return $token;
    }

    /**
     * Obtiene el token CSRF actual o genera uno nuevo
     */
    public function getCSRFToken(): string
    {
        if (empty($_SESSION['csrf_token'])) {
            return $this->generateCSRFToken();
        }

        // Regenerar si tiene más de 1 hora
        if (time() - ($_SESSION['csrf_token_time'] ?? 0) > 3600) {
            return $this->generateCSRFToken();
        }

        return $_SESSION['csrf_token'];
    }

    /**
     * Valida un token CSRF
     */
    public function validateCSRFToken(?string $token): bool
    {
        if (empty($token) || empty($_SESSION['csrf_token'])) {
            return false;
        }
        return hash_equals($_SESSION['csrf_token'], $token);
    }

    /**
     * Rate limiting por sesión
     * @param string $action Nombre de la acción (ej: 'login')
     * @param int $maxAttempts Máximo de intentos permitidos
     * @param int $windowSeconds Ventana de tiempo en segundos
     */
    public function checkRateLimit(string $action, int $maxAttempts = 5, int $windowSeconds = 300): array
    {
        $key = "rate_limit_{$action}";
        $now = time();

        if (!isset($_SESSION[$key])) {
            $_SESSION[$key] = [
                'attempts' => 0,
                'first_attempt' => $now,
                'blocked_until' => 0
            ];
        }

        $data = &$_SESSION[$key];

        // Si está bloqueado, verificar si ya pasó el tiempo
        if ($data['blocked_until'] > $now) {
            $remaining = $data['blocked_until'] - $now;
            return [
                'allowed' => false,
                'remaining_seconds' => $remaining,
                'message' => "Demasiados intentos. Espera {$remaining} segundos."
            ];
        }

        // Si pasó la ventana de tiempo, resetear
        if ($now - $data['first_attempt'] > $windowSeconds) {
            $data['attempts'] = 0;
            $data['first_attempt'] = $now;
            $data['blocked_until'] = 0;
        }

        // Verificar si excede el límite
        if ($data['attempts'] >= $maxAttempts) {
            $data['blocked_until'] = $now + $windowSeconds;
            return [
                'allowed' => false,
                'remaining_seconds' => $windowSeconds,
                'message' => "Demasiados intentos. Espera {$windowSeconds} segundos."
            ];
        }

        return [
            'allowed' => true,
            'attempts_remaining' => $maxAttempts - $data['attempts'],
            'message' => ''
        ];
    }

    /**
     * Registra un intento de acción
     */
    public function recordAttempt(string $action): void
    {
        $key = "rate_limit_{$action}";
        if (isset($_SESSION[$key])) {
            $_SESSION[$key]['attempts']++;
        }
    }

    /**
     * Resetea el contador de intentos (llamar después de login exitoso)
     */
    public function resetAttempts(string $action): void
    {
        $key = "rate_limit_{$action}";
        unset($_SESSION[$key]);
    }

    /**
     * Obtiene intentos restantes para mostrar en UI
     */
    public function getAttemptsRemaining(string $action, int $maxAttempts = 5): int
    {
        $key = "rate_limit_{$action}";
        if (!isset($_SESSION[$key])) {
            return $maxAttempts;
        }
        return max(0, $maxAttempts - $_SESSION[$key]['attempts']);
    }

    /**
     * Establece headers de seguridad
     */
    public function setSecurityHeaders(): void
    {
        // Prevenir clickjacking
        header('X-Frame-Options: DENY');

        // Prevenir MIME sniffing
        header('X-Content-Type-Options: nosniff');

        // XSS Protection
        header('X-XSS-Protection: 1; mode=block');

        // Referrer Policy
        header('Referrer-Policy: strict-origin-when-cross-origin');

        // Content Security Policy
        $csp = "default-src 'self'; " .
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com https://accounts.google.com https://apis.google.com; " .
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com https://unpkg.com https://accounts.google.com; " .
            "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " .
            "img-src 'self' data: https:; " .
            "connect-src 'self' https://cdn.jsdelivr.net https://accounts.google.com; " .
            "frame-src https://accounts.google.com;";
        header("Content-Security-Policy: " . $csp);
    }

    /**
     * Genera campo hidden con token CSRF para formularios
     */
    public function csrfField(): string
    {
        $token = $this->getCSRFToken();
        return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars($token) . '">';
    }
}

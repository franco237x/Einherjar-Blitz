<?php
class Database {
    private static $instance = null;
    private $connection;
    
    private $host = 'localhost';
    private $username = 'root';
    private $password = '';
    private $database = 'einherjer_blitz';
    
    private function __construct() {
        try {
            $this->connection = new PDO(
                "mysql:host={$this->host};dbname={$this->database};charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function prepare($query) {
        return $this->connection->prepare($query);
    }
    
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }
    
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }
    
    public function commit() {
        return $this->connection->commit();
    }
    
    public function rollback() {
        return $this->connection->rollback();
    }
    
    // Prevenir clonación
    private function __clone() {}
    
    // Prevenir deserialización
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

class SessionManager {
    private static $instance = null;
    private $db;
    
    private function __construct() {
        $this->db = Database::getInstance();
        $this->initializeSession();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
      private function initializeSession() {
        // Solo configurar sesiones si no hay una sesión activa
        if (session_status() === PHP_SESSION_NONE) {
            // Configuración segura de sesiones
            ini_set('session.cookie_httponly', 1);
            ini_set('session.cookie_secure', 0); // Cambiar a 1 en HTTPS
            ini_set('session.use_only_cookies', 1);
            ini_set('session.cookie_lifetime', 0);
            
            session_start();
        }
        
        // Regenerar ID de sesión para prevenir ataques (solo si no se ha hecho ya)
        if (!isset($_SESSION['regenerated'])) {
            session_regenerate_id(true);
            $_SESSION['regenerated'] = true;
        }
    }
    
    public function createUserSession($userId, $username) {
        $sessionToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + (24 * 60 * 60)); // 24 horas
        
        try {
            $stmt = $this->db->prepare("
                INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $userId,
                $sessionToken,
                $expiresAt,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
            
            $_SESSION['user_id'] = $userId;
            $_SESSION['username'] = $username;
            $_SESSION['session_token'] = $sessionToken;
            $_SESSION['login_time'] = time();
            
            // Actualizar último login
            $updateStmt = $this->db->prepare("UPDATE usuarios SET last_login = NOW() WHERE id = ?");
            $updateStmt->execute([$userId]);
            
            return true;
        } catch (Exception $e) {
            error_log("Error creating session: " . $e->getMessage());
            return false;
        }
    }
    
    public function isValidSession() {
        if (!isset($_SESSION['user_id']) || !isset($_SESSION['session_token'])) {
            return false;
        }
        
        try {
            $stmt = $this->db->prepare("
                SELECT us.*, u.username, u.is_active 
                FROM user_sessions us 
                JOIN usuarios u ON us.user_id = u.id 
                WHERE us.session_token = ? AND us.expires_at > NOW() AND us.is_active = 1 AND u.is_active = 1
            ");
            
            $stmt->execute([$_SESSION['session_token']]);
            $session = $stmt->fetch();
            
            if ($session) {
                // Extender sesión si es válida
                $this->extendSession();
                return true;
            }
            
            return false;
        } catch (Exception $e) {
            error_log("Error validating session: " . $e->getMessage());
            return false;
        }
    }
    
    private function extendSession() {
        try {
            $newExpiry = date('Y-m-d H:i:s', time() + (24 * 60 * 60));
            $stmt = $this->db->prepare("UPDATE user_sessions SET expires_at = ? WHERE session_token = ?");
            $stmt->execute([$newExpiry, $_SESSION['session_token']]);
        } catch (Exception $e) {
            error_log("Error extending session: " . $e->getMessage());
        }
    }
    
    public function destroySession() {
        try {
            if (isset($_SESSION['session_token'])) {
                $stmt = $this->db->prepare("UPDATE user_sessions SET is_active = 0 WHERE session_token = ?");
                $stmt->execute([$_SESSION['session_token']]);
            }
        } catch (Exception $e) {
            error_log("Error destroying session: " . $e->getMessage());
        }
        
        session_destroy();
        setcookie(session_name(), '', time() - 3600, '/');
    }
    
    public function cleanExpiredSessions() {
        try {
            $stmt = $this->db->prepare("DELETE FROM user_sessions WHERE expires_at < NOW()");
            $stmt->execute();
        } catch (Exception $e) {
            error_log("Error cleaning expired sessions: " . $e->getMessage());
        }
    }
    
    public function getUserData() {
        if (!$this->isValidSession()) {
            return null;
        }
        
        try {
            $stmt = $this->db->prepare("
                SELECT id, username, email, rango, copas, llaves, recompensas, 
                       perfil_imagen, frase, nivel, experiencia, victorias, derrotas,
                       jefes_derrotados, megajefes_derrotados, horas_jugadas,
                       created_at, last_login
                FROM usuarios 
                WHERE id = ? AND is_active = 1
            ");
            
            $stmt->execute([$_SESSION['user_id']]);
            return $stmt->fetch();
        } catch (Exception $e) {
            error_log("Error getting user data: " . $e->getMessage());
            return null;
        }
    }
}

class AuthController {
    private $db;
    private $sessionManager;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->sessionManager = SessionManager::getInstance();
    }
    
    public function login($username, $password) {
        try {
            $stmt = $this->db->prepare("
                SELECT id, username, password_hash, is_active 
                FROM usuarios 
                WHERE username = ? AND is_active = 1
            ");
            
            $stmt->execute([$username]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($password, $user['password_hash'])) {
                return $this->sessionManager->createUserSession($user['id'], $user['username']);
            }
            
            return false;
        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            return false;
        }
    }
    
    public function loginWithUniqueId($username, $uniqueId) {
        try {
            $stmt = $this->db->prepare("
                SELECT id, username, is_active 
                FROM usuarios 
                WHERE username = ? AND unique_id = ? AND is_active = 1
            ");
            
            $stmt->execute([$username, $uniqueId]);
            $user = $stmt->fetch();
            
            if ($user) {
                return $this->sessionManager->createUserSession($user['id'], $user['username']);
            }
            
            return false;
        } catch (Exception $e) {
            error_log("Login with unique ID error: " . $e->getMessage());
            return false;
        }
    }
    
    public function register($username, $password, $email = null, $uniqueId = null) {
        try {
            // Verificar si el usuario ya existe
            $stmt = $this->db->prepare("SELECT id FROM usuarios WHERE username = ? OR email = ?");
            $stmt->execute([$username, $email]);
            
            if ($stmt->fetch()) {
                return ['success' => false, 'message' => 'El usuario o email ya existe'];
            }
            
            // Generar unique_id si no se proporciona
            if (!$uniqueId) {
                $uniqueId = strtoupper(bin2hex(random_bytes(8)));
            }
            
            $passwordHash = password_hash($password, PASSWORD_ARGON2ID);
            
            $stmt = $this->db->prepare("
                INSERT INTO usuarios (username, email, password_hash, unique_id) 
                VALUES (?, ?, ?, ?)
            ");
            
            $stmt->execute([$username, $email, $passwordHash, $uniqueId]);
            
            return [
                'success' => true, 
                'message' => 'Usuario registrado exitosamente',
                'unique_id' => $uniqueId
            ];
            
        } catch (Exception $e) {
            error_log("Registration error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error en el registro'];
        }
    }
    
    public function logout() {
        $this->sessionManager->destroySession();
        return true;
    }
    
    public function isAuthenticated() {
        return $this->sessionManager->isValidSession();
    }
    
    public function getUserData() {
        return $this->sessionManager->getUserData();
    }
}
?>

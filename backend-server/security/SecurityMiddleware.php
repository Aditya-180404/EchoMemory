<?php
/**
 * EchoMemory Security Middleware
 * Production-grade security protections
 */

require_once __DIR__ . '/../config/config.php';

class SecurityMiddleware {
    
    /**
     * Generate and store CSRF token
     */
    public static function generateCSRFToken() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    /**
     * Validate CSRF token
     */
    public static function validateCSRFToken($token) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }

    /**
     * Bot detection using Honeypot and Timing
     */
    public static function verifyHuman() {
        // 1. Honeypot check
        if (!empty($_POST[HONEYPOT_FIELD_NAME])) {
            self::logSecurityEvent('bot_detected_honeypot', ['ip' => $_SERVER['REMOTE_ADDR']]);
            return false;
        }

        // 2. Simple timing check (Forms shouldn't be submitted in < 1 second)
        if (isset($_POST['form_start_time'])) {
            $duration = time() - (int)$_POST['form_start_time'];
            if ($duration < 1) {
                self::logSecurityEvent('bot_detected_timing', ['ip' => $_SERVER['REMOTE_ADDR'], 'duration' => $duration]);
                return false;
            }
        }

        return true;
    }

    /**
     * Context-aware output encoding (Anti-XSS)
     */
    public static function encodeHTML($string) {
        return htmlspecialchars($string, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /**
     * Log security events to audit_logs
     */
    public static function logSecurityEvent($action, $details = []) {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("INSERT INTO audit_logs (action, ip_address, user_agent, details) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $action,
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            json_encode($details)
        ]);
    }

    /**
     * Sanitize input array recursively
     */
    public static function sanitizeInput($data) {
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $data[$key] = self::sanitizeInput($value);
            }
        } else {
            $data = trim($data);
            $data = strip_tags($data); // Basic sanitization, context-specific encoding preferred for output
        }
        return $data;
    }
}

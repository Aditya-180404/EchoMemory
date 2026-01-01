<?php
/**
 * EchoMemory Base API Controller
 * Enforces security, rate limiting, and standardizes JSON responses
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../security/SecurityMiddleware.php';
require_once __DIR__ . '/../security/RateLimiter.php';
require_once __DIR__ . '/../security/AuthHandler.php';

class ApiController {

    public function __construct($checkAuth = true) {
        // 1. Rate Limiting (Per Endpoint)
        $endpoint = $_SERVER['SCRIPT_NAME'];
        if (RateLimiter::isRateLimited($endpoint)) {
            $this->errorResponse("Too many requests. Please try again later.", 429);
        }

        // 2. Auth Check (if required)
        if ($checkAuth) {
            $token = AuthHandler::getBearerToken();
            if (!$token || !($payload = AuthHandler::validateToken($token))) {
                $this->errorResponse("Unauthorized access.", 401);
            }
            $GLOBALS['user_payload'] = $payload; // Store for controller use
        }

        // 3. Security Headers are already set in config.php
    }

    protected function successResponse($message, $data = [], $code = 200) {
        http_response_code($code);
        echo json_encode([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ]);
        exit;
    }

    protected function errorResponse($message, $code = 400, $details = []) {
        http_response_code($code);
        echo json_encode([
            'status' => 'error',
            'code' => $code,
            'message' => $message,
            'details' => $details
        ]);
        exit;
    }

    protected function getJsonInput() {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return [];
        }
        return SecurityMiddleware::sanitizeInput($data);
    }
}

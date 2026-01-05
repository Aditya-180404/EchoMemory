<?php
/**
 * EchoMemory Login API
 * Endpoint: POST /api/login.php
 */

require_once __DIR__ . '/ApiController.php';

class LoginController extends ApiController {

    public function __construct() {
        parent::__construct(false); // No auth required for login
    }

    public function handle() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->errorResponse("Method not allowed.", 405);
        }

        $input = $this->getJsonInput();
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';

        if (empty($email) || empty($password)) {
            $this->errorResponse("Email and password are required.");
        }

        $pdo = getDBConnection();

        // Fetch User
        $stmt = $pdo->prepare("SELECT id, uid, password_hash, full_name, language_code, is_active FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !AuthHandler::verifyPassword($password, $user['password_hash'])) {
            SecurityMiddleware::logSecurityEvent('login_failed', ['email' => $email]);
            $this->errorResponse("Invalid credentials.", 401);
        }

        if (!$user['is_active']) {
            $this->errorResponse("Account is suspended. Please contact support.", 403);
        }

        // Generate JWT
        $payload = [
            'uid' => $user['uid'],
            'email' => $email,
            'name' => $user['full_name'],
            'lang' => $user['language_code']
        ];
        $token = AuthHandler::generateToken($payload);

        // Update last login
        $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);

        SecurityMiddleware::logSecurityEvent('login_success', ['user_id' => $user['id']]);

        $this->successResponse("Login successful.", [
            'token' => $token,
            'user' => [
                'uid' => $user['uid'],
                'full_name' => $user['full_name'],
                'email' => $email,
                'lang' => $user['language_code']
            ]
        ]);
    }
}

$controller = new LoginController();
$controller->handle();

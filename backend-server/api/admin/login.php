<?php
/**
 * EchoMemory Admin Login API
 * Endpoint: POST /api/admin/login.php
 */

require_once __DIR__ . '/../ApiController.php';

class AdminLoginController extends ApiController {

    public function __construct() {
        parent::__construct(false); // No auth required for login
    }

    public function handle() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->errorResponse("Method not allowed.", 405);
        }

        $input = $this->getJsonInput();
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';

        if (empty($username) || empty($password)) {
            $this->errorResponse("Username and password are required.");
        }

        $pdo = getDBConnection();

        // Fetch Admin
        $stmt = $pdo->prepare("SELECT id, password_hash, role FROM admins WHERE username = ?");
        $stmt->execute([$username]);
        $admin = $stmt->fetch();

        if (!$admin || !AuthHandler::verifyPassword($password, $admin['password_hash'])) {
            SecurityMiddleware::logSecurityEvent('admin_login_failed', ['username' => $username]);
            $this->errorResponse("Invalid credentials.", 401);
        }

        // Generate Admin JWT
        $payload = [
            'uid' => 'admin_' . $admin['id'],
            'username' => $username,
            'role' => $admin['role'],
            'is_admin' => true
        ];
        $token = AuthHandler::generateToken($payload);

        // Update last login
        $stmt = $pdo->prepare("UPDATE admins SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$admin['id']]);

        SecurityMiddleware::logSecurityEvent('admin_login_success', ['admin_id' => $admin['id']]);

        $this->successResponse("Admin login successful.", [
            'token' => $token,
            'user' => [
                'username' => $username,
                'role' => $admin['role']
            ]
        ]);
    }
}

$controller = new AdminLoginController();
$controller->handle();

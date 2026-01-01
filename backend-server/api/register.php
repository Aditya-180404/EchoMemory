<?php
/**
 * EchoMemory Register API
 * Endpoint: POST /api/register.php
 */

require_once __DIR__ . '/ApiController.php';

class RegisterController extends ApiController {

    public function __construct() {
        parent::__construct(false); // No auth required for registration
    }

    public function handle() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->errorResponse("Method not allowed.", 405);
        }

        $input = $this->getJsonInput();
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        $fullName = $input['full_name'] ?? '';
        $language = $input['language_code'] ?? DEFAULT_LANGUAGE;

        // Validation
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->errorResponse("Invalid email address.");
        }
        if (strlen($password) < 8) {
            $this->errorResponse("Password must be at least 8 characters.");
        }
        if (empty($fullName)) {
            $this->errorResponse("Full name is required.");
        }
        if (!in_array($language, AVAILABLE_LANGUAGES)) {
            $language = DEFAULT_LANGUAGE;
        }

        $pdo = getDBConnection();

        // Check if user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $this->errorResponse("Email already registered.");
        }

        // Create User
        $uid = bin2hex(random_bytes(16));
        $passwordHash = AuthHandler::hashPassword($password);

        try {
            $stmt = $pdo->prepare("INSERT INTO users (uid, email, password_hash, full_name, language_code) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$uid, $email, $passwordHash, $fullName, $language]);

            $userId = $pdo->lastInsertId();
            SecurityMiddleware::logSecurityEvent('user_registered', ['user_id' => $userId, 'email' => $email]);

            $this->successResponse("Registration successful. You can now log in.", ['uid' => $uid], 201);
        } catch (\PDOException $e) {
            error_log("Registration Error: " . $e->getMessage());
            $this->errorResponse("Registration failed due to server error.", 500);
        }
    }
}

$controller = new RegisterController();
$controller->handle();

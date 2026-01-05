<?php
/**
 * EchoMemory Profile API
 * Endpoint: POST /api/profile.php
 */

require_once __DIR__ . '/ApiController.php';

class ProfileController extends ApiController {

    public function __construct() {
        parent::__construct(true); // Auth required
    }

    public function handle() {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $userUid = $GLOBALS['user_payload']['uid'];
            $pdo = getDBConnection();
            $stmt = $pdo->prepare("SELECT full_name, email FROM users WHERE uid = ?");
            $stmt->execute([$userUid]);
            $user = $stmt->fetch();

            if (!$user) {
                $this->errorResponse("User not found.", 404);
            }

            $this->successResponse("Profile retrieved.", [
                'user' => [
                    'uid' => $userUid,
                    'full_name' => $user['full_name'],
                    'email' => $user['email']
                ]
            ]);
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->errorResponse("Method not allowed.", 405);
        }

        $input = $this->getJsonInput();
        $fullName = $input['full_name'] ?? '';
        $email = $input['email'] ?? '';

        if (empty($fullName) || empty($email)) {
            $this->errorResponse("Name and Email are required.");
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->errorResponse("Invalid email format.");
        }

        $uid = $this->user['uid'];
        $pdo = getDBConnection();

        try {
            // Check if email is already taken by another user
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND uid != ?");
            $stmt->execute([$email, $uid]);
            if ($stmt->fetch()) {
                $this->errorResponse("Email is already in use by another account.");
            }

            // Update user
            $stmt = $pdo->prepare("UPDATE users SET full_name = ?, email = ? WHERE uid = ?");
            $stmt->execute([$fullName, $email, $uid]);

            SecurityMiddleware::logSecurityEvent('profile_updated', ['uid' => $uid]);

            $this->successResponse("Profile updated successfully.", [
                'user' => [
                    'uid' => $uid,
                    'full_name' => $fullName,
                    'email' => $email
                ]
            ]);
        } catch (\PDOException $e) {
            error_log("Profile Update Error: " . $e->getMessage());
            $this->errorResponse("Update failed due to server error.", 500);
        }
    }
}

$controller = new ProfileController();
$controller->handle();

<?php
/**
 * EchoMemory Chat History API
 * Endpoint: GET /api/history.php
 */

require_once __DIR__ . '/ApiController.php';

class HistoryController extends ApiController {

    public function __construct() {
        parent::__construct(true); // Auth required
    }

    public function handle() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->errorResponse("Method not allowed.", 405);
        }

        $userId = $GLOBALS['user_payload']['uid'];
        $pdo = getDBConnection();

        // Resolve internal user ID
        $userStmt = $pdo->prepare("SELECT id FROM users WHERE uid = ?");
        $userStmt->execute([$userId]);
        $internalId = $userStmt->fetchColumn();

        if (!$internalId) $this->errorResponse("User context invalid.");

        $stmt = $pdo->prepare("SELECT role, content, type, media_path, is_edited, created_at FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC");
        $stmt->execute([$internalId]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $this->successResponse("Success", $history);
    }
}

$controller = new HistoryController();
$controller->handle();

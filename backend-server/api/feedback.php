<?php
/**
 * EchoMemory Feedback API
 * Endpoint: POST /api/feedback.php
 */

require_once __DIR__ . '/ApiController.php';

class FeedbackController extends ApiController {

    public function __construct() {
        parent::__construct(true); // Auth optional? No, let's keep it for users.
    }

    public function handle() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->errorResponse("Method not allowed.", 405);
        }

        $input = $this->getJsonInput();
        $userId = $GLOBALS['user_id'];
        $rating = $input['rating'] ?? 0;
        $comment = $input['comment'] ?? '';

        if (!$rating) {
            $this->errorResponse("Rating is required.");
        }

        $pdo = getDBConnection();
        $stmt = $pdo->prepare("INSERT INTO feedback (user_id, rating, comment, created_at) VALUES (?, ?, ?, NOW())");
        
        try {
            $stmt->execute([$userId, $rating, $comment]);
            $this->successResponse("Feedback received. Thank you!");
        } catch (PDOException $e) {
            $this->errorResponse("Failed to save feedback.");
        }
    }
}

$controller = new FeedbackController();
$controller->handle();

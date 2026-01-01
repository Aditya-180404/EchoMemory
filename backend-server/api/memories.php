<?php
/**
 * EchoMemory Memories API
 * Endpoint: POST /api/memories.php (Create)
 * Endpoint: GET /api/memories.php (List/Search)
 */

require_once __DIR__ . '/ApiController.php';

class MemoriesController extends ApiController {

    public function __construct() {
        parent::__construct(true); // Auth required
    }

    public function handle() {
        $method = $_SERVER['REQUEST_METHOD'];

        switch ($method) {
            case 'POST':
                $this->createMemory();
                break;
            case 'GET':
                $this->listMemories();
                break;
            default:
                $this->errorResponse("Method not allowed.", 405);
        }
    }

    private function createMemory() {
        $input = $this->getJsonInput();
        $userUid = $GLOBALS['user_payload']['uid'];
        
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT id FROM users WHERE uid = ?");
        $stmt->execute([$userUid]);
        $user = $stmt->fetch();
        $userId = $user['id'];

        $sourceType = $input['source_type'] ?? 'voice';
        $narrative = $input['narrative_text'] ?? null;
        $audioPath = $input['audio_path'] ?? null;
        $mediaPath = $input['media_path'] ?? null;
        $memoryDate = $input['memory_date'] ?? date('Y-m-d');
        $language = $input['language_code'] ?? $GLOBALS['user_payload']['lang'];

        $uid = bin2hex(random_bytes(16));

        try {
            $stmt = $pdo->prepare("INSERT INTO memories (uid, user_id, language_code, source_type, narrative_text, audio_path, media_path, memory_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$uid, $userId, $language, $sourceType, $narrative, $audioPath, $mediaPath, $memoryDate]);

            $memoryId = $pdo->lastInsertId();

            // Handle Entities/Emotions if provided (AI processing usually does this, but manual support)
            if (!empty($input['entities'])) {
                foreach ($input['entities'] as $entity) {
                    $stmt = $pdo->prepare("INSERT INTO memory_entities (memory_id, entity_type, entity_name, relevance_score) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$memoryId, $entity['type'], $entity['name'], $entity['relevance'] ?? 1.000]);
                }
            }

            SecurityMiddleware::logSecurityEvent('memory_created', ['memory_id' => $memoryId, 'uid' => $uid]);

            $this->successResponse("Memory saved successfully.", ['uid' => $uid], 201);
        } catch (\PDOException $e) {
            error_log("Memory Creation Error: " . $e->getMessage());
            $this->errorResponse("Failed to save memory.");
        }
    }

    private function listMemories() {
        $userUid = $GLOBALS['user_payload']['uid'];
        $pdo = getDBConnection();

        $stmt = $pdo->prepare("SELECT m.*, u.full_name FROM memories m JOIN users u ON m.user_id = u.id WHERE u.uid = ? ORDER BY memory_date DESC");
        $stmt->execute([$userUid]);
        $memories = $stmt->fetchAll();

        // Standardize output
        foreach ($memories as &$m) {
            unset($m['user_id']); // Security: Don't expose internal IDs
            $m['confidence_indicator'] = $this->getConfidenceLabel($m['confidence_score']);
        }

        $this->successResponse("Memories retrieved.", $memories);
    }

    private function getConfidenceLabel($score) {
        if ($score >= 0.8) return 'High';
        if ($score >= 0.6) return 'Medium';
        return 'Low/In review';
    }
}

$controller = new MemoriesController();
$controller->handle();

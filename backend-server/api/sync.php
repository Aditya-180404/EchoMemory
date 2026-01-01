<?php
/**
 * EchoMemory Sync API
 * Handles batch processing of offline sync queue
 * Endpoint: POST /api/sync.php
 */

require_once __DIR__ . '/ApiController.php';

class SyncController extends ApiController {

    public function __construct() {
        parent::__construct(true); // Auth required
    }

    public function handle() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->errorResponse("Method not allowed.", 405);
        }

        $input = $this->getJsonInput();
        $batch = $input['batch'] ?? [];
        $deviceId = $input['device_id'] ?? 'unknown_device';

        if (empty($batch)) {
            $this->successResponse("Sync successful (empty batch).");
        }

        $pdo = getDBConnection();
        $userUid = $GLOBALS['user_payload']['uid'];
        $userId = $this->getUserIdFromUid($userUid);

        $results = [
            'total' => count($batch),
            'success' => 0,
            'failed' => 0,
            'errors' => []
        ];

        foreach ($batch as $item) {
            try {
                $payload = json_encode($item['data']);
                $type = $item['type'] ?? 'memory';

                $stmt = $pdo->prepare("INSERT INTO sync_queue (user_id, device_id, payload_type, payload, status) VALUES (?, ?, ?, ?, 'pending')");
                $stmt->execute([$userId, $deviceId, $type, $payload]);

                $results['success']++;
            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = $e->getMessage();
            }
        }

        SecurityMiddleware::logSecurityEvent('sync_completed', [
            'device_id' => $deviceId,
            'success_count' => $results['success']
        ]);

        $this->successResponse("Sync batch processed.", $results);
    }

    private function getUserIdFromUid($uid) {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT id FROM users WHERE uid = ?");
        $stmt->execute([$uid]);
        return $stmt->fetchColumn();
    }
}

$controller = new SyncController();
$controller->handle();

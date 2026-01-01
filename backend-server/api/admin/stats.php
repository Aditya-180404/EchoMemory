<?php
/**
 * EchoMemory Admin Stats API
 * Endpoint: GET /api/admin/stats.php
 */

require_once __DIR__ . '/../ApiController.php';

class AdminStatsController extends ApiController {

    public function __construct() {
        parent::__construct(true); // Auth required
        
        // Ensure user is admin
        if (!isset($GLOBALS['user_payload']['is_admin']) || $GLOBALS['user_payload']['is_admin'] !== true) {
            $this->errorResponse("Admin privileges required.", 403);
        }
    }

    public function handle() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            $this->errorResponse("Method not allowed.", 405);
        }

        $pdo = getDBConnection();

        try {
            // 1. Total Users
            $totalUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

            // 2. Processed Memories
            $totalMemories = $pdo->query("SELECT COUNT(*) FROM memories WHERE narrative_text IS NOT NULL")->fetchColumn();

            // 3. Average Confidence
            $avgConf = $pdo->query("SELECT AVG(confidence_score) FROM memories WHERE narrative_text IS NOT NULL")->fetchColumn();

            // 4. Security Alerts (Failed logins or rate limit hits)
            $alerts = $pdo->query("SELECT COUNT(*) FROM audit_logs WHERE action LIKE '%failed%' OR action LIKE '%bot_detected%'")->fetchColumn();

            // 5. Recent Audits
            $stmt = $pdo->prepare("SELECT action, ip_address, entity_type, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10");
            $stmt->execute();
            $recentAudits = $stmt->fetchAll();

            $this->successResponse("Stats retrieved.", [
                'total_users' => $totalUsers,
                'total_memories' => $totalMemories,
                'avg_confidence' => round($avgConf, 2),
                'security_alerts' => $alerts,
                'recent_audits' => $recentAudits
            ]);
        } catch (\PDOException $e) {
            $this->errorResponse("Failed to fetch statistics.");
        }
    }
}

$controller = new AdminStatsController();
$controller->handle();

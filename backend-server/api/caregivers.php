<?php
/**
 * EchoMemory Caregiver API
 * Endpoint: POST /api/caregivers.php (Request access)
 * Endpoint: GET /api/caregivers.php (List patients/caregivers)
 */

require_once __DIR__ . '/ApiController.php';

class CaregiversController extends ApiController {

    public function __construct() {
        parent::__construct(true); // Auth required
    }

    public function handle() {
        $method = $_SERVER['REQUEST_METHOD'];

        switch ($method) {
            case 'POST':
                $this->requestAccess();
                break;
            case 'GET':
                $this->listConnections();
                break;
            default:
                $this->errorResponse("Method not allowed.", 405);
        }
    }

    private function requestAccess() {
        $input = $this->getJsonInput();
        $patientEmail = $input['patient_email'] ?? '';
        $caregiverUserId = $this->getUserIdFromUid($GLOBALS['user_payload']['uid']);

        if (empty($patientEmail)) {
            $this->errorResponse("Patient email is required.");
        }

        $pdo = getDBConnection();

        // Find patient
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $stmt->execute([$patientEmail, $caregiverUserId]);
        $patient = $stmt->fetch();

        if (!$patient) {
            $this->errorResponse("Patient not found.");
        }

        $patientId = $patient['id'];

        try {
            $stmt = $pdo->prepare("INSERT INTO caregivers (user_id, patient_id, access_level) VALUES (?, ?, 'read_only') ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP");
            $stmt->execute([$caregiverUserId, $patientId]);

            SecurityMiddleware::logSecurityEvent('caregiver_request', [
                'caregiver_id' => $caregiverUserId,
                'patient_id' => $patientId
            ]);

            $this->successResponse("Access request sent. Patient must approve in their panel.");
        } catch (\PDOException $e) {
            $this->errorResponse("Request failed.");
        }
    }

    private function listConnections() {
        $userId = $this->getUserIdFromUid($GLOBALS['user_payload']['uid']);
        $pdo = getDBConnection();

        // List patients I care for
        $stmt = $pdo->prepare("SELECT u.full_name, u.email, c.access_level, c.is_verified FROM caregivers c JOIN users u ON c.patient_id = u.id WHERE c.user_id = ?");
        $stmt->execute([$userId]);
        $patients = $stmt->fetchAll();

        // List caregivers who care for me
        $stmt = $pdo->prepare("SELECT u.full_name, u.email, c.access_level, c.is_verified FROM caregivers c JOIN users u ON c.user_id = u.id WHERE c.patient_id = ?");
        $stmt->execute([$userId]);
        $caregivers = $stmt->fetchAll();

        $this->successResponse("Connections retrieved.", [
            'patients' => $patients,
            'my_caregivers' => $caregivers
        ]);
    }

    private function getUserIdFromUid($uid) {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT id FROM users WHERE uid = ?");
        $stmt->execute([$uid]);
        return $stmt->fetchColumn();
    }
}

$controller = new CaregiversController();
$controller->handle();

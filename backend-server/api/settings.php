<?php
/**
 * EchoMemory UI Settings API
 * Allows synchronization of accessibility preferences between clients and caregivers
 */

require_once __DIR__ . '/ApiController.php';

class SettingsController extends ApiController {

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $user_id = $GLOBALS['user_payload']['id'];

        switch ($method) {
            case 'GET':
                $this->getSettings($user_id);
                break;
            case 'POST':
                $this->updateSettings($user_id);
                break;
            default:
                $this->errorResponse("Method not allowed", 405);
        }
    }

    private function getSettings($user_id) {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT ui_settings FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();

        $settings = $user['ui_settings'] ? json_decode($user['ui_settings'], true) : $this->getDefaultSettings();
        $this->successResponse("Settings retrieved", $settings);
    }

    private function updateSettings($user_id) {
        $data = $this->getJsonInput();
        if (empty($data)) {
            $this->errorResponse("Invalid settings payload");
        }

        $pdo = getDBConnection();
        $stmt = $pdo->prepare("UPDATE users SET ui_settings = ? WHERE id = ?");
        $stmt->execute([json_encode($data), $user_id]);

        $this->successResponse("Settings synchronized", $data);
    }

    private function getDefaultSettings() {
        return [
            'theme' => 'light',
            'font_size' => 'large',
            'voice_only' => false,
            'last_updated' => time()
        ];
    }
}

$controller = new SettingsController();
$controller->handleRequest();

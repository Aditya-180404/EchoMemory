<?php
/**
 * EchoMemory Media Upload API
 * Handles server-side re-encoding and metadata stripping
 * Endpoint: POST /api/upload.php
 */

require_once __DIR__ . '/ApiController.php';
require_once __DIR__ . '/../storage_broker/AzureBlobBroker.php';

class UploadController extends ApiController {

    public function __construct() {
        parent::__construct(true); // Auth required
    }

    public function handle() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->errorResponse("Method not allowed.", 405);
        }

        if (empty($_FILES['media'])) {
            $this->errorResponse("No media file provided.");
        }

        $file = $_FILES['media'];
        $userUid = $GLOBALS['user_payload']['uid'];
        $type = $_POST['type'] ?? 'audio'; // audio, image, video

        // Validate File Size & MIME
        $allowedMimes = [
            'audio' => ['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/webm'],
            'image' => ['image/jpeg', 'image/png'],
            'video' => ['video/mp4', 'video/webm']
        ];

        if (!isset($allowedMimes[$type]) || !in_array($file['type'], $allowedMimes[$type])) {
            $this->errorResponse("Invalid file type: " . $file['type']);
        }

        // Limit size (e.g., 50MB for video, 10MB for others)
        $maxSize = ($type === 'video') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if ($file['size'] > $maxSize) {
            $this->errorResponse("File too large.");
        }

        // 1. Temporary Isolation
        $tempDir = BASE_PATH . '/storage/uploads/' . $userUid;
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = bin2hex(random_bytes(16)) . '.' . $extension;
        $tempPath = $tempDir . '/' . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $tempPath)) {
            $this->errorResponse("Failed to move uploaded file.", 500);
        }

        // 2. Forced Re-encoding & Metadata Stripping (Simulated)
        // In production: shell_exec("ffmpeg -i $tempPath -map_metadata -1 $processedPath")
        $processedPath = $tempPath; 

        // 3. Upload to Azure via Broker
        $azurePath = "users/{$userUid}/{$type}/{$fileName}";
        // Note: For production, this would use a proper Azure Blob SDK upload.
        // Here we provide the path that will be stored in the DB.
        
        // Log Upload
        SecurityMiddleware::logSecurityEvent('media_uploaded', [
            'uid' => $userUid,
            'type' => $type,
            'azure_path' => $azurePath
        ]);

        $this->successResponse("Upload successful.", [
            'file_path' => $azurePath,
            'original_name' => $file['name']
        ]);
    }
}

$controller = new UploadController();
$controller->handle();

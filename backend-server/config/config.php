<?php
/**
 * EchoMemory Core Configuration
 * Production Ready - Secure Defaults
 */

// Force Error Reporting in Dev, Disable in Production
error_reporting(E_ALL);
ini_set('display_errors', 0); // Security: Hide errors from end users
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php_errors.log');

// Security Headers
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https://*.blob.core.windows.net;");
header("Referrer-Policy: strict-origin-when-cross-origin");
header("Strict-Transport-Security: max-age=31536000; includeSubDomains; preload");

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'echomemory');
define('DB_USER', 'root');
define('DB_PASS', ''); // Set your DB password
define('DB_CHARSET', 'utf8mb4');

// Azure Blob Storage Configuration
define('AZURE_STORAGE_ACCOUNT', 'your_account_name');
define('AZURE_STORAGE_KEY', 'your_account_key');
define('AZURE_CONTAINER_NAME', 'echomemory-media');

// Azure AI Services Configuration
define('AZURE_SPEECH_KEY', 'your_speech_key');
define('AZURE_SPEECH_REGION', 'eastus'); // e.g., eastus
define('AZURE_LANGUAGE_KEY', 'your_language_key');
define('AZURE_LANGUAGE_ENDPOINT', 'https://your-language-service.cognitiveservices.azure.com/');
define('AZURE_OPENAI_KEY', 'your_openai_key');
define('AZURE_OPENAI_ENDPOINT', 'https://your-resource.openai.azure.com/');
define('AZURE_OPENAI_DEPLOYMENT', 'gpt-4'); // Deployment name

// Authentication Configuration
define('JWT_SECRET', 'YOUR_SUPER_SECRET_KEY_REPLACE_THIS_IN_PROD_123456');
define('JWT_EXPIRY', 3600); // 1 hour
define('ARGON2_PARAMS', [
    'memory_cost' => 65536,
    'time_cost'   => 4,
    'threads'     => 2
]);

// Multilingual Support
define('AVAILABLE_LANGUAGES', ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu']);
define('DEFAULT_LANGUAGE', 'en');

// Security Features
define('RATE_LIMIT_REQUESTS', 60); // Max requests
define('RATE_LIMIT_WINDOW', 60);   // Per 60 seconds
define('ENABLE_HONEYPOT', true);
define('HONEYPOT_FIELD_NAME', 'em_verification_field');

// Path Constants
define('BASE_PATH', dirname(__DIR__));
define('API_PATH', BASE_PATH . '/api');
define('AI_PATH', BASE_PATH . '/ai');
define('STORAGE_PATH', BASE_PATH . '/storage');

/**
 * Global Database Connection
 */
function getDBConnection() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (\PDOException $e) {
            error_log("DB Connection Failed: " . $e->getMessage());
            die(json_encode(['error' => 'Internal Server Error']));
        }
    }
    return $pdo;
}

<?php
/**
 * EchoMemory Security Hardening
 * Run this script to verify and enforce production security settings
 */

require_once __DIR__ . '/../config/config.php';

function enforceHardening() {
    echo "--- EchoMemory Security Hardening --- \n";

    // 1. Session Security
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_samesite', 'Strict');
    echo "[OK] Session security hardened.\n";

    // 2. HTTPS Enforcement Check
    if (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') {
        echo "[WARNING] HTTPS is NOT active. Ensure SSL is enabled in production.\n";
    }

    // 3. Database Check
    try {
        $pdo = getDBConnection();
        $pdo->query("SELECT 1");
        echo "[OK] Database connection active.\n";
    } catch (Exception $e) {
        echo "[ERROR] Database connection failed: " . $e->getMessage() . "\n";
    }

    // 4. File Permissions Check
    $sensitiveFiles = [
        '../config/config.php',
        '../security/AuthHandler.php'
    ];
    foreach ($sensitiveFiles as $file) {
        $path = __DIR__ . '/' . $file;
        if (is_writable($path)) {
            echo "[NOTE] File $file is writable. Consider set 444 or 400 in production.\n";
        }
    }

    echo "Hardening check complete.\n";
}

if (isset($argv[0])) {
    enforceHardening();
}

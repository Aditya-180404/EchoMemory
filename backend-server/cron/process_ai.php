<?php
/**
 * EchoMemory AI Processing Cron
 * Picks up pending memories and triggers Python AI Pipeline
 */

require_once __DIR__ . '/../config/config.php';

$pdo = getDBConnection();

// Fetch memories that haven't been processed by AI yet
// (narrative_text is NULL and source is not manual)
$stmt = $pdo->prepare("SELECT id FROM memories WHERE narrative_text IS NULL AND source_type != 'manual' LIMIT 10");
$stmt->execute();
$pending = $stmt->fetchAll();

foreach ($pending as $memory) {
    $memoryId = $memory['id'];
    echo "Processing Memory ID: $memoryId...\n";
    
    // Trigger Python script
    $pythonPath = "python"; // Adjust to full path if needed
    $scriptPath = AI_PATH . "/main.py";
    
    $command = "$pythonPath $scriptPath $memoryId 2>&1";
    $output = shell_exec($command);
    
    echo "Output: $output\n";
    
    // Log in audit_logs
    $stmtLog = $pdo->prepare("INSERT INTO audit_logs (action, details) VALUES (?, ?)");
    $stmtLog->execute(['ai_processed', json_encode(['memory_id' => $memoryId, 'output' => $output])]);
}

echo "AI processing cycle complete.\n";

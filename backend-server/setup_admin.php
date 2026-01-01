<?php
require_once __DIR__ . '/config/config.php';

$pdo = getDBConnection();
$username = 'admin';
$password_hash = '$argon2id$v=19$m=65536,t=4,p=2$UTFjVnN0TEJIM1BOZmMwZg$EqzTZIag1YUxpRkoxhSJghryzbAUVqnZUE5xP26vJHE';
$role = 'superadmin';

try {
    $stmt = $pdo->prepare("INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)");
    $stmt->execute([$username, $password_hash, $role]);
    echo "Administrative anchor synchronized successfully.\n";
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        echo "Administrative identity already exists in the neural matrix.\n";
    } else {
        echo "Synchronization failed: " . $e->getMessage() . "\n";
    }
}
?>

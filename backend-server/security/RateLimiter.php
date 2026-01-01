<?php
/**
 * EchoMemory Rate Limiter
 * Per-IP and Per-Endpoint sliding window rate limiting (No Redis)
 */

require_once __DIR__ . '/../config/config.php';

class RateLimiter {

    /**
     * Check if the request should be rate limited
     * 
     * @param string $endpoint The API endpoint being accessed
     * @return bool True if limited, False if allowed
     */
    public static function isRateLimited($endpoint) {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $now = time();
        $pdo = getDBConnection();

        try {
            // 1. Get current hits for this IP and endpoint
            $stmt = $pdo->prepare("SELECT hits, first_hit, last_hit FROM rate_limits WHERE ip_address = ? AND endpoint = ?");
            $stmt->execute([$ip, $endpoint]);
            $row = $stmt->fetch();

            if ($row) {
                $hits = $row['hits'];
                $firstHit = $row['first_hit'];

                // Check if current window has expired
                if (($now - $firstHit) > RATE_LIMIT_WINDOW) {
                    // Window expired, reset counter
                    $stmt = $pdo->prepare("UPDATE rate_limits SET hits = 1, first_hit = ?, last_hit = ? WHERE ip_address = ? AND endpoint = ?");
                    $stmt->execute([$now, $now, $ip, $endpoint]);
                    return false;
                } else {
                    // Window active, check hit count
                    if ($hits >= RATE_LIMIT_REQUESTS) {
                        return true; // Limit exceeded
                    } else {
                        // Increment hits
                        $stmt = $pdo->prepare("UPDATE rate_limits SET hits = hits + 1, last_hit = ? WHERE ip_address = ? AND endpoint = ?");
                        $stmt->execute([$now, $ip, $endpoint]);
                        return false;
                    }
                }
            } else {
                // New entry
                $stmt = $pdo->prepare("INSERT INTO rate_limits (ip_address, endpoint, hits, first_hit, last_hit) VALUES (?, ?, 1, ?, ?)");
                $stmt->execute([$ip, $endpoint, $now, $now]);
                return false;
            }
        } catch (\PDOException $e) {
            error_log("Rate Limiter Error: " . $e->getMessage());
            return false; // Fail open in case of DB error (optional, could fail closed)
        }
    }

    /**
     * Cleanup old rate limit entries (to be called by cron)
     */
    public static function cleanup() {
        $pdo = getDBConnection();
        $expiryTime = time() - RATE_LIMIT_WINDOW;
        $stmt = $pdo->prepare("DELETE FROM rate_limits WHERE last_hit < ?");
        $stmt->execute([$expiryTime]);
    }
}

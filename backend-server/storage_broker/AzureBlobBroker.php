<?php
/**
 * EchoMemory Azure Blob Storage Broker
 * Handles SAS token generation and media metadata stripping
 */

require_once __DIR__ . '/../config/config.php';

class AzureBlobBroker {

    /**
     * Generate a Shared Access Signature (SAS) Token for a blob
     * 
     * @param string $blobName The path inside the container (e.g., users/{uid}/audio/file.wav)
     * @param string $permissions 'r' for read, 'w' for write, 'c' for create
     * @param int $expirySeconds Duration in seconds
     * @return string The signed SAS token
     */
    public static function generateSasToken($blobName, $permissions = 'w', $expirySeconds = 3600) {
        $accountName = AZURE_STORAGE_ACCOUNT;
        $accountKey = AZURE_STORAGE_KEY;
        $container = AZURE_CONTAINER_NAME;
        
        $startTime = gmdate("Y-m-d\TH:i:s\Z", time() - 300); // 5 mins ago for clock skew
        $expiryTime = gmdate("Y-m-d\TH:i:s\Z", time() + $expirySeconds);
        
        $signedPermissions = $permissions;
        $signedStart = $startTime;
        $signedExpiry = $expiryTime;
        $signedResource = 'b'; // blob
        $signedIdentifier = '';
        $signedIP = '';
        $signedProtocol = 'https';
        $signedVersion = '2020-02-10'; // Azure API version
        
        // Canonicalized Resource
        $canonicalizedResource = "/blob/{$accountName}/{$container}/{$blobName}";
        
        // String to Sign
        $stringToSign = $signedPermissions . "\n" .
                        $signedStart . "\n" .
                        $signedExpiry . "\n" .
                        $canonicalizedResource . "\n" .
                        $signedIdentifier . "\n" .
                        $signedIP . "\n" .
                        $signedProtocol . "\n" .
                        $signedVersion . "\n" .
                        "" . "\n" . // signedSnapshotTime
                        "" . "\n" . // signedEncryptionScope
                        "" . "\n" . // rscc
                        "" . "\n" . // rscd
                        "" . "\n" . // rsce
                        "" . "\n" . // rscl
                        "";   // rsct

        $signature = base64_encode(hash_hmac('sha256', $stringToSign, base64_decode($accountKey), true));
        
        $sasToken = "st=" . urlencode($signedStart) . "&" .
                    "se=" . urlencode($signedExpiry) . "&" .
                    "sp=" . $signedPermissions . "&" .
                    "sv=" . $signedVersion . "&" .
                    "sr=" . $signedResource . "&" .
                    "spr=" . $signedProtocol . "&" .
                    "sig=" . urlencode($signature);
        
        return $sasToken;
    }

    /**
     * Strip metadata from image/video (Placeholder for server-side re-encoding logic)
     * In a real system, this would call ffmpeg or GD/ImageMagick
     */
    public static function stripMetadata($filePath) {
        // Implementation would use shell_exec('ffmpeg -i input -map_metadata -1 output')
        // For now, we simulate the path returning
        return $filePath;
    }
}

-- EchoMemory Database Schema
-- Production Ready, Multilingual Support, Security Audit Logging

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Set collation to utf8mb4 for full multilingual support
/*!40101 SET NAMES utf8mb4 */;

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uid` VARCHAR(64) UNIQUE NOT NULL, -- Public identifier
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL, -- Argon2id
  `full_name` VARCHAR(255) NOT NULL,
  `language_code` VARCHAR(10) DEFAULT 'en',
  `mfa_secret` VARCHAR(100) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `last_login` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`email`),
  INDEX (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Caregivers Table
CREATE TABLE IF NOT EXISTS `caregivers` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `patient_id` BIGINT UNSIGNED NOT NULL,
  `access_level` ENUM('read_only', 'full_consent') DEFAULT 'read_only',
  `is_verified` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `caregiver_patient` (`user_id`, `patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Memories Table
CREATE TABLE IF NOT EXISTS `memories` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uid` VARCHAR(64) UNIQUE NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `language_code` VARCHAR(10) NOT NULL,
  `source_type` ENUM('voice', 'image', 'video', 'manual') NOT NULL,
  `narrative_text` TEXT DEFAULT NULL,
  `audio_path` VARCHAR(512) DEFAULT NULL, -- Azure Blob Path
  `media_path` VARCHAR(512) DEFAULT NULL, -- Azure Blob Path (Image/Video)
  `confidence_score` DECIMAL(4,3) DEFAULT 0.000,
  `is_corrected` TINYINT(1) DEFAULT 0,
  `correction_log` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `memory_date` DATE NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX (`user_id`),
  INDEX (`memory_date`),
  INDEX (`confidence_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Memory Entities (People, Places, Events)
CREATE TABLE IF NOT EXISTS `memory_entities` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `memory_id` BIGINT UNSIGNED NOT NULL,
  `entity_type` ENUM('person', 'place', 'event', 'object') NOT NULL,
  `entity_name` VARCHAR(255) NOT NULL,
  `relevance_score` DECIMAL(4,3) DEFAULT 0.000,
  FOREIGN KEY (`memory_id`) REFERENCES `memories`(`id`) ON DELETE CASCADE,
  INDEX (`entity_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Memory Emotions
CREATE TABLE IF NOT EXISTS `memory_emotions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `memory_id` BIGINT UNSIGNED NOT NULL,
  `emotion_label` VARCHAR(50) NOT NULL,
  `intensity` DECIMAL(4,3) NOT NULL,
  FOREIGN KEY (`memory_id`) REFERENCES `memories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Memory Locations (Metadata)
CREATE TABLE IF NOT EXISTS `memory_locations` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `memory_id` BIGINT UNSIGNED NOT NULL,
  `latitude` DECIMAL(10, 8) DEFAULT NULL,
  `longitude` DECIMAL(11, 8) DEFAULT NULL,
  `address_manual` TEXT DEFAULT NULL,
  FOREIGN KEY (`memory_id`) REFERENCES `memories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sync Queue (Offline Management)
CREATE TABLE IF NOT EXISTS `sync_queue` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `device_id` VARCHAR(255) NOT NULL,
  `payload_type` VARCHAR(50) NOT NULL,
  `payload` LONGTEXT NOT NULL, -- JSON payload from mobile
  `status` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  `retry_count` INT DEFAULT 0,
  `error_log` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs (Security & Compliance)
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) DEFAULT NULL,
  `entity_id` BIGINT UNSIGNED DEFAULT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` TEXT NOT NULL,
  `details` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (`user_id`),
  INDEX (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate Limiting Table (No Redis)
CREATE TABLE IF NOT EXISTS `rate_limits` (
  `ip_address` VARCHAR(45) NOT NULL,
  `endpoint` VARCHAR(255) NOT NULL,
  `hits` INT DEFAULT 1,
  `first_hit` INT UNSIGNED NOT NULL,
  `last_hit` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`ip_address`, `endpoint`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('superadmin', 'auditor') DEFAULT 'auditor',
  `last_login` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;

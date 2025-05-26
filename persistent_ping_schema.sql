-- DDL for Persistent Ping Functionality

-- 1. Create Persistent_Pings Table
CREATE TABLE IF NOT EXISTS `Persistent_Pings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `ip_address` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL COMMENT 'e.g., running, stopped',
  `started_at` DATETIME NULL DEFAULT NULL,
  `stopped_at` DATETIME NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_ip` (`user_id`, `ip_address`),
  CONSTRAINT `fk_persistent_pings_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Modify Report_Results Table

-- Add is_persistent_ping column
ALTER TABLE `Report_Results`
ADD COLUMN `is_persistent_ping` BOOLEAN DEFAULT FALSE AFTER `output`; -- Assuming 'output' is an existing column, place it logically

-- Add persistent_ping_id column
ALTER TABLE `Report_Results`
ADD COLUMN `persistent_ping_id` INT NULL DEFAULT NULL AFTER `is_persistent_ping`,
ADD CONSTRAINT `fk_report_results_persistent_ping`
  FOREIGN KEY (`persistent_ping_id`)
  REFERENCES `Persistent_Pings` (`id`)
  ON DELETE SET NULL -- If a persistent ping entry is deleted, keep the results but unlink
  ON UPDATE CASCADE;

-- Add user_id column to Report_Results (if it doesn't exist or needs modification)
-- Assuming user_id might not exist or needs to be consistently nullable and FK.
-- If user_id already exists with compatible properties, this might only add FK or do nothing.
-- For safety, this statement checks if the column exists before adding.
-- MySQL doesn't directly support IF NOT EXISTS for ADD COLUMN in older versions easily in a single statement for all cases.
-- This is a common approach, but might need to be run interactively or checked first.
-- A more robust script might use information_schema to check. For this context, providing the direct ALTER.

-- First, ensure report_id can be NULL (as per requirement)
ALTER TABLE `Report_Results`
MODIFY COLUMN `report_id` INT NULL DEFAULT NULL;

-- Then, attempt to add user_id and its foreign key.
-- If user_id already exists, this specific ADD COLUMN will fail.
-- If it exists but without FK, the ADD CONSTRAINT might be what's needed.
-- The prompt implies user_id might need to be added OR ensured it's nullable and an FK.
-- Let's assume it might not exist:
ALTER TABLE `Report_Results`
ADD COLUMN `user_id` INT NULL DEFAULT NULL AFTER `persistent_ping_id`, -- Place it logically
ADD CONSTRAINT `fk_report_results_user`
  FOREIGN KEY (`user_id`)
  REFERENCES `users` (`id`)
  ON DELETE SET NULL -- Keep results if user is deleted, but unlink user
  ON UPDATE CASCADE;

-- Note: If `user_id` column *already exists* in `Report_Results` and you just need to ensure it's nullable
-- and has the foreign key, the statements would be:
-- ALTER TABLE `Report_Results` MODIFY COLUMN `user_id` INT NULL DEFAULT NULL;
-- ALTER TABLE `Report_Results` ADD CONSTRAINT `fk_report_results_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE; (Only if FK doesn't exist)

-- Final check on report_id nullability (repeated for emphasis, as it's a key requirement)
ALTER TABLE `Report_Results`
MODIFY COLUMN `report_id` INT NULL DEFAULT NULL;

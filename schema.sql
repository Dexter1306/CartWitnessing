-- =========================================================================
-- CART WITNESSING MANAGEMENT SYSTEM — MYSQL DATABASE SCHEMA
-- 5 Locations · 2 Shifts · 3 Volunteers per Cart
-- =========================================================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS `cart_witnessing`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `cart_witnessing`;

-- 2. Locations Table
CREATE TABLE IF NOT EXISTS `locations` (
  `id` VARCHAR(10) NOT NULL PRIMARY KEY COMMENT 'L1, L2, L3, L4, L5',
  `name` VARCHAR(255) NOT NULL,
  `landmark` VARCHAR(255) DEFAULT NULL,
  `cart_storage` VARCHAR(255) DEFAULT NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Shifts Table
CREATE TABLE IF NOT EXISTS `shifts` (
  `id` INT NOT NULL PRIMARY KEY COMMENT '0 = Morning, 1 = Afternoon',
  `name` VARCHAR(100) NOT NULL,
  `time_string` VARCHAR(100) NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `icon` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Daily Schedule Metadata Table
CREATE TABLE IF NOT EXISTS `schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `date_key` DATE NOT NULL UNIQUE COMMENT 'Format: YYYY-MM-DD',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Shift Assignments Table (3 Volunteer Slots per Cart Shift)
CREATE TABLE IF NOT EXISTS `shift_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `date_key` DATE NOT NULL,
  `location_id` VARCHAR(10) NOT NULL,
  `shift_id` INT NOT NULL,
  `slot_num` TINYINT NOT NULL COMMENT '1, 2, or 3',
  `volunteer_name` VARCHAR(150) NOT NULL DEFAULT '',
  `volunteer_phone` VARCHAR(50) NOT NULL DEFAULT '',
  `shift_notes` TEXT DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_slot_per_day` (`date_key`, `location_id`, `shift_id`, `slot_num`),
  KEY `idx_date_key` (`date_key`),
  KEY `idx_location` (`location_id`),
  CONSTRAINT `fk_assignment_location` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assignment_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Keyman Coordinator Users Table
CREATE TABLE IF NOT EXISTS `keyman_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `pin_code` VARCHAR(20) NOT NULL DEFAULT '1234',
  `role` VARCHAR(50) NOT NULL DEFAULT 'keyman',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- SEED INITIAL DATA
-- -------------------------------------------------------------------------

-- Insert 5 Official Locations
INSERT INTO `locations` (`id`, `name`, `landmark`, `cart_storage`, `display_order`) VALUES
('L1', 'Location 1 (Balwarte)', 'Balwarte', 'Cart stored at Balwarte', 1),
('L2', 'Location 2 (Gesen)', 'Gesen', 'Cart stored at Gesen', 2),
('L3', 'Location 3 (Kanlaon / Villarica Pawnshop)', 'Kanlaon / Villarica Pawnshop', 'Cart stored at Kanlaon / Villarica Pawnshop', 3),
('L4', 'Location 4 (Multipurpose / Brgy. Outpost sa Tapat ng Metroplaza)', 'Multipurpose / Brgy. Outpost sa Tapat ng Metroplaza', 'Cart stored at Multipurpose / Brgy. Outpost', 4),
('L5', 'Location 5 (Phase 5 / 7-Eleven)', 'Phase 5 / 7-Eleven', 'Cart stored at Phase 5 / 7-Eleven', 5)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `landmark`=VALUES(`landmark`);

-- Insert 2 Daily Shifts
INSERT INTO `shifts` (`id`, `name`, `time_string`, `start_time`, `end_time`, `icon`) VALUES
(0, 'Shift 1: Morning', '06:30 AM – 08:30 AM', '06:30:00', '08:30:00', '🌅'),
(1, 'Shift 2: Afternoon', '04:30 PM – 06:00 PM', '16:30:00', '18:00:00', '🌇')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `time_string`=VALUES(`time_string`);

-- Insert Default Keyman User
INSERT INTO `keyman_users` (`username`, `pin_code`, `role`) VALUES
('keyman_admin', '1234', 'admin')
ON DUPLICATE KEY UPDATE `pin_code`='1234';

-- -------------------------------------------------------------------------
-- CONVENIENCE SQL VIEWS
-- -------------------------------------------------------------------------

-- View: Complete Daily Schedule Roster with Availability Status
CREATE OR REPLACE VIEW `v_daily_roster` AS
SELECT 
  a.date_key,
  l.id AS location_id,
  l.name AS location_name,
  s.id AS shift_id,
  s.name AS shift_name,
  s.time_string AS shift_time,
  a.slot_num,
  CASE 
    WHEN a.volunteer_name IS NOT NULL AND TRIM(a.volunteer_name) != '' 
    THEN a.volunteer_name 
    ELSE '— Available Slot —' 
  END AS volunteer_name,
  a.volunteer_phone,
  a.shift_notes,
  a.updated_at
FROM `shift_assignments` a
JOIN `locations` l ON a.location_id = l.id
JOIN `shifts` s ON a.shift_id = s.id
ORDER BY a.date_key DESC, l.display_order ASC, s.id ASC, a.slot_num ASC;

-- View: Staffing & Available Slot Summary per Date & Shift
CREATE OR REPLACE VIEW `v_shift_availability_summary` AS
SELECT 
  date_key,
  location_id,
  shift_id,
  COUNT(CASE WHEN volunteer_name IS NOT NULL AND TRIM(volunteer_name) != '' THEN 1 END) AS filled_count,
  3 - COUNT(CASE WHEN volunteer_name IS NOT NULL AND TRIM(volunteer_name) != '' THEN 1 END) AS available_count,
  CASE 
    WHEN COUNT(CASE WHEN volunteer_name IS NOT NULL AND TRIM(volunteer_name) != '' THEN 1 END) = 3 THEN 'Staffed'
    ELSE CONCAT(3 - COUNT(CASE WHEN volunteer_name IS NOT NULL AND TRIM(volunteer_name) != '' THEN 1 END), ' Needed')
  END AS staffing_status
FROM `shift_assignments`
GROUP BY date_key, location_id, shift_id;

-- 1) Backfill NULL roles before altering column type
UPDATE `user` SET `role` = 'USER' WHERE `role` IS NULL;

-- 2) Alter user.role from TEXT to ENUM
ALTER TABLE `user`
  MODIFY COLUMN `role` ENUM('USER','OPERATOR','ADMIN') NOT NULL DEFAULT 'USER';

-- 3) Create new OPMS tables

-- operators
CREATE TABLE `operators` (
  `operator_id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(191) NOT NULL,
  `pump_id` INTEGER NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `operators_user_id_key`(`user_id`),
  PRIMARY KEY (`operator_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `operators`
  ADD CONSTRAINT `operators_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `operators_pump_id_fkey` FOREIGN KEY (`pump_id`) REFERENCES `oil_pumps`(`pump_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- vehicles
CREATE TABLE `vehicles` (
  `vehicle_id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(191) NOT NULL,
  `registration_number` VARCHAR(50) NOT NULL,
  `vehicle_type` VARCHAR(50) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `vehicles_registration_number_key`(`registration_number`),
  PRIMARY KEY (`vehicle_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `vehicles`
  ADD CONSTRAINT `vehicles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- fuel_requests
CREATE TABLE `fuel_requests` (
  `request_id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(191) NOT NULL,
  `vehicle_id` INTEGER NOT NULL,
  `pump_id` INTEGER NOT NULL,
  `fuel_type_id` INTEGER NOT NULL,
  `quantity` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('PENDING','APPROVED','REJECTED','DISPENSED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `remarks` TEXT NULL,
  `reviewed_by` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `fuel_requests_user_id_idx`(`user_id`),
  INDEX `fuel_requests_pump_id_idx`(`pump_id`),
  INDEX `fuel_requests_status_idx`(`status`),
  PRIMARY KEY (`request_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `fuel_requests`
  ADD CONSTRAINT `fuel_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fuel_requests_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`vehicle_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fuel_requests_pump_id_fkey` FOREIGN KEY (`pump_id`) REFERENCES `oil_pumps`(`pump_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fuel_requests_fuel_type_id_fkey` FOREIGN KEY (`fuel_type_id`) REFERENCES `fuel_types`(`fuel_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fuel_requests_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- transactions
CREATE TABLE `transactions` (
  `transaction_id` INTEGER NOT NULL AUTO_INCREMENT,
  `request_id` INTEGER NULL,
  `user_id` VARCHAR(191) NOT NULL,
  `vehicle_id` INTEGER NOT NULL,
  `pump_id` INTEGER NOT NULL,
  `fuel_type_id` INTEGER NOT NULL,
  `operator_id` INTEGER NOT NULL,
  `quantity` DECIMAL(12, 2) NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `total_amount` DECIMAL(12, 2) NOT NULL,
  `dispensed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `transactions_request_id_key`(`request_id`),
  INDEX `transactions_user_id_idx`(`user_id`),
  INDEX `transactions_pump_id_idx`(`pump_id`),
  PRIMARY KEY (`transaction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `fuel_requests`(`request_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `transactions_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`vehicle_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `transactions_pump_id_fkey` FOREIGN KEY (`pump_id`) REFERENCES `oil_pumps`(`pump_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `transactions_fuel_type_id_fkey` FOREIGN KEY (`fuel_type_id`) REFERENCES `fuel_types`(`fuel_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `transactions_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `operators`(`operator_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- inventory_transactions
CREATE TABLE `inventory_transactions` (
  `movement_id` INTEGER NOT NULL AUTO_INCREMENT,
  `pump_id` INTEGER NOT NULL,
  `fuel_type_id` INTEGER NOT NULL,
  `movement_type` ENUM('STOCK_IN','DISPENSE','ADJUSTMENT') NOT NULL,
  `quantity_change` DECIMAL(12, 2) NOT NULL,
  `resulting_balance` DECIMAL(12, 2) NULL,
  `transaction_id` INTEGER NULL,
  `actor_id` VARCHAR(191) NOT NULL,
  `remarks` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `inventory_transactions_pump_id_idx`(`pump_id`),
  PRIMARY KEY (`movement_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `inventory_transactions`
  ADD CONSTRAINT `inventory_transactions_pump_id_fkey` FOREIGN KEY (`pump_id`) REFERENCES `oil_pumps`(`pump_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_transactions_fuel_type_id_fkey` FOREIGN KEY (`fuel_type_id`) REFERENCES `fuel_types`(`fuel_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_transactions_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`transaction_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_transactions_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5) Update fuel_inventory.last_updated to have @updatedAt behavior (handled by app)
-- No schema change needed; Prisma client will set it on write.
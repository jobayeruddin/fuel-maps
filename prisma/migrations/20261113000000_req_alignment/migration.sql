-- 1) Add optional vehicle detail fields (FR-03)
ALTER TABLE `vehicles`
  ADD COLUMN `brand` VARCHAR(80) NULL,
  ADD COLUMN `model` VARCHAR(80) NULL,
  ADD COLUMN `manufacturing_year` INT NULL;

-- 2) Add pump contact information (FR-04)
ALTER TABLE `oil_pumps`
  ADD COLUMN `contact` VARCHAR(120) NULL;

-- 3) Rename fuel_requests status DISPENSED -> COMPLETED (FR-09)
--    Expand enum to include both values, backfill, then contract.
ALTER TABLE `fuel_requests`
  MODIFY COLUMN `status` ENUM('PENDING','APPROVED','REJECTED','DISPENSED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING';

UPDATE `fuel_requests` SET `status` = 'COMPLETED' WHERE `status` = 'DISPENSED';

ALTER TABLE `fuel_requests`
  MODIFY COLUMN `status` ENUM('PENDING','APPROVED','REJECTED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING';
/*
  Warnings:

  - You are about to drop the column `created_at` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `customer_id` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `stage` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Deal` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `Deal` table. All the data in the column will be lost.
  - You are about to alter the column `role` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - You are about to drop the `Contact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Note` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[leadId]` on the table `Deal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `course` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fee` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leadId` to the `Deal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Deal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Contact` DROP FOREIGN KEY `Contact_customer_id_fkey`;

-- DropForeignKey
ALTER TABLE `Customer` DROP FOREIGN KEY `Customer_added_by_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `Deal` DROP FOREIGN KEY `Deal_customer_id_fkey`;

-- DropForeignKey
ALTER TABLE `Note` DROP FOREIGN KEY `Note_customer_id_fkey`;

-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_customer_id_fkey`;

-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_user_id_fkey`;

-- DropIndex
DROP INDEX `Deal_customer_id_fkey` ON `Deal`;

-- AlterTable
ALTER TABLE `Deal` DROP COLUMN `created_at`,
    DROP COLUMN `customer_id`,
    DROP COLUMN `stage`,
    DROP COLUMN `title`,
    DROP COLUMN `updated_at`,
    DROP COLUMN `value`,
    ADD COLUMN `course` VARCHAR(191) NOT NULL,
    ADD COLUMN `fee` DOUBLE NOT NULL,
    ADD COLUMN `leadId` INTEGER NOT NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('ADMIN', 'STAFF') NOT NULL DEFAULT 'STAFF';

-- DropTable
DROP TABLE `Contact`;

-- DropTable
DROP TABLE `Customer`;

-- DropTable
DROP TABLE `Note`;

-- DropTable
DROP TABLE `Task`;

-- CreateTable
CREATE TABLE `Lead` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `parentContact` VARCHAR(191) NULL,
    `courseInterest` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `status` ENUM('NEW', 'IN_PROGRESS', 'ADMITTED', 'REJECTED') NOT NULL DEFAULT 'NEW',
    `assignedToId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowUp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `remarks` VARCHAR(191) NOT NULL,
    `leadId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Deal_leadId_key` ON `Deal`(`leadId`);

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUp` ADD CONSTRAINT `FollowUp_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Deal` ADD CONSTRAINT `Deal_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

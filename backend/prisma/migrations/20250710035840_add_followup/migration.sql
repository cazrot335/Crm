/*
  Warnings:

  - You are about to drop the column `date` on the `FollowUp` table. All the data in the column will be lost.
  - Added the required column `dateTime` to the `FollowUp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enrollmentId` to the `FollowUp` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `FollowUp` DROP FOREIGN KEY `FollowUp_leadId_fkey`;

-- DropIndex
DROP INDEX `FollowUp_leadId_fkey` ON `FollowUp`;

-- AlterTable
ALTER TABLE `FollowUp` DROP COLUMN `date`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `dateTime` DATETIME(3) NOT NULL,
    ADD COLUMN `enrollmentId` INTEGER NOT NULL,
    MODIFY `remarks` VARCHAR(191) NULL,
    MODIFY `leadId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `FollowUp` ADD CONSTRAINT `FollowUp_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `CourseEnrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUp` ADD CONSTRAINT `FollowUp_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

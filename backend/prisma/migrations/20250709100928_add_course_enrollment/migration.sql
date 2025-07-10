/*
  Warnings:

  - You are about to alter the column `status` on the `CourseEnrollment` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(2))`.
  - You are about to alter the column `status` on the `Lead` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(2))`.

*/
-- AlterTable
ALTER TABLE `CourseEnrollment` MODIFY `status` ENUM('LEAD', 'FOLLOWUP', 'PAYMENT', 'ADMITTED', 'REJECTED') NOT NULL DEFAULT 'LEAD';

-- AlterTable
ALTER TABLE `Lead` MODIFY `status` ENUM('LEAD', 'FOLLOWUP', 'PAYMENT', 'ADMITTED', 'REJECTED') NOT NULL DEFAULT 'LEAD';

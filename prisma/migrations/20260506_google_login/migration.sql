-- AlterTable
ALTER TABLE `utilizadores`
MODIFY `password_hash` VARCHAR(191) NULL,
ADD COLUMN `google_id` VARCHAR(191) NULL,
ADD COLUMN `auth_provider` VARCHAR(32) NOT NULL DEFAULT 'local',
ADD COLUMN `avatar_url` VARCHAR(512) NULL,
ADD COLUMN `email_verificado` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `utilizadores_google_id_key` ON `utilizadores`(`google_id`);

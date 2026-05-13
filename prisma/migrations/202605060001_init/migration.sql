-- CreateTable
CREATE TABLE `utilizadores` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(191) NOT NULL,

  UNIQUE INDEX `utilizadores_email_key`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tarefas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `utilizador_id` INT NOT NULL,
  `texto` TEXT NOT NULL,
  `concluida` BOOLEAN NOT NULL DEFAULT false,
  `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `data_atualizacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  INDEX `tarefas_utilizador_id_idx`(`utilizador_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tarefas`
ADD CONSTRAINT `tarefas_utilizador_id_fkey`
FOREIGN KEY (`utilizador_id`) REFERENCES `utilizadores`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

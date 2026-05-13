-- CreateTable
CREATE TABLE `tarefas_partilhas` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tarefa_id` INT NOT NULL,
  `shared_with_user_id` INT NOT NULL,
  `shared_by_user_id` INT NOT NULL,
  `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `tarefas_partilhas_tarefa_id_shared_with_user_id_key`(`tarefa_id`, `shared_with_user_id`),
  INDEX `tarefas_partilhas_shared_with_user_id_idx`(`shared_with_user_id`),
  INDEX `tarefas_partilhas_shared_by_user_id_idx`(`shared_by_user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tarefas_partilhas`
ADD CONSTRAINT `tarefas_partilhas_tarefa_id_fkey`
FOREIGN KEY (`tarefa_id`) REFERENCES `tarefas`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarefas_partilhas`
ADD CONSTRAINT `tarefas_partilhas_shared_with_user_id_fkey`
FOREIGN KEY (`shared_with_user_id`) REFERENCES `utilizadores`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tarefas_partilhas`
ADD CONSTRAINT `tarefas_partilhas_shared_by_user_id_fkey`
FOREIGN KEY (`shared_by_user_id`) REFERENCES `utilizadores`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

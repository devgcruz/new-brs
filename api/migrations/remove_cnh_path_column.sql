-- SQL para remover a coluna cnh_path da tabela colaboradores
-- Esta coluna não é mais utilizada pois foi substituída pelo sistema de documentos

ALTER TABLE `colaboradores` 
DROP COLUMN IF EXISTS `cnh_path`;


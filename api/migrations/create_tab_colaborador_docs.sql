-- SQL para criar a tabela tab_colaborador_docs
-- Baseado na estrutura de tab_pdf, adaptado para colaboradores

CREATE TABLE IF NOT EXISTS `tab_colaborador_docs` (
  `ID_Doc` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `ID_Colaborador` bigint(20) UNSIGNED NOT NULL,
  `DESCRICAO` varchar(255) DEFAULT NULL,
  `CAMINHOPDF` varchar(500) DEFAULT NULL,
  `token_visualizacao` varchar(255) DEFAULT NULL,
  `DATA_REGISTRO` timestamp NOT NULL DEFAULT current_timestamp(),
  `TAMANHO_ARQUIVO` bigint(20) DEFAULT NULL,
  `TIPO_ARQUIVO` varchar(100) DEFAULT NULL,
  `Usuario_Upload` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`ID_Doc`),
  KEY `idx_colaborador` (`ID_Colaborador`),
  KEY `idx_data_registro` (`DATA_REGISTRO`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


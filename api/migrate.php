<?php
/**
 * Script de Migração - Adicionar coluna token na tabela usuarios
 * Execute este script uma vez para adicionar a coluna necessária para autenticação
 */

require_once "config/db.php";

try {
    // Verificar se a coluna token já existe
    $check_sql = "SHOW COLUMNS FROM usuarios LIKE 'token'";
    $check_stmt = $pdo->query($check_sql);
    
    if ($check_stmt->rowCount() > 0) {
        echo "✅ Coluna 'token' já existe na tabela usuarios.\n";
    } else {
        // Adicionar coluna token
        $alter_sql = "ALTER TABLE usuarios ADD COLUMN token VARCHAR(255) NULL AFTER Senha";
        $pdo->exec($alter_sql);
        echo "✅ Coluna 'token' adicionada com sucesso na tabela usuarios.\n";
    }
    
    // Verificar se a coluna ultimo_acesso existe
    $check_sql2 = "SHOW COLUMNS FROM usuarios LIKE 'ultimo_acesso'";
    $check_stmt2 = $pdo->query($check_sql2);
    
    if ($check_stmt2->rowCount() > 0) {
        echo "✅ Coluna 'ultimo_acesso' já existe na tabela usuarios.\n";
    } else {
        // Adicionar coluna ultimo_acesso
        $alter_sql2 = "ALTER TABLE usuarios ADD COLUMN ultimo_acesso TIMESTAMP NULL AFTER status";
        $pdo->exec($alter_sql2);
        echo "✅ Coluna 'ultimo_acesso' adicionada com sucesso na tabela usuarios.\n";
    }
    
    // Verificar se a coluna token_visualizacao existe na tabela pdfs
    $check_sql3 = "SHOW COLUMNS FROM pdfs LIKE 'token_visualizacao'";
    $check_stmt3 = $pdo->query($check_sql3);
    
    if ($check_stmt3->rowCount() > 0) {
        echo "✅ Coluna 'token_visualizacao' já existe na tabela pdfs.\n";
    } else {
        // Adicionar coluna token_visualizacao
        $alter_sql3 = "ALTER TABLE pdfs ADD COLUMN token_visualizacao VARCHAR(255) NULL AFTER CAMINHO_ARQUIVO";
        $pdo->exec($alter_sql3);
        echo "✅ Coluna 'token_visualizacao' adicionada com sucesso na tabela pdfs.\n";
    }
    
    echo "\n🎉 Migração concluída com sucesso!\n";
    echo "Agora você pode usar a API PHP pura.\n";
    
} catch (Exception $e) {
    echo "❌ Erro na migração: " . $e->getMessage() . "\n";
    exit(1);
}

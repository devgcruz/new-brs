<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=brs_database_target', 'root', '');
    echo "Conexão com banco OK\n";
    
    // Verificar se a tabela usuarios existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'usuarios'");
    if ($stmt->rowCount() > 0) {
        echo "Tabela usuarios existe\n";
        
        // Verificar se há usuários
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios");
        $result = $stmt->fetch();
        echo "Total de usuários: " . $result['total'] . "\n";
        
        // Verificar usuário admin
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE Usuario = 'admin'");
        $stmt->execute();
        $admin = $stmt->fetch();
        if ($admin) {
            echo "Usuário admin encontrado\n";
        } else {
            echo "Usuário admin NÃO encontrado\n";
        }
    } else {
        echo "Tabela usuarios NÃO existe\n";
    }
} catch(Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
?>






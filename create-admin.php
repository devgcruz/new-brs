<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=brs_database_target', 'root', '');
    
    // Listar todos os usuários
    $stmt = $pdo->query("SELECT id, Usuario, nome, email, nivel, status FROM usuarios");
    $usuarios = $stmt->fetchAll();
    
    echo "Usuários encontrados:\n";
    foreach ($usuarios as $usuario) {
        echo "- ID: {$usuario['id']}, Usuario: {$usuario['Usuario']}, Nome: {$usuario['nome']}, Nivel: {$usuario['nivel']}, Status: {$usuario['status']}\n";
    }
    
    // Criar usuário admin se não existir
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM usuarios WHERE Usuario = 'admin'");
    $stmt->execute();
    $count = $stmt->fetchColumn();
    
    if ($count == 0) {
        echo "\nCriando usuário admin...\n";
        $password = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO usuarios (Usuario, Senha, nome, email, nivel, permissoes, status, created_at, updated_at) VALUES ('admin', ?, 'Administrador', 'admin@brs.com', 'Administrador', '[\"usuarios\",\"entradas\",\"financeiro\",\"judicial\",\"relatorios\"]', 'ativo', NOW(), NOW())");
        $stmt->execute([$password]);
        echo "Usuário admin criado com sucesso!\n";
    }
    
} catch(Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
?>






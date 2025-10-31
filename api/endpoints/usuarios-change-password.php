<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint: POST /usuarios-change-password
 * Alterar senha do usuário
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

// Verificar método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respostaJson(false, null, 'Método não permitido', 405);
}

// Verificar autenticação e permissão
$usuario = middlewarePermissao('gerenciar-usuarios');

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $id = $data['id'] ?? $_POST['id'] ?? '';
    $password = $data['password'] ?? $_POST['password'] ?? '';
    
    if (empty($id)) {
        respostaJson(false, null, 'ID do usuário não especificado', 400);
    }
    
    if (empty($password)) {
        respostaJson(false, null, 'Senha não especificada', 400);
    }
    
    // Validar senha (mínimo 6 caracteres)
    if (strlen($password) < 6) {
        respostaJson(false, null, 'Senha deve ter no mínimo 6 caracteres', 400);
    }
    
    // Verificar se usuário existe
    $check_stmt = $pdo->prepare("SELECT id FROM usuarios WHERE id = :id");
    $check_stmt->execute(['id' => $id]);
    
    if (!$check_stmt->fetch()) {
        respostaJson(false, null, 'Usuário não encontrado', 404);
    }
    
    // Gerar hash da senha
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Atualizar senha
    $stmt = $pdo->prepare("UPDATE usuarios SET Senha = :senha, updated_at = NOW() WHERE id = :id");
    $stmt->execute([
        'senha' => $password_hash,
        'id' => $id
    ]);
    
    logSimples('✅ Senha do usuário alterada', [
        'usuario_id' => $id,
        'usuario' => $usuario['Usuario']
    ]);
    
    respostaJson(true, null, 'Senha alterada com sucesso');
    
} catch (Exception $e) {
    logSimples('❌ Erro ao alterar senha', ['erro' => $e->getMessage()]);
    respostaJson(false, null, 'Erro ao alterar senha: ' . $e->getMessage(), 500);
}

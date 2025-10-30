<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint: POST /usuarios/{id}/change-password
 * Alterar senha de usuário específico
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
$usuario = middlewarePermissao('usuarios');

try {
    // Obter ID do usuário da URL
    $usuario_id = $_GET['usuario_id'] ?? '';
    
    if (!is_numeric($usuario_id)) {
        respostaJson(false, null, 'ID do usuário inválido', 400);
    }
    
    // Obter dados do POST
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        respostaJson(false, null, 'Dados não fornecidos', 400);
    }
    
    $senha_atual = $input['senha_atual'] ?? '';
    $nova_senha = $input['nova_senha'] ?? '';
    $confirmar_senha = $input['nova_senha_confirmation'] ?? '';
    
    // Validações
    if (empty($senha_atual)) {
        respostaJson(false, null, 'Senha atual é obrigatória', 400);
    }
    
    if (empty($nova_senha)) {
        respostaJson(false, null, 'Nova senha é obrigatória', 400);
    }
    
    if (strlen($nova_senha) < 6) {
        respostaJson(false, null, 'Nova senha deve ter pelo menos 6 caracteres', 400);
    }
    
    if ($nova_senha !== $confirmar_senha) {
        respostaJson(false, null, 'Confirmação de senha não confere', 400);
    }
    
    // Buscar usuário
    $stmt = $pdo->prepare("SELECT id, nome, Usuario, Senha FROM usuarios WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $usuario_id]);
    $usuario_alvo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$usuario_alvo) {
        respostaJson(false, null, 'Usuário não encontrado', 404);
    }
    
    // Verificar senha atual
    if (!password_verify($senha_atual, $usuario_alvo['Senha'])) {
        respostaJson(false, null, 'Senha atual incorreta', 400);
    }
    
    // Hash da nova senha
    $nova_senha_hash = password_hash($nova_senha, PASSWORD_DEFAULT);
    
    // Atualizar senha
    $stmt = $pdo->prepare("UPDATE usuarios SET Senha = :senha WHERE id = :id");
    $stmt->execute([
        'senha' => $nova_senha_hash,
        'id' => $usuario_id
    ]);
    
    // Log da alteração
    logSimples('usuario_change_password', [
        'usuario_id' => $usuario_id,
        'usuario_nome' => $usuario_alvo['nome'],
        'alterado_por' => $usuario['Usuario']
    ]);
    
    respostaJson(true, [
        'id' => $usuario_alvo['id'],
        'nome' => $usuario_alvo['nome'],
        'usuario' => $usuario_alvo['Usuario']
    ], 'Senha alterada com sucesso');
    
} catch (Exception $e) {
    logSimples('error', [
        'endpoint' => 'usuarios-change-password',
        'erro' => $e->getMessage(),
        'usuario' => $usuario['Usuario'] ?? 'N/A'
    ]);
    
    respostaJson(false, null, 'Erro ao alterar senha: ' . $e->getMessage(), 500);
}

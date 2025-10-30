<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint para Alterar Senha do Perfil
 * Substitui ProfileController@changePassword do Laravel
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

header("Content-Type: application/json");


require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    respostaJson(false, null, 'Método não permitido', 405);
}

// Verificar autenticação
$usuario = middlewareAutenticacao();

// Receber dados JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    respostaJson(false, null, 'Dados JSON inválidos', 400);
}

// Validar dados obrigatórios
validarDadosObrigatorios($data, ['current_password', 'new_password', 'new_password_confirmation']);

// Validações específicas
if (strlen($data['new_password']) < 8) {
    respostaJson(false, null, 'Nova senha deve ter pelo menos 8 caracteres', 400);
}

if ($data['new_password'] !== $data['new_password_confirmation']) {
    respostaJson(false, null, 'Confirmação de senha não confere', 400);
}

$current_password = $data['current_password'];
$new_password = $data['new_password'];

logSimples('🔐 Tentativa de alteração de senha', ['usuario' => $usuario['Usuario']]);

try {
    // Verificar senha atual
    if (!password_verify($current_password, $usuario['Senha'])) {
        logSimples('❌ Senha atual incorreta', ['usuario' => $usuario['Usuario']]);
        respostaJson(false, null, 'Senha atual incorreta', 400);
    }
    
    // Atualizar senha
    $sql = "UPDATE usuarios SET Senha = :senha, updated_at = NOW() WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'senha' => password_hash($new_password, PASSWORD_DEFAULT),
        'id' => $usuario['id']
    ]);
    
    logSimples('✅ Senha alterada', ['usuario' => $usuario['Usuario']]);
    
    respostaJson(true, null, 'Senha alterada com sucesso!');
    
} catch (Exception $e) {
    logSimples('❌ Erro ao alterar senha', ['erro' => $e->getMessage()]);
    respostaJson(false, null, 'Erro interno do servidor', 500);
}

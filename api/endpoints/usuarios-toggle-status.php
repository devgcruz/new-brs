<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint: POST /usuarios-toggle-status
 * Alternar status do usuário (ativo/inativo)
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
    
    if (empty($id)) {
        respostaJson(false, null, 'ID do usuário não especificado', 400);
    }
    
    // Verificar se usuário existe
    $check_stmt = $pdo->prepare("SELECT id, status FROM usuarios WHERE id = :id");
    $check_stmt->execute(['id' => $id]);
    $usuario_atual = $check_stmt->fetch();
    
    if (!$usuario_atual) {
        respostaJson(false, null, 'Usuário não encontrado', 404);
    }
    
    // Não permitir desativar a si mesmo
    if ($id == $usuario['id']) {
        respostaJson(false, null, 'Não é possível alterar seu próprio status', 400);
    }
    
    // Alternar status
    $novo_status = ($usuario_atual['status'] === 'ativo') ? 'inativo' : 'ativo';
    
    $stmt = $pdo->prepare("UPDATE usuarios SET status = :status, updated_at = NOW() WHERE id = :id");
    $stmt->execute([
        'status' => $novo_status,
        'id' => $id
    ]);
    
    logSimples('✅ Status do usuário alterado', [
        'usuario_id' => $id,
        'novo_status' => $novo_status,
        'usuario' => $usuario['Usuario']
    ]);
    
    respostaJson(true, ['status' => $novo_status], 'Status alterado com sucesso');
    
} catch (Exception $e) {
    logSimples('❌ Erro ao alterar status', ['erro' => $e->getMessage()]);
    respostaJson(false, null, 'Erro ao alterar status: ' . $e->getMessage(), 500);
}

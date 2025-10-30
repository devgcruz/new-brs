<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint: PATCH /usuarios/{id}/toggle-status
 * Ativar/desativar usuário
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

// Verificar método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
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
    
    // Buscar usuário
    $stmt = $pdo->prepare("SELECT id, nome, Usuario, status FROM usuarios WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $usuario_id]);
    $usuario_alvo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$usuario_alvo) {
        respostaJson(false, null, 'Usuário não encontrado', 404);
    }
    
    // Não permitir alterar o próprio status
    if ($usuario_alvo['id'] == $usuario['id']) {
        respostaJson(false, null, 'Você não pode alterar seu próprio status', 400);
    }
    
    // Determinar novo status
    $status_atual = $usuario_alvo['status'];
    $novo_status = ($status_atual === 'ativo') ? 'inativo' : 'ativo';
    
    // Atualizar status
    $stmt = $pdo->prepare("UPDATE usuarios SET status = :status WHERE id = :id");
    $stmt->execute([
        'status' => $novo_status,
        'id' => $usuario_id
    ]);
    
    // Log da alteração
    logSimples('usuario_toggle_status', [
        'usuario_id' => $usuario_id,
        'usuario_nome' => $usuario_alvo['nome'],
        'status_anterior' => $status_atual,
        'status_novo' => $novo_status,
        'alterado_por' => $usuario['Usuario']
    ]);
    
    respostaJson(true, [
        'id' => $usuario_alvo['id'],
        'nome' => $usuario_alvo['nome'],
        'usuario' => $usuario_alvo['Usuario'],
        'status' => $novo_status,
        'status_anterior' => $status_atual
    ], "Status do usuário alterado para {$novo_status}");
    
} catch (Exception $e) {
    logSimples('error', [
        'endpoint' => 'usuarios-toggle-status',
        'erro' => $e->getMessage(),
        'usuario' => $usuario['Usuario'] ?? 'N/A'
    ]);
    
    respostaJson(false, null, 'Erro ao alterar status: ' . $e->getMessage(), 500);
}

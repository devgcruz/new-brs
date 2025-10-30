<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint: DELETE /observacoes-financeiro/{observacao_id}
 * Excluir uma observação específica de lançamento financeiro
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/config/table-mapping.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

// Verificar autenticação
$usuario = middlewareAutenticacao();

try {
    // Obter ID da observação
    $observacao_id = $_GET['id'] ?? '';
    
    if (!is_numeric($observacao_id)) {
        respostaJson(false, null, 'ID da observação inválido', 400);
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'DELETE') {
        // EXCLUIR observação
        
        $observacoes_table = getTableName('observacoes_financeiro');
        
        // Verificar se a observação existe e se pertence ao usuário
        $stmt = $pdo->prepare("
            SELECT o.Id_Observacao, o.ID_FINANCEIRO, o.ID_USUARIO, o.texto
            FROM $observacoes_table o
            WHERE o.Id_Observacao = :id
        ");
        $stmt->execute(['id' => $observacao_id]);
        $observacao = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$observacao) {
            respostaJson(false, null, 'Observação não encontrada', 404);
        }
        
        // Verificar se o usuário pode excluir (própria observação ou admin)
        if ($observacao['ID_USUARIO'] != $usuario['id'] && $usuario['role'] !== 'admin') {
            respostaJson(false, null, 'Você não tem permissão para excluir esta observação', 403);
        }
        
        // Excluir a observação
        $stmt = $pdo->prepare("DELETE FROM $observacoes_table WHERE Id_Observacao = :id");
        $stmt->execute(['id' => $observacao_id]);
        
        // Log da exclusão
        logSimples('observacoes_financeiro_delete', [
            'observacao_id' => $observacao_id,
            'financeiro_id' => $observacao['ID_FINANCEIRO'],
            'texto' => $observacao['texto'],
            'usuario' => $usuario['Usuario']
        ]);
        
        respostaJson(true, null, 'Observação excluída com sucesso');
        
    } else {
        respostaJson(false, null, 'Método não permitido', 405);
    }
    
} catch (Exception $e) {
    logSimples('error', [
        'endpoint' => 'observacoes-financeiro-delete',
        'erro' => $e->getMessage(),
        'usuario' => $usuario['Usuario'] ?? 'N/A'
    ]);
    
    respostaJson(false, null, 'Erro ao excluir observação: ' . $e->getMessage(), 500);
}

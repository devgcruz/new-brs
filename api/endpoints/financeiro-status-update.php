<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint: PATCH /financeiros/{id}/status
 * Atualizar status de um lançamento financeiro
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

// Verificar autenticação
$usuario = middlewareAutenticacao();

try {
    // Obter ID do financeiro da URL
    $financeiro_id = $_GET['financeiro_id'] ?? '';
    
    if (!is_numeric($financeiro_id)) {
        respostaJson(false, null, 'ID do financeiro inválido', 400);
    }
    
    // Obter dados do PATCH
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        respostaJson(false, null, 'Dados não fornecidos', 400);
    }
    
    $novo_status = $input['status'] ?? '';
    
    // Validações
    if (empty($novo_status)) {
        respostaJson(false, null, 'Status é obrigatório', 400);
    }
    
    $status_validos = ['Pago', 'Pendente', 'Em análise', 'Rejeitado'];
    if (!in_array($novo_status, $status_validos)) {
        respostaJson(false, null, 'Status inválido. Valores aceitos: ' . implode(', ', $status_validos), 400);
    }
    
    // Buscar financeiro
    $stmt = $pdo->prepare("
        SELECT f.*, e.PLACA, e.VEICULO 
        FROM financeiro f
        LEFT JOIN entradas e ON f.ID_ENTRADA = e.Id_Entrada
        WHERE f.Id_Financeiro = :id LIMIT 1
    ");
    $stmt->execute(['id' => $financeiro_id]);
    $financeiro = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$financeiro) {
        respostaJson(false, null, 'Lançamento financeiro não encontrado', 404);
    }
    
    $status_anterior = $financeiro['StatusPG'];
    
    // Atualizar status
    $stmt = $pdo->prepare("UPDATE financeiro SET StatusPG = :status WHERE Id_Financeiro = :id");
    $stmt->execute([
        'status' => $novo_status,
        'id' => $financeiro_id
    ]);
    
    // Log da alteração
    logSimples('financeiro_status_update', [
        'financeiro_id' => $financeiro_id,
        'entrada_id' => $financeiro['ID_ENTRADA'],
        'placa' => $financeiro['PLACA'],
        'status_anterior' => $status_anterior,
        'status_novo' => $novo_status,
        'alterado_por' => $usuario['Usuario']
    ]);
    
    respostaJson(true, [
        'id' => $financeiro['Id_Financeiro'],
        'entrada_id' => $financeiro['ID_ENTRADA'],
        'placa' => $financeiro['PLACA'],
        'veiculo' => $financeiro['VEICULO'],
        'status' => $novo_status,
        'status_anterior' => $status_anterior
    ], 'Status atualizado com sucesso');
    
} catch (Exception $e) {
    logSimples('error', [
        'endpoint' => 'financeiro-status-update',
        'erro' => $e->getMessage(),
        'usuario' => $usuario['Usuario'] ?? 'N/A'
    ]);
    
    respostaJson(false, null, 'Erro ao atualizar status: ' . $e->getMessage(), 500);
}

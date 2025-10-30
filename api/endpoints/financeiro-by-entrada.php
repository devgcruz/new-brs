<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint: GET /financeiro/entrada/{entrada}
 * Buscar dados financeiros por entrada específica
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

// Verificar método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respostaJson(false, null, 'Método não permitido', 405);
}

// Verificar autenticação
$usuario = middlewareAutenticacao();

try {
    // Obter ID da entrada da URL
    $entrada_id = $_GET['entrada_id'] ?? '';
    
    if (!is_numeric($entrada_id)) {
        respostaJson(false, null, 'ID da entrada inválido', 400);
    }
    
    // Verificar se a entrada existe
    $stmt = $pdo->prepare("SELECT Id_Entrada, PLACA, VEICULO FROM entradas WHERE Id_Entrada = :id LIMIT 1");
    $stmt->execute(['id' => $entrada_id]);
    $entrada = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$entrada) {
        respostaJson(false, null, 'Entrada não encontrada', 404);
    }
    
    // Buscar dados financeiros da entrada
    $stmt = $pdo->prepare("
        SELECT 
            f.*,
            e.PLACA,
            e.VEICULO,
            e.MARCA
        FROM financeiro f
        LEFT JOIN entradas e ON f.ID_ENTRADA = e.Id_Entrada
        WHERE f.ID_ENTRADA = :entrada_id
        ORDER BY f.created_at DESC
    ");
    $stmt->execute(['entrada_id' => $entrada_id]);
    $financeiros = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($financeiros)) {
        respostaJson(false, null, 'Dados financeiros não encontrados para esta entrada', 404);
    }
    
    // Calcular totais
    $total_honorarios = 0;
    $total_despesas = 0;
    $total_liquido = 0;
    
    foreach ($financeiros as $financeiro) {
        $total_honorarios += floatval($financeiro['Honorarios'] ?? 0);
        $total_despesas += floatval($financeiro['Despesas'] ?? 0);
    }
    
    $total_liquido = $total_honorarios - $total_despesas;
    
    // Log da consulta
    logSimples('financeiro_by_entrada', [
        'entrada_id' => $entrada_id,
        'placa' => $entrada['PLACA'],
        'total_registros' => count($financeiros),
        'usuario' => $usuario['Usuario']
    ]);
    
    respostaJson(true, [
        'entrada' => [
            'id' => $entrada['Id_Entrada'],
            'placa' => $entrada['PLACA'],
            'veiculo' => $entrada['VEICULO']
        ],
        'financeiros' => $financeiros,
        'totais' => [
            'total_honorarios' => $total_honorarios,
            'total_despesas' => $total_despesas,
            'total_liquido' => $total_liquido,
            'total_registros' => count($financeiros)
        ]
    ], 'Dados financeiros obtidos com sucesso');
    
} catch (Exception $e) {
    logSimples('error', [
        'endpoint' => 'financeiro-by-entrada',
        'erro' => $e->getMessage(),
        'usuario' => $usuario['Usuario'] ?? 'N/A'
    ]);
    
    respostaJson(false, null, 'Erro ao obter dados financeiros: ' . $e->getMessage(), 500);
}

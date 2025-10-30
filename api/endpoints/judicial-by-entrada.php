<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint: GET /judicial/entrada/{entrada}
 * Buscar dados judiciais por entrada específica
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
    
    // Buscar dados judiciais da entrada
    $stmt = $pdo->prepare("
        SELECT 
            j.*,
            e.PLACA,
            e.VEICULO,
            e.MARCA
        FROM judicial j
        LEFT JOIN entradas e ON j.ID_ENTRADA = e.Id_Entrada
        WHERE j.ID_ENTRADA = :entrada_id
        ORDER BY j.created_at DESC
    ");
    $stmt->execute(['entrada_id' => $entrada_id]);
    $judiciais = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($judiciais)) {
        respostaJson(false, null, 'Dados judiciais não encontrados para esta entrada', 404);
    }
    
    // Calcular totais
    $total_honorarios = 0;
    $total_processos = count($judiciais);
    
    foreach ($judiciais as $judicial) {
        $total_honorarios += floatval($judicial['HONORARIO'] ?? 0);
    }
    
    // Agrupar por comarca
    $por_comarca = [];
    foreach ($judiciais as $judicial) {
        $comarca = $judicial['COMARCA'] ?? 'Não informado';
        if (!isset($por_comarca[$comarca])) {
            $por_comarca[$comarca] = [
                'comarca' => $comarca,
                'total_processos' => 0,
                'total_honorarios' => 0
            ];
        }
        $por_comarca[$comarca]['total_processos']++;
        $por_comarca[$comarca]['total_honorarios'] += floatval($judicial['HONORARIO'] ?? 0);
    }
    
    // Log da consulta
    logSimples('judicial_by_entrada', [
        'entrada_id' => $entrada_id,
        'placa' => $entrada['PLACA'],
        'total_registros' => count($judiciais),
        'usuario' => $usuario['Usuario']
    ]);
    
    respostaJson(true, [
        'entrada' => [
            'id' => $entrada['Id_Entrada'],
            'placa' => $entrada['PLACA'],
            'veiculo' => $entrada['VEICULO']
        ],
        'judiciais' => $judiciais,
        'totais' => [
            'total_processos' => $total_processos,
            'total_honorarios' => $total_honorarios
        ],
        'por_comarca' => array_values($por_comarca)
    ], 'Dados judiciais obtidos com sucesso');
    
} catch (Exception $e) {
    logSimples('error', [
        'endpoint' => 'judicial-by-entrada',
        'erro' => $e->getMessage(),
        'usuario' => $usuario['Usuario'] ?? 'N/A'
    ]);
    
    respostaJson(false, null, 'Erro ao obter dados judiciais: ' . $e->getMessage(), 500);
}

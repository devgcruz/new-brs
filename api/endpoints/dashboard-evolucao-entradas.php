<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Dashboard - Evolução de Entradas
 * Substitui DashboardController@getDadosEvolucaoEntradas do Laravel
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/config/table-mapping.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    respostaJson(false, null, 'Método não permitido', 405);
}

$usuario = middlewareAutenticacao();

try {
    // Dados para gráfico de linha - Evolução de Entradas (últimos 12 meses)
    $table_name = getTableName('entradas');
    $sql = "
        SELECT 
            DATE_FORMAT(DATA_ENTRADA, '%Y-%m') as mes,
            COUNT(*) as total
        FROM $table_name 
        WHERE DATA_ENTRADA >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY mes 
        ORDER BY mes ASC
    ";
    
    $stmt = $pdo->query($sql);
    $dados = $stmt->fetchAll();
    
    $resultado = array_map(function ($item) {
        return [
            'name' => $item['mes'],
            'y' => (int)$item['total']
        ];
    }, $dados);
    
    respostaJson(true, $resultado);
    
} catch (Exception $e) {
    logSimples('❌ Erro ao obter dados de evolução de entradas', ['erro' => $e->getMessage()]);
    respostaJson(false, null, 'Erro ao buscar dados de evolução de entradas', 500);
}

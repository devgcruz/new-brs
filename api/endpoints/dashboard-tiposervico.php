<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Dashboard - Dados de Tipo de Serviço
 * Substitui DashboardController@getDadosTipoServico do Laravel
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
    // Dados para gráfico de rosca - Percentual por Tipo de Serviço
    $table_name = getTableName('entradas');
    $sql = "
        SELECT TIPO, COUNT(*) as total 
        FROM $table_name 
        WHERE TIPO IS NOT NULL AND TIPO != '' 
        GROUP BY TIPO 
        ORDER BY total DESC
    ";
    
    $stmt = $pdo->query($sql);
    $dados = $stmt->fetchAll();
    
    $totalGeral = array_sum(array_column($dados, 'total'));
    
    $resultado = array_map(function ($item) use ($totalGeral) {
        $percentual = $totalGeral > 0 ? round(($item['total'] / $totalGeral) * 100, 1) : 0;
        return [
            'name' => $item['TIPO'],
            'y' => $percentual
        ];
    }, $dados);
    
    respostaJson(true, $resultado);
    
} catch (Exception $e) {
    logSimples('❌ Erro ao obter dados de tipo de serviço', ['erro' => $e->getMessage()]);
    respostaJson(false, null, 'Erro ao buscar dados de tipo de serviço', 500);
}

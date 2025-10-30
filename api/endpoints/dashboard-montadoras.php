<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Dashboard - Dados de Montadoras
 * Substitui DashboardController@getDadosMontadora do Laravel
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
    // Dados para gráfico de pizza - Percentual por Montadora (Top 10)
    $table_name = getTableName('entradas');
    $sql = "
        SELECT MARCA, COUNT(*) as total 
        FROM $table_name 
        WHERE MARCA IS NOT NULL AND MARCA != '' 
        GROUP BY MARCA 
        ORDER BY total DESC 
        LIMIT 10
    ";
    
    $stmt = $pdo->query($sql);
    $dados = $stmt->fetchAll();
    
    $totalGeral = array_sum(array_column($dados, 'total'));
    
    $resultado = array_map(function ($item) use ($totalGeral) {
        $percentual = $totalGeral > 0 ? round(($item['total'] / $totalGeral) * 100, 1) : 0;
        return [
            'name' => $item['MARCA'],
            'y' => $percentual
        ];
    }, $dados);
    
    respostaJson(true, $resultado);
    
} catch (Exception $e) {
    logSimples('❌ Erro ao obter dados de montadora', ['erro' => $e->getMessage()]);
    respostaJson(false, null, 'Erro ao buscar dados de montadora', 500);
}

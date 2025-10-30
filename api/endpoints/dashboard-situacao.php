<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Dashboard - Dados de Situação
 * Substitui DashboardController@getDadosSituacao do Laravel
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
    // Dados para gráfico de barras - Situação das Entradas
    $table_name = getTableName('entradas');
    $sql = "
        SELECT SITUACAO, COUNT(*) as total 
        FROM $table_name 
        WHERE SITUACAO IS NOT NULL AND SITUACAO != '' 
        GROUP BY SITUACAO 
        ORDER BY total DESC
    ";
    
    $stmt = $pdo->query($sql);
    $dados = $stmt->fetchAll();
    
    $resultado = array_map(function ($item) {
        return [
            'name' => $item['SITUACAO'],
            'y' => (int)$item['total']
        ];
    }, $dados);
    
    respostaJson(true, $resultado);
    
} catch (Exception $e) {
    logSimples('❌ Erro ao obter dados de situação', ['erro' => $e->getMessage()]);
    respostaJson(false, null, 'Erro ao buscar dados de situação', 500);
}

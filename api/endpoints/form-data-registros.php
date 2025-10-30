<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de FormData para Registros
 * Substitui FormDataController@getRegistroFormData do Laravel
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
    // Obter nomes das tabelas usando o sistema de mapeamento
    $posicoes_table = getTableName('posicoes');
    $marcas_table = getTableName('marcas');
    $seguradoras_table = getTableName('seguradoras');
    $colaboradores_table = getTableName('colaboradores');
    
    // Buscar dados unificados para formulários de registro
    $data = [
        'posicoes' => [],
        'marcas' => [],
        'seguradoras' => [],
        'colaboradores' => []
    ];
    
    // Buscar posições
    $stmt = $pdo->query("SELECT id, nome FROM $posicoes_table ORDER BY nome ASC");
    $data['posicoes'] = $stmt->fetchAll();
    
    // Buscar marcas
    $stmt = $pdo->query("SELECT id, nome FROM $marcas_table ORDER BY nome ASC");
    $data['marcas'] = $stmt->fetchAll();
    
    // Buscar seguradoras
    $stmt = $pdo->query("SELECT id, nome FROM $seguradoras_table ORDER BY nome ASC");
    $data['seguradoras'] = $stmt->fetchAll();
    
    // Buscar colaboradores
    $stmt = $pdo->query("SELECT id, nome FROM $colaboradores_table ORDER BY nome ASC");
    $data['colaboradores'] = $stmt->fetchAll();
    
    respostaJson(true, $data);
    
} catch (Exception $e) {
    logSimples('❌ Erro ao obter dados de formulário', ['erro' => $e->getMessage()]);
    respostaJson(false, null, 'Erro ao obter dados de formulário', 500);
}

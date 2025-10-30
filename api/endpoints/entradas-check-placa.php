<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint: GET /entradas/check-placa
 * Verificar se uma placa já existe no sistema
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/config/table-mapping.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

// Verificar método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respostaJson(false, null, 'Método não permitido', 405);
}

// Verificar autenticação
$usuario = middlewareAutenticacao();

try {
    // Obter placa da query string
    $placa = $_GET['placa'] ?? '';
    
    if (empty($placa)) {
        respostaJson(false, null, 'Placa não fornecida', 400);
    }
    
    // Sanitizar placa
    $placa = sanitizar($placa);
    
    // Verificar se a placa já existe
    $entradas_table = getTableName('entradas');
    $stmt = $pdo->prepare("SELECT Id_Entrada, PLACA, VEICULO, MARCA FROM $entradas_table WHERE PLACA = :placa LIMIT 1");
    $stmt->execute(['placa' => $placa]);
    $entrada = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $exists = !empty($entrada);
    
    // Log da verificação
    logSimples('check_placa', [
        'placa' => $placa,
        'existe' => $exists,
        'usuario' => $usuario['Usuario']
    ]);
    
    respostaJson(true, [
        'exists' => $exists,
        'placa' => $placa,
        'entrada' => $exists ? [
            'id' => $entrada['Id_Entrada'],
            'veiculo' => $entrada['VEICULO'],
            'marca' => $entrada['MARCA']
        ] : null
    ], $exists ? 'Placa já cadastrada' : 'Placa disponível');
    
} catch (Exception $e) {
    logSimples('error', [
        'endpoint' => 'entradas-check-placa',
        'erro' => $e->getMessage(),
        'usuario' => $usuario['Usuario'] ?? 'N/A'
    ]);
    
    respostaJson(false, null, 'Erro ao verificar placa: ' . $e->getMessage(), 500);
}

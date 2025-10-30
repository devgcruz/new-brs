<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Estatísticas de Prestadores
 * Substitui PrestadorController@statistics do Laravel
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
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    respostaJson(false, null, 'Método não permitido', 405);
}

$usuario = middlewareAutenticacao();

try {
    $stats = [];
    
    // Total de prestadores
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM prestadores");
    $stats['total_prestadores'] = $stmt->fetch()['total'];
    
    // Prestadores por status
    $stmt = $pdo->query("
        SELECT status, COUNT(*) as count 
        FROM prestadores 
        WHERE status IS NOT NULL 
        GROUP BY status
    ");
    $stats['por_status'] = $stmt->fetchAll();
    
    // Prestadores por especialidade
    $stmt = $pdo->query("
        SELECT especialidade, COUNT(*) as count 
        FROM prestadores 
        WHERE especialidade IS NOT NULL AND especialidade != '' 
        GROUP BY especialidade 
        ORDER BY count DESC 
        LIMIT 10
    ");
    $stats['por_especialidade'] = $stmt->fetchAll();
    
    // Top prestadores por uso em entradas
    $stmt = $pdo->query("
        SELECT 
            p.nome,
            p.especialidade,
            COUNT(e.Id_Entrada) as qtd_entradas
        FROM prestadores p
        LEFT JOIN entradas e ON p.nome = e.PRESTADOR
        GROUP BY p.id, p.nome, p.especialidade
        ORDER BY qtd_entradas DESC
        LIMIT 10
    ");
    $stats['top_prestadores'] = $stmt->fetchAll();
    
    respostaJson(true, $stats);
    
} catch (Exception $e) {
    logSimples('❌ Erro ao obter estatísticas de prestadores', ['erro' => $e->getMessage()]);
    respostaJson(false, null, 'Erro ao obter estatísticas', 500);
}

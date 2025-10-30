<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Estatísticas Judiciais
 * Substitui JudicialController@statistics do Laravel
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

header("Content-Type: application/json");


require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    respostaJson(false, null, 'Método não permitido', 405);
}

// Verificar autenticação
$usuario = middlewareAutenticacao();

try {
    // Estatísticas gerais
    $stats = [];
    
    // Total de processos judiciais
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM judicial");
    $stats['total_processos'] = $stmt->fetch()['total'];
    
    // Valor total das causas
    $stmt = $pdo->query("SELECT SUM(VALOR_CAUSA) as total FROM judicial WHERE VALOR_CAUSA IS NOT NULL");
    $stats['valor_total_causas'] = $stmt->fetch()['total'] ?? 0;
    
    // Estatísticas por status
    $stmt = $pdo->query("
        SELECT STATUS_PROCESSO, COUNT(*) as count, SUM(VALOR_CAUSA) as valor_total 
        FROM judicial 
        WHERE STATUS_PROCESSO IS NOT NULL 
        GROUP BY STATUS_PROCESSO
    ");
    $stats['por_status'] = $stmt->fetchAll();
    
    // Estatísticas por comarca
    $stmt = $pdo->query("
        SELECT COMARCA, COUNT(*) as count, SUM(VALOR_CAUSA) as valor_total 
        FROM judicial 
        WHERE COMARCA IS NOT NULL AND COMARCA != '' 
        GROUP BY COMARCA 
        ORDER BY count DESC 
        LIMIT 10
    ");
    $stats['por_comarca'] = $stmt->fetchAll();
    
    // Estatísticas por mês (últimos 12 meses)
    $stmt = $pdo->query("
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as mes,
            COUNT(*) as processos,
            SUM(VALOR_CAUSA) as valor_total
        FROM judicial 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY mes 
        ORDER BY mes DESC
    ");
    $stats['por_mes'] = $stmt->fetchAll();
    
    // Top 10 entradas por valor de causa
    $stmt = $pdo->query("
        SELECT 
            j.ID_ENTRADA,
            e.PLACA,
            e.VEICULO,
            e.MARCA,
            SUM(j.VALOR_CAUSA) as valor_total,
            COUNT(j.id) as qtd_processos
        FROM judicial j
        LEFT JOIN entradas e ON j.ID_ENTRADA = e.Id_Entrada
        GROUP BY j.ID_ENTRADA
        ORDER BY valor_total DESC
        LIMIT 10
    ");
    $stats['top_entradas'] = $stmt->fetchAll();
    
    // Estatísticas de diligências
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total_diligencias,
            COUNT(DISTINCT ID_JUDICIAL) as processos_com_diligencia
        FROM diligencias
    ");
    $stats['diligencias'] = $stmt->fetch();
    
    respostaJson(true, $stats);
    
} catch (Exception $e) {
    logSimples('❌ Erro ao obter estatísticas judiciais', ['erro' => $e->getMessage()]);
    respostaJson(false, null, 'Erro ao obter estatísticas', 500);
}

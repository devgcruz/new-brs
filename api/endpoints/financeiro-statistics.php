<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Estatísticas Financeiras
 * Substitui FinanceiroController@statistics do Laravel
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
    
    // Total de registros financeiros
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM financeiros");
    $stats['total_registros'] = $stmt->fetch()['total'];
    
    // Valor total de notas fiscais
    $stmt = $pdo->query("SELECT SUM(VALOR_NF) as total FROM financeiros WHERE VALOR_NF IS NOT NULL");
    $stats['valor_total_nf'] = $stmt->fetch()['total'] ?? 0;
    
    // Valor total de honorários
    $stmt = $pdo->query("SELECT SUM(VALOR_HONORARIO) as total FROM financeiros WHERE VALOR_HONORARIO IS NOT NULL");
    $stats['valor_total_honorarios'] = $stmt->fetch()['total'] ?? 0;
    
    // Valor total de despesas
    $stmt = $pdo->query("SELECT SUM(VALOR_DESPESA) as total FROM financeiros WHERE VALOR_DESPESA IS NOT NULL");
    $stats['valor_total_despesas'] = $stmt->fetch()['total'] ?? 0;
    
    // Valor líquido total
    $stmt = $pdo->query("SELECT SUM(VALOR_LIQUIDO) as total FROM financeiros WHERE VALOR_LIQUIDO IS NOT NULL");
    $stats['valor_liquido_total'] = $stmt->fetch()['total'] ?? 0;
    
    // Estatísticas por status
    $stmt = $pdo->query("
        SELECT StatusPG, COUNT(*) as count, SUM(VALOR_NF) as valor_total 
        FROM financeiros 
        WHERE StatusPG IS NOT NULL 
        GROUP BY StatusPG
    ");
    $stats['por_status'] = $stmt->fetchAll();
    
    // Estatísticas por mês (últimos 12 meses)
    $stmt = $pdo->query("
        SELECT 
            DATE_FORMAT(DATA_NF, '%Y-%m') as mes,
            COUNT(*) as registros,
            SUM(VALOR_NF) as valor_nf,
            SUM(VALOR_HONORARIO) as valor_honorario,
            SUM(VALOR_DESPESA) as valor_despesa,
            SUM(VALOR_LIQUIDO) as valor_liquido
        FROM financeiros 
        WHERE DATA_NF >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY mes 
        ORDER BY mes DESC
    ");
    $stats['por_mes'] = $stmt->fetchAll();
    
    // Top 10 entradas por valor
    $stmt = $pdo->query("
        SELECT 
            f.ID_ENTRADA,
            e.PLACA,
            e.VEICULO,
            e.MARCA,
            SUM(f.VALOR_NF) as valor_total,
            COUNT(f.id) as qtd_registros
        FROM financeiros f
        LEFT JOIN entradas e ON f.ID_ENTRADA = e.Id_Entrada
        GROUP BY f.ID_ENTRADA
        ORDER BY valor_total DESC
        LIMIT 10
    ");
    $stats['top_entradas'] = $stmt->fetchAll();
    
    respostaJson(true, $stats);
    
} catch (Exception $e) {
    logSimples('❌ Erro ao obter estatísticas financeiras', ['erro' => $e->getMessage()]);
    respostaJson(false, null, 'Erro ao obter estatísticas', 500);
}

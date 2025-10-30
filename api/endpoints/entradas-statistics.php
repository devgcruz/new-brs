<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint: GET /entradas/statistics
 * Estatísticas das entradas
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
    // Estatísticas gerais
    $stats = [];
    
    // Total de entradas
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM entradas");
    $stats['total_entradas'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Entradas por situação
    $stmt = $pdo->query("
        SELECT SITUACAO, COUNT(*) as total 
        FROM entradas 
        WHERE SITUACAO IS NOT NULL AND SITUACAO != '' 
        GROUP BY SITUACAO 
        ORDER BY total DESC
    ");
    $stats['por_situacao'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Entradas por tipo
    $stmt = $pdo->query("
        SELECT TIPO, COUNT(*) as total 
        FROM entradas 
        WHERE TIPO IS NOT NULL AND TIPO != '' 
        GROUP BY TIPO 
        ORDER BY total DESC
    ");
    $stats['por_tipo'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Entradas por marca
    $stmt = $pdo->query("
        SELECT MARCA, COUNT(*) as total 
        FROM entradas 
        WHERE MARCA IS NOT NULL AND MARCA != '' 
        GROUP BY MARCA 
        ORDER BY total DESC 
        LIMIT 10
    ");
    $stats['por_marca'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Entradas por seguradora
    $stmt = $pdo->query("
        SELECT SEGURADORA, COUNT(*) as total 
        FROM entradas 
        WHERE SEGURADORA IS NOT NULL AND SEGURADORA != '' 
        GROUP BY SEGURADORA 
        ORDER BY total DESC 
        LIMIT 10
    ");
    $stats['por_seguradora'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Entradas por mês (últimos 12 meses)
    $stmt = $pdo->query("
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as mes,
            COUNT(*) as total
        FROM entradas 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY mes DESC
    ");
    $stats['por_mes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Entradas por colaborador
    $stmt = $pdo->query("
        SELECT 
            c.nome as colaborador,
            COUNT(e.Id_Entrada) as total
        FROM entradas e
        LEFT JOIN colaboradores c ON e.ID_COLABORADOR = c.Id_Colaborador
        GROUP BY e.ID_COLABORADOR, c.nome
        ORDER BY total DESC
        LIMIT 10
    ");
    $stats['por_colaborador'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Entradas criadas hoje
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM entradas WHERE DATE(created_at) = CURDATE()");
    $stats['hoje'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Entradas criadas esta semana
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM entradas WHERE WEEK(created_at) = WEEK(NOW()) AND YEAR(created_at) = YEAR(NOW())");
    $stats['esta_semana'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Entradas criadas este mês
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM entradas WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())");
    $stats['este_mes'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Log das estatísticas
    logSimples('entradas_statistics', [
        'total_entradas' => $stats['total_entradas'],
        'usuario' => $usuario['Usuario']
    ]);
    
    respostaJson(true, $stats, 'Estatísticas obtidas com sucesso');
    
} catch (Exception $e) {
    logSimples('error', [
        'endpoint' => 'entradas-statistics',
        'erro' => $e->getMessage(),
        'usuario' => $usuario['Usuario'] ?? 'N/A'
    ]);
    
    respostaJson(false, null, 'Erro ao obter estatísticas: ' . $e->getMessage(), 500);
}

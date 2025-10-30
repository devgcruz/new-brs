<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint: GET /usuarios/statistics
 * Estatísticas dos usuários
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

// Verificar autenticação e permissão
$usuario = middlewarePermissao('usuarios');

try {
    $stats = [];
    
    // Total de usuários
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios");
    $stats['total'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Usuários ativos
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios WHERE status = 'ativo'");
    $stats['ativos'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Usuários inativos
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios WHERE status = 'inativo'");
    $stats['inativos'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Usuários por nível
    $stmt = $pdo->query("
        SELECT nivel, COUNT(*) as total 
        FROM usuarios 
        WHERE nivel IS NOT NULL AND nivel != '' 
        GROUP BY nivel 
        ORDER BY total DESC
    ");
    $stats['por_nivel'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Usuários criados por mês (últimos 12 meses)
    $stmt = $pdo->query("
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as mes,
            COUNT(*) as total
        FROM usuarios 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY mes DESC
    ");
    $stats['por_mes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Usuários com último acesso recente (últimos 30 dias)
    $stmt = $pdo->query("
        SELECT COUNT(*) as total 
        FROM usuarios 
        WHERE ultimo_acesso >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ");
    $stats['acesso_recente'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Usuários sem acesso há mais de 90 dias
    $stmt = $pdo->query("
        SELECT COUNT(*) as total 
        FROM usuarios 
        WHERE ultimo_acesso < DATE_SUB(NOW(), INTERVAL 90 DAY) 
        OR ultimo_acesso IS NULL
    ");
    $stats['sem_acesso_longo'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Usuários criados hoje
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios WHERE DATE(created_at) = CURDATE()");
    $stats['hoje'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Usuários criados esta semana
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios WHERE WEEK(created_at) = WEEK(NOW()) AND YEAR(created_at) = YEAR(NOW())");
    $stats['esta_semana'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Usuários criados este mês
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())");
    $stats['este_mes'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Percentual de usuários ativos
    $stats['percentual_ativos'] = $stats['total'] > 0 ? round(($stats['ativos'] / $stats['total']) * 100, 2) : 0;
    
    // Log das estatísticas
    logSimples('usuarios_statistics', [
        'total_usuarios' => $stats['total'],
        'usuarios_ativos' => $stats['ativos'],
        'usuario' => $usuario['Usuario']
    ]);
    
    respostaJson(true, $stats, 'Estatísticas obtidas com sucesso');
    
} catch (Exception $e) {
    logSimples('error', [
        'endpoint' => 'usuarios-statistics',
        'erro' => $e->getMessage(),
        'usuario' => $usuario['Usuario'] ?? 'N/A'
    ]);
    
    respostaJson(false, null, 'Erro ao obter estatísticas: ' . $e->getMessage(), 500);
}

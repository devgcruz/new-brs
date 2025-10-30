<?php
/**
 * Sistema de Roteamento Principal
 * Substitui routes/api.php do Laravel
 */

// Incluir configuração CORS centralizada
require_once __DIR__ . '/config/cors.php';

// Obter endpoint da URL
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Remover /brs/api/ ou /api/ da URL
$path = preg_replace('#^/brs/api/#', '', $path);
$path = preg_replace('#^/api/#', '', $path);
$path = trim($path, '/');

// Se não especificou endpoint, usar query parameter
if (empty($path)) {
    $path = $_GET['endpoint'] ?? '';
}

$method = $_SERVER['REQUEST_METHOD'];

// Mapeamento de rotas
$routes = [
    // Rotas públicas
    'login' => 'endpoints/login.php',
    'register' => 'endpoints/register.php',
    'health' => 'endpoints/health.php',
    
    // Rotas protegidas
    'logout' => 'endpoints/logout.php',
    'me' => 'endpoints/me.php',
    'check-permission' => 'endpoints/check-permission.php',
    
    // Perfil do usuário
    'profile' => 'endpoints/profile.php',
    'profile/change-password' => 'endpoints/profile-change-password.php',
    
    // CRUD endpoints
    'entradas' => 'endpoints/entradas.php',
    'usuarios' => 'endpoints/usuarios.php',
    'colaboradores' => 'endpoints/colaboradores.php',
    'prestadores' => 'endpoints/prestadores.php',
    'marcas' => 'endpoints/marcas.php',
    'posicoes' => 'endpoints/posicoes.php',
    'seguradoras' => 'endpoints/seguradoras.php',
    'financeiro' => 'endpoints/financeiro.php',
    'relatorios-financeiros' => 'endpoints/relatorios-financeiros.php',
    'judicial' => 'endpoints/judicial.php',
    'pdfs' => 'endpoints/pdfs.php',
    'observacoes' => 'endpoints/observacoes.php',
    'upload-stats' => 'endpoints/upload-stats.php',
    
    // Estatísticas específicas
    'financeiro/statistics' => 'endpoints/financeiro-statistics.php',
    'judicial/statistics' => 'endpoints/judicial-statistics.php',
    'prestadores/statistics' => 'endpoints/prestadores-statistics.php',
    
    // Dashboard Analytics
    'dashboard/montadoras' => 'endpoints/dashboard-montadoras.php',
    'dashboard/tiposervico' => 'endpoints/dashboard-tiposervico.php',
    'dashboard/situacao' => 'endpoints/dashboard-situacao.php',
    'dashboard/evolucao-entradas' => 'endpoints/dashboard-evolucao-entradas.php',
    'dashboard/evolucao-honorarios' => 'endpoints/dashboard-evolucao-honorarios.php',
    'dashboard/evolucao-despesas' => 'endpoints/dashboard-evolucao-despesas.php',
    
    // Form data
    'form-data/registros' => 'endpoints/form-data-registros.php',
    
    // Funcionalidades específicas de Entradas
    'entradas/check-placa' => 'endpoints/entradas-check-placa.php',
    'entradas/statistics' => 'endpoints/entradas-statistics.php',
    
    // Funcionalidades específicas de Usuários
    'usuarios/roles' => 'endpoints/usuarios-roles.php',
    'usuarios/statistics' => 'endpoints/usuarios-statistics.php',
    
    // Funcionalidades específicas de Financeiro
    'financeiro/entrada' => 'endpoints/financeiro-by-entrada.php',
    'financeiros/status' => 'endpoints/financeiro-status-update.php',
    
    // Funcionalidades específicas de Judicial
    'judicial/entrada' => 'endpoints/judicial-by-entrada.php',
    
    // Rota pública de PDF
    'pdfs/view' => 'endpoints/pdfs-view.php',
];

// Verificar se a rota existe
if (!isset($routes[$path])) {
    // Tentar roteamento dinâmico para rotas aninhadas
    $endpoint_file = null;
    
    // Padrões de rotas aninhadas
    if (preg_match('/^entradas\/(\d+)\/financeiros$/', $path, $matches)) {
        $entrada_id = $matches[1];
        $endpoint_file = 'endpoints/entradas-financeiros.php';
        $_GET['entrada_id'] = $entrada_id;
    } elseif (preg_match('/^entradas\/(\d+)\/observacoes$/', $path, $matches)) {
        $entrada_id = $matches[1];
        $endpoint_file = 'endpoints/entradas-observacoes.php';
        $_GET['entrada_id'] = $entrada_id;
    } elseif (preg_match('/^entradas\/(\d+)$/', $path, $matches)) {
        $entrada_id = $matches[1];
        $endpoint_file = 'endpoints/entradas.php';
        $_GET['id'] = $entrada_id;
    } elseif (preg_match('/^usuarios\/(\d+)\/toggle-status$/', $path, $matches)) {
        $usuario_id = $matches[1];
        $endpoint_file = 'endpoints/usuarios-toggle-status.php';
        $_GET['usuario_id'] = $usuario_id;
    } elseif (preg_match('/^usuarios\/(\d+)\/change-password$/', $path, $matches)) {
        $usuario_id = $matches[1];
        $endpoint_file = 'endpoints/usuarios-change-password.php';
        $_GET['usuario_id'] = $usuario_id;
    } elseif (preg_match('/^financeiro\/entrada\/(\d+)$/', $path, $matches)) {
        $entrada_id = $matches[1];
        $endpoint_file = 'endpoints/financeiro-by-entrada.php';
        $_GET['entrada_id'] = $entrada_id;
    } elseif (preg_match('/^judicial\/entrada\/(\d+)$/', $path, $matches)) {
        $entrada_id = $matches[1];
        $endpoint_file = 'endpoints/judicial-by-entrada.php';
        $_GET['entrada_id'] = $entrada_id;
    } elseif (preg_match('/^financeiro\/(\d+)$/', $path, $matches)) {
        $financeiro_id = $matches[1];
        $endpoint_file = 'endpoints/financeiro.php';
        $_GET['id'] = $financeiro_id;
    } elseif (preg_match('/^financeiros\/(\d+)\/status$/', $path, $matches)) {
        $financeiro_id = $matches[1];
        $endpoint_file = 'endpoints/financeiro-status-update.php';
        $_GET['financeiro_id'] = $financeiro_id;
    } elseif (preg_match('/^financeiros\/(\d+)\/observacoes$/', $path, $matches)) {
        $financeiro_id = $matches[1];
        $endpoint_file = 'endpoints/financeiros-observacoes.php';
        $_GET['financeiro_id'] = $financeiro_id;
    } elseif (preg_match('/^observacoes-financeiro\/(\d+)$/', $path, $matches)) {
        $observacao_id = $matches[1];
        $endpoint_file = 'endpoints/observacoes-financeiro.php';
        $_GET['id'] = $observacao_id;
    } elseif (preg_match('/^pdfs\/(\d+)\/view$/', $path, $matches)) {
        $pdf_id = $matches[1];
        $endpoint_file = 'endpoints/pdfs-view.php';
        $_GET['pdf_id'] = $pdf_id;
    } elseif (preg_match('/^observacoes\/(\d+)$/', $path, $matches)) {
        $observacao_id = $matches[1];
        $endpoint_file = 'endpoints/observacoes.php';
        $_GET['id'] = $observacao_id;
    } elseif (preg_match('/^pdfs\/(\d+)$/', $path, $matches)) {
        $pdf_id = $matches[1];
        $endpoint_file = 'endpoints/pdfs.php';
        $_GET['id'] = $pdf_id;
    }
    
    if (!$endpoint_file) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'erro' => 'Endpoint não encontrado',
            'message' => "Rota '$path' não existe"
        ]);
        exit;
    }
} else {
    $endpoint_file = $routes[$path];
}

// Incluir o arquivo do endpoint
if (file_exists($endpoint_file)) {
    require_once $endpoint_file;
} else {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'erro' => 'Arquivo de endpoint não encontrado',
        'message' => "Arquivo '$endpoint_file' não existe"
    ]);
    exit;
}

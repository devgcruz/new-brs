<?php
/**
 * Configuração CORS centralizada
 * Headers CORS são definidos aqui para evitar duplicação
 */

// Prevenir múltiplas inclusões do CORS
if (defined('CORS_HEADERS_SENT')) {
    return;
}
define('CORS_HEADERS_SENT', true);

// Carregar configurações de ambiente se não estiverem definidas
if (!defined('ALLOWED_ORIGINS')) {
    require_once __DIR__ . '/environment.php';
}

// Usar origens permitidas da configuração de ambiente
$allowed_origins = ALLOWED_ORIGINS;

// Obter a origem da requisição (ex: https://brsreguladora.com.br)
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Se não houver HTTP_ORIGIN, verificar Referer como fallback
if (empty($origin) && isset($_SERVER['HTTP_REFERER'])) {
    $referer_parts = parse_url($_SERVER['HTTP_REFERER']);
    if ($referer_parts) {
        $referer = $referer_parts['scheme'] . '://' . $referer_parts['host'];
        if (isset($referer_parts['port'])) {
            $referer .= ':' . $referer_parts['port'];
        }
        $origin = $referer;
    }
}

// Em desenvolvimento, permitir localhost mesmo sem HTTP_ORIGIN
if (defined('PRODUCTION_MODE') && !PRODUCTION_MODE && empty($origin)) {
    // Tentar detectar a origem do cliente
    if (isset($_SERVER['HTTP_REFERER'])) {
        $referer_parts = parse_url($_SERVER['HTTP_REFERER']);
        if ($referer_parts && isset($referer_parts['host'])) {
            $origin = $referer_parts['scheme'] . '://' . $referer_parts['host'];
            if (isset($referer_parts['port'])) {
                $origin .= ':' . $referer_parts['port'];
            }
        }
    }
    // Se ainda não tiver origem, usar localhost:3000 como padrão em desenvolvimento
    if (empty($origin)) {
        $origin = 'http://localhost:3000';
    }
}

// Remover qualquer header CORS existente para evitar duplicação
@header_remove('Access-Control-Allow-Origin');
@header_remove('Access-Control-Allow-Methods');
@header_remove('Access-Control-Allow-Headers');
@header_remove('Access-Control-Allow-Credentials');
@header_remove('Access-Control-Max-Age');

// Log para debug em desenvolvimento
if (defined('DEBUG_MODE') && DEBUG_MODE) {
    error_log("CORS Debug - Origin recebida: $origin");
    error_log("CORS Debug - Origins permitidas: " . json_encode($allowed_origins));
    error_log("CORS Debug - HTTP_ORIGIN: " . ($_SERVER['HTTP_ORIGIN'] ?? 'não definido'));
    error_log("CORS Debug - HTTP_REFERER: " . ($_SERVER['HTTP_REFERER'] ?? 'não definido'));
}

// Verificar se a origem está na lista de permitidas OU se estamos em desenvolvimento
$origin_allowed = false;
$final_origin = '';

if (!empty($origin)) {
    // Verificar se está na lista
    if (in_array($origin, $allowed_origins)) {
        $origin_allowed = true;
        $final_origin = $origin;
    }
    // Em desenvolvimento, permitir qualquer localhost
    if (defined('PRODUCTION_MODE') && !PRODUCTION_MODE) {
        if (strpos($origin, 'http://localhost') === 0 || strpos($origin, 'http://127.0.0.1') === 0) {
            $origin_allowed = true;
            $final_origin = $origin;
        }
    }
}

// Em desenvolvimento, se não tiver origem, usar a primeira da lista de permitidas
if (!$origin_allowed && defined('PRODUCTION_MODE') && !PRODUCTION_MODE && !empty($allowed_origins)) {
    $origin_allowed = true;
    $final_origin = $allowed_origins[0]; // Usar primeiro localhost permitido
}

if ($origin_allowed && !empty($final_origin)) {
    // Se estiver, definir todos os headers CORS
    // IMPORTANTE: Usar header_remove antes para garantir que não há duplicação
    @header_remove('Access-Control-Allow-Origin');
    header("Access-Control-Allow-Origin: " . $final_origin, false);
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS", false);
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, Accept", false);
    header("Access-Control-Allow-Credentials: true", false);
    header("Access-Control-Max-Age: 86400", false);
    
    // Log em desenvolvimento
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        error_log("CORS - Headers enviados para origem: $final_origin");
    }
    
    // Lidar com requisições "preflight" (OPTIONS)
    // O browser envia uma requisição OPTIONS antes de POST/PUT/DELETE para verificar as permissões
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        // Parar a execução do script aqui para requisições OPTIONS
        exit;
    }
} else {
    // Se a origem não for permitida, não enviamos os headers CORS.
    // O browser irá bloquear a requisição.
    // Para requisições OPTIONS, retornar 403
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(403);
        exit;
    }
    
    // Em desenvolvimento, logar o erro mas ainda permitir
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        error_log("CORS WARNING - Origem não encontrada: $origin, mas em desenvolvimento, permitindo mesmo assim");
        // Em desenvolvimento, permitir mesmo sem origem definida
        if (defined('PRODUCTION_MODE') && !PRODUCTION_MODE) {
            $final_origin = !empty($allowed_origins) ? $allowed_origins[0] : 'http://localhost:3000';
            @header_remove('Access-Control-Allow-Origin');
            header("Access-Control-Allow-Origin: " . $final_origin, false);
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS", false);
            header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, Accept", false);
            header("Access-Control-Allow-Credentials: true", false);
            header("Access-Control-Max-Age: 86400", false);
        }
    }
}

// Definir Content-Type padrão para todas as outras requisições (ex: GET, POST)
if (!headers_sent()) {
    header("Content-Type: application/json; charset=utf-8");
}
?>

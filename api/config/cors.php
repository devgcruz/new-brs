<?php
/**
 * CORS é tratado no Apache (.htaccess) em ambiente de desenvolvimento.
 * Este arquivo evita definir cabeçalhos CORS para não duplicar valores.
 */

// Carregar configurações de ambiente se não estiverem definidas
if (!defined('ALLOWED_ORIGINS')) {
    require_once __DIR__ . '/environment.php';
}

// Tratar requisições preflight no PHP apenas como fallback (Apache já retorna 204)
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Não definir headers CORS aqui para evitar duplicidade com Apache.
// Conteúdo JSON será definido pelos endpoints conforme necessário.
?>
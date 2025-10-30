<?php
/**
 * Middleware de autenticação
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

require_once API_BASE_DIR . '/config/db.php';
require_once API_BASE_DIR . '/helpers/auth.php';

function middlewareAutenticacao() {
    global $pdo;
    $usuario = verificarAutenticacao($pdo);
    
    if (!$usuario) {
        respostaJson(false, null, 'Token de autenticação inválido ou expirado', 401);
    }
    
    return $usuario;
}

function middlewarePermissao($permissao) {
    $usuario = middlewareAutenticacao();
    
    if (!verificarPermissao($usuario, $permissao)) {
        respostaJson(false, null, 'Permissão insuficiente', 403);
    }
    
    return $usuario;
}

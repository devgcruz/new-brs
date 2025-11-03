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
    
    try {
        $usuario = verificarAutenticacao($pdo);
        
        if (!$usuario) {
            error_log("❌ Autenticação falhou: token inválido ou expirado");
            respostaJson(false, null, 'Token de autenticação inválido ou expirado. Faça login novamente.', 401);
        }
        
        return $usuario;
    } catch (Exception $e) {
        error_log("❌ Exceção na autenticação: " . $e->getMessage());
        respostaJson(false, null, 'Erro na verificação de autenticação: ' . $e->getMessage(), 401);
    }
}

function middlewarePermissao($permissao) {
    $usuario = middlewareAutenticacao();
    
    if (!verificarPermissao($usuario, $permissao)) {
        respostaJson(false, null, 'Permissão insuficiente', 403);
    }
    
    return $usuario;
}

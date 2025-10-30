<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint para verificar permissão do usuário
 * Substitui AuthController@checkPermission do Laravel
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

header("Content-Type: application/json");


require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/middleware/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    respostaJson(false, null, 'Método não permitido', 405);
}

// Verificar autenticação
$usuario = middlewareAutenticacao();

// Obter permissão da URL
$permissao = $_GET['permission'] ?? '';

if (empty($permissao)) {
    respostaJson(false, null, 'Permissão não especificada', 400);
}

$hasPermission = verificarPermissao($usuario, $permissao);

respostaJson(true, [
    'permission' => $permissao,
    'has_permission' => $hasPermission
]);

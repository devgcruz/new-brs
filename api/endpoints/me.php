<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint para obter dados do usuário autenticado
 * Substitui AuthController@me do Laravel
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

// Retornar dados do usuário (sem senha e token)
unset($usuario['Senha']);
unset($usuario['token']);

respostaJson(true, [
    'id' => $usuario['id'],
    'nome' => $usuario['nome'],
    'usuario' => $usuario['Usuario'],
    'email' => $usuario['email'],
    'nivel' => $usuario['nivel'],
    'permissoes' => json_decode($usuario['permissoes'] ?? '[]', true),
    'status' => $usuario['status'],
    'ultimo_acesso' => $usuario['ultimo_acesso'],
    'profile_photo_path' => $usuario['profile_photo_path']
]);

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

// Buscar roles do usuário
$roles = [];
try {
    $roles_sql = "
        SELECT r.id, r.name 
        FROM roles r
        INNER JOIN model_has_roles mhr ON r.id = mhr.role_id
        WHERE mhr.model_id = :user_id 
        AND (mhr.model_type = :model_type1 OR mhr.model_type = :model_type2 OR mhr.model_type = :model_type3)
    ";
    $roles_stmt = $pdo->prepare($roles_sql);
    $roles_stmt->execute([
        'user_id' => $usuario['id'],
        'model_type1' => 'App\Models\User',
        'model_type2' => 'App\\Models\\User',
        'model_type3' => 'User'
    ]);
    $roles = $roles_stmt->fetchAll();
} catch (Exception $e) {
    // Se não existir tabela roles, continuar sem roles
}

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
    'roles' => array_column($roles, 'name'), // Array de nomes dos roles
    'status' => $usuario['status'],
    'ultimo_acesso' => $usuario['ultimo_acesso'],
    'profile_photo_path' => $usuario['profile_photo_path']
]);

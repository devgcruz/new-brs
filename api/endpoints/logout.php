<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Logout
 * Substitui AuthController@logout do Laravel
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

header("Content-Type: application/json");


require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/middleware/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    respostaJson(false, null, 'Método não permitido', 405);
}

// Verificar autenticação
$usuario = middlewareAutenticacao();

try {
    // Remover token do banco
    $stmt = $pdo->prepare("UPDATE usuarios SET token = NULL WHERE id = :id");
    $stmt->execute(['id' => $usuario['id']]);
    
    logSimples('✅ Logout realizado', ['usuario' => $usuario['Usuario']]);
    
    respostaJson(true, null, 'Logout realizado com sucesso');
    
} catch (Exception $e) {
    logSimples('❌ Erro no logout', ['erro' => $e->getMessage()]);
    respostaJson(false, null, 'Erro interno do servidor', 500);
}

<?php
/**
 * Endpoint de Login
 * Substitui AuthController@login do Laravel
 */

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    respostaJson(false, null, 'Método não permitido', 405);
}

// Receber dados JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    respostaJson(false, null, 'Dados JSON inválidos', 400);
}

// Validar dados obrigatórios
validarDadosObrigatorios($data, ['usuario', 'senha']);

$usuario = sanitizar($data['usuario']);
$senha = $data['senha']; // Não sanitizar senha para não quebrar hash

logSimples('🔐 Tentativa de login', ['usuario' => $usuario]);

try {
    // Buscar usuário
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE Usuario = :usuario LIMIT 1");
    $stmt->execute(['usuario' => $usuario]);
    $user = $stmt->fetch();
    
    if (!$user) {
        logSimples('👤 Usuário não encontrado', ['usuario' => $usuario]);
        respostaJson(false, null, 'As credenciais fornecidas estão incorretas.', 401);
    }
    
    // Verificar senha
    if (!password_verify($senha, $user['Senha'])) {
        logSimples('🔒 Senha incorreta', ['usuario' => $usuario]);
        respostaJson(false, null, 'As credenciais fornecidas estão incorretas.', 401);
    }
    
    // Verificar status
    if ($user['status'] !== 'ativo') {
        logSimples('❌ Usuário inativo', ['usuario' => $usuario]);
        respostaJson(false, null, 'Sua conta está inativa. Entre em contato com o administrador.', 401);
    }
    
    // Gerar token
    $token = gerarToken($user['id']);
    
    // Salvar token no banco (simplificado)
    $stmt = $pdo->prepare("UPDATE usuarios SET token = :token, ultimo_acesso = NOW() WHERE id = :id");
    $stmt->execute(['token' => $token, 'id' => $user['id']]);
    
    logSimples('✅ Login bem-sucedido', ['usuario' => $usuario, 'token' => substr($token, 0, 20) . '...']);
    
    // Retornar dados do usuário (sem senha)
    unset($user['Senha']);
    unset($user['token']);
    
    respostaJson(true, [
        'user' => [
            'id' => $user['id'],
            'nome' => $user['nome'],
            'usuario' => $user['Usuario'],
            'email' => $user['email'],
            'nivel' => $user['nivel'],
            'permissoes' => json_decode($user['permissoes'] ?? '[]', true),
            'status' => $user['status'],
            'ultimo_acesso' => $user['ultimo_acesso'],
            'profile_photo_path' => $user['profile_photo_path']
        ],
        'token' => $token
    ], 'Login realizado com sucesso');
    
} catch (Exception $e) {
    logSimples('❌ Erro no login', ['erro' => $e->getMessage()]);
    respostaJson(false, null, 'Erro interno do servidor', 500);
}

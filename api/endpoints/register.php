<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Registro de Usuários
 * Substitui RegisterController do Laravel
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

header("Content-Type: application/json");


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
validarDadosObrigatorios($data, ['nome', 'email', 'senha', 'senha_confirmation']);

// Validações específicas
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    respostaJson(false, null, 'Email inválido', 400);
}

if (strlen($data['senha']) < 8) {
    respostaJson(false, null, 'Senha deve ter pelo menos 8 caracteres', 400);
}

if ($data['senha'] !== $data['senha_confirmation']) {
    respostaJson(false, null, 'Confirmação de senha não confere', 400);
}

$nome = sanitizar($data['nome']);
$email = sanitizar($data['email']);
$senha = $data['senha']; // Não sanitizar senha para não quebrar hash

logSimples('📝 Tentativa de registro', ['email' => $email]);

try {
    // Verificar se email já existe
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = :email OR Usuario = :email LIMIT 1");
    $stmt->execute(['email' => $email]);
    
    if ($stmt->fetch()) {
        respostaJson(false, null, 'Email já está em uso', 400);
    }
    
    // Criar usuário
    $sql = "INSERT INTO usuarios (
        nome, Usuario, email, Senha, nivel, cargo, permissoes, status, 
        ultimo_acesso, created_at, updated_at
    ) VALUES (
        :nome, :usuario, :email, :senha, :nivel, :cargo, :permissoes, :status,
        NOW(), NOW(), NOW()
    )";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'nome' => $nome,
        'usuario' => $email, // Usando email como usuário
        'email' => $email,
        'senha' => password_hash($senha, PASSWORD_DEFAULT),
        'nivel' => 'Usuario',
        'cargo' => 'Usuário',
        'permissoes' => json_encode(['dashboard']), // Permissões básicas
        'status' => 'ativo'
    ]);
    
    $usuario_id = $pdo->lastInsertId();
    
    logSimples('✅ Usuário registrado', [
        'usuario_id' => $usuario_id,
        'email' => $email,
        'nome' => $nome
    ]);
    
    respostaJson(true, [
        'id' => $usuario_id,
        'nome' => $nome,
        'email' => $email,
        'usuario' => $email,
        'nivel' => 'Usuario',
        'status' => 'ativo'
    ], 'Usuário cadastrado com sucesso!', 201);
    
} catch (Exception $e) {
    logSimples('❌ Erro no registro', ['erro' => $e->getMessage()]);
    respostaJson(false, null, 'Erro interno do servidor', 500);
}

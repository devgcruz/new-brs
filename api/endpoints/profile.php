<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Perfil de Usuário
 * Substitui ProfileController do Laravel
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

header("Content-Type: application/json");


require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

// Verificar autenticação para todas as operações
$usuario = middlewareAutenticacao();

switch ($method) {
    case 'GET':
        // Obter dados do perfil
        respostaJson(true, [
            'id' => $usuario['id'],
            'nome' => $usuario['nome'],
            'email' => $usuario['email'],
            'usuario' => $usuario['Usuario'],
            'nivel' => $usuario['nivel'],
            'cargo' => $usuario['cargo'],
            'status' => $usuario['status'],
            'profile_photo_path' => $usuario['profile_photo_path'],
            'profile_photo_url' => $usuario['profile_photo_path'] ? 
                "/api/uploads/profile-photos/" . basename($usuario['profile_photo_path']) : null,
            'ultimo_acesso' => $usuario['ultimo_acesso'],
            'created_at' => $usuario['created_at']
        ]);
        break;
        
    case 'POST':
        // Atualizar perfil
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        try {
            $campos_update = [];
            $params = ['id' => $usuario['id']];
            
            // Atualizar nome se fornecido
            if (isset($data['nome']) && !empty($data['nome'])) {
                $campos_update[] = "nome = :nome";
                $params['nome'] = sanitizar($data['nome']);
            }
            
            // Atualizar email se fornecido
            if (isset($data['email']) && !empty($data['email'])) {
                if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                    respostaJson(false, null, 'Email inválido', 400);
                }
                
                // Verificar se email já existe em outro usuário
                $check_stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = :email AND id != :id LIMIT 1");
                $check_stmt->execute(['email' => $data['email'], 'id' => $usuario['id']]);
                
                if ($check_stmt->fetch()) {
                    respostaJson(false, null, 'Email já está em uso', 400);
                }
                
                $campos_update[] = "email = :email";
                $campos_update[] = "Usuario = :usuario"; // Atualizar também o campo Usuario
                $params['email'] = sanitizar($data['email']);
                $params['usuario'] = sanitizar($data['email']);
            }
            
            if (empty($campos_update)) {
                respostaJson(false, null, 'Nenhum campo válido para atualizar', 400);
            }
            
            $campos_update[] = "updated_at = NOW()";
            
            $sql = "UPDATE usuarios SET " . implode(', ', $campos_update) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            logSimples('✅ Perfil atualizado', [
                'usuario_id' => $usuario['id'],
                'usuario' => $usuario['Usuario']
            ]);
            
            respostaJson(true, null, 'Perfil atualizado com sucesso!');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao atualizar perfil', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao atualizar perfil', 500);
        }
        break;
        
    default:
        respostaJson(false, null, 'Método não permitido', 405);
}

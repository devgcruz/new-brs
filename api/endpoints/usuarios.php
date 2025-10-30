<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Usuários
 * Substitui UsuarioController do Laravel
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

// Verificar autenticação e permissão de usuários
$usuario = middlewarePermissao('usuarios');

switch ($method) {
    case 'GET':
        // Listar usuários
        $page = (int)($_GET['page'] ?? 1);
        $per_page = (int)($_GET['per_page'] ?? 15);
        $offset = ($page - 1) * $per_page;
        
        try {
            // Contar total
            $count_stmt = $pdo->query("SELECT COUNT(*) as total FROM usuarios");
            $total = $count_stmt->fetch()['total'];
            
            // Buscar usuários
            $sql = "SELECT id, nome, Usuario, email, nivel, permissoes, status, ultimo_acesso, created_at FROM usuarios ORDER BY id DESC LIMIT :offset, :per_page";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->bindValue(':per_page', $per_page, PDO::PARAM_INT);
            $stmt->execute();
            $usuarios = $stmt->fetchAll();
            
            // Converter permissoes de JSON para array
            foreach ($usuarios as &$user) {
                $user['permissoes'] = json_decode($user['permissoes'] ?? '[]', true);
            }
            
            $last_page = ceil($total / $per_page);
            
            respostaJson(true, [
                'data' => $usuarios,
                'meta' => [
                    'current_page' => $page,
                    'last_page' => $last_page,
                    'per_page' => $per_page,
                    'total' => $total,
                    'from' => $offset + 1,
                    'to' => min($offset + $per_page, $total)
                ]
            ]);
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao listar usuários', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao buscar usuários', 500);
        }
        break;
        
    case 'POST':
        // Criar novo usuário
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        validarDadosObrigatorios($data, ['nome', 'Usuario', 'senha', 'email']);
        
        try {
            // Verificar se usuário já existe
            $check_stmt = $pdo->prepare("SELECT id FROM usuarios WHERE Usuario = :usuario");
            $check_stmt->execute(['usuario' => $data['Usuario']]);
            
            if ($check_stmt->fetch()) {
                respostaJson(false, null, 'Usuário já existe', 400);
            }
            
            $sql = "INSERT INTO usuarios (nome, Usuario, Senha, email, nivel, permissoes, status, created_at, updated_at) VALUES (:nome, :usuario, :senha, :email, :nivel, :permissoes, :status, NOW(), NOW())";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'nome' => sanitizar($data['nome']),
                'usuario' => sanitizar($data['Usuario']),
                'senha' => password_hash($data['senha'], PASSWORD_DEFAULT),
                'email' => sanitizar($data['email']),
                'nivel' => sanitizar($data['nivel'] ?? 'Usuario'),
                'permissoes' => json_encode($data['permissoes'] ?? []),
                'status' => sanitizar($data['status'] ?? 'ativo')
            ]);
            
            $usuario_id = $pdo->lastInsertId();
            
            logSimples('✅ Novo usuário criado', ['usuario_id' => $usuario_id, 'usuario' => $data['Usuario']]);
            
            respostaJson(true, ['id' => $usuario_id], 'Usuário criado com sucesso', 201);
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao criar usuário', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao criar usuário', 500);
        }
        break;
        
    case 'PUT':
        // Atualizar usuário
        $usuario_id = $_GET['id'] ?? '';
        
        if (empty($usuario_id)) {
            respostaJson(false, null, 'ID do usuário não especificado', 400);
        }
        
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        try {
            $campos_update = [];
            $params = ['id' => $usuario_id];
            
            foreach ($data as $campo => $valor) {
                if (in_array($campo, ['nome', 'Usuario', 'email', 'nivel', 'permissoes', 'status'])) {
                    $campos_update[] = "$campo = :$campo";
                    if ($campo === 'permissoes') {
                        $params[$campo] = json_encode($valor);
                    } else {
                        $params[$campo] = sanitizar($valor);
                    }
                }
            }
            
            if (empty($campos_update)) {
                respostaJson(false, null, 'Nenhum campo válido para atualizar', 400);
            }
            
            $campos_update[] = "updated_at = NOW()";
            
            $sql = "UPDATE usuarios SET " . implode(', ', $campos_update) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            logSimples('✅ Usuário atualizado', ['usuario_id' => $usuario_id]);
            
            respostaJson(true, null, 'Usuário atualizado com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao atualizar usuário', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao atualizar usuário', 500);
        }
        break;
        
    case 'DELETE':
        // Deletar usuário
        $usuario_id = $_GET['id'] ?? '';
        
        if (empty($usuario_id)) {
            respostaJson(false, null, 'ID do usuário não especificado', 400);
        }
        
        // Não permitir deletar a si mesmo
        if ($usuario_id == $usuario['id']) {
            respostaJson(false, null, 'Não é possível deletar seu próprio usuário', 400);
        }
        
        try {
            // Verificar se existe
            $check_stmt = $pdo->prepare("SELECT id FROM usuarios WHERE id = :id");
            $check_stmt->execute(['id' => $usuario_id]);
            
            if (!$check_stmt->fetch()) {
                respostaJson(false, null, 'Usuário não encontrado', 404);
            }
            
            // Deletar usuário
            $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = :id");
            $stmt->execute(['id' => $usuario_id]);
            
            logSimples('✅ Usuário deletado', ['usuario_id' => $usuario_id]);
            
            respostaJson(true, null, 'Usuário deletado com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao deletar usuário', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao deletar usuário', 500);
        }
        break;
        
    default:
        respostaJson(false, null, 'Método não permitido', 405);
}

<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Usuários (CRUD Completo)
 * Protegido com middlewarePermissao('gerenciar-usuarios')
 */

header("Content-Type: application/json");

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

// Verificar autenticação e permissão
$usuario = middlewarePermissao('gerenciar-usuarios');

switch ($method) {
    case 'GET':
        // Listar usuários com paginação e busca
        $page = (int)($_GET['page'] ?? 1);
        $pageSize = (int)($_GET['pageSize'] ?? $_GET['per_page'] ?? 10);
        $search = sanitizar($_GET['search'] ?? '');
        $offset = ($page - 1) * $pageSize;
        
        try {
            $where_conditions = [];
            $params = [];
            
            if (!empty($search)) {
                $where_conditions[] = "(u.nome LIKE :search OR u.Usuario LIKE :search OR u.email LIKE :search)";
                $params['search'] = "%$search%";
            }
            
            $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
            
            // Contar total
            $count_sql = "SELECT COUNT(DISTINCT u.id) as total FROM usuarios u $where_clause";
            $count_stmt = $pdo->prepare($count_sql);
            foreach ($params as $key => $value) {
                $count_stmt->bindValue(":$key", $value);
            }
            $count_stmt->execute();
            $total = $count_stmt->fetch()['total'];
            
            // Buscar usuários com JOIN com roles
            $sql = "
                SELECT DISTINCT
                    u.id, u.nome, u.Usuario as username, u.email, u.status, 
                    u.created_at, u.updated_at, u.ultimo_acesso
                FROM usuarios u
                $where_clause
                ORDER BY u.id DESC
                LIMIT :offset, :pageSize
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->bindValue(':pageSize', $pageSize, PDO::PARAM_INT);
            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            $stmt->execute();
            $usuarios = $stmt->fetchAll();
            
            // Buscar roles para cada usuário
            foreach ($usuarios as &$user) {
                // Buscar roles do usuário (usando o formato correto do banco)
                $roles_sql = "
                    SELECT r.id, r.name 
                    FROM roles r
                    INNER JOIN model_has_roles mhr ON r.id = mhr.role_id
                    WHERE mhr.model_id = :user_id 
                    AND (mhr.model_type = :model_type1 OR mhr.model_type = :model_type2 OR mhr.model_type = :model_type3)
                ";
                $roles_stmt = $pdo->prepare($roles_sql);
                $roles_stmt->execute([
                    'user_id' => $user['id'],
                    'model_type1' => 'App\Models\User',   // Formato correto do banco
                    'model_type2' => 'App\\Models\\User', // Formato alternativo
                    'model_type3' => 'User'               // Formato simplificado
                ]);
                $user['roles'] = $roles_stmt->fetchAll();
            }
            
            $totalPages = ceil($total / $pageSize);
            
            respostaJson(true, [
                'data' => $usuarios,
                'meta' => [
                    'current_page' => $page,
                    'last_page' => $totalPages,
                    'per_page' => $pageSize,
                    'total' => $total,
                    'from' => $offset + 1,
                    'to' => min($offset + $pageSize, $total),
                    'totalPages' => $totalPages,
                    'totalItems' => $total
                ]
            ]);
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao listar usuários', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao buscar usuários: ' . $e->getMessage(), 500);
        }
        break;
        
    case 'POST':
        // Criar novo usuário com transação
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        // Validar campos obrigatórios
        $campos_obrigatorios = ['name', 'username', 'email', 'password'];
        validarDadosObrigatorios($data, $campos_obrigatorios);
        
        // Validar email
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            respostaJson(false, null, 'Email inválido', 400);
        }
        
        try {
            // Verificar se username já existe
            $check_username = $pdo->prepare("SELECT id FROM usuarios WHERE Usuario = :username");
            $check_username->execute(['username' => $data['username']]);
            if ($check_username->fetch()) {
                respostaJson(false, null, 'Username já está em uso', 422);
            }
            
            // Verificar se email já existe
            $check_email = $pdo->prepare("SELECT id FROM usuarios WHERE email = :email");
            $check_email->execute(['email' => $data['email']]);
            if ($check_email->fetch()) {
                respostaJson(false, null, 'Email já está em uso', 422);
            }
            
            // Iniciar transação
            $pdo->beginTransaction();
            
            // Inserir usuário
            $sql = "INSERT INTO usuarios (nome, Usuario, Senha, email, status, created_at, updated_at) 
                    VALUES (:nome, :username, :password, :email, 'ativo', NOW(), NOW())";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'nome' => sanitizar($data['name']),
                'username' => sanitizar($data['username']),
                'password' => password_hash($data['password'], PASSWORD_DEFAULT),
                'email' => sanitizar($data['email'])
            ]);
            
            $usuario_id = $pdo->lastInsertId();
            
            // Inserir roles (se fornecidos)
            if (!empty($data['roles']) && is_array($data['roles'])) {
                $roles_sql = "INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES (:role_id, :model_type, :model_id)";
                $roles_stmt = $pdo->prepare($roles_sql);
                
                foreach ($data['roles'] as $role_id) {
                    $roles_stmt->execute([
                        'role_id' => (int)$role_id,
                        'model_type' => 'App\Models\User',  // Formato correto usado no banco
                        'model_id' => $usuario_id
                    ]);
                }
            }
            
            // Commit transação
            $pdo->commit();
            
            logSimples('✅ Novo usuário criado', ['usuario_id' => $usuario_id, 'username' => $data['username']]);
            
            respostaJson(true, ['id' => $usuario_id], 'Usuário criado com sucesso', 201);
            
        } catch (Exception $e) {
            // Rollback em caso de erro
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            logSimples('❌ Erro ao criar usuário', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao criar usuário: ' . $e->getMessage(), 500);
        }
        break;
        
    case 'PUT':
        // Atualizar usuário com transação
        $usuario_id = $_GET['id'] ?? '';
        
        if (empty($usuario_id)) {
            respostaJson(false, null, 'ID do usuário não especificado', 400);
        }
        
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        // Validar email se fornecido
        if (isset($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            respostaJson(false, null, 'Email inválido', 400);
        }
        
        try {
            // Verificar se usuário existe
            $check_user = $pdo->prepare("SELECT id FROM usuarios WHERE id = :id");
            $check_user->execute(['id' => $usuario_id]);
            if (!$check_user->fetch()) {
                respostaJson(false, null, 'Usuário não encontrado', 404);
            }
            
            // Verificar duplicatas de username (se fornecido)
            if (isset($data['username'])) {
                $check_username = $pdo->prepare("SELECT id FROM usuarios WHERE Usuario = :username AND id != :id");
                $check_username->execute(['username' => $data['username'], 'id' => $usuario_id]);
                if ($check_username->fetch()) {
                    respostaJson(false, null, 'Username já está em uso', 422);
                }
            }
            
            // Verificar duplicatas de email (se fornecido)
            if (isset($data['email'])) {
                $check_email = $pdo->prepare("SELECT id FROM usuarios WHERE email = :email AND id != :id");
                $check_email->execute(['email' => $data['email'], 'id' => $usuario_id]);
                if ($check_email->fetch()) {
                    respostaJson(false, null, 'Email já está em uso', 422);
                }
            }
            
            // Iniciar transação
            $pdo->beginTransaction();
            
            // Atualizar usuário
            $campos_update = [];
            $params = ['id' => $usuario_id];
            
            $campos_permitidos = ['name' => 'nome', 'username' => 'Usuario', 'email' => 'email'];
            foreach ($campos_permitidos as $campo_api => $campo_db) {
                if (isset($data[$campo_api])) {
                    $campos_update[] = "$campo_db = :$campo_db";
                    $params[$campo_db] = sanitizar($data[$campo_api]);
                }
            }
            
            if (!empty($campos_update)) {
                $campos_update[] = "updated_at = NOW()";
                $sql = "UPDATE usuarios SET " . implode(', ', $campos_update) . " WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            }
            
            // Atualizar roles (se fornecido)
            if (isset($data['roles']) && is_array($data['roles'])) {
                // Deletar roles antigas (tentar ambos os formatos)
                $delete_roles = $pdo->prepare("DELETE FROM model_has_roles WHERE model_id = :id AND (model_type = :model_type1 OR model_type = :model_type2)");
                $delete_roles->execute([
                    'id' => $usuario_id,
                    'model_type1' => 'App\Models\User',
                    'model_type2' => 'App\\Models\\User'
                ]);
                
                // Inserir novos roles
                if (!empty($data['roles'])) {
                    $roles_sql = "INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES (:role_id, :model_type, :model_id)";
                    $roles_stmt = $pdo->prepare($roles_sql);
                    
                    foreach ($data['roles'] as $role_id) {
                        $roles_stmt->execute([
                            'role_id' => (int)$role_id,
                            'model_type' => 'App\Models\User',  // Formato correto usado no banco
                            'model_id' => $usuario_id
                        ]);
                    }
                }
            }
            
            // Commit transação
            $pdo->commit();
            
            logSimples('✅ Usuário atualizado', ['usuario_id' => $usuario_id]);
            
            respostaJson(true, null, 'Usuário atualizado com sucesso');
            
        } catch (Exception $e) {
            // Rollback em caso de erro
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            logSimples('❌ Erro ao atualizar usuário', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao atualizar usuário: ' . $e->getMessage(), 500);
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
            
            // Deletar usuário (CASCADE deletará model_has_roles)
            $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = :id");
            $stmt->execute(['id' => $usuario_id]);
            
            logSimples('✅ Usuário deletado', ['usuario_id' => $usuario_id]);
            
            respostaJson(true, null, 'Usuário deletado com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao deletar usuário', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao deletar usuário: ' . $e->getMessage(), 500);
        }
        break;
        
    default:
        respostaJson(false, null, 'Método não permitido', 405);
}

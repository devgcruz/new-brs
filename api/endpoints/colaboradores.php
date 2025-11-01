<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Colaboradores
 * Substitui ColaboradorController do Laravel
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

header("Content-Type: application/json");


require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/config/table-mapping.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

// Verificar autenticação para todas as operações
$usuario = middlewareAutenticacao();

switch ($method) {
    case 'GET':
        // Listar colaboradores
        $all = $_GET['all'] ?? false;
        $search = $_GET['search'] ?? '';
        $page = (int)($_GET['page'] ?? 1);
        $per_page = (int)($_GET['per_page'] ?? 10);
        
        try {
            if ($all) {
                // Retornar todos os colaboradores (para dropdowns)
                $sql = "SELECT id, nome FROM colaboradores ORDER BY nome ASC";
                $stmt = $pdo->query($sql);
                $colaboradores = $stmt->fetchAll();
                
                respostaJson(true, $colaboradores);
            } else {
                // Listagem paginada com busca
                $offset = ($page - 1) * $per_page;
                
                $where_conditions = [];
                $params = [];
                
                if (!empty($search)) {
                    $where_conditions[] = "(nome LIKE :search OR cpf LIKE :search OR email LIKE :search)";
                    $params['search'] = "%$search%";
                }
                
                $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
                
                // Contar total
                $count_sql = "SELECT COUNT(*) as total FROM colaboradores $where_clause";
                $count_stmt = $pdo->prepare($count_sql);
                $count_stmt->execute($params);
                $total = $count_stmt->fetch()['total'];
                
                // Buscar colaboradores
                $sql = "SELECT * FROM colaboradores $where_clause ORDER BY created_at DESC LIMIT :offset, :per_page";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
                $stmt->bindValue(':per_page', $per_page, PDO::PARAM_INT);
                
                foreach ($params as $key => $value) {
                    $stmt->bindValue(":$key", $value);
                }
                
                $stmt->execute();
                $colaboradores = $stmt->fetchAll();
                
                $last_page = ceil($total / $per_page);
                
                respostaJson(true, [
                    'data' => $colaboradores,
                    'meta' => [
                        'current_page' => $page,
                        'last_page' => $last_page,
                        'per_page' => $per_page,
                        'total' => $total,
                        'from' => $offset + 1,
                        'to' => min($offset + $per_page, $total)
                    ]
                ]);
            }
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao listar colaboradores', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao buscar colaboradores', 500);
        }
        break;
        
    case 'POST':
        // Criar novo colaborador
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        validarDadosObrigatorios($data, ['nome']);
        
        try {
            $sql = "INSERT INTO colaboradores (
                nome, cpf, email, telefone, cargo, departamento, 
                data_admissao, salario, status, observacoes, created_at, updated_at
            ) VALUES (
                :nome, :cpf, :email, :telefone, :cargo, :departamento,
                :data_admissao, :salario, :status, :observacoes, NOW(), NOW()
            )";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'nome' => sanitizar($data['nome']),
                'cpf' => sanitizar($data['cpf'] ?? ''),
                'email' => sanitizar($data['email'] ?? ''),
                'telefone' => sanitizar($data['telefone'] ?? ''),
                'cargo' => sanitizar($data['cargo'] ?? ''),
                'departamento' => sanitizar($data['departamento'] ?? ''),
                'data_admissao' => $data['data_admissao'] ?? date('Y-m-d'),
                'salario' => $data['salario'] ?? null,
                'status' => sanitizar($data['status'] ?? 'ativo'),
                'observacoes' => sanitizar($data['observacoes'] ?? '')
            ]);
            
            $colaborador_id = $pdo->lastInsertId();
            
            logSimples('✅ Colaborador criado', [
                'colaborador_id' => $colaborador_id,
                'nome' => $data['nome'],
                'usuario' => $usuario['Usuario']
            ]);
            
            respostaJson(true, ['id' => $colaborador_id], 'Colaborador criado com sucesso', 201);
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao criar colaborador', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao criar colaborador', 500);
        }
        break;
        
    case 'PUT':
        // Atualizar colaborador
        $colaborador_id = $_GET['id'] ?? '';
        
        if (empty($colaborador_id)) {
            respostaJson(false, null, 'ID do colaborador não especificado', 400);
        }
        
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        try {
            $campos_update = [];
            $params = ['id' => $colaborador_id];
            
            foreach ($data as $campo => $valor) {
                if (in_array($campo, ['nome', 'cpf', 'email', 'telefone', 'cargo', 'departamento', 'data_admissao', 'salario', 'status', 'observacoes'])) {
                    $campos_update[] = "$campo = :$campo";
                    $params[$campo] = sanitizar($valor);
                }
            }
            
            if (empty($campos_update)) {
                respostaJson(false, null, 'Nenhum campo válido para atualizar', 400);
            }
            
            $campos_update[] = "updated_at = NOW()";
            
            $sql = "UPDATE colaboradores SET " . implode(', ', $campos_update) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            logSimples('✅ Colaborador atualizado', [
                'colaborador_id' => $colaborador_id,
                'usuario' => $usuario['Usuario']
            ]);
            
            respostaJson(true, null, 'Colaborador atualizado com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao atualizar colaborador', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao atualizar colaborador', 500);
        }
        break;
        
    case 'DELETE':
        // Deletar colaborador
        $colaborador_id = $_GET['id'] ?? '';
        
        if (empty($colaborador_id)) {
            respostaJson(false, null, 'ID do colaborador não especificado', 400);
        }
        
        try {
            // Verificar se existe
            $check_stmt = $pdo->prepare("SELECT id FROM colaboradores WHERE id = :id");
            $check_stmt->execute(['id' => $colaborador_id]);
            
            if (!$check_stmt->fetch()) {
                respostaJson(false, null, 'Colaborador não encontrado', 404);
            }
            
            // Verificar se está sendo usado em entradas
            $entradas_table = getTableName('entradas');
            $usage_stmt = $pdo->prepare("SELECT COUNT(*) as count FROM $entradas_table WHERE ID_COLABORADOR = :id");
            $usage_stmt->execute(['id' => $colaborador_id]);
            $usage = $usage_stmt->fetch()['count'];
            
            if ($usage > 0) {
                respostaJson(false, null, 'Não é possível deletar colaborador que possui entradas associadas', 400);
            }
            
            // Deletar colaborador
            $stmt = $pdo->prepare("DELETE FROM colaboradores WHERE id = :id");
            $stmt->execute(['id' => $colaborador_id]);
            
            logSimples('✅ Colaborador deletado', [
                'colaborador_id' => $colaborador_id,
                'usuario' => $usuario['Usuario']
            ]);
            
            respostaJson(true, null, 'Colaborador deletado com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao deletar colaborador', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao deletar colaborador', 500);
        }
        break;
        
    default:
        respostaJson(false, null, 'Método não permitido', 405);
}

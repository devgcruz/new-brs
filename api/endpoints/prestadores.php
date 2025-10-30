<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Prestadores
 * Substitui PrestadorController do Laravel
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];
$usuario = middlewareAutenticacao();

switch ($method) {
    case 'GET':
        $all = $_GET['all'] ?? false;
        $search = $_GET['search'] ?? '';
        $page = (int)($_GET['page'] ?? 1);
        $per_page = (int)($_GET['per_page'] ?? 15);
        
        try {
            if ($all) {
                $sql = "SELECT id, nome FROM prestadores ORDER BY nome ASC";
                $stmt = $pdo->query($sql);
                respostaJson(true, $stmt->fetchAll());
            } else {
                $offset = ($page - 1) * $per_page;
                $where_conditions = [];
                $params = [];
                
                if (!empty($search)) {
                    $where_conditions[] = "(nome LIKE :search OR cnpj LIKE :search OR email LIKE :search)";
                    $params['search'] = "%$search%";
                }
                
                $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
                
                $count_sql = "SELECT COUNT(*) as total FROM prestadores $where_clause";
                $count_stmt = $pdo->prepare($count_sql);
                $count_stmt->execute($params);
                $total = $count_stmt->fetch()['total'];
                
                $sql = "SELECT * FROM prestadores $where_clause ORDER BY nome ASC LIMIT :offset, :per_page";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
                $stmt->bindValue(':per_page', $per_page, PDO::PARAM_INT);
                
                foreach ($params as $key => $value) {
                    $stmt->bindValue(":$key", $value);
                }
                
                $stmt->execute();
                $prestadores = $stmt->fetchAll();
                
                $last_page = ceil($total / $per_page);
                
                respostaJson(true, [
                    'data' => $prestadores,
                    'meta' => [
                        'current_page' => $page,
                        'last_page' => $last_page,
                        'per_page' => $per_page,
                        'total' => $total
                    ]
                ]);
            }
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao buscar prestadores', 500);
        }
        break;
        
    case 'POST':
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        validarDadosObrigatorios($data, ['nome']);
        
        try {
            $sql = "INSERT INTO prestadores (
                nome, cnpj, email, telefone, endereco, especialidade, 
                status, observacoes, created_at, updated_at
            ) VALUES (
                :nome, :cnpj, :email, :telefone, :endereco, :especialidade,
                :status, :observacoes, NOW(), NOW()
            )";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'nome' => sanitizar($data['nome']),
                'cnpj' => sanitizar($data['cnpj'] ?? ''),
                'email' => sanitizar($data['email'] ?? ''),
                'telefone' => sanitizar($data['telefone'] ?? ''),
                'endereco' => sanitizar($data['endereco'] ?? ''),
                'especialidade' => sanitizar($data['especialidade'] ?? ''),
                'status' => sanitizar($data['status'] ?? 'ativo'),
                'observacoes' => sanitizar($data['observacoes'] ?? '')
            ]);
            
            respostaJson(true, ['id' => $pdo->lastInsertId()], 'Prestador criado com sucesso', 201);
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao criar prestador', 500);
        }
        break;
        
    case 'PUT':
        $prestador_id = $_GET['id'] ?? '';
        if (empty($prestador_id)) {
            respostaJson(false, null, 'ID do prestador não especificado', 400);
        }
        
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        try {
            $campos_update = [];
            $params = ['id' => $prestador_id];
            
            foreach ($data as $campo => $valor) {
                if (in_array($campo, ['nome', 'cnpj', 'email', 'telefone', 'endereco', 'especialidade', 'status', 'observacoes'])) {
                    $campos_update[] = "$campo = :$campo";
                    $params[$campo] = sanitizar($valor);
                }
            }
            
            if (empty($campos_update)) {
                respostaJson(false, null, 'Nenhum campo válido para atualizar', 400);
            }
            
            $campos_update[] = "updated_at = NOW()";
            
            $sql = "UPDATE prestadores SET " . implode(', ', $campos_update) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            respostaJson(true, null, 'Prestador atualizado com sucesso');
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao atualizar prestador', 500);
        }
        break;
        
    case 'DELETE':
        $prestador_id = $_GET['id'] ?? '';
        if (empty($prestador_id)) {
            respostaJson(false, null, 'ID do prestador não especificado', 400);
        }
        
        try {
            // Verificar se está sendo usado
            $check_stmt = $pdo->prepare("SELECT COUNT(*) as count FROM entradas WHERE PRESTADOR = (SELECT nome FROM prestadores WHERE id = :id)");
            $check_stmt->execute(['id' => $prestador_id]);
            $usage = $check_stmt->fetch()['count'];
            
            if ($usage > 0) {
                respostaJson(false, null, 'Não é possível deletar prestador que está sendo usado', 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM prestadores WHERE id = :id");
            $stmt->execute(['id' => $prestador_id]);
            
            respostaJson(true, null, 'Prestador deletado com sucesso');
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao deletar prestador', 500);
        }
        break;
        
    default:
        respostaJson(false, null, 'Método não permitido', 405);
}

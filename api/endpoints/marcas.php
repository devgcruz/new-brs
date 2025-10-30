<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Marcas
 * Substitui MarcaController do Laravel
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
                $sql = "SELECT id, nome FROM marcas ORDER BY nome ASC";
                $stmt = $pdo->query($sql);
                respostaJson(true, $stmt->fetchAll());
            } else {
                $offset = ($page - 1) * $per_page;
                $where_conditions = [];
                $params = [];
                
                if (!empty($search)) {
                    $where_conditions[] = "nome LIKE :search";
                    $params['search'] = "%$search%";
                }
                
                $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
                
                $count_sql = "SELECT COUNT(*) as total FROM marcas $where_clause";
                $count_stmt = $pdo->prepare($count_sql);
                $count_stmt->execute($params);
                $total = $count_stmt->fetch()['total'];
                
                $sql = "SELECT * FROM marcas $where_clause ORDER BY nome ASC LIMIT :offset, :per_page";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
                $stmt->bindValue(':per_page', $per_page, PDO::PARAM_INT);
                
                foreach ($params as $key => $value) {
                    $stmt->bindValue(":$key", $value);
                }
                
                $stmt->execute();
                $marcas = $stmt->fetchAll();
                
                $last_page = ceil($total / $per_page);
                
                respostaJson(true, [
                    'data' => $marcas,
                    'meta' => [
                        'current_page' => $page,
                        'last_page' => $last_page,
                        'per_page' => $per_page,
                        'total' => $total
                    ]
                ]);
            }
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao buscar marcas', 500);
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
            $sql = "INSERT INTO marcas (nome, created_at, updated_at) VALUES (:nome, NOW(), NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['nome' => sanitizar($data['nome'])]);
            
            respostaJson(true, ['id' => $pdo->lastInsertId()], 'Marca criada com sucesso', 201);
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao criar marca', 500);
        }
        break;
        
    case 'PUT':
        $marca_id = $_GET['id'] ?? '';
        if (empty($marca_id)) {
            respostaJson(false, null, 'ID da marca não especificado', 400);
        }
        
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        try {
            $sql = "UPDATE marcas SET nome = :nome, updated_at = NOW() WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['nome' => sanitizar($data['nome']), 'id' => $marca_id]);
            
            respostaJson(true, null, 'Marca atualizada com sucesso');
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao atualizar marca', 500);
        }
        break;
        
    case 'DELETE':
        $marca_id = $_GET['id'] ?? '';
        if (empty($marca_id)) {
            respostaJson(false, null, 'ID da marca não especificado', 400);
        }
        
        try {
            // Verificar se está sendo usado
            $check_stmt = $pdo->prepare("SELECT COUNT(*) as count FROM entradas WHERE MARCA = (SELECT nome FROM marcas WHERE id = :id)");
            $check_stmt->execute(['id' => $marca_id]);
            $usage = $check_stmt->fetch()['count'];
            
            if ($usage > 0) {
                respostaJson(false, null, 'Não é possível deletar marca que está sendo usada', 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM marcas WHERE id = :id");
            $stmt->execute(['id' => $marca_id]);
            
            respostaJson(true, null, 'Marca deletada com sucesso');
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao deletar marca', 500);
        }
        break;
        
    default:
        respostaJson(false, null, 'Método não permitido', 405);
}

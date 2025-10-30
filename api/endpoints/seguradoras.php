<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Seguradoras
 * Substitui SeguradoraController do Laravel
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
                $sql = "SELECT id, nome FROM seguradoras ORDER BY nome ASC";
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
                
                $count_sql = "SELECT COUNT(*) as total FROM seguradoras $where_clause";
                $count_stmt = $pdo->prepare($count_sql);
                $count_stmt->execute($params);
                $total = $count_stmt->fetch()['total'];
                
                $sql = "SELECT * FROM seguradoras $where_clause ORDER BY nome ASC LIMIT :offset, :per_page";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
                $stmt->bindValue(':per_page', $per_page, PDO::PARAM_INT);
                
                foreach ($params as $key => $value) {
                    $stmt->bindValue(":$key", $value);
                }
                
                $stmt->execute();
                $seguradoras = $stmt->fetchAll();
                
                $last_page = ceil($total / $per_page);
                
                respostaJson(true, [
                    'data' => $seguradoras,
                    'meta' => [
                        'current_page' => $page,
                        'last_page' => $last_page,
                        'per_page' => $per_page,
                        'total' => $total
                    ]
                ]);
            }
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao buscar seguradoras', 500);
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
            $sql = "INSERT INTO seguradoras (nome, created_at, updated_at) VALUES (:nome, NOW(), NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['nome' => sanitizar($data['nome'])]);
            
            respostaJson(true, ['id' => $pdo->lastInsertId()], 'Seguradora criada com sucesso', 201);
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao criar seguradora', 500);
        }
        break;
        
    case 'PUT':
        $seguradora_id = $_GET['id'] ?? '';
        if (empty($seguradora_id)) {
            respostaJson(false, null, 'ID da seguradora não especificado', 400);
        }
        
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        try {
            $sql = "UPDATE seguradoras SET nome = :nome, updated_at = NOW() WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['nome' => sanitizar($data['nome']), 'id' => $seguradora_id]);
            
            respostaJson(true, null, 'Seguradora atualizada com sucesso');
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao atualizar seguradora', 500);
        }
        break;
        
    case 'DELETE':
        $seguradora_id = $_GET['id'] ?? '';
        if (empty($seguradora_id)) {
            respostaJson(false, null, 'ID da seguradora não especificado', 400);
        }
        
        try {
            // Verificar se está sendo usado
            $check_stmt = $pdo->prepare("SELECT COUNT(*) as count FROM entradas WHERE SEGURADORA = (SELECT nome FROM seguradoras WHERE id = :id)");
            $check_stmt->execute(['id' => $seguradora_id]);
            $usage = $check_stmt->fetch()['count'];
            
            if ($usage > 0) {
                respostaJson(false, null, 'Não é possível deletar seguradora que está sendo usada', 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM seguradoras WHERE id = :id");
            $stmt->execute(['id' => $seguradora_id]);
            
            respostaJson(true, null, 'Seguradora deletada com sucesso');
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao deletar seguradora', 500);
        }
        break;
        
    default:
        respostaJson(false, null, 'Método não permitido', 405);
}

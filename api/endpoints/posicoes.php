<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Posições
 * Substitui PosicaoController do Laravel
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
require_once API_BASE_DIR . "/config/table-mapping.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];
$usuario = middlewareAutenticacao();

// Obter nome da tabela usando mapeamento
$tableName = getTableName('posicoes');

switch ($method) {
    case 'GET':
        $all = $_GET['all'] ?? false;
        $search = $_GET['search'] ?? '';
        $page = (int)($_GET['page'] ?? 1);
        $per_page = (int)($_GET['per_page'] ?? 15);
        
        try {
            if ($all) {
                $sql = "SELECT id, nome FROM $tableName ORDER BY nome ASC";
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
                
                $count_sql = "SELECT COUNT(*) as total FROM $tableName $where_clause";
                $count_stmt = $pdo->prepare($count_sql);
                $count_stmt->execute($params);
                $total = $count_stmt->fetch()['total'];
                
                $sql = "SELECT * FROM $tableName $where_clause ORDER BY nome ASC LIMIT :offset, :per_page";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
                $stmt->bindValue(':per_page', $per_page, PDO::PARAM_INT);
                
                foreach ($params as $key => $value) {
                    $stmt->bindValue(":$key", $value);
                }
                
                $stmt->execute();
                $posicoes = $stmt->fetchAll();
                
                $last_page = ceil($total / $per_page);
                
                respostaJson(true, [
                    'data' => $posicoes,
                    'meta' => [
                        'current_page' => $page,
                        'last_page' => $last_page,
                        'per_page' => $per_page,
                        'total' => $total
                    ]
                ]);
            }
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao buscar posições', 500);
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
            $sql = "INSERT INTO $tableName (nome, created_at, updated_at) VALUES (:nome, NOW(), NOW())";
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['nome' => sanitizar($data['nome'])]);
            
            respostaJson(true, ['id' => $pdo->lastInsertId()], 'Posição criada com sucesso', 201);
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao criar posição', 500);
        }
        break;
        
    case 'PUT':
        // 1. Obter ID da URL e dados do body
        if (!isset($_GET['id'])) {
            respostaJson(false, null, 'ID é obrigatório', 400);
        }
        $id = (int)$_GET['id'];
        $data = json_decode(file_get_contents('php://input'), true);

        // 2. Validar dados
        if (empty($data['nome'])) {
            respostaJson(false, null, 'O campo Nome é obrigatório', 422);
        }

        try {
            // 3. Executar o UPDATE
            $sql = "UPDATE $tableName SET nome = ?, updated_at = NOW() WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$data['nome'], $id]);

            // 4. Buscar os dados atualizados para retornar ao frontend
            // (O GenericCrudPage espera os dados atualizados)
            $stmtGet = $pdo->prepare("SELECT * FROM $tableName WHERE id = ?");
            $stmtGet->execute([$id]);
            $updatedData = $stmtGet->fetch();

            respostaJson(true, $updatedData, 'Posição atualizada com sucesso');

        } catch (PDOException $e) {
            respostaJson(false, null, 'Erro de banco de dados: ' . $e->getMessage(), 500);
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao atualizar posição', 500);
        }
        break;
        
    case 'DELETE':
        // 1. Obter ID da URL
        if (!isset($_GET['id'])) {
            respostaJson(false, null, 'ID é obrigatório', 400);
        }
        $id = (int)$_GET['id'];

        try {
            // 2. Executar o DELETE
            $sql = "DELETE FROM $tableName WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id]);

            respostaJson(true, null, 'Posição excluída com sucesso');

        } catch (PDOException $e) {
            // Tratar erros (ex: chave estrangeira)
            if ($e->getCode() == 23000) {
                 respostaJson(false, null, 'Erro: Esta posição está em uso e não pode ser excluída.', 409);
            }
            respostaJson(false, null, 'Erro de banco de dados: ' . $e->getMessage(), 500);
        } catch (Exception $e) {
            respostaJson(false, null, 'Erro ao deletar posição', 500);
        }
        break;
        
    default:
        respostaJson(false, null, 'Método não permitido', 405);
}

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
        // 1. Ler o body JSON da requisição
        $data = json_decode(file_get_contents('php://input'), true);

        // 2. Validar dados (exemplo)
        if (empty($data['nome'])) {
            respostaJson(false, null, 'O campo Nome é obrigatório', 422);
        }
        
        $tableName = getTableName('colaboradores');

        try {
            // 3. Preparar a consulta SQL INSERT (CORRIGIDA: sem cnh_path)
            // Mapear campo de contato: frontend envia 'telefone', banco usa 'celular'
            $valor_contato = $data['telefone'] ?? $data['celular'] ?? $data['contato'] ?? null;
            
            $sql = "INSERT INTO $tableName (nome, email, cpf, celular, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, NOW(), NOW())";
            
            $stmt = $pdo->prepare($sql);
            
            // 4. Executar com os dados do frontend (CORRIGIDO: sem cnh_path)
            $stmt->execute([
                $data['nome'] ?? null,
                $data['email'] ?? null,
                $data['cpf'] ?? null,
                $valor_contato
            ]);

            // 5. Obter o ID do novo colaborador
            $lastId = $pdo->lastInsertId();

            // 6. Buscar o registro recém-criado para retornar ao frontend
            $sqlGet = "SELECT * FROM $tableName WHERE id = ?";
            $stmtGet = $pdo->prepare($sqlGet);
            $stmtGet->execute([$lastId]);
            $newData = $stmtGet->fetch();

            // 7. Retornar sucesso
            logSimples('✅ Colaborador criado', [
                'colaborador_id' => $lastId,
                'nome' => $data['nome'],
                'usuario' => $usuario['Usuario'] ?? $usuario['username'] ?? 'sistema'
            ]);
            
            respostaJson(true, $newData, 'Colaborador cadastrado com sucesso', 201);

        } catch (PDOException $e) {
            // Tratar erros (ex: email/cpf duplicado)
            if ($e->getCode() == 23000) { // Código de violação de constraint UNIQUE
                respostaJson(false, null, 'Erro: Email ou CPF já pode estar em uso.', 409);
            }
            logSimples('❌ Erro ao criar colaborador', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro de banco de dados: ' . $e->getMessage(), 500);
        } catch (Exception $e) {
            logSimples('❌ Erro ao criar colaborador', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao criar colaborador', 500);
        }
        break;
        
    case 'PUT':
        // 1. Verificar se o ID foi fornecido na URL
        if (!isset($_GET['id'])) {
            respostaJson(false, null, 'ID do colaborador é obrigatório', 400);
        }
        $id = (int)$_GET['id'];

        // 2. Ler o body da requisição (JSON)
        $data = json_decode(file_get_contents('php://input'), true);

        // 3. Validar dados (simples)
        if (empty($data['nome'])) {
            respostaJson(false, null, 'O campo Nome é obrigatório', 422);
        }

        try {
            // 4. Preparar e executar o UPDATE
            $tableName = getTableName('colaboradores');
            
            // Mapear campo de contato: frontend envia 'telefone' (mapeado de 'contato'), banco usa 'celular'
            $valor_contato = $data['telefone'] ?? $data['celular'] ?? $data['contato'] ?? null;
            
            $sql = "UPDATE $tableName SET 
                        nome = ?, 
                        email = ?, 
                        cpf = ?, 
                        celular = ?,
                        updated_at = NOW()
                    WHERE id = ?"; 
            
            $stmt = $pdo->prepare($sql);
            
            $stmt->execute([
                $data['nome'] ?? null,
                $data['email'] ?? null,
                $data['cpf'] ?? null,
                $valor_contato,
                $id
            ]);

            // 5. Buscar os dados atualizados para retornar ao frontend
            $sqlGet = "SELECT * FROM $tableName WHERE id = ?";
            $stmtGet = $pdo->prepare($sqlGet);
            $stmtGet->execute([$id]);
            $updatedData = $stmtGet->fetch();

            // 6. Retornar sucesso (isto é crucial para o GenericCrudPage fechar o modal)
            logSimples('✅ Colaborador atualizado', [
                'colaborador_id' => $id,
                'usuario' => $usuario['Usuario'] ?? $usuario['username'] ?? 'sistema'
            ]);
            
            respostaJson(true, $updatedData, 'Colaborador atualizado com sucesso');

        } catch (PDOException $e) {
            // Tratar erros de SQL (ex: email/cpf duplicado)
            if ($e->getCode() == 23000) {
                 respostaJson(false, null, 'Erro: Email ou CPF já pode estar em uso.', 409);
            }
            logSimples('❌ Erro ao atualizar colaborador', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro de banco de dados: ' . $e->getMessage(), 500);
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

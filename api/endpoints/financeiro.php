<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Financeiro
 * Substitui FinanceiroController do Laravel
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
        // Listar dados financeiros
        $entrada_id = $_GET['entrada_id'] ?? '';
        $entrada_param = $_GET['entrada'] ?? '';
        $status = $_GET['status'] ?? '';
        $data_inicio = $_GET['data_inicio'] ?? '';
        $data_fim = $_GET['data_fim'] ?? '';
        $page = (int)($_GET['page'] ?? 1);
        $per_page = (int)($_GET['per_page'] ?? 15);
        
        // Se for uma requisição específica por entrada
        if (!empty($entrada_param)) {
            $entrada_id = $entrada_param;
        }
        
        $offset = ($page - 1) * $per_page;
        
        try {
            $where_conditions = [];
            $params = [];
            
            if (!empty($entrada_id)) {
                $where_conditions[] = "ID_ENTRADA = :entrada_id";
                $params['entrada_id'] = $entrada_id;
            }
            
            if (!empty($status)) {
                $where_conditions[] = "StatusPG = :status";
                $params['status'] = $status;
            }
            
            if (!empty($data_inicio)) {
                $where_conditions[] = "DATA_NF >= :data_inicio";
                $params['data_inicio'] = $data_inicio;
            }
            
            if (!empty($data_fim)) {
                $where_conditions[] = "DATA_NF <= :data_fim";
                $params['data_fim'] = $data_fim;
            }
            
            $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
            
            // Contar total
            $financeiros_table = getTableName('financeiros');
            $entradas_table = getTableName('entradas');
            $count_sql = "SELECT COUNT(*) as total FROM $financeiros_table $where_clause";
            $count_stmt = $pdo->prepare($count_sql);
            $count_stmt->execute($params);
            $total = $count_stmt->fetch()['total'];
            
            // Buscar financeiros com dados da entrada
            $sql = "
                SELECT f.*, e.PLACA, e.VEICULO, e.MARCA 
                FROM $financeiros_table f 
                LEFT JOIN $entradas_table e ON f.ID_ENTRADA = e.Id_Entrada 
                $where_clause 
                ORDER BY f.created_at DESC 
                LIMIT :offset, :per_page
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->bindValue(':per_page', $per_page, PDO::PARAM_INT);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            
            $stmt->execute();
            $financeiros = $stmt->fetchAll();
            
            $last_page = ceil($total / $per_page);
            
            respostaJson(true, [
                'data' => $financeiros,
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
            logSimples('❌ Erro ao listar financeiros', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao buscar dados financeiros', 500);
        }
        break;
        
    case 'POST':
        // Criar novo registro financeiro
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        validarDadosObrigatorios($data, ['ID_ENTRADA']);
        
        try {
            $sql = "INSERT INTO financeiros (
                ID_ENTRADA, NUMERO_NF, DATA_NF, VALOR_NF, VALOR_HONORARIO,
                VALOR_DESPESA, VALOR_LIQUIDO, StatusPG, OBSERVACOES, 
                created_at, updated_at
            ) VALUES (
                :entrada_id, :numero_nf, :data_nf, :valor_nf, :valor_honorario,
                :valor_despesa, :valor_liquido, :status_pg, :observacoes,
                NOW(), NOW()
            )";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'entrada_id' => $data['ID_ENTRADA'],
                'numero_nf' => sanitizar($data['NUMERO_NF'] ?? ''),
                'data_nf' => $data['DATA_NF'] ?? date('Y-m-d'),
                'valor_nf' => $data['VALOR_NF'] ?? 0,
                'valor_honorario' => $data['VALOR_HONORARIO'] ?? 0,
                'valor_despesa' => $data['VALOR_DESPESA'] ?? 0,
                'valor_liquido' => $data['VALOR_LIQUIDO'] ?? 0,
                'status_pg' => sanitizar($data['StatusPG'] ?? 'pendente'),
                'observacoes' => sanitizar($data['OBSERVACOES'] ?? '')
            ]);
            
            $financeiro_id = $pdo->lastInsertId();
            
            logSimples('✅ Financeiro criado', [
                'financeiro_id' => $financeiro_id,
                'entrada_id' => $data['ID_ENTRADA'],
                'usuario' => $usuario['Usuario']
            ]);
            
            respostaJson(true, ['id' => $financeiro_id], 'Registro financeiro criado com sucesso', 201);
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao criar financeiro', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao criar registro financeiro', 500);
        }
        break;
        
    case 'PUT':
        // Atualizar registro financeiro
        $financeiro_id = $_GET['id'] ?? '';
        
        if (empty($financeiro_id)) {
            respostaJson(false, null, 'ID do registro financeiro não especificado', 400);
        }
        
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        try {
            $financeiros_table = getTableName('financeiros');
            $campos_update = [];
            $params = ['id' => $financeiro_id];
            
            foreach ($data as $campo => $valor) {
                if (in_array($campo, ['NUMERO_RECIBO', 'VALOR_TOTAL_RECIBO', 'DATA_PAGAMENTO_RECIBO', 'DATA_NOTA_FISCAL', 'NUMERO_NOTA_FISCAL', 'VALOR_NOTA_FISCAL', 'DATA_PAGAMENTO_NOTA_FISCAL', 'status_nota_fiscal', 'StatusPG', 'OBSERVACOES'])) {
                    $campos_update[] = "$campo = :$campo";
                    $params[$campo] = sanitizar($valor);
                }
            }
            
            if (empty($campos_update)) {
                respostaJson(false, null, 'Nenhum campo válido para atualizar', 400);
            }
            
            $campos_update[] = "updated_at = NOW()";
            
            $sql = "UPDATE $financeiros_table SET " . implode(', ', $campos_update) . " WHERE Id_Financeiro = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            logSimples('✅ Financeiro atualizado', [
                'financeiro_id' => $financeiro_id,
                'usuario' => $usuario['Usuario']
            ]);
            
            respostaJson(true, null, 'Registro financeiro atualizado com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao atualizar financeiro', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao atualizar registro financeiro', 500);
        }
        break;
        
    case 'DELETE':
        // Deletar registro financeiro
        $financeiro_id = $_GET['id'] ?? '';
        
        if (empty($financeiro_id)) {
            respostaJson(false, null, 'ID do registro financeiro não especificado', 400);
        }
        
        try {
            $financeiros_table = getTableName('financeiros');
            
            // Verificar se existe
            $check_stmt = $pdo->prepare("SELECT Id_Financeiro FROM $financeiros_table WHERE Id_Financeiro = :id");
            $check_stmt->execute(['id' => $financeiro_id]);
            
            if (!$check_stmt->fetch()) {
                respostaJson(false, null, 'Registro financeiro não encontrado', 404);
            }
            
            // Deletar registro
            $stmt = $pdo->prepare("DELETE FROM $financeiros_table WHERE Id_Financeiro = :id");
            $stmt->execute(['id' => $financeiro_id]);
            
            logSimples('✅ Financeiro deletado', [
                'financeiro_id' => $financeiro_id,
                'usuario' => $usuario['Usuario']
            ]);
            
            respostaJson(true, null, 'Registro financeiro deletado com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao deletar financeiro', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao deletar registro financeiro', 500);
        }
        break;
        
    default:
        respostaJson(false, null, 'Método não permitido', 405);
}

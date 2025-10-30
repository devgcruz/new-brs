<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Judicial
 * Substitui JudicialController do Laravel
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
        // Listar processos judiciais
        $entrada_id = $_GET['entrada_id'] ?? '';
        $entrada_param = $_GET['entrada'] ?? '';
        $comarca = $_GET['comarca'] ?? '';
        $numero_processo = $_GET['numero_processo'] ?? '';
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
            
            if (!empty($comarca)) {
                $where_conditions[] = "COMARCA LIKE :comarca";
                $params['comarca'] = "%$comarca%";
            }
            
            if (!empty($numero_processo)) {
                $where_conditions[] = "NUM_PROCESSO LIKE :numero_processo";
                $params['numero_processo'] = "%$numero_processo%";
            }
            
            if (!empty($data_inicio)) {
                $where_conditions[] = "created_at >= :data_inicio";
                $params['data_inicio'] = $data_inicio;
            }
            
            if (!empty($data_fim)) {
                $where_conditions[] = "created_at <= :data_fim";
                $params['data_fim'] = $data_fim;
            }
            
            $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
            
            // Contar total
            $count_sql = "SELECT COUNT(*) as total FROM judicial $where_clause";
            $count_stmt = $pdo->prepare($count_sql);
            $count_stmt->execute($params);
            $total = $count_stmt->fetch()['total'];
            
            // Buscar processos judiciais com dados da entrada
            $sql = "
                SELECT j.*, e.PLACA, e.VEICULO, e.MARCA 
                FROM judicial j 
                LEFT JOIN entradas e ON j.ID_ENTRADA = e.Id_Entrada 
                $where_clause 
                ORDER BY j.created_at DESC 
                LIMIT :offset, :per_page
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->bindValue(':per_page', $per_page, PDO::PARAM_INT);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            
            $stmt->execute();
            $judiciais = $stmt->fetchAll();
            
            // Buscar diligências para cada processo
            foreach ($judiciais as &$judicial) {
                $diligencia_stmt = $pdo->prepare("SELECT * FROM diligencias WHERE ID_JUDICIAL = :judicial_id ORDER BY DATA_DILIGENCIA DESC");
                $diligencia_stmt->execute(['judicial_id' => $judicial['id']]);
                $judicial['diligencias'] = $diligencia_stmt->fetchAll();
            }
            
            $last_page = ceil($total / $per_page);
            
            respostaJson(true, [
                'data' => $judiciais,
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
            logSimples('❌ Erro ao listar processos judiciais', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao buscar processos judiciais', 500);
        }
        break;
        
    case 'POST':
        // Criar novo processo judicial
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        validarDadosObrigatorios($data, ['ID_ENTRADA']);
        
        try {
            $sql = "INSERT INTO judicial (
                ID_ENTRADA, NUM_PROCESSO, COMARCA, VARA, STATUS_PROCESSO,
                VALOR_CAUSA, ADVOGADO, OBSERVACOES, created_at, updated_at
            ) VALUES (
                :entrada_id, :numero_processo, :comarca, :vara, :status_processo,
                :valor_causa, :advogado, :observacoes, NOW(), NOW()
            )";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'entrada_id' => $data['ID_ENTRADA'],
                'numero_processo' => sanitizar($data['NUM_PROCESSO'] ?? ''),
                'comarca' => sanitizar($data['COMARCA'] ?? ''),
                'vara' => sanitizar($data['VARA'] ?? ''),
                'status_processo' => sanitizar($data['STATUS_PROCESSO'] ?? 'em_andamento'),
                'valor_causa' => $data['VALOR_CAUSA'] ?? 0,
                'advogado' => sanitizar($data['ADVOGADO'] ?? ''),
                'observacoes' => sanitizar($data['OBSERVACOES'] ?? '')
            ]);
            
            $judicial_id = $pdo->lastInsertId();
            
            logSimples('✅ Processo judicial criado', [
                'judicial_id' => $judicial_id,
                'entrada_id' => $data['ID_ENTRADA'],
                'numero_processo' => $data['NUM_PROCESSO'] ?? '',
                'usuario' => $usuario['Usuario']
            ]);
            
            respostaJson(true, ['id' => $judicial_id], 'Processo judicial criado com sucesso', 201);
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao criar processo judicial', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao criar processo judicial', 500);
        }
        break;
        
    case 'PUT':
        // Atualizar processo judicial
        $judicial_id = $_GET['id'] ?? '';
        
        if (empty($judicial_id)) {
            respostaJson(false, null, 'ID do processo judicial não especificado', 400);
        }
        
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        try {
            $campos_update = [];
            $params = ['id' => $judicial_id];
            
            foreach ($data as $campo => $valor) {
                if (in_array($campo, ['NUM_PROCESSO', 'COMARCA', 'VARA', 'STATUS_PROCESSO', 'VALOR_CAUSA', 'ADVOGADO', 'OBSERVACOES'])) {
                    $campos_update[] = "$campo = :$campo";
                    $params[$campo] = sanitizar($valor);
                }
            }
            
            if (empty($campos_update)) {
                respostaJson(false, null, 'Nenhum campo válido para atualizar', 400);
            }
            
            $campos_update[] = "updated_at = NOW()";
            
            $sql = "UPDATE judicial SET " . implode(', ', $campos_update) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            logSimples('✅ Processo judicial atualizado', [
                'judicial_id' => $judicial_id,
                'usuario' => $usuario['Usuario']
            ]);
            
            respostaJson(true, null, 'Processo judicial atualizado com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao atualizar processo judicial', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao atualizar processo judicial', 500);
        }
        break;
        
    case 'DELETE':
        // Deletar processo judicial
        $judicial_id = $_GET['id'] ?? '';
        
        if (empty($judicial_id)) {
            respostaJson(false, null, 'ID do processo judicial não especificado', 400);
        }
        
        try {
            // Verificar se existe
            $check_stmt = $pdo->prepare("SELECT id FROM judicial WHERE id = :id");
            $check_stmt->execute(['id' => $judicial_id]);
            
            if (!$check_stmt->fetch()) {
                respostaJson(false, null, 'Processo judicial não encontrado', 404);
            }
            
            // Deletar diligências relacionadas primeiro
            $stmt = $pdo->prepare("DELETE FROM diligencias WHERE ID_JUDICIAL = :id");
            $stmt->execute(['id' => $judicial_id]);
            
            // Deletar processo judicial
            $stmt = $pdo->prepare("DELETE FROM judicial WHERE id = :id");
            $stmt->execute(['id' => $judicial_id]);
            
            logSimples('✅ Processo judicial deletado', [
                'judicial_id' => $judicial_id,
                'usuario' => $usuario['Usuario']
            ]);
            
            respostaJson(true, null, 'Processo judicial deletado com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao deletar processo judicial', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao deletar processo judicial', 500);
        }
        break;
        
    default:
        respostaJson(false, null, 'Método não permitido', 405);
}

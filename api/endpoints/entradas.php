<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Entradas (Registros)
 * Substitui EntradaController do Laravel
 */

header("Content-Type: application/json");


// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/config/table-mapping.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

// Verificar autenticação para todas as operações
$usuario = middlewareAutenticacao();

switch ($method) {
    case 'GET':
        // Listar entradas
        $search = $_GET['search'] ?? '';
        $colaborador_id = $_GET['colaborador_id'] ?? '';
        $tipo = $_GET['tipo'] ?? '';
        $situacao = $_GET['situacao'] ?? '';
        $data_inicio = $_GET['data_inicio'] ?? '';
        $data_fim = $_GET['data_fim'] ?? '';
        $page = (int)($_GET['page'] ?? 1);
        $per_page = (int)($_GET['per_page'] ?? 15);
        
        $offset = ($page - 1) * $per_page;
        
        // Construir query base
        $where_conditions = [];
        $params = [];
        
        if (!empty($search)) {
            $where_conditions[] = "(PLACA LIKE :search OR VEICULO LIKE :search OR MARCA LIKE :search OR SEGURADORA LIKE :search OR SITUACAO LIKE :search OR CHASSI LIKE :search OR RENAVAM LIKE :search OR PROTOCOLO LIKE :search)";
            $params['search'] = "%$search%";
        }
        
        if (!empty($colaborador_id)) {
            $where_conditions[] = "ID_COLABORADOR = :colaborador_id";
            $params['colaborador_id'] = $colaborador_id;
        }
        
        if (!empty($tipo)) {
            $where_conditions[] = "TIPO = :tipo";
            $params['tipo'] = $tipo;
        }
        
        if (!empty($situacao)) {
            $where_conditions[] = "SITUACAO = :situacao";
            $params['situacao'] = $situacao;
        }
        
        if (!empty($data_inicio)) {
            $where_conditions[] = "DATA_ENTRADA >= :data_inicio";
            $params['data_inicio'] = $data_inicio;
        }
        
        if (!empty($data_fim)) {
            $where_conditions[] = "DATA_ENTRADA <= :data_fim";
            $params['data_fim'] = $data_fim;
        }
        
        $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
        
        try {
            // Obter nomes das tabelas
            $entradas_table = getTableName('entradas');
            $colaboradores_table = getTableName('colaboradores');
            $financeiros_table = getTableName('financeiros');
            $observacoes_table = getTableName('observacoes');
            $pdfs_table = getTableName('pdfs');
            
            // Contar total
            $count_sql = "SELECT COUNT(*) as total FROM $entradas_table $where_clause";
            $count_stmt = $pdo->prepare($count_sql);
            $count_stmt->execute($params);
            $total = $count_stmt->fetch()['total'];
            
            // Buscar entradas com relacionamentos
            $sql = "
                SELECT 
                    e.Id_Entrada as id,
                    e.PLACA, e.VEICULO, e.MARCA, e.SEGURADORA, e.TIPO, e.SITUACAO,
                    e.DATA_ENTRADA, e.ID_COLABORADOR, e.OBSERVACOES, e.OBSERVACOES_POSTS,
                    e.POSICAO, e.UF, e.CIDADE, e.MES, e.NUMERO_PROCESSO, e.PROTOCOLO,
                    e.COR, e.RENAVAM, e.NUMERO_MOTOR, e.COMARCA, e.NUMERO_PROCESSO_JUDICIAL,
                    e.NOTA_FISCAL, e.NUMERO_VARA, e.DATA_PAGAMENTO, e.HONORARIO, e.NOME_BANCO,
                    e.DATA_REGISTRO, e.DATA_ALTERACAO, e.created_at, e.updated_at,
                    e.UF_SINISTRO, e.CIDADE_SINISTRO, e.COD_SINISTRO, e.NUM_BO, e.ANO_VEIC, e.ANO_MODELO, e.CHASSI,
                    c.nome as colaborador_nome 
                FROM $entradas_table e 
                LEFT JOIN $colaboradores_table c ON e.ID_COLABORADOR = c.id 
                $where_clause 
                ORDER BY e.Id_Entrada DESC 
                LIMIT :offset, :per_page
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->bindValue(':per_page', $per_page, PDO::PARAM_INT);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            
            $stmt->execute();
            $entradas = $stmt->fetchAll();
            
            // Buscar financeiros para cada entrada
            foreach ($entradas as &$entrada) {
                $financeiro_stmt = $pdo->prepare("SELECT * FROM $financeiros_table WHERE ID_ENTRADA = :entrada_id");
                $financeiro_stmt->execute(['entrada_id' => $entrada['id']]);
                $entrada['financeiros'] = $financeiro_stmt->fetchAll();
                
                // Buscar observações com dados do usuário
                $usuarios_table = getTableName('usuarios');
                $obs_stmt = $pdo->prepare("
                    SELECT o.*, u.nome as usuario_nome, u.profile_photo_path 
                    FROM $observacoes_table o 
                    LEFT JOIN $usuarios_table u ON o.usuario_id = u.id 
                    WHERE o.entrada_id = :entrada_id 
                    ORDER BY o.created_at DESC
                ");
                $obs_stmt->execute(['entrada_id' => $entrada['id']]);
                $observacoes = $obs_stmt->fetchAll();
                
                // Transformar dados para o formato esperado pelo frontend
                $entrada['observacoes'] = array_map(function($obs) {
                    return [
                        'id' => $obs['id'],
                        'entrada_id' => $obs['entrada_id'],
                        'texto' => $obs['texto'],
                        'observacao' => $obs['texto'], // Fallback para compatibilidade
                        'descricao' => $obs['texto'], // Fallback para compatibilidade
                        'created_at' => $obs['created_at'],
                        'data' => $obs['created_at'], // Fallback para compatibilidade
                        'data_criacao' => $obs['created_at'], // Fallback para compatibilidade
                        'updated_at' => $obs['updated_at'],
                        'usuario' => [
                            'id' => $obs['usuario_id'],
                            'name' => $obs['usuario_nome'] ?: 'Usuário',
                            'profile_photo_path' => $obs['profile_photo_path']
                        ]
                    ];
                }, $observacoes);
                
                // Buscar PDFs
                $pdf_stmt = $pdo->prepare("SELECT * FROM $pdfs_table WHERE ID_ENTRADA = :entrada_id");
                $pdf_stmt->execute(['entrada_id' => $entrada['id']]);
                $entrada['pdfs'] = $pdf_stmt->fetchAll();
            }
            
            $last_page = ceil($total / $per_page);
            
            respostaJson(true, [
                'data' => $entradas,
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
            logSimples('❌ Erro ao listar entradas', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao buscar entradas', 500);
        }
        break;
        
    case 'POST':
        // Criar nova entrada
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        // Validar dados obrigatórios
        $campos_obrigatorios = ['PLACA', 'VEICULO', 'MARCA', 'SEGURADORA', 'TIPO', 'SITUACAO'];
        validarDadosObrigatorios($data, $campos_obrigatorios);
        
        try {
            $entradas_table = getTableName('entradas');
            $sql = "INSERT INTO $entradas_table (
                PLACA, VEICULO, MARCA, SEGURADORA, TIPO, SITUACAO, 
                DATA_ENTRADA, ID_COLABORADOR, OBSERVACOES, CHASSI, ANO_VEIC, ANO_MODELO,
                COD_SINISTRO, NUM_BO, UF_SINISTRO, CIDADE_SINISTRO, POSICAO, UF, CIDADE,
                NUMERO_PROCESSO, COR, RENAVAM, NUMERO_MOTOR, COMARCA, NUMERO_PROCESSO_JUDICIAL,
                NOTA_FISCAL, NUMERO_VARA, DATA_PAGAMENTO, HONORARIO, NOME_BANCO, created_at, updated_at
            ) VALUES (
                :placa, :veiculo, :marca, :seguradora, :tipo, :situacao,
                :data_entrada, :id_colaborador, :observacoes, :chassi, :ano_veic, :ano_modelo,
                :cod_sinistro, :num_bo, :uf_sinistro, :cidade_sinistro, :posicao, :uf, :cidade,
                :numero_processo, :cor, :renavam, :numero_motor, :comarca, :numero_processo_judicial,
                :nota_fiscal, :numero_vara, :data_pagamento, :honorario, :nome_banco, NOW(), NOW()
            )";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'placa' => sanitizar($data['PLACA']),
                'veiculo' => sanitizar($data['VEICULO']),
                'marca' => sanitizar($data['MARCA']),
                'seguradora' => sanitizar($data['SEGURADORA']),
                'tipo' => sanitizar($data['TIPO']),
                'situacao' => sanitizar($data['SITUACAO']),
                'data_entrada' => $data['DATA_ENTRADA'] ?? date('Y-m-d'),
                'id_colaborador' => $data['ID_COLABORADOR'] ?? null,
                'observacoes' => sanitizar($data['OBSERVACOES'] ?? ''),
                'chassi' => sanitizar($data['CHASSI'] ?? ''),
                'ano_veic' => sanitizar($data['ANO_VEIC'] ?? ''),
                'ano_modelo' => sanitizar($data['ANO_MODELO'] ?? ''),
                'cod_sinistro' => sanitizar($data['COD_SINISTRO'] ?? ''),
                'num_bo' => sanitizar($data['NUM_BO'] ?? ''),
                'uf_sinistro' => sanitizar($data['UF_SINISTRO'] ?? ''),
                'cidade_sinistro' => sanitizar($data['CIDADE_SINISTRO'] ?? ''),
                'posicao' => sanitizar($data['POSICAO'] ?? ''),
                'uf' => sanitizar($data['UF'] ?? ''),
                'cidade' => sanitizar($data['CIDADE'] ?? ''),
                'numero_processo' => sanitizar($data['NUMERO_PROCESSO'] ?? ''),
                'cor' => sanitizar($data['COR'] ?? ''),
                'renavam' => sanitizar($data['RENAVAM'] ?? ''),
                'numero_motor' => sanitizar($data['NUMERO_MOTOR'] ?? ''),
                'comarca' => sanitizar($data['COMARCA'] ?? ''),
                'numero_processo_judicial' => sanitizar($data['NUMERO_PROCESSO_JUDICIAL'] ?? ''),
                'nota_fiscal' => sanitizar($data['NOTA_FISCAL'] ?? ''),
                'numero_vara' => sanitizar($data['NUMERO_VARA'] ?? ''),
                'data_pagamento' => $data['DATA_PAGAMENTO'] ?? null,
                'honorario' => sanitizar($data['HONORARIO'] ?? ''),
                'nome_banco' => sanitizar($data['NOME_BANCO'] ?? '')
            ]);
            
            $entrada_id = $pdo->lastInsertId();
            
            logSimples('✅ Nova entrada criada', ['entrada_id' => $entrada_id, 'placa' => $data['PLACA']]);
            
            respostaJson(true, ['id' => $entrada_id], 'Entrada criada com sucesso', 201);
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao criar entrada', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao criar entrada', 500);
        }
        break;
        
    case 'PUT':
        // Atualizar entrada
        $entrada_id = $_GET['id'] ?? '';
        
        if (empty($entrada_id)) {
            respostaJson(false, null, 'ID da entrada não especificado', 400);
        }
        
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        try {
            $campos_update = [];
            $params = ['id' => $entrada_id];
            
            foreach ($data as $campo => $valor) {
                if (in_array($campo, [
                    'PLACA', 'VEICULO', 'MARCA', 'SEGURADORA', 'TIPO', 'SITUACAO', 'DATA_ENTRADA', 'ID_COLABORADOR', 'OBSERVACOES',
                    'CHASSI', 'ANO_VEIC', 'ANO_MODELO', 'COD_SINISTRO', 'NUM_BO', 'UF_SINISTRO', 'CIDADE_SINISTRO', 'POSICAO', 
                    'UF', 'CIDADE', 'NUMERO_PROCESSO', 'COR', 'RENAVAM', 'NUMERO_MOTOR', 'COMARCA', 'NUMERO_PROCESSO_JUDICIAL',
                    'NOTA_FISCAL', 'NUMERO_VARA', 'DATA_PAGAMENTO', 'HONORARIO', 'NOME_BANCO'
                ])) {
                    $campos_update[] = "$campo = :$campo";
                    // Tratar campos de data separadamente
                    if (in_array($campo, ['DATA_ENTRADA', 'DATA_PAGAMENTO'])) {
                        $params[$campo] = $valor ?: null;
                    } else {
                        $params[$campo] = sanitizar($valor);
                    }
                }
            }
            
            if (empty($campos_update)) {
                respostaJson(false, null, 'Nenhum campo válido para atualizar', 400);
            }
            
            $campos_update[] = "updated_at = NOW()";
            
            $entradas_table = getTableName('entradas');
            $sql = "UPDATE $entradas_table SET " . implode(', ', $campos_update) . " WHERE Id_Entrada = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            logSimples('✅ Entrada atualizada', ['entrada_id' => $entrada_id]);
            
            respostaJson(true, null, 'Entrada atualizada com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao atualizar entrada', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao atualizar entrada', 500);
        }
        break;
        
    case 'DELETE':
        // Deletar entrada
        $entrada_id = $_GET['id'] ?? '';
        
        if (empty($entrada_id)) {
            respostaJson(false, null, 'ID da entrada não especificado', 400);
        }
        
        try {
            $entradas_table = getTableName('entradas');
            
            // Verificar se existe
            $check_stmt = $pdo->prepare("SELECT Id_Entrada FROM $entradas_table WHERE Id_Entrada = :id");
            $check_stmt->execute(['id' => $entrada_id]);
            
            if (!$check_stmt->fetch()) {
                respostaJson(false, null, 'Entrada não encontrada', 404);
            }
            
            // Deletar entrada (cascade deve deletar relacionamentos)
            $stmt = $pdo->prepare("DELETE FROM $entradas_table WHERE Id_Entrada = :id");
            $stmt->execute(['id' => $entrada_id]);
            
            logSimples('✅ Entrada deletada', ['entrada_id' => $entrada_id]);
            
            respostaJson(true, null, 'Entrada deletada com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao deletar entrada', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao deletar entrada', 500);
        }
        break;
        
    default:
        respostaJson(false, null, 'Método não permitido', 405);
}

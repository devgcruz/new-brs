<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Relatórios Financeiros
 * Endpoint específico para gerar relatórios financeiros completos
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
        // Gerar relatório financeiro
        $data_inicio = $_GET['data_inicio'] ?? '';
        $data_fim = $_GET['data_fim'] ?? '';
        $status = $_GET['status'] ?? '';
        $page = (int)($_GET['page'] ?? 1);
        $per_page = (int)($_GET['per_page'] ?? 50);
        
        $offset = ($page - 1) * $per_page;
        
        try {
            // Obter nomes das tabelas
            $entradas_table = getTableName('entradas');
            $financeiros_table = getTableName('financeiros');
            
            // Construir condições de filtro
            $where_conditions = [];
            $params = [];
            
            // Filtro por data (usando data de criação da entrada ou data do financeiro)
            if (!empty($data_inicio)) {
                // Filtrar por data de criação da entrada ou data de criação do financeiro
                $where_conditions[] = "(e.DATA_ENTRADA >= :data_inicio OR f.created_at >= :data_inicio)";
                $params['data_inicio'] = $data_inicio;
            }
            
            if (!empty($data_fim)) {
                // Adicionar 1 dia para incluir o dia inteiro
                $data_fim_extended = date('Y-m-d', strtotime($data_fim . ' +1 day'));
                $where_conditions[] = "(e.DATA_ENTRADA < :data_fim OR f.created_at < :data_fim)";
                $params['data_fim'] = $data_fim_extended;
            }
            
            // Filtro por status (usando status do financeiro)
            if (!empty($status) && $status !== 'todos') {
                $where_conditions[] = "f.StatusPG = :status";
                $params['status'] = $status;
            }
            
            $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
            
            // Contar total de lançamentos financeiros (CORREÇÃO: Contar financeiros, não entradas)
            $count_sql = "
                SELECT COUNT(DISTINCT f.Id_Financeiro) as total 
                FROM $financeiros_table f 
                LEFT JOIN $entradas_table e ON f.ID_ENTRADA = e.Id_Entrada 
                $where_clause
            ";
            $count_stmt = $pdo->prepare($count_sql);
            $count_stmt->execute($params);
            $total = $count_stmt->fetch()['total'];
            
            // Buscar lançamentos financeiros diretamente (CORREÇÃO: Não agrupar por entrada)
            // Aplicar filtros diretamente na consulta SQL principal (CORREÇÃO: Filtros aplicados aqui)
            $sql = "
                SELECT 
                    f.Id_Financeiro,
                    f.ID_ENTRADA,
                    f.VALOR_TOTAL_RECIBO as valor_total_recibo,
                    f.VALOR_NOTA_FISCAL as valor_nota_fiscal,
                    f.StatusPG as status_pagamento,
                    f.DATA_NOTA_FISCAL as data_nota_fiscal_alt,
                    f.DATA_PAGAMENTO_RECIBO as data_pagamento_recibo,
                    f.DATA_PAGAMENTO_NOTA_FISCAL as data_pagamento_nota_fiscal,
                    f.NUMERO_NOTA_FISCAL as numero_nota_fiscal,
                    f.OBSERVACOES as observacao,
                    f.NUMERO_RECIBO as numero_recibo,
                    f.created_at,
                    f.updated_at,
                    e.Id_Entrada as entrada_id,
                    e.PLACA,
                    e.VEICULO,
                    e.MARCA,
                    e.SEGURADORA,
                    e.CHASSI,
                    e.COD_SINISTRO,
                    e.DATA_ENTRADA,
                    e.created_at as data_registro,
                    e.SITUACAO,
                    e.POSICAO,
                    e.UF,
                    e.CIDADE,
                    e.PROTOCOLO
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
            $financeiros = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Agrupar por entrada para manter a estrutura esperada pelo frontend
            $relatorios = [];
            $entradas_agrupadas = [];
            
            foreach ($financeiros as $financeiro) {
                $entrada_id = $financeiro['entrada_id'] ?? null;
                
                // Se não houver entrada_id, pular este registro
                if (empty($entrada_id)) {
                    continue;
                }
                
                // Criar estrutura da entrada se não existir
                if (!isset($entradas_agrupadas[$entrada_id])) {
                    $entradas_agrupadas[$entrada_id] = [
                        'entrada_id' => $entrada_id,
                        'placa' => $financeiro['PLACA'] ?? null,
                        'veiculo' => $financeiro['VEICULO'] ?? null,
                        'marca' => $financeiro['MARCA'] ?? null,
                        'seguradora' => $financeiro['SEGURADORA'] ?? null,
                        'chassi' => $financeiro['CHASSI'] ?? null,
                        'cod_sinistro' => $financeiro['COD_SINISTRO'] ?? null,
                        'data_entrada' => $financeiro['DATA_ENTRADA'] ?? null,
                        'data_registro' => $financeiro['data_registro'] ?? null,
                        'situacao' => $financeiro['SITUACAO'] ?? null,
                        'posicao' => $financeiro['POSICAO'] ?? null,
                        'uf' => $financeiro['UF'] ?? null,
                        'cidade' => $financeiro['CIDADE'] ?? null,
                        'protocolo' => $financeiro['PROTOCOLO'] ?? null
                    ];
                }
                
                // Adicionar financeiro ao array de financeiros da entrada
                if (!isset($relatorios[$entrada_id])) {
                    $relatorios[$entrada_id] = [
                        'entrada' => $entradas_agrupadas[$entrada_id],
                        'financeiros' => []
                    ];
                }
                
                $relatorios[$entrada_id]['financeiros'][] = [
                    'Id_Financeiro' => $financeiro['Id_Financeiro'],
                    'valor_total_recibo' => $financeiro['valor_total_recibo'],
                    'valor_nota_fiscal' => $financeiro['valor_nota_fiscal'],
                    'status_pagamento' => $financeiro['status_pagamento'],
                    'data_nota_fiscal_alt' => $financeiro['data_nota_fiscal_alt'],
                    'data_pagamento_recibo' => $financeiro['data_pagamento_recibo'],
                    'data_pagamento_nota_fiscal' => $financeiro['data_pagamento_nota_fiscal'],
                    'numero_nota_fiscal' => $financeiro['numero_nota_fiscal'],
                    'observacao' => $financeiro['observacao'],
                    'created_at' => $financeiro['created_at'],
                    'updated_at' => $financeiro['updated_at']
                ];
            }
            
            $relatorios_filtrados = array_values($relatorios);
            
            $last_page = ceil($total / $per_page);
            
            // Calcular estatísticas
            $estatisticas = [
                'total_registros' => count($relatorios_filtrados),
                'total_recibos' => 0,
                'total_notas_fiscais' => 0,
                'total_geral' => 0
            ];
            
            foreach ($relatorios_filtrados as $relatorio) {
                foreach ($relatorio['financeiros'] as $financeiro) {
                    $estatisticas['total_recibos'] += floatval($financeiro['valor_total_recibo'] ?? 0);
                    $estatisticas['total_notas_fiscais'] += floatval($financeiro['valor_nota_fiscal'] ?? 0);
                }
            }
            
            $estatisticas['total_geral'] = $estatisticas['total_recibos'] + $estatisticas['total_notas_fiscais'];
            
            respostaJson(true, [
                'relatorios' => array_values($relatorios_filtrados),
                'estatisticas' => $estatisticas,
                'meta' => [
                    'current_page' => $page,
                    'last_page' => $last_page,
                    'per_page' => $per_page,
                    'total' => $total,
                    'from' => $offset + 1,
                    'to' => min($offset + $per_page, $total)
                ]
            ], 'Relatório financeiro gerado com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao gerar relatório financeiro', [
                'erro' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            respostaJson(false, null, 'Erro ao gerar relatório financeiro: ' . $e->getMessage(), 500);
        }
        break;
        
    case 'POST':
        // Gerar relatório para PDF
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        try {
            // Obter nomes das tabelas
            $entradas_table = getTableName('entradas');
            $financeiros_table = getTableName('financeiros');
            
            // Construir condições de filtro
            $where_conditions = [];
            $params = [];
            
            // Filtro por data
            if (!empty($data['data_inicio'])) {
                $where_conditions[] = "e.DATA_ENTRADA >= :data_inicio";
                $params['data_inicio'] = $data['data_inicio'];
            }
            
            if (!empty($data['data_fim'])) {
                $where_conditions[] = "e.DATA_ENTRADA <= :data_fim";
                $params['data_fim'] = $data['data_fim'];
            }
            
            // Filtro por status
            if (!empty($data['status']) && $data['status'] !== 'todos') {
                $where_conditions[] = "f.StatusPG = :status";
                $params['status'] = $data['status'];
            }
            
            $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
            
            // Buscar todos os dados para PDF (sem paginação)
            $sql = "
                SELECT DISTINCT
                    e.Id_Entrada as entrada_id,
                    e.PLACA,
                    e.VEICULO,
                    e.MARCA,
                    e.SEGURADORA,
                    e.CHASSI,
                    e.COD_SINISTRO,
                    e.DATA_ENTRADA,
                    e.created_at as data_registro,
                    e.SITUACAO,
                    e.POSICAO,
                    e.UF,
                    e.CIDADE
                FROM $entradas_table e 
                INNER JOIN $financeiros_table f ON e.Id_Entrada = f.ID_ENTRADA 
                $where_clause 
                ORDER BY e.DATA_ENTRADA DESC, e.Id_Entrada DESC
            ";
            
            $stmt = $pdo->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            $stmt->execute();
            $entradas = $stmt->fetchAll();
            
            // Para cada entrada, buscar seus lançamentos financeiros
            $relatorios = [];
            foreach ($entradas as $entrada) {
                $financeiros_sql = "
                    SELECT 
                        f.*,
                        f.VALOR_TOTAL_RECIBO as valor_total_recibo,
                        f.VALOR_NOTA_FISCAL as valor_nota_fiscal,
                        f.StatusPG as status_pagamento,
                        f.DATA_NOTA_FISCAL as data_nota_fiscal_alt,
                        f.DATA_PAGAMENTO_RECIBO as data_pagamento_recibo,
                        f.DATA_PAGAMENTO_NOTA_FISCAL as data_pagamento_nota_fiscal,
                        f.NUMERO_NOTA_FISCAL as numero_nota_fiscal,
                        f.OBSERVACOES as observacao,
                        f.created_at,
                        f.updated_at
                    FROM $financeiros_table f 
                    WHERE f.ID_ENTRADA = :entrada_id 
                    ORDER BY f.created_at DESC
                ";
                
                $financeiros_stmt = $pdo->prepare($financeiros_sql);
                $financeiros_stmt->execute(['entrada_id' => $entrada['entrada_id']]);
                $financeiros = $financeiros_stmt->fetchAll();
                
                $relatorios[] = [
                    'entrada' => $entrada,
                    'financeiros' => $financeiros
                ];
            }
            
            // Filtrar apenas relatórios que têm lançamentos financeiros
            $relatorios_filtrados = array_filter($relatorios, function($relatorio) {
                return count($relatorio['financeiros']) > 0;
            });
            
            respostaJson(true, [
                'relatorios' => array_values($relatorios_filtrados),
                'filtros_aplicados' => $data
            ], 'Dados para PDF gerados com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao gerar dados para PDF', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao gerar dados para PDF', 500);
        }
        break;
        
    default:
        respostaJson(false, null, 'Método não permitido', 405);
}

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
            
            // Filtro por data (usando data de criação da entrada)
            if (!empty($data_inicio)) {
                $where_conditions[] = "e.DATA_ENTRADA >= :data_inicio";
                $params['data_inicio'] = $data_inicio;
            }
            
            if (!empty($data_fim)) {
                $where_conditions[] = "e.DATA_ENTRADA <= :data_fim";
                $params['data_fim'] = $data_fim;
            }
            
            // Filtro por status (usando status do financeiro)
            if (!empty($status) && $status !== 'todos') {
                $where_conditions[] = "f.StatusPG = :status";
                $params['status'] = $status;
            }
            
            $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
            
            // Contar total de entradas que têm lançamentos financeiros
            $count_sql = "
                SELECT COUNT(DISTINCT e.Id_Entrada) as total 
                FROM $entradas_table e 
                INNER JOIN $financeiros_table f ON e.Id_Entrada = f.ID_ENTRADA 
                $where_clause
            ";
            $count_stmt = $pdo->prepare($count_sql);
            $count_stmt->execute($params);
            $total = $count_stmt->fetch()['total'];
            
            // Buscar entradas com seus lançamentos financeiros
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
                
                // Aplicar filtros adicionais nos financeiros se necessário
                $financeiros_filtrados = $financeiros;
                if (!empty($status) && $status !== 'todos') {
                    $financeiros_filtrados = array_filter($financeiros, function($fin) use ($status) {
                        return $fin['status_pagamento'] === $status;
                    });
                }
                
                // Aplicar filtro de data nos financeiros se necessário
                if (!empty($data_inicio) || !empty($data_fim)) {
                    $financeiros_filtrados = array_filter($financeiros_filtrados, function($fin) use ($data_inicio, $data_fim) {
                        $datas_para_verificar = [
                            $fin['data_pagamento_recibo'],
                            $fin['data_pagamento_nota_fiscal'],
                            $fin['data_nota_fiscal_alt'],
                            $fin['created_at']
                        ];
                        
                        // Remover valores nulos/vazios
                        $datas_para_verificar = array_filter($datas_para_verificar, function($data) {
                            return !empty($data);
                        });
                        
                        if (empty($datas_para_verificar)) {
                            return true;
                        }
                        
                        foreach ($datas_para_verificar as $data) {
                            $data_lancamento = new DateTime($data);
                            
                            if (!empty($data_inicio)) {
                                $data_inicio_obj = new DateTime($data_inicio);
                                if ($data_lancamento < $data_inicio_obj) continue;
                            }
                            
                            if (!empty($data_fim)) {
                                $data_fim_obj = new DateTime($data_fim);
                                if ($data_lancamento > $data_fim_obj) continue;
                            }
                            
                            return true;
                        }
                        
                        return false;
                    });
                }
                
                $relatorios[] = [
                    'entrada' => $entrada,
                    'financeiros' => array_values($financeiros_filtrados)
                ];
            }
            
            // Filtrar apenas relatórios que têm lançamentos financeiros após filtros
            $relatorios_filtrados = array_filter($relatorios, function($relatorio) {
                return count($relatorio['financeiros']) > 0;
            });
            
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

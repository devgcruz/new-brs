<?php

// Configurar tratamento de erros para evitar output HTML
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint: GET/POST /entradas/{entrada}/financeiros
 * Listar ou criar lançamentos financeiros para uma entrada específica
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/config/table-mapping.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

// Verificar autenticação
$usuario = middlewareAutenticacao();

// Capturar qualquer output não intencional
ob_start();

try {
    // Obter ID da entrada
    $entrada_id = $_GET['entrada_id'] ?? '';
    
    if (!is_numeric($entrada_id)) {
        respostaJson(false, null, 'ID da entrada inválido', 400);
    }
    
    // Verificar se a entrada existe
    $entradas_table = getTableName('entradas');
    $stmt = $pdo->prepare("SELECT Id_Entrada, PLACA, VEICULO, MARCA FROM $entradas_table WHERE Id_Entrada = :id LIMIT 1");
    $stmt->execute(['id' => $entrada_id]);
    $entrada = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$entrada) {
        respostaJson(false, null, 'Entrada não encontrada', 404);
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        // LISTAR financeiros da entrada
        
        $financeiros_table = getTableName('financeiros');
        $stmt = $pdo->prepare("
            SELECT f.*
            FROM $financeiros_table f
            WHERE f.ID_ENTRADA = :entrada_id
            ORDER BY f.created_at DESC
        ");
        $stmt->execute(['entrada_id' => $entrada_id]);
        $financeiros = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Log da consulta
        logSimples('entradas_financeiros_list', [
            'entrada_id' => $entrada_id,
            'placa' => $entrada['PLACA'],
            'total_registros' => count($financeiros),
            'usuario' => $usuario['Usuario']
        ]);
        
        respostaJson(true, [
            'entrada' => [
                'id' => $entrada['Id_Entrada'],
                'placa' => $entrada['PLACA'],
                'veiculo' => $entrada['VEICULO'],
                'marca' => $entrada['MARCA']
            ],
            'financeiros' => $financeiros
        ], 'Lançamentos financeiros obtidos com sucesso');
        
    } elseif ($method === 'POST') {
        // CRIAR novo financeiro para a entrada
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            respostaJson(false, null, 'Dados não fornecidos', 400);
        }
        
        // Validações básicas - validar campos que o frontend envia
        $campos_obrigatorios = ['Honorarios', 'Vlr_Despesas'];
        foreach ($campos_obrigatorios as $campo) {
            if (!isset($input[$campo]) || $input[$campo] === '') {
                respostaJson(false, null, "Campo '{$campo}' é obrigatório", 400);
            }
        }
        
        // Preparar dados - mapear para os nomes corretos das colunas
        $dados = [
            'ID_ENTRADA' => $entrada_id,
            'VALOR_TOTAL_RECIBO' => floatval($input['Honorarios'] ?? 0),
            'VALOR_NOTA_FISCAL' => floatval($input['Vlr_Despesas'] ?? 0),
            'StatusPG' => $input['StatusPG'] ?? 'Pendente',
            'DATA_NOTA_FISCAL' => $input['DATA_NF'] ?? '',
            'OBSERVACOES' => $input['OBSERVACOES'] ?? '',
            'NUMERO_RECIBO' => $input['NUMERO_RECIBO'] ?? '',
            'data_recibo' => $input['data_recibo'] ?? '',
            'DATA_PAGAMENTO_RECIBO' => $input['DATA_PAGAMENTO_RECIBO'] ?? '',
            'NUMERO_NOTA_FISCAL' => $input['NUMERO_NOTA_FISCAL'] ?? '',
            'DATA_PAGAMENTO_NOTA_FISCAL' => $input['DATA_PAGAMENTO_NOTA_FISCAL'] ?? '',
            'status_nota_fiscal' => $input['status_nota_fiscal'] ?? '',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        // Inserir no banco
        $financeiros_table = getTableName('financeiros');
        $campos = implode(', ', array_keys($dados));
        $valores = ':' . implode(', :', array_keys($dados));
        
        $stmt = $pdo->prepare("INSERT INTO $financeiros_table ({$campos}) VALUES ({$valores})");
        $stmt->execute($dados);
        
        $financeiro_id = $pdo->lastInsertId();
        
        // Log da criação
        logSimples('entradas_financeiros_create', [
            'entrada_id' => $entrada_id,
            'placa' => $entrada['PLACA'],
            'financeiro_id' => $financeiro_id,
            'valor_recibo' => $dados['VALOR_TOTAL_RECIBO'],
            'valor_nota_fiscal' => $dados['VALOR_NOTA_FISCAL'],
            'usuario' => $usuario['Usuario']
        ]);
        
        respostaJson(true, [
            'id' => $financeiro_id,
            'entrada_id' => $entrada_id,
            'valor_recibo' => $dados['VALOR_TOTAL_RECIBO'],
            'valor_nota_fiscal' => $dados['VALOR_NOTA_FISCAL'],
            'status' => $dados['StatusPG']
        ], 'Lançamento financeiro criado com sucesso', 201);
        
    } else {
        respostaJson(false, null, 'Método não permitido', 405);
    }
    
    // Limpar qualquer output não intencional antes da resposta
    ob_end_clean();
    
} catch (Exception $e) {
    // Limpar qualquer output não intencional
    ob_end_clean();
    logSimples('error', [
        'endpoint' => 'entradas-financeiros',
        'erro' => $e->getMessage(),
        'usuario' => $usuario['Usuario'] ?? 'N/A'
    ]);
    
    respostaJson(false, null, 'Erro ao processar financeiros: ' . $e->getMessage(), 500);
}

<?php

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';

header("Content-Type: application/json");

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/config/table-mapping.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

// Verificar autenticação e permissão
$usuario = middlewareAutenticacao();
middlewarePermissao('acessar-relatorios');

if ($method !== 'GET') {
    respostaJson(false, null, 'Método não permitido', 405);
}

$tabelaEntrada = getTableName('entradas');
$tabelaFinanceiro = getTableName('financeiros');

// Obter filtros da query string
$dataInicio = $_GET['data_inicio'] ?? '1970-01-01';
$dataFim = $_GET['data_fim'] ?? date('Y-m-d');
// Adiciona +1 dia ao dataFim para incluir o dia inteiro
$dataFim = date('Y-m-d', strtotime($dataFim . ' +1 day'));

try {
    // Consulta SQL com JOIN e GROUP BY
    // Agrega múltiplos lançamentos financeiros numa única linha por entrada
    $sql = "
        SELECT 
            e.id as ID_Entrada,
            e.Protocolo,
            e.Data_Entrada,
            e.VEICULO,
            e.PLACA,
            e.CHASSI,
            e.N_Sinistro,
            e.SEGURADORA,
            
            -- Despesas (Tipo_Lancamento = 1)
            SUM(CASE WHEN f.Tipo_Lancamento = 1 THEN f.Valor_Nota ELSE 0 END) as Total_Despesas,
            GROUP_CONCAT(DISTINCT CASE WHEN f.Tipo_Lancamento = 1 THEN f.Data_Inclusao_NF END SEPARATOR '\n') as Datas_Inclusao_Despesas,
            GROUP_CONCAT(DISTINCT CASE WHEN f.Tipo_Lancamento = 1 THEN f.Data_Pagto_Nota END SEPARATOR '\n') as Datas_Pagto_Despesas,
            
            -- Notas Fiscais (Honorários) (Tipo_Lancamento = 0)
            GROUP_CONCAT(DISTINCT CASE WHEN f.Tipo_Lancamento = 0 THEN f.N_Nota_Fiscal END SEPARATOR '\n') as Notas_Fiscais,
            GROUP_CONCAT(DISTINCT CASE WHEN f.Tipo_Lancamento = 0 THEN f.Data_Inclusao_NF END SEPARATOR '\n') as Datas_Inclusao_NF,
            SUM(CASE WHEN f.Tipo_Lancamento = 0 THEN f.Valor_Nota ELSE 0 END) as Total_Honorarios,
            GROUP_CONCAT(DISTINCT CASE WHEN f.Tipo_Lancamento = 0 THEN f.Data_Pagto_Nota END SEPARATOR '\n') as Datas_Pagto_Honorarios,

            GROUP_CONCAT(DISTINCT f.Status_Pagamento SEPARATOR '\n') as Status_Pagamentos

        FROM 
            $tabelaEntrada e
        LEFT JOIN 
            $tabelaFinanceiro f ON e.ID_Entrada = f.ID_Entrada
        WHERE 
            e.Data_Entrada >= :dataInicio AND e.Data_Entrada < :dataFim
        GROUP BY 
            e.ID_Entrada
        ORDER BY
            e.Data_Entrada DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['dataInicio' => $dataInicio, 'dataFim' => $dataFim]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $total = count($data); 

    respostaJson(true, $data, 'Relatório gerado com sucesso', 200);

} catch (PDOException $e) {
    respostaJson(false, null, 'Erro ao gerar relatório: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    respostaJson(false, null, 'Erro ao gerar relatório: ' . $e->getMessage(), 500);
}


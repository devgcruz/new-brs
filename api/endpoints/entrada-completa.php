<?php
/**
 * Endpoint para buscar dados completos de uma entrada (incluindo observações)
 * Usado para gerar o relatório PDF
 */

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/config/table-mapping.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

// Verificar autenticação
$usuario = middlewareAutenticacao();

if ($method !== 'GET') {
    respostaJson(false, null, 'Método não permitido', 405);
}

// Verificar se o ID foi fornecido
if (!isset($_GET['id'])) {
    respostaJson(false, null, 'ID do registro não fornecido', 400);
}

$idEntrada = (int)$_GET['id'];

// Obter nomes das tabelas
$tEntrada = getTableName('entradas');
$tObservacoes = getTableName('observacoes');
$tColaboradores = getTableName('colaboradores');
$tUsuarios = getTableName('usuarios');

try {
    // 1. Buscar dados principais da entrada
    // Juntar com Colaboradores para obter o nome do responsável
    // Selecionar explicitamente todos os campos necessários
    // Usar SELECT * para evitar problemas com campos que possam não existir
    // e depois filtrar apenas os campos necessários
    $sqlEntrada = "
        SELECT 
            e.*,
            c.nome as colaborador_nome 
        FROM $tEntrada e
        LEFT JOIN $tColaboradores c ON e.ID_COLABORADOR = c.id
        WHERE e.Id_Entrada = :id
        LIMIT 1
    ";
    
    logSimples('🔍 Buscando entrada completa', ['id' => $idEntrada, 'sql' => $sqlEntrada]);
    
    $stmtEntrada = $pdo->prepare($sqlEntrada);
    $stmtEntrada->execute(['id' => $idEntrada]);
    $entrada = $stmtEntrada->fetch(PDO::FETCH_ASSOC);

    if (!$entrada) {
        logSimples('⚠️ Entrada não encontrada', ['id' => $idEntrada]);
        respostaJson(false, null, 'Registro não encontrado', 404);
    }
    
    logSimples('✅ Entrada encontrada', ['id' => $idEntrada, 'placa' => $entrada['PLACA'] ?? 'N/A']);

    // 2. Buscar todas as observações associadas
    // Juntar com Usuarios para obter o nome de quem postou
    $sqlObs = "
        SELECT 
            o.*,
            u.nome as usuario_nome,
            u.profile_photo_path
        FROM $tObservacoes o
        LEFT JOIN $tUsuarios u ON o.usuario_id = u.id 
        WHERE o.entrada_id = :id 
        ORDER BY o.created_at ASC
    ";
    
    logSimples('🔍 Buscando observações', ['id' => $idEntrada, 'sql' => $sqlObs]);
    
    $stmtObs = $pdo->prepare($sqlObs);
    $stmtObs->execute(['id' => $idEntrada]);
    $observacoes = $stmtObs->fetchAll(PDO::FETCH_ASSOC);
    
    logSimples('✅ Observações encontradas', ['id' => $idEntrada, 'total' => count($observacoes)]);

    // 3. Formatar observações para o formato esperado
    $observacoesFormatadas = array_map(function($obs) {
        return [
            'id' => $obs['id'] ?? null,
            'entrada_id' => $obs['entrada_id'] ?? null,
            'texto' => $obs['texto'] ?? $obs['observacao'] ?? '',
            'observacao' => $obs['texto'] ?? $obs['observacao'] ?? '',
            'Data_Observacao' => $obs['created_at'] ?? $obs['data'] ?? $obs['data_criacao'] ?? '',
            'created_at' => $obs['created_at'] ?? $obs['data'] ?? $obs['data_criacao'] ?? '',
            'usuario_id' => $obs['usuario_id'] ?? null,
            'usuario_nome' => $obs['usuario_nome'] ?? 'Usuário Anônimo',
            'usuario' => [
                'id' => $obs['usuario_id'] ?? null,
                'name' => $obs['usuario_nome'] ?? 'Usuário Anônimo',
                'profile_photo_path' => $obs['profile_photo_path'] ?? null
            ]
        ];
    }, $observacoes);

    // 4. Combinar os resultados
    $entrada['observacoes'] = $observacoesFormatadas;

    respostaJson(true, $entrada, 'Dados completos da entrada obtidos com sucesso');

} catch (PDOException $e) {
    logSimples('❌ Erro ao buscar entrada completa', ['erro' => $e->getMessage(), 'id' => $idEntrada]);
    respostaJson(false, null, 'Erro de banco de dados: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    logSimples('❌ Erro geral ao buscar entrada completa', ['erro' => $e->getMessage(), 'id' => $idEntrada]);
    respostaJson(false, null, 'Erro ao buscar dados: ' . $e->getMessage(), 500);
}
?>


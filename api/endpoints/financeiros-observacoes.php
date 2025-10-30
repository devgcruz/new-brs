<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint: GET/POST /financeiros/{financeiro_id}/observacoes
 * Listar ou criar observações para um lançamento financeiro específico
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

try {
    // Obter ID do lançamento financeiro
    $financeiro_id = $_GET['financeiro_id'] ?? '';
    
    if (!is_numeric($financeiro_id)) {
        respostaJson(false, null, 'ID do lançamento financeiro inválido', 400);
    }
    
    // Verificar se o lançamento financeiro existe
    $financeiros_table = getTableName('financeiros');
    $entradas_table = getTableName('entradas');
    $stmt = $pdo->prepare("
        SELECT f.Id_Financeiro, f.ID_ENTRADA, e.PLACA, e.VEICULO, e.MARCA 
        FROM $financeiros_table f
        LEFT JOIN $entradas_table e ON f.ID_ENTRADA = e.Id_Entrada
        WHERE f.Id_Financeiro = :id LIMIT 1
    ");
    $stmt->execute(['id' => $financeiro_id]);
    $financeiro = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$financeiro) {
        respostaJson(false, null, 'Lançamento financeiro não encontrado', 404);
    }
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        // LISTAR observações do lançamento financeiro
        
        $observacoes_table = getTableName('observacoes_financeiro');
        $usuarios_table = getTableName('usuarios');
        
        $stmt = $pdo->prepare("
            SELECT 
                o.Id_Observacao as id,
                o.ID_FINANCEIRO,
                o.ID_USUARIO,
                o.texto,
                o.foto_url,
                o.created_at,
                o.updated_at,
                u.id as usuario_id,
                u.nome as usuario_name,
                u.email as usuario_email,
                u.profile_photo_path as profile_photo_url
            FROM $observacoes_table o
            LEFT JOIN $usuarios_table u ON o.ID_USUARIO = u.id
            WHERE o.ID_FINANCEIRO = :financeiro_id
            ORDER BY o.created_at DESC
        ");
        $stmt->execute(['financeiro_id' => $financeiro_id]);
        $observacoes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Formatar dados para o frontend
        $observacoes_formatadas = array_map(function($obs) {
            return [
                'id' => $obs['id'],
                'financeiro_id' => $obs['ID_FINANCEIRO'],
                'texto' => $obs['texto'],
                'foto_url' => $obs['foto_url'],
                'created_at' => $obs['created_at'],
                'updated_at' => $obs['updated_at'],
                'usuario' => [
                    'id' => $obs['usuario_id'],
                    'name' => $obs['usuario_name'],
                    'email' => $obs['usuario_email'],
                    'profile_photo_url' => $obs['profile_photo_url']
                ]
            ];
        }, $observacoes);
        
        // Log da consulta
        logSimples('financeiros_observacoes_list', [
            'financeiro_id' => $financeiro_id,
            'entrada_id' => $financeiro['ID_ENTRADA'],
            'placa' => $financeiro['PLACA'],
            'total_registros' => count($observacoes_formatadas),
            'usuario' => $usuario['Usuario']
        ]);
        
        respostaJson(true, [
            'financeiro' => [
                'id' => $financeiro['Id_Financeiro'],
                'entrada_id' => $financeiro['ID_ENTRADA'],
                'placa' => $financeiro['PLACA'],
                'veiculo' => $financeiro['VEICULO'],
                'marca' => $financeiro['MARCA']
            ],
            'observacoes' => $observacoes_formatadas
        ], 'Observações obtidas com sucesso');
        
    } elseif ($method === 'POST') {
        // CRIAR nova observação para o lançamento financeiro
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            respostaJson(false, null, 'Dados não fornecidos', 400);
        }
        
        // Validações básicas
        if (empty($input['texto'])) {
            respostaJson(false, null, 'Campo texto é obrigatório', 400);
        }
        
        // Preparar dados para inserção
        $observacoes_table = getTableName('observacoes_financeiro');
        $dados = [
            'ID_FINANCEIRO' => $financeiro_id,
            'ID_USUARIO' => $usuario['id'],
            'texto' => trim($input['texto']),
            'foto_url' => $input['foto_url'] ?? null,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        // Inserir no banco
        $campos = implode(', ', array_keys($dados));
        $valores = ':' . implode(', :', array_keys($dados));
        
        $stmt = $pdo->prepare("INSERT INTO $observacoes_table ({$campos}) VALUES ({$valores})");
        $stmt->execute($dados);
        
        $observacao_id = $pdo->lastInsertId();
        
        // Log da criação
        logSimples('financeiros_observacoes_create', [
            'financeiro_id' => $financeiro_id,
            'entrada_id' => $financeiro['ID_ENTRADA'],
            'placa' => $financeiro['PLACA'],
            'observacao_id' => $observacao_id,
            'usuario' => $usuario['Usuario']
        ]);
        
        respostaJson(true, [
            'id' => $observacao_id,
            'financeiro_id' => $financeiro_id,
            'texto' => $dados['texto'],
            'foto_url' => $dados['foto_url'],
            'created_at' => $dados['created_at'],
            'usuario' => [
                'id' => $usuario['id'],
                'name' => $usuario['nome'],
                'email' => $usuario['email'],
                'profile_photo_url' => $usuario['profile_photo_path'] ?? null
            ]
        ], 'Observação criada com sucesso', 201);
        
    } else {
        respostaJson(false, null, 'Método não permitido', 405);
    }
    
} catch (Exception $e) {
    logSimples('error', [
        'endpoint' => 'financeiros-observacoes',
        'erro' => $e->getMessage(),
        'usuario' => $usuario['Usuario'] ?? 'N/A'
    ]);
    
    respostaJson(false, null, 'Erro ao processar observações: ' . $e->getMessage(), 500);
}

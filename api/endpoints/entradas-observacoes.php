<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint: GET/POST /entradas/{entrada}/observacoes
 * Listar ou criar observações para uma entrada específica
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
        // LISTAR observações da entrada
        
        // Buscar observações com dados do usuário
        $sql = "
            SELECT o.*, u.nome as usuario_nome, u.profile_photo_path 
            FROM observacoes o 
            LEFT JOIN usuarios u ON o.usuario_id = u.id 
            WHERE o.entrada_id = :entrada_id 
            ORDER BY o.created_at DESC
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['entrada_id' => $entrada_id]);
        $observacoes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Transformar dados para o formato esperado pelo frontend
        $observacoesFormatadas = array_map(function($obs) {
            return [
                'id' => $obs['id'],
                'entrada_id' => $obs['entrada_id'],
                'texto' => $obs['texto'],
                'created_at' => $obs['created_at'],
                'updated_at' => $obs['updated_at'],
                'usuario' => [
                    'id' => $obs['usuario_id'],
                    'name' => $obs['usuario_nome'] ?: 'Usuário Anônimo',
                    'profile_photo_path' => $obs['profile_photo_path']
                ]
            ];
        }, $observacoes);
        
        // Log da consulta
        logSimples('entradas_observacoes_list', [
            'entrada_id' => $entrada_id,
            'placa' => $entrada['PLACA'],
            'total_registros' => count($observacoesFormatadas),
            'usuario' => $usuario['Usuario']
        ]);
        
        respostaJson(true, [
            'entrada' => [
                'id' => $entrada['Id_Entrada'],
                'placa' => $entrada['PLACA'],
                'veiculo' => $entrada['VEICULO'],
                'marca' => $entrada['MARCA']
            ],
            'observacoes' => $observacoesFormatadas
        ], 'Observações obtidas com sucesso');
        
    } elseif ($method === 'POST') {
        // CRIAR nova observação para a entrada
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            respostaJson(false, null, 'Dados não fornecidos', 400);
        }
        
        // Validações básicas
        if (empty($input['texto'])) {
            respostaJson(false, null, 'Campo texto é obrigatório', 400);
        }
        
        try {
            // Criar observação
            $sql = "INSERT INTO observacoes (
                entrada_id, usuario_id, texto, created_at, updated_at
            ) VALUES (
                :entrada_id, :usuario_id, :texto, NOW(), NOW()
            )";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'entrada_id' => $entrada_id,
                'usuario_id' => $usuario['id'],
                'texto' => sanitizar($input['texto'])
            ]);
            
            $observacao_id = $pdo->lastInsertId();
            
            // Buscar observação criada com dados do usuário
            $sql = "
                SELECT o.*, u.nome as usuario_nome, u.profile_photo_path 
                FROM observacoes o 
                LEFT JOIN usuarios u ON o.usuario_id = u.id 
                WHERE o.id = :observacao_id
            ";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute(['observacao_id' => $observacao_id]);
            $observacao = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Transformar dados para o formato esperado pelo frontend
            $observacaoFormatada = [
                'id' => $observacao['id'],
                'entrada_id' => $observacao['entrada_id'],
                'texto' => $observacao['texto'],
                'created_at' => $observacao['created_at'],
                'updated_at' => $observacao['updated_at'],
                'usuario' => [
                    'id' => $observacao['usuario_id'],
                    'name' => $observacao['usuario_nome'] ?: 'Usuário Anônimo',
                    'profile_photo_path' => $observacao['profile_photo_path']
                ]
            ];
            
            // Log da criação
            logSimples('entradas_observacoes_create', [
                'entrada_id' => $entrada_id,
                'placa' => $entrada['PLACA'],
                'observacao_id' => $observacao_id,
                'usuario' => $usuario['Usuario']
            ]);
            
            respostaJson(true, $observacaoFormatada, 'Observação criada com sucesso', 201);
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao criar observação', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao criar observação', 500);
        }
        
    } else {
        respostaJson(false, null, 'Método não permitido', 405);
    }
    
} catch (Exception $e) {
    logSimples('error', [
        'endpoint' => 'entradas-observacoes',
        'erro' => $e->getMessage(),
        'usuario' => $usuario['Usuario'] ?? 'N/A'
    ]);
    
    respostaJson(false, null, 'Erro ao processar observações: ' . $e->getMessage(), 500);
}

<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Observações
 * Substitui ObservacaoController do Laravel
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];
$usuario = middlewareAutenticacao();

switch ($method) {
    case 'GET':
        // Listar observações de uma entrada específica
        $entrada_id = $_GET['entrada'] ?? $_GET['entrada_id'] ?? '';
        
        if (empty($entrada_id)) {
            respostaJson(false, null, 'ID da entrada é obrigatório', 400);
        }
        
        try {
            // Verificar se a entrada existe
            $stmt = $pdo->prepare("SELECT Id_Entrada FROM entradas WHERE Id_Entrada = :entrada_id LIMIT 1");
            $stmt->execute(['entrada_id' => $entrada_id]);
            
            if (!$stmt->fetch()) {
                respostaJson(false, null, 'Entrada não encontrada', 404);
            }
            
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
            $observacoes = $stmt->fetchAll();
            
            respostaJson(true, $observacoes);
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao listar observações', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao buscar observações', 500);
        }
        break;
        
    case 'POST':
        // Criar nova observação
        $entrada_id = $_GET['entrada'] ?? $_GET['entrada_id'] ?? '';
        
        if (empty($entrada_id)) {
            respostaJson(false, null, 'ID da entrada é obrigatório', 400);
        }
        
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (!$data) {
            respostaJson(false, null, 'Dados JSON inválidos', 400);
        }
        
        validarDadosObrigatorios($data, ['texto']);
        
        try {
            // Verificar se a entrada existe
            $stmt = $pdo->prepare("SELECT Id_Entrada FROM entradas WHERE Id_Entrada = :entrada_id LIMIT 1");
            $stmt->execute(['entrada_id' => $entrada_id]);
            
            if (!$stmt->fetch()) {
                respostaJson(false, null, 'Entrada não encontrada', 404);
            }
            
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
                'texto' => sanitizar($data['texto'])
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
            $observacao = $stmt->fetch();
            
            logSimples('✅ Observação criada', [
                'observacao_id' => $observacao_id,
                'entrada_id' => $entrada_id,
                'usuario' => $usuario['Usuario']
            ]);
            
            respostaJson(true, $observacao, 'Observação criada com sucesso', 201);
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao criar observação', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao criar observação', 500);
        }
        break;
        
    case 'DELETE':
        // Deletar observação
        $observacao_id = $_GET['id'] ?? '';
        
        if (empty($observacao_id)) {
            respostaJson(false, null, 'ID da observação não especificado', 400);
        }
        
        try {
            // Verificar se existe e se o usuário pode deletar
            $stmt = $pdo->prepare("
                SELECT id, usuario_id, entrada_id 
                FROM observacoes 
                WHERE id = :id LIMIT 1
            ");
            $stmt->execute(['id' => $observacao_id]);
            $observacao = $stmt->fetch();
            
            if (!$observacao) {
                respostaJson(false, null, 'Observação não encontrada', 404);
            }
            
            // Verificar se o usuário pode deletar (própria observação ou admin)
            // O campo nivel pode ser string ou inteiro dependendo da implementação
            $isAdmin = ($usuario['nivel'] === 'Administrador' || $usuario['nivel'] === 0 || $usuario['nivel'] === '0');
            
            if ($observacao['usuario_id'] != $usuario['id'] && !$isAdmin) {
                respostaJson(false, null, 'Você só pode deletar suas próprias observações', 403);
            }
            
            // Deletar observação
            $stmt = $pdo->prepare("DELETE FROM observacoes WHERE id = :id");
            $stmt->execute(['id' => $observacao_id]);
            
            logSimples('✅ Observação deletada', [
                'observacao_id' => $observacao_id,
                'entrada_id' => $observacao['entrada_id'],
                'usuario' => $usuario['Usuario']
            ]);
            
            respostaJson(true, null, 'Observação deletada com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao deletar observação', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao deletar observação', 500);
        }
        break;
        
    default:
        respostaJson(false, null, 'Método não permitido', 405);
}

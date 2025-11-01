<?php

// Não incluir CORS para visualização de documento (precisa de Content-Type específico)
/**
 * Endpoint: GET /colaborador-docs-view
 * Visualização pública de documento usando token de visualização
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/config/table-mapping.php";
require_once API_BASE_DIR . "/config/upload.php";
require_once API_BASE_DIR . "/helpers/auth.php";

// Definir diretório de upload para documentos de colaboradores
define('COLABORADOR_DOCS_UPLOAD_DIR', UPLOAD_BASE_DIR . 'colaborador-docs/');

// Verificar método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

try {
    // Obter ID do documento da URL
    $doc_id = $_GET['id'] ?? '';
    
    if (!is_numeric($doc_id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID do documento inválido']);
        exit;
    }
    
    // Obter token da query string
    $token = $_GET['token'] ?? '';
    
    if (empty($token)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Token de visualização não fornecido']);
        exit;
    }
    
    // Buscar documento com token
    $docs_table = getTableName('colaborador_docs');
    $colaboradores_table = getTableName('colaboradores');
    
    $stmt = $pdo->prepare("
        SELECT 
            d.*,
            c.nome as colaborador_nome
        FROM $docs_table d
        LEFT JOIN $colaboradores_table c ON d.ID_Colaborador = c.id
        WHERE d.ID_Doc = :doc_id
        LIMIT 1
    ");
    $stmt->execute([
        'doc_id' => $doc_id
    ]);
    $doc = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$doc) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Documento não encontrado ou token inválido']);
        exit;
    }
    
    // Verificar token (se necessário)
    if ($doc['token_visualizacao'] && $doc['token_visualizacao'] !== $token) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Token inválido']);
        exit;
    }
    
    // Verificar se o arquivo existe
    $file_path = COLABORADOR_DOCS_UPLOAD_DIR . $doc['CAMINHOPDF'];
    
    if (!file_exists($file_path)) {
        logSimples('error', [
            'endpoint' => 'colaborador-doc-view',
            'erro' => 'Arquivo não encontrado: ' . $file_path,
            'doc_id' => $doc_id,
            'caminho' => $doc['CAMINHOPDF']
        ]);
        
        // Retornar uma página HTML simples explicando o problema
        http_response_code(200);
        header('Content-Type: text/html; charset=utf-8');
        echo '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Documento Não Disponível</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px auto; max-width: 500px; }
        .info { color: #1976d2; background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px auto; max-width: 500px; }
    </style>
</head>
<body>
    <div class="error">
        <h2>📄 Documento Não Disponível</h2>
        <p>O arquivo "<strong>' . htmlspecialchars($doc['DESCRICAO']) . '</strong>" não está disponível para visualização.</p>
    </div>
    <div class="info">
        <p><strong>Possíveis causas:</strong></p>
        <ul style="text-align: left;">
            <li>O arquivo foi removido ou movido</li>
            <li>Problema durante o upload inicial</li>
            <li>Arquivo corrompido</li>
        </ul>
        <p><strong>Solução:</strong> Faça o upload novamente do documento.</p>
    </div>
</body>
</html>';
        exit;
    }
    
    // Log da visualização
    logSimples('colaborador_doc_view', [
        'doc_id' => $doc_id,
        'colaborador_id' => $doc['ID_Colaborador'],
        'colaborador_nome' => $doc['colaborador_nome'],
        'arquivo' => $doc['DESCRICAO'],
        'token' => substr($token, 0, 10) . '...'
    ]);
    
    // Remover headers conflitantes do servidor
    header_remove('X-Frame-Options');
    
    // Detectar tipo MIME do arquivo
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file_path);
    finfo_close($finfo);
    
    // Definir headers para o documento
    header('Content-Type: ' . $mime_type);
    header('Content-Disposition: inline; filename="' . $doc['DESCRICAO'] . '"');
    header('Content-Length: ' . filesize($file_path));
    header('Cache-Control: private, max-age=0, must-revalidate');
    header('Pragma: public');
    
    // Headers para permitir exibição em iframe - sobrescrever X-Frame-Options
    header('X-Frame-Options: ALLOWALL');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    
    // Enviar arquivo
    readfile($file_path);
    exit;
    
} catch (Exception $e) {
    logSimples('error', [
        'endpoint' => 'colaborador-doc-view',
        'erro' => $e->getMessage()
    ]);
    
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro ao visualizar documento: ' . $e->getMessage()]);
    exit;
}


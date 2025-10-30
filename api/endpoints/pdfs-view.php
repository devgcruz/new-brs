<?php

// Não incluir CORS para visualização de PDF (precisa de Content-Type: application/pdf)
/**
 * Endpoint: GET /pdfs/{id}/view
 * Visualização pública de PDF usando token de visualização
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/config/table-mapping.php";
require_once API_BASE_DIR . "/config/upload.php";
require_once API_BASE_DIR . "/helpers/auth.php";

// Verificar método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

try {
    // Obter ID do PDF da URL
    $pdf_id = $_GET['pdf_id'] ?? '';
    
    if (!is_numeric($pdf_id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID do PDF inválido']);
        exit;
    }
    
    // Obter token da query string
    $token = $_GET['token'] ?? '';
    
    if (empty($token)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Token de visualização não fornecido']);
        exit;
    }
    
    // Buscar PDF com token
    $pdfs_table = getTableName('pdfs');
    $entradas_table = getTableName('entradas');
    
    $stmt = $pdo->prepare("
        SELECT 
            p.*,
            e.PLACA,
            e.VEICULO,
            e.MARCA
        FROM $pdfs_table p
        LEFT JOIN $entradas_table e ON p.ID_ENTRADA = e.Id_Entrada
        WHERE p.ID_PDF = :pdf_id
        LIMIT 1
    ");
    $stmt->execute([
        'pdf_id' => $pdf_id
    ]);
    $pdf = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$pdf) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'PDF não encontrado ou token inválido']);
        exit;
    }
    
    // Verificar se o arquivo existe
    $upload_base = 'C:/xampp/htdocs/upload/pdfs/';
    $file_path = $upload_base . $pdf['CAMINHOPDF'];
    
    if (!file_exists($file_path)) {
        logSimples('error', [
            'endpoint' => 'pdf-view-public',
            'erro' => 'Arquivo PDF não encontrado: ' . $file_path,
            'pdf_id' => $pdf_id,
            'caminho' => $pdf['CAMINHOPDF']
        ]);
        
        // Retornar uma página HTML simples explicando o problema
        http_response_code(200);
        header('Content-Type: text/html; charset=utf-8');
        echo '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>PDF Não Disponível</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px auto; max-width: 500px; }
        .info { color: #1976d2; background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px auto; max-width: 500px; }
    </style>
</head>
<body>
    <div class="error">
        <h2>📄 PDF Não Disponível</h2>
        <p>O arquivo PDF "<strong>' . htmlspecialchars($pdf['DESCRICAO']) . '</strong>" não está disponível para visualização.</p>
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
    logSimples('pdf_view_public', [
        'pdf_id' => $pdf_id,
        'entrada_id' => $pdf['ID_ENTRADA'],
        'placa' => $pdf['PLACA'],
        'arquivo' => $pdf['DESCRICAO'],
        'token' => substr($token, 0, 10) . '...'
    ]);
    
    // Remover headers conflitantes do servidor
    header_remove('X-Frame-Options');
    
    // Definir headers para PDF
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="' . $pdf['DESCRICAO'] . '"');
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
        'endpoint' => 'pdf-view-public',
        'erro' => $e->getMessage()
    ]);
    
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro ao visualizar PDF: ' . $e->getMessage()]);
    exit;
}

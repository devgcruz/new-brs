<?php
/**
 * Visualizador Público de PDFs
 * Permite visualizar PDFs sem autenticação usando token na URL
 * Substitui a rota pública do Laravel
 */

// Obter token da URL
$token = $_GET['token'] ?? '';

if (empty($token)) {
    http_response_code(400);
    echo "Token não fornecido";
    exit;
}

require_once "../config/db.php";

try {
    // Buscar PDF pelo token
    $stmt = $pdo->prepare("SELECT * FROM pdfs WHERE token_visualizacao = :token LIMIT 1");
    $stmt->execute(['token' => $token]);
    $pdf = $stmt->fetch();
    
    if (!$pdf) {
        http_response_code(404);
        echo "PDF não encontrado ou token inválido";
        exit;
    }
    
    $file_path = "../upload/pdfs/" . $pdf['CAMINHO_ARQUIVO'];
    
    if (!file_exists($file_path)) {
        http_response_code(404);
        echo "Arquivo PDF não encontrado no servidor";
        exit;
    }
    
    // Headers para visualização inline
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="' . $pdf['NOME_ARQUIVO'] . '"');
    header('Content-Length: ' . filesize($file_path));
    header('Cache-Control: private, max-age=3600');
    
    // Ler e exibir o arquivo
    readfile($file_path);
    
} catch (Exception $e) {
    http_response_code(500);
    echo "Erro interno do servidor";
    error_log("Erro ao visualizar PDF: " . $e->getMessage());
}

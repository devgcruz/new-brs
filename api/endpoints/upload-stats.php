<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de Estatísticas de Upload
 * Fornece informações sobre uploads de PDFs
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

header("Content-Type: application/json");


require_once API_BASE_DIR . "/config/db.php";
require_once "../config/upload.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    respostaJson(false, null, 'Método não permitido', 405);
}

// Verificar autenticação
$usuario = middlewareAutenticacao();

try {
    $stats = getUploadStats();
    
    // Adicionar informações de espaço em disco
    $stats['disk_space'] = [
        'free_bytes' => disk_free_space(PDF_UPLOAD_DIR),
        'free_formatted' => formatBytes(disk_free_space(PDF_UPLOAD_DIR)),
        'total_bytes' => disk_total_space(PDF_UPLOAD_DIR),
        'total_formatted' => formatBytes(disk_total_space(PDF_UPLOAD_DIR))
    ];
    
    // Adicionar configurações de upload
    $stats['config'] = [
        'max_file_size' => UPLOAD_MAX_SIZE,
        'max_file_size_formatted' => formatBytes(UPLOAD_MAX_SIZE),
        'allowed_types' => UPLOAD_ALLOWED_TYPES,
        'organize_by_date' => UPLOAD_ORGANIZE_BY_DATE
    ];
    
    respostaJson(true, $stats);
    
} catch (Exception $e) {
    logUpload('error', ['message' => $e->getMessage()]);
    respostaJson(false, null, 'Erro ao obter estatísticas', 500);
}

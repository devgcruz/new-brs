<?php
/**
 * Configurações de Upload - BRS API
 */

// Configurações de Upload de PDFs
define('UPLOAD_MAX_SIZE', 50 * 1024 * 1024); // 50MB
define('UPLOAD_ALLOWED_TYPES', ['application/pdf']);
define('UPLOAD_ALLOWED_EXTENSIONS', ['pdf']);

// Configurações de Pastas
define('UPLOAD_BASE_DIR', 'C:/xampp/htdocs/upload/');
define('PDF_UPLOAD_DIR', UPLOAD_BASE_DIR . 'pdfs/');

// Configurações de Segurança
define('UPLOAD_SECURE_MODE', true);
define('UPLOAD_RENAME_FILES', true);

// Configurações de Organização
define('UPLOAD_ORGANIZE_BY_DATE', true);
define('UPLOAD_DATE_FORMAT', 'Y/m'); // Ano/Mês

// Configurações de Token
define('PDF_TOKEN_LENGTH', 64);
define('PDF_TOKEN_EXPIRY', 0); // 0 = nunca expira

/**
 * Validar arquivo de upload
 */
function validateUploadFile($file) {
    $errors = [];
    
    // Verificar se arquivo foi enviado
    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        $errors[] = 'Erro no upload do arquivo';
        return $errors;
    }
    
    // Verificar tamanho
    if ($file['size'] > UPLOAD_MAX_SIZE) {
        $errors[] = 'Arquivo muito grande. Máximo ' . formatBytes(UPLOAD_MAX_SIZE);
    }
    
    // Verificar se o arquivo temporário existe
    if (!file_exists($file['tmp_name'])) {
        $errors[] = 'Arquivo temporário não encontrado.';
        return $errors;
    }
    
    // Verificar tipo MIME
    $file_type = mime_content_type($file['tmp_name']);
    if (!in_array($file_type, UPLOAD_ALLOWED_TYPES)) {
        $errors[] = 'Tipo de arquivo não permitido. Apenas PDFs são aceitos.';
    }
    
    // Verificar extensão
    $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($file_extension, UPLOAD_ALLOWED_EXTENSIONS)) {
        $errors[] = 'Extensão de arquivo não permitida.';
    }
    
    // Verificar se é realmente um PDF
    if ($file_extension === 'pdf') {
        $handle = fopen($file['tmp_name'], 'rb');
        if ($handle) {
            $header = fread($handle, 4);
            fclose($handle);
            
            if ($header !== '%PDF') {
                $errors[] = 'Arquivo não é um PDF válido.';
            }
        } else {
            $errors[] = 'Não foi possível ler o arquivo.';
        }
    }
    
    return $errors;
}

/**
 * Gerar nome único para arquivo
 */
function generateUniqueFileName($original_name) {
    $extension = pathinfo($original_name, PATHINFO_EXTENSION);
    $timestamp = time();
    $random = mt_rand(1000, 9999);
    $hash = substr(hash('sha256', uniqid()), 0, 8);
    
    return "{$timestamp}_{$random}_{$hash}.{$extension}";
}

/**
 * Criar estrutura de pastas por data
 */
function createDateBasedPath() {
    if (!UPLOAD_ORGANIZE_BY_DATE) {
        return '';
    }
    
    $date_path = date(UPLOAD_DATE_FORMAT);
    $full_path = PDF_UPLOAD_DIR . $date_path . '/';
    
    if (!is_dir($full_path)) {
        mkdir($full_path, 0755, true);
    }
    
    return $date_path . '/';
}

/**
 * Gerar token de visualização
 */
function generateViewToken() {
    return hash('sha256', uniqid() . time() . mt_rand());
}

/**
 * Formatar bytes para leitura humana
 */
function formatBytes($bytes, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB', 'TB');
    
    for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
        $bytes /= 1024;
    }
    
    return round($bytes, $precision) . ' ' . $units[$i];
}

/**
 * Limpar arquivos antigos (manutenção)
 */
function cleanOldFiles($days = 365) {
    $cutoff_time = time() - ($days * 24 * 60 * 60);
    $deleted_count = 0;
    
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(PDF_UPLOAD_DIR, RecursiveDirectoryIterator::SKIP_DOTS)
    );
    
    foreach ($iterator as $file) {
        if ($file->isFile() && $file->getMTime() < $cutoff_time) {
            if (unlink($file->getPathname())) {
                $deleted_count++;
            }
        }
    }
    
    return $deleted_count;
}

/**
 * Verificar espaço em disco
 */
function checkDiskSpace($required_bytes) {
    $free_bytes = disk_free_space(PDF_UPLOAD_DIR);
    return $free_bytes > $required_bytes;
}

/**
 * Log de upload
 */
function logUpload($action, $data) {
    $log_entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'action' => $action,
        'data' => $data,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    $log_file = '../logs/upload.log';
    file_put_contents($log_file, json_encode($log_entry) . "\n", FILE_APPEND | LOCK_EX);
}

/**
 * Estatísticas de upload
 */
function getUploadStats() {
    $stats = [
        'total_files' => 0,
        'total_size' => 0,
        'files_by_month' => [],
        'recent_uploads' => []
    ];
    
    try {
        global $pdo;
        
        // Total de arquivos e tamanho
        $stmt = $pdo->query("SELECT COUNT(*) as count, SUM(TAMANHO_ARQUIVO) as total_size FROM pdfs");
        $result = $stmt->fetch();
        $stats['total_files'] = $result['count'];
        $stats['total_size'] = $result['total_size'] ?? 0;
        
        // Arquivos por mês
        $stmt = $pdo->query("
            SELECT DATE_FORMAT(DATA_REGISTRO, '%Y-%m') as month, COUNT(*) as count 
            FROM pdfs 
            WHERE DATA_REGISTRO >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY month 
            ORDER BY month DESC
        ");
        $stats['files_by_month'] = $stmt->fetchAll();
        
        // Uploads recentes
        $stmt = $pdo->query("
            SELECT NOME_ARQUIVO, TAMANHO_ARQUIVO, DATA_REGISTRO 
            FROM pdfs 
            ORDER BY DATA_REGISTRO DESC 
            LIMIT 10
        ");
        $stats['recent_uploads'] = $stmt->fetchAll();
        
    } catch (Exception $e) {
        logUpload('error', ['message' => $e->getMessage()]);
    }
    
    return $stats;
}

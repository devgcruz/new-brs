<?php
/**
 * Configuração de Produção - BRS API
 * 
 * INSTRUÇÕES:
 * 1. Renomeie este arquivo para config.php
 * 2. Ajuste as configurações conforme sua hospedagem
 * 3. Mantenha este arquivo seguro (não versionado)
 */

// Configurações do Banco de Dados
$DB_HOST = "localhost";           // Host do banco (geralmente localhost)
$DB_USER = "seu_usuario_db";      // Usuário do banco
$DB_PASS = "sua_senha_db";        // Senha do banco
$DB_NAME = "brs_database";       // Nome do banco

// Configurações da API
$API_VERSION = "1.0.0";
$API_ENVIRONMENT = "production";  // production, development, testing

// Configurações de Segurança
$JWT_SECRET = "sua_chave_secreta_aqui";  // Para JWT (se implementar)
$API_RATE_LIMIT = 1000;                  // Requests por hora por IP

// Configurações de Log
$LOG_LEVEL = "INFO";              // DEBUG, INFO, WARNING, ERROR
$LOG_FILE = "logs/api.log";
$LOG_MAX_SIZE = 10485760;         // 10MB

// Configurações de CORS
$CORS_ORIGINS = [
    "https://seudominio.com",
    "https://www.seudominio.com"
];

// Configurações de Upload
$UPLOAD_MAX_SIZE = 10485760;     // 10MB
$UPLOAD_ALLOWED_TYPES = ["pdf", "jpg", "jpeg", "png"];

// Configurações de Cache
$CACHE_ENABLED = true;
$CACHE_TTL = 3600;               // 1 hora

// Configurações de Email (se necessário)
$SMTP_HOST = "smtp.gmail.com";
$SMTP_PORT = 587;
$SMTP_USER = "seu_email@gmail.com";
$SMTP_PASS = "sua_senha_email";
$SMTP_FROM = "noreply@seudominio.com";

// Configurações de Backup
$BACKUP_ENABLED = true;
$BACKUP_FREQUENCY = "daily";     // daily, weekly, monthly
$BACKUP_RETENTION = 30;           // dias

// Configurações de Monitoramento
$MONITORING_ENABLED = true;
$MONITORING_WEBHOOK = "https://hooks.slack.com/services/...";

// Configurações de Performance
$QUERY_CACHE_ENABLED = true;
$QUERY_CACHE_TTL = 300;          // 5 minutos

// Configurações de Manutenção
$MAINTENANCE_MODE = false;
$MAINTENANCE_MESSAGE = "Sistema em manutenção. Volte em breve.";

// Configurações de Debug (apenas para desenvolvimento)
$DEBUG_MODE = false;
$DEBUG_SHOW_QUERIES = false;
$DEBUG_SHOW_ERRORS = false;

// Configurações de Timezone
date_default_timezone_set('America/Sao_Paulo');

// Configurações de Session (se necessário)
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0);  // 0 em dev (HTTP local), 1 em produção (HTTPS)

// Configurações de Error Reporting
if ($API_ENVIRONMENT === 'production') {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', $LOG_FILE);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// Configurações de Memory e Time
ini_set('memory_limit', '256M');
ini_set('max_execution_time', 300);

// Configurações de Upload
ini_set('upload_max_filesize', '10M');
ini_set('post_max_size', '10M');
ini_set('max_file_uploads', 20);

// Headers de Segurança (relaxados em desenvolvimento)
if ($API_ENVIRONMENT === 'production') {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
} else {
    // Headers mais permissivos para desenvolvimento
    header('X-Content-Type-Options: nosniff');
}

// Configurações de CORS Dinâmico
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $origin = $_SERVER['HTTP_ORIGIN'];
    if ($API_ENVIRONMENT === 'development') {
        // Em desenvolvimento, aceita qualquer localhost
        if (preg_match('/^http:\/\/localhost(:\d+)?$/', $origin) || 
            preg_match('/^http:\/\/127\.0\.0\.1(:\d+)?$/', $origin)) {
            header("Access-Control-Allow-Origin: $origin");
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
            header("Access-Control-Allow-Headers: Content-Type, Authorization");
            header("Access-Control-Allow-Credentials: true");
        }
    } elseif (in_array($origin, $CORS_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
    }
}

// Configurações de Rate Limiting (simplificado)
$rate_limit_file = "logs/rate_limit.json";
$client_ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

if ($API_RATE_LIMIT > 0) {
    $rate_data = [];
    if (file_exists($rate_limit_file)) {
        $rate_data = json_decode(file_get_contents($rate_limit_file), true);
    }
    
    $current_hour = date('Y-m-d-H');
    $key = $client_ip . '_' . $current_hour;
    
    if (!isset($rate_data[$key])) {
        $rate_data[$key] = 0;
    }
    
    $rate_data[$key]++;
    
    if ($rate_data[$key] > $API_RATE_LIMIT) {
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'error' => 'Rate limit exceeded',
            'message' => 'Muitas requisições. Tente novamente em uma hora.'
        ]);
        exit;
    }
    
    file_put_contents($rate_limit_file, json_encode($rate_data));
}

// Configurações de Manutenção
if ($MAINTENANCE_MODE) {
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'error' => 'maintenance',
        'message' => $MAINTENANCE_MESSAGE
    ]);
    exit;
}

// Função para log estruturado
function logStructured($level, $message, $context = []) {
    global $LOG_FILE, $LOG_LEVEL;
    
    $levels = ['DEBUG' => 0, 'INFO' => 1, 'WARNING' => 2, 'ERROR' => 3];
    
    if ($levels[$level] < $levels[$LOG_LEVEL]) {
        return;
    }
    
    $log_entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'level' => $level,
        'message' => $message,
        'context' => $context,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    file_put_contents($LOG_FILE, json_encode($log_entry) . "\n", FILE_APPEND | LOCK_EX);
}

// Função para limpar logs antigos
function cleanOldLogs() {
    global $LOG_FILE, $LOG_MAX_SIZE;
    
    if (file_exists($LOG_FILE) && filesize($LOG_FILE) > $LOG_MAX_SIZE) {
        $lines = file($LOG_FILE);
        $keep_lines = array_slice($lines, -1000); // Manter últimas 1000 linhas
        file_put_contents($LOG_FILE, implode('', $keep_lines));
    }
}

// Executar limpeza de logs
cleanOldLogs();

// Log de inicialização
logStructured('INFO', 'API iniciada', [
    'version' => $API_VERSION,
    'environment' => $API_ENVIRONMENT,
    'ip' => $client_ip
]);

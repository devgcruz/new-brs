<?php
/**
 * Helpers para autenticação e validação
 */

/**
 * Validar token de autenticação (para visualização de PDFs)
 */
function validarTokenAutenticacao($token) {
    global $pdo;
    
    if (!$token) {
        return false;
    }
    
    try {
        // Verificar token no banco
        $stmt = $pdo->prepare("SELECT u.* FROM usuarios u WHERE u.token = :token AND u.status = 'ativo'");
        $stmt->execute(['token' => $token]);
        $usuario = $stmt->fetch();
        
        return $usuario ?: false;
    } catch (Exception $e) {
        logSimples('❌ Erro na validação de token', ['erro' => $e->getMessage()]);
        return false;
    }
}

/**
 * Verifica se o usuário está autenticado
 */
function verificarAutenticacao($pdo) {
    $token = null;
    
    // Função mais robusta para obter headers
    $headers = [];
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } else {
        // Fallback para servidores que não suportam getallheaders
        foreach ($_SERVER as $key => $value) {
            if (strpos($key, 'HTTP_') === 0) {
                $header = str_replace('_', '-', substr($key, 5));
                $headers[$header] = $value;
            }
        }
    }
    
    // Buscar token no header Authorization (case insensitive)
    $authHeader = null;
    foreach ($headers as $key => $value) {
        if (strtolower($key) === 'authorization') {
            $authHeader = $value;
            break;
        }
    }
    
    if ($authHeader) {
        if (strpos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
        }
    }
    
    // Buscar token no header X-API-Key (alternativa)
    if (!$token && isset($headers['X-API-Key'])) {
        $token = $headers['X-API-Key'];
    }
    
    // Log para debug
    logSimples('🔍 Verificação de autenticação', [
        'headers_encontrados' => array_keys($headers),
        'token_encontrado' => $token ? 'sim' : 'não'
    ]);
    
    if (!$token) {
        return false;
    }
    
    try {
        // Verificar token no banco (simplificado - você pode usar JWT se preferir)
        $stmt = $pdo->prepare("SELECT u.* FROM usuarios u WHERE u.token = :token AND u.status = 'ativo'");
        $stmt->execute(['token' => $token]);
        $usuario = $stmt->fetch();
        
        logSimples('✅ Usuário autenticado', ['usuario_id' => $usuario['id'] ?? 'não encontrado']);
        
        return $usuario ?: false;
    } catch (Exception $e) {
        logSimples('❌ Erro na verificação de autenticação', ['erro' => $e->getMessage()]);
        return false;
    }
}

/**
 * Gerar token simples (você pode implementar JWT se preferir)
 */
function gerarToken($usuarioId) {
    return hash('sha256', $usuarioId . time() . rand());
}

/**
 * Verificar permissão do usuário
 */
function verificarPermissao($usuario, $permissao) {
    global $pdo;
    
    // Se for administrador (via nível), dar acesso total
    if ($usuario['nivel'] === 'Administrador') {
        return true;
    }
    
    // Buscar roles do usuário
    $roles = [];
    try {
        $roles_sql = "
            SELECT r.name 
            FROM roles r
            INNER JOIN model_has_roles mhr ON r.id = mhr.role_id
            WHERE mhr.model_id = :user_id 
            AND (mhr.model_type = :model_type1 OR mhr.model_type = :model_type2 OR mhr.model_type = :model_type3)
        ";
        $roles_stmt = $pdo->prepare($roles_sql);
        $roles_stmt->execute([
            'user_id' => $usuario['id'],
            'model_type1' => 'App\Models\User',
            'model_type2' => 'App\\Models\\User',
            'model_type3' => 'User'
        ]);
        $roles = $roles_stmt->fetchAll(PDO::FETCH_COLUMN);
    } catch (Exception $e) {
        // Se não existir tabela roles, continuar sem roles
    }
    
    // Se for administrador (via role), dar acesso total
    if (in_array('Administrador', $roles)) {
        return true;
    }
    
    // Mapeamento de roles para permissões específicas
    $rolePermissionMap = [
        'Administrador' => ['dashboard', 'registros', 'relatorios', 'gerenciar-usuarios', 'usuarios'],
        'Analista' => ['dashboard', 'registros', 'relatorios'],
        'Operador' => ['dashboard', 'registros'],
        'Visualizador' => ['dashboard']
    ];
    
    // Verificar se algum role do usuário tem a permissão
    foreach ($roles as $roleName) {
        $rolePerms = $rolePermissionMap[$roleName] ?? [];
        if (in_array($permissao, $rolePerms)) {
            return true;
        }
    }
    
    // Verificar permissões específicas no campo JSON do banco
    $permissoes = json_decode($usuario['permissoes'] ?? '[]', true);
    if (is_array($permissoes) && in_array($permissao, $permissoes)) {
        return true;
    }
    
    return false;
}

/**
 * Resposta JSON padronizada
 */
function respostaJson($success, $data = null, $message = null, $httpCode = 200) {
    http_response_code($httpCode);
    header('Content-Type: application/json');
    
    $response = ['success' => $success];
    
    if ($message) {
        $response['message'] = $message;
    }
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response);
    exit;
}

/**
 * Validar dados obrigatórios
 */
function validarDadosObrigatorios($dados, $campos) {
    $faltando = [];
    
    foreach ($campos as $campo) {
        if (!isset($dados[$campo]) || empty($dados[$campo])) {
            $faltando[] = $campo;
        }
    }
    
    if (!empty($faltando)) {
        respostaJson(false, null, 'Campos obrigatórios: ' . implode(', ', $faltando), 400);
    }
}

/**
 * Sanitizar entrada
 */
function sanitizar($dados) {
    if (is_array($dados)) {
        return array_map('sanitizar', $dados);
    }
    return htmlspecialchars(strip_tags(trim($dados)));
}

/**
 * Log simples (desabilitado em produção)
 */
function logSimples($mensagem, $dados = []) {
    // Desabilitar logs em produção
    if (defined('PRODUCTION_MODE') && PRODUCTION_MODE) {
        return;
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $log = "[$timestamp] $mensagem";
    if (!empty($dados)) {
        $log .= " - " . json_encode($dados);
    }
    $log .= PHP_EOL;
    
    // Definir o diretório base da API se não estiver definido
    $logDir = defined('API_BASE_DIR') ? API_BASE_DIR . '/logs' : dirname(__DIR__) . '/logs';
    
    // Garantir que o diretório existe
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    
    // Tentar escrever no arquivo de log
    @file_put_contents($logDir . '/api.log', $log, FILE_APPEND | LOCK_EX);
}

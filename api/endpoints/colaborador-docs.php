<?php
/**
 * Endpoint de Documentos de Colaboradores
 * Baseado no padrão de pdfs.php
 */

// Registrar handler de erros para capturar erros fatais
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        error_log("FATAL ERROR em colaborador-docs.php: " . $error['message'] . " em " . $error['file'] . ":" . $error['line']);
        if (!headers_sent()) {
            http_response_code(500);
            header("Content-Type: application/json");
            echo json_encode([
                'success' => false, 
                'message' => 'Erro interno do servidor. Verifique os logs para mais detalhes.'
            ]);
        }
    }
});

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}


// Verificar se é visualização ou download (não usar CORS neste caso)
$action = $_GET['action'] ?? 'list';
$isDocView = ($_SERVER['REQUEST_METHOD'] === 'GET' && ($action === 'view' || $action === 'download'));

// Incluir configuração CORS centralizada apenas para operações normais
if (!$isDocView) {
    require_once __DIR__ . '/../config/cors.php';
}

header("Content-Type: application/json");

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/config/table-mapping.php";
require_once API_BASE_DIR . "/config/upload.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

// Verificar se $pdo está disponível
if (!isset($pdo) || !$pdo) {
    error_log("ERROR: Conexão com banco de dados não disponível em colaborador-docs.php");
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode(['success' => false, 'message' => 'Erro de conexão com banco de dados']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// Definir diretório de upload para documentos de colaboradores
if (!defined('UPLOAD_BASE_DIR')) {
    error_log("ERROR: UPLOAD_BASE_DIR não está definido");
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro de configuração do servidor']);
    exit;
}
define('COLABORADOR_DOCS_UPLOAD_DIR', UPLOAD_BASE_DIR . 'colaborador-docs/');

// Criar diretório se não existir
if (!is_dir(COLABORADOR_DOCS_UPLOAD_DIR)) {
    mkdir(COLABORADOR_DOCS_UPLOAD_DIR, 0755, true);
}

// Resolver caminho absoluto do documento considerando registros legados
function resolveDocAbsolutePath($storedPath) {
    $caminho = (string)$storedPath;
    if ($caminho === '') {
        return '';
    }
    // Normalizar barras
    $cTrim = ltrim(str_replace('\\', '/', $caminho), '/');

    $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/');
    $candidates = [];

    // 1) Caminho usual: base configurada + relativo (ex: YYYY/MM/file.pdf)
    $candidates[] = rtrim(COLABORADOR_DOCS_UPLOAD_DIR, '/').'/'.$cTrim;

    // 2) Se veio com prefixo api/upload/... tentar a partir do document root
    $candidates[] = $docRoot.'/'.$cTrim; // ex: /home/.../public_html/api/upload/.../file.pdf

    // 3) Se veio como upload/... sem api/, tentar /api/upload
    if (preg_match('#^upload/#', $cTrim)) {
        $candidates[] = $docRoot.'/api/'.$cTrim;
    }

    // 4) Se for caminho absoluto (Linux/Windows), tentar direto
    if (preg_match('#^/|^[A-Za-z]:/#', $caminho)) {
        $candidates[] = $caminho;
    }

    foreach ($candidates as $candidate) {
        if ($candidate && file_exists($candidate)) {
            return $candidate;
        }
    }
    return ''; // não encontrado
}

// Verificar autenticação para operações normais (não para visualização/download)
$usuario = null;
if (!$isDocView) {
    try {
        $usuario = middlewareAutenticacao();
        if (!$usuario) {
            // Se middlewareAutenticacao retornar false, respostaJson já foi chamado
            // Mas garantimos que não continuamos
            exit;
        }
    } catch (Exception $e) {
        error_log("❌ Erro na autenticação: " . $e->getMessage());
        respostaJson(false, null, 'Erro na autenticação: ' . $e->getMessage(), 401);
    }
}

switch ($method) {
    case 'GET':
        // Listar documentos ou visualizar documento
        $colaborador_id = $_GET['ID_Colaborador'] ?? $_GET['colaborador_id'] ?? '';
        $doc_id = $_GET['id'] ?? '';
        
        if ($action === 'view' && !empty($doc_id)) {
            // Visualizar documento - não enviar JSON, enviar documento diretamente
            // Remover headers CORS para visualização de documento
            header_remove();
            
            // Verificar token de visualização via URL
            $view_token = $_GET['token'] ?? '';
            if (empty($view_token)) {
                http_response_code(401);
                echo 'Token não fornecido';
                exit;
            }
            
            try {
                $docs_table = getTableName('colaborador_docs');
                $stmt = $pdo->prepare("SELECT ID_Doc as id, DESCRICAO, CAMINHOPDF FROM `$docs_table` WHERE ID_Doc = :id AND token_visualizacao = :token LIMIT 1");
                $stmt->execute([
                    'id' => $doc_id,
                    'token' => $view_token
                ]);
                $doc = $stmt->fetch();
                
                if (!$doc) {
                    http_response_code(404);
                    echo 'Documento não encontrado ou token inválido';
                    exit;
                }
                
                $file_path = resolveDocAbsolutePath($doc['CAMINHOPDF']);
                if ($file_path === '' || !file_exists($file_path)) {
                    http_response_code(404);
                    echo 'Arquivo não encontrado no servidor';
                    exit;
                }
                
                // Detectar tipo MIME do arquivo
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mime_type = finfo_file($finfo, $file_path);
                finfo_close($finfo);
                
                // Headers específicos para o documento
                header('Content-Type: ' . $mime_type);
                header('Content-Disposition: inline; filename="' . $doc['DESCRICAO'] . '"');
                header('Content-Length: ' . filesize($file_path));
                header('Cache-Control: private, max-age=3600');
                header('X-Frame-Options: ALLOWALL');
                header('Content-Security-Policy: frame-ancestors *');
                
                readfile($file_path);
                exit;
                
            } catch (Exception $e) {
                logSimples('❌ Erro ao visualizar documento', ['erro' => $e->getMessage()]);
                http_response_code(500);
                echo 'Erro ao visualizar documento';
                exit;
            }
        } else if ($action === 'download' && !empty($doc_id)) {
            // Download documento - não enviar JSON, enviar documento diretamente
            header_remove();
            
            // Verificar token de visualização via URL
            $view_token = $_GET['token'] ?? '';
            if (empty($view_token)) {
                http_response_code(401);
                echo 'Token não fornecido';
                exit;
            }
            
            try {
                $docs_table = getTableName('colaborador_docs');
                $stmt = $pdo->prepare("SELECT ID_Doc as id, DESCRICAO, CAMINHOPDF FROM `$docs_table` WHERE ID_Doc = :id AND token_visualizacao = :token LIMIT 1");
                $stmt->execute([
                    'id' => $doc_id,
                    'token' => $view_token
                ]);
                $doc = $stmt->fetch();
                
                if (!$doc) {
                    http_response_code(404);
                    echo 'Documento não encontrado';
                    exit;
                }
                
                $file_path = resolveDocAbsolutePath($doc['CAMINHOPDF']);
                if ($file_path === '' || !file_exists($file_path)) {
                    http_response_code(404);
                    echo 'Arquivo não encontrado no servidor';
                    exit;
                }
                
                // Detectar tipo MIME do arquivo
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mime_type = finfo_file($finfo, $file_path);
                finfo_close($finfo);
                
                // Forçar download
                header('Content-Type: ' . $mime_type);
                header('Content-Disposition: attachment; filename="' . $doc['DESCRICAO'] . '"');
                header('Content-Length: ' . filesize($file_path));
                readfile($file_path);
                exit;
                
            } catch (Exception $e) {
                logSimples('❌ Erro ao fazer download do documento', ['erro' => $e->getMessage()]);
                http_response_code(500);
                echo 'Erro ao fazer download do documento';
                exit;
            }
        } else {
            // Listar documentos
            if (empty($colaborador_id)) {
                respostaJson(false, null, 'ID do colaborador é obrigatório', 400);
            }
            
            try {
                // Verificar se o colaborador existe
                $colaboradores_table = getTableName('colaboradores');
                if (empty($colaboradores_table)) {
                    throw new Exception('Tabela de colaboradores não configurada');
                }
                
                $stmt = $pdo->prepare("SELECT id FROM `$colaboradores_table` WHERE id = :colaborador_id LIMIT 1");
                $stmt->execute(['colaborador_id' => $colaborador_id]);
                
                if (!$stmt->fetch()) {
                    respostaJson(false, null, 'Colaborador não encontrado', 404);
                }
                
                // Buscar documentos do colaborador
                $docs_table = getTableName('colaborador_docs');
                if (empty($docs_table)) {
                    throw new Exception('Tabela de documentos não configurada');
                }
                
                // Verificar se a tabela existe antes de consultar
                try {
                    $check_table = $pdo->prepare("SELECT COUNT(*) as count FROM `$docs_table` LIMIT 1");
                    $check_table->execute();
                } catch (PDOException $e) {
                    error_log("Tabela $docs_table não existe ou erro de acesso: " . $e->getMessage());
                    // Se a tabela não existe, retornar array vazio em vez de erro
                    respostaJson(true, []);
                }
                
                $stmt = $pdo->prepare("SELECT ID_Doc as id, ID_Colaborador, DESCRICAO, CAMINHOPDF, token_visualizacao, DATA_REGISTRO FROM `$docs_table` WHERE ID_Colaborador = :colaborador_id ORDER BY DATA_REGISTRO DESC");
                $stmt->execute(['colaborador_id' => $colaborador_id]);
                $docs = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Garantir que retornamos um array mesmo se vazio
                if ($docs === false) {
                    $docs = [];
                }
                
                respostaJson(true, $docs);
                
            } catch (PDOException $e) {
                $error_message = $e->getMessage();
                $error_code = $e->getCode();
                error_log("❌ Erro PDO ao listar documentos: " . $error_message . " (Code: " . $error_code . ")");
                
                logSimples('❌ Erro ao listar documentos', [
                    'erro' => $error_message,
                    'codigo' => $error_code,
                    'colaborador_id' => $colaborador_id ?? 'N/A',
                    'tipo' => 'PDOException'
                ]);
                
                // Se for erro de tabela não encontrada, retornar array vazio
                if (strpos($error_message, "doesn't exist") !== false || strpos($error_message, "Unknown table") !== false) {
                    respostaJson(true, []);
                } else {
                    $message = (defined('PRODUCTION_MODE') && PRODUCTION_MODE) 
                        ? 'Erro ao buscar documentos. Contate o administrador.' 
                        : 'Erro ao buscar documentos: ' . $error_message;
                    
                    respostaJson(false, null, $message, 500);
                }
            } catch (Exception $e) {
                $error_message = $e->getMessage();
                error_log("❌ Erro ao listar documentos: " . $error_message);
                error_log("Stack trace: " . $e->getTraceAsString());
                
                logSimples('❌ Erro ao listar documentos', [
                    'erro' => $error_message,
                    'colaborador_id' => $colaborador_id ?? 'N/A',
                    'tipo' => 'Exception',
                    'trace' => $e->getTraceAsString()
                ]);
                
                $message = (defined('PRODUCTION_MODE') && PRODUCTION_MODE) 
                    ? 'Erro ao buscar documentos. Contate o administrador.' 
                    : 'Erro ao buscar documentos: ' . $error_message;
                
                respostaJson(false, null, $message, 500);
            }
        }
        break;
        
    case 'POST':
        // Upload de documento
        try {
        if (!isset($_FILES['doc_file']) || $_FILES['doc_file']['error'] !== UPLOAD_ERR_OK) {
                $upload_error = $_FILES['doc_file']['error'] ?? 'N/A';
                $error_messages = [
                    UPLOAD_ERR_INI_SIZE => 'Arquivo excede o tamanho máximo permitido pelo servidor',
                    UPLOAD_ERR_FORM_SIZE => 'Arquivo excede o tamanho máximo permitido pelo formulário',
                    UPLOAD_ERR_PARTIAL => 'Upload parcial do arquivo',
                    UPLOAD_ERR_NO_FILE => 'Nenhum arquivo foi enviado',
                    UPLOAD_ERR_NO_TMP_DIR => 'Diretório temporário não encontrado',
                    UPLOAD_ERR_CANT_WRITE => 'Falha ao escrever arquivo no disco',
                    UPLOAD_ERR_EXTENSION => 'Upload bloqueado por extensão'
                ];
                $message = $error_messages[$upload_error] ?? 'Erro desconhecido no upload do arquivo';
                respostaJson(false, null, $message, 400);
        }
        
        $colaborador_id = $_POST['ID_Colaborador'] ?? $_POST['colaborador_id'] ?? '';
        $descricao = $_POST['descricao'] ?? '';
        
        if (empty($colaborador_id)) {
            respostaJson(false, null, 'ID do colaborador é obrigatório', 400);
        }
        
        // Verificar se o colaborador existe
            try {
        $colaboradores_table = getTableName('colaboradores');
                $stmt = $pdo->prepare("SELECT id FROM `$colaboradores_table` WHERE id = :colaborador_id LIMIT 1");
        $stmt->execute(['colaborador_id' => $colaborador_id]);
        
        if (!$stmt->fetch()) {
            respostaJson(false, null, 'Colaborador não encontrado', 404);
                }
            } catch (PDOException $e) {
                error_log("ERRO ao verificar colaborador: " . $e->getMessage());
                respostaJson(false, null, 'Erro ao verificar colaborador', 500);
        }
        
        $file = $_FILES['doc_file'];
            
            // Verificar se o arquivo temporário existe
            if (!file_exists($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
                respostaJson(false, null, 'Arquivo temporário não encontrado ou inválido', 400);
            }
        
        // Validar arquivo - permitir PDF, imagens e outros tipos comuns
        $allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        $allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png'];
        
            $file_type = @mime_content_type($file['tmp_name']);
            if (!$file_type) {
                // Fallback: usar o tipo do arquivo enviado
                $file_type = $file['type'] ?? 'application/octet-stream';
            }
        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($file_type, $allowed_types) || !in_array($file_extension, $allowed_extensions)) {
            respostaJson(false, null, 'Tipo de arquivo não permitido. Apenas PDFs e imagens são aceitos.', 400);
        }
        
        // Verificar tamanho (50MB máximo)
        $max_size = 50 * 1024 * 1024; // 50MB
        if ($file['size'] > $max_size) {
            respostaJson(false, null, 'Arquivo muito grande. Máximo 50MB.', 400);
        }
        
        // Verificar espaço em disco (usar diretório correto)
            if (!defined('COLABORADOR_DOCS_UPLOAD_DIR')) {
                define('COLABORADOR_DOCS_UPLOAD_DIR', UPLOAD_BASE_DIR . 'colaborador-docs/');
            }
            
            $free_bytes = @disk_free_space(COLABORADOR_DOCS_UPLOAD_DIR);
            if ($free_bytes === false) {
                error_log("Warning: Não foi possível verificar espaço em disco para " . COLABORADOR_DOCS_UPLOAD_DIR);
                // Continuar mesmo assim, pode ser problema de permissão
            } else if ($free_bytes < $file['size']) {
            respostaJson(false, null, 'Espaço insuficiente em disco', 507);
        }
            // Criar estrutura de pastas por data
            $date_path = date('Y/m/');
            $upload_dir = COLABORADOR_DOCS_UPLOAD_DIR . $date_path;
            
            // Garantir que o diretório base existe e tem permissão de escrita
            if (!is_dir(COLABORADOR_DOCS_UPLOAD_DIR)) {
                if (!mkdir(COLABORADOR_DOCS_UPLOAD_DIR, 0755, true)) {
                    error_log("ERRO: Falha ao criar diretório base: " . COLABORADOR_DOCS_UPLOAD_DIR);
                    respostaJson(false, null, 'Erro ao criar diretório de upload', 500);
                }
            }
            
            if (!is_dir($upload_dir)) {
                if (!mkdir($upload_dir, 0755, true)) {
                    error_log("ERRO: Falha ao criar diretório por data: " . $upload_dir);
                    respostaJson(false, null, 'Erro ao criar diretório de upload por data', 500);
                }
            }
            
            // Verificar permissão de escrita
            if (!is_writable($upload_dir)) {
                error_log("ERRO: Diretório sem permissão de escrita: " . $upload_dir);
                respostaJson(false, null, 'Diretório de upload sem permissão de escrita', 500);
            }
            
            // Sanitizar o nome do arquivo para evitar problemas
            $safe_filename = sanitizeFilename($file['name']);
            
            // Verificar se arquivo com mesmo nome já existe
            $counter = 1;
            $original_name = $safe_filename;
            while (file_exists($upload_dir . $safe_filename)) {
                $path_info = pathinfo($original_name);
                $safe_filename = $path_info['filename'] . '_' . $counter . '.' . $path_info['extension'];
                $counter++;
            }
            
            $file_path = $upload_dir . $safe_filename;
            
            // Mover arquivo para pasta de destino
            if (!move_uploaded_file($file['tmp_name'], $file_path)) {
                // Fallback: usar copy se move_uploaded_file falhar
                if (!copy($file['tmp_name'], $file_path)) {
                    error_log("ERRO: Falha ao salvar arquivo. copy() também falhou");
                    respostaJson(false, null, 'Erro ao salvar arquivo', 500);
                }
            }
            
            // Verificar se o arquivo foi realmente salvo
            if (!file_exists($file_path)) {
                error_log("ERRO: Arquivo não foi salvo corretamente: " . $file_path);
                respostaJson(false, null, 'Erro ao verificar arquivo salvo', 500);
            }
            
            // Salvar informações no banco
            $caminho_relativo = $date_path . $safe_filename;
            $token_visualizacao = generateViewToken();
            
            $docs_table = getTableName('colaborador_docs');
            
            // Inserção simplificada - usar apenas colunas obrigatórias conhecidas
            try {
                // Primeiro, tentar inserção com todas as colunas possíveis
                $sql = "INSERT INTO `$docs_table` (
                    ID_Colaborador, 
                    DESCRICAO, 
                    CAMINHOPDF, 
                    token_visualizacao, 
                    TAMANHO_ARQUIVO, 
                    TIPO_ARQUIVO, 
                    DATA_REGISTRO
                ) VALUES (
                    :colaborador_id, 
                    :descricao, 
                    :caminho_arquivo, 
                    :token_visualizacao, 
                    :tamanho, 
                    :tipo, 
                    NOW()
                )";
                
                $stmt = $pdo->prepare($sql);
                $params = [
                    'colaborador_id' => $colaborador_id,
                    'descricao' => sanitizar($descricao ?: $file['name']),
                    'caminho_arquivo' => $caminho_relativo,
                    'token_visualizacao' => $token_visualizacao,
                    'tamanho' => $file['size'],
                    'tipo' => $file_type
                ];
                
                $stmt->execute($params);
                $doc_id = $pdo->lastInsertId();
                
                // Se a tabela tiver coluna Usuario_Upload, atualizar
                try {
                    $update_sql = "UPDATE `$docs_table` SET Usuario_Upload = :usuario WHERE ID_Doc = :doc_id";
                    $update_stmt = $pdo->prepare($update_sql);
                    $update_stmt->execute([
                        'usuario' => $usuario['Usuario'] ?? $usuario['username'] ?? 'sistema',
                        'doc_id' => $doc_id
                    ]);
                } catch (PDOException $e) {
                    // Ignorar erro se a coluna não existir
                }
                
            } catch (PDOException $e) {
                error_log("ERRO CRÍTICO ao inserir documento: " . $e->getMessage());
                error_log("SQL: " . $sql);
                error_log("Código do erro: " . $e->getCode());
                
                // Tentar inserção mínima sem colunas opcionais
                try {
                    $sql_min = "INSERT INTO `$docs_table` (ID_Colaborador, DESCRICAO, CAMINHOPDF, token_visualizacao, DATA_REGISTRO) VALUES (:colaborador_id, :descricao, :caminho_arquivo, :token_visualizacao, NOW())";
                    
                    $stmt_min = $pdo->prepare($sql_min);
                    $stmt_min->execute([
                        'colaborador_id' => $colaborador_id,
                        'descricao' => sanitizar($descricao ?: $file['name']),
                        'caminho_arquivo' => $caminho_relativo,
                        'token_visualizacao' => $token_visualizacao
                    ]);
                    
                    $doc_id = $pdo->lastInsertId();
                    
                } catch (PDOException $e2) {
                    error_log("ERRO FATAL: Inserção mínima também falhou: " . $e2->getMessage());
                    error_log("SQL mínima: " . $sql_min);
                    throw $e2;
                }
            }
            
            logUpload('upload_success', [
                'doc_id' => $doc_id,
                'colaborador_id' => $colaborador_id,
                'arquivo' => $file['name'],
                'tamanho' => $file['size'],
                'usuario' => $usuario['Usuario'] ?? $usuario['username'] ?? 'sistema'
            ]);
            
            respostaJson(true, [
                'id' => $doc_id,
                'nome_arquivo' => $file['name'],
                'tamanho' => $file['size'],
                'caminho' => $caminho_relativo,
                'descricao' => $descricao ?: $file['name'],
                'token_visualizacao' => $token_visualizacao
            ], 'Documento enviado com sucesso', 201);
            
        } catch (PDOException $e) {
            $error_message = $e->getMessage();
            $error_code = $e->getCode();
            $error_info = $e->errorInfo ?? [];
            
            // Log detalhado do erro (sempre logar, mesmo em produção)
            $log_message = "❌ ERRO PDO no upload de documento:\n";
            $log_message .= "Mensagem: " . $error_message . "\n";
            $log_message .= "Código: " . $error_code . "\n";
            $log_message .= "Info: " . print_r($error_info, true) . "\n";
            $log_message .= "Arquivo: " . ($file['name'] ?? 'N/A') . "\n";
            $log_message .= "Colaborador ID: " . ($colaborador_id ?? 'N/A') . "\n";
            $log_message .= "Trace: " . $e->getTraceAsString();
            
            error_log($log_message);
            
            logSimples('❌ Erro PDO no upload de documento', [
                'erro' => $error_message,
                'codigo' => $error_code,
                'info' => $error_info,
                'file' => $file['name'] ?? 'N/A',
                'colaborador_id' => $colaborador_id ?? 'N/A'
            ]);
            
            // Em produção, retornar mensagem genérica; em desenvolvimento, retornar erro detalhado
            $message = (defined('PRODUCTION_MODE') && PRODUCTION_MODE) 
                ? 'Erro interno no upload. Contate o administrador.' 
                : 'Erro interno no upload: ' . $error_message . ' (Código: ' . $error_code . ')';
            
            respostaJson(false, null, $message, 500);
            
        } catch (Exception $e) {
            $error_message = $e->getMessage();
            $error_trace = $e->getTraceAsString();
            
            // Log detalhado do erro (sempre logar, mesmo em produção)
            $log_message = "❌ ERRO no upload de documento:\n";
            $log_message .= "Mensagem: " . $error_message . "\n";
            $log_message .= "Tipo: " . get_class($e) . "\n";
            $log_message .= "Arquivo: " . ($file['name'] ?? 'N/A') . "\n";
            $log_message .= "Colaborador ID: " . ($colaborador_id ?? 'N/A') . "\n";
            $log_message .= "Trace: " . $error_trace;
            
            error_log($log_message);
            
            logSimples('❌ Erro no upload de documento', [
                'erro' => $error_message,
                'tipo' => get_class($e),
                'trace' => $error_trace,
                'file' => $file['name'] ?? 'N/A',
                'colaborador_id' => $colaborador_id ?? 'N/A'
            ]);
            
            // Em produção, retornar mensagem genérica; em desenvolvimento, retornar erro detalhado
            $message = (defined('PRODUCTION_MODE') && PRODUCTION_MODE) 
                ? 'Erro interno no upload. Contate o administrador.' 
                : 'Erro interno no upload: ' . $error_message;
            
            respostaJson(false, null, $message, 500);
        }
        break;
        
    case 'DELETE':
        // Deletar documento
        $doc_id = $_GET['id'] ?? '';
        
        if (empty($doc_id)) {
            respostaJson(false, null, 'ID do documento não especificado', 400);
        }
        
        try {
            // Buscar documento usando o nome correto da tabela
            $docs_table = getTableName('colaborador_docs');
            $stmt = $pdo->prepare("SELECT * FROM `$docs_table` WHERE ID_Doc = :id LIMIT 1");
            $stmt->execute(['id' => $doc_id]);
            $doc = $stmt->fetch();
            
            if (!$doc) {
                respostaJson(false, null, 'Documento não encontrado', 404);
            }
            
            // Deletar arquivo físico
            $file_path = COLABORADOR_DOCS_UPLOAD_DIR . $doc['CAMINHOPDF'];
            if (file_exists($file_path)) {
                unlink($file_path);
            }
            
            // Deletar registro do banco
            $stmt = $pdo->prepare("DELETE FROM `$docs_table` WHERE ID_Doc = :id");
            $stmt->execute(['id' => $doc_id]);
            
            logSimples('✅ Documento deletado', [
                'doc_id' => $doc_id,
                'arquivo' => $doc['DESCRICAO'],
                'usuario' => $usuario['Usuario'] ?? $usuario['username'] ?? 'sistema'
            ]);
            
            respostaJson(true, null, 'Documento deletado com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao deletar documento', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao deletar documento', 500);
        }
        break;
        
    default:
        respostaJson(false, null, 'Método não permitido', 405);
}


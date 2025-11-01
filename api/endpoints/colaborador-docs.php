<?php
/**
 * Endpoint de Documentos de Colaboradores
 * Baseado no padrão de pdfs.php
 */

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

$method = $_SERVER['REQUEST_METHOD'];

// Definir diretório de upload para documentos de colaboradores
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
    $usuario = middlewareAutenticacao();
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
                $stmt = $pdo->prepare("SELECT ID_Doc as id, DESCRICAO, CAMINHOPDF FROM $docs_table WHERE ID_Doc = :id AND token_visualizacao = :token LIMIT 1");
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
                $stmt = $pdo->prepare("SELECT ID_Doc as id, DESCRICAO, CAMINHOPDF FROM $docs_table WHERE ID_Doc = :id AND token_visualizacao = :token LIMIT 1");
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
                $stmt = $pdo->prepare("SELECT id FROM $colaboradores_table WHERE id = :colaborador_id LIMIT 1");
                $stmt->execute(['colaborador_id' => $colaborador_id]);
                
                if (!$stmt->fetch()) {
                    respostaJson(false, null, 'Colaborador não encontrado', 404);
                }
                
                // Buscar documentos do colaborador
                $docs_table = getTableName('colaborador_docs');
                $stmt = $pdo->prepare("SELECT ID_Doc as id, ID_Colaborador, DESCRICAO, CAMINHOPDF, token_visualizacao, DATA_REGISTRO FROM $docs_table WHERE ID_Colaborador = :colaborador_id ORDER BY DATA_REGISTRO DESC");
                $stmt->execute(['colaborador_id' => $colaborador_id]);
                $docs = $stmt->fetchAll();
                
                respostaJson(true, $docs);
                
            } catch (Exception $e) {
                logSimples('❌ Erro ao listar documentos', ['erro' => $e->getMessage()]);
                respostaJson(false, null, 'Erro ao buscar documentos', 500);
            }
        }
        break;
        
    case 'POST':
        // Upload de documento
        if (!isset($_FILES['doc_file']) || $_FILES['doc_file']['error'] !== UPLOAD_ERR_OK) {
            respostaJson(false, null, 'Erro no upload do arquivo', 400);
        }
        
        $colaborador_id = $_POST['ID_Colaborador'] ?? $_POST['colaborador_id'] ?? '';
        $descricao = $_POST['descricao'] ?? '';
        
        if (empty($colaborador_id)) {
            respostaJson(false, null, 'ID do colaborador é obrigatório', 400);
        }
        
        // Verificar se o colaborador existe
        $colaboradores_table = getTableName('colaboradores');
        $stmt = $pdo->prepare("SELECT id FROM $colaboradores_table WHERE id = :colaborador_id LIMIT 1");
        $stmt->execute(['colaborador_id' => $colaborador_id]);
        
        if (!$stmt->fetch()) {
            respostaJson(false, null, 'Colaborador não encontrado', 404);
        }
        
        $file = $_FILES['doc_file'];
        
        // Validar arquivo - permitir PDF, imagens e outros tipos comuns
        $allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        $allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png'];
        
        $file_type = mime_content_type($file['tmp_name']);
        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($file_type, $allowed_types) || !in_array($file_extension, $allowed_extensions)) {
            respostaJson(false, null, 'Tipo de arquivo não permitido. Apenas PDFs e imagens são aceitos.', 400);
        }
        
        // Verificar tamanho (50MB máximo)
        $max_size = 50 * 1024 * 1024; // 50MB
        if ($file['size'] > $max_size) {
            respostaJson(false, null, 'Arquivo muito grande. Máximo 50MB.', 400);
        }
        
        // Verificar espaço em disco
        if (!checkDiskSpace($file['size'])) {
            respostaJson(false, null, 'Espaço insuficiente em disco', 507);
        }
        
        try {
            // Criar estrutura de pastas por data
            $date_path = date('Y/m/');
            $upload_dir = COLABORADOR_DOCS_UPLOAD_DIR . $date_path;
            
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0755, true);
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
                    respostaJson(false, null, 'Erro ao salvar arquivo', 500);
                }
            }
            
            // Salvar informações no banco
            $caminho_relativo = $date_path . $safe_filename;
            $token_visualizacao = generateViewToken();
            
            $docs_table = getTableName('colaborador_docs');
            $sql = "INSERT INTO $docs_table (
                ID_Colaborador, DESCRICAO, CAMINHOPDF, token_visualizacao, TAMANHO_ARQUIVO, TIPO_ARQUIVO, DATA_REGISTRO, Usuario_Upload, created_at, updated_at
            ) VALUES (
                :colaborador_id, :descricao, :caminho_arquivo, :token_visualizacao, :tamanho, :tipo, NOW(), :usuario, NOW(), NOW()
            )";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'colaborador_id' => $colaborador_id,
                'descricao' => sanitizar($descricao ?: $file['name']),
                'caminho_arquivo' => $caminho_relativo,
                'token_visualizacao' => $token_visualizacao,
                'tamanho' => $file['size'],
                'tipo' => $file_type,
                'usuario' => $usuario['Usuario'] ?? $usuario['username'] ?? 'sistema'
            ]);
            
            $doc_id = $pdo->lastInsertId();
            
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
            
        } catch (Exception $e) {
            logSimples('❌ Erro no upload de documento', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro interno no upload', 500);
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
            $stmt = $pdo->prepare("SELECT * FROM $docs_table WHERE ID_Doc = :id LIMIT 1");
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
            $stmt = $pdo->prepare("DELETE FROM $docs_table WHERE ID_Doc = :id");
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


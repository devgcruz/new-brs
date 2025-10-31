<?php
/**
 * Endpoint de PDFs
 * Substitui PdfController do Laravel
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

// Verificar se é visualização ou download (não usar CORS neste caso)
$action = $_GET['action'] ?? 'list';
$isPdfView = ($_SERVER['REQUEST_METHOD'] === 'GET' && ($action === 'view' || $action === 'download'));

// Incluir configuração CORS centralizada apenas para operações normais
if (!$isPdfView) {
    require_once __DIR__ . '/../config/cors.php';
}

header("Content-Type: application/json");

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/config/table-mapping.php";
require_once API_BASE_DIR . "/config/upload.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

// Resolver caminho absoluto do PDF considerando registros legados
function resolvePdfAbsolutePath($storedPath) {
    $caminho = (string)$storedPath;
    if ($caminho === '') {
        return '';
    }
    // Normalizar barras
    $cTrim = ltrim(str_replace('\\', '/', $caminho), '/');

    $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/');
    $candidates = [];

    // 1) Caminho usual: base configurada + relativo (ex: YYYY/MM/file.pdf)
    $candidates[] = rtrim(PDF_UPLOAD_DIR, '/').'/'.$cTrim;

    // 2) Se veio com prefixo api/upload/... tentar a partir do document root
    $candidates[] = $docRoot.'/'.$cTrim; // ex: /home/.../public_html/api/upload/.../file.pdf

    // 3) Se veio como upload/... sem api/, tentar /api/upload
    if (preg_match('#^upload/#', $cTrim)) {
        $candidates[] = $docRoot.'/api/'.$cTrim;
    }

    // 4) Ajuste de legado: trocar pdfs/ por pdf/
    $candidates[] = str_replace('/pdfs/', '/pdf/', $docRoot.'/'.$cTrim);
    $candidates[] = str_replace('/pdfs/', '/pdf/', rtrim(PDF_UPLOAD_DIR, '/').'/'.$cTrim);

    // 5) Se for caminho absoluto (Linux/Windows), tentar direto
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
if (!$isPdfView) {
    $usuario = middlewareAutenticacao();
}

switch ($method) {
    case 'GET':
        // Listar PDFs ou visualizar PDF
        $entrada_id = $_GET['entrada_id'] ?? '';
        $pdf_id = $_GET['id'] ?? '';
        
        if ($action === 'view' && !empty($pdf_id)) {
            // Visualizar PDF - não enviar JSON, enviar PDF diretamente
            // Remover headers CORS para visualização de PDF
            header_remove();
            
            // Verificar token de visualização via URL
            $view_token = $_GET['token'] ?? '';
            if (empty($view_token)) {
                http_response_code(401);
                echo 'Token não fornecido';
                exit;
            }
            
            try {
                $pdfs_table = getTableName('pdfs');
                $stmt = $pdo->prepare("SELECT ID_PDF as id, DESCRICAO, CAMINHOPDF FROM $pdfs_table WHERE ID_PDF = :id AND token_visualizacao = :token LIMIT 1");
                $stmt->execute([
                    'id' => $pdf_id,
                    'token' => $view_token
                ]);
                $pdf = $stmt->fetch();
                
                if (!$pdf) {
                    http_response_code(404);
                    echo 'PDF não encontrado ou token inválido';
                    exit;
                }
                
                $file_path = resolvePdfAbsolutePath($pdf['CAMINHOPDF']);
                if ($file_path === '' || !file_exists($file_path)) {
                    http_response_code(404);
                    echo 'Arquivo PDF não encontrado no servidor';
                    exit;
                }
                
                // Headers específicos para PDF
                header('Content-Type: application/pdf');
                header('Content-Disposition: inline; filename="' . $pdf['DESCRICAO'] . '.pdf"');
                header('Content-Length: ' . filesize($file_path));
                header('Cache-Control: private, max-age=3600');
                header('X-Frame-Options: ALLOWALL');
                header('Content-Security-Policy: frame-ancestors *');
                
                readfile($file_path);
                exit;
                
            } catch (Exception $e) {
                logSimples('❌ Erro ao visualizar PDF', ['erro' => $e->getMessage()]);
                http_response_code(500);
                echo 'Erro ao visualizar PDF';
                exit;
            }
        } else if ($action === 'download' && !empty($pdf_id)) {
            // Download PDF - não enviar JSON, enviar PDF diretamente
            header_remove();
            
            // Verificar token de visualização via URL
            $view_token = $_GET['token'] ?? '';
            if (empty($view_token)) {
                http_response_code(401);
                echo 'Token não fornecido';
                exit;
            }
            
            try {
                $pdfs_table = getTableName('pdfs');
                $stmt = $pdo->prepare("SELECT ID_PDF as id, DESCRICAO, CAMINHOPDF FROM $pdfs_table WHERE ID_PDF = :id AND token_visualizacao = :token LIMIT 1");
                $stmt->execute([
                    'id' => $pdf_id,
                    'token' => $view_token
                ]);
                $pdf = $stmt->fetch();
                
                if (!$pdf) {
                    http_response_code(404);
                    echo 'PDF não encontrado';
                    exit;
                }
                
                $file_path = resolvePdfAbsolutePath($pdf['CAMINHOPDF']);
                if ($file_path === '' || !file_exists($file_path)) {
                    http_response_code(404);
                    echo 'Arquivo PDF não encontrado no servidor';
                    exit;
                }
                
                // Forçar download
                header('Content-Type: application/pdf');
                header('Content-Disposition: attachment; filename="' . $pdf['DESCRICAO'] . '.pdf"');
                header('Content-Length: ' . filesize($file_path));
                readfile($file_path);
                exit;
                
            } catch (Exception $e) {
                logSimples('❌ Erro ao fazer download do PDF', ['erro' => $e->getMessage()]);
                http_response_code(500);
                echo 'Erro ao fazer download do PDF';
                exit;
            }
        } else {
            // Listar PDFs
            if (empty($entrada_id)) {
                respostaJson(false, null, 'ID da entrada é obrigatório', 400);
            }
            
            try {
                // Verificar se a entrada existe
                $entradas_table = getTableName('entradas');
                $stmt = $pdo->prepare("SELECT Id_Entrada FROM $entradas_table WHERE Id_Entrada = :entrada_id LIMIT 1");
                $stmt->execute(['entrada_id' => $entrada_id]);
                
                if (!$stmt->fetch()) {
                    respostaJson(false, null, 'Entrada não encontrada', 404);
                }
                
                // Buscar PDFs da entrada
                $pdfs_table = getTableName('pdfs');
                $stmt = $pdo->prepare("SELECT ID_PDF as id, ID_ENTRADA, DESCRICAO, CAMINHOPDF, token_visualizacao, DATA_REGISTRO FROM $pdfs_table WHERE ID_ENTRADA = :entrada_id ORDER BY DATA_REGISTRO DESC");
                $stmt->execute(['entrada_id' => $entrada_id]);
                $pdfs = $stmt->fetchAll();
                
                respostaJson(true, $pdfs);
                
            } catch (Exception $e) {
                logSimples('❌ Erro ao listar PDFs', ['erro' => $e->getMessage()]);
                respostaJson(false, null, 'Erro ao buscar PDFs', 500);
            }
        }
        break;
        
    case 'POST':
        // Upload de PDF
        if (!isset($_FILES['pdf_file']) || $_FILES['pdf_file']['error'] !== UPLOAD_ERR_OK) {
            respostaJson(false, null, 'Erro no upload do arquivo', 400);
        }
        
        $entrada_id = $_POST['entrada_id'] ?? '';
        $descricao = $_POST['descricao'] ?? '';
        
        if (empty($entrada_id)) {
            respostaJson(false, null, 'ID da entrada é obrigatório', 400);
        }
        
        // Verificar se a entrada existe
        $entradas_table = getTableName('entradas');
        $stmt = $pdo->prepare("SELECT Id_Entrada FROM $entradas_table WHERE Id_Entrada = :entrada_id LIMIT 1");
        $stmt->execute(['entrada_id' => $entrada_id]);
        
        if (!$stmt->fetch()) {
            respostaJson(false, null, 'Entrada não encontrada', 404);
        }
        
        $file = $_FILES['pdf_file'];
        
        // Validar arquivo usando função de configuração
        $validation_errors = validateUploadFile($file);
        if (!empty($validation_errors)) {
            respostaJson(false, null, implode(', ', $validation_errors), 400);
        }
        
        // Verificar espaço em disco
        if (!checkDiskSpace($file['size'])) {
            respostaJson(false, null, 'Espaço insuficiente em disco', 507);
        }
        
        try {
            // Criar estrutura de pastas por data
            $date_path = createDateBasedPath();
            $upload_dir = PDF_UPLOAD_DIR . $date_path;
            
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
            
            $pdfs_table = getTableName('pdfs');
            $sql = "INSERT INTO $pdfs_table (
                ID_ENTRADA, DESCRICAO, CAMINHOPDF, token_visualizacao, DATA_REGISTRO, created_at, updated_at
            ) VALUES (
                :entrada_id, :descricao, :caminho_arquivo, :token_visualizacao, NOW(), NOW(), NOW()
            )";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'entrada_id' => $entrada_id,
                'descricao' => sanitizar($descricao),
                'caminho_arquivo' => $caminho_relativo,
                'token_visualizacao' => $token_visualizacao
            ]);
            
            $pdf_id = $pdo->lastInsertId();
            
            logUpload('upload_success', [
                'pdf_id' => $pdf_id,
                'entrada_id' => $entrada_id,
                'arquivo' => $file['name'],
                'tamanho' => $file['size'],
                'usuario' => $usuario['Usuario']
            ]);
            
            respostaJson(true, [
                'id' => $pdf_id,
                'nome_arquivo' => $file['name'],
                'tamanho' => $file['size'],
                'caminho' => $caminho_relativo,
                'descricao' => $descricao,
                'token_visualizacao' => $token_visualizacao
            ], 'PDF enviado com sucesso', 201);
            
        } catch (Exception $e) {
            logSimples('❌ Erro no upload de PDF', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro interno no upload', 500);
        }
        break;
        
    case 'DELETE':
        // Deletar PDF
        $pdf_id = $_GET['id'] ?? '';
        
        if (empty($pdf_id)) {
            respostaJson(false, null, 'ID do PDF não especificado', 400);
        }
        
        try {
            // Buscar PDF usando o nome correto da tabela
            $pdfs_table = getTableName('pdfs');
            $stmt = $pdo->prepare("SELECT * FROM $pdfs_table WHERE ID_PDF = :id LIMIT 1");
            $stmt->execute(['id' => $pdf_id]);
            $pdf = $stmt->fetch();
            
            if (!$pdf) {
                respostaJson(false, null, 'PDF não encontrado', 404);
            }
            
            // Deletar arquivo físico
            $file_path = PDF_UPLOAD_DIR . $pdf['CAMINHOPDF'];
            if (file_exists($file_path)) {
                unlink($file_path);
            }
            
            // Deletar registro do banco
            $stmt = $pdo->prepare("DELETE FROM $pdfs_table WHERE ID_PDF = :id");
            $stmt->execute(['id' => $pdf_id]);
            
            logSimples('✅ PDF deletado', [
                'pdf_id' => $pdf_id,
                'arquivo' => $pdf['DESCRICAO'],
                'usuario' => $usuario['Usuario']
            ]);
            
            respostaJson(true, null, 'PDF deletado com sucesso');
            
        } catch (Exception $e) {
            logSimples('❌ Erro ao deletar PDF', ['erro' => $e->getMessage()]);
            respostaJson(false, null, 'Erro ao deletar PDF', 500);
        }
        break;
        
    default:
        respostaJson(false, null, 'Método não permitido', 405);
}

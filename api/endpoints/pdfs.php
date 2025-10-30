<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint de PDFs
 * Substitui PdfController do Laravel
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

header("Content-Type: application/json");


require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/config/table-mapping.php";
require_once API_BASE_DIR . "/config/upload.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

$method = $_SERVER['REQUEST_METHOD'];

// Verificar autenticação para todas as operações
$usuario = middlewareAutenticacao();

switch ($method) {
    case 'GET':
        // Listar PDFs ou visualizar PDF
        $entrada_id = $_GET['entrada_id'] ?? '';
        $pdf_id = $_GET['id'] ?? '';
        $action = $_GET['action'] ?? 'list';
        
        if ($action === 'view' && !empty($pdf_id)) {
            // Visualizar PDF
            try {
                $pdfs_table = getTableName('pdfs');
                $stmt = $pdo->prepare("SELECT ID_PDF as id, DESCRICAO, CAMINHOPDF FROM $pdfs_table WHERE ID_PDF = :id LIMIT 1");
                $stmt->execute(['id' => $pdf_id]);
                $pdf = $stmt->fetch();
                
                if (!$pdf) {
                    respostaJson(false, null, 'PDF não encontrado', 404);
                }
                
                $file_path = "../upload/pdfs/" . $pdf['CAMINHOPDF'];
                
                if (!file_exists($file_path)) {
                    respostaJson(false, null, 'Arquivo PDF não encontrado no servidor', 404);
                }
                
                // Retornar o PDF
                header('Content-Type: application/pdf');
                header('Content-Disposition: inline; filename="' . $pdf['DESCRICAO'] . '.pdf"');
                header('Content-Length: ' . filesize($file_path));
                readfile($file_path);
                exit;
                
            } catch (Exception $e) {
                logSimples('❌ Erro ao visualizar PDF', ['erro' => $e->getMessage()]);
                respostaJson(false, null, 'Erro ao visualizar PDF', 500);
            }
        } else if ($action === 'download' && !empty($pdf_id)) {
            // Download PDF
            try {
                $pdfs_table = getTableName('pdfs');
                $stmt = $pdo->prepare("SELECT ID_PDF as id, DESCRICAO, CAMINHOPDF FROM $pdfs_table WHERE ID_PDF = :id LIMIT 1");
                $stmt->execute(['id' => $pdf_id]);
                $pdf = $stmt->fetch();
                
                if (!$pdf) {
                    respostaJson(false, null, 'PDF não encontrado', 404);
                }
                
                $file_path = "../upload/pdfs/" . $pdf['CAMINHOPDF'];
                
                if (!file_exists($file_path)) {
                    respostaJson(false, null, 'Arquivo PDF não encontrado no servidor', 404);
                }
                
                // Forçar download
                header('Content-Type: application/pdf');
                header('Content-Disposition: attachment; filename="' . $pdf['DESCRICAO'] . '.pdf"');
                header('Content-Length: ' . filesize($file_path));
                readfile($file_path);
                exit;
                
            } catch (Exception $e) {
                logSimples('❌ Erro ao fazer download do PDF', ['erro' => $e->getMessage()]);
                respostaJson(false, null, 'Erro ao fazer download do PDF', 500);
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
                $stmt = $pdo->prepare("SELECT ID_PDF as id, ID_ENTRADA, DESCRICAO, CAMINHOPDF, DATA_REGISTRO FROM $pdfs_table WHERE ID_ENTRADA = :entrada_id ORDER BY DATA_REGISTRO DESC");
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
            
            // Gerar nome único para o arquivo
            $unique_name = generateUniqueFileName($file['name']);
            $file_path = $upload_dir . $unique_name;
            
            // Mover arquivo para pasta de destino
            if (!move_uploaded_file($file['tmp_name'], $file_path)) {
                // Fallback: usar copy se move_uploaded_file falhar
                if (!copy($file['tmp_name'], $file_path)) {
                    respostaJson(false, null, 'Erro ao salvar arquivo', 500);
                }
            }
            
            // Salvar informações no banco
            $caminho_relativo = $date_path . $unique_name;
            $token_visualizacao = generateViewToken();
            
            $pdfs_table = getTableName('pdfs');
            $sql = "INSERT INTO $pdfs_table (
                ID_ENTRADA, DESCRICAO, CAMINHOPDF, DATA_REGISTRO, created_at, updated_at
            ) VALUES (
                :entrada_id, :descricao, :caminho_arquivo, NOW(), NOW(), NOW()
            )";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'entrada_id' => $entrada_id,
                'descricao' => sanitizar($descricao),
                'caminho_arquivo' => $caminho_relativo
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
                'descricao' => $descricao
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
            $file_path = "../upload/pdfs/" . $pdf['CAMINHOPDF'];
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

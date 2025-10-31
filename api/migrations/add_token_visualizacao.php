<?php
// Execução única: adicionar coluna token_visualizacao em PDFs, popular valores ausentes
// e garantir que a pasta de upload api/upload/pdf exista em produção.

header('Content-Type: application/json; charset=utf-8');

try {
    // Base da API
    if (!defined('API_BASE_DIR')) {
        define('API_BASE_DIR', dirname(__DIR__));
    }

    require_once API_BASE_DIR . '/config/db.php';
    require_once API_BASE_DIR . '/config/table-mapping.php';
    require_once API_BASE_DIR . '/config/upload.php';

    $result = [
        'steps' => [],
        'success' => true,
    ];

    // 1) Detectar tabela de PDFs
    $pdfs_table = getTableName('pdfs');
    $result['steps'][] = [ 'action' => 'detect_table', 'table' => $pdfs_table ];

    // 2) Verificar se coluna existe
    $columnExists = false;
    try {
        $stmt = $pdo->query("DESCRIBE `$pdfs_table`");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
        $columnExists = in_array('token_visualizacao', $columns, true);
    } catch (Exception $e) {
        // Alguns hosts não permitem DESCRIBE; fallback simples
        $columnExists = false;
    }

    // 3) Adicionar coluna se necessário
    if (!$columnExists) {
        try {
            $pdo->exec("ALTER TABLE `$pdfs_table` ADD COLUMN `token_visualizacao` VARCHAR(128) NULL AFTER `CAMINHOPDF`");
            $result['steps'][] = [ 'action' => 'add_column', 'status' => 'added' ];
        } catch (Exception $e) {
            $result['success'] = false;
            $result['steps'][] = [ 'action' => 'add_column', 'status' => 'error', 'error' => $e->getMessage() ];
            echo json_encode($result);
            exit;
        }
    } else {
        $result['steps'][] = [ 'action' => 'add_column', 'status' => 'already_exists' ];
    }

    // 4) Popular tokens ausentes
    $populated = 0;
    try {
        // Buscar registros sem token
        $stmt = $pdo->prepare("SELECT ID_PDF FROM `$pdfs_table` WHERE token_visualizacao IS NULL OR token_visualizacao = '' LIMIT 10000");
        $stmt->execute();
        $ids = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);

        if (!empty($ids)) {
            $update = $pdo->prepare("UPDATE `$pdfs_table` SET token_visualizacao = :token WHERE ID_PDF = :id");
            foreach ($ids as $id) {
                $token = hash('sha256', uniqid('pdf_token_', true) . microtime(true) . mt_rand());
                $update->execute([ 'token' => $token, 'id' => $id ]);
                $populated++;
            }
        }
        $result['steps'][] = [ 'action' => 'populate_tokens', 'updated' => $populated ];
    } catch (Exception $e) {
        $result['success'] = false;
        $result['steps'][] = [ 'action' => 'populate_tokens', 'status' => 'error', 'error' => $e->getMessage() ];
        echo json_encode($result);
        exit;
    }

    // 5) Garantir pasta de upload api/upload/pdf
    $createdDir = false;
    try {
        if (!is_dir(PDF_UPLOAD_DIR)) {
            @mkdir(PDF_UPLOAD_DIR, 0755, true);
            $createdDir = is_dir(PDF_UPLOAD_DIR);
        }
        // Criar subpasta do mês atual se organização por data estiver ativa
        if (defined('UPLOAD_ORGANIZE_BY_DATE') && UPLOAD_ORGANIZE_BY_DATE) {
            createDateBasedPath();
        }
        $result['steps'][] = [ 'action' => 'ensure_upload_dir', 'path' => PDF_UPLOAD_DIR, 'created' => $createdDir ];
    } catch (Exception $e) {
        $result['success'] = false;
        $result['steps'][] = [ 'action' => 'ensure_upload_dir', 'status' => 'error', 'error' => $e->getMessage() ];
        echo json_encode($result);
        exit;
    }

    echo json_encode($result);
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}



<?php
// Teste do endpoint sem autenticação
require_once 'api/config/db.php';

// Simular requisição DELETE
$_SERVER['REQUEST_METHOD'] = 'DELETE';
$_GET['id'] = '2806';

// Simular usuário autenticado diretamente
$usuario = [
    'id' => 1,
    'Usuario' => 'admin',
    'nivel' => 'Administrador'
];

// Capturar output
ob_start();

try {
    // Incluir apenas a lógica do DELETE sem middleware
    $observacao_id = $_GET['id'] ?? '';
    
    if (empty($observacao_id)) {
        echo json_encode(['success' => false, 'message' => 'ID da observação não especificado']);
        exit;
    }
    
    // Verificar se existe e se o usuário pode deletar
    $stmt = $pdo->prepare("
        SELECT id, usuario_id, entrada_id 
        FROM observacoes 
        WHERE id = :id LIMIT 1
    ");
    $stmt->execute(['id' => $observacao_id]);
    $observacao = $stmt->fetch();
    
    if (!$observacao) {
        echo json_encode(['success' => false, 'message' => 'Observação não encontrada']);
        exit;
    }
    
    // Verificar se o usuário pode deletar (própria observação ou admin)
    if ($observacao['usuario_id'] != $usuario['id'] && $usuario['nivel'] !== 'Administrador') {
        echo json_encode(['success' => false, 'message' => 'Você só pode deletar suas próprias observações']);
        exit;
    }
    
    // Deletar observação
    $stmt = $pdo->prepare("DELETE FROM observacoes WHERE id = :id");
    $stmt->execute(['id' => $observacao_id]);
    
    echo json_encode(['success' => true, 'message' => 'Observação deletada com sucesso']);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erro ao deletar observação: ' . $e->getMessage()]);
}

$output = ob_get_contents();
ob_end_clean();

echo "Resposta do endpoint:\n";
echo $output . "\n";
?>

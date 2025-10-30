<?php
/**
 * Endpoint de Health Check
 * Substitui a rota de teste do Laravel
 */

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'erro' => 'Método não permitido']);
    exit;
}

echo json_encode([
    'success' => true,
    'status' => 'ok',
    'timestamp' => date('Y-m-d H:i:s'),
    'version' => '1.0.0',
    'environment' => 'production'
]);

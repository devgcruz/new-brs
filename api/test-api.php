<?php
// Teste simples da API
header('Content-Type: application/json');
echo json_encode([
    'status' => 'success',
    'message' => 'API funcionando',
    'timestamp' => date('Y-m-d H:i:s'),
    'environment' => defined('PRODUCTION_MODE') ? (PRODUCTION_MODE ? 'production' : 'development') : 'unknown'
]);

<?php
/**
 * Configuração CORS centralizada
 * Headers CORS são definidos aqui para evitar duplicação
 */

// Remover qualquer header CORS existente para evitar duplicação
@header_remove('Access-Control-Allow-Origin');
@header_remove('Access-Control-Allow-Methods');
@header_remove('Access-Control-Allow-Headers');
@header_remove('Access-Control-Allow-Credentials');
@header_remove('Access-Control-Max-Age');

// Aguardar um pouco para garantir que os headers foram removidos
usleep(1000);

// Definir headers CORS específicos para desenvolvimento
header("Access-Control-Allow-Origin: http://localhost:3000", true);
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS", true);
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, Accept", true);
header("Access-Control-Allow-Credentials: true", true);
header("Access-Control-Max-Age: 86400", true);

// Lidar com preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Definir Content-Type padrão apenas se não foi definido
if (!headers_sent()) {
    header("Content-Type: application/json; charset=utf-8");
}


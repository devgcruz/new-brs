<?php

// Incluir configuração CORS centralizada
require_once __DIR__ . '/../config/cors.php';
/**
 * Endpoint: GET /usuarios/roles
 * Listar roles disponíveis no sistema
 */

// Definir o diretório base da API se não estiver definido
if (!defined('API_BASE_DIR')) {
    define('API_BASE_DIR', dirname(__DIR__));
}

require_once API_BASE_DIR . "/config/db.php";
require_once API_BASE_DIR . "/middleware/auth.php";
require_once API_BASE_DIR . "/helpers/auth.php";

// Verificar método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respostaJson(false, null, 'Método não permitido', 405);
}

// Verificar autenticação e permissão
$usuario = middlewarePermissao('gerenciar-usuarios');

try {
    // Buscar roles na tabela roles (se existir) ou usar roles fixos
    $roles = [];
    
    // Tentar buscar da tabela roles primeiro
    try {
        $stmt = $pdo->query("SELECT id, name FROM roles ORDER BY name");
        $roles_db = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($roles_db)) {
            $roles = $roles_db;
        }
    } catch (Exception $e) {
        // Se não existir tabela roles, usar roles fixos
        $roles = [
            ['id' => 1, 'name' => 'Administrador'],
            ['id' => 2, 'name' => 'Usuário'],
            ['id' => 3, 'name' => 'Operador'],
            ['id' => 4, 'name' => 'Visualizador']
        ];
    }
    
    // Se ainda estiver vazio, usar roles fixos
    if (empty($roles)) {
        $roles = [
            ['id' => 1, 'name' => 'Administrador'],
            ['id' => 2, 'name' => 'Usuário'],
            ['id' => 3, 'name' => 'Operador'],
            ['id' => 4, 'name' => 'Visualizador']
        ];
    }
    
    // Log da consulta
    logSimples('usuarios_roles', [
        'total_roles' => count($roles),
        'usuario' => $usuario['Usuario']
    ]);
    
    respostaJson(true, $roles, 'Roles obtidos com sucesso');
    
} catch (Exception $e) {
    logSimples('error', [
        'endpoint' => 'usuarios-roles',
        'erro' => $e->getMessage(),
        'usuario' => $usuario['Usuario'] ?? 'N/A'
    ]);
    
    respostaJson(false, null, 'Erro ao obter roles: ' . $e->getMessage(), 500);
}

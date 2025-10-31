<?php
/**
 * Configurações de ambiente
 */

// Definir modo de produção (true = produção, false = desenvolvimento)
define('PRODUCTION_MODE', false);

// Configurações de debug
define('DEBUG_MODE', !PRODUCTION_MODE);

// Configurações de logs
define('ENABLE_LOGS', !PRODUCTION_MODE);

// Configurações de CORS para produção
if (PRODUCTION_MODE) {
    // Em produção, permitir o domínio real e localhost para desenvolvimento local
    define('ALLOWED_ORIGINS', [

        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000'
    ]);
} else {
    // Em desenvolvimento, permitir localhost
    define('ALLOWED_ORIGINS', [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000'
    ]);
}

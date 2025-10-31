<?php
// Ensure CORS headers are sent even when hitting this file directly
require_once __DIR__ . '/config/cors.php';

// Thin wrapper to ensure /api/login.php works even if rewrites fail
require_once __DIR__ . '/endpoints/login.php';

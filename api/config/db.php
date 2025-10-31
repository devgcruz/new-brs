<?php
/**
 * Configuração de conexão com banco de dados
 * Substitua os valores pelas suas credenciais de hospedagem compartilhada
 */

$DB_HOST = "localhost";
$DB_USER = "root";
$DB_PASS = "";
$DB_NAME = "brs_database_target";

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8", $DB_USER, $DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "erro" => "Erro de conexão com banco de dados",
        "message" => $e->getMessage()
    ]);
    exit;
}

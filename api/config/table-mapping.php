<?php
/**
 * Mapeamento de nomes de tabelas
 * Mapeia os nomes usados no código para os nomes reais no banco
 */

$TABLE_MAPPING = [
    'entradas' => 'tab_entrada',
    'financeiros' => 'tab_financeiro', 
    'judicial' => 'tab_judicial',
    'pdfs' => 'tab_pdf',
    'observacoes' => 'observacoes',
    'observacoes_financeiro' => 'tab_observacoes_financeiro',
    'usuarios' => 'usuarios',
    'colaboradores' => 'colaboradores',
    'colaborador_docs' => 'tab_colaborador_docs',
    'marcas' => 'marcas',
    'posicoes' => 'posicoes',
    'seguradoras' => 'seguradoras'
];

/**
 * Função para obter o nome real da tabela
 */
function getTableName($logicalName) {
    global $TABLE_MAPPING;
    return $TABLE_MAPPING[$logicalName] ?? $logicalName;
}
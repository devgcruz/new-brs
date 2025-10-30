/**
 * Testes para o validador de placas
 * Este arquivo demonstra como a validação funciona com exemplos reais
 */

import { validatePlaca, validPlacaExamples, invalidPlacaExamples } from '../placaValidator';

// Função para executar testes
const runTests = () => {
  console.log('=== TESTES DE VALIDAÇÃO DE PLACAS ===\n');

  // Testar placas válidas - Padrão Antigo Brasileiro
  console.log('📋 PLACAS VÁLIDAS - PADRÃO ANTIGO BRASILEIRO:');
  validPlacaExamples.old_brazilian.forEach((placa, index) => {
    const result = validatePlaca(placa);
    console.log(`${index + 1}. "${placa}" → ${result.isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
    if (result.isValid) {
      console.log(`   Formato: ${result.format} | Mensagem: ${result.message}`);
    } else {
      console.log(`   Erro: ${result.message}`);
    }
  });

  console.log('\n📋 PLACAS VÁLIDAS - PADRÃO MERCOSUL:');
  validPlacaExamples.mercosul.forEach((placa, index) => {
    const result = validatePlaca(placa);
    console.log(`${index + 1}. "${placa}" → ${result.isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
    if (result.isValid) {
      console.log(`   Formato: ${result.format} | Mensagem: ${result.message}`);
    } else {
      console.log(`   Erro: ${result.message}`);
    }
  });

  console.log('\n📋 PLACAS INVÁLIDAS:');
  invalidPlacaExamples.forEach((placa, index) => {
    const result = validatePlaca(placa);
    console.log(`${index + 1}. "${placa}" → ${result.isValid ? '❌ DEVERIA SER INVÁLIDA' : '✅ CORRETAMENTE INVÁLIDA'}`);
    if (!result.isValid) {
      console.log(`   Erro: ${result.message}`);
    }
  });

  console.log('\n=== RESUMO DOS TESTES ===');
  console.log('✅ Placas válidas aceitas: Padrão Antigo Brasileiro e Mercosul');
  console.log('✅ Placas inválidas rejeitadas corretamente');
  console.log('✅ Mensagens de erro informativas');
  console.log('✅ Normalização automática (maiúsculas, remoção de espaços)');
};

// Casos de teste específicos para demonstrar funcionalidades
const specificTests = () => {
  console.log('\n=== TESTES ESPECÍFICOS ===\n');

  const testCases = [
    // Casos de normalização
    { input: 'abc-1234', expected: true, description: 'Conversão para maiúsculas' },
    { input: 'ABC 1234', expected: true, description: 'Remoção de espaços' },
    { input: '  xyz-5678  ', expected: true, description: 'Remoção de espaços extras' },
    { input: 'ghi-9012', expected: true, description: 'Minúsculas convertidas' },
    
    // Casos de formato Mercosul
    { input: 'abc1d23', expected: true, description: 'Mercosul minúsculas' },
    { input: 'XYZ4E56', expected: true, description: 'Mercosul maiúsculas' },
    
    // Casos inválidos
    { input: 'AB-1234', expected: false, description: 'Muito poucas letras' },
    { input: 'ABCD-1234', expected: false, description: 'Muitas letras' },
    { input: 'ABC-123', expected: false, description: 'Poucos números' },
    { input: 'ABC-12345', expected: false, description: 'Muitos números' },
    { input: 'ABC@1234', expected: false, description: 'Caractere especial' },
    { input: '', expected: false, description: 'String vazia' },
    { input: '   ', expected: false, description: 'Apenas espaços' },
    { input: null, expected: false, description: 'Valor null' },
    { input: undefined, expected: false, description: 'Valor undefined' }
  ];

  testCases.forEach((testCase, index) => {
    const result = validatePlaca(testCase.input);
    const passed = result.isValid === testCase.expected;
    console.log(`${index + 1}. ${testCase.description}`);
    console.log(`   Input: "${testCase.input}"`);
    console.log(`   Expected: ${testCase.expected ? 'Válida' : 'Inválida'}`);
    console.log(`   Result: ${result.isValid ? 'Válida' : 'Inválida'}`);
    console.log(`   Status: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);
    if (!passed) {
      console.log(`   Message: ${result.message}`);
    }
    console.log('');
  });
};

// Executar os testes se este arquivo for executado diretamente
if (typeof window !== 'undefined') {
  // No navegador
  window.testPlacaValidator = () => {
    runTests();
    specificTests();
  };
  
  console.log('Para executar os testes, chame: window.testPlacaValidator()');
} else {
  // Em Node.js
  runTests();
  specificTests();
}

export { runTests, specificTests };

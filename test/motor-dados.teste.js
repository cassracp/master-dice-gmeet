/**
 * Testes automatizados para motor-dados.js
 */
import { executarRolagem, executarMultiplasRolagens, extrairNotacoes3D } from '../src/core/motor-dados.js';

function afirmar(condicao, mensagem) {
  if (!condicao) {
    console.error(`❌ FALHA: ${mensagem}`);
    process.exit(1);
  }
  console.log(`✅ SUCESSO: ${mensagem}`);
}

console.log('--- Iniciando Testes Unitários de Rolagem ---');

// Teste 1: Rolagem simples
const resultado1 = executarRolagem('1d20+5');
afirmar(resultado1.total >= 6 && resultado1.total <= 25, '1d20+5 deve gerar valor entre 6 e 25');
afirmar(resultado1.gruposDados.length === 1, 'Deve conter 1 grupo de dados');

// Teste 2: Keep highest (4d6kh3)
const resultado2 = executarRolagem('4d6kh3');
afirmar(resultado2.total >= 3 && resultado2.total <= 18, '4d6kh3 deve gerar valor entre 3 e 18');
afirmar(resultado2.gruposDados[0].valoresAtivos.length === 3, 'Deve manter exatamente 3 dados');
afirmar(resultado2.gruposDados[0].valoresDescartados.length === 1, 'Deve descartar exatamente 1 dado');

// Teste 3: Keep lowest (2d20kl1)
const resultado3 = executarRolagem('2d20kl1');
afirmar(resultado3.gruposDados[0].valoresAtivos.length === 1, 'Deve manter apenas 1 dado');
afirmar(resultado3.gruposDados[0].valoresDescartados.length === 1, 'Deve descartar 1 dado');

// Teste 4: Expressões com parênteses e multiplicação
const resultado4 = executarRolagem('(1d1+2)*3');
afirmar(resultado4.total === 9, '(1d1+2)*3 deve resultar em exatamente 9');

// Teste 5: Rótulo com hashtag
const resultado5 = executarRolagem('1d20+7 # Ataque Vorpal');
afirmar(resultado5.rotulo === 'Ataque Vorpal', 'Rótulo deve ser extraído corretamente');

// Teste 6: Múltiplas rolagens separadas por vírgula
const multi = executarMultiplasRolagens('1d20+4 # Teste, 2d6+2 # Dano');
afirmar(multi.length === 2, 'Deve processar duas rolagens');
afirmar(multi[0].rotulo === 'Teste' && multi[1].rotulo === 'Dano', 'Rótulos múltiplos devem bater');

// Teste 7: Extração de notações para o motor 3D
const notacoes3d = extrairNotacoes3D('2d8 + 1d6 + 3 # Ataque');
afirmar(notacoes3d.length === 2 && notacoes3d[0] === '2d8' && notacoes3d[1] === '1d6', 'extrairNotacoes3D deve extrair 2d8 e 1d6');

const notacoesKh = extrairNotacoes3D('4d6kh3');
afirmar(notacoesKh.length === 1 && notacoesKh[0] === '4d6', 'extrairNotacoes3D deve extrair 4d6 para 4d6kh3');

// Teste 8: Execução com valores pré-determinados do motor 3D (coerência física/histórico)
const resultadoSincronizado = executarRolagem('1d20+5', {
  valoresPredefinidos: [{ sides: 20, value: 17 }]
});
afirmar(resultadoSincronizado.total === 22, '1d20+5 com dado 3D em 17 deve totalizar exatamente 22');
afirmar(resultadoSincronizado.gruposDados[0].valoresAtivos[0] === 17, 'Valor ativo do d20 deve ser exatamente 17');

// Teste 9: Keep Highest com valores 3D predefinidos
const resultadoKhSincronizado = executarRolagem('4d6kh3', {
  valoresPredefinidos: [
    { sides: 6, value: 6 },
    { sides: 6, value: 4 },
    { sides: 6, value: 2 },
    { sides: 6, value: 1 }
  ]
});
afirmar(resultadoKhSincronizado.total === 12, '4d6kh3 [6,4,2,1] deve somar 12 (6+4+2)');
afirmar(resultadoKhSincronizado.gruposDados[0].valoresDescartados[0] === 1, 'Dado descartado deve ser exatamente 1');

console.log('--- Todos os testes do motor-dados passaram com êxito! ---');


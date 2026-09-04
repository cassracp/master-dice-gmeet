/**
 * motor-dados.js - Engine de Rolagem de Dados de Alta Precisão para o Ready2Roll (R2R)
 *
 * Utiliza crypto.getRandomValues para garantir aleatoriedade criptograficamente segura.
 * Suporta keeping/dropping (kh, kl, dh, dl), explosão (!), rerolls (r) e expressões matemáticas.
 */

const LIMITE_MAXIMO_DADOS = 500;
const LIMITE_EXPLOSOES = 50;
const FACES_3D_SUPORTADAS = new Set([4, 6, 8, 10, 12, 20, 100]);

/**
 * Extrai a lista de notações de dados 3D compatíveis a partir de um comando textual.
 * Exemplo: "1d20+5 # Ataque" -> ["1d20"]
 * Exemplo: "4d6kh3" -> ["4d6"]
 * Exemplo: "2d8 + 1d6 + 3" -> ["2d8", "1d6"]
 * @param {string} comandoCompleto
 * @returns {string[]} Notações para o motor 3D
 */
export function extrairNotacoes3D(comandoCompleto) {
  if (!comandoCompleto || typeof comandoCompleto !== "string") return [];

  let comandoLimpo = comandoCompleto.trim().replace(/^\/(?:roll|r)\s+/i, "");
  if (comandoLimpo.includes("#")) {
    comandoLimpo = comandoLimpo.split("#")[0].trim();
  }

  const regexDados = /(\d+)d(\d+)/gi;
  const notacoes = [];
  let match;

  while ((match = regexDados.exec(comandoLimpo)) !== null) {
    const qtd = parseInt(match[1], 10);
    const lados = parseInt(match[2], 10);
    if (qtd > 0 && FACES_3D_SUPORTADAS.has(lados)) {
      notacoes.push(`${qtd}d${lados}`);
    }
  }

  return notacoes;
}

/**
 * Gera um número inteiro pseudo-aleatório seguro no intervalo [1, lados].
 * @param {number} lados - Número de faces do dado.
 * @returns {number}
 */
function gerarNumeroAleatorio(lados) {
  if (lados <= 0) return 1;
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  // Redução uniforme sem viés para dados convencionais
  return (buffer[0] % lados) + 1;
}

/**
 * Rola um dado individual com suporte a explosão e re-rolagem.
 * @param {number} lados
 * @param {object} opcoes
 * @returns {{ valores: number[], descartados: number[], explosoes: number[] }}
 */
function rolarDadoIndividual(lados, opcoes = {}) {
  const valores = [];
  const descartados = [];
  const explosoes = [];

  let valorInicial =
    typeof opcoes.valorPredefinido === "number" &&
    opcoes.valorPredefinido >= 1 &&
    opcoes.valorPredefinido <= lados
      ? opcoes.valorPredefinido
      : gerarNumeroAleatorio(lados);

  // Tratamento de Re-rolagem (ex: r<2 ou r1)
  if (opcoes.reRolagem) {
    const { operador, limite } = opcoes.reRolagem;
    let deveRerolar = false;

    if (operador === "<=" && valorInicial <= limite) deveRerolar = true;
    else if (operador === "<" && valorInicial < limite) deveRerolar = true;
    else if (operador === ">=" && valorInicial >= limite) deveRerolar = true;
    else if (operador === ">" && valorInicial > limite) deveRerolar = true;
    else if ((operador === "==" || operador === "=") && valorInicial === limite)
      deveRerolar = true;
    else if (!operador && valorInicial === limite) deveRerolar = true;

    if (deveRerolar) {
      descartados.push(valorInicial);
      valorInicial = gerarNumeroAleatorio(lados);
    }
  }

  valores.push(valorInicial);

  // Tratamento de Explosão (ex: 1d6! ou 1d6!>5)
  if (opcoes.explosao) {
    const { operador, limite } = opcoes.explosao;
    let contadorExplosoes = 0;
    let ultimoValor = valorInicial;

    while (contadorExplosoes < LIMITE_EXPLOSOES) {
      let explode = false;
      const alvo = limite !== undefined ? limite : lados;

      if (!operador && ultimoValor >= alvo) explode = true;
      else if (operador === ">=" && ultimoValor >= alvo) explode = true;
      else if (operador === ">" && ultimoValor > alvo) explode = true;
      else if (operador === "=" && ultimoValor === alvo) explode = true;

      if (!explode) break;

      const valorExplodido = gerarNumeroAleatorio(lados);
      explosoes.push(valorExplodido);
      valores.push(valorExplodido);
      ultimoValor = valorExplodido;
      contadorExplosoes++;
    }
  }

  return { valores, descartados, explosoes };
}

/**
 * Avalia um grupo de dados (ex: "4d6kh3", "1d20", "2d10!").
 * @param {string} expressaoDado
 * @returns {object}
 */
function avaliarGrupoDados(expressaoDado, filaValores = []) {
  const padrao =
    /^(\d+)d(\d+)(r(?:[<>=]=?)?\d+)?(!(?:[<>=]=?)?\d*)?((?:kh|kl|dh|dl)\d+)?$/i;
  const correspondencia = expressaoDado.trim().match(padrao);

  if (!correspondencia) {
    throw new Error(`Notação de dados inválida: "${expressaoDado}"`);
  }

  const quantidadeDados = parseInt(correspondencia[1], 10);
  const lados = parseInt(correspondencia[2], 10);
  const modificadorReroll = correspondencia[3];
  const modificadorExplosao = correspondencia[4];
  const modificadorKeepDrop = correspondencia[5];

  if (quantidadeDados <= 0 || lados <= 0) {
    throw new Error("Quantidade de dados e faces devem ser maiores que zero.");
  }

  if (quantidadeDados > LIMITE_MAXIMO_DADOS) {
    throw new Error(
      `Limite máximo de dados excedido (${LIMITE_MAXIMO_DADOS}).`,
    );
  }

  // Parse de Re-rolagem
  let configuracaoReroll = null;
  if (modificadorReroll) {
    const matchReroll = modificadorReroll.match(/r([<>=]=?)?(\d+)/i);
    if (matchReroll) {
      configuracaoReroll = {
        operador: matchReroll[1] || "=",
        limite: parseInt(matchReroll[2], 10),
      };
    }
  }

  // Parse de Explosão
  let configuracaoExplosao = null;
  if (modificadorExplosao) {
    const matchExplode = modificadorExplosao.match(/!([<>=]=?)?(\d+)?/i);
    if (matchExplode) {
      configuracaoExplosao = {
        operador: matchExplode[1] || ">=",
        limite: matchExplode[2] ? parseInt(matchExplode[2], 10) : lados,
      };
    }
  }

  // Execução das rolagens individuais
  const rolagensIndividuais = [];
  for (let i = 0; i < quantidadeDados; i++) {
    let valorFornecido = null;
    if (filaValores && filaValores.length > 0) {
      const idx = filaValores.findIndex((item) =>
        typeof item === "object" ? item.sides === lados : true
      );
      if (idx !== -1) {
        const itemRemovido = filaValores.splice(idx, 1)[0];
        valorFornecido =
          typeof itemRemovido === "object" ? itemRemovido.value : itemRemovido;
      }
    }

    const resultado = rolarDadoIndividual(lados, {
      valorPredefinido: valorFornecido,
      reRolagem: configuracaoReroll,
      explosao: configuracaoExplosao,
    });
    rolagensIndividuais.push(resultado);
  }

  // Achatamento de todos os valores gerados para aplicação de keep/drop se aplicável
  let listaParaContabilizar = [];
  rolagensIndividuais.forEach((item, indiceOriginal) => {
    item.valores.forEach((v) => {
      listaParaContabilizar.push({
        valor: v,
        indiceOriginal,
        descartadoPorKeepDrop: false,
      });
    });
  });

  // Tratamento de Keep / Drop (kh, kl, dh, dl)
  if (modificadorKeepDrop) {
    const operador = modificadorKeepDrop.substring(0, 2).toLowerCase();
    const contagem = parseInt(modificadorKeepDrop.substring(2), 10);

    if (contagem > listaParaContabilizar.length) {
      throw new Error(
        `Não é possível manter/descartar mais dados (${contagem}) do que o total rolado.`,
      );
    }

    // Ordena cópia por valor decrescente
    const ordenados = [...listaParaContabilizar].sort(
      (a, b) => b.valor - a.valor,
    );

    if (operador === "kh") {
      const mantidos = new Set(ordenados.slice(0, contagem));
      listaParaContabilizar.forEach((item) => {
        if (!mantidos.has(item)) item.descartadoPorKeepDrop = true;
      });
    } else if (operador === "kl") {
      const mantidos = new Set(ordenados.slice(-contagem));
      listaParaContabilizar.forEach((item) => {
        if (!mantidos.has(item)) item.descartadoPorKeepDrop = true;
      });
    } else if (operador === "dh") {
      const descartados = new Set(ordenados.slice(0, contagem));
      listaParaContabilizar.forEach((item) => {
        if (descartados.has(item)) item.descartadoPorKeepDrop = true;
      });
    } else if (operador === "dl") {
      const descartados = new Set(ordenados.slice(-contagem));
      listaParaContabilizar.forEach((item) => {
        if (descartados.has(item)) item.descartadoPorKeepDrop = true;
      });
    }
  }

  const valoresAtivos = listaParaContabilizar
    .filter((i) => !i.descartadoPorKeepDrop)
    .map((i) => i.valor);
  const valoresDescartados = listaParaContabilizar
    .filter((i) => i.descartadoPorKeepDrop)
    .map((i) => i.valor);
  const somaTotal = valoresAtivos.reduce((acum, val) => acum + val, 0);

  // Verificação de acerto ou falha crítica (especialmente relevante em d20)
  const ehCriticoSucesso = lados === 20 && valoresAtivos.includes(20);
  const ehCriticoFalha = lados === 20 && valoresAtivos.includes(1);

  return {
    expressao: expressaoDado,
    quantidadeDados,
    lados,
    total: somaTotal,
    valoresAtivos,
    valoresDescartados,
    detalhes: rolagensIndividuais,
    ehCriticoSucesso,
    ehCriticoFalha,
  };
}

/**
 * Avalia de forma segura expressões aritméticas simples com precedência correta.
 * @param {string} expressaoMatematica
 * @returns {number}
 */
function avaliarExpressaoAritmetica(expressaoMatematica) {
  let str = expressaoMatematica.replace(/\s+/g, "");

  // Validação estrita de caracteres permitidos
  if (/[^\d\+\-\*\/\(\)\.]/.test(str)) {
    throw new Error(`Expressão matemática inválida: "${expressaoMatematica}"`);
  }

  function resolverParenteses(s) {
    while (s.includes("(")) {
      s = s.replace(/\(([^()]+)\)/g, (_, conteudoInterno) =>
        resolverParenteses(conteudoInterno),
      );
    }

    // Multiplicação e Divisão
    const regexMulDiv = /(-?\d+(?:\.\d+)?)([\*\/])(-?\d+(?:\.\d+)?)/;
    while (regexMulDiv.test(s)) {
      s = s.replace(regexMulDiv, (_, a, op, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (op === "/" && numB === 0)
          throw new Error("Divisão por zero detectada.");
        return op === "*" ? (numA * numB).toString() : (numA / numB).toString();
      });
    }

    // Ajuste de sinais duplos (-- vira +, +- vira -)
    s = s.replace(/--/g, "+").replace(/\+-/g, "-");

    // Adição e Subtração
    const regexAddSub = /(-?\d+(?:\.\d+)?)([\+\-])(\d+(?:\.\d+)?)/;
    while (regexAddSub.test(s)) {
      s = s.replace(regexAddSub, (_, a, op, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        return op === "+" ? (numA + numB).toString() : (numA - numB).toString();
      });
    }

    return parseFloat(s);
  }

  return resolverParenteses(str);
}

/**
 * Processa e executa uma rolagem completa com suporte a dados, operações matemáticas e rótulo descritivo.
 * Suporta formatos como:
 * - "1d20+5 Ataque com Espada"
 * - "4d6kh3"
 * - "(1d8+3)*2 + 1d4"
 *
 * @param {string} comandoCompleto
 * @returns {object} Resultado estruturado da rolagem
 */
export function executarRolagem(comandoCompleto, opcoes = {}) {
  if (
    !comandoCompleto ||
    typeof comandoCompleto !== "string" ||
    comandoCompleto.trim() === ""
  ) {
    throw new Error("Comando de rolagem vazio ou não informado.");
  }

  const filaValores = Array.isArray(opcoes?.valoresPredefinidos)
    ? [...opcoes.valoresPredefinidos]
    : [];

  // Remove prefixo /roll ou /r se existir
  let comandoLimpo = comandoCompleto.trim().replace(/^\/(?:roll|r)\s+/i, "");

  // Separar rótulo/descrição (ex: "1d20+5 # Ataque" ou "1d20+5 Ataque com Espada")
  // Segurança: rejeitar a notação '@valor' reservada ao sistema visual 3D.
  // Impede que jogadores forcem resultados de dados via interface de texto.
  if (comandoLimpo.includes('@')) {
    throw new Error("Comando inválido: o caractere '@' não é permitido na notação de dados.");
  }

  let rotulo = "";
  if (comandoLimpo.includes("#")) {
    const partes = comandoLimpo.split("#");
    comandoLimpo = partes[0].trim();
    rotulo = partes.slice(1).join("#").trim();
  }

  // Regex para identificar expressões de dados
  const regexDados =
    /(\d+d\d+(?:r(?:[<>=]=?)?\d+)?(?:!(?:[<>=]=?)?\d*)?(?:(?:kh|kl|dh|dl)\d+)?)/gi;

  const gruposDados = [];
  let temCriticoSucesso = false;
  let temCriticoFalha = false;

  // Substitui cada grupo de dado pelo seu valor somado na expressão matemática
  const expressaoAritmetica = comandoLimpo.replace(regexDados, (match) => {
    const resultadoGrupo = avaliarGrupoDados(match, filaValores);
    gruposDados.push(resultadoGrupo);

    if (resultadoGrupo.ehCriticoSucesso) temCriticoSucesso = true;
    if (resultadoGrupo.ehCriticoFalha) temCriticoFalha = true;

    return resultadoGrupo.total.toString();
  });

  const totalCalculado =
    Math.round(avaliarExpressaoAritmetica(expressaoAritmetica) * 100) / 100;

  // Formatação amigável para exibição textual
  const detalheDadosTexto = gruposDados
    .map((g) => {
      const valoresFormatados = g.valoresAtivos.join(", ");
      const descartadosTexto =
        g.valoresDescartados.length > 0
          ? ` (descartados: ${g.valoresDescartados.join(", ")})`
          : "";
      return `${g.expressao} [${valoresFormatados}]${descartadosTexto}`;
    })
    .join("; ");

  return {
    comandoOriginal: comandoCompleto.trim(),
    rotulo,
    total: totalCalculado,
    gruposDados,
    temCriticoSucesso,
    temCriticoFalha,
    detalheDadosTexto,
    dataHora: new Date().toISOString(),
  };
}

/**
 * Processa múltiplos comandos separados por vírgula (ex: "1d20+5 Ataque, 1d8+3 Dano").
 * @param {string} entrada
 * @returns {object[]}
 */
export function executarMultiplasRolagens(entrada) {
  const comandos = entrada
    .split(",")
    .map((cmd) => cmd.trim())
    .filter(Boolean);
  return comandos.map((cmd) => executarRolagem(cmd));
}

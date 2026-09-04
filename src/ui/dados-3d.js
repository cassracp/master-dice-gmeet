/**
 * dados-3d.js — Camada Visual de Dados 3D (Ready2Roll VTT)
 *
 * Encapsula a integração com a biblioteca @3d-dice/dice-box.
 * Os dados 3D rolam fisicamente sobre toda a janela do aplicativo como uma mesa virtual,
 * proporcionando impacto visual dinâmico com auto-dismiss após a estabilização.
 */

const DURACAO_VISIBILIDADE_MS = 2500;
const ID_CONTAINER = "r2r-dice-box-overlay";
const FACES_3D_SUPORTADAS = new Set([4, 6, 8, 10, 12, 20, 100]);

let instanciaDiceBox = null;
let containerOverlay = null;
let timerDismiss = null;
let inicializando = false;

/**
 * Cria ou obtém o container fixo que cobre a tela inteira do aplicativo.
 * O container fica no document.body com z-index máximo (2147483647) para
 * sobrepor qualquer camada do VTT sem bloquear cliques (pointer-events: none).
 * @returns {HTMLElement}
 */
function obterOuCriarContainer() {
  if (containerOverlay) return containerOverlay;

  // Injeta estilos globais para o container e o canvas 3D
  if (!document.getElementById("r2r-dice-box-estilos")) {
    const elementoEstilo = document.createElement("style");
    elementoEstilo.id = "r2r-dice-box-estilos";
    elementoEstilo.textContent = `
      #${ID_CONTAINER} {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
        overflow: hidden !important;
        opacity: 0;
        transition: opacity 0.4s ease;
      }
      #${ID_CONTAINER} canvas {
        width: 100% !important;
        height: 100% !important;
        display: block !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(elementoEstilo);
  }

  containerOverlay = document.createElement("div");
  containerOverlay.id = ID_CONTAINER;
  document.body.appendChild(containerOverlay);

  return containerOverlay;
}

/**
 * Inicializa a instância do DiceBox sob demanda (lazy loading).
 * @returns {Promise<object|null>} Instância do DiceBox pronta para rolagens
 */
async function obterDiceBox() {
  if (instanciaDiceBox) return instanciaDiceBox;

  if (inicializando) {
    return new Promise((resolve) => {
      const checagem = setInterval(() => {
        if (instanciaDiceBox) {
          clearInterval(checagem);
          resolve(instanciaDiceBox);
        }
      }, 100);
    });
  }

  inicializando = true;

  try {
    const { default: DiceBox } = await import("@3d-dice/dice-box");
    obterOuCriarContainer();

    const diceBox = new DiceBox({
      assetPath: "/dice-box/assets/",
      container: `#${ID_CONTAINER}`,
      id: "r2r-dice-canvas",
      theme: "default",
      themeColor: "#7c3aed", // Roxo vibrante temático do Ready2Roll
      offscreen: false,      // Renderização direta no canvas (estável em todos os navegadores)
      scale: 5,
      gravity: 1.2,
      mass: 1,
      friction: 0.8,
      spinForce: 6,
      throwForce: 6,
      startingHeight: 9,
      settleTimeout: 4000,
      enableShadows: true,
      shadowTransparency: 0.7,
    });

    await diceBox.init();
    instanciaDiceBox = diceBox;
  } catch (erro) {
    console.warn("[R2R] Dados 3D: falha ao inicializar o motor 3D:", erro);
    inicializando = false;
    return null;
  }

  inicializando = false;
  return instanciaDiceBox;
}

/**
 * Converte os grupos de dados calculados pelo motor matemático para o formato do dice-box.
 * @param {object[]} gruposDados - Grupos de dados retornados por executarRolagem()
 * @returns {string[]} Array de notações (ex.: ["1d20", "4d6"])
 */
function converterParaNotacaoDiceBox(gruposDados) {
  const notacoes = [];

  for (const grupo of gruposDados) {
    const { lados, valoresAtivos, valoresDescartados } = grupo;
    const totalDados =
      (valoresAtivos?.length || 0) + (valoresDescartados?.length || 0);

    if (totalDados <= 0) continue;

    if (FACES_3D_SUPORTADAS.has(lados)) {
      notacoes.push(`${totalDados}d${lados}`);
    }
  }

  return notacoes;
}

/**
 * Rola visualmente os dados em 3D sobre a tela inteira da aplicação e retorna
 * os valores onde os dados físicos pararam, garantindo coerência matemática.
 *
 * @param {string[]|string|object[]} notacoesOuGrupos - Notações (ex: ["1d20", "4d6"]) ou grupos do motor
 * @returns {Promise<object[]|null>} Lista de dados com face e valor resultante da simulação
 */
export async function rolarDados3D(notacoesOuGrupos) {
  if (!notacoesOuGrupos) return null;

  let notacoes = [];
  if (Array.isArray(notacoesOuGrupos)) {
    if (typeof notacoesOuGrupos[0] === "string") {
      notacoes = notacoesOuGrupos;
    } else {
      notacoes = converterParaNotacaoDiceBox(notacoesOuGrupos);
    }
  } else if (typeof notacoesOuGrupos === "string") {
    notacoes = [notacoesOuGrupos];
  }

  if (notacoes.length === 0) return null;

  const diceBox = await obterDiceBox();
  if (!diceBox) return null;

  if (timerDismiss) {
    clearTimeout(timerDismiss);
    timerDismiss = null;
  }

  try {
    const container = obterOuCriarContainer();
    container.style.opacity = "1";

    // Executa a rolagem com timeout de segurança (4.5s)
    const promessaRolagem = diceBox.roll(notacoes);
    const promessaTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout na simulação 3D")), 4500)
    );
    const resultados = await Promise.race([promessaRolagem, promessaTimeout]);

    // Inicia contagem regressiva para auto-dismiss após os dados pararem
    timerDismiss = setTimeout(() => {
      esconderOverlay();
    }, DURACAO_VISIBILIDADE_MS);

    return resultados;
  } catch (erro) {
    console.warn("[R2R] Dados 3D: erro durante a simulação:", erro);
    esconderOverlay();
    return null;
  }
}

/**
 * Oculta o overlay com transição suave e limpa os dados da cena 3D.
 */
function esconderOverlay() {
  if (containerOverlay) {
    containerOverlay.style.opacity = "0";
  }

  setTimeout(() => {
    if (
      instanciaDiceBox &&
      containerOverlay &&
      containerOverlay.style.opacity === "0"
    ) {
      try {
        instanciaDiceBox.clear();
      } catch (_) {
        /* ignora falhas na limpeza pós-animação */
      }
    }
  }, 400);
}

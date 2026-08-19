/**
 * Extensão: Rolador de Dados do Mestre para Google Meet
 * Processa comandos no chat do Google Meet e responde automaticamente.
 */

(function () {
  "use strict";

  // Mapeia o elemento DOM para o último texto processado nele,
  // prevenindo vazamento de memória (WeakMap) e garantindo
  // que o mesmo elemento com o mesmo texto não seja processado 2x.
  const mensagensProcessadas = new WeakMap();

  // Cache temporário (debounce) para evitar que o Meet dispare rolagens duplas
  // quando ele recria os elementos do chat durante o envio.
  const rolagensRecentes = new Set();

  /**
   * Envia o texto formatado no campo de chat do Google Meet.
   */
  function enviarRespostaChat(textoMensagem) {
    const campoDigitacao = document.querySelector(
      'textarea[name="chatTextInput"], textarea[aria-label*="mensagem"], textarea[aria-label*="message"], div[contenteditable="true"][aria-label*="mensagem"]',
    );

    if (!campoDigitacao) {
      console.warn("[Master Dice] Campo de digitação do chat não encontrado.");
      return;
    }

    console.log("[Master Dice] Tentando enviar resposta:", textoMensagem);

    // Preenchimento forçando atualização de estado no React/Wiz
    if (campoDigitacao.tagName.toLowerCase() === "textarea") {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(campoDigitacao, textoMensagem);
      } else {
        campoDigitacao.value = textoMensagem;
      }
      campoDigitacao.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      campoDigitacao.innerText = textoMensagem;
      campoDigitacao.dispatchEvent(
        new InputEvent("input", { bubbles: true, inputType: "insertText" }),
      );
    }

    // Google Meet tem botões com 'jsname="soHxf"' ou 'aria-label'
    setTimeout(() => {
      const botaoEnviar = document.querySelector(
        'button[aria-label*="Enviar"], button[aria-label*="Send"], button[jsname="soHxf"]',
      );

      if (botaoEnviar && !botaoEnviar.disabled) {
        console.log("[Master Dice] Clicando no botão de enviar.");
        botaoEnviar.click();
      } else {
        console.log(
          "[Master Dice] Botão desabilitado ou não encontrado. Disparando tecla Enter.",
        );
        campoDigitacao.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
          }),
        );
        campoDigitacao.dispatchEvent(
          new KeyboardEvent("keypress", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
          }),
        );
        campoDigitacao.dispatchEvent(
          new KeyboardEvent("keyup", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
          }),
        );
      }
    }, 250);
  }

  /**
   * Extrai expressões matemáticas contendo rolagens de dados de um texto natural.
   * Permite que o usuário digite "Ataque com 1d20 + 5 de dano" e extraia "1d20 + 5".
   */
  function extrairExpressoesDeDado(texto) {
    const expressoes = [];

    // 1. Captura rolagens explícitas em colchetes ex: [1d20 + 5]
    const regexColchetes = /\[([^\]]+)\]/g;
    let matchColchetes;
    while ((matchColchetes = regexColchetes.exec(texto)) !== null) {
      const expressao = matchColchetes[1].trim();
      try {
        window.JSDice.roll(expressao);
        expressoes.push(expressao);
      } catch (e) {}
      texto = texto.replace(
        matchColchetes[0],
        " ".repeat(matchColchetes[0].length),
      );
    }

    // 1.5 Captura comandos de calculadora/rolagem explícitos iniciados com 'r' (ex: "r 2+2" ou "r1d20")
    const regexCalculadora =
      /(^|\s)r\s*([\d\+\-\*\/\(][\d\s\+\-\*\/\(\)\.d]*)/gi;
    let matchCalc;
    while ((matchCalc = regexCalculadora.exec(texto)) !== null) {
      let expressao = matchCalc[2].trim();
      // Remove operadores que ficaram pendurados no final
      expressao = expressao.replace(/[\+\-\*\/\(\)\s\,]+$/, "");
      if (expressao) {
        try {
          window.JSDice.roll(expressao);
          expressoes.push(expressao);
        } catch (e) {}
        // Substitui por espaços para não ser capturado de novo pela regexDado
        texto = texto.replace(matchCalc[0], " ".repeat(matchCalc[0].length));
      }
    }

    // 2. Captura rolagens livres ex: "Ataque 1d20 + 5 de dano"
    const regexDado = /\b\d+d\d+/gi;
    let matchDado;
    while ((matchDado = regexDado.exec(texto)) !== null) {
      let melhorValida = matchDado[0];
      let atual = matchDado[0];

      for (
        let i = matchDado.index + matchDado[0].length;
        i < texto.length;
        i++
      ) {
        atual += texto[i];
        try {
          window.JSDice.roll(atual);
          melhorValida = atual;
        } catch (e) {
          const char = texto[i].toLowerCase();
          // Se a letra não fizer parte da sintaxe de dados, interrompe a busca
          if (/[a-z]/.test(char) && !["d", "r", "k", "h", "l"].includes(char)) {
            break;
          }
        }
      }

      // Limpa operadores que ficaram pendurados no final (ex: "1d20 + ")
      let expressaoFinal = melhorValida
        .trim()
        .replace(/[\+\-\*\/\(\)\s\,]+$/, "");
      if (expressaoFinal) {
        expressoes.push(expressaoFinal);
      }

      regexDado.lastIndex = matchDado.index + melhorValida.length;
    }

    return expressoes;
  }

  /**
   * Verifica o chat procurando por comandos de rolagem.ns.
   */
  function analisarMensagensDoChat() {
    // Adicionamos classes `.oIy2qc` que são conhecidas no Meet, além dos data-attributes
    const todosBlocos = Array.from(
      document.querySelectorAll(
        'div[data-message-text], div[jsname="d9k0Re"], div.oIy2qc, div[aria-live="polite"] div',
      ),
    );

    const blocosFolhas = todosBlocos.filter((bloco) => {
      return !todosBlocos.some(
        (outro) => bloco !== outro && bloco.contains(outro),
      );
    });

    blocosFolhas.forEach((bloco) => {
      const conteudoTexto = (bloco.innerText || bloco.textContent || "").trim();

      if (!conteudoTexto) return;

      // Remove as próprias mensagens do bot para evitar loop infinito
      // caso o Google Meet agrupe a resposta do bot no mesmo bloco do jogador
      const textoSemBot = conteudoTexto
        .split("\n")
        .filter(
          (linha) => !linha.includes("🎲") && !linha.includes("[Master Dice]"),
        )
        .join("\n");

      // Extrai todas as rolagens contidas no bloco de texto
      const comandosEncontrados = extrairExpressoesDeDado(textoSemBot);

      if (comandosEncontrados.length === 0) return;

      const qtdProcessada = mensagensProcessadas.get(bloco) || 0;

      // Se há novos comandos neste bloco que ainda não processamos
      if (comandosEncontrados.length > qtdProcessada) {
        for (let i = qtdProcessada; i < comandosEncontrados.length; i++) {
          const expressaoDado = comandosEncontrados[i];
          const textoOriginalDaMensagem = conteudoTexto;
          // Chave combinada para evitar rolagem dupla no mesmo bloco
          const chaveDebounce = `${textoOriginalDaMensagem}_${expressaoDado}_${i}`;
          if (rolagensRecentes.has(chaveDebounce)) {
            console.log(
              "[Master Dice] Rolagem duplicada prevenida por debounce:",
              chaveDebounce,
            );
            continue;
          }

          rolagensRecentes.add(chaveDebounce);
          setTimeout(() => rolagensRecentes.delete(chaveDebounce), 1500);

          console.log("[Master Dice] Processando novo comando:", expressaoDado);

          try {
            const resultados = window.JSDice.roll(expressaoDado);

            if (resultados && resultados.length > 0) {
              const textosRolagens = resultados.map((r) => {
                const detalhes =
                  r.rolls.length > 1 ? ` [${r.rolls.join(", ")}]` : "";
                return `${r.notation}: **${r.total}**${detalhes}`;
              });

              const textoFormatado = `🎲 [Master Dice] ${textosRolagens.join(" | ")}`;
              enviarRespostaChat(textoFormatado);
            }
          } catch (erro) {
            console.warn(
              "[Master Dice] Expressão inválida ignorada:",
              expressaoDado,
              erro,
            );
          }
        }

        // Atualiza a quantidade de comandos processados neste bloco DOM
        mensagensProcessadas.set(bloco, comandosEncontrados.length);
      }
    });
  }

  /**
   * Observa alterações no DOM da página para escutar novas mensagens.
   */
  function iniciarObservadorDeChat() {
    const observador = new MutationObserver(() => {
      analisarMensagensDoChat();
    });

    observador.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log("[Master Dice] Observando o chat.");
  }

  // Inicializa o script quando a página carregar
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarObservadorDeChat);
  } else {
    iniciarObservadorDeChat();
  }
})();

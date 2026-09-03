/**
 * utilitarios-dom.js - Manipulação Segura de DOM Compatível com Trusted Types e CSP
 * 
 * Essencial para funcionamento no Google Meet e outras aplicações do Google Workspace
 * que impõem 'require-trusted-types-for script' em seu Content Security Policy (CSP).
 */

let politicaTrustedTypes = null;

/**
 * Obtém ou inicializa uma política de Trusted Types válida para HTML.
 * Tenta nomes conhecidos e permitidos por políticas de CSP.
 */
function obterPolitica() {
  if (politicaTrustedTypes) return politicaTrustedTypes;

  if (typeof window !== 'undefined' && window.trustedTypes && typeof window.trustedTypes.createPolicy === 'function') {
    const nomesTentativa = ['readyToRollPolicy', 'r2r#html', 'default'];
    for (const nome of nomesTentativa) {
      try {
        politicaTrustedTypes = window.trustedTypes.createPolicy(nome, {
          createHTML: (string) => string
        });
        if (politicaTrustedTypes) break;
      } catch (_) {
        // Se este nome for proibido pelo CSP da página, tenta o próximo
      }
    }
  }
  return politicaTrustedTypes;
}

/**
 * Insere conteúdo HTML em um elemento ou ShadowRoot de forma segura e universal.
 * Se a página exigir Trusted Types (como o Google Meet) e bloquear a criação de políticas,
 * utiliza o DOMParser para instanciar nós do DOM e anexá-los via appendChild,
 * contornando a violação do sink 'innerHTML' de forma 100% segura e limpa.
 * 
 * @param {Element|ShadowRoot} elemento Destino onde o HTML será inserido.
 * @param {string} htmlString Marcação HTML a ser renderizada.
 */
export function definirHTML(elemento, htmlString) {
  if (!elemento) return;

  // 1. Tenta usar a política de Trusted Types se suportada e permitida
  const politica = obterPolitica();
  if (politica) {
    try {
      elemento.innerHTML = politica.createHTML(htmlString);
      return;
    } catch (_) {}
  }

  // 2. Fallback universal imune a Trusted Types (DOMParser + appendChild):
  // DOMParser não é um injection sink de Trusted Types e appendChild de nós existentes
  // não aciona nenhuma restrição de CSP ou TrustedHTML.
  try {
    while (elemento.firstChild) {
      elemento.removeChild(elemento.firstChild);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Transfere nós do <head> (ex: tags <style>)
    if (doc.head) {
      while (doc.head.firstChild) {
        elemento.appendChild(doc.head.firstChild);
      }
    }

    // Transfere nós do <body>
    if (doc.body) {
      while (doc.body.firstChild) {
        elemento.appendChild(doc.body.firstChild);
      }
    }
    return;
  } catch (erroParser) {
    console.warn('[ReadyToRoll] Erro no fallback DOMParser:', erroParser);
  }

  // 3. Último recurso para páginas comuns sem restrição de Trusted Types
  try {
    elemento.innerHTML = htmlString;
  } catch (erroFinal) {
    console.error('[ReadyToRoll] Falha ao renderizar HTML no elemento:', erroFinal);
  }
}

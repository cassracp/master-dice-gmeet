/**
 * service-worker.js - Background Service Worker do Ready2Roll (Manifest V3)
 *
 * Gerencia cliques no ícone, injeção nas abas e abertura de janelas pop-up desacopladas.
 */

async function abrirJanelaIndependente(codigoSala = "", nomeSala = "") {
  const query = codigoSala
    ? `?sala=${encodeURIComponent(codigoSala)}&nomeSala=${encodeURIComponent(nomeSala || "")}`
    : "";
  const url = chrome.runtime.getURL(`standalone/index.html${query}`);
  try {
    await chrome.windows.create({
      url,
      type: "popup",
      width: 440,
      height: 680,
    });
  } catch (erro) {
    // Fallback caso criação de popup seja bloqueada
    chrome.tabs.create({ url });
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) {
    await abrirJanelaIndependente();
    return;
  }

  // Verifica se a página atual é interna ou restrita para injeção de script
  const url = tab.url || "";
  const ehRestrito =
    !url ||
    url.startsWith("chrome://") ||
    url.startsWith("edge://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("view-source:") ||
    url.startsWith("about:") ||
    url.includes("chromewebstore.google.com");

  if (ehRestrito) {
    await abrirJanelaIndependente();
    return;
  }

  try {
    // 1. Se o content script já estiver carregado na aba, envia mensagem para alternar
    await chrome.tabs.sendMessage(tab.id, { tipo: "alternar_vtt" });
  } catch (erroMensagem) {
    // 2. Se não respondeu, injeta o script e executa a alternância imediatamente
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content/injetor.js"],
      });

      // Executa alternarVTT diretamente no contexto da aba injetada
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (
            window.ReadyToRollInjetor &&
            typeof window.ReadyToRollInjetor.alternarVTT === "function"
          ) {
            window.ReadyToRollInjetor.alternarVTT();
          }
        },
      });
    } catch (erroInjecao) {
      console.warn(
        "[Ready2Roll SW] Injeção restrita nesta página. Abrindo como pop-up:",
        erroInjecao,
      );
      await abrirJanelaIndependente();
    }
  }
});

// Mensagens internas da extensão (ex: botão de desacoplar)
chrome.runtime.onMessage.addListener((mensagem, sender, sendResponse) => {
  if (mensagem.tipo === "abrir_popup_desacoplado") {
    abrirJanelaIndependente(mensagem.codigoSala, mensagem.nomeSala);
    sendResponse({ sucesso: true });
  }
});

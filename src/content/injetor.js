/**
 * injetor.js - Content Script para Injeção do VTT em Qualquer Página
 * 
 * Cria o elemento raiz no DOM e monta a JanelaVTT isolada em Shadow DOM.
 */

import { JanelaVTT } from '../ui/janela-vtt.js';
import cssTexto from '../ui/estilos-vtt.css?inline';

let elementoRaiz = null;
let instanciaVTT = null;

export function alternarVTT() {
  elementoRaiz = document.getElementById('r2r-vtt-root');
  if (elementoRaiz) {
    if (instanciaVTT && typeof instanciaVTT.fechar === 'function') {
      instanciaVTT.fechar();
    } else {
      elementoRaiz.remove();
    }
    elementoRaiz = null;
    instanciaVTT = null;
    return false;
  }

  elementoRaiz = document.createElement('div');
  elementoRaiz.id = 'r2r-vtt-root';
  // Garante sobreposição absoluta sobre as camadas e vídeos do Google Meet
  elementoRaiz.style.position = 'fixed';
  elementoRaiz.style.top = '0';
  elementoRaiz.style.left = '0';
  elementoRaiz.style.width = '0';
  elementoRaiz.style.height = '0';
  elementoRaiz.style.zIndex = '2147483647';
  elementoRaiz.style.pointerEvents = 'none';

  const destino = document.body || document.documentElement;
  destino.appendChild(elementoRaiz);

  instanciaVTT = new JanelaVTT(elementoRaiz);
  instanciaVTT.inicializar(cssTexto);
  return true;
}

// Expõe globalmente no contexto isolado para disparo direto via chrome.scripting.executeScript
if (typeof window !== 'undefined') {
  window.ReadyToRollInjetor = { alternarVTT };
}

// Escuta comandos vindos do Service Worker da extensão
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((mensagem, sender, sendResponse) => {
    if (mensagem.tipo === 'alternar_vtt') {
      const aberto = alternarVTT();
      sendResponse({ aberto });
    }
  });
}

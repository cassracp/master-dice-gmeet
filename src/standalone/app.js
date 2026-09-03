/**
 * app.js - Inicializador do ReadyToRoll em modo Janela Independente (Pop-up) / Web Companion
 */

import { JanelaVTT } from '../ui/janela-vtt.js';
import cssTexto from '../ui/estilos-vtt.css?inline';

// Regras adicionais de CSS para ocupar 100% da janela pop-up
const cssModoPopUp = `
  ${cssTexto}
  .r2r-painel-vtt {
    position: static !important;
    width: 100% !important;
    max-width: 100% !important;
    height: 100vh !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
    border: none !important;
  }
`;

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('r2r-standalone-app');
  if (container) {
    const vtt = new JanelaVTT(container, { ehModoPopUp: true });
    vtt.inicializar(cssModoPopUp);
  }
});

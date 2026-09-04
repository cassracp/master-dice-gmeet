/**
 * app-web.js - Inicializador do Ready2Roll (R2R) na Web (PWA / Vercel / Celular)
 */

import { JanelaVTT } from "../ui/janela-vtt.js";
import cssTexto from "../ui/estilos-vtt.css?inline";

// Regras de estilo para ocupar a tela cheia no modo Web App / Smartphone
const cssModoWeb = `
  ${cssTexto}
  .r2r-painel-vtt {
    position: static !important;
    width: 100% !important;
    max-width: 100% !important;
    height: 100% !important;
    max-height: 100% !important;
    border-radius: 0 !important;
    border: none !important;
  }
`;

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("r2r-web-app");
  if (container) {
    const vtt = new JanelaVTT(container, { ehModoPopUp: true });
    vtt.inicializar(cssModoWeb);
  }
});

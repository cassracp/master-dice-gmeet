/**
 * gerador-qrcode.js - Renderizador de QR Code Client-side em SVG
 *
 * Gera QR Codes instantâneos em SVG vetorial limpo sem nenhuma chamada de rede externa,
 * garantindo total privacidade, zero latência e funcionamento offline.
 */

import QRCode from "qrcode";

/**
 * Gera o conteúdo de string SVG de um QR Code para a URL fornecida.
 * @param {string} textoUrl
 * @param {object} [opcoes]
 * @returns {Promise<string>} String SVG pronta para injeção no DOM
 */
export async function gerarQrCodeSvg(textoUrl, opcoes = {}) {
  const configuracao = {
    type: "svg",
    margin: opcoes.margem ?? 1,
    color: {
      dark: opcoes.corEscura ?? "#f8fafc",
      light: opcoes.corClara ?? "#00000000", // Fundo transparente
    },
    errorCorrectionLevel: "M",
    width: opcoes.largura ?? 220,
  };

  try {
    return await QRCode.toString(textoUrl, configuracao);
  } catch (erro) {
    console.error("[Ready2Roll] Erro ao gerar QR Code SVG:", erro);
    throw erro;
  }
}

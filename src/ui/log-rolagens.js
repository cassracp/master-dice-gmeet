/**
 * log-rolagens.js - Feed em Tempo Real de Rolagens com Destaques Críticos
 */

import { definirHTML } from './utilitarios-dom.js';

export class ComponenteLogRolagens {
  /**
   * @param {HTMLElement} elementoPai 
   */
  constructor(elementoPai) {
    this.elementoPai = elementoPai;
    this.rolagens = [];
    this.renderizarContainer();
  }

  renderizarContainer() {
    definirHTML(this.elementoPai, `
      <div class="r2r-historico-rolagens">
        <div class="r2r-mensagem-vazia" style="text-align: center; color: var(--r2r-texto-mutado); padding: 30px 10px; font-size: 13px;">
          <span>🎲 Nenhuma rolagem nesta sessão ainda.</span><br/>
          <span style="font-size: 11px;">Role um dado acima ou use a barra de comandos!</span>
        </div>
      </div>
    `);
    this.containerLista = this.elementoPai.querySelector('.r2r-historico-rolagens');
  }

  /**
   * Adiciona uma rolagem ao feed.
   * @param {object} pacoteRolagem 
   */
  adicionarRolagem(pacoteRolagem) {
    if (!pacoteRolagem || !pacoteRolagem.id) return;

    // Evita duplicatas visuais no feed
    if (this.containerLista.querySelector(`[data-id="${pacoteRolagem.id}"]`)) {
      return;
    }

    // Remove mensagem vazia se for a primeira
    const msgVazia = this.containerLista.querySelector('.r2r-mensagem-vazia');
    if (msgVazia) {
      msgVazia.remove();
    }

    const { autor, visibilidade, dados, timestamp } = pacoteRolagem;
    const hora = new Date(timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let classeCritico = '';
    let badgeCritico = '';

    if (dados.temCriticoSucesso) {
      classeCritico = 'critico-sucesso';
      badgeCritico = '<span style="color: var(--r2r-ouro-critico); font-weight: 800; font-size: 10px;">★ CRÍTICO!</span>';
    } else if (dados.temCriticoFalha) {
      classeCritico = 'critico-falha';
      badgeCritico = '<span style="color: var(--r2r-vermelho-falha); font-weight: 800; font-size: 10px;">⚠ FALHA!</span>';
    }

    const card = document.createElement('div');
    card.className = `r2r-card-rolagem ${classeCritico}`;
    card.setAttribute('data-id', pacoteRolagem.id);

    definirHTML(card, `
      <div class="r2r-rolagem-topo">
        <span class="r2r-rolagem-autor">
          <span>${autor}</span>
          ${badgeCritico}
        </span>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="r2r-badge-visibilidade ${visibilidade}">${visibilidade}</span>
          <span style="font-size: 10px; opacity: 0.7;">${hora}</span>
        </div>
      </div>

      <div class="r2r-rolagem-corpo">
        <div class="r2r-rolagem-detalhe">
          ${dados.rotulo ? `<div class="r2r-rolagem-rotulo">${dados.rotulo}</div>` : ''}
          <div style="font-size: 12px; color: #cbd5e1; font-family: monospace;">
            ${dados.detalheDadosTexto || dados.comandoOriginal}
          </div>
        </div>
        <div class="r2r-rolagem-total">
          ${dados.total}
        </div>
      </div>
    `);

    this.containerLista.appendChild(card);

    // Scroll suave até a última rolagem
    this.containerLista.scrollTop = this.containerLista.scrollHeight;
  }

  limpar() {
    this.renderizarContainer();
  }
}

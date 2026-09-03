/**
 * grade-dados.js - Componente dos Botões Rápidos de Dados e Modificadores
 * 
 * Permite clicar em d4, d6, d8, d10, d12, d20 e d100 com seletores de quantidade e bônus.
 */

import { definirHTML } from './utilitarios-dom.js';

const DADOS_DISPONIVEIS = [4, 6, 8, 10, 12, 20, 100];

export class ComponenteGradeDados {
  /**
   * @param {HTMLElement} elementoPai 
   * @param {(comando: string) => void} aoRolarDado 
   */
  constructor(elementoPai, aoRolarDado) {
    this.elementoPai = elementoPai;
    this.aoRolarDado = aoRolarDado;
    this.quantidade = 1;
    this.modificador = 0;

    this.renderizar();
  }

  renderizar() {
    definirHTML(this.elementoPai, `
      <div class="r2r-linha-grade-dados">
        ${DADOS_DISPONIVEIS.map(lados => `
          <button class="r2r-btn-dado" data-lados="${lados}" title="Rolar d${lados}">
            <span>🎲</span>
            <span>d${lados}</span>
          </button>
        `).join('')}
      </div>

      <div class="r2r-linha-modificadores">
        <div class="r2r-grupo-qtd">
          <label style="color: var(--r2r-texto-secundario); font-size: 11px;">Qtd:</label>
          <input type="number" class="r2r-input-numero r2r-input-qtd" min="1" max="50" value="${this.quantidade}" />
        </div>

        <div class="r2r-grupo-qtd">
          <label style="color: var(--r2r-texto-secundario); font-size: 11px;">Bônus (+/-):</label>
          <input type="number" class="r2r-input-numero r2r-input-mod" value="${this.modificador}" />
        </div>

        <button class="r2r-btn-visibilidade r2r-btn-zerar" style="background: rgba(255,255,255,0.06); padding: 3px 8px;" title="Resetar modificadores">
          Zerar
        </button>
      </div>
    `);

    const inputQtd = this.elementoPai.querySelector('.r2r-input-qtd');
    const inputMod = this.elementoPai.querySelector('.r2r-input-mod');
    const btnZerar = this.elementoPai.querySelector('.r2r-btn-zerar');

    inputQtd.addEventListener('change', (e) => {
      this.quantidade = Math.max(1, parseInt(e.target.value, 10) || 1);
      inputQtd.value = this.quantidade;
    });

    inputMod.addEventListener('change', (e) => {
      this.modificador = parseInt(e.target.value, 10) || 0;
      inputMod.value = this.modificador;
    });

    btnZerar.addEventListener('click', () => {
      this.quantidade = 1;
      this.modificador = 0;
      inputQtd.value = 1;
      inputMod.value = 0;
    });

    // Eventos de clique nos dados
    this.elementoPai.querySelectorAll('.r2r-btn-dado').forEach(btn => {
      btn.addEventListener('click', () => {
        const lados = parseInt(btn.getAttribute('data-lados'), 10);
        let comando = `${this.quantidade}d${lados}`;
        
        if (this.modificador > 0) {
          comando += `+${this.modificador}`;
        } else if (this.modificador < 0) {
          comando += `${this.modificador}`;
        }

        this.aoRolarDado(comando);
      });
    });
  }
}

/**
 * grade-dados.js - Componente dos Botões Rápidos de Dados e Modificadores
 * 
 * Teclado estilo calculadora de RPG com ícones vetoriais claros (d4 a d100),
 * e seletores ergonômicos táteis de Quantidade e Bônus (+/-) otimizados para touch em smartphones.
 */

import { definirHTML } from './utilitarios-dom.js';
import { obterIconeDado } from './icones-dados.js';

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
      <!-- Seção de Modificadores Táteis (Touch-Friendly para Celular) -->
      <div class="r2r-painel-modificadores-touch">
        <!-- Stepper Quantidade -->
        <div class="r2r-grupo-stepper">
          <span class="r2r-stepper-etiqueta">Qtd</span>
          <div class="r2r-stepper-controle">
            <button type="button" class="r2r-btn-stepper r2r-btn-qtd-menos" aria-label="Diminuir quantidade">
              <span>−</span>
            </button>
            <input type="number" class="r2r-input-stepper r2r-input-qtd" min="1" max="50" value="${this.quantidade}" />
            <button type="button" class="r2r-btn-stepper r2r-btn-qtd-mais" aria-label="Aumentar quantidade">
              <span>+</span>
            </button>
          </div>
        </div>

        <!-- Stepper Bônus (+ / -) -->
        <div class="r2r-grupo-stepper">
          <span class="r2r-stepper-etiqueta">Bônus</span>
          <div class="r2r-stepper-controle">
            <button type="button" class="r2r-btn-stepper r2r-btn-mod-menos" aria-label="Diminuir bônus">
              <span>−</span>
            </button>
            <input type="number" class="r2r-input-stepper r2r-input-mod" value="${this.modificador}" />
            <button type="button" class="r2r-btn-stepper r2r-btn-mod-mais" aria-label="Aumentar bônus">
              <span>+</span>
            </button>
          </div>
        </div>

        <!-- Botão Rápido de Zerar -->
        <button type="button" class="r2r-btn-zerar-touch" title="Redefinir quantidade para 1 e bônus para 0">
          <span class="r2r-icone-zerar">↺</span>
          <span class="r2r-texto-zerar">Zerar</span>
        </button>
      </div>

      <!-- Teclado de Dados Estilo Calculadora (RPG Keypad) -->
      <div class="r2r-teclado-calculadora-dados">
        ${DADOS_DISPONIVEIS.map(lados => `
          <button type="button" class="r2r-tecla-dado r2r-dado-${lados}" data-lados="${lados}" aria-label="Rolar d${lados}">
            <div class="r2r-icone-vetorial-dado">
              ${obterIconeDado(lados)}
            </div>
            <span class="r2r-legenda-dado">d${lados}</span>
          </button>
        `).join('')}
      </div>
    `);

    this.vincularEventos();
  }

  vincularEventos() {
    const inputQtd = this.elementoPai.querySelector('.r2r-input-qtd');
    const inputMod = this.elementoPai.querySelector('.r2r-input-mod');
    const btnQtdMenos = this.elementoPai.querySelector('.r2r-btn-qtd-menos');
    const btnQtdMais = this.elementoPai.querySelector('.r2r-btn-qtd-mais');
    const btnModMenos = this.elementoPai.querySelector('.r2r-btn-mod-menos');
    const btnModMais = this.elementoPai.querySelector('.r2r-btn-mod-mais');
    const btnZerar = this.elementoPai.querySelector('.r2r-btn-zerar-touch');

    const atualizarDisplay = () => {
      if (inputQtd) inputQtd.value = this.quantidade;
      if (inputMod) inputMod.value = this.modificador;
    };

    // Stepper Quantidade
    btnQtdMenos.addEventListener('click', () => {
      this.quantidade = Math.max(1, this.quantidade - 1);
      atualizarDisplay();
    });

    btnQtdMais.addEventListener('click', () => {
      this.quantidade = Math.min(50, this.quantidade + 1);
      atualizarDisplay();
    });

    inputQtd.addEventListener('change', (e) => {
      const valor = parseInt(e.target.value, 10) || 1;
      this.quantidade = Math.max(1, Math.min(50, valor));
      atualizarDisplay();
    });

    // Stepper Bônus
    btnModMenos.addEventListener('click', () => {
      this.modificador -= 1;
      atualizarDisplay();
    });

    btnModMais.addEventListener('click', () => {
      this.modificador += 1;
      atualizarDisplay();
    });

    inputMod.addEventListener('change', (e) => {
      this.modificador = parseInt(e.target.value, 10) || 0;
      atualizarDisplay();
    });

    // Botão Zerar
    btnZerar.addEventListener('click', () => {
      this.quantidade = 1;
      this.modificador = 0;
      atualizarDisplay();
    });

    // Eventos de clique nos botões do teclado de dados
    this.elementoPai.querySelectorAll('.r2r-tecla-dado').forEach(btn => {
      btn.addEventListener('click', () => {
        const lados = parseInt(btn.getAttribute('data-lados'), 10);
        let comando = `${this.quantidade}d${lados}`;
        
        if (this.modificador > 0) {
          comando += `+${this.modificador}`;
        } else if (this.modificador < 0) {
          comando += `${this.modificador}`;
        }

        // Animação visual de pressionamento (efeito tátil)
        btn.classList.add('r2r-tecla-pressionada');
        setTimeout(() => btn.classList.remove('r2r-tecla-pressionada'), 160);

        this.aoRolarDado(comando);
      });
    });
  }
}

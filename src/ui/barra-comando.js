/**
 * barra-comando.js - Linha de Comando de Rolagem com Histórico (Setas Cima/Baixo)
 */

import { definirHTML, obterUrlRecurso } from './utilitarios-dom.js';

export class ComponenteBarraComando {
  /**
   * @param {HTMLElement} elementoPai 
   * @param {(comando: string) => void} aoExecutarComando 
   */
  constructor(elementoPai, aoExecutarComando) {
    this.elementoPai = elementoPai;
    this.aoExecutarComando = aoExecutarComando;
    this.historicoComandos = [];
    this.indiceHistorico = -1;

    this.renderizar();
  }

  renderizar() {
    definirHTML(this.elementoPai, `
      <form class="r2r-barra-comando">
        <input 
          type="text" 
          class="r2r-input-comando" 
          placeholder="Digite: 1d20+5, 4d6kh3 ou 1d8+3 # Espada" 
          autocomplete="off" 
          spellcheck="false" 
        />
        <button type="submit" class="r2r-btn-enviar" title="Rolar (Enter)">
          <span>Rolar</span>
          <span style="display: flex; align-items: center;"><img src="${obterUrlRecurso('assets/icons/000000/transparent/1x1/lorc/cubes.svg')}" alt="Rolar" style="width:16px;height:16px;filter:invert(1);" onerror="if(!this.dataset.tentou){this.dataset.tentou='1';this.src=this.src.includes('/src/')?'./assets/icons/000000/transparent/1x1/lorc/cubes.svg':'/src/assets/icons/000000/transparent/1x1/lorc/cubes.svg';}"></span>
        </button>
      </form>
    `);

    const form = this.elementoPai.querySelector('form');
    const input = this.elementoPai.querySelector('.r2r-input-comando');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const comando = input.value.trim();
      if (!comando) return;

      this.adicionarHistorico(comando);
      this.aoExecutarComando(comando);
      input.value = '';
      this.indiceHistorico = -1;
    });

    // Navegação no histórico com setas Cima / Baixo
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        if (this.historicoComandos.length > 0) {
          e.preventDefault();
          if (this.indiceHistorico < this.historicoComandos.length - 1) {
            this.indiceHistorico++;
          }
          input.value = this.historicoComandos[this.historicoComandos.length - 1 - this.indiceHistorico];
        }
      } else if (e.key === 'ArrowDown') {
        if (this.indiceHistorico > 0) {
          e.preventDefault();
          this.indiceHistorico--;
          input.value = this.historicoComandos[this.historicoComandos.length - 1 - this.indiceHistorico];
        } else if (this.indiceHistorico === 0) {
          e.preventDefault();
          this.indiceHistorico = -1;
          input.value = '';
        }
      }
    });
  }

  adicionarHistorico(comando) {
    if (this.historicoComandos[this.historicoComandos.length - 1] !== comando) {
      this.historicoComandos.push(comando);
      if (this.historicoComandos.length > 50) {
        this.historicoComandos.shift();
      }
    }
  }

  focar() {
    const input = this.elementoPai.querySelector('.r2r-input-comando');
    if (input) input.focus();
  }
}

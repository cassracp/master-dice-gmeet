/**
 * seletor-visibilidade.js - Controle de Visibilidade de Rolagem (Pública, Direcionada, Privada)
 */

import { definirHTML } from './utilitarios-dom.js';

export class ComponenteSeletorVisibilidade {
  /**
   * @param {HTMLElement} elementoPai 
   * @param {() => Array<{id: string, nome: string, ehVoce: boolean}>} obterParticipantes 
   */
  constructor(elementoPai, obterParticipantes) {
    this.elementoPai = elementoPai;
    this.obterParticipantes = obterParticipantes;
    this.visibilidadeAtual = 'publica'; // 'publica' | 'direcionada' | 'privada'
    this.destinatariosSelecionados = new Set();

    this.renderizar();
  }

  renderizar() {
    definirHTML(this.elementoPai, `
      <div class="r2r-linha-visibilidade">
        <span style="font-size: 11px; color: var(--r2r-texto-secundario); font-weight: 600;">Visibilidade:</span>
        <div class="r2r-botoes-visibilidade">
          <button class="r2r-btn-visibilidade ${this.visibilidadeAtual === 'publica' ? 'ativo' : ''}" data-tipo="publica" title="Todos na sala verão o resultado">
            Pública
          </button>
          <button class="r2r-btn-visibilidade ${this.visibilidadeAtual === 'direcionada' ? 'ativo' : ''}" data-tipo="direcionada" title="Apenas jogadores selecionados verão">
            Direcionada
          </button>
          <button class="r2r-btn-visibilidade ${this.visibilidadeAtual === 'privada' ? 'ativo' : ''}" data-tipo="privada" title="Apenas você verá o resultado">
            Privada
          </button>
        </div>
      </div>

      <div class="r2r-painel-destinatarios" style="display: ${this.visibilidadeAtual === 'direcionada' ? 'flex' : 'none'};">
        <span style="font-weight: 700; color: #22d3ee; font-size: 11px;">Enviar apenas para:</span>
        <div class="r2r-lista-destinatarios-checks" style="display: flex; flex-direction: column; gap: 4px; max-height: 80px; overflow-y: auto;">
          <!-- Injetado dinamicamente -->
        </div>
      </div>
    `);

    // Alternar abas de visibilidade
    this.elementoPai.querySelectorAll('.r2r-btn-visibilidade').forEach(btn => {
      btn.addEventListener('click', () => {
        const tipo = btn.getAttribute('data-tipo');
        this.definirVisibilidade(tipo);
      });
    });

    this.atualizarListaDestinatarios();
  }

  definirVisibilidade(tipo) {
    this.visibilidadeAtual = tipo;
    this.elementoPai.querySelectorAll('.r2r-btn-visibilidade').forEach(b => {
      b.classList.toggle('ativo', b.getAttribute('data-tipo') === tipo);
    });

    const painelDestinatarios = this.elementoPai.querySelector('.r2r-painel-destinatarios');
    if (painelDestinatarios) {
      painelDestinatarios.style.display = tipo === 'direcionada' ? 'flex' : 'none';
    }
    if (tipo === 'direcionada') {
      this.atualizarListaDestinatarios();
    }
  }

  atualizarListaDestinatarios() {
    const listaContainer = this.elementoPai.querySelector('.r2r-lista-destinatarios-checks');
    if (!listaContainer) return;

    const participantes = this.obterParticipantes().filter(p => !p.ehVoce);

    if (participantes.length === 0) {
      definirHTML(listaContainer, `
        <span style="color: var(--r2r-texto-mutado); font-size: 11px; font-style: italic;">
          Nenhum outro participante conectado na sala.
        </span>
      `);
      return;
    }

    definirHTML(listaContainer, participantes.map(p => `
      <label class="r2r-destinatario-item">
        <input type="checkbox" value="${p.id}" ${this.destinatariosSelecionados.has(p.id) ? 'checked' : ''} />
        <span>${p.nome}</span>
      </label>
    `).join(''));

    listaContainer.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.value;
        if (e.target.checked) {
          this.destinatariosSelecionados.add(id);
        } else {
          this.destinatariosSelecionados.delete(id);
        }
      });
    });
  }

  obterConfiguracaoVisibilidade() {
    return {
      visibilidade: this.visibilidadeAtual,
      destinatarios: Array.from(this.destinatariosSelecionados)
    };
  }
}

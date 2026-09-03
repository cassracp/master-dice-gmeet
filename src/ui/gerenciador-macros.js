/**
 * gerenciador-macros.js - Gerenciador de Botões e Atalhos Personalizados (Macros)
 * 
 * Fornece interface compacta em Listbox com ações dedicadas para rolar,
 * editar, excluir e criar novos atalhos de rolagem de dados.
 */

import { obterMacros, salvarMacros } from '../core/armazenamento.js';
import { definirHTML } from './utilitarios-dom.js';

function escaparHTML(texto) {
  if (!texto) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class ComponenteGerenciadorMacros {
  /**
   * @param {HTMLElement} elementoPai 
   * @param {(comando: string) => void} aoRolarMacro 
   */
  constructor(elementoPai, aoRolarMacro) {
    this.elementoPai = elementoPai;
    this.aoRolarMacro = aoRolarMacro;
    this.macros = [];
    this.macroSelecionadaId = null;

    this.carregarMacros();
  }

  /**
   * Carrega as macros salvas no armazenamento.
   */
  async carregarMacros() {
    this.macros = await obterMacros();
    if (this.macros.length > 0 && !this.macroSelecionadaId) {
      this.macroSelecionadaId = this.macros[0].id;
    }
    this.renderizar();
  }

  /**
   * Renderiza o Listbox de macros e os botões de ação.
   */
  renderizar() {
    const temMacros = this.macros.length > 0;

    // Se o ID selecionado não existir mais, seleciona o primeiro item disponível
    if (temMacros && (!this.macroSelecionadaId || !this.macros.some(m => m.id === this.macroSelecionadaId))) {
      this.macroSelecionadaId = this.macros[0].id;
    } else if (!temMacros) {
      this.macroSelecionadaId = null;
    }

    const temSelecao = Boolean(this.macroSelecionadaId);

    definirHTML(this.elementoPai, `
      <div class="r2r-linha-macros">
        <div class="r2r-seletor-macro-wrap">
          <select class="r2r-select-macro" id="r2rSelectMacro" aria-label="Selecione uma macro de rolagem">
            ${!temMacros ? `
              <option value="" disabled selected>Nenhuma macro cadastrada</option>
            ` : this.macros.map(m => `
              <option value="${escaparHTML(m.id)}" ${m.id === this.macroSelecionadaId ? 'selected' : ''}>
                ${escaparHTML(m.nome)} (${escaparHTML(m.comando)})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="r2r-acoes-macros">
          <button class="r2r-btn-macro-acao r2r-btn-rolar-macro" id="r2rBtnRolarMacro" title="Rolar macro selecionada" ${!temSelecao ? 'disabled' : ''}>
            <span>🎲</span>
          </button>
          <button class="r2r-btn-macro-acao r2r-btn-editar-macro" id="r2rBtnEditarMacro" title="Editar macro selecionada" ${!temSelecao ? 'disabled' : ''}>
            <span>✏️</span>
          </button>
          <button class="r2r-btn-macro-acao r2r-btn-excluir-macro" id="r2rBtnExcluirMacro" title="Excluir macro selecionada" ${!temSelecao ? 'disabled' : ''}>
            <span>🗑️</span>
          </button>
          <button class="r2r-btn-macro-acao r2r-btn-novo-macro" id="r2rBtnNovoMacro" title="Criar nova macro">
            <span>➕</span>
          </button>
        </div>
      </div>
      <div class="r2r-container-modal-macro" style="display: none;"></div>
    `);

    // Vincular alteração do select
    const select = this.elementoPai.querySelector('#r2rSelectMacro');
    if (select) {
      select.addEventListener('change', (e) => {
        this.macroSelecionadaId = e.target.value;
        this.atualizarEstadoBotoes();
      });
    }

    // Ação: Rolar Macro
    const btnRolar = this.elementoPai.querySelector('#r2rBtnRolarMacro');
    if (btnRolar) {
      btnRolar.addEventListener('click', () => {
        const macro = this.macros.find(m => m.id === this.macroSelecionadaId);
        if (macro && this.aoRolarMacro) {
          this.aoRolarMacro(macro.comando);
        }
      });
    }

    // Ação: Editar Macro
    const btnEditar = this.elementoPai.querySelector('#r2rBtnEditarMacro');
    if (btnEditar) {
      btnEditar.addEventListener('click', () => {
        const macro = this.macros.find(m => m.id === this.macroSelecionadaId);
        if (macro) {
          this.abrirModalMacro(macro);
        }
      });
    }

    // Ação: Excluir Macro
    const btnExcluir = this.elementoPai.querySelector('#r2rBtnExcluirMacro');
    if (btnExcluir) {
      btnExcluir.addEventListener('click', async () => {
        const macro = this.macros.find(m => m.id === this.macroSelecionadaId);
        if (!macro) return;

        const confirmar = confirm(`Deseja realmente excluir a macro "${macro.nome}"?`);
        if (!confirmar) return;

        this.macros = this.macros.filter(m => m.id !== macro.id);
        this.macroSelecionadaId = this.macros.length > 0 ? this.macros[0].id : null;
        await salvarMacros(this.macros);
        this.renderizar();
      });
    }

    // Ação: Criar Nova Macro
    const btnNovo = this.elementoPai.querySelector('#r2rBtnNovoMacro');
    if (btnNovo) {
      btnNovo.addEventListener('click', () => {
        this.abrirModalMacro(null);
      });
    }
  }

  /**
   * Atualiza o estado de ativação dos botões sem necessidade de re-renderizar todo o DOM.
   */
  atualizarEstadoBotoes() {
    const temSelecao = Boolean(this.macroSelecionadaId && this.macros.some(m => m.id === this.macroSelecionadaId));
    const btnRolar = this.elementoPai.querySelector('#r2rBtnRolarMacro');
    const btnEditar = this.elementoPai.querySelector('#r2rBtnEditarMacro');
    const btnExcluir = this.elementoPai.querySelector('#r2rBtnExcluirMacro');

    if (btnRolar) btnRolar.disabled = !temSelecao;
    if (btnEditar) btnEditar.disabled = !temSelecao;
    if (btnExcluir) btnExcluir.disabled = !temSelecao;
  }

  /**
   * Abre o modal unificado para criação ou edição de macros.
   * @param {{id: string, nome: string, comando: string}|null} macroParaEditar
   */
  abrirModalMacro(macroParaEditar = null) {
    const modalContainer = this.elementoPai.querySelector('.r2r-container-modal-macro');
    if (!modalContainer) return;

    const ehEdicao = Boolean(macroParaEditar);
    const titulo = ehEdicao ? 'Editar Macro de Rolagem' : 'Nova Macro de Rolagem';
    const valorNome = ehEdicao ? macroParaEditar.nome : '';
    const valorComando = ehEdicao ? macroParaEditar.comando : '';

    modalContainer.style.display = 'block';

    definirHTML(modalContainer, `
      <div class="r2r-modal-backdrop">
        <div class="r2r-modal-conteudo">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; font-size: 14px; color: #f8fafc;">${titulo}</span>
            <button class="r2r-btn-icone r2r-btn-fechar-modal" style="font-size: 16px;">✕</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 11px; color: var(--r2r-texto-secundario);">Nome do Atalho:</label>
            <input type="text" class="r2r-input-comando r2r-input-nome-macro" placeholder="Ex: Iniciativa, Furtividade" value="${escaparHTML(valorNome)}" />
          </div>

          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 11px; color: var(--r2r-texto-secundario);">Comando de Rolagem:</label>
            <input type="text" class="r2r-input-comando r2r-input-cmd-macro" placeholder="Ex: 1d20+3 # Iniciativa" value="${escaparHTML(valorComando)}" />
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
            <button class="r2r-btn-visibilidade r2r-btn-cancelar-modal" style="padding: 6px 12px;">Cancelar</button>
            <button class="r2r-btn-enviar r2r-btn-salvar-macro" style="padding: 6px 14px;">Salvar</button>
          </div>
        </div>
      </div>
    `);

    const fechar = () => {
      modalContainer.style.display = 'none';
      modalContainer.replaceChildren();
    };

    const inputNome = modalContainer.querySelector('.r2r-input-nome-macro');
    const inputComando = modalContainer.querySelector('.r2r-input-cmd-macro');

    modalContainer.querySelector('.r2r-btn-fechar-modal').addEventListener('click', fechar);
    modalContainer.querySelector('.r2r-btn-cancelar-modal').addEventListener('click', fechar);

    const salvarAcao = async () => {
      const nome = inputNome.value.trim();
      const comando = inputComando.value.trim();

      if (!nome || !comando) {
        alert('Por favor, informe tanto o nome quanto o comando da macro.');
        return;
      }

      if (ehEdicao) {
        macroParaEditar.nome = nome;
        macroParaEditar.comando = comando;
        this.macroSelecionadaId = macroParaEditar.id;
      } else {
        const novaMacro = {
          id: `macro-${Date.now()}`,
          nome,
          comando
        };
        this.macros.push(novaMacro);
        this.macroSelecionadaId = novaMacro.id;
      }

      await salvarMacros(this.macros);
      fechar();
      this.renderizar();
    };

    modalContainer.querySelector('.r2r-btn-salvar-macro').addEventListener('click', salvarAcao);

    // Permite salvar com Enter nos inputs
    const aoPressionarEnter = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        salvarAcao();
      }
    };
    inputNome.addEventListener('keydown', aoPressionarEnter);
    inputComando.addEventListener('keydown', aoPressionarEnter);

    // Foca automaticamente no primeiro campo
    setTimeout(() => {
      if (inputNome) inputNome.focus();
    }, 50);
  }
}

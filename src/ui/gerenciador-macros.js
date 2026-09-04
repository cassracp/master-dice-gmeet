/**
 * gerenciador-macros.js - Gerenciador de Botões e Atalhos Personalizados (Macros)
 * 
 * Fornece interface com lista de botões grandes para rolar e editar macros.
 */

import { obterMacros, salvarMacros } from '../core/armazenamento.js';
import { definirHTML } from './utilitarios-dom.js';
import { createIcons, Pencil, Plus, Trash2 } from 'lucide';

function escaparHTML(texto) {
  if (!texto) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const iconeCubes = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width="24" height="24"><path d="M388.53 21.53c-38.006 30.546-63.492 66.122-83.952 103.687a508.13 508.13 0 0 0 38.516 21.38l88.744 34.04a512.855 512.855 0 0 0 41.51 9.625c13.493-42.908 19.872-85.824 19.433-128.73l-104.25-40zm-266.813 3.88 15.133 64.967 68.95 16.38-12.993-64.525-71.09-16.822zm-17.594 6.848L66.896 79.803l12.358 62.025 39.494-46.785-14.625-62.785zm27.783 76.148-37.094 43.97 52.165 7.718a738.183 738.183 0 0 1 21.716-5.967l27.62-30.408-64.407-15.314zm170.57 37.346 8.776 58.912c5.91 6.06 11.636 12.256 17.13 18.615l89.024 34.157 45.317-50.218c-54.72-11.1-108.31-30.82-160.248-61.468zm-70.09 13.482c-49.324 9.35-98.335 21.9-147.224 42.645 40.825 34.878 76.848 72.364 105.988 113.538l149.204-44.686c-26.533-41.862-66.002-77.02-107.97-111.498zM65.71 209.848C45.093 260.13 28.07 311.115 24.24 367.025c24.535 52.892 70.202 90.623 110.764 119.72l42.476-158.45c-29.975-42.853-68.05-81.942-111.77-118.447zm285.36 77.182-155.68 46.63-42.146 157.22c52.167-7.854 103.99-21.873 155.822-48.26 24.952-53.52 30.504-99.728 42.002-155.587z"/></svg>`;

export class ComponenteGerenciadorMacros {
  /**
   * @param {HTMLElement} elementoPai 
   * @param {(comando: string) => void} aoRolarMacro 
   */
  constructor(elementoPai, aoRolarMacro) {
    this.elementoPai = elementoPai;
    this.aoRolarMacro = aoRolarMacro;
    this.macros = [];

    this.carregarMacros();
  }

  /**
   * Carrega as macros salvas no armazenamento.
   */
  async carregarMacros() {
    this.macros = await obterMacros();
    this.renderizar();
  }

  /**
   * Renderiza a lista de macros.
   */
  renderizar() {
    const temMacros = this.macros.length > 0;

    let htmlLista = '';
    if (temMacros) {
      htmlLista = this.macros.map(m => `
        <div class="r2r-item-macro">
          <div class="r2r-info-macro">
            <span class="r2r-nome-macro">${escaparHTML(m.nome)}</span>
            <span class="r2r-cmd-macro">${escaparHTML(m.comando)}</span>
          </div>
          <div class="r2r-acoes-macro">
            <button class="r2r-btn-editar-macro-item" data-id="${escaparHTML(m.id)}" title="Editar macro">
              <i data-lucide="pencil"></i>
            </button>
            <button class="r2r-btn-rolar-macro-item" data-id="${escaparHTML(m.id)}" title="Rolar macro">
              ${iconeCubes}
            </button>
          </div>
        </div>
      `).join('');
    } else {
      htmlLista = `
        <div style="text-align: center; padding: 20px 10px; color: var(--r2r-texto-mutado); font-size: 12px;">
          Nenhuma macro cadastrada.<br>Crie atalhos para suas rolagens frequentes!
        </div>
      `;
    }

    definirHTML(this.elementoPai, `
      <div class="r2r-lista-macros">
        ${htmlLista}
        <button class="r2r-btn-novo-macro-grande" id="r2rBtnNovoMacro">
          <i data-lucide="plus"></i> Criar Nova Macro
        </button>
      </div>
      <div class="r2r-container-modal-macro" style="display: none;"></div>
    `);

    // Inicializar ícones do Lucide
    createIcons({
      icons: { Pencil, Plus, Trash2 },
      attrs: {
        width: 18,
        height: 18
      },
      nameAttr: 'data-lucide',
      root: this.elementoPai
    });

    // Ação: Rolar Macro
    const botoesRolar = this.elementoPai.querySelectorAll('.r2r-btn-rolar-macro-item');
    botoesRolar.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const macro = this.macros.find(m => m.id === id);
        if (macro && this.aoRolarMacro) {
          this.aoRolarMacro(macro.comando);
        }
      });
    });

    // Ação: Editar Macro
    const botoesEditar = this.elementoPai.querySelectorAll('.r2r-btn-editar-macro-item');
    botoesEditar.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const macro = this.macros.find(m => m.id === id);
        if (macro) {
          this.abrirModalMacro(macro);
        }
      });
    });

    // Ação: Criar Nova Macro
    const btnNovo = this.elementoPai.querySelector('#r2rBtnNovoMacro');
    if (btnNovo) {
      btnNovo.addEventListener('click', () => {
        this.abrirModalMacro(null);
      });
    }
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

          <div style="display: flex; justify-content: space-between; gap: 8px; margin-top: 8px;">
            <div>
              ${ehEdicao ? `
                <button class="r2r-btn-excluir-macro-modal" title="Excluir Macro">
                  <i data-lucide="trash-2"></i> Excluir
                </button>
              ` : '<div></div>'}
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="r2r-btn-visibilidade r2r-btn-cancelar-modal" style="padding: 6px 12px;">Cancelar</button>
              <button class="r2r-btn-enviar r2r-btn-salvar-macro" style="padding: 6px 14px;">Salvar</button>
            </div>
          </div>
        </div>
      </div>
    `);

    // Renderizar ícone da lixeira no modal
    if (ehEdicao) {
      createIcons({
        icons: { Trash2 },
        attrs: { width: 16, height: 16 },
        nameAttr: 'data-lucide',
        root: modalContainer
      });
    }

    const fechar = () => {
      modalContainer.style.display = 'none';
      modalContainer.replaceChildren();
    };

    const inputNome = modalContainer.querySelector('.r2r-input-nome-macro');
    const inputComando = modalContainer.querySelector('.r2r-input-cmd-macro');

    modalContainer.querySelector('.r2r-btn-fechar-modal').addEventListener('click', fechar);
    modalContainer.querySelector('.r2r-btn-cancelar-modal').addEventListener('click', fechar);

    // Ação: Excluir Macro
    if (ehEdicao) {
      modalContainer.querySelector('.r2r-btn-excluir-macro-modal').addEventListener('click', async () => {
        const confirmar = confirm(`Deseja realmente excluir a macro "${macroParaEditar.nome}"?`);
        if (!confirmar) return;

        this.macros = this.macros.filter(m => m.id !== macroParaEditar.id);
        await salvarMacros(this.macros);
        fechar();
        this.renderizar();
      });
    }

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
      } else {
        const novaMacro = {
          id: `macro-${Date.now()}`,
          nome,
          comando
        };
        this.macros.push(novaMacro);
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

/**
 * janela-vtt.js - Componente Principal do VTT com Shadow DOM, Drag & Drop e Modo Pop-up
 *
 * Orquestra todos os subcomponentes da interface do Ready2Roll (R2R).
 */

import { executarRolagem, extrairNotacoes3D } from "../core/motor-dados.js";
import { GerenciadorRedeP2P, gerarCodigoSalaUnico } from "../core/rede-p2p.js";
import { createIcons, Swords, Volume2, VolumeX, Key, QrCode, Component, DoorOpen, UserRound, LogIn, CloudBackup, Sparkles, Smartphone, UserCheck, ArrowRight, X, Copy, Check, Share2, Settings } from "lucide";
import {
  tocarSomRolagem,
  configurarSom,
  obterEstadoSom,
} from "../core/som-dados.js";
import {
  obterPerfilUsuario,
  salvarItem,
  obterItem,
  obterUrlBaseWeb,
  salvarUrlBaseWeb,
  CHAVES,
} from "../core/armazenamento.js";

import { ComponenteGradeDados } from "./grade-dados.js";
import { ComponenteSeletorVisibilidade } from "./seletor-visibilidade.js";
import { ComponenteBarraComando } from "./barra-comando.js";
import { ComponenteGerenciadorMacros } from "./gerenciador-macros.js";
import { ComponenteLogRolagens } from "./log-rolagens.js";
import { definirHTML, obterUrlRecurso } from "./utilitarios-dom.js";
import { gerarQrCodeSvg } from "./gerador-qrcode.js";
import { rolarDados3D } from "./dados-3d.js";

export class JanelaVTT {
  /**
   * @param {HTMLElement} elementoRaiz
   * @param {object} [opcoes={}]
   */
  constructor(elementoRaiz, opcoes = {}) {
    this.elementoRaiz = elementoRaiz;
    this.ehModoPopUp = Boolean(opcoes.ehModoPopUp);

    // Inicializa Shadow Root para isolamento total de estilos se já não existir
    this.shadow =
      elementoRaiz.shadowRoot || elementoRaiz.attachShadow({ mode: "open" });

    this.rede = new GerenciadorRedeP2P();
    this.perfil = {
      nome: "Participante",
      ultimaSala: "",
      ultimoNomeSala: "",
      som: true,
    };
    this.statusConexao = { estado: "desconectado", texto: "Desconectado" };
    this.contadorMinimizado = 0;
    this.estaMinimizado = false;
    this.modoExibicao = "flutuante";
    this.larguraLateral = 390;
    this.posicaoDock = null;
    this.telaAtual = "lobby"; // 'lobby' | 'mesa'
    this.abaMobileAtiva = "dados"; // 'dados' | 'historico' | 'macros'
    this.rolagensNaoVistasMobile = 0;

    // Coordenadas de arrastar
    this.arrastando = false;
    this.offsetMouseX = 0;
    this.offsetMouseY = 0;
  }

  async inicializar(cssTexto) {
    this.perfil = await obterPerfilUsuario();
    this.modoExibicao = this.perfil.modoExibicao || "flutuante";
    this.larguraLateral = this.perfil.larguraLateral || 390;
    this.posicaoDock = this.perfil.posicaoDock || null;
    configurarSom(this.perfil.som);

    const urlIcone = obterUrlRecurso("assets/icons/r2r_icon.svg");

    // Renderiza estrutura base com duas telas: Lobby e Mesa Virtual
    definirHTML(
      this.shadow,
      `
      <style>${cssTexto}</style>
      
      <div class="r2r-painel-vtt" id="r2rPainel">
        <!-- Cabeçalho Global Persistente -->
        <header class="r2r-cabecalho" id="r2rCabecalho">
          <div class="r2r-marca">
            <img class="r2r-icone-logo" src="${urlIcone}" alt="Ready2Roll" onerror="if(!this.dataset.tentou){this.dataset.tentou='1';this.src=this.src.includes('/src/')?'./assets/icons/r2r_icon.svg':'./src/assets/icons/r2r_icon.svg';}" />
            <span class="r2r-titulo">Ready2Roll</span>
          </div>

          <div class="r2r-acoes-cabecalho">
            <button class="r2r-btn-icone r2r-btn-som" title="Alternar Som (Ativo/Mudo)">
              ${this.perfil.som ? '<i data-lucide="volume-2"></i>' : '<i data-lucide="volume-x"></i>'}
            </button>
            ${
              !this.ehModoPopUp
                ? `
              <button class="r2r-btn-icone r2r-btn-acoplar" id="r2rBtnAcoplar" title="${this.modoExibicao === "lateral" ? "Desacoplar (Voltar para Janela Flutuante)" : "Acoplar na Barra Lateral Esquerda (Split-Screen)"}">
                ${this.modoExibicao === "lateral" ? "🗖" : "◧"}
              </button>
              <button class="r2r-btn-icone r2r-btn-desacoplar" title="Desacoplar em Janela Pop-up Independente">
                🗗
              </button>
              <button class="r2r-btn-icone r2r-btn-minimizar" title="Minimizar para a borda">
                ─
              </button>
              <button class="r2r-btn-icone r2r-btn-fechar" title="Fechar VTT">
                ✕
              </button>
            `
                : ""
            }
          </div>
        </header>

        <!-- ================= TELA 1: LOBBY DE ENTRADA ================= -->
        <div id="r2rTelaLobby" style="display: flex; flex-direction: column; flex: 1; min-height: 0;">
          <div class="r2r-conteudo-lobby">

            <!-- Card de Convite / Transferência de Sessão (Exibido quando acessado via link com sala) -->
            <div id="r2rLobbySecaoConvite" class="r2r-card-secao r2r-card-convite" style="display: none;">
              <div class="r2r-convite-cabecalho">
                <div class="r2r-convite-badge">
                  <i data-lucide="smartphone" style="width:14px;height:14px;"></i>
                  <span>Convite de Mesa Virtual</span>
                </div>
                <div class="r2r-convite-nome-mesa" id="r2rConviteNomeMesa">Mesa Virtual</div>
                <div class="r2r-convite-codigo" id="r2rConviteCodigoMesa">Código: ...</div>
              </div>

              <!-- Opção em Destaque: Continuar com o Nome do PC / Origem -->
              <div id="r2rConviteOpcaoOrigem" style="display: none; flex-direction: column; gap: 8px;">
                <div class="r2r-convite-instrucao">
                  📱 Transfira sua sessão do PC para este dispositivo:
                </div>
                <button type="button" class="r2r-btn-assumir-origem" id="r2rBtnAssumirNomeOrigem">
                  <div class="r2r-assumir-conteudo">
                    <span class="r2r-assumir-icone"><i data-lucide="user-check" style="width:20px;height:20px;"></i></span>
                    <div class="r2r-assumir-textos">
                      <div class="r2r-assumir-titulo" id="r2rTextoAssumirNome">Continuar como "Nome"</div>
                      <div class="r2r-assumir-subtitulo">Assumir este perfil e jogar pelo smartphone</div>
                    </div>
                    <span class="r2r-assumir-seta"><i data-lucide="arrow-right" style="width:18px;height:18px;"></i></span>
                  </div>
                </button>
              </div>

              <!-- Divisor OU -->
              <div class="r2r-divisor-ou" id="r2rConviteDivisorOu" style="display: none;">
                <span>OU ESCOLHA OUTRO NOME</span>
              </div>

              <!-- Opção: Escolher outro nome de exibição -->
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label class="r2r-campo-label" id="r2rLabelNomeConvite" for="r2rInputNomeConvite" style="font-size: 11px; color: var(--r2r-texto-secundario);">Seu Nome de Exibição nesta mesa:</label>
                <div class="r2r-linha-entrar-codigo">
                  <input 
                    type="text" 
                    class="r2r-input-comando" 
                    id="r2rInputNomeConvite" 
                    placeholder="Digite seu nome ou personagem..." 
                    maxlength="30"
                    autocomplete="off"
                  />
                  <button type="button" class="r2r-btn-primario r2r-btn-entrar-inline" id="r2rBtnEntrarComOutroNome">
                    <span>Entrar</span>
                    <span><i data-lucide="log-in" style="width:14px;height:14px;display:inline-block;vertical-align:-2px;"></i></span>
                  </button>
                </div>
              </div>

              <!-- Botão para cancelar e ir para o lobby normal -->
              <div style="text-align: center; margin-top: 6px;">
                <button type="button" class="r2r-link-cancelar-convite" id="r2rBtnCancelarConvite">
                  Criar outra mesa ou entrar com outro código
                </button>
              </div>
            </div>

            <!-- Bloco Padrão do Lobby (ocultado quando há convite pendente) -->
            <div id="r2rLobbyBlocoPadrao" style="display: flex; flex-direction: column; gap: 12px;">
              <!-- Seção: Nome do Participante -->
              <div class="r2r-card-secao">
                <div class="r2r-titulo-secao"><i data-lucide="user-round" style="display:inline-block; vertical-align:middle; width:16px; height:16px; margin-right:4px;"></i> Seu Nome de Exibição</div>
                <input 
                  type="text" 
                  class="r2r-input-comando" 
                  id="r2rLobbyInputNome" 
                  value="${this.perfil.nome}" 
                  placeholder="Digite seu nome de exibição..." 
                  maxlength="30"
                  autocomplete="off"
                />
              </div>

              <!-- Seção: Entrar com Código Existente -->
              <div class="r2r-card-secao">
                <div class="r2r-titulo-secao"><i data-lucide="key" style="display:inline-block; vertical-align:middle; width:16px; height:16px; margin-right:4px;"></i> Entrar em uma Mesa Existente</div>
                <div style="font-size: 11px; color: var(--r2r-texto-secundario);">Cole o código de acesso recebido:</div>
                <div class="r2r-linha-entrar-codigo">
                  <input 
                    type="text" 
                    class="r2r-input-comando r2r-input-hash" 
                    id="r2rLobbyInputCodigo" 
                    placeholder="Código (ex: r2r-...)" 
                    spellcheck="false" 
                    autocomplete="off" 
                  />
                  <button type="button" class="r2r-btn-primario r2r-btn-entrar-inline" id="r2rLobbyBtnEntrar">
                    <span>Entrar</span>
                    <span><i data-lucide="log-in" style="width:14px;height:14px;display:inline-block;vertical-align:-2px;"></i></span>
                  </button>
                </div>
              </div>

              <!-- Divisor OU -->
              <div class="r2r-divisor-ou">
                <span>OU</span>
              </div>

              <!-- Seção: Criar Nova Mesa -->
              <div class="r2r-card-secao">
                <div class="r2r-titulo-secao"><i data-lucide="sparkles" style="display:inline-block; vertical-align:middle; width:16px; height:16px; margin-right:4px;"></i> Criar uma Nova Mesa</div>
                <div style="font-size: 11px; color: var(--r2r-texto-secundario);">Gera uma mesa exclusiva e protegida:</div>
                <input 
                  type="text" 
                  class="r2r-input-comando" 
                  id="r2rLobbyInputNomeMesa" 
                  placeholder="Nome da Mesa (ex: A Mina Perdida)" 
                  maxlength="40"
                />
                <button type="button" class="r2r-btn-primario" id="r2rLobbyBtnCriar" style="background: linear-gradient(135deg, #059669, #0d9488); border-color: rgba(52, 211, 153, 0.4);">
                  <span><i data-lucide="sparkles" style="width:16px;height:16px;display:inline-block;vertical-align:-2px;"></i></span>
                  <span>Criar Nova Mesa</span>
                </button>
              </div>

              <!-- Seção: Atalho de Reconexão -->
              <div id="r2rLobbySecaoRecente" class="r2r-card-secao" style="display: ${this.perfil.ultimaSala ? "flex" : "none"}; background: rgba(139, 92, 246, 0.08); border-color: rgba(139, 92, 246, 0.25);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; flex-direction: column; gap: 2px; overflow: hidden; margin-right: 8px;">
                    <span style="font-size: 10px; font-weight: 700; color: #a78bfa; text-transform: uppercase;">Mesa Recente</span>
                    <span style="font-size: 12px; font-weight: 600; color: #f8fafc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" id="r2rLobbyNomeRecente">${this.perfil.ultimoNomeSala || "Mesa Anterior"}</span>
                    <span style="font-family: monospace; font-size: 10px; color: #94a3b8;" id="r2rLobbyCodigoRecente">${this.perfil.ultimaSala || ""}</span>
                  </div>
                  <button type="button" class="r2r-btn-secundario" id="r2rLobbyBtnReconectar" style="padding: 6px 12px; font-size: 11px; white-space: nowrap;">
                    <span>Reconectar</span>
                    <span><i data-lucide="cloud-backup" style="width:14px;height:14px;display:inline-block;vertical-align:-2px;"></i></span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- ================= TELA 2: MESA VIRTUAL (VTT) ================= -->
        <div id="r2rTelaMesa" style="display: none; flex-direction: column; flex: 1; min-height: 0;">
          <!-- Barra Superior da Mesa com Título e Copiar Código -->
          <div class="r2r-barra-mesa-vtt">
            <div class="r2r-grupo-mesa-info">
              <button class="r2r-btn-voltar-lobby" id="r2rBtnSairMesa" title="Sair desta sala e voltar ao menu inicial">
                <span style="display:inline-flex; align-items:center; gap:4px;"><i data-lucide="door-open"></i> Sair</span>
              </button>
              <span class="r2r-titulo-mesa-ativa" id="r2rTituloMesaAtiva"><i data-lucide="swords" style="display:inline-block; vertical-align:middle; margin-right:4px;"></i> Mesa Virtual</span>
            </div>

            <div style="display: flex; align-items: center; gap: 6px; position: relative;">
              <button class="r2r-btn-copiar-codigo" id="r2rBtnCopiarCodigo" aria-label="Copiar chave de acesso da sala">
                <span id="r2rTextoBtnCopiar"><i data-lucide="key"></i></span>
                <span class="r2r-tooltip-rapido" id="r2rTooltipCopiar">Copiar chave da sala</span>
              </button>

              <button class="r2r-btn-compartilhar-mesa" id="r2rBtnAbrirCompartilhar" aria-label="Conectar celular ou compartilhar link da mesa">
                <span><i data-lucide="qr-code"></i></span>
                <span class="r2r-tooltip-rapido">Conectar Celular / QR Code</span>
              </button>

              <div class="r2r-info-conexao" style="margin-left: 2px;" title="${this.statusConexao.texto}">
                <span class="r2r-ponto-status ${this.statusConexao.estado}"></span>
              </div>
            </div>
          </div>

          <!-- Conteúdo Principal: Histórico de Rolagens -->
          <div class="r2r-conteudo" id="r2rSecaoConteudoRolagens">
            <div id="r2rFeedRolagens"></div>
          </div>

          <!-- Controles Inferiores -->
          <div class="r2r-area-controle" id="r2rSecaoAreaControle">
            <!-- Seletor de Visibilidade (Pública / Direcionada / Privada) no Topo -->
            <div id="r2rAreaVisibilidade"></div>

            <!-- Macros Personalizadas -->
            <div id="r2rAreaMacros"></div>

            <!-- Grade Rápida d4 - d100 com Teclado Calculadora e Modificadores Touch -->
            <div id="r2rAreaGradeDados"></div>

            <!-- Linha de Comando de Rolagem -->
            <div id="r2rAreaComando"></div>
          </div>

          <!-- Barra de Navegação Inferior para Smartphones e Tablets -->
          <nav class="r2r-bottom-nav" id="r2rBottomNav">
            <button type="button" class="r2r-nav-tab ativo" data-aba="dados" id="r2rTabBtnDados">
              <span class="r2r-nav-icone"><img src="${obterUrlRecurso('assets/icons/000000/transparent/1x1/delapouite/round-table.svg')}" alt="Mesa" style="width:20px;height:20px;filter:invert(1);" onerror="if(!this.dataset.tentou){this.dataset.tentou='1';this.src=this.src.includes('/src/')?'./assets/icons/000000/transparent/1x1/delapouite/round-table.svg':'/src/assets/icons/000000/transparent/1x1/delapouite/round-table.svg';}"></span>
              <span class="r2r-nav-label">Rolagens</span>
            </button>
            <button type="button" class="r2r-nav-tab" data-aba="macros" id="r2rTabBtnMacros">
              <span class="r2r-nav-icone"><i data-lucide="component"></i></span>
              <span class="r2r-nav-label">Macros</span>
            </button>
          </nav>
        </div>

        <!-- Modal de Compartilhamento & QR Code -->
        <div class="r2r-modal-backdrop" id="r2rModalCompartilhar" style="display: none;">
          <div class="r2r-modal-card">
            <div class="r2r-modal-cabecalho">
              <div class="r2r-modal-titulo">
                <span><i data-lucide="qr-code"></i></span>
                <span>Conectar Smartphone / Tablet</span>
              </div>
              <button type="button" class="r2r-modal-btn-fechar" id="r2rBtnFecharModalCompartilhar" aria-label="Fechar modal">
                <i data-lucide="x"></i>
              </button>
            </div>

            <div class="r2r-modal-corpo">
              <div class="r2r-qrcode-secao">
                <div class="r2r-qrcode-moldura" id="r2rQrCodeContainer">
                  <div class="r2r-qrcode-carregando">Gerando QR Code...</div>
                </div>
                <div class="r2r-qrcode-dica">
                  Aponte a câmera do celular para entrar nesta mesa instantaneamente pelo navegador, sem precisar instalar nada!
                </div>
              </div>

              <!-- Link Direto da Mesa -->
              <div class="r2r-campo-compartilhar">
                <label class="r2r-campo-label">Link Direto da Mesa:</label>
                <div class="r2r-input-com-botao">
                  <input type="text" class="r2r-input-comando" id="r2rInputLinkMesa" readonly spellcheck="false" />
                  <button type="button" class="r2r-btn-primario" id="r2rBtnCopiarLinkMesa">
                    <span id="r2rIconeCopiarLink" style="display:inline-flex;align-items:center;"><i data-lucide="copy"></i></span>
                    <span id="r2rTextoCopiarLink">Copiar Link</span>
                  </button>
                </div>
              </div>

              <!-- Código da Sala -->
              <div class="r2r-campo-compartilhar">
                <label class="r2r-campo-label">Chave de Acesso:</label>
                <div class="r2r-input-com-botao">
                  <input type="text" class="r2r-input-comando r2r-input-hash" id="r2rInputCodigoModal" readonly spellcheck="false" />
                  <button type="button" class="r2r-btn-secundario" id="r2rBtnCopiarCodigoModal">
                    <span id="r2rIconeCopiarCodigoModal" style="display:inline-flex;align-items:center;"><i data-lucide="key"></i></span>
                    <span id="r2rTextoCopiarCodigoModal">Copiar Chave</span>
                  </button>
                </div>
              </div>

              <!-- Compartilhamento Nativo (WhatsApp, etc) -->
              <div id="r2rSecaoCompartilharNativo" style="display: none; margin-top: 10px;">
                <button type="button" class="r2r-btn-primario" id="r2rBtnCompartilharNativo" style="width: 100%; justify-content: center; background: linear-gradient(135deg, #10b981, #059669);">
                  <span style="display:inline-flex;align-items:center;"><i data-lucide="share-2"></i></span>
                  <span>Compartilhar via WhatsApp / Apps</span>
                </button>
              </div>

              <!-- Configuração de Domínio Personalizado -->
              <details class="r2r-config-dominio">
                <summary style="cursor: pointer; user-select: none; display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="settings" style="width:14px;height:14px;flex-shrink:0;"></i>
                  <span>Alterar domínio Web da mesa</span>
                </summary>
                <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
                  <span style="font-size: 11px; color: var(--r2r-texto-secundario);">Domínio base onde o site está hospedado (Vercel ou customizado):</span>
                  <div class="r2r-input-com-botao">
                    <input type="url" class="r2r-input-comando" id="r2rInputDominioWeb" placeholder="https://ready-to-roll-vtt.vercel.app" />
                    <button type="button" class="r2r-btn-secundario" id="r2rBtnSalvarDominioWeb" style="gap: 4px;">
                      <i data-lucide="check" style="width:14px;height:14px;"></i>
                      <span>Salvar</span>
                    </button>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>

        <!-- Alça de Redimensionamento Horizontal quando Acoplada -->
        <div class="r2r-alca-redimensionar" id="r2rAlcaRedimensionar" title="Arraste para redimensionar a barra lateral"></div>
      </div>

      <!-- Dock Minimizado Flutuante -->
      <div class="r2r-dock-minimizado" id="r2rDock" style="display: none;" title="Clique para expandir o Ready2Roll">
        <img class="r2r-dock-icone" src="${urlIcone}" alt="Ready2Roll" onerror="if(!this.dataset.tentou){this.dataset.tentou='1';this.src=this.src.includes('/src/')?'./assets/icons/r2r_icon.svg':'./src/assets/icons/r2r_icon.svg';}" />
        <span style="font-weight: 700; font-size: 13px; color: #f8fafc;">Ready2Roll</span>
        <span class="r2r-dock-contador" id="r2rDockContador" style="display: none;">0</span>
      </div>
    `,
    );

    this.vincularComponentes();
    this.vincularEventosRede();
    this.vincularArrastar();
    this.vincularRedimensionarLateral();
    this.vincularArrastarDock();

    // Aplica posição personalizada salva do dock
    if (this.posicaoDock) {
      const dock = this.shadow.getElementById("r2rDock");
      if (dock) {
        dock.style.left = `${this.posicaoDock.x}px`;
        dock.style.top = `${this.posicaoDock.y}px`;
        dock.style.bottom = "auto";
        dock.style.right = "auto";
      }
    }

    // Aplica o modo lateral salvo se estiver ativo
    if (this.modoExibicao === "lateral" && !this.ehModoPopUp) {
      this.aplicarModoLateral(true);
    }

    // Restaura sessão ativa ou conecta via parâmetros de URL (ex: ao desacoplar para popup ou via link/QR Code)
    let salaParaConectar = null;
    let nomeSalaParaConectar = null;
    let nomeOrigemParaConectar = null;
    let ehPopupDireto = false;

    if (typeof window !== "undefined" && window.location) {
      const urlQuery =
        window.location.search ||
        (window.location.hash
          ? window.location.hash.replace(/^#\/?/, "?")
          : "");
      if (urlQuery) {
        const urlParams = new URLSearchParams(urlQuery);
        const paramSala = urlParams.get("sala") || urlParams.get("room");
        if (paramSala) {
          salaParaConectar = paramSala.trim().toLowerCase();
          nomeSalaParaConectar =
            urlParams.get("nomeSala") ||
            urlParams.get("mesa") ||
            "Mesa Virtual";
          nomeOrigemParaConectar =
            urlParams.get("origem") ||
            urlParams.get("autor") ||
            urlParams.get("de") ||
            null;
          ehPopupDireto = urlParams.get("popup") === "1";

          const paramNome = urlParams.get("nome") || urlParams.get("user");
          if (paramNome) {
            this.perfil.nome = paramNome.trim();
            await salvarItem(CHAVES.NOME_USUARIO, this.perfil.nome);
          }
        }
      }
    }

    if (salaParaConectar) {
      if (ehPopupDireto) {
        // Pop-up desacoplado na mesma máquina: conecta diretamente
        await this.entrarOuCriarSala(salaParaConectar, nomeSalaParaConectar);
      } else {
        // Link externo ou QR Code: exibe a tela de confirmação de nome de exibição / migração
        this.exibirConviteSala(
          salaParaConectar,
          nomeSalaParaConectar,
          nomeOrigemParaConectar,
        );
      }
    } else {
      const sessaoAtiva = await obterItem(CHAVES.SESSAO_ATIVA, null);
      if (sessaoAtiva && sessaoAtiva.codigo) {
        await this.entrarOuCriarSala(
          sessaoAtiva.codigo,
          sessaoAtiva.nomeSala || "Mesa Virtual",
        );
      }
    }
  }

  vincularComponentes() {
    const feedContainer = this.shadow.getElementById("r2rFeedRolagens");
    this.componenteLog = new ComponenteLogRolagens(feedContainer);

    const gradeContainer = this.shadow.getElementById("r2rAreaGradeDados");
    this.componenteGrade = new ComponenteGradeDados(
      gradeContainer,
      (comando) => {
        this.executarETransmitir(comando);
      },
    );

    const visibilidadeContainer = this.shadow.getElementById(
      "r2rAreaVisibilidade",
    );
    this.componenteVisibilidade = new ComponenteSeletorVisibilidade(
      visibilidadeContainer,
      () => {
        return this.rede.obterListaParticipantes();
      },
    );

    const macrosContainer = this.shadow.getElementById("r2rAreaMacros");
    this.componenteMacros = new ComponenteGerenciadorMacros(
      macrosContainer,
      (comandoMacro) => {
        this.executarETransmitir(comandoMacro);
      }
    );

    // Inicializar Ícones Lucide
    createIcons({
      icons: { Swords, Volume2, VolumeX, Key, QrCode, Component, DoorOpen, UserRound, LogIn, CloudBackup, Sparkles, Smartphone, UserCheck, ArrowRight, X, Copy, Check, Share2, Settings },
      attrs: { width: 16, height: 16 },
      nameAttr: 'data-lucide',
      root: this.shadow
    });

    const comandoContainer = this.shadow.getElementById("r2rAreaComando");
    this.componenteComando = new ComponenteBarraComando(
      comandoContainer,
      (comando) => {
        this.executarETransmitir(comando);
      },
    );

    // Ações do Cabeçalho Global
    const btnSom = this.shadow.querySelector(".r2r-btn-som");
    btnSom.addEventListener("click", async () => {
      const novoEstado = !obterEstadoSom();
      configurarSom(novoEstado);
      this.perfil.som = novoEstado;
      await salvarItem(CHAVES.SOM_HABILITADO, novoEstado);
      btnSom.innerHTML = novoEstado ? '<i data-lucide="volume-2"></i>' : '<i data-lucide="volume-x"></i>';
      createIcons({ icons: { Volume2, VolumeX }, attrs: { width: 16, height: 16 }, nameAttr: 'data-lucide', root: btnSom });
    });

    const btnAcoplar = this.shadow.getElementById("r2rBtnAcoplar");
    if (btnAcoplar) {
      btnAcoplar.addEventListener("click", () => {
        this.aplicarModoLateral(this.modoExibicao !== "lateral");
      });
    }

    const btnDesacoplar = this.shadow.querySelector(".r2r-btn-desacoplar");
    if (btnDesacoplar) {
      btnDesacoplar.addEventListener("click", () => {
        this.desacoplarEmPopUp();
      });
    }

    const btnMinimizar = this.shadow.querySelector(".r2r-btn-minimizar");
    if (btnMinimizar) {
      btnMinimizar.addEventListener("click", () => {
        this.minimizar(true);
      });
    }

    const btnFechar = this.shadow.querySelector(".r2r-btn-fechar");
    if (btnFechar) {
      btnFechar.addEventListener("click", () => {
        this.fechar();
      });
    }

    // ================= Ações da Tela de Lobby =================
    const inputNome = this.shadow.getElementById("r2rLobbyInputNome");
    if (inputNome) {
      inputNome.addEventListener("change", async () => {
        const val = inputNome.value.trim();
        if (val) {
          this.perfil.nome = val;
          await salvarItem(CHAVES.NOME_USUARIO, val);
        }
      });
    }

    // Entrar em mesa existente com código
    const inputCodigo = this.shadow.getElementById("r2rLobbyInputCodigo");
    const btnEntrar = this.shadow.getElementById("r2rLobbyBtnEntrar");
    if (btnEntrar && inputCodigo) {
      const acaoEntrar = () => {
        const codigo = inputCodigo.value.trim().toLowerCase();
        if (!codigo) {
          alert("Por favor, informe o código de acesso da sala.");
          inputCodigo.focus();
          return;
        }
        this.entrarOuCriarSala(codigo, "Mesa Virtual");
      };

      btnEntrar.addEventListener("click", acaoEntrar);
      inputCodigo.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          acaoEntrar();
        }
      });
    }

    // Criar nova mesa com hash único
    const inputNomeMesa = this.shadow.getElementById("r2rLobbyInputNomeMesa");
    const btnCriar = this.shadow.getElementById("r2rLobbyBtnCriar");
    if (btnCriar) {
      const acaoCriar = () => {
        const nomeMesa = inputNomeMesa ? inputNomeMesa.value.trim() : "";
        const codigoHash = gerarCodigoSalaUnico();
        this.entrarOuCriarSala(codigoHash, nomeMesa || "Mesa Principal");
      };

      btnCriar.addEventListener("click", acaoCriar);
      if (inputNomeMesa) {
        inputNomeMesa.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            acaoCriar();
          }
        });
      }
    }

    // Reconectar à última mesa
    const btnReconectar = this.shadow.getElementById("r2rLobbyBtnReconectar");
    if (btnReconectar && this.perfil.ultimaSala) {
      btnReconectar.addEventListener("click", () => {
        this.entrarOuCriarSala(
          this.perfil.ultimaSala,
          this.perfil.ultimoNomeSala || "Mesa Virtual",
        );
      });
    }

    // Ações do Card de Convite / Transferência de Sessão
    const btnAssumir = this.shadow.getElementById("r2rBtnAssumirNomeOrigem");
    if (btnAssumir) {
      btnAssumir.addEventListener("click", async () => {
        if (!this.dadosConvitePendente) return;
        const { codigoSala, nomeSala, nomeOrigem } = this.dadosConvitePendente;
        if (nomeOrigem) {
          this.perfil.nome = nomeOrigem;
          await salvarItem(CHAVES.NOME_USUARIO, nomeOrigem);
        }
        this.limparParametrosUrlConvite();
        await this.entrarOuCriarSala(codigoSala, nomeSala);
      });
    }

    const inputNomeConvite = this.shadow.getElementById("r2rInputNomeConvite");
    const btnEntrarOutro = this.shadow.getElementById("r2rBtnEntrarComOutroNome");
    if (btnEntrarOutro && inputNomeConvite) {
      const acaoEntrarOutro = async () => {
        if (!this.dadosConvitePendente) return;
        const { codigoSala, nomeSala } = this.dadosConvitePendente;
        const nomeDigitado = inputNomeConvite.value.trim();
        if (!nomeDigitado) {
          alert("Por favor, digite seu nome de exibição para entrar na mesa.");
          inputNomeConvite.focus();
          return;
        }
        this.perfil.nome = nomeDigitado;
        await salvarItem(CHAVES.NOME_USUARIO, nomeDigitado);
        this.limparParametrosUrlConvite();
        await this.entrarOuCriarSala(codigoSala, nomeSala);
      };

      btnEntrarOutro.addEventListener("click", acaoEntrarOutro);
      inputNomeConvite.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          acaoEntrarOutro();
        }
      });
    }

    const btnCancelarConvite = this.shadow.getElementById("r2rBtnCancelarConvite");
    if (btnCancelarConvite) {
      btnCancelarConvite.addEventListener("click", () => {
        const secaoConvite = this.shadow.getElementById("r2rLobbySecaoConvite");
        const blocoPadrao = this.shadow.getElementById("r2rLobbyBlocoPadrao");
        if (secaoConvite) secaoConvite.style.display = "none";
        if (blocoPadrao) blocoPadrao.style.display = "flex";
        this.dadosConvitePendente = null;
        this.limparParametrosUrlConvite();
      });
    }

    // ================= Ações da Tela de Mesa Virtual =================
    const btnCopiar = this.shadow.getElementById("r2rBtnCopiarCodigo");
    if (btnCopiar) {
      btnCopiar.addEventListener("click", () => {
        this.copiarCodigoSala();
      });
    }

    const btnSairMesa = this.shadow.getElementById("r2rBtnSairMesa");
    if (btnSairMesa) {
      btnSairMesa.addEventListener("click", () => {
        this.sairParaLobby();
      });
    }

    // Botão de Compartilhar / QR Code
    const btnAbrirCompartilhar = this.shadow.getElementById(
      "r2rBtnAbrirCompartilhar",
    );
    if (btnAbrirCompartilhar) {
      btnAbrirCompartilhar.addEventListener("click", () => {
        this.abrirModalCompartilhar();
      });
    }

    const btnFecharModal = this.shadow.getElementById(
      "r2rBtnFecharModalCompartilhar",
    );
    if (btnFecharModal) {
      btnFecharModal.addEventListener("click", () => {
        this.fecharModalCompartilhar();
      });
    }

    const modalCompartilhar = this.shadow.getElementById(
      "r2rModalCompartilhar",
    );
    if (modalCompartilhar) {
      modalCompartilhar.addEventListener("click", (e) => {
        if (e.target === modalCompartilhar) {
          this.fecharModalCompartilhar();
        }
      });
    }

    const btnCopiarLink = this.shadow.getElementById("r2rBtnCopiarLinkMesa");
    if (btnCopiarLink) {
      btnCopiarLink.addEventListener("click", () => {
        this.copiarLinkMesa();
      });
    }

    const btnCopiarCodigoModal = this.shadow.getElementById(
      "r2rBtnCopiarCodigoModal",
    );
    if (btnCopiarCodigoModal) {
      btnCopiarCodigoModal.addEventListener("click", () => {
        this.copiarCodigoModal();
      });
    }

    const btnCompartilharNativo = this.shadow.getElementById(
      "r2rBtnCompartilharNativo",
    );
    if (btnCompartilharNativo) {
      btnCompartilharNativo.addEventListener("click", () => {
        this.compartilharNativo();
      });
    }

    const btnSalvarDominio = this.shadow.getElementById(
      "r2rBtnSalvarDominioWeb",
    );
    if (btnSalvarDominio) {
      btnSalvarDominio.addEventListener("click", () => {
        this.salvarDominioWeb();
      });
    }

    // Abas de navegação mobile
    const tabsMobile = this.shadow.querySelectorAll(".r2r-nav-tab");
    tabsMobile.forEach((tab) => {
      tab.addEventListener("click", () => {
        const aba = tab.dataset.aba;
        if (aba) {
          this.alternarAbaMobile(aba);
        }
      });
    });
  }

  vincularEventosRede() {
    this.rede.aoAtualizarStatusConexao = (estado, texto) => {
      this.statusConexao = { estado, texto };
      const ponto = this.shadow.querySelector(".r2r-ponto-status");
      const textoEl = this.shadow.querySelector(".r2r-texto-status");
      const labelSala = this.shadow.getElementById("r2rLabelSala");

      if (ponto) {
        ponto.className = `r2r-ponto-status ${estado}`;
      }
      if (textoEl) {
        textoEl.textContent = texto;
      }
      if (labelSala) {
        labelSala.textContent = this.rede.codigoSalaAtual || "Entrar em Sala";
      }
    };

    this.rede.aoAtualizarParticipantes = () => {
      this.componenteVisibilidade.atualizarListaDestinatarios();
    };

    this.rede.aoReceberRolagem = (pacoteRolagem, tocarSom) => {
      this.componenteLog.adicionarRolagem(pacoteRolagem);

      // Só toca som se for explicitamente solicitado E o autor não for o próprio usuário local
      const ehDoProprioAutor =
        pacoteRolagem?.autorId === this.rede.meuPerfil.id ||
        (pacoteRolagem?.autor && pacoteRolagem?.autor === this.perfil.nome);

      if (tocarSom && !ehDoProprioAutor) {
        tocarSomRolagem(4);
      }

      // Se estiver em mobile e não estiver na aba de histórico, incrementa o badge
      if (this.abaMobileAtiva !== "historico") {
        this.rolagensNaoVistasMobile++;
        const badgeMobile = this.shadow.getElementById("r2rBadgeHistorico");
        if (badgeMobile) {
          badgeMobile.textContent =
            this.rolagensNaoVistasMobile > 99
              ? "99+"
              : this.rolagensNaoVistasMobile;
          badgeMobile.style.display = "inline-flex";
        }
      }

      if (this.estaMinimizado) {
        this.contadorMinimizado++;
        const badge = this.shadow.getElementById("r2rDockContador");
        badge.textContent = this.contadorMinimizado;
        badge.style.display = "inline-block";
      }
    };
  }

  async executarETransmitir(comandoTexto) {
    try {
      let dadosRolagem;
      const notacoes3D = extrairNotacoes3D(comandoTexto);

      if (notacoes3D.length > 0) {
        // Dispara o som de rolagem imediatamente no início do arremesso dos dados 3D
        tocarSomRolagem(4);

        // Rola os dados 3D na mesa e obtém os valores físicos reais onde eles pararam
        const resultados3D = await rolarDados3D(notacoes3D);

        // O motor de regras computa o resultado matemático vinculado aos dados físicos visíveis
        dadosRolagem = executarRolagem(comandoTexto, {
          valoresPredefinidos: resultados3D,
        });

        const { visibilidade, destinatarios } =
          this.componenteVisibilidade.obterConfiguracaoVisibilidade();

        // Transmite sem re-tocar o áudio para o autor local (já tocou no lançamento 3D)
        this.rede.transmitirRolagem(dadosRolagem, visibilidade, destinatarios, false);
      } else {
        // Rolagens puramente numéricas sem dados 3D: executa imediatamente
        tocarSomRolagem(4);
        dadosRolagem = executarRolagem(comandoTexto);

        const { visibilidade, destinatarios } =
          this.componenteVisibilidade.obterConfiguracaoVisibilidade();

        this.rede.transmitirRolagem(dadosRolagem, visibilidade, destinatarios, false);
      }
    } catch (erro) {
      alert(`Erro na rolagem: ${erro.message}`);
    }
  }

  /**
   * Alterna entre a visualização do Lobby Inicial e da Mesa Virtual.
   * @param {'lobby'|'mesa'} tela
   */
  exibirTela(tela) {
    this.telaAtual = tela;
    const telaLobby = this.shadow.getElementById("r2rTelaLobby");
    const telaMesa = this.shadow.getElementById("r2rTelaMesa");
    if (!telaLobby || !telaMesa) return;

    if (tela === "mesa") {
      telaLobby.style.display = "none";
      telaMesa.style.display = "flex";
      if (this.componenteComando) {
        this.componenteComando.focar();
      }
    } else {
      telaMesa.style.display = "none";
      telaLobby.style.display = "flex";
      const inputCod = this.shadow.getElementById("r2rLobbyInputCodigo");
      if (inputCod) inputCod.value = "";
    }
  }

  /**
   * Conecta a uma sala (criada ou acessada) e transiciona para a Mesa Virtual.
   * @param {string} codigo
   * @param {string} [nomeSala]
   */
  async entrarOuCriarSala(codigo, nomeSala = "") {
    const inputNome = this.shadow.getElementById("r2rLobbyInputNome");
    const nomeJogador = inputNome ? inputNome.value.trim() : this.perfil.nome;
    if (nomeJogador) {
      this.perfil.nome = nomeJogador;
      await salvarItem(CHAVES.NOME_USUARIO, nomeJogador);
    }

    if (!codigo) {
      alert("Por favor, informe ou gere um código de sala.");
      return;
    }

    const nomeMesaFinal =
      nomeSala && nomeSala.trim()
        ? nomeSala.trim()
        : this.perfil.ultimoNomeSala || "Mesa Virtual";

    try {
      this.componenteLog.limpar();
      await this.rede.conectarSala(codigo, this.perfil.nome, nomeMesaFinal);
      this.perfil.ultimaSala = codigo;
      this.perfil.ultimoNomeSala = nomeMesaFinal;
      await salvarItem(CHAVES.ULTIMA_SALA, codigo);
      await salvarItem(CHAVES.NOME_SALA_ATUAL, nomeMesaFinal);
      await salvarItem(CHAVES.SESSAO_ATIVA, {
        codigo,
        nomeSala: nomeMesaFinal,
      });

      // Atualiza cabeçalho da Mesa Virtual
      const tituloMesa = this.shadow.getElementById("r2rTituloMesaAtiva");
      if (tituloMesa) {
        tituloMesa.innerHTML = `<i data-lucide="swords" style="display:inline-block; vertical-align:middle; margin-right:4px;"></i> ${nomeMesaFinal}`;
        createIcons({ icons: { Swords }, attrs: { width: 16, height: 16 }, nameAttr: 'data-lucide', root: tituloMesa });
        tituloMesa.title = nomeMesaFinal;
      }
      const labelCopiar = this.shadow.getElementById("r2rTextoBtnCopiar");
      if (labelCopiar) {
        labelCopiar.innerHTML = '<i data-lucide="key"></i>';
        createIcons({ icons: { Key }, attrs: { width: 16, height: 16 }, nameAttr: 'data-lucide', root: labelCopiar });
      }
      const tooltipCopiar = this.shadow.getElementById("r2rTooltipCopiar");
      if (tooltipCopiar) {
        tooltipCopiar.textContent = `Copiar chave da sala (${codigo})`;
      }

      // Atualiza card de sala recente no Lobby
      const secaoRecente = this.shadow.getElementById("r2rLobbySecaoRecente");
      if (secaoRecente) {
        secaoRecente.style.display = "flex";
        const elNome = this.shadow.getElementById("r2rLobbyNomeRecente");
        const elCod = this.shadow.getElementById("r2rLobbyCodigoRecente");
        if (elNome) elNome.textContent = nomeMesaFinal;
        if (elCod) elCod.textContent = codigo;
      }

      this.exibirTela("mesa");
      this.alternarAbaMobile("dados");
    } catch (erro) {
      alert(`Falha ao conectar na mesa: ${erro.message}`);
    }
  }

  /**
   * Desconecta da mesa ativa e retorna para o Lobby Inicial.
   */
  async sairParaLobby() {
    this.dadosConvitePendente = null;
    const secaoConvite = this.shadow.getElementById("r2rLobbySecaoConvite");
    const blocoPadrao = this.shadow.getElementById("r2rLobbyBlocoPadrao");
    if (secaoConvite) secaoConvite.style.display = "none";
    if (blocoPadrao) blocoPadrao.style.display = "flex";

    await salvarItem(CHAVES.SESSAO_ATIVA, null);
    this.rede.desconectar();
    this.componenteLog.limpar();
    this.exibirTela("lobby");
  }

  /**
   * Configura e exibe a tela de convite para confirmação ou migração do Nome de Exibição.
   * @param {string} codigoSala
   * @param {string} nomeSala
   * @param {string|null} nomeOrigem
   */
  exibirConviteSala(codigoSala, nomeSala, nomeOrigem) {
    this.dadosConvitePendente = { codigoSala, nomeSala, nomeOrigem };

    const secaoConvite = this.shadow.getElementById("r2rLobbySecaoConvite");
    const blocoPadrao = this.shadow.getElementById("r2rLobbyBlocoPadrao");
    if (!secaoConvite || !blocoPadrao) return;

    blocoPadrao.style.display = "none";
    secaoConvite.style.display = "flex";

    const elNomeMesa = this.shadow.getElementById("r2rConviteNomeMesa");
    if (elNomeMesa) elNomeMesa.textContent = nomeSala || "Mesa Virtual";

    const elCodMesa = this.shadow.getElementById("r2rConviteCodigoMesa");
    if (elCodMesa) elCodMesa.textContent = `Código: ${codigoSala}`;

    const blocoOrigem = this.shadow.getElementById("r2rConviteOpcaoOrigem");
    const divisorOu = this.shadow.getElementById("r2rConviteDivisorOu");
    const textoAssumir = this.shadow.getElementById("r2rTextoAssumirNome");
    const inputNomeConvite = this.shadow.getElementById("r2rInputNomeConvite");
    const labelNomeConvite = this.shadow.getElementById("r2rLabelNomeConvite");

    if (nomeOrigem && nomeOrigem.trim()) {
      if (blocoOrigem) blocoOrigem.style.display = "flex";
      if (divisorOu) divisorOu.style.display = "flex";
      if (textoAssumir) {
        textoAssumir.textContent = `Continuar como "${nomeOrigem.trim()}"`;
      }
      if (labelNomeConvite) {
        labelNomeConvite.textContent = "Ou defina outro Nome de Exibição:";
      }
      if (inputNomeConvite) {
        inputNomeConvite.value =
          this.perfil.nome && this.perfil.nome !== nomeOrigem.trim()
            ? this.perfil.nome
            : "";
        inputNomeConvite.placeholder = "Digite outro nome ou personagem...";
      }
    } else {
      if (blocoOrigem) blocoOrigem.style.display = "none";
      if (divisorOu) divisorOu.style.display = "none";
      if (labelNomeConvite) {
        labelNomeConvite.textContent = "Seu Nome de Exibição nesta mesa:";
      }
      if (inputNomeConvite) {
        inputNomeConvite.value = this.perfil.nome || "";
        inputNomeConvite.placeholder = "Digite seu nome ou personagem...";
      }
    }

    createIcons({
      icons: { Smartphone, UserCheck, ArrowRight, LogIn },
      attrs: { width: 16, height: 16 },
      nameAttr: "data-lucide",
      root: secaoConvite,
    });
  }

  /**
   * Remove parâmetros temporários da URL após o aceite do convite para manter a barra limpa.
   */
  limparParametrosUrlConvite() {
    if (
      typeof window !== "undefined" &&
      window.history &&
      window.history.replaceState
    ) {
      try {
        const urlSemParams =
          window.location.pathname +
          (window.location.hash.startsWith("#/")
            ? window.location.hash.split("?")[0]
            : "");
        window.history.replaceState(
          {},
          document.title,
          urlSemParams || window.location.pathname,
        );
      } catch (_) {}
    }
  }

  /**
   * Copia o código de acesso com feedback visual imediato.
   */
  copiarCodigoSala() {
    const codigo = this.rede.codigoSalaAtual;
    if (!codigo) return;

    const btn = this.shadow.getElementById("r2rBtnCopiarCodigo");
    const label = this.shadow.getElementById("r2rTextoBtnCopiar");
    const tooltip = this.shadow.getElementById("r2rTooltipCopiar");

    const sucessoFeedback = () => {
      if (btn && label) {
        btn.classList.add("copiado");
        label.textContent = "✓";
        if (tooltip) {
          tooltip.textContent = "Chave copiada! ✓";
        }
        setTimeout(() => {
          btn.classList.remove("copiado");
          label.innerHTML = '<i data-lucide="key"></i>';
          createIcons({ icons: { Key }, attrs: { width: 16, height: 16 }, nameAttr: 'data-lucide', root: btn });
          if (tooltip) {
            tooltip.textContent = `Copiar chave da sala (${codigo})`;
          }
        }, 1800);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(codigo)
        .then(sucessoFeedback)
        .catch(() => {
          prompt("Copie o código de acesso da sala:", codigo);
        });
    } else {
      prompt("Copie o código de acesso da sala:", codigo);
    }
  }

  /**
   * Alterna a exibição das abas na interface otimizada para smartphones.
   * @param {'dados'|'historico'|'macros'} nomeAba
   */
  alternarAbaMobile(nomeAba) {
    this.abaMobileAtiva = nomeAba;
    const painel = this.shadow.getElementById("r2rPainel");
    if (painel) {
      painel.classList.remove("r2r-aba-ativa-dados", "r2r-aba-ativa-macros");
      painel.classList.add(`r2r-aba-ativa-${nomeAba}`);
    }

    const tabs = this.shadow.querySelectorAll(".r2r-nav-tab");
    tabs.forEach((tab) => {
      if (tab.dataset.aba === nomeAba) {
        tab.classList.add("ativo");
      } else {
        tab.classList.remove("ativo");
      }
    });

    if (this.componenteLog) {
      if (typeof this.componenteLog.rolarParaFinal === "function") {
        this.componenteLog.rolarParaFinal();
      }
    }
  }

  /**
   * Abre o modal de compartilhamento com QR Code dinâmico e link direto.
   */
  async abrirModalCompartilhar() {
    const modal = this.shadow.getElementById("r2rModalCompartilhar");
    if (!modal) return;

    const codigo = this.rede.codigoSalaAtual;
    if (!codigo) {
      alert("Nenhuma sala ativa no momento.");
      return;
    }

    modal.style.display = "flex";

    const inputCod = this.shadow.getElementById("r2rInputCodigoModal");
    if (inputCod) inputCod.value = codigo;

    let urlBase = await obterUrlBaseWeb();
    if (
      typeof window !== "undefined" &&
      window.location &&
      window.location.origin &&
      !window.location.origin.startsWith("chrome-extension:") &&
      !window.location.origin.startsWith("moz-extension:")
    ) {
      urlBase =
        window.location.origin + window.location.pathname.replace(/\/$/, "");
    }

    const inputDominio = this.shadow.getElementById("r2rInputDominioWeb");
    if (inputDominio) inputDominio.value = urlBase;

    const linkCompleto = `${urlBase}?sala=${encodeURIComponent(codigo)}${this.rede.nomeSalaAtual ? `&nomeSala=${encodeURIComponent(this.rede.nomeSalaAtual)}` : ""}${this.perfil.nome ? `&origem=${encodeURIComponent(this.perfil.nome)}` : ""}`;
    const inputLink = this.shadow.getElementById("r2rInputLinkMesa");
    if (inputLink) inputLink.value = linkCompleto;

    const containerQr = this.shadow.getElementById("r2rQrCodeContainer");
    if (containerQr) {
      try {
        containerQr.innerHTML =
          '<div class="r2r-qrcode-carregando">Gerando QR Code...</div>';
        const svgString = await gerarQrCodeSvg(linkCompleto, {
          corEscura: "#0b0f19",
          corClara: "#ffffff",
          largura: 180,
          margem: 1,
        });
        containerQr.innerHTML = svgString;
      } catch (erroQr) {
        containerQr.innerHTML = `<div style="color: #ef4444; font-size: 11px; padding: 8px;">Erro ao gerar QR Code: ${erroQr.message}</div>`;
      }
    }

    const secaoNativo = this.shadow.getElementById(
      "r2rSecaoCompartilharNativo",
    );
    if (secaoNativo) {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        secaoNativo.style.display = "block";
      } else {
        secaoNativo.style.display = "none";
      }
    }

    createIcons({
      icons: { QrCode, X, Copy, Key, Share2, Settings, Check },
      attrs: { width: 16, height: 16 },
      nameAttr: "data-lucide",
      root: modal,
    });
  }

  fecharModalCompartilhar() {
    const modal = this.shadow.getElementById("r2rModalCompartilhar");
    if (modal) modal.style.display = "none";
  }

  copiarLinkMesa() {
    const inputLink = this.shadow.getElementById("r2rInputLinkMesa");
    if (!inputLink || !inputLink.value) return;

    const texto = inputLink.value;
    const btn = this.shadow.getElementById("r2rBtnCopiarLinkMesa");
    const icone = this.shadow.getElementById("r2rIconeCopiarLink");
    const label = this.shadow.getElementById("r2rTextoCopiarLink");

    const feedback = () => {
      if (btn && label && icone) {
        btn.classList.add("copiado");
        icone.innerHTML = '<i data-lucide="check"></i>';
        label.textContent = "Copiado!";
        createIcons({ icons: { Check }, attrs: { width: 16, height: 16 }, nameAttr: 'data-lucide', root: icone });
        setTimeout(() => {
          btn.classList.remove("copiado");
          icone.innerHTML = '<i data-lucide="copy"></i>';
          label.textContent = "Copiar Link";
          createIcons({ icons: { Copy }, attrs: { width: 16, height: 16 }, nameAttr: 'data-lucide', root: icone });
        }, 1800);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(texto)
        .then(feedback)
        .catch(() => {
          prompt("Copie o link da mesa:", texto);
        });
    } else {
      prompt("Copie o link da mesa:", texto);
    }
  }

  copiarCodigoModal() {
    const codigo = this.rede.codigoSalaAtual;
    if (!codigo) return;

    const btn = this.shadow.getElementById("r2rBtnCopiarCodigoModal");
    const icone = this.shadow.getElementById("r2rIconeCopiarCodigoModal");
    const label = this.shadow.getElementById("r2rTextoCopiarCodigoModal");

    const feedback = () => {
      if (btn && label && icone) {
        btn.classList.add("copiado");
        icone.innerHTML = '<i data-lucide="check"></i>';
        label.textContent = "Copiado!";
        createIcons({ icons: { Check }, attrs: { width: 16, height: 16 }, nameAttr: 'data-lucide', root: icone });
        setTimeout(() => {
          btn.classList.remove("copiado");
          icone.innerHTML = '<i data-lucide="key"></i>';
          label.textContent = "Copiar Chave";
          createIcons({ icons: { Key }, attrs: { width: 16, height: 16 }, nameAttr: 'data-lucide', root: icone });
        }, 1800);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(codigo)
        .then(feedback)
        .catch(() => {
          prompt("Copie a chave de acesso da sala:", codigo);
        });
    } else {
      prompt("Copie a chave de acesso da sala:", codigo);
    }
  }

  async compartilharNativo() {
    const inputLink = this.shadow.getElementById("r2rInputLinkMesa");
    if (!inputLink || !inputLink.value) return;

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: `Mesa Ready2Roll: ${this.rede.nomeSalaAtual}`,
          text: `Entre na mesa de RPG "${this.rede.nomeSalaAtual}" no Ready2Roll:`,
          url: inputLink.value,
        });
      } catch (erro) {
        if (erro.name !== "AbortError") {
          console.warn("[Ready2Roll] Erro ao compartilhar:", erro);
        }
      }
    }
  }

  async salvarDominioWeb() {
    const inputDominio = this.shadow.getElementById("r2rInputDominioWeb");
    if (!inputDominio) return;

    const novaUrl = inputDominio.value.trim();
    if (novaUrl) {
      await salvarUrlBaseWeb(novaUrl);
      await this.abrirModalCompartilhar();
      alert("Domínio Web atualizado com sucesso!");
    }
  }

  /**
   * Alterna entre o modo flutuante (livre) e o modo barra lateral acoplada (split-screen).
   * @param {boolean} ativo
   */
  aplicarModoLateral(ativo) {
    this.modoExibicao = ativo ? "lateral" : "flutuante";
    const painel = this.shadow.getElementById("r2rPainel");
    const btnAcoplar = this.shadow.getElementById("r2rBtnAcoplar");

    if (ativo) {
      painel.classList.add("r2r-modo-lateral");
      painel.style.setProperty(
        "--r2r-largura-painel",
        `${this.larguraLateral}px`,
      );
      painel.style.left = "0px";
      painel.style.top = "0px";
      painel.style.right = "auto";

      if (btnAcoplar) {
        btnAcoplar.textContent = "🗖";
        btnAcoplar.title = "Desacoplar (Voltar para Janela Flutuante)";
      }
    } else {
      painel.classList.remove("r2r-modo-lateral");
      painel.style.removeProperty("--r2r-largura-painel");

      if (btnAcoplar) {
        btnAcoplar.textContent = "◧";
        btnAcoplar.title = "Acoplar na Barra Lateral Esquerda (Split-Screen)";
      }
    }

    salvarItem(CHAVES.MODO_EXIBICAO, this.modoExibicao);
  }

  /**
   * Gerencia o redimensionamento horizontal por arraste da borda direita da barra lateral.
   * Não altera o DOM da página anfitriã, evitando piscadas brancas na tela.
   */
  vincularRedimensionarLateral() {
    const alca = this.shadow.getElementById("r2rAlcaRedimensionar");
    const painel = this.shadow.getElementById("r2rPainel");
    if (!alca || !painel || this.ehModoPopUp) return;

    let redimensionando = false;

    const aoMover = (e) => {
      if (!redimensionando) return;
      const novaLargura = Math.max(320, Math.min(650, e.clientX));
      this.larguraLateral = novaLargura;
      painel.style.setProperty("--r2r-largura-painel", `${novaLargura}px`);
    };

    const aoSoltar = async () => {
      if (!redimensionando) return;
      redimensionando = false;
      alca.classList.remove("redimensionando");
      window.removeEventListener("mousemove", aoMover);
      window.removeEventListener("mouseup", aoSoltar);
      await salvarItem(CHAVES.LARGURA_LATERAL, this.larguraLateral);
    };

    alca.addEventListener("mousedown", (e) => {
      e.preventDefault();
      redimensionando = true;
      alca.classList.add("redimensionando");
      window.addEventListener("mousemove", aoMover);
      window.addEventListener("mouseup", aoSoltar);
    });
  }

  /**
   * Torna o botão minimizado (dock) livremente arrastável pela tela.
   * Diferencia clique simples (para abrir) de arraste (para reposicionar).
   */
  vincularArrastarDock() {
    const dock = this.shadow.getElementById("r2rDock");
    if (!dock) return;

    let arrastando = false;
    let mouseXInicial = 0;
    let mouseYInicial = 0;
    let offsetX = 0;
    let offsetY = 0;
    let moveu = false;

    const onMouseDown = (e) => {
      if (e.button !== 0) return; // Apenas clique com botão esquerdo
      arrastando = true;
      moveu = false;
      dock.classList.add("arrastando");

      const rect = dock.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      mouseXInicial = e.clientX;
      mouseYInicial = e.clientY;

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!arrastando) return;
      const dist = Math.hypot(
        e.clientX - mouseXInicial,
        e.clientY - mouseYInicial,
      );
      if (dist > 5) {
        moveu = true;
      }

      let novoX = e.clientX - offsetX;
      let novoY = e.clientY - offsetY;

      // Limita dentro da viewport
      const largura = dock.offsetWidth;
      const altura = dock.offsetHeight;
      novoX = Math.max(10, Math.min(window.innerWidth - largura - 10, novoX));
      novoY = Math.max(10, Math.min(window.innerHeight - altura - 10, novoY));

      dock.style.left = `${novoX}px`;
      dock.style.top = `${novoY}px`;
      dock.style.bottom = "auto";
      dock.style.right = "auto";
    };

    const onMouseUp = async () => {
      if (!arrastando) return;
      arrastando = false;
      dock.classList.remove("arrastando");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      if (moveu) {
        // Salva a nova posição se o usuário arrastou
        const rect = dock.getBoundingClientRect();
        this.posicaoDock = {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
        };
        await salvarItem(CHAVES.POSICAO_DOCK, this.posicaoDock);
      } else {
        // Se foi apenas um clique rápido sem arrastar, restaura a janela
        this.minimizar(false);
      }
    };

    dock.addEventListener("mousedown", onMouseDown);
  }

  minimizar(minimizar) {
    this.estaMinimizado = minimizar;
    const painel = this.shadow.getElementById("r2rPainel");
    const dock = this.shadow.getElementById("r2rDock");

    if (minimizar) {
      painel.style.display = "none";
      dock.style.display = "flex";
    } else {
      this.contadorMinimizado = 0;
      const badge = this.shadow.getElementById("r2rDockContador");
      if (badge) badge.style.display = "none";

      dock.style.display = "none";
      painel.style.display = "flex";
      this.componenteComando.focar();
    }
  }

  desacoplarEmPopUp() {
    const salaAtual = this.rede.codigoSalaAtual;
    const nomeSala = this.rede.nomeSalaAtual;

    if (
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.sendMessage
    ) {
      chrome.runtime.sendMessage({
        tipo: "abrir_popup_desacoplado",
        codigoSala: salaAtual,
        nomeSala: nomeSala,
      });
      this.fechar();
    } else {
      const query = salaAtual
        ? `?sala=${encodeURIComponent(salaAtual)}&nomeSala=${encodeURIComponent(nomeSala || "")}&popup=1`
        : "";
      window.open(
        `standalone/index.html${query}`,
        "ReadyToRollVTT",
        "width=440,height=680",
      );
      this.fechar();
    }
  }

  fechar() {
    if (this.elementoRaiz && this.elementoRaiz.parentNode) {
      this.elementoRaiz.parentNode.removeChild(this.elementoRaiz);
    }
  }

  vincularArrastar() {
    const cabecalho = this.shadow.getElementById("r2rCabecalho");
    const painel = this.shadow.getElementById("r2rPainel");
    if (!cabecalho || !painel || this.ehModoPopUp) return;

    const onMouseDown = (e) => {
      // Ignora arrastar se estiver fixado na barra lateral ou se clicou em botões
      if (this.modoExibicao === "lateral" || e.target.closest(".r2r-btn-icone"))
        return;

      this.arrastando = true;
      const rect = painel.getBoundingClientRect();
      this.offsetMouseX = e.clientX - rect.left;
      this.offsetMouseY = e.clientY - rect.top;

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!this.arrastando) return;

      let novoX = e.clientX - this.offsetMouseX;
      let novoY = e.clientY - this.offsetMouseY;

      // Limita à viewport
      const largura = painel.offsetWidth;
      const altura = painel.offsetHeight;
      novoX = Math.max(10, Math.min(window.innerWidth - largura - 10, novoX));
      novoY = Math.max(10, Math.min(window.innerHeight - altura - 10, novoY));

      painel.style.left = `${novoX}px`;
      painel.style.top = `${novoY}px`;
      painel.style.right = "auto";
    };

    const onMouseUp = () => {
      this.arrastando = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    cabecalho.addEventListener("mousedown", onMouseDown);
  }
}

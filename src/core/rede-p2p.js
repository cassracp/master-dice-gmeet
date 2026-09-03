/**
 * rede-p2p.js - Gerenciador de Comunicação P2P WebRTC Serverless via Trystero
 * 
 * Permite que participantes de uma mesma sala conectem-se diretamente entre si,
 * sem a necessidade de hospedar qualquer backend próprio ou expor chaves de API.
 */

import { joinRoom, selfId } from 'trystero/torrent';
import { obterHistoricoSala, salvarHistoricoSala } from './armazenamento.js';

const APP_ID = 'ready-to-roll-vtt-v2';

const CONFIGURACAO_P2P = {
  appId: APP_ID,
  relayUrls: [
    'wss://tracker.webtorrent.dev',
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.files.fm:7073/announce'
  ]
};

/**
 * Gera um código de sala criptograficamente único (64 bits de entropia).
 * Formato amigável: r2r-xxxx-xxxx-xxxx
 * @returns {string}
 */
export function gerarCodigoSalaUnico() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `r2r-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

export class GerenciadorRedeP2P {
  constructor() {
    this.salaAtual = null;
    this.codigoSalaAtual = null;
    this.nomeSalaAtual = 'Mesa Virtual';
    this.meuPerfil = { id: selfId || null, nome: 'Participante' };
    this.participantesConectados = new Map(); // peerId -> { id, nome }
    
    // Callbacks de Eventos da UI
    this.aoAtualizarParticipantes = () => {};
    this.aoReceberRolagem = () => {};
    this.aoAtualizarStatusConexao = () => {};

    // Ações Trystero
    this.transmissorRolagem = null;
    this.transmissorSolicitacaoHistorico = null;
    this.transmissorRespostaHistorico = null;
    this.transmissorPerfil = null;

    // Histórico de rolagens mantido em memória da sessão
    this.historicoSessao = [];
  }

  /**
   * Conecta a uma sala específica com o código fornecido.
   * @param {string} codigoSala 
   * @param {string} nomeUsuario 
   * @param {string} [nomeSala]
   */
  async conectarSala(codigoSala, nomeUsuario, nomeSala = '') {
    if (!codigoSala || codigoSala.trim() === '') {
      throw new Error('Código da sala não informado.');
    }

    const codigoLimpo = codigoSala.trim().toLowerCase();

    // Se já estiver exatamente nesta mesma sala ativa, não recria conexão
    if (this.salaAtual && this.codigoSalaAtual === codigoLimpo) {
      return;
    }

    // Se já estiver em uma sala diferente, desconecta antes
    if (this.salaAtual) {
      this.desconectar();
    }

    this.codigoSalaAtual = codigoLimpo;
    this.nomeSalaAtual = nomeSala && nomeSala.trim() ? nomeSala.trim() : 'Mesa Virtual';
    this.meuPerfil.nome = nomeUsuario || this.meuPerfil.nome;
    this.historicoSessao = [];

    // Carrega instantaneamente o histórico local persistido da sala (zero latência)
    try {
      const historicoSalvo = await obterHistoricoSala(this.codigoSalaAtual);
      if (Array.isArray(historicoSalvo) && historicoSalvo.length > 0) {
        historicoSalvo.forEach(r => {
          if (!this.historicoSessao.some(existente => existente.id === r.id)) {
            this.historicoSessao.push(r);
            this.aoReceberRolagem(r, false);
          }
        });
      }
    } catch (erroCache) {
      console.warn('[R2R P2P] Falha ao carregar cache local de histórico:', erroCache);
    }

    try {
      this.aoAtualizarStatusConexao('conectando', 'Conectando à rede P2P...');

      // Inicializa sala WebRTC via Trystero Torrent com trackers ativos
      this.salaAtual = joinRoom(CONFIGURACAO_P2P, this.codigoSalaAtual);
      this.meuPerfil.id = selfId || this.meuPerfil.id;

      // Configura canais de dados (ações com nomes de no máximo 12 bytes)
      const [enviarRolagem, receberRolagem] = this.salaAtual.makeAction('rolagem');
      const [solicitarHistorico, receberSolicitacaoHistorico] = this.salaAtual.makeAction('pedir_hist');
      const [enviarHistorico, receberHistorico] = this.salaAtual.makeAction('resp_hist');
      const [anunciarPerfil, receberPerfil] = this.salaAtual.makeAction('perfil');

      this.transmissorRolagem = enviarRolagem;
      this.transmissorSolicitacaoHistorico = solicitarHistorico;
      this.transmissorRespostaHistorico = enviarHistorico;
      this.transmissorPerfil = anunciarPerfil;

      // Trata novo participante conectado
      this.salaAtual.onPeerJoin(peerId => {
        console.log('[R2R P2P] Novo participante conectado:', peerId);
        // Anuncia meu perfil para o recém-chegado
        this.transmissorPerfil(this.meuPerfil, peerId);
      });

      // Trata participante desconectado
      this.salaAtual.onPeerLeave(peerId => {
        console.log('[R2R P2P] Participante desconectado:', peerId);
        this.participantesConectados.delete(peerId);
        this.aoAtualizarParticipantes(this.obterListaParticipantes());
      });

      // Recepção de perfil de outros membros
      receberPerfil((perfilRecebido, peerId) => {
        this.participantesConectados.set(peerId, {
          id: peerId,
          nome: perfilRecebido.nome || `Jogador-${peerId.substring(0, 4)}`
        });
        this.aoAtualizarParticipantes(this.obterListaParticipantes());

        // Se ainda não temos histórico, solicitamos ao primeiro peer conhecido
        if (this.historicoSessao.length === 0) {
          this.transmissorSolicitacaoHistorico({ requisitante: this.meuPerfil.id }, peerId);
        }
      });

      // Solicitação de histórico por novos membros
      receberSolicitacaoHistorico((_, peerId) => {
        if (this.historicoSessao.length > 0) {
          // Envia apenas rolagens que eram públicas ou direcionadas àquele peer
          const rolagensCompartilhaveis = this.historicoSessao.filter(r => r.visibilidade === 'publica');
          this.transmissorRespostaHistorico(rolagensCompartilhaveis, peerId);
        }
      });

      // Resposta com o histórico da sala recebido de outro participante
      receberHistorico((rolagens) => {
        if (Array.isArray(rolagens)) {
          let houveNovos = false;
          rolagens.forEach(r => {
            if (!this.historicoSessao.some(existente => existente.id === r.id)) {
              this.historicoSessao.push(r);
              this.aoReceberRolagem(r, false); // false = não tocar som de histórico carregado
              houveNovos = true;
            }
          });
          if (houveNovos && this.codigoSalaAtual) {
            salvarHistoricoSala(this.codigoSalaAtual, this.historicoSessao);
          }
        }
      });

      // Recepção de nova rolagem em tempo real
      receberRolagem((rolagem) => {
        if (!this.historicoSessao.some(existente => existente.id === rolagem.id)) {
          this.historicoSessao.push(rolagem);
          if (this.codigoSalaAtual) {
            salvarHistoricoSala(this.codigoSalaAtual, this.historicoSessao);
          }
          this.aoReceberRolagem(rolagem, true); // true = tocar efeito sonoro
        }
      });

      this.aoAtualizarStatusConexao('conectado', `Conectado na sala "${this.codigoSalaAtual}"`);
      this.aoAtualizarParticipantes(this.obterListaParticipantes());

    } catch (erro) {
      console.error('[R2R P2P] Falha ao conectar na sala:', erro);
      this.aoAtualizarStatusConexao('erro', 'Falha ao sincronizar via P2P.');
    }
  }

  /**
   * Envia uma rolagem para a rede respeitando o nível de visibilidade escolhido.
   * @param {object} dadosRolagem 
   * @param {'publica'|'direcionada'|'privada'} visibilidade 
   * @param {string[]} [destinatariosPeerIds=[]] 
   */
  transmitirRolagem(dadosRolagem, visibilidade = 'publica', destinatariosPeerIds = []) {
    const idRolagem = `r2r-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const pacoteRolagem = {
      id: idRolagem,
      autor: this.meuPerfil.nome,
      autorId: this.meuPerfil.id,
      visibilidade,
      destinatarios: destinatariosPeerIds,
      dados: dadosRolagem,
      timestamp: new Date().toISOString()
    };

    // Armazena no histórico local da sessão
    this.historicoSessao.push(pacoteRolagem);
    if (this.codigoSalaAtual) {
      salvarHistoricoSala(this.codigoSalaAtual, this.historicoSessao);
    }

    // Emite imediatamente para a UI local do autor
    this.aoReceberRolagem(pacoteRolagem, true);

    // Se for privada, encerra aqui (não transmite para ninguém)
    if (visibilidade === 'privada') {
      return pacoteRolagem;
    }

    // Se não estiver conectado à sala P2P, não tem como transmitir remotamente
    if (!this.salaAtual || !this.transmissorRolagem) {
      return pacoteRolagem;
    }

    try {
      if (visibilidade === 'publica') {
        // Envia para todos os membros conectados na sala
        this.transmissorRolagem(pacoteRolagem);
      } else if (visibilidade === 'direcionada' && destinatariosPeerIds.length > 0) {
        // Envia especificamente para a lista de peers selecionados
        this.transmissorRolagem(pacoteRolagem, destinatariosPeerIds);
      }
    } catch (erro) {
      console.error('[R2R P2P] Falha ao transmitir rolagem:', erro);
    }

    return pacoteRolagem;
  }

  /**
   * Atualiza o nome do usuário na sessão ativa e comunica aos peers.
   * @param {string} novoNome 
   */
  atualizarNomeUsuario(novoNome) {
    if (!novoNome) return;
    this.meuPerfil.nome = novoNome.trim();
    if (this.salaAtual && this.transmissorPerfil) {
      this.transmissorPerfil(this.meuPerfil);
    }
    this.aoAtualizarParticipantes(this.obterListaParticipantes());
  }

  /**
   * Retorna a lista de participantes conhecidos.
   */
  obterListaParticipantes() {
    const lista = [];
    // Adiciona a si mesmo primeiro
    lista.push({
      id: this.meuPerfil.id || 'eu',
      nome: `${this.meuPerfil.nome} (Você)`,
      ehVoce: true
    });

    for (const [id, participante] of this.participantesConectados.entries()) {
      lista.push({
        id,
        nome: participante.nome,
        ehVoce: false
      });
    }
    return lista;
  }

  /**
   * Desconecta da sala e limpa recursos.
   */
  desconectar() {
    if (this.salaAtual) {
      try {
        this.salaAtual.leave();
      } catch (e) {
        // Silencia erro ao fechar
      }
      this.salaAtual = null;
    }
    this.codigoSalaAtual = null;
    this.participantesConectados.clear();
    this.aoAtualizarStatusConexao('desconectado', 'Desconectado da sala');
    this.aoAtualizarParticipantes([]);
  }
}

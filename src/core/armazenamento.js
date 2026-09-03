/**
 * armazenamento.js - Camada Unificada de Persistência para o ReadyToRoll (R2R)
 * 
 * Abstrai chrome.storage.local com fallback transparente para localStorage,
 * permitindo que os mesmos módulos rodem tanto na extensão quanto no navegador web.
 */

const CHAVES = {
  NOME_USUARIO: 'r2r_nome_usuario',
  ULTIMA_SALA: 'r2r_ultima_sala',
  MACROS: 'r2r_macros',
  SOM_HABILITADO: 'r2r_som_habilitado',
  HISTORICO_LOCAL: 'r2r_historico_local',
  POSICAO_JANELA: 'r2r_posicao_janela',
  MODO_EXIBICAO: 'r2r_modo_exibicao',
  LARGURA_LATERAL: 'r2r_largura_lateral',
  POSICAO_DOCK: 'r2r_posicao_dock',
  NOME_SALA_ATUAL: 'r2r_nome_sala_atual',
  SESSAO_ATIVA: 'r2r_sessao_ativa',
  URL_BASE_WEB: 'r2r_url_base_web'
};

export const URL_WEB_PADRAO = 'https://ready-to-roll-vtt.vercel.app';


/**
 * Obtém valor armazenado.
 * @param {string} chave 
 * @param {*} valorPadrao 
 * @returns {Promise<*>}
 */
export async function obterItem(chave, valorPadrao = null) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([chave], (resultado) => {
          if (resultado && resultado[chave] !== undefined) {
            resolve(resultado[chave]);
          } else {
            resolve(valorPadrao);
          }
        });
      });
    } else if (typeof localStorage !== 'undefined') {
      const salvo = localStorage.getItem(chave);
      if (salvo !== null) {
        return JSON.parse(salvo);
      }
    }
  } catch (erro) {
    console.warn(`[ReadyToRoll] Falha ao recuperar chave "${chave}":`, erro);
  }
  return valorPadrao;
}

/**
 * Salva valor de forma assíncrona.
 * @param {string} chave 
 * @param {*} valor 
 * @returns {Promise<void>}
 */
export async function salvarItem(chave, valor) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [chave]: valor }, () => resolve());
      });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(chave, JSON.stringify(valor));
    }
  } catch (erro) {
    console.warn(`[ReadyToRoll] Falha ao salvar chave "${chave}":`, erro);
  }
}

/**
 * Recupera o perfil do usuário ou gera um padrão.
 */
export async function obterPerfilUsuario() {
  let nome = await obterItem(CHAVES.NOME_USUARIO, '');
  if (!nome) {
    const sufixo = Math.floor(1000 + Math.random() * 9000);
    nome = `Participante-${sufixo}`;
    await salvarItem(CHAVES.NOME_USUARIO, nome);
  }
  const ultimaSala = await obterItem(CHAVES.ULTIMA_SALA, '');
  const som = await obterItem(CHAVES.SOM_HABILITADO, true);
  const modoExibicao = await obterItem(CHAVES.MODO_EXIBICAO, 'flutuante');
  const larguraLateral = await obterItem(CHAVES.LARGURA_LATERAL, 390);
  const posicaoDock = await obterItem(CHAVES.POSICAO_DOCK, null);
  const ultimoNomeSala = await obterItem(CHAVES.NOME_SALA_ATUAL, '');
  return { nome, ultimaSala, som, modoExibicao, larguraLateral, posicaoDock, ultimoNomeSala };
}

/**
 * Recupera macros salvas.
 */
export async function obterMacros() {
  const macros = await obterItem(CHAVES.MACROS, null);
  if (!macros || !Array.isArray(macros)) {
    return [];
  }
  // Limpa eventuais presets legados persistidos para que o usuário comece limpo
  const temApenasPresetsLegados =
    macros.length > 0 &&
    macros.every((m) => ['m-1', 'm-2', 'm-3', 'm-4', 'm-5'].includes(m.id));
  if (temApenasPresetsLegados) {
    await salvarItem(CHAVES.MACROS, []);
    return [];
  }
  return macros;
}

/**
 * Salva lista de macros.
 * @param {Array<{id: string, nome: string, comando: string}>} macros 
 */
export async function salvarMacros(macros) {
  await salvarItem(CHAVES.MACROS, macros);
}

/**
 * Recupera histórico local persistido de uma sala específica.
 * @param {string} codigoSala 
 * @returns {Promise<Array>}
 */
export async function obterHistoricoSala(codigoSala) {
  if (!codigoSala) return [];
  const chave = `${CHAVES.HISTORICO_LOCAL}_${codigoSala.toLowerCase()}`;
  return await obterItem(chave, []);
}

/**
 * Persiste histórico de rolagens de uma sala específica (mantém as últimas 100 rolagens).
 * @param {string} codigoSala 
 * @param {Array} historico 
 */
export async function salvarHistoricoSala(codigoSala, historico) {
  if (!codigoSala || !Array.isArray(historico)) return;
  const chave = `${CHAVES.HISTORICO_LOCAL}_${codigoSala.toLowerCase()}`;
  const historicoLimitado = historico.slice(-100);
  await salvarItem(chave, historicoLimitado);
}

/**
 * Obtém a URL base web configurada ou o padrão.
 * @returns {Promise<string>}
 */
export async function obterUrlBaseWeb() {
  const url = await obterItem(CHAVES.URL_BASE_WEB, URL_WEB_PADRAO);
  return (url && typeof url === 'string') ? url.trim().replace(/\/$/, '') : URL_WEB_PADRAO;
}

/**
 * Salva a URL base web configurada.
 * @param {string} url 
 */
export async function salvarUrlBaseWeb(url) {
  if (url && typeof url === 'string') {
    await salvarItem(CHAVES.URL_BASE_WEB, url.trim().replace(/\/$/, ''));
  }
}

export { CHAVES };


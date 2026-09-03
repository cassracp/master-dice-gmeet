/**
 * som-dados.js - Sintetizador de Áudio Procedural para Rolagem de Dados
 * 
 * Cria efeitos sonoros de dados quicando em uma mesa/bandeja sem precisar
 * de arquivos externos pesados de mp3 ou wav, usando apenas a Web Audio API nativa.
 */

let contextoAudio = null;
let somHabilitado = true;

/**
 * Inicializa ou resume o contexto de áudio após interação do usuário.
 */
function obterContextoAudio() {
  if (!contextoAudio) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      contextoAudio = new AudioContextClass();
    }
  }
  if (contextoAudio && contextoAudio.state === 'suspended') {
    contextoAudio.resume();
  }
  return contextoAudio;
}

/**
 * Gera um único clique/impacto de dado na mesa.
 * @param {AudioContext} ctx 
 * @param {number} tempoInicio 
 * @param {number} frequenciaRessonancia 
 * @param {number} intensidade 
 */
function tocarImpactoDado(ctx, tempoInicio, frequenciaRessonancia, intensidade) {
  // Gerador de Ruído Branco para o choque físico
  const duracaoRuido = 0.04;
  const tamanhoBuffer = ctx.sampleRate * duracaoRuido;
  const bufferRuido = ctx.createBuffer(1, tamanhoBuffer, ctx.sampleRate);
  const dadosRuido = bufferRuido.getChannelData(0);

  for (let i = 0; i < tamanhoBuffer; i++) {
    dadosRuido[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
  }

  const fonteRuido = ctx.createBufferSource();
  fonteRuido.buffer = bufferRuido;

  // Filtro passa-faixa para simular a ressonância de resina / acrílico
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.frequency.setValueAtTime(frequenciaRessonancia, tempoInicio);
  filtro.Q.setValueAtTime(3.5, tempoInicio);

  // Controle de Volume / Ganho
  const ganho = ctx.createGain();
  ganho.gain.setValueAtTime(intensidade * 0.6, tempoInicio);
  ganho.gain.exponentialRampToValueAtTime(0.001, tempoInicio + duracaoRuido);

  fonteRuido.connect(filtro);
  filtro.connect(ganho);
  ganho.connect(ctx.destination);

  fonteRuido.start(tempoInicio);
  fonteRuido.stop(tempoInicio + duracaoRuido);
}

/**
 * Executa a sequência procedural completa de dados rolando e quicando.
 * @param {number} [quantidadeImpactos=4]
 */
export function tocarSomRolagem(quantidadeImpactos = 4) {
  dispararFeedbackHaptico([15, 35, 20]);
  if (!somHabilitado) return;

  try {
    const ctx = obterContextoAudio();
    if (!ctx) return;

    const agora = ctx.currentTime;
    let tempoAtual = agora;

    // Sequência de 3 a 5 impactos decrescentes simulando o dado quicando
    const totalImpactos = Math.max(3, Math.min(quantidadeImpactos, 6));

    for (let i = 0; i < totalImpactos; i++) {
      const delay = (i === 0) ? 0 : 0.06 + Math.random() * 0.05 + (i * 0.03);
      tempoAtual += delay;

      // Frequência varia levemente para cada quique
      const frequencia = 650 + (Math.random() * 300);
      const intensidade = Math.pow(0.7, i); // Vai diminuindo a força

      tocarImpactoDado(ctx, tempoAtual, frequencia, intensidade);
    }
  } catch (erro) {
    console.warn('[ReadyToRoll] Erro ao reproduzir som sintetizado:', erro);
  }
}

/**
/**
 * Dispara feedback háptico no dispositivo móvel (se suportado pelo navegador).
 * @param {number|number[]} padrao 
 */
export function dispararFeedbackHaptico(padrao = [18, 35, 22]) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(padrao);
    }
  } catch {
    // Ignora silenciosamente caso o dispositivo ou navegador restrinja vibração
  }
}

/**
 * Dispara um toque háptico ultracurto para cliques em botões.
 */
export function dispararCliqueTabilHaptico() {
  dispararFeedbackHaptico(12);
}

/**
 * Alterna a ativação do áudio.
 * @param {boolean} ativo 
 */
export function configurarSom(ativo) {
  somHabilitado = Boolean(ativo);
}

export function obterEstadoSom() {
  return somHabilitado;
}


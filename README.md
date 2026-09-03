# 🎲 ReadyToRoll (R2R) - Virtual Tabletop de Dados

<div align="center">
  <p><strong>Mesa Virtual (VTT) ultraleve, moderna e serverless para rolagem de dados em tempo real via P2P WebRTC.</strong></p>
  <p>Funciona no <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, <strong>Mozilla Firefox</strong> e como <strong>Web App PWA</strong> no celular, tablet ou computador.</p>

  <p>
    <img src="https://img.shields.io/badge/Versão-2.0.0-8b5cf6?style=for-the-badge" alt="Versão 2.0.0" />
    <img src="https://img.shields.io/badge/Licença-MIT-10b981?style=for-the-badge" alt="Licença MIT" />
    <img src="https://img.shields.io/badge/P2P-WebRTC-06b6d4?style=for-the-badge" alt="WebRTC P2P" />
    <img src="https://img.shields.io/badge/Multi--Platform-Chrome%20|%20Firefox%20|%20Web%20PWA-f59e0b?style=for-the-badge" alt="Multi-Platform" />
  </p>
</div>

---

## 🌟 O que é o ReadyToRoll?

O **ReadyToRoll (R2R)** é uma mesa virtual de dados projetada para sessões de RPG de mesa (D&D, Tormenta20, Ordem Paranormal, Call of Cthulhu, Pathfinder, etc.). 

Diferente de plataformas pesadas e complexas, o R2R é **serverless e descentralizado**:
- A comunicação ocorre diretamente entre os navegadores dos participantes através de **WebRTC P2P**.
- **Sem cadastros, sem servidores dedicados e sem chaves de API**: basta compartilhar o código da sessão, o link direto ou escanear o **QR Code**!
- O mestre pode estar no Google Meet pelo computador enquanto os jogadores usam o smartphone como controle de dados físico.

---

## ✨ Principais Recursos

- 🌐 **Sincronização Serverless P2P em Tempo Real:** Conexão direta entre navegadores via WebRTC com histórico compartilhado e lista de presença automática.
- 📱 **Conexão PC-Mobile por QR Code:** O mestre ou jogador no PC clica em "Conectar Celular" e exibe um QR Code na tela. Quem estiver no celular só aponta a câmera para entrar direto na mesa!
- 📲 **Interface Mobile Responsiva com Abas (Bottom Nav):** Em smartphones, o VTT organiza o espaço em 3 abas fluidas para o polegar:
  - **🎲 Dados:** Grade de dados táteis grandes (d4 a d100), modificadores e comando rápido.
  - **📜 Histórico:** Feed completo de rolagens com *badge* de notificação para novas rolagens não vistas.
  - **⚡ Macros:** Seus atalhos personalizados de ataques, perícias e magias.
- 📳 **Vibração Tátil (Feedback Háptico):** Sinta o impacto dos dados vibrando fisicamente no smartphone ao rolar (`navigator.vibrate`).
- ⚡ **PWA Instalável:** Pode ser adicionado à Tela de Início no iPhone (Safari) e Android (Chrome) para funcionar em tela cheia sem barras de navegador.
- 🪟 **Múltiplos Modos de Visualização no PC:**
  - **Janela Flutuante com Shadow DOM:** Design em *Dark Glassmorphism*, arrastável, minimizável para um dock compacto e 100% isolado do CSS da página.
  - **Barra Lateral Acoplada (Split-Screen):** Divide a tela com o Google Meet ou mapa sem cobrir o conteúdo.
  - **Pop-up Desacoplável:** Ideal para quem usa dois monitores.
- 👁️ **3 Níveis de Visibilidade de Rolagem:**
  1. **Pública:** Todos na mesa veem o resultado.
  2. **Direcionada:** Visível apenas para os participantes selecionados.
  3. **Privada:** Visível exclusivamente para quem rolou (ideal para testes secretos do mestre).
- 🔊 **Efeitos Sonoros Procedurais:** Som de dados quicando gerado via **Web Audio API** nativa (sem arquivos pesados de áudio).
- ★ **Destaque Visual para Acertos e Falhas Críticas:** Iluminação dourada para 20 natural e vermelha para 1 natural no d20.
- ⌨️ **Atalho de Teclado:** Pressione `Alt+R` a qualquer momento para abrir ou recolher o VTT.

---

## 🚀 Como Usar e Instalar

### 1. No Google Chrome / Microsoft Edge (Extensão)
1. Baixe ou clone este repositório e execute `npm run build`.
2. Acesse `chrome://extensions/` ou `edge://extensions/`.
3. Ative o **"Modo do desenvolvedor"** no canto superior direito.
4. Clique em **"Carregar sem compactação"** e selecione a pasta **`dist/chrome/`**.
5. *(Opcional)* Você também pode enviar o pacote pronto **`dist/ready-to-roll-chrome.zip`** para a Chrome Web Store.

### 2. No Mozilla Firefox (Extensão)
1. Após executar `npm run build`, abra o Firefox e acesse:
   ```text
   about:debugging#/runtime/this-firefox
   ```
2. Clique em **"Carregar extensão temporária..."**.
3. Selecione o arquivo **`dist/firefox/manifest.json`** (ou o arquivo **`dist/ready-to-roll-firefox.zip`**).
4. Para publicar gratuitamente na loja oficial da Mozilla (AMO), basta fazer o upload de `dist/ready-to-roll-firefox.zip` no [addons.mozilla.org](https://addons.mozilla.org/developers/).

### 3. Na Web e Celular (Vercel / PWA)
- **Deploy Próprio:** Conecte o repositório no [Vercel](https://vercel.com). O arquivo `vercel.json` na raiz já configura tudo automaticamente com HTTPS gratuito.
- **Auto-conexão via URL:** Acesse a URL com os parâmetros da mesa:
  ```text
  https://seu-dominio.vercel.app/?sala=r2r-a8f2-9c41-7e3b&nome=Gimli
  ```
  O ReadyToRoll entrará imediatamente na mesa sem precisar de digitação.

---

## 🎲 Guia de Notações do Motor de Dados

O motor matemático do ReadyToRoll suporta notações avançadas de RPG de mesa:

| Comando | Descrição |
| :--- | :--- |
| `1d20+5 # Ataque Espada` | Rola 1d20 somando 5 com rótulo descritivo |
| `2d20kh1+4 # Vantagem` | Rola dois d20 e mantém o maior (*Keep Highest*) |
| `2d20kl1+2 # Desvantagem` | Rola dois d20 e mantém o menor (*Keep Lowest*) |
| `4d6kh3` | Rola 4d6 e mantém os 3 maiores (geração de atributos) |
| `4d6dl1` | Rola 4d6 e descarta o menor (*Drop Lowest*) |
| `1d10!` | Dado explosivo: rola outro dado adicional se tirar o valor máximo |
| `1d6r<=2` | Re-rola o dado se o resultado for 1 ou 2 |
| `(1d8+3)*2 + 1d4 # Crítico` | Expressões matemáticas complexas com parênteses |
| `1d20+6, 2d6+3` | Múltiplas rolagens simultâneas separadas por vírgula |

---

## 🛠️ Comandos de Desenvolvimento

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local de desenvolvimento Vite |
| `npm run build` | Pipeline multi-target: compila `dist/chrome`, `dist/firefox`, `dist/web` e gera os zips |
| `npm run test` | Executa a suíte de testes unitários do motor de rolagem |
| `.\publicar.ps1` | Script interativo PowerShell para versionamento e build local de distribuição |
| `.\icon.ps1` | Script PowerShell para redimensionar e atualizar os ícones em todas as resoluções |

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para obter mais informações.

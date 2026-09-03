# ðŸŽ² ReadyToRoll (R2R) - Virtual Tabletop de Dados

<div align="center">
  <p><strong>Mesa Virtual (VTT) ultraleve, moderna e serverless para rolagem de dados em tempo real via P2P WebRTC.</strong></p>
  <p>Funciona no <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, <strong>Mozilla Firefox</strong> e como <strong>Web App PWA</strong> no celular, tablet ou computador.</p>

  <p>
    <img src="https://img.shields.io/badge/VersÃ£o-2.0.0-8b5cf6?style=for-the-badge" alt="VersÃ£o 2.0.0" />
    <img src="https://img.shields.io/badge/LicenÃ§a-MIT-10b981?style=for-the-badge" alt="LicenÃ§a MIT" />
    <img src="https://img.shields.io/badge/P2P-WebRTC-06b6d4?style=for-the-badge" alt="WebRTC P2P" />
    <img src="https://img.shields.io/badge/Multi--Platform-Chrome%20|%20Firefox%20|%20Web%20PWA-f59e0b?style=for-the-badge" alt="Multi-Platform" />
  </p>
</div>

---

## ðŸŒŸ O que Ã© o ReadyToRoll?

O **ReadyToRoll (R2R)** Ã© uma mesa virtual de dados projetada para sessÃµes de RPG de mesa (D&D, Tormenta20, Ordem Paranormal, Call of Cthulhu, Pathfinder, etc.). 

Diferente de plataformas pesadas e complexas, o R2R Ã© **serverless e descentralizado**:
- A comunicaÃ§Ã£o ocorre diretamente entre os navegadores dos participantes atravÃ©s de **WebRTC P2P**.
- **Sem cadastros, sem servidores dedicados e sem chaves de API**: basta compartilhar o cÃ³digo da sessÃ£o, o link direto ou escanear o **QR Code**!
- O mestre pode estar no Google Meet pelo computador enquanto os jogadores usam o smartphone como controle de dados fÃ­sico.

---

## âœ¨ Principais Recursos

- ðŸŒ **SincronizaÃ§Ã£o Serverless P2P em Tempo Real:** ConexÃ£o direta entre navegadores via WebRTC com histÃ³rico compartilhado e lista de presenÃ§a automÃ¡tica.
- ðŸ“± **ConexÃ£o PC-Mobile por QR Code:** O mestre ou jogador no PC clica em "Conectar Celular" e exibe um QR Code na tela. Quem estiver no celular sÃ³ aponta a cÃ¢mera para entrar direto na mesa!
- ðŸ“² **Interface Mobile Responsiva com Abas (Bottom Nav):** Em smartphones, o VTT organiza o espaÃ§o em 3 abas fluidas para o polegar:
  - **ðŸŽ² Dados:** Grade de dados tÃ¡teis grandes (d4 a d100), modificadores e comando rÃ¡pido.
  - **ðŸ“œ HistÃ³rico:** Feed completo de rolagens com *badge* de notificaÃ§Ã£o para novas rolagens nÃ£o vistas.
  - **âš¡ Macros:** Seus atalhos personalizados de ataques, perÃ­cias e magias.
- ðŸ“³ **VibraÃ§Ã£o TÃ¡til (Feedback HÃ¡ptico):** Sinta o impacto dos dados vibrando fisicamente no smartphone ao rolar (`navigator.vibrate`).
- âš¡ **PWA InstalÃ¡vel:** Pode ser adicionado Ã  Tela de InÃ­cio no iPhone (Safari) e Android (Chrome) para funcionar em tela cheia sem barras de navegador.
- ðŸªŸ **MÃºltiplos Modos de VisualizaÃ§Ã£o no PC:**
  - **Janela Flutuante com Shadow DOM:** Design em *Dark Glassmorphism*, arrastÃ¡vel, minimizÃ¡vel para um dock compacto e 100% isolado do CSS da pÃ¡gina.
  - **Barra Lateral Acoplada (Split-Screen):** Divide a tela com o Google Meet ou mapa sem cobrir o conteÃºdo.
  - **Pop-up DesacoplÃ¡vel:** Ideal para quem usa dois monitores.
- ðŸ‘ï¸ **3 NÃ­veis de Visibilidade de Rolagem:**
  1. **PÃºblica:** Todos na mesa veem o resultado.
  2. **Direcionada:** VisÃ­vel apenas para os participantes selecionados.
  3. **Privada:** VisÃ­vel exclusivamente para quem rolou (ideal para testes secretos do mestre).
- ðŸ”Š **Efeitos Sonoros Procedurais:** Som de dados quicando gerado via **Web Audio API** nativa (sem arquivos pesados de Ã¡udio).
- â˜… **Destaque Visual para Acertos e Falhas CrÃ­ticas:** IluminaÃ§Ã£o dourada para 20 natural e vermelha para 1 natural no d20.
- âŒ¨ï¸ **Atalho de Teclado:** Pressione `Alt+R` a qualquer momento para abrir ou recolher o VTT.

---

## ðŸš€ Como Usar e Instalar

### 1. No Google Chrome / Microsoft Edge (ExtensÃ£o)
1. Baixe ou clone este repositÃ³rio e execute `npm run build`.
2. Acesse `chrome://extensions/` ou `edge://extensions/`.
3. Ative o **"Modo do desenvolvedor"** no canto superior direito.
4. Clique em **"Carregar sem compactaÃ§Ã£o"** e selecione a pasta **`dist/chrome/`**.
5. *(Opcional)* VocÃª tambÃ©m pode enviar o pacote pronto **`dist/ready-to-roll-chrome.zip`** para a Chrome Web Store.

### 2. No Mozilla Firefox (ExtensÃ£o)
1. ApÃ³s executar `npm run build`, abra o Firefox e acesse:
   ```text
   about:debugging#/runtime/this-firefox
   ```
2. Clique em **"Carregar extensÃ£o temporÃ¡ria..."**.
3. Selecione o arquivo **`dist/firefox/manifest.json`** (ou o arquivo **`dist/ready-to-roll-firefox.zip`**).
4. Para publicar gratuitamente na loja oficial da Mozilla (AMO), basta fazer o upload de `dist/ready-to-roll-firefox.zip` no [addons.mozilla.org](https://addons.mozilla.org/developers/).

### 3. Na Web e Celular (Vercel / PWA)
- **Deploy PrÃ³prio:** Conecte o repositÃ³rio no [Vercel](https://vercel.com). O arquivo `vercel.json` na raiz jÃ¡ configura tudo automaticamente com HTTPS gratuito.
- **Auto-conexÃ£o via URL:** Acesse a URL com os parÃ¢metros da mesa:
  ```text
  https://seu-dominio.vercel.app/?sala=r2r-a8f2-9c41-7e3b&nome=Gimli
  ```
  O ReadyToRoll entrarÃ¡ imediatamente na mesa sem precisar de digitaÃ§Ã£o.

---

## ðŸŽ² Guia de NotaÃ§Ãµes do Motor de Dados

O motor matemÃ¡tico do ReadyToRoll suporta notaÃ§Ãµes avanÃ§adas de RPG de mesa:

| Comando | DescriÃ§Ã£o |
| :--- | :--- |
| `1d20+5 # Ataque Espada` | Rola 1d20 somando 5 com rÃ³tulo descritivo |
| `2d20kh1+4 # Vantagem` | Rola dois d20 e mantÃ©m o maior (*Keep Highest*) |
| `2d20kl1+2 # Desvantagem` | Rola dois d20 e mantÃ©m o menor (*Keep Lowest*) |
| `4d6kh3` | Rola 4d6 e mantÃ©m os 3 maiores (geraÃ§Ã£o de atributos) |
| `4d6dl1` | Rola 4d6 e descarta o menor (*Drop Lowest*) |
| `1d10!` | Dado explosivo: rola outro dado adicional se tirar o valor mÃ¡ximo |
| `1d6r<=2` | Re-rola o dado se o resultado for 1 ou 2 |
| `(1d8+3)*2 + 1d4 # CrÃ­tico` | ExpressÃµes matemÃ¡ticas complexas com parÃªnteses |
| `1d20+6, 2d6+3` | MÃºltiplas rolagens simultÃ¢neas separadas por vÃ­rgula |

---

## ðŸ› ï¸ Comandos de Desenvolvimento

| Comando | DescriÃ§Ã£o |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local de desenvolvimento Vite |
| `npm run build` | Pipeline multi-target: compila `dist/chrome`, `dist/firefox`, `dist/web` e gera os zips |
| `npm run test` | Executa a suÃ­te de testes unitÃ¡rios do motor de rolagem |
| `.\publicar.ps1` | Script interativo PowerShell para versionamento e build local de distribuiÃ§Ã£o |
| `.\icon.ps1` | Script PowerShell para redimensionar e atualizar os Ã­cones em todas as resoluÃ§Ãµes |

---

## ðŸ“„ LicenÃ§a

DistribuÃ­do sob a licenÃ§a **MIT**. Consulte o arquivo [LICENSE](LICENSE) para obter mais informaÃ§Ãµes.

# 🎲 Master Dice for Google Meet

<div align="center">
  <p><strong>A seamless, powerful, and secure dice roller for Google Meet chats.</strong></p>
  <sub>🇧🇷 <a href="#-português">Português</a> | 🇺🇸 <a href="#-english">English</a></sub>
</div>

---

## 🇧🇷 Português

Uma extensão de navegador leve e poderosa que transforma o chat do Google Meet em um sistema completo de rolagem de dados para sessões de RPG de mesa. 

O grande diferencial do **Master Dice** é o modelo centralizado (Mestre-Servidor): **Apenas o Mestre precisa instalar a extensão**. O script monitora o chat silenciosamente e responde de forma automatizada (estilo Rollem) quando qualquer jogador digita uma notação de dado.

### ✨ Recursos Principais
- **Instalação Única:** Seus jogadores não precisam baixar ou configurar nada. Eles digitam no chat do celular ou PC, e a sua extensão escuta e responde por eles.
- **Natural Language Parsing:** Role dados no meio de uma frase naturalmente. Ex: `"Eu ataco o orc com minha espada, 1d20 + 5 de dano"`. A extensão extrai automaticamente o `1d20 + 5`.
- **Anti-Fraude e Segurança:** Usa `window.crypto.getRandomValues` em vez do tradicional `Math.random()` para garantir entropia criptográfica e aleatoriedade verdadeira nos dados.
- **Calculadora Embutida:** Resolve contas matemáticas instantaneamente com o prefixo `r`.

### 🚀 Como Instalar

Como esta extensão não está (ainda) na Chrome Web Store, a instalação é feita manualmente:
1. Baixe o código fonte deste repositório (ZIP) e extraia em uma pasta.
2. Abra o Google Chrome ou Edge e acesse a página de extensões (`chrome://extensions/` ou `edge://extensions/`).
3. Ative o **"Modo do desenvolvedor"** no canto superior direito.
4. Clique no botão **"Carregar sem compactação"** (Load unpacked) e selecione a pasta onde você extraiu os arquivos.
5. Pronto! Basta entrar em uma chamada do Google Meet. A extensão funcionará automaticamente.

### 📖 Guia de Comandos e Notações

O motor de dados é extremamente robusto. Veja tudo o que você e seus jogadores podem digitar no chat:

#### 1. Rolagens Naturais e Matemáticas
Você pode digitar os dados isolados ou no meio de frases:
* `1d20` ➔ Rola um dado de 20 faces.
* `2d6 + 3` ➔ Rola dois dados de 6 faces e soma 3 ao total.
* `1d8 * 2` ➔ Rola um dado de 8 e multiplica por 2.
* `Ataque com espada! 1d20+4` ➔ Lê a frase e rola o dado automaticamente.
* `[2d10 + 5]` ➔ Use colchetes se quiser isolar uma rolagem muito complexa no meio de um texto para garantir que ela seja lida corretamente.

#### 2. Modo Calculadora
Você pode usar a extensão para resolver matemática básica instantaneamente usando a letra `r` antes da conta:
* `r 2+2` ➔ Retorna `4`.
* `r (10 * 2) / 4` ➔ Retorna `5`.
* `r 1d20 + 5` ➔ Rola o dado e calcula tudo (também pode ser usado se a rolagem natural falhar em capturar algum formato muito estranho).

#### 3. Vantagem, Desvantagem (Keep e Drop)
* `2d20kh1` ➔ Rola 2d20 e **MANTÉM O MAIOR** (Vantagem - *Keep Highest*).
* `2d20kl1` ➔ Rola 2d20 e **MANTÉM O MENOR** (Desvantagem - *Keep Lowest*).
* `4d6kh3` ➔ Rola 4d6 e mantém os 3 maiores (Criação de personagem no D&D).
* `4d6dl1` ➔ Rola 4d6 e **DESCARTA O MENOR** (*Drop Lowest* - O mesmo que o de cima).
* `4d6dh1` ➔ Rola 4d6 e **DESCARTA O MAIOR** (*Drop Highest*).

#### 4. Dados Explosivos (Exploding Dice)
Se o valor rolado atingir um limite, um dado extra é rolado e somado!
* `4d6!` ➔ Explode (rola de novo) se o dado cair no valor MÁXIMO (6).
* `4d6!>=5` ➔ Explode se o valor for maior ou igual a 5.
* `4d6!L2` ➔ Explode no máximo 2 vezes por dado (limite de explosão).

#### 5. Rerrolagens (Rerolls)
Role novamente um dado e descarte o resultado antigo se a condição for atendida.
* `4d6r1` ➔ Rerrola qualquer dado que cair 1 (*Halfling Luck* no D&D).
* `4d6r<3` ➔ Rerrola valores menores que 3.
* `4d6r1L1` ➔ Rerrola 1s, mas com limite máximo de 1 vez por dado.

---

## 🇺🇸 English

A lightweight and powerful browser extension that turns the Google Meet chat into a complete dice rolling system for tabletop RPG sessions.

The big feature of **Master Dice** is its centralized model (Master-Server architecture): **Only the Game Master needs to install the extension**. The script silently monitors the chat and replies automatically (Rollem bot style) whenever any player types a dice notation.

### ✨ Key Features
- **Single Installation:** Your players don't need to download or configure anything. They type in the chat from their phone or PC, and your extension listens and replies for them.
- **Natural Language Parsing:** Roll dice in the middle of a sentence. E.g., `"I attack the orc with my sword, 1d20 + 5 damage"`. The extension automatically extracts `1d20 + 5`.
- **Anti-Fraud & Security:** Uses `window.crypto.getRandomValues` instead of the traditional `Math.random()` to guarantee cryptographic entropy and true randomness for the dice.
- **Built-in Calculator:** Instantly solve math equations by prefixing them with the letter `r`.

### 🚀 How to Install

Since this extension is not (yet) on the Chrome Web Store, it must be installed manually:
1. Download the source code from this repository (ZIP) and extract it to a folder.
2. Open Google Chrome or Edge and go to the extensions page (`chrome://extensions/` or `edge://extensions/`).
3. Turn on **"Developer mode"** in the top right corner.
4. Click the **"Load unpacked"** button and select the folder where you extracted the files.
5. That's it! Just join a Google Meet call and the extension will work automatically.

### 📖 Commands and Notation Guide

The dice engine is extremely robust. Here is everything you and your players can type in the chat:

#### 1. Natural and Math Rolls
You can type dice by themselves or in the middle of sentences:
* `1d20` ➔ Rolls a 20-sided die.
* `2d6 + 3` ➔ Rolls two 6-sided dice and adds 3 to the total.
* `1d8 * 2` ➔ Rolls an 8-sided die and multiplies by 2.
* `Sword attack! 1d20+4` ➔ Reads the sentence and rolls the dice automatically.
* `[2d10 + 5]` ➔ Use brackets to isolate a very complex roll in the middle of messy text to ensure it's parsed correctly.

#### 2. Calculator Mode
You can use the extension to solve basic math instantly by using the letter `r` before the equation:
* `r 2+2` ➔ Returns `4`.
* `r (10 * 2) / 4` ➔ Returns `5`.
* `r 1d20 + 5` ➔ Rolls the dice and calculates everything (can also be used as a fallback command if the natural parser misses a strange format).

#### 3. Advantage, Disadvantage (Keep and Drop)
* `2d20kh1` ➔ Rolls 2d20 and **KEEPS THE HIGHEST** (Advantage).
* `2d20kl1` ➔ Rolls 2d20 and **KEEPS THE LOWEST** (Disadvantage).
* `4d6kh3` ➔ Rolls 4d6 and keeps the 3 highest (D&D Character Creation).
* `4d6dl1` ➔ Rolls 4d6 and **DROPS THE LOWEST** (Same as above).
* `4d6dh1` ➔ Rolls 4d6 and **DROPS THE HIGHEST**.

#### 4. Exploding Dice
If a die rolls a specific target, an extra die is rolled and added to the total!
* `4d6!` ➔ Explodes (rolls again) if the die hits the MAXIMUM value (6).
* `4d6!>=5` ➔ Explodes if the value is greater than or equal to 5.
* `4d6!L2` ➔ Explodes up to 2 times per die (explosion limit).

#### 5. Rerolls
Reroll a die and drop the old result if a condition is met.
* `4d6r1` ➔ Rerolls any die that lands on 1 (D&D Halfling Luck).
* `4d6r<3` ➔ Rerolls values lower than 3.
* `4d6r1L1` ➔ Rerolls 1s, but limits the reroll to a maximum of 1 time per die.

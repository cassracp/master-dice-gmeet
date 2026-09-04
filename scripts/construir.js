/**
 * scripts/construir.js - Pipeline de Compilação Multi-Target do Ready2Roll (R2R)
 *
 * Compila e empacota automaticamente para três alvos com um único comando:
 * 1. dist/chrome/   - Extensão Manifest V3 para Google Chrome e Microsoft Edge.
 * 2. dist/firefox/  - Extensão Manifest V3 para Mozilla Firefox (AMO) com ID gecko e sidebar_action.
 * 3. dist/web/      - Web App PWA estático pronto para deploy na Vercel / GitHub Pages.
 * 4. dist/*.zip     - Pacotes compactados prontos para upload nas lojas oficiais.
 */

import { build } from "vite";
import { resolve } from "path";
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const archiver = require("archiver");

/**
 * Cria arquivo ZIP de forma assíncrona e multiplataforma.
 * @param {string} diretorioFonte
 * @param {string} arquivoDestino
 * @returns {Promise<number>}
 */
function criarArquivoZip(diretorioFonte, arquivoDestino) {
  return new Promise((resolvePromise, reject) => {
    const streamSaida = fs.createWriteStream(arquivoDestino);
    const compactador =
      typeof archiver === "function"
        ? archiver("zip", { zlib: { level: 9 } })
        : new archiver.ZipArchive({ zlib: { level: 9 } });

    streamSaida.on("close", () => resolvePromise(compactador.pointer()));
    compactador.on("error", (erro) => reject(erro));

    compactador.pipe(streamSaida);
    compactador.directory(diretorioFonte, false);
    compactador.finalize();
  });
}

/**
 * Normaliza a estrutura de pastas do HTML do standalone.
 * @param {string} pastaDestino
 */
function normalizarEstruturaStandalone(pastaDestino) {
  const caminhoSrcStandalone = resolve(
    pastaDestino,
    "src/standalone/index.html",
  );
  const caminhoFinalStandalone = resolve(pastaDestino, "standalone/index.html");

  if (fs.existsSync(caminhoSrcStandalone)) {
    if (!fs.existsSync(resolve(pastaDestino, "standalone"))) {
      fs.mkdirSync(resolve(pastaDestino, "standalone"), { recursive: true });
    }
    let html = fs.readFileSync(caminhoSrcStandalone, "utf-8");
    html = html.replaceAll("../../assets/", "../assets/");
    fs.writeFileSync(caminhoFinalStandalone, html, "utf-8");
    fs.rmSync(resolve(pastaDestino, "src"), { recursive: true, force: true });
  }
}

/**
 * Normaliza a estrutura de pastas do HTML da Web.
 * @param {string} pastaDestino
 */
function normalizarEstruturaWeb(pastaDestino) {
  const caminhoSrcWeb = resolve(pastaDestino, "src/web/index.html");
  const caminhoFinalWeb = resolve(pastaDestino, "index.html");

  if (fs.existsSync(caminhoSrcWeb)) {
    let html = fs.readFileSync(caminhoSrcWeb, "utf-8");
    html = html.replaceAll("../../assets/", "./assets/");
    fs.writeFileSync(caminhoFinalWeb, html, "utf-8");
    fs.rmSync(resolve(pastaDestino, "src"), { recursive: true, force: true });
  }
}

/**
 * Compila o alvo de Extensão (Chrome ou Firefox).
 * @param {string} nomeAlvo
 * @param {string} pastaSaida
 * @param {string} arquivoManifestoFonte
 */
async function compilarAlvoExtensao(
  nomeAlvo,
  pastaSaida,
  arquivoManifestoFonte,
) {
  console.log(`\n📦 [${nomeAlvo}] Compilando Standalone e Service Worker...`);
  await build({
    configFile: false,
    base: "./",
    build: {
      outDir: pastaSaida,
      emptyOutDir: false,
      target: "esnext",
      rollupOptions: {
        input: {
          standalone: resolve("src/standalone/index.html"),
          "service-worker": resolve("src/background/service-worker.js"),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === "service-worker") {
              return "background/service-worker.js";
            }
            return "assets/[name]-[hash].js";
          },
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },
    },
  });

  console.log(
    `💉 [${nomeAlvo}] Compilando Content Script Injetor (IIFE isolado)...`,
  );
  await build({
    configFile: false,
    build: {
      outDir: resolve(pastaSaida, "content"),
      emptyOutDir: false,
      target: "esnext",
      lib: {
        entry: resolve("src/content/injetor.js"),
        name: "ReadyToRollInjetor",
        formats: ["iife"],
        fileName: () => "injetor.js",
      },
    },
  });

  // Copia Assets e Manifesto
  if (fs.existsSync("src/assets")) {
    fs.cpSync("src/assets", resolve(pastaSaida, "assets"), { recursive: true });
  }
  if (fs.existsSync(arquivoManifestoFonte)) {
    fs.copyFileSync(
      arquivoManifestoFonte,
      resolve(pastaSaida, "manifest.json"),
    );
  }

  // Normaliza caminhos de arquivo
  normalizarEstruturaStandalone(pastaSaida);
}

/**
 * Compila o alvo Web App (PWA para Vercel / Celular).
 * @param {string} pastaSaida
 */
async function compilarAlvoWeb(pastaSaida) {
  console.log(`\n🌐 [Web PWA] Compilando Aplicação Web para Vercel...`);
  await build({
    configFile: false,
    base: "./",
    build: {
      outDir: pastaSaida,
      emptyOutDir: false,
      target: "esnext",
      rollupOptions: {
        input: {
          app: resolve("src/web/index.html"),
        },
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },
    },
  });

  // Copia assets
  if (fs.existsSync("src/assets")) {
    fs.cpSync("src/assets", resolve(pastaSaida, "assets"), { recursive: true });
  }

  // Copia manifesto PWA
  if (fs.existsSync("src/web/manifest.webmanifest")) {
    fs.copyFileSync(
      "src/web/manifest.webmanifest",
      resolve(pastaSaida, "manifest.webmanifest"),
    );
  }

  normalizarEstruturaWeb(pastaSaida);
}

async function executarConstrucaoMultiTarget() {
  console.log(
    "🚀 Iniciando pipeline de compilação multi-alvo do Ready2Roll (R2R)...",
  );
  const inicio = Date.now();

  // Limpa diretório dist
  if (fs.existsSync("dist")) {
    fs.rmSync("dist", { recursive: true, force: true });
  }
  fs.mkdirSync("dist", { recursive: true });

  const distChrome = resolve("dist/chrome");
  const distFirefox = resolve("dist/firefox");
  const distWeb = resolve("dist/web");

  fs.mkdirSync(distChrome, { recursive: true });
  fs.mkdirSync(distFirefox, { recursive: true });
  fs.mkdirSync(distWeb, { recursive: true });

  // 1. Compilar Extensão para Google Chrome / Microsoft Edge
  await compilarAlvoExtensao("Chrome/Edge", distChrome, "src/manifest.json");

  // 2. Compilar Extensão para Mozilla Firefox (AMO)
  await compilarAlvoExtensao(
    "Mozilla Firefox",
    distFirefox,
    "src/manifest.firefox.json",
  );

  // 3. Compilar Web App PWA para Vercel
  await compilarAlvoWeb(distWeb);

  // 4. Copiar versão Chrome para a raiz de dist/ para compatibilidade com desenvolvedores que usam a raiz
  fs.cpSync(distChrome, "dist", { recursive: true });

  // 5. Gerar arquivos ZIP para distribuição oficial
  console.log("\n🗜️  Empacotando arquivos ZIP para distribuição...");
  const bytesChrome = await criarArquivoZip(
    distChrome,
    resolve("dist/ready-to-roll-chrome.zip"),
  );
  console.log(
    `   ✓ dist/ready-to-roll-chrome.zip (${(bytesChrome / 1024).toFixed(1)} KB)`,
  );

  const bytesFirefox = await criarArquivoZip(
    distFirefox,
    resolve("dist/ready-to-roll-firefox.zip"),
  );
  console.log(
    `   ✓ dist/ready-to-roll-firefox.zip (${(bytesFirefox / 1024).toFixed(1)} KB)`,
  );

  const tempoTotal = ((Date.now() - inicio) / 1000).toFixed(2);
  console.log(
    `\n✨ Compilação multi-alvo concluída com sucesso em ${tempoTotal}s!`,
  );
  console.log("📂 Diretórios gerados:");
  console.log(
    '   ├── dist/chrome/   -> Carregar no Chrome/Edge em "Modo do Desenvolvedor"',
  );
  console.log(
    "   ├── dist/firefox/  -> Carregar no Firefox (about:debugging) ou enviar .zip para AMO",
  );
  console.log(
    "   ├── dist/web/      -> Deploy no Vercel (vercel deploy --prod) ou GitHub Pages",
  );
  console.log(
    "   ├── dist/ready-to-roll-firefox.zip -> Arquivo pronto para o portal Mozilla AMO",
  );
  console.log(
    "   └── dist/ready-to-roll-chrome.zip  -> Arquivo pronto para a Chrome Web Store\n",
  );
}

executarConstrucaoMultiTarget().catch((err) => {
  console.error("❌ Falha na compilação:", err);
  process.exit(1);
});

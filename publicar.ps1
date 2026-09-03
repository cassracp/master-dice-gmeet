# publicar.ps1 - Pipeline de Publicação Local do ReadyToRoll (R2R)
param(
    [switch]$Help
)

if ($Help) {
    Write-Host "Script interativo para compilar, testar e empacotar localmente versões do ReadyToRoll (R2R)."
    exit
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   ReadyToRoll (R2R) - Publicador Local  " -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# 1. Solicita a versão
$version = Read-Host "Digite o número da nova versão (ex: 2.0.0, sem o 'v')"
if ([string]::IsNullOrWhiteSpace($version)) {
    Write-Host "Versão não informada. Cancelando." -ForegroundColor Red
    exit 1
}

# 2. Solicita o resumo da alteração
$message = Read-Host "Digite o resumo das alterações (ex: ✨ feat: adicionar qrcode e abas mobile)"
if ([string]::IsNullOrWhiteSpace($message)) {
    Write-Host "Mensagem não informada. Cancelando." -ForegroundColor Red
    exit 1
}

# 3. Atualiza versão nos arquivos de manifesto e package.json
Write-Host "`n[1/4] Sincronizando versão $version nos manifestos e package.json..." -ForegroundColor Yellow
$arquivosVersao = @(
    "package.json",
    "src/manifest.json",
    "src/manifest.firefox.json"
)

foreach ($arquivo in $arquivosVersao) {
    if (Test-Path $arquivo) {
        (Get-Content $arquivo -Raw) -replace '"version":\s*"[^"]+"', "`"version`": `"$version`"" | Set-Content $arquivo -NoNewline
        Write-Host "   ✓ $arquivo atualizado" -ForegroundColor Green
    }
}

# 4. Executa testes automatizados
Write-Host "`n[2/4] Executando testes unitários do motor de dados..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha nos testes unitários. Cancelando publicação." -ForegroundColor Red
    exit 1
}

# 5. Executa compilação multi-alvo (Chrome, Firefox e Web)
Write-Host "`n[3/4] Compilando e gerando pacotes de distribuição (npm run build)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro durante a compilação multi-alvo. Cancelando." -ForegroundColor Red
    exit 1
}

# Gera cópias versionadas dos pacotes oficiais para histórico de releases
Copy-Item "dist/ready-to-roll-chrome.zip" "dist/ready-to-roll-chrome-v$version.zip" -Force
Copy-Item "dist/ready-to-roll-firefox.zip" "dist/ready-to-roll-firefox-v$version.zip" -Force

Write-Host "`n[4/4] Pacotes gerados com sucesso na pasta dist/:" -ForegroundColor Green
Write-Host "   📦 dist/ready-to-roll-chrome-v$version.zip  (Chrome Web Store / Edge)" -ForegroundColor Cyan
Write-Host "   📦 dist/ready-to-roll-firefox-v$version.zip (Mozilla Firefox AMO)" -ForegroundColor Cyan
Write-Host "   🌐 dist/web/ (Pronto para deploy na Vercel)" -ForegroundColor Cyan

# 6. Pergunta sobre commit no Git
Write-Host "`n===========================================================" -ForegroundColor Green
Write-Host " Build v$version concluído com êxito! " -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green

$confirmarGit = Read-Host "`nDeseja preparar e enviar o commit no Git agora? (S/N)"
if ($confirmarGit -eq 'S' -or $confirmarGit -eq 's') {
    git add .
    git commit -m $message
    git tag "v$version"
    git push
    git push origin "v$version"
    Write-Host "Alterações e tags enviadas para o repositório remoto!" -ForegroundColor Green
} else {
    Write-Host "Git ignorado. Você pode commitar manualmente quando desejar." -ForegroundColor Yellow
}

# icon.ps1 - Gerador de Icones do Ready2Roll (R2R)
Add-Type -AssemblyName System.Drawing

$diretorioBase = $PSScriptRoot
$source = Join-Path $diretorioBase "icone.png"

if (-not (Test-Path $source)) {
    Write-Host "Arquivo de origem '$source' nao encontrado." -ForegroundColor Red
    exit 1
}

$sourceImage = [System.Drawing.Image]::FromFile($source)
$sizes = @(16, 48, 128, 192, 512)
$pastaAssets = Join-Path $diretorioBase "src\assets"
$pastaIcons = Join-Path $pastaAssets "icons"

if (-not (Test-Path $pastaAssets)) {
    New-Item -ItemType Directory -Path $pastaAssets -Force | Out-Null
}
if (-not (Test-Path $pastaIcons)) {
    New-Item -ItemType Directory -Path $pastaIcons -Force | Out-Null
}

foreach ($size in $sizes) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)

    $scale = [Math]::Min($size / $sourceImage.Width, $size / $sourceImage.Height)
    $destWidth = [int][Math]::Round($sourceImage.Width * $scale)
    $destHeight = [int][Math]::Round($sourceImage.Height * $scale)
    $destX = [int][Math]::Round(($size - $destWidth) / 2)
    $destY = [int][Math]::Round(($size - $destHeight) / 2)

    $graphics.DrawImage($sourceImage, $destX, $destY, $destWidth, $destHeight)
    
    if ($size -le 128) {
        $outputPathRaiz = Join-Path $diretorioBase "icon$size.png"
        $bitmap.Save($outputPathRaiz, [System.Drawing.Imaging.ImageFormat]::Png)
    }

    $outputPathAssets = Join-Path $pastaAssets "icon$size.png"
    $bitmap.Save($outputPathAssets, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $bitmap.Dispose()
    Write-Host "Gerado: icon$size.png (${destWidth}x${destHeight} px)" -ForegroundColor Green
}

$sourceImage.Dispose()

# Atualiza r2r_icon.svg com o novo icone
$icon512Bytes = [System.IO.File]::ReadAllBytes((Join-Path $pastaAssets "icon512.png"))
$base64_512 = [System.Convert]::ToBase64String($icon512Bytes)
$svgConteudo = @"
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="100%" height="100%">
  <image width="512" height="512" xlink:href="data:image/png;base64,$base64_512"/>
</svg>
"@
Set-Content -Path (Join-Path $pastaIcons "r2r_icon.svg") -Value $svgConteudo -Encoding UTF8 -NoNewline

Write-Host "Icones gerados com sucesso na raiz e em src/assets!" -ForegroundColor Green

# icon.ps1 - Gerador de Ãcones do ReadyToRoll (R2R)
Add-Type -AssemblyName System.Drawing

$diretorioBase = $PSScriptRoot
$source = Join-Path $diretorioBase "icone.png"

if (-not (Test-Path $source)) {
    Write-Host "Arquivo de origem '$source' nÃ£o encontrado." -ForegroundColor Red
    exit 1
}

$sourceImage = [System.Drawing.Image]::FromFile($source)
$sizes = @(16, 48, 128)

foreach ($size in $sizes) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $graphics.DrawImage($sourceImage, 0, 0, $size, $size)
    
    # Salva na raiz e em src/assets
    $outputPathRaiz = Join-Path $diretorioBase "icon${size}.png"
    $bitmap.Save($outputPathRaiz, [System.Drawing.Imaging.ImageFormat]::Png)

    $pastaAssets = Join-Path $diretorioBase "src/assets"
    if (Test-Path $pastaAssets) {
        $outputPathAssets = Join-Path $pastaAssets "icon${size}.png"
        $bitmap.Save($outputPathAssets, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    
    $graphics.Dispose()
    $bitmap.Dispose()
}

$sourceImage.Dispose()
Write-Host "Ãcones gerados com sucesso na raiz e em src/assets!" -ForegroundColor Green

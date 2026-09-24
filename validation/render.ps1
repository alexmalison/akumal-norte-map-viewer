Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$dataPath = Join-Path $root 'data\akumal_norte_lots_2025.geojson'
$data = [System.IO.File]::ReadAllText($dataPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
$image = [System.Drawing.Bitmap]::FromFile((Join-Path $PSScriptRoot 'basemap.png'))
$graphics = [System.Drawing.Graphics]::FromImage($image)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$west = -87.319
$east = -87.302
$south = 20.396
$north = 20.413

function Convert-Point($coordinate) {
    $x = [single](($coordinate[0] - $west) / ($east - $west) * $image.Width)
    $y = [single](($north - $coordinate[1]) / ($north - $south) * $image.Height)
    return [System.Drawing.PointF]::new($x, $y)
}

foreach ($feature in $data.features) {
    $isLot = $feature.properties.layer -eq 'Akumal Norte property Lots'
    $color = [System.Drawing.ColorTranslator]::FromHtml($feature.properties.style_color)
    if ($feature.geometry.type -eq 'Polygon') {
        $points = @($feature.geometry.coordinates[0] | ForEach-Object { Convert-Point $_ })
        if ($points.Count -lt 3) { continue }
        $alpha = if ($isLot) { 55 } else { 18 }
        $fill = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb($alpha, $color))
        $strokeColor = if ($isLot -and $feature.properties.style_color -eq '#000000') {
            [System.Drawing.Color]::FromArgb(210, [System.Drawing.Color]::White)
        } else {
            [System.Drawing.Color]::FromArgb(230, $color)
        }
        $pen = [System.Drawing.Pen]::new($strokeColor, $(if ($isLot) { 2.0 } else { 4.0 }))
        if (-not $isLot) { $pen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash }
        $graphics.FillPolygon($fill, [System.Drawing.PointF[]]$points)
        $graphics.DrawPolygon($pen, [System.Drawing.PointF[]]$points)
        $fill.Dispose()
        $pen.Dispose()
    } else {
        $points = @($feature.geometry.coordinates | ForEach-Object { Convert-Point $_ })
        $pen = [System.Drawing.Pen]::new($color, 5.0)
        $graphics.DrawLines($pen, [System.Drawing.PointF[]]$points)
        $pen.Dispose()
    }
}
$output = Join-Path $PSScriptRoot 'overlay.png'
$image.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$image.Dispose()
Write-Output $output

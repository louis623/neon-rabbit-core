param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath,

  [Parameter(Mandatory = $true)]
  [int]$Width,

  [Parameter(Mandatory = $true)]
  [int]$Height,

  [ValidateSet('jpg', 'png')]
  [string]$Format = 'jpg',

  [int64]$MaxBytes = 0,

  [ValidateRange(60, 100)]
  [int]$JpegQuality = 94,

  [switch]$Force
)

$ErrorActionPreference = 'Stop'

if ($Width -le 0 -or $Height -le 0) {
  throw 'Width and Height must be positive integers.'
}

$resolvedSource = (Resolve-Path -LiteralPath $SourcePath).Path
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)

if ((Test-Path -LiteralPath $resolvedOutput) -and -not $Force) {
  throw "Output already exists: $resolvedOutput. Pass -Force to replace it."
}

$outputDirectory = Split-Path -Parent $resolvedOutput
if (-not (Test-Path -LiteralPath $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

Add-Type -AssemblyName System.Drawing

$sourceImage = [System.Drawing.Image]::FromFile($resolvedSource)
$targetBitmap = New-Object System.Drawing.Bitmap($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$targetBitmap.SetResolution(96, 96)

try {
  $graphics = [System.Drawing.Graphics]::FromImage($targetBitmap)
  try {
    $graphics.Clear([System.Drawing.Color]::White)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $sourceAspect = $sourceImage.Width / $sourceImage.Height
    $targetAspect = $Width / $Height

    if ($sourceAspect -lt $targetAspect) {
      $cropHeight = $sourceImage.Width / $targetAspect
      $sourceRect = New-Object System.Drawing.RectangleF(0, (($sourceImage.Height - $cropHeight) / 2), $sourceImage.Width, $cropHeight)
    } else {
      $cropWidth = $sourceImage.Height * $targetAspect
      $sourceRect = New-Object System.Drawing.RectangleF((($sourceImage.Width - $cropWidth) / 2), 0, $cropWidth, $sourceImage.Height)
    }

    $destinationRect = New-Object System.Drawing.Rectangle(0, 0, $Width, $Height)
    $graphics.DrawImage($sourceImage, $destinationRect, $sourceRect.X, $sourceRect.Y, $sourceRect.Width, $sourceRect.Height, [System.Drawing.GraphicsUnit]::Pixel)
  } finally {
    $graphics.Dispose()
  }

  if ($Format -eq 'png') {
    $targetBitmap.Save($resolvedOutput, [System.Drawing.Imaging.ImageFormat]::Png)
  } else {
    $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
    $qualityEncoder = [System.Drawing.Imaging.Encoder]::Quality
    $selectedQuality = $JpegQuality

    do {
      $encoderParameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
      try {
        $encoderParameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($qualityEncoder, [long]$selectedQuality)
        $targetBitmap.Save($resolvedOutput, $jpegCodec, $encoderParameters)
      } finally {
        $encoderParameters.Dispose()
      }

      $outputBytes = (Get-Item -LiteralPath $resolvedOutput).Length
      if ($MaxBytes -gt 0 -and $outputBytes -gt $MaxBytes) {
        $selectedQuality -= 2
      }
    } while ($MaxBytes -gt 0 -and $outputBytes -gt $MaxBytes -and $selectedQuality -ge 62)

    if ($MaxBytes -gt 0 -and $outputBytes -gt $MaxBytes) {
      throw "Unable to reach MaxBytes=$MaxBytes without dropping below JPEG quality 60."
    }
  }
} finally {
  $targetBitmap.Dispose()
  $sourceImage.Dispose()
}

$finalImage = [System.Drawing.Image]::FromFile($resolvedOutput)
try {
  [pscustomobject]@{
    Path = $resolvedOutput
    Width = $finalImage.Width
    Height = $finalImage.Height
    Format = $Format
    Bytes = (Get-Item -LiteralPath $resolvedOutput).Length
  }
} finally {
  $finalImage.Dispose()
}

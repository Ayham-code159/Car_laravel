# Dot-source this script from PowerShell to enable GD for this terminal only.
$rentalBackendRoot = Split-Path -Parent $PSScriptRoot
$rentalGdLoaded = (& php -m) -contains 'gd'
if (-not $rentalGdLoaded) {
    $rentalIniDirectory = Join-Path $rentalBackendRoot 'storage/framework/php-ini'
    New-Item -ItemType Directory -Path $rentalIniDirectory -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $rentalIniDirectory 'gd.ini') -Value 'extension=gd' -Encoding Ascii
    $rentalPreviousScanDirectory = $env:PHP_INI_SCAN_DIR
    $env:PHP_INI_SCAN_DIR = $rentalPreviousScanDirectory + [IO.Path]::PathSeparator + $rentalIniDirectory
    if (-not ((& php -m) -contains 'gd')) {
        $env:PHP_INI_SCAN_DIR = $rentalPreviousScanDirectory
        throw 'GD could not be enabled. Install the GD extension matching your PHP build.'
    }
}
Write-Output 'GD is enabled for this terminal. The global php.ini was not modified.'

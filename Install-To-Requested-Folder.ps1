$ErrorActionPreference = 'Stop'
$Destination = 'C:\Users\saura\SIP report and ppt\ProNet-3D'
$Source = $PSScriptRoot
if ($Source.TrimEnd('\') -eq $Destination.TrimEnd('\')) {
    Write-Host "The project is already in $Destination"
    exit 0
}
if (Test-Path $Destination) {
    throw "The destination already exists. Choose a new folder or back up the existing project before copying."
}
New-Item -ItemType Directory -Path $Destination -Force | Out-Null
Get-ChildItem -LiteralPath $Source -Force | Where-Object { $_.Name -ne 'node_modules' } | Copy-Item -Destination $Destination -Recurse -Force
Write-Host "Project copied to $Destination"
Write-Host "Open that folder in a terminal and run: npm run setup"

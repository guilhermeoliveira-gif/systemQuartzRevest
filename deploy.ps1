
Write-Host "🚀 Iniciando deploy..." -ForegroundColor Cyan

if (Test-Path "src/version.ts") {
    $versionContent = Get-Content "src/version.ts" -Raw
    if ($versionContent -match "APP_VERSION = '(\d+)\.(\d+)\.(\d+)'") {
        $major = $Matches[1]
        $minor = $Matches[2]
        $patch = $Matches[3]
        $newPatch = [int]$patch + 1
        $newVersion = "$major.$minor.$newPatch"
        
        $newContent = "export const APP_VERSION = '$newVersion';"
        Set-Content -Path "src/version.ts" -Value $newContent
        
        Write-Host "Versao atualizada para: $newVersion" -ForegroundColor Green
    }
}

npm run build

if ($LASTEXITCODE -eq 0) {
    if (-not (Test-Path "dist")) {
        Write-Host "Erro: Pasta dist nao encontrada." -ForegroundColor Red
        exit 1
    }
    
    if (Test-Path ".htaccess") {
        Copy-Item ".htaccess" "dist/"
        Write-Host ".htaccess copiado." -ForegroundColor Green
    }
    
    Write-Host "Deploy preparado com sucesso em 'dist/'" -ForegroundColor Green
    Write-Host "Version: $newVersion" -ForegroundColor Yellow
}
else {
    Write-Host "Erro no build." -ForegroundColor Red
    exit 1
}

# 🚀 Script de Deploy Automático - Hostinger (Windows PowerShell)
# Executa build e prepara para upload

Write-Host "🚀 Iniciando deploy para Hostinger..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se estamos no diretório correto
if (-Not (Test-Path "package.json")) {
    Write-Host "❌ Erro: package.json não encontrado!" -ForegroundColor Red
    Write-Host "Execute este script na raiz do projeto."
    exit 1
}

# 2. Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependências instaladas" -ForegroundColor Green

# 2.5 Auto-increment Version in src/version.ts
if (Test-Path "src/version.ts") {
    $versionContent = Get-Content "src/version.ts" -Raw
    if ($versionContent -match "APP_VERSION = '(\d+)\.(\d+)\.(\d+)'") {
        $major = $matches[1]
        $minor = $matches[2]
        $patch = $matches[3]
        $newPatch = [int]$patch + 1
        $newVersion = "$major.$minor.$newPatch"
        
        $newContent = "export const APP_VERSION = '$newVersion';"
        Set-Content -Path "src/version.ts" -Value $newContent
        
        Write-Host "Versao atualizada para: $newVersion" -ForegroundColor Green
    }
    else {
        Write-Host "Nao foi possivel ler a versao em src/version.ts" -ForegroundColor Yellow
    }
}
else {
    Write-Host "src/version.ts nao encontrado" -ForegroundColor Yellow
}

# 3. Verificar variáveis de ambiente
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  Arquivo .env não encontrado!" -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "⚠️  .env criado a partir de .env.example" -ForegroundColor Yellow
        Write-Host "Configure as variáveis em .env antes de continuar!" -ForegroundColor Yellow
        Write-Host "Pressione Enter para continuar após configurar..."
        Read-Host
    }
    else {
        Write-Host "❌ .env.example não encontrado!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Variáveis de ambiente configuradas" -ForegroundColor Green
Write-Host ""

# 4. Build da aplicação
Write-Host "🔨 Executando build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no build!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build concluído" -ForegroundColor Green
Write-Host ""

# 5. Verificar se dist/ foi criado
if (-Not (Test-Path "dist")) {
    Write-Host "❌ Pasta dist/ não foi criada!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Pasta dist/ criada com sucesso" -ForegroundColor Green
Write-Host ""

# 6. Copiar .htaccess para dist/
if (Test-Path ".htaccess") {
    Copy-Item ".htaccess" "dist/"
    Write-Host "✅ .htaccess copiado para dist/" -ForegroundColor Green
}
else {
    Write-Host "⚠️  .htaccess não encontrado" -ForegroundColor Yellow
}

Write-Host ""

# 7. Mostrar tamanho do build
Write-Host "📊 Tamanho do build:" -ForegroundColor Yellow
$size = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "$([math]::Round($size, 2)) MB"
Write-Host ""

# 8. Instruções finais
Write-Host "✅ Deploy preparado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Opção 1 - Via SSH:" -ForegroundColor Cyan
Write-Host "1. Conecte via SSH (use PuTTY ou PowerShell):"
Write-Host "   ssh seu_usuario@ssh.hostinger.com -p 65002"
Write-Host ""
Write-Host "2. No servidor, execute:"
Write-Host "   cd ~/public_html"
Write-Host "   git pull origin main"
Write-Host "   npm install"
Write-Host "   npm run build"
Write-Host "   cp -r dist/* ."
Write-Host ""
Write-Host "Opção 2 - Via SFTP/FTP:" -ForegroundColor Cyan
Write-Host "1. Use FileZilla ou WinSCP"
Write-Host "2. Conecte ao servidor Hostinger"
Write-Host "3. Faça upload da pasta dist/ para public_html/"
Write-Host ""
Write-Host "🎉 Pronto para deploy!" -ForegroundColor Green

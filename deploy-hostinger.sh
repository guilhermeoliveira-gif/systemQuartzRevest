#!/bin/bash

# 🚀 Script de Deploy Automático - Hostinger
# Executa build e atualiza a aplicação no servidor

echo "🚀 Iniciando deploy para Hostinger..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: package.json não encontrado!${NC}"
    echo "Execute este script na raiz do projeto."
    exit 1
fi

echo -e "${YELLOW}📦 Instalando dependências...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependências instaladas${NC}"
echo ""

# 2. Verificar variáveis de ambiente
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado!${NC}"
    echo "Criando .env a partir de .env.example..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Configure as variáveis em .env antes de continuar!${NC}"
        echo "Pressione Enter para continuar após configurar..."
        read
    else
        echo -e "${RED}❌ .env.example não encontrado!${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Variáveis de ambiente configuradas${NC}"
echo ""

# 3. Build da aplicação
echo -e "${YELLOW}🔨 Executando build...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build concluído${NC}"
echo ""

# 4. Verificar se dist/ foi criado
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Pasta dist/ não foi criada!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pasta dist/ criada com sucesso${NC}"
echo ""

# 5. Copiar .htaccess para dist/
if [ -f ".htaccess" ]; then
    cp .htaccess dist/
    echo -e "${GREEN}✅ .htaccess copiado para dist/${NC}"
else
    echo -e "${YELLOW}⚠️  .htaccess não encontrado${NC}"
fi

echo ""

# 6. Mostrar tamanho do build
echo -e "${YELLOW}📊 Tamanho do build:${NC}"
du -sh dist/
echo ""

# 7. Instruções finais
echo -e "${GREEN}✅ Deploy preparado com sucesso!${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo ""
echo "1. Conecte via SSH:"
echo "   ssh seu_usuario@ssh.hostinger.com -p 65002"
echo ""
echo "2. No servidor, execute:"
echo "   cd ~/public_html"
echo "   git pull origin main"
echo "   npm install"
echo "   npm run build"
echo "   cp -r dist/* ."
echo ""
echo "3. Ou faça upload manual da pasta dist/ via SFTP"
echo ""
echo -e "${GREEN}🎉 Pronto para deploy!${NC}"

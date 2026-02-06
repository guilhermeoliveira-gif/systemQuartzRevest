# 🚀 Deploy para Hostinger via Git

## Pré-requisitos

1. ✅ Conta Hostinger com acesso SSH
2. ✅ Git instalado no servidor
3. ✅ Node.js 18+ no servidor

---

## 📋 Passo a Passo

### 1. **Configurar SSH na Hostinger**

1. Acesse o **hPanel** da Hostinger
2. Vá em **Avançado** → **SSH Access**
3. Ative o acesso SSH
4. Anote as credenciais:
   - **Host**: `ssh.hostinger.com` (ou seu domínio)
   - **Port**: `65002` (padrão Hostinger)
   - **Username**: seu_usuario
   - **Password**: sua_senha

### 2. **Conectar via SSH**

```bash
# Windows (PowerShell)
ssh seu_usuario@ssh.hostinger.com -p 65002

# Ou use PuTTY/MobaXterm
```

### 3. **Configurar Git no Servidor**

```bash
# Navegar para o diretório público
cd public_html

# Clonar o repositório
git clone https://github.com/guilhermeoliveira-gif/systemQuartzRevest.git .

# Ou se já existe conteúdo, criar uma pasta separada
mkdir app
cd app
git clone https://github.com/guilhermeoliveira-gif/systemQuartzRevest.git .
```

### 4. **Instalar Dependências no Servidor**

```bash
# Verificar versão do Node.js
node --version

# Se Node.js não estiver instalado, instalar via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Instalar dependências
npm install

# Build da aplicação
npm run build
```

### 5. **Configurar Variáveis de Ambiente**

```bash
# Criar arquivo .env
nano .env

# Adicionar as variáveis:
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon
VITE_GEMINI_API_KEY=sua_chave_gemini

# Salvar: Ctrl+O, Enter, Ctrl+X
```

### 6. **Configurar Servidor Web**

A Hostinger usa **Apache** ou **LiteSpeed**. Precisamos configurar o `.htaccess`:

**Arquivo já criado**: `.htaccess` (veja abaixo)

### 7. **Apontar para a Pasta `dist/`**

```bash
# Opção A: Mover conteúdo do dist para public_html
cp -r dist/* ../public_html/

# Opção B: Criar symlink (recomendado)
ln -s ~/app/dist ~/public_html/app

# Opção C: Configurar Document Root no hPanel
# Vá em: Websites → Manage → Advanced → Document Root
# Altere para: public_html/app/dist
```

---

## 🔄 Script de Deploy Automático

Criei um script `deploy-hostinger.sh` que automatiza o processo:

```bash
# No servidor, executar:
chmod +x deploy-hostinger.sh
./deploy-hostinger.sh
```

---

## 🌐 Configurar Domínio

### Se usar subdomínio (app.seudominio.com):

1. **hPanel** → **Domínios** → **Gerenciar**
2. **DNS / Name Servers** → **DNS Records**
3. Adicionar registro:
   - **Type**: A
   - **Name**: app
   - **Points to**: IP do servidor
   - **TTL**: 14400

### Se usar domínio principal:

1. **hPanel** → **Websites** → **Manage**
2. **Advanced** → **Document Root**
3. Alterar para: `public_html/dist` ou `public_html/app/dist`

---

## 🔧 Troubleshooting

### Problema: "404 Not Found" ao acessar rotas

**Solução**: Verificar se `.htaccess` está configurado corretamente (SPA routing).

### Problema: "500 Internal Server Error"

**Solução**: Verificar permissões dos arquivos:
```bash
chmod 755 dist/
chmod 644 dist/*
```

### Problema: Variáveis de ambiente não funcionam

**Solução**: Rebuild da aplicação após criar `.env`:
```bash
npm run build
```

### Problema: Node.js não disponível

**Solução**: Usar build local e fazer upload apenas da pasta `dist/`:
```bash
# Local (Windows)
npm run build

# Upload via SFTP/FTP
# Ou usar Git e fazer pull no servidor
```

---

## 📊 Verificação Pós-Deploy

Após deploy, verificar:

```bash
# Verificar se arquivos foram copiados
ls -la dist/

# Verificar se .htaccess existe
cat .htaccess

# Testar URL
curl https://seudominio.com
```

---

## 🔄 Atualizar Aplicação (Futuras Mudanças)

```bash
# Conectar via SSH
ssh seu_usuario@ssh.hostinger.com -p 65002

# Navegar para o diretório
cd ~/app

# Atualizar código
git pull origin main

# Rebuild
npm run build

# Copiar para public_html (se necessário)
cp -r dist/* ../public_html/
```

---

## 📝 Checklist de Deploy

- [ ] SSH configurado e testado
- [ ] Repositório clonado no servidor
- [ ] Node.js instalado (v18+)
- [ ] Dependências instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas (`.env`)
- [ ] Build executado (`npm run build`)
- [ ] `.htaccess` configurado
- [ ] Arquivos copiados para `public_html/`
- [ ] Domínio apontado corretamente
- [ ] Site acessível via browser
- [ ] Rotas funcionando (SPA routing)
- [ ] Supabase conectado

---

## 🎯 URLs Importantes

- **hPanel**: https://hpanel.hostinger.com
- **Documentação SSH**: https://support.hostinger.com/en/articles/1583227-how-to-use-ssh
- **Suporte**: https://www.hostinger.com.br/contato

---

**Status**: 📋 Guia criado. Pronto para executar!

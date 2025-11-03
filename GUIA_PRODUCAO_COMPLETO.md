# 📚 Guia Completo de Configuração para Produção - BRS Sistema

Este guia ensina **como configurar** o sistema BRS para ambiente de produção. Você aprenderá o **que** alterar, **onde** alterar e **por que** cada configuração é importante.

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Configurações do Backend (PHP)](#configurações-do-backend-php)
3. [Configurações do Frontend (React)](#configurações-do-frontend-react)
4. [Configurações do Servidor Web](#configurações-do-servidor-web)
5. [Banco de Dados](#banco-de-dados)
6. [Segurança e CORS](#segurança-e-cors)
7. [Upload de Arquivos](#upload-de-arquivos)
8. [Build e Deploy](#build-e-deploy)
9. [Checklist Completo](#checklist-completo)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ Visão Geral da Arquitetura

### Estrutura do Sistema

```
sistema-brs/
├── api/                    # Backend PHP (API REST)
│   ├── config/            # Arquivos de configuração
│   ├── endpoints/         # Endpoints da API
│   ├── upload/            # Arquivos enviados pelos usuários
│   └── index.php          # Roteador principal
│
├── src/                    # Frontend React
│   ├── config/            # Configurações do frontend
│   ├── components/        # Componentes React
│   └── pages/            # Páginas da aplicação
│
└── build/                  # Build de produção (gerado com npm run build)
```

### Como Funciona

1. **Frontend (React)**: Interface do usuário executada no navegador
2. **Backend (PHP)**: API REST que processa requisições e acessa o banco de dados
3. **Banco de Dados (MySQL)**: Armazena todos os dados do sistema
4. **Servidor Web (Apache/Nginx)**: Serve os arquivos e roteia requisições

---

## ⚙️ Configurações do Backend (PHP)

### 1. Arquivo: `api/config/environment.php`

**O que é**: Define se o sistema está em modo de desenvolvimento ou produção.

**O que fazer**: Alterar as constantes para produção.

**Localização**: `api/config/environment.php`

#### Configurações Atuais (Verificar):

```php
// Linha 7: Modo de produção
define('PRODUCTION_MODE', true);  // ✅ true = produção | false = desenvolvimento

// Linha 10: Modo de debug
define('DEBUG_MODE', !PRODUCTION_MODE);  // ✅ false em produção

// Linha 13: Logs
define('ENABLE_LOGS', !PRODUCTION_MODE);  // ✅ false em produção
```

#### O que cada configuração faz:

- **`PRODUCTION_MODE`**: 
  - `true` = Produção (desativa logs, mensagens de erro detalhadas)
  - `false` = Desenvolvimento (ativa logs, debug)
  
- **`DEBUG_MODE`**: 
  - `true` = Mostra erros detalhados (NÃO usar em produção por segurança)
  - `false` = Esconde detalhes de erros (usar em produção)

- **`ENABLE_LOGS`**: 
  - `true` = Grava logs em arquivos (pode consumir espaço)
  - `false` = Não grava logs (recomendado em produção)

#### Como alterar para produção:

```php
// ✅ CORRETO para produção:
define('PRODUCTION_MODE', true);
define('DEBUG_MODE', false);
define('ENABLE_LOGS', false);
```

#### Origens permitidas (CORS):

Nas linhas 18-24, você define quais domínios podem acessar a API:

```php
if (PRODUCTION_MODE) {
    define('ALLOWED_ORIGINS', [
        'https://brsreguladora.com.br',           // ✅ Seu domínio principal
        'https://www.brsreguladora.com.br',       // ✅ Com www
        'http://localhost:3000',                  // ⚠️ Remover em produção
        'http://localhost:3001',                  // ⚠️ Remover em produção
        'http://127.0.0.1:3000'                   // ⚠️ Remover em produção
    ]);
}
```

**⚠️ Importante**: Em produção, **remova** as URLs de `localhost` para aumentar a segurança:

```php
// ✅ RECOMENDADO para produção:
define('ALLOWED_ORIGINS', [
    'https://brsreguladora.com.br',
    'https://www.brsreguladora.com.br'
]);
```

---

### 2. Arquivo: `api/config/db.php`

**O que é**: Configura a conexão com o banco de dados MySQL.

**O que fazer**: Alterar as credenciais para o banco de produção.

**Localização**: `api/config/db.php`

#### Configurações Atuais (Verificar):

```php
// Linhas 7-10: Credenciais do banco
$DB_HOST = "brsdatabase.mysql.dbaas.com.br";  // Host do banco
$DB_USER = "brsdatabase";                     // Usuário do banco
$DB_PASS = "pW57@pd05#";                      // Senha do banco
$DB_NAME = "brsdatabase";                     // Nome do banco
```

#### Como alterar para produção:

1. **Obtenha as credenciais do banco de produção** do seu provedor de hospedagem
2. **Substitua os valores** no arquivo:

```php
// ✅ EXEMPLO de como deve ficar:
$DB_HOST = "seu-host-producao.mysql.dbaas.com.br";  // Host do banco de produção
$DB_USER = "usuario_producao";                      // Usuário de produção
$DB_PASS = "senha_segura_producao";                 // Senha forte
$DB_NAME = "nome_banco_producao";                   // Nome do banco de produção
```

#### ⚠️ Segurança Importante:

- **NUNCA** compartilhe estas credenciais
- **NUNCA** faça commit dessas credenciais no Git
- Use senhas fortes (mínimo 12 caracteres, misture letras, números e símbolos)

---

### 3. Arquivo: `api/config/cors.php`

**O que é**: Configura os headers CORS (Cross-Origin Resource Sharing) que permitem que o frontend acesse a API.

**O que fazer**: Geralmente não precisa alterar, mas verificar se está correto.

**Localização**: `api/config/cors.php`

#### Como funciona:

Este arquivo **lê** as origens permitidas de `environment.php` e aplica os headers CORS.

**O que verificar**:

1. Se o domínio de produção está em `ALLOWED_ORIGINS` no `environment.php`
2. Se os headers estão sendo enviados corretamente

#### Testando CORS:

Se houver erro de CORS no navegador (console F12), verifique:

1. ✅ O domínio está em `ALLOWED_ORIGINS`?
2. ✅ O servidor está enviando os headers CORS?
3. ✅ A requisição está sendo feita via HTTPS (se o site usa HTTPS)?

---

### 4. Arquivo: `api/config/upload.php`

**O que é**: Configura como os arquivos são enviados (PDFs, imagens, etc).

**O que fazer**: Ajustar limites de tamanho e permissões conforme necessário.

**Localização**: `api/config/upload.php`

#### Configurações Importantes:

```php
// Linha 7: Tamanho máximo de upload (50MB)
define('UPLOAD_MAX_SIZE', 50 * 1024 * 1024);  // Ajuste conforme necessário

// Linha 12: Diretório base de uploads
define('UPLOAD_BASE_DIR', __DIR__ . '/../upload/');

// Linha 16: Modo seguro
define('UPLOAD_SECURE_MODE', true);  // ✅ Sempre true em produção
```

#### ⚠️ Verificações em Produção:

1. **Permissões da pasta de upload**:
   ```bash
   # No servidor, a pasta deve ter permissão de escrita:
   chmod 755 api/upload/
   chmod 755 api/upload/pdf/
   ```

2. **Limite do PHP**: Verifique também o `php.ini`:
   ```ini
   upload_max_filesize = 50M
   post_max_size = 50M
   ```

---

## 🎨 Configurações do Frontend (React)

### 1. Arquivo: `src/config/api.js`

**O que é**: Define qual URL o frontend usa para se comunicar com o backend.

**O que fazer**: Verificar se está usando a URL de produção.

**Localização**: `src/config/api.js`

#### Configuração Atual (Linhas 7-11):

```javascript
BASE_URL: process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production' 
    ? 'https://brsreguladora.com.br/api'    // ✅ URL de produção
    : 'http://localhost/brs/api'            // URL de desenvolvimento
)
```

#### Como funciona:

1. **Primeiro**: Tenta usar `REACT_APP_API_URL` (variável de ambiente)
2. **Se não existir**: Verifica `NODE_ENV`
   - Se `production` → usa URL de produção
   - Se `development` → usa URL de desenvolvimento

#### ✅ Opção 1: Usar Variável de Ambiente (Recomendado)

**Criar arquivo `.env.production.local`** na raiz do projeto:

```env
REACT_APP_API_URL=https://brsreguladora.com.br/api
```

**Como criar**:

1. Na raiz do projeto (mesmo nível de `package.json`), criar arquivo `.env.production.local`
2. Adicionar a linha acima com sua URL de produção
3. Ao executar `npm run build`, a variável será usada automaticamente

#### ✅ Opção 2: Alterar Diretamente no Código

Se preferir, altere diretamente no `api.js`:

```javascript
// Alterar linha 9:
BASE_URL: process.env.REACT_APP_API_URL || 'https://brsreguladora.com.br/api'
```

**⚠️ Desvantagem**: Você precisará alterar manualmente quando mudar de ambiente.

---

### 2. Build de Produção

**O que é**: Processo que gera arquivos otimizados e minificados para produção.

**Como fazer**: Executar o comando de build.

#### Passo a Passo:

1. **Abrir terminal** na raiz do projeto

2. **Instalar dependências** (se ainda não fez):
   ```bash
   npm install
   ```

3. **Executar build**:
   ```bash
   npm run build
   ```

4. **Resultado**: Será criada a pasta `build/` com todos os arquivos prontos para produção

#### O que o build faz:

- ✅ Minifica JavaScript e CSS
- ✅ Otimiza imagens
- ✅ Remove código não utilizado
- ✅ Gera arquivos com hash para cache
- ✅ Inclui a URL de produção automaticamente

#### 📁 Estrutura da pasta `build/`:

```
build/
├── index.html          # HTML principal
├── static/
│   ├── css/           # CSS minificado
│   └── js/            # JavaScript minificado
└── asset-manifest.json # Manifesto de assets
```

---

## 🌐 Configurações do Servidor Web

### 1. Arquivo `.htaccess` (Apache)

**O que é**: Arquivo de configuração do Apache que define regras de roteamento e segurança.

**O que fazer**: Verificar se existe e está configurado corretamente.

#### Arquivos `.htaccess` no Projeto:

1. **`api/.htaccess`**: Roteamento da API
2. **`api/upload/.htaccess`**: Proteção da pasta de uploads

#### 📝 `api/.htaccess` - Verificações:

**Linhas 11-12**: Roteamento para `index.php`
```apache
RewriteRule ^ index.php [QSA,L]
```

**Linhas 15-16**: Páginas de erro
```apache
ErrorDocument 404 /api/index.php
ErrorDocument 405 /api/index.php
```

#### 📝 `api/upload/.htaccess` - Segurança:

Este arquivo **protege** a pasta de uploads para que arquivos não sejam acessados diretamente:

```apache
# Linhas 2-3: Bloqueia acesso direto
Order Deny,Allow
Deny from all
```

**✅ Está correto**: Os PDFs só devem ser acessados via API, não diretamente pela URL.

---

### 2. Estrutura no Servidor de Produção

#### Estrutura Recomendada:

```
/public_html/                    # (ou htdocs, ou www)
├── api/                         # Backend PHP
│   ├── config/
│   │   ├── db.php              # ✅ Credenciais de produção
│   │   ├── cors.php
│   │   └── environment.php     # ✅ Modo produção
│   ├── endpoints/
│   ├── upload/                  # ✅ Com permissão de escrita
│   ├── index.php
│   └── .htaccess
│
├── build/                       # Frontend React (do npm run build)
│   ├── index.html
│   ├── static/
│   └── ...
│
└── .htaccess                    # Configuração do Apache (raiz)
```

#### Arquivo `.htaccess` na Raiz (Se necessário):

Se o servidor não rotear automaticamente, criar `.htaccess` na raiz:

```apache
RewriteEngine On

# Redirecionar /api/* para api/
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ /api/$1 [L]

# Para todas as outras requisições, servir index.html (React Router)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ /build/index.html [L]
```

---

## 🗄️ Banco de Dados

### Configuração Inicial

#### 1. Criar Banco de Dados

No painel do seu provedor de hospedagem:

1. Acesse o gerenciador de banco de dados (phpMyAdmin ou similar)
2. Crie um novo banco de dados
3. Anote: **host**, **usuário**, **senha**, **nome do banco**

#### 2. Importar Estrutura

1. Execute os scripts SQL de criação das tabelas
2. Ou use o arquivo `api/migrate.php` se existir

#### 3. Configurar Credenciais

Atualizar `api/config/db.php` com as credenciais do banco de produção.

---

## 🔒 Segurança e CORS

### Configuração CORS Completa

#### O que é CORS?

CORS (Cross-Origin Resource Sharing) permite que um site em um domínio acesse uma API em outro domínio.

#### Configuração Correta:

1. **`api/config/environment.php`**: Define origens permitidas
2. **`api/config/cors.php`**: Aplica os headers CORS

#### Exemplo de Headers CORS Enviados:

```
Access-Control-Allow-Origin: https://brsreguladora.com.br
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

#### ⚠️ Problemas Comuns:

**Erro**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solução**:
1. Verifique se o domínio está em `ALLOWED_ORIGINS`
2. Verifique se `cors.php` está sendo incluído em `index.php`
3. Verifique se não há duplicação de headers

---

## 📤 Upload de Arquivos

### Configuração de Uploads

#### 1. Permissões da Pasta

No servidor de produção:

```bash
# Dar permissão de escrita
chmod 755 api/upload/
chmod 755 api/upload/pdf/
chmod 755 api/upload/colaborador-docs/
```

#### 2. Limites do PHP

Verificar `php.ini` ou criar `.user.ini` na pasta `api/`:

```ini
upload_max_filesize = 50M
post_max_size = 50M
max_execution_time = 300
memory_limit = 256M
```

#### 3. Estrutura de Pastas

```
api/upload/
├── pdf/                    # PDFs de registros
├── colaborador-docs/      # Documentos de colaboradores
└── cnhs/                  # CNHs (se aplicável)
```

---

## 🚀 Build e Deploy

### Processo Completo de Deploy

#### Passo 1: Preparar Backend

1. ✅ Verificar `api/config/db.php` (credenciais de produção)
2. ✅ Verificar `api/config/environment.php` (modo produção)
3. ✅ Verificar `api/config/cors.php` (origens permitidas)
4. ✅ Verificar permissões da pasta `api/upload/`

#### Passo 2: Preparar Frontend

1. ✅ Criar `.env.production.local` com URL da API
2. ✅ Executar `npm run build`
3. ✅ Verificar se a pasta `build/` foi criada

#### Passo 3: Upload para Servidor

**Opção A: FTP/SFTP**

1. Conectar ao servidor via FTP
2. Fazer upload da pasta `api/` inteira
3. Fazer upload da pasta `build/` inteira

**Opção B: Git**

```bash
# No servidor
git clone seu-repositorio.git
cd brs
npm install
npm run build
```

#### Passo 4: Configurar Servidor Web

1. ✅ Verificar se `.htaccess` está no lugar certo
2. ✅ Verificar se mod_rewrite está ativado (Apache)
3. ✅ Verificar se PHP está configurado corretamente

#### Passo 5: Testar

1. ✅ Acessar `https://brsreguladora.com.br` → Frontend deve carregar
2. ✅ Abrir console do navegador (F12) → Não deve ter erros
3. ✅ Tentar fazer login → Deve funcionar
4. ✅ Verificar requisições na aba Network → Devem ir para `/api/`

---

## ✅ Checklist Completo

### Backend (PHP)

- [ ] **`api/config/db.php`**
  - [ ] Host do banco de produção
  - [ ] Usuário do banco de produção
  - [ ] Senha do banco de produção
  - [ ] Nome do banco de produção

- [ ] **`api/config/environment.php`**
  - [ ] `PRODUCTION_MODE = true`
  - [ ] `DEBUG_MODE = false`
  - [ ] `ENABLE_LOGS = false`
  - [ ] `ALLOWED_ORIGINS` contém domínio de produção
  - [ ] Removidos `localhost` de `ALLOWED_ORIGINS`

- [ ] **`api/config/cors.php`**
  - [ ] Arquivo existe e está sendo incluído

- [ ] **`api/config/upload.php`**
  - [ ] `UPLOAD_SECURE_MODE = true`
  - [ ] Tamanho máximo definido corretamente

- [ ] **Pastas e Permissões**
  - [ ] `api/upload/` tem permissão de escrita (755 ou 775)
  - [ ] `api/upload/pdf/` tem permissão de escrita
  - [ ] `api/upload/colaborador-docs/` tem permissão de escrita

### Frontend (React)

- [ ] **Variável de Ambiente**
  - [ ] Arquivo `.env.production.local` criado
  - [ ] `REACT_APP_API_URL` definido com URL de produção
  - [ ] OU alterado diretamente em `src/config/api.js`

- [ ] **Build**
  - [ ] `npm install` executado (dependências instaladas)
  - [ ] `npm run build` executado com sucesso
  - [ ] Pasta `build/` criada
  - [ ] Verificar `build/index.html` existe

### Servidor Web

- [ ] **Arquivos .htaccess**
  - [ ] `api/.htaccess` existe
  - [ ] `api/upload/.htaccess` existe (proteção)
  - [ ] `.htaccess` na raiz (se necessário)

- [ ] **Configuração do Servidor**
  - [ ] Apache: mod_rewrite ativado
  - [ ] PHP: versão compatível (7.4+)
  - [ ] PHP: extensões necessárias instaladas (PDO, MySQLi, etc)

### Banco de Dados

- [ ] **Banco Criado**
  - [ ] Banco de dados criado no servidor
  - [ ] Estrutura das tabelas importada
  - [ ] Dados iniciais importados (se houver)

### Testes Finais

- [ ] **Frontend**
  - [ ] Site carrega corretamente
  - [ ] Sem erros no console do navegador
  - [ ] Sem erros de CORS

- [ ] **Autenticação**
  - [ ] Login funciona
  - [ ] Logout funciona
  - [ ] Sessão persiste após refresh

- [ ] **Funcionalidades**
  - [ ] CRUD funciona (criar, ler, atualizar, deletar)
  - [ ] Upload de arquivos funciona
  - [ ] Download/visualização de arquivos funciona

---

## 🔧 Troubleshooting

### Problema: Erro de CORS

**Sintoma**: No console do navegador aparece:
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**Solução**:
1. Verifique se o domínio está em `ALLOWED_ORIGINS` em `api/config/environment.php`
2. Verifique se `api/config/cors.php` está sendo incluído em `api/index.php`
3. Limpe o cache do navegador
4. Verifique se não há headers CORS duplicados

---

### Problema: API não responde (404)

**Sintoma**: Requisições retornam 404 ou página não encontrada

**Solução**:
1. Verifique se `.htaccess` está no lugar certo (`api/.htaccess`)
2. Verifique se mod_rewrite está ativado no Apache
3. Verifique a estrutura de URLs: `/api/endpoint` não `/api/api/endpoint`
4. Verifique se `index.php` existe em `api/`

---

### Problema: Erro de conexão com banco

**Sintoma**: Erro "Erro de conexão com banco de dados"

**Solução**:
1. Verifique credenciais em `api/config/db.php`
2. Verifique se o host permite conexões externas (se necessário)
3. Verifique se o usuário do banco tem permissões
4. Teste conexão via phpMyAdmin ou ferramenta similar

---

### Problema: Upload não funciona

**Sintoma**: Arquivos não são enviados ou dão erro

**Solução**:
1. Verifique permissões da pasta `api/upload/` (deve ser 755 ou 775)
2. Verifique `php.ini`: `upload_max_filesize` e `post_max_size`
3. Verifique espaço em disco no servidor
4. Verifique logs de erro do PHP

---

### Problema: Frontend não carrega

**Sintoma**: Página branca ou erro 404

**Solução**:
1. Verifique se a pasta `build/` foi enviada para o servidor
2. Verifique se `build/index.html` existe
3. Verifique configuração do servidor web (deve servir `build/index.html` para todas as rotas exceto `/api/*`)
4. Verifique console do navegador para erros JavaScript

---

### Problema: Variáveis de ambiente não funcionam

**Sintoma**: Frontend ainda usa URL de desenvolvimento

**Solução**:
1. Verifique se `.env.production.local` está na **raiz** do projeto (mesmo nível de `package.json`)
2. Execute `npm run build` novamente (variáveis são lidas durante o build)
3. Limpe cache do navegador
4. Verifique se não há cache do servidor web

---

## 📝 Resumo Rápido

### Para Configurar Produção:

1. **Backend**:
   - `api/config/db.php` → Credenciais de produção
   - `api/config/environment.php` → `PRODUCTION_MODE = true`
   - `api/config/environment.php` → Remover localhost de `ALLOWED_ORIGINS`

2. **Frontend**:
   - Criar `.env.production.local` → `REACT_APP_API_URL=https://seu-dominio.com/api`
   - Executar `npm run build`

3. **Servidor**:
   - Fazer upload de `api/` e `build/`
   - Configurar permissões de `api/upload/`

4. **Testar**:
   - Acessar site
   - Verificar console (sem erros)
   - Testar login

---

## 🎓 Conceitos Importantes

### O que é um Build?

Build é o processo que **compila** o código React em arquivos JavaScript e CSS otimizados que o navegador entende. Durante o build:

- Código é minificado (remove espaços, quebra de linha)
- Variáveis de ambiente são "embutidas" no código
- Código não utilizado é removido
- Assets são otimizados

**Por isso**: Você precisa executar `npm run build` toda vez que alterar código e quiser colocar em produção.

---

### Por que Variáveis de Ambiente?

Variáveis de ambiente permitem ter **diferentes configurações** para desenvolvimento e produção sem alterar código:

- **Desenvolvimento**: `http://localhost/brs/api`
- **Produção**: `https://brsreguladora.com.br/api`

O código usa a variável, e você muda apenas um arquivo (`.env.production.local`).

---

### O que é CORS?

CORS é uma **política de segurança** do navegador que impede que um site acesse recursos de outro site. 

Para permitir que seu frontend (React) acesse sua API (PHP), você precisa:

1. **Configurar CORS no servidor** (PHP envia headers permitindo)
2. **Incluir o domínio correto** na lista de permitidos

---

## 📞 Próximos Passos

1. ✅ Revisar todas as configurações deste guia
2. ✅ Preencher o checklist completo
3. ✅ Fazer deploy em ambiente de teste primeiro (staging)
4. ✅ Testar todas as funcionalidades
5. ✅ Fazer deploy em produção

---

## 📚 Recursos Adicionais

- Documentação React: https://react.dev
- Documentação PHP: https://www.php.net
- Documentação Apache: https://httpd.apache.org/docs/

---

**Última atualização**: Este guia reflete o estado atual do sistema BRS.

**Importante**: Este guia é educacional. Sempre faça backup antes de alterar configurações em produção!



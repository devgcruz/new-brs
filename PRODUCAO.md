# Configuração para Produção

Este documento descreve como configurar o sistema para ambiente de produção.

## Backend (PHP/API)

Os arquivos de configuração do backend já estão configurados para produção:

- ✅ `api/config/db.php` - Configurado com credenciais de produção
- ✅ `api/config/cors.php` - Configurado para aceitar requisições do domínio de produção
- ✅ `api/config/environment.php` - Modo de produção ativado

### Configurações Aplicadas:

1. **Banco de Dados:**
   - Host: `brsdatabase.mysql.dbaas.com.br`
   - Database: `brsdatabase`
   - User: `brsdatabase`
   - Password: `pW57@pd05#`

2. **CORS:**
   - Origens permitidas:
     - `https://brsreguladora.com.br`
     - `https://www.brsreguladora.com.br`
     - `http://localhost:3000` (para desenvolvimento local quando necessário)

3. **Modo de Produção:**
   - `PRODUCTION_MODE = true`
   - `DEBUG_MODE = false`
   - `ENABLE_LOGS = false`

## Frontend (React)

### Configuração via Variável de Ambiente

O frontend usa a variável de ambiente `REACT_APP_API_URL` para definir a URL da API.

#### Opção 1: Arquivo `.env.production.local` (Recomendado)

Crie um arquivo `.env.production.local` na raiz do projeto com:

```env
REACT_APP_API_URL=https://brsreguladora.com.br/api
```

#### Opção 2: Build com variável de ambiente

Ao fazer o build, você pode definir a variável diretamente:

**Windows (PowerShell):**
```powershell
$env:REACT_APP_API_URL="https://brsreguladora.com.br/api"
npm run build
```

**Linux/Mac:**
```bash
REACT_APP_API_URL=https://brsreguladora.com.br/api npm run build
```

### Configuração Automática

O arquivo `src/config/api.js` já está configurado para usar automaticamente:
- **Desenvolvimento:** `http://localhost/brs/api`
- **Produção:** `https://brsreguladora.com.br/api` (quando `NODE_ENV === 'production'`)

A configuração usa `process.env.NODE_ENV` para detectar automaticamente o ambiente, então ao executar `npm run build`, a URL de produção será usada automaticamente.

### Build para Produção

Para gerar a build de produção:

```bash
npm run build
```

Isso criará uma pasta `build/` com todos os arquivos otimizados e minificados prontos para deploy.

### Deploy

1. Execute `npm run build`
2. Faça upload da pasta `build/` para o servidor de produção
3. Configure o servidor web (Apache/Nginx) para servir os arquivos da pasta `build/`
4. Certifique-se de que as requisições para `/api/*` sejam direcionadas para o backend PHP

### Estrutura no Servidor de Produção

```
/
├── api/                    # Backend PHP
│   ├── config/
│   │   ├── db.php         # ✅ Configurado para produção
│   │   ├── cors.php       # ✅ Configurado para produção
│   │   └── environment.php # ✅ Modo produção ativado
│   └── endpoints/
├── build/                  # Frontend React (gerado com npm run build)
│   ├── index.html
│   ├── static/
│   └── ...
└── .htaccess              # Configuração do Apache
```

## Checklist de Deploy

- [ ] Backend configurado (`api/config/db.php` com credenciais de produção)
- [ ] Backend configurado (`api/config/cors.php` com domínio de produção)
- [ ] Backend configurado (`api/config/environment.php` com `PRODUCTION_MODE = true`)
- [ ] Frontend: Arquivo `.env.production.local` criado OU variável de ambiente definida
- [ ] Frontend: Build executado (`npm run build`)
- [ ] Pasta `build/` enviada para o servidor
- [ ] Servidor web configurado para servir os arquivos estáticos
- [ ] API acessível em `https://brsreguladora.com.br/api`
- [ ] Frontend acessível em `https://brsreguladora.com.br`

## Verificação

Após o deploy, verifique:

1. Acesse `https://brsreguladora.com.br` - O frontend deve carregar
2. Abra o console do navegador (F12) e verifique se não há erros de CORS
3. Tente fazer login - As requisições devem ir para `https://brsreguladora.com.br/api`

Se encontrar erros de CORS, verifique se:
- O domínio está na lista de `ALLOWED_ORIGINS` em `api/config/environment.php`
- Os headers CORS estão sendo enviados corretamente (verifique `api/config/cors.php`)


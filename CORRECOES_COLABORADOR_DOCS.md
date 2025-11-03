# 🔧 Correções - Upload de Documentos de Colaboradores

## Problema Identificado

Erro 500 ao tentar fazer upload de documentos em **Gerenciamento de Colaboradores** em produção.

## Correções Aplicadas

### 1. Correção da Função `checkDiskSpace`

**Problema**: A função `checkDiskSpace()` usava `PDF_UPLOAD_DIR` em vez de `COLABORADOR_DOCS_UPLOAD_DIR`.

**Correção**: Substituída por verificação direta usando o diretório correto:

```php
// ANTES (ERRADO):
if (!checkDiskSpace($file['size'])) {
    respostaJson(false, null, 'Espaço insuficiente em disco', 507);
}

// DEPOIS (CORRETO):
$free_bytes = disk_free_space(COLABORADOR_DOCS_UPLOAD_DIR);
if ($free_bytes === false || $free_bytes < $file['size']) {
    respostaJson(false, null, 'Espaço insuficiente em disco', 507);
}
```

---

### 2. Melhorias na Criação de Diretórios

**Problema**: Não havia verificação adequada se os diretórios foram criados e se têm permissão de escrita.

**Correção**: Adicionadas verificações detalhadas:

```php
// Garantir que o diretório base existe
if (!is_dir(COLABORADOR_DOCS_UPLOAD_DIR)) {
    if (!mkdir(COLABORADOR_DOCS_UPLOAD_DIR, 0755, true)) {
        respostaJson(false, null, 'Erro ao criar diretório de upload', 500);
    }
}

// Criar estrutura por data
if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0755, true)) {
        respostaJson(false, null, 'Erro ao criar diretório de upload por data', 500);
    }
}

// Verificar permissão de escrita
if (!is_writable($upload_dir)) {
    respostaJson(false, null, 'Diretório de upload sem permissão de escrita', 500);
}
```

---

### 3. Melhor Tratamento de Erros no Banco de Dados

**Problema**: Se a tabela tivesse colunas diferentes das esperadas, o INSERT falhava silenciosamente.

**Correção**: Agora o código:
1. Verifica quais colunas existem na tabela
2. Constrói o SQL dinamicamente com apenas as colunas disponíveis
3. Tenta inserção simplificada se a primeira tentativa falhar
4. Registra erros detalhados para debug

```php
// Verifica colunas disponíveis
$test_stmt = $pdo->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '$docs_table'");
$columns = $test_stmt->fetchAll(PDO::FETCH_COLUMN);

// Constrói SQL dinamicamente
if (in_array('ID_Colaborador', $columns)) {
    $columns_to_insert[] = 'ID_Colaborador';
    // ...
}
```

---

### 4. Logging Melhorado

**Problema**: Erros não eram logados adequadamente em produção.

**Correção**: Adicionado `error_log()` para garantir que erros sejam registrados mesmo com logs desabilitados:

```php
catch (Exception $e) {
    $error_message = $e->getMessage();
    $error_trace = $e->getTraceAsString();
    
    // Log detalhado (mesmo em produção)
    error_log("❌ Erro no upload de documento: " . $error_message);
    error_log("Trace: " . $error_trace);
    
    // Mensagem apropriada para o ambiente
    $message = defined('PRODUCTION_MODE') && PRODUCTION_MODE 
        ? 'Erro interno no upload. Contate o administrador.' 
        : 'Erro interno no upload: ' . $error_message;
    
    respostaJson(false, null, $message, 500);
}
```

---

## ⚠️ O que Verificar em Produção

### 1. Permissões da Pasta de Upload

No servidor de produção, verificar e ajustar permissões:

```bash
# Verificar se a pasta existe
ls -la api/upload/colaborador-docs/

# Ajustar permissões se necessário
chmod 755 api/upload/colaborador-docs/
chmod -R 755 api/upload/colaborador-docs/

# Verificar se o usuário do PHP tem permissão de escrita
# (geralmente o usuário é www-data ou similar)
```

**Importante**: A pasta deve permitir escrita pelo usuário do servidor web (Apache/Nginx).

---

### 2. Verificar Estrutura da Tabela

Execute no banco de dados:

```sql
-- Verificar se a tabela existe
SHOW TABLES LIKE 'tab_colaborador_docs';

-- Verificar colunas da tabela
DESCRIBE tab_colaborador_docs;
-- ou
SHOW COLUMNS FROM tab_colaborador_docs;
```

**Colunas mínimas esperadas**:
- `ID_Doc` (ou `id`) - PRIMARY KEY AUTO_INCREMENT
- `ID_Colaborador` - INT, NOT NULL
- `DESCRICAO` - VARCHAR/TEXT
- `CAMINHOPDF` - VARCHAR/TEXT (caminho do arquivo)
- `token_visualizacao` - VARCHAR
- `TAMANHO_ARQUIVO` - INT/BIGINT
- `TIPO_ARQUIVO` - VARCHAR
- `DATA_REGISTRO` - DATETIME/TIMESTAMP

---

### 3. Verificar Logs de Erro do PHP

No servidor de produção, verificar logs de erro:

**Linux/Apache**:
```bash
tail -f /var/log/apache2/error.log
# ou
tail -f /var/log/php/error.log
```

**Windows/XAMPP**:
```bash
# Verificar em:
C:\xampp\php\logs\php_error_log
C:\xampp\apache\logs\error.log
```

**Ou usar `error_log()` do PHP** (já implementado) - os erros aparecem no log configurado no `php.ini`.

---

### 4. Verificar Limites do PHP

Verifique no `php.ini` ou `.user.ini`:

```ini
upload_max_filesize = 50M
post_max_size = 50M
max_execution_time = 300
memory_limit = 256M
```

---

### 5. Verificar Espaço em Disco

```bash
# Verificar espaço disponível
df -h

# Verificar tamanho da pasta de upload
du -sh api/upload/colaborador-docs/
```

---

## 🔍 Como Diagnosticar o Problema

### 1. Verificar Erro 401 (Autenticação)

Se aparecer erro 401:

1. **Verificar se o token está sendo enviado**:
   - Abra o console do navegador (F12)
   - Aba "Network"
   - Procure a requisição `colaborador-docs`
   - Verifique o header `Authorization: Bearer <token>`

2. **Verificar se o token está válido**:
   - Faça logout e login novamente
   - Verifique se o token foi atualizado no banco

3. **Verificar CORS**:
   - Verifique se o domínio está em `ALLOWED_ORIGINS` em `api/config/environment.php`

---

### 2. Verificar Erro 500 (Servidor)

Se aparecer erro 500:

1. **Verificar logs do PHP** (veja acima)

2. **Testar endpoint diretamente**:
   ```bash
   # Via cURL (substitua TOKEN pelo token real)
   curl -X GET "https://brsreguladora.com.br/api/colaborador-docs?ID_Colaborador=1" \
     -H "Authorization: Bearer TOKEN" \
     -H "Accept: application/json"
   ```

3. **Verificar permissões** (veja acima)

4. **Verificar estrutura da tabela** (veja acima)

---

## ✅ Checklist de Verificação

- [ ] Pasta `api/upload/colaborador-docs/` existe
- [ ] Permissão da pasta é 755 ou 775
- [ ] Usuário do servidor web tem permissão de escrita
- [ ] Tabela `tab_colaborador_docs` existe no banco
- [ ] Tabela tem as colunas mínimas necessárias
- [ ] Limites do PHP (`upload_max_filesize`, `post_max_size`) estão adequados
- [ ] Há espaço em disco disponível
- [ ] Logs de erro do PHP estão configurados e acessíveis
- [ ] CORS está configurado corretamente
- [ ] Token de autenticação está sendo enviado nas requisições

---

## 📝 Próximos Passos

1. **Fazer upload das correções** para o servidor de produção
2. **Verificar permissões** da pasta de upload
3. **Testar upload** de um documento pequeno
4. **Verificar logs** se ainda houver erro
5. **Ajustar configurações** conforme necessário

---

## 🆘 Se o Problema Persistir

1. **Habilitar logs temporariamente** em produção:
   ```php
   // Em api/config/environment.php (TEMPORÁRIO)
   define('ENABLE_LOGS', true);
   define('DEBUG_MODE', true);
   ```

2. **Verificar logs** em `api/logs/api.log`

3. **Testar com documento pequeno** primeiro (menos de 1MB)

4. **Verificar se a estrutura da tabela** coincide com o esperado

5. **Verificar versão do PHP** (deve ser 7.4+)

---

**Última atualização**: Correções aplicadas para melhorar tratamento de erros e diagnóstico de problemas em produção.



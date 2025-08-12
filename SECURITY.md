# Guia de Segurança - Kanban Dashboard para Chatwoot

## 🔒 Visão Geral de Segurança

Este documento descreve as medidas de segurança implementadas no Kanban Dashboard para Chatwoot e as melhores práticas para uma implementação segura.

## 🛡️ Recursos de Segurança Implementados

### 1. Validação de Origem (Origin Validation)

**O que faz**: Verifica se as mensagens recebidas vêm de origens autorizadas.

**Como funciona**:
- Lista de origens permitidas configurável
- Suporte a wildcards para subdomínios
- Rejeição automática de origens não autorizadas
- Logging de tentativas não autorizadas

**Configuração**:
```javascript
// src/utils/security.js
const defaultAllowedOrigins = [
  'https://app.chatwoot.com',
  'https://*.chatwoot.com',
  'http://localhost:3000'
];
```

### 2. Sanitização de Dados (Data Sanitization)

**O que faz**: Remove ou escapa caracteres perigosos dos dados recebidos.

**Proteções**:
- Prevenção de XSS (Cross-Site Scripting)
- Escape de caracteres HTML especiais
- Validação de tipos de dados
- Limpeza recursiva de objetos

**Exemplo**:
```javascript
// Entrada: "<script>alert('xss')</script>"
// Saída: "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
```

### 3. Rate Limiting

**O que faz**: Limita o número de requisições por origem em um período de tempo.

**Configuração padrão**:
- 50 requisições por minuto por origem
- Janela deslizante de 60 segundos
- Limpeza automática de dados antigos

**Personalização**:
```javascript
const rateLimiter = new RateLimiter(100, 60000); // 100 req/min
```

### 4. Validação de Estrutura de Dados

**O que faz**: Verifica se os dados recebidos têm a estrutura esperada do Chatwoot.

**Validações**:
- Presença de campos obrigatórios
- Tipos de dados corretos
- Estrutura de objetos válida
- IDs numéricos válidos

### 5. Logging Seguro

**O que faz**: Registra eventos sem expor informações sensíveis.

**Características**:
- Redação automática de campos sensíveis
- Timestamps precisos
- Níveis de log (info, warn, error)
- Não exposição de tokens ou senhas

## 🚨 Vulnerabilidades Mitigadas

### Cross-Site Scripting (XSS)
- **Mitigação**: Sanitização de todos os dados de entrada
- **Implementação**: Função `sanitizeString()` e `validateAndSanitizeInput()`

### Cross-Origin Attacks
- **Mitigação**: Validação rigorosa de origem
- **Implementação**: Função `validateOrigin()` com lista de origens permitidas

### Data Injection
- **Mitigação**: Validação de estrutura e tipos de dados
- **Implementação**: Função `validateChatwootData()`

### Denial of Service (DoS)
- **Mitigação**: Rate limiting por origem
- **Implementação**: Classe `RateLimiter`

### Information Disclosure
- **Mitigação**: Logging seguro sem exposição de dados sensíveis
- **Implementação**: Classe `SecureLogger`

## 🔧 Configuração Segura

### 1. Variáveis de Ambiente

Sempre configure as variáveis de ambiente adequadamente:

```env
# Apenas origens confiáveis
VITE_ALLOWED_ORIGINS=https://your-chatwoot.com,https://app.chatwoot.com

# Rate limiting apropriado
VITE_RATE_LIMIT_REQUESTS=50
VITE_RATE_LIMIT_WINDOW_MS=60000

# Desabilitar debug em produção
VITE_DEBUG_LOGS=false
VITE_DEV_MODE=false
```

### 2. Headers de Segurança do Servidor

Configure seu servidor web com headers de segurança:

```nginx
# Nginx
add_header X-Frame-Options SAMEORIGIN;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
```

### 3. HTTPS Obrigatório

**Sempre use HTTPS em produção**:
- Protege dados em trânsito
- Previne ataques man-in-the-middle
- Requerido pelo Chatwoot para Dashboard Apps

## 🔍 Monitoramento e Auditoria

### 1. Logs de Segurança

Monitore os seguintes eventos nos logs:

```javascript
// Origens não autorizadas
"Origem não autorizada detectada"

// Rate limiting
"Rate limit excedido"

// Dados inválidos
"Dados inválidos recebidos do Chatwoot"

// Erros de processamento
"Erro ao processar dados do Chatwoot"
```

### 2. Métricas Recomendadas

- Número de tentativas de origem não autorizada por hora
- Taxa de erro de validação de dados
- Frequência de rate limiting ativado
- Tempo de resposta da aplicação

### 3. Alertas

Configure alertas para:
- Múltiplas tentativas de origem não autorizada
- Picos anômalos de tráfego
- Erros de validação frequentes
- Falhas de comunicação com Chatwoot

## 🚀 Melhores Práticas de Deploy

### 1. Ambiente de Produção

```bash
# Build otimizado
NODE_ENV=production pnpm run build

# Verificar arquivos gerados
ls -la dist/

# Testar localmente antes do deploy
pnpm run preview
```

### 2. Verificações Pré-Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Origens permitidas atualizadas
- [ ] HTTPS configurado
- [ ] Headers de segurança implementados
- [ ] Logs funcionando corretamente
- [ ] Rate limiting testado

### 3. Testes de Segurança

```javascript
// Teste de origem não autorizada
const maliciousEvent = new MessageEvent('message', {
  data: JSON.stringify({}),
  origin: 'https://malicious-site.com'
});

// Teste de dados maliciosos
const xssData = {
  event: 'appContext',
  data: {
    contact: { name: '<script>alert("xss")</script>' }
  }
};
```

## 🆘 Resposta a Incidentes

### 1. Detecção de Ameaças

Se detectar atividade suspeita:

1. **Analise os logs** para identificar o padrão
2. **Bloqueie a origem** se necessário
3. **Aumente o rate limiting** temporariamente
4. **Notifique a equipe** de segurança

### 2. Procedimentos de Emergência

```javascript
// Bloquear origem específica
const blockedOrigins = ['https://malicious-site.com'];

// Reduzir rate limit temporariamente
const emergencyRateLimit = new RateLimiter(10, 60000);

// Habilitar logs detalhados
VITE_DEBUG_LOGS=true
```

### 3. Recuperação

1. **Identifique a causa raiz**
2. **Aplique correções necessárias**
3. **Teste as correções**
4. **Monitore por 24-48 horas**
5. **Documente o incidente**

## 📋 Checklist de Segurança

### Desenvolvimento
- [ ] Validação de origem implementada
- [ ] Sanitização de dados ativa
- [ ] Rate limiting configurado
- [ ] Logging seguro funcionando
- [ ] Testes de segurança passando

### Deploy
- [ ] HTTPS configurado
- [ ] Headers de segurança implementados
- [ ] Variáveis de ambiente seguras
- [ ] Origens permitidas atualizadas
- [ ] Monitoramento ativo

### Manutenção
- [ ] Logs revisados regularmente
- [ ] Métricas de segurança monitoradas
- [ ] Atualizações de segurança aplicadas
- [ ] Testes de penetração realizados
- [ ] Documentação atualizada

## 📞 Contato para Questões de Segurança

Para reportar vulnerabilidades de segurança:

1. **NÃO** abra issues públicas
2. Entre em contato diretamente com a equipe
3. Forneça detalhes técnicos completos
4. Aguarde confirmação antes de divulgar

---

**A segurança é responsabilidade de todos. Mantenha-se atualizado e vigilante!**


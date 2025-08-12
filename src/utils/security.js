// Utilitários de segurança para o Dashboard App do Chatwoot

/**
 * Valida se os dados recebidos do Chatwoot são válidos
 * @param {any} data - Dados recebidos
 * @returns {boolean} - True se os dados são válidos
 */
export const validateChatwootData = (data) => {
  try {
    // Verificar se é um objeto válido
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Verificar se tem a estrutura esperada do Chatwoot
    if (data.event === 'appContext' && data.data) {
      const { conversation, contact, currentAgent } = data.data;
      
      // Validações básicas de estrutura
      if (conversation && typeof conversation.id === 'number') {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Erro na validação dos dados do Chatwoot:', error);
    return false;
  }
};

/**
 * Sanitiza strings para prevenir XSS
 * @param {string} str - String a ser sanitizada
 * @returns {string} - String sanitizada
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Valida se uma URL é segura
 * @param {string} url - URL a ser validada
 * @returns {boolean} - True se a URL é segura
 */
export const isSecureUrl = (url) => {
  try {
    const urlObj = new URL(url);
    
    // Permitir apenas HTTPS e HTTP para localhost
    if (urlObj.protocol === 'https:') {
      return true;
    }
    
    if (urlObj.protocol === 'http:' && 
        (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Valida origem da mensagem para prevenir ataques de origem cruzada
 * @param {string} origin - Origem da mensagem
 * @param {Array<string>} allowedOrigins - Origens permitidas
 * @returns {boolean} - True se a origem é permitida
 */
export const validateOrigin = (origin, allowedOrigins = []) => {
  // Lista padrão de origens permitidas do Chatwoot
  const defaultAllowedOrigins = [
    'https://app.chatwoot.com',
    'https://*.chatwoot.com',
    'http://localhost:3000',
    'http://localhost:8080'
  ];

  const allAllowedOrigins = [...defaultAllowedOrigins, ...allowedOrigins];

  return allAllowedOrigins.some(allowedOrigin => {
    if (allowedOrigin.includes('*')) {
      // Suporte para wildcards
      const pattern = allowedOrigin.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    }
    return origin === allowedOrigin;
  });
};

/**
 * Gera um token CSRF simples
 * @returns {string} - Token CSRF
 */
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Valida token CSRF
 * @param {string} token - Token a ser validado
 * @param {string} storedToken - Token armazenado
 * @returns {boolean} - True se o token é válido
 */
export const validateCSRFToken = (token, storedToken) => {
  return token && storedToken && token === storedToken;
};

/**
 * Limita a taxa de requisições (rate limiting simples)
 */
export class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Limpar requisições antigas
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(time => time > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }

    // Verificar limite para o identificador atual
    const userRequests = this.requests.get(identifier) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Adicionar nova requisição
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }
}

/**
 * Valida dados de entrada para prevenir injection
 * @param {any} data - Dados a serem validados
 * @returns {any} - Dados validados e sanitizados
 */
export const validateAndSanitizeInput = (data) => {
  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => validateAndSanitizeInput(item));
  }

  if (data && typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = validateAndSanitizeInput(value);
    }
    return sanitized;
  }

  return data;
};

/**
 * Logger seguro que não expõe informações sensíveis
 */
export class SecureLogger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const sanitizedData = this.sanitizeLogData(data);
    
    console[level](`[${timestamp}] ${message}`, sanitizedData);
  }

  static sanitizeLogData(data) {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      }
      
      return sanitized;
    }
    
    return data;
  }

  static info(message, data) {
    this.log('info', message, data);
  }

  static warn(message, data) {
    this.log('warn', message, data);
  }

  static error(message, data) {
    this.log('error', message, data);
  }
}


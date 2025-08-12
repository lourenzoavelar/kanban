# Guia de Deploy - Kanban Dashboard para Chatwoot

## 🚀 Opções de Deploy

Este guia apresenta diferentes opções para fazer deploy do Kanban Dashboard para Chatwoot em produção.

## 📋 Pré-requisitos

- Aplicação testada localmente
- Domínio ou subdomínio configurado
- Certificado SSL/TLS (HTTPS obrigatório)
- Acesso administrativo ao Chatwoot

## 🌐 Deploy em Servidor Web Tradicional

### Nginx

#### 1. Build da Aplicação
```bash
# No diretório do projeto
pnpm run build

# Verificar arquivos gerados
ls -la dist/
```

#### 2. Configuração do Nginx
```nginx
# /etc/nginx/sites-available/kanban-dashboard
server {
    listen 80;
    server_name kanban.seudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name kanban.seudominio.com;
    
    # Certificados SSL
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Diretório da aplicação
    root /var/www/kanban-dashboard/dist;
    index index.html;
    
    # Configuração SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Headers de segurança
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" always;
    
    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Logs
    access_log /var/log/nginx/kanban-dashboard.access.log;
    error_log /var/log/nginx/kanban-dashboard.error.log;
}
```

#### 3. Ativação do Site
```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/kanban-dashboard /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### Apache

#### 1. Configuração do Apache
```apache
# /etc/apache2/sites-available/kanban-dashboard.conf
<VirtualHost *:80>
    ServerName kanban.seudominio.com
    Redirect permanent / https://kanban.seudominio.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName kanban.seudominio.com
    DocumentRoot /var/www/kanban-dashboard/dist
    
    # SSL
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    
    # Configuração SPA
    <Directory /var/www/kanban-dashboard/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Fallback para SPA
        FallbackResource /index.html
    </Directory>
    
    # Headers de segurança
    Header always set X-Frame-Options SAMEORIGIN
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Cache
    <LocationMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header set Cache-Control "public, immutable"
    </LocationMatch>
    
    # Logs
    CustomLog /var/log/apache2/kanban-dashboard.access.log combined
    ErrorLog /var/log/apache2/kanban-dashboard.error.log
</VirtualHost>
```

#### 2. Ativação do Site
```bash
# Habilitar módulos necessários
sudo a2enmod ssl rewrite headers expires

# Ativar site
sudo a2ensite kanban-dashboard

# Recarregar Apache
sudo systemctl reload apache2
```

## ☁️ Deploy em Plataformas Cloud

### Vercel

#### 1. Preparação
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login
```

#### 2. Configuração
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

#### 3. Deploy
```bash
# Deploy
vercel --prod

# Configurar domínio customizado
vercel domains add kanban.seudominio.com
```

### Netlify

#### 1. Configuração
```toml
# netlify.toml
[build]
  publish = "dist"
  command = "pnpm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

#### 2. Deploy
```bash
# Via CLI
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist

# Ou conectar repositório Git via interface web
```

### AWS S3 + CloudFront

#### 1. Configuração do S3
```bash
# Criar bucket
aws s3 mb s3://kanban-dashboard-bucket

# Upload dos arquivos
aws s3 sync dist/ s3://kanban-dashboard-bucket --delete

# Configurar website
aws s3 website s3://kanban-dashboard-bucket --index-document index.html --error-document index.html
```

#### 2. Configuração do CloudFront
```json
{
  "DistributionConfig": {
    "CallerReference": "kanban-dashboard-2024",
    "DefaultRootObject": "index.html",
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "S3-kanban-dashboard",
          "DomainName": "kanban-dashboard-bucket.s3.amazonaws.com",
          "S3OriginConfig": {
            "OriginAccessIdentity": ""
          }
        }
      ]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-kanban-dashboard",
      "ViewerProtocolPolicy": "redirect-to-https",
      "Compress": true
    },
    "CustomErrorResponses": {
      "Quantity": 1,
      "Items": [
        {
          "ErrorCode": 404,
          "ResponsePagePath": "/index.html",
          "ResponseCode": "200"
        }
      ]
    }
  }
}
```

## 🐳 Deploy com Docker

### 1. Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Configuração do Nginx para Docker
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # Headers de segurança
        add_header X-Frame-Options SAMEORIGIN always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
}
```

### 3. Build e Deploy
```bash
# Build da imagem
docker build -t kanban-dashboard .

# Executar container
docker run -d -p 80:80 --name kanban-dashboard kanban-dashboard

# Ou usar docker-compose
```

### 4. Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  kanban-dashboard:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.kanban.rule=Host(`kanban.seudominio.com`)"
      - "traefik.http.routers.kanban.tls=true"
      - "traefik.http.routers.kanban.tls.certresolver=letsencrypt"
```

## 🔧 Configuração no Chatwoot

### 1. Adicionar Dashboard App

1. Acesse **Settings → Integrations → Dashboard apps**
2. Clique em **Configure**
3. Adicione:
   - **Nome**: `Kanban Dashboard`
   - **URL**: `https://kanban.seudominio.com`

### 2. Testar Integração

1. Abra uma conversa no Chatwoot
2. Procure pela aba "Kanban Dashboard"
3. Clique para carregar o dashboard
4. Verifique se os dados são carregados corretamente

## 🔍 Verificações Pós-Deploy

### 1. Checklist Técnico
- [ ] HTTPS funcionando corretamente
- [ ] Headers de segurança configurados
- [ ] SPA routing funcionando
- [ ] Assets sendo servidos com cache
- [ ] Logs sendo gerados

### 2. Checklist de Segurança
- [ ] Certificado SSL válido
- [ ] Headers de segurança presentes
- [ ] CSP configurado adequadamente
- [ ] Origens permitidas atualizadas
- [ ] Rate limiting funcionando

### 3. Checklist de Performance
- [ ] Assets comprimidos (gzip/brotli)
- [ ] Cache configurado para assets estáticos
- [ ] CDN configurado (se aplicável)
- [ ] Tempo de carregamento < 3 segundos

### 4. Testes de Integração
```bash
# Testar conectividade
curl -I https://kanban.seudominio.com

# Testar headers de segurança
curl -I https://kanban.seudominio.com | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)"

# Testar SPA routing
curl -I https://kanban.seudominio.com/any-path
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. App não carrega no Chatwoot
```bash
# Verificar se a URL está acessível
curl -I https://kanban.seudominio.com

# Verificar headers CORS
curl -H "Origin: https://app.chatwoot.com" -I https://kanban.seudominio.com
```

#### 2. Erro 404 em rotas SPA
- Verificar configuração de fallback para index.html
- Confirmar que o servidor está configurado para SPA

#### 3. Headers de segurança ausentes
- Verificar configuração do servidor web
- Testar com ferramentas como securityheaders.com

#### 4. Problemas de SSL
```bash
# Testar certificado
openssl s_client -connect kanban.seudominio.com:443 -servername kanban.seudominio.com

# Verificar validade
curl -I https://kanban.seudominio.com
```

## 📊 Monitoramento

### 1. Logs Importantes
```bash
# Nginx
tail -f /var/log/nginx/kanban-dashboard.access.log
tail -f /var/log/nginx/kanban-dashboard.error.log

# Apache
tail -f /var/log/apache2/kanban-dashboard.access.log
tail -f /var/log/apache2/kanban-dashboard.error.log
```

### 2. Métricas Recomendadas
- Tempo de resposta
- Taxa de erro 4xx/5xx
- Uso de bandwidth
- Número de usuários únicos
- Tempo de carregamento da página

### 3. Alertas
- Certificado SSL próximo do vencimento
- Aumento anômalo de erros 5xx
- Tempo de resposta elevado
- Falha na conectividade

## 🔄 Atualizações

### 1. Processo de Atualização
```bash
# 1. Backup da versão atual
cp -r /var/www/kanban-dashboard /var/www/kanban-dashboard.backup

# 2. Build da nova versão
git pull origin main
pnpm install
pnpm run build

# 3. Deploy da nova versão
rsync -av dist/ /var/www/kanban-dashboard/dist/

# 4. Verificar funcionamento
curl -I https://kanban.seudominio.com

# 5. Remover backup se tudo estiver OK
rm -rf /var/www/kanban-dashboard.backup
```

### 2. Rollback
```bash
# Em caso de problemas
mv /var/www/kanban-dashboard.backup /var/www/kanban-dashboard
sudo systemctl reload nginx
```

---

**Deploy realizado com sucesso! 🎉**

Lembre-se de manter a aplicação atualizada e monitorar regularmente os logs e métricas de performance.


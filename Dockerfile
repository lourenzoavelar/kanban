# Etapa de build
FROM node:20-alpine AS build
WORKDIR /app

# Habilitar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar apenas manifests primeiro (cache deps)
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Copiar todo o código
COPY . .

# Copiar env se quiser usar no build (VITE_* no .env)
# COPY .env .env

# Build do projeto
RUN pnpm run build

# Etapa de serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Configuração para SPA (Vite)
RUN printf 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri /index.html; \
    } \
}\n' > /etc/nginx/conf.d/default.conf

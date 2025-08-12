# Build SPA (Vite)
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
COPY . .
# VITE_* serão lidas aqui:
RUN pnpm run build

# Serve + Proxy
FROM nginx:alpine
# arquivos estáticos
COPY --from=build /app/dist /usr/share/nginx/html
# conf de proxy (vamos injetar via volume ou copiar direto)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# saúde
HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD wget --spider -q http://127.0.0.1 || exit 1

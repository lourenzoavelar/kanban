# Kanban Dashboard para Chatwoot

Uma aplicação Kanban integrada ao Chatwoot como Dashboard App, permitindo gerenciar tarefas baseadas em conversas e contatos do Chatwoot de forma visual e intuitiva.

## 🚀 Características

- **Integração Nativa com Chatwoot**: Recebe dados em tempo real das conversas e contatos
- **Interface Kanban Intuitiva**: Visualização em colunas (Pendente, Em Andamento, Concluído)
- **Geração Automática de Tarefas**: Cria tarefas baseadas no status das conversas
- **Segurança Robusta**: Validação de origem, sanitização de dados e rate limiting
- **Responsivo**: Funciona em desktop e mobile
- **Múltiplas Visualizações**: Kanban Board, Lista de Tarefas e Informações do Cliente

## 📋 Pré-requisitos

- Node.js 18+ 
- pnpm (recomendado) ou npm
- Instância do Chatwoot (Cloud ou Self-hosted)
- Acesso de administrador ao Chatwoot para configurar Dashboard Apps

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd chatwoot-kanban-dashboard
```

### 2. Instale as dependências
```bash
pnpm install
# ou
npm install
```

### 3. Configure o ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
VITE_CHATWOOT_BASE_URL=https://app.chatwoot.com
VITE_APP_NAME=Kanban Dashboard
VITE_ALLOWED_ORIGINS=https://app.chatwoot.com,https://your-chatwoot-instance.com
```

### 4. Execute em desenvolvimento
```bash
pnpm run dev --host
# ou
npm run dev -- --host
```

A aplicação estará disponível em `http://localhost:5173`

## 🔧 Configuração no Chatwoot

### 1. Acesse as Configurações
- Vá para **Settings → Integrations → Dashboard apps**
- Clique em **Configure** no Dashboard Apps

### 2. Adicione o App
- **Nome do App**: `Kanban Dashboard`
- **URL**: `https://seu-dominio.com` (URL onde a aplicação está hospedada)

### 3. Teste a Integração
- Abra uma conversa no Chatwoot
- Você verá uma nova aba "Kanban Dashboard" na interface da conversa
- Clique na aba para carregar o dashboard

## 📦 Deploy

### Deploy Automático (Recomendado)
```bash
pnpm run build
pnpm run deploy
```

### Deploy Manual
```bash
# Build da aplicação
pnpm run build

# O conteúdo estará na pasta dist/
# Faça upload para seu servidor web (Nginx, Apache, etc.)
```

### Configuração do Servidor Web

#### Nginx
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        root /path/to/chatwoot-kanban-dashboard/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Headers de segurança
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

#### Apache
```apache
<VirtualHost *:80>
    ServerName seu-dominio.com
    DocumentRoot /path/to/chatwoot-kanban-dashboard/dist
    
    <Directory /path/to/chatwoot-kanban-dashboard/dist>
        AllowOverride All
        Require all granted
    </Directory>
    
    # Headers de segurança
    Header always set X-Frame-Options SAMEORIGIN
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

## 🔒 Segurança

### Recursos de Segurança Implementados

1. **Validação de Origem**: Apenas origens autorizadas podem enviar dados
2. **Sanitização de Dados**: Todos os dados recebidos são sanitizados para prevenir XSS
3. **Rate Limiting**: Limita o número de requisições por minuto
4. **Validação de Estrutura**: Verifica se os dados recebidos têm a estrutura esperada
5. **Logging Seguro**: Logs não expõem informações sensíveis

### Configuração de Origens Permitidas

Edite o arquivo `src/utils/security.js` para adicionar suas origens:

```javascript
const defaultAllowedOrigins = [
  'https://app.chatwoot.com',
  'https://your-chatwoot-instance.com',
  'http://localhost:3000', // Para desenvolvimento
];
```

## 📊 Como Funciona

### Fluxo de Dados

1. **Chatwoot envia dados**: Quando uma conversa é aberta, o Chatwoot envia dados via `postMessage`
2. **Validação**: A aplicação valida origem, estrutura e sanitiza os dados
3. **Geração de Tarefas**: Tarefas são criadas automaticamente baseadas no status da conversa
4. **Visualização**: As tarefas são exibidas no board Kanban

### Tipos de Tarefas Geradas

- **Conversa Ativa**: Para conversas com status "open"
- **Mensagens Não Lidas**: Para conversas com mensagens pendentes
- **Follow-up**: Para conversas resolvidas que precisam de acompanhamento
- **Tarefas Customizadas**: Criadas manualmente pelo usuário

## 🎨 Personalização

### Temas e Cores

Edite o arquivo `src/App.css` para personalizar cores e estilos:

```css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
}
```

### Adicionando Novos Tipos de Tarefa

1. Edite a função `generateTasksFromChatwootData` em `src/App.jsx`
2. Adicione sua lógica de geração de tarefas
3. Defina cores e ícones apropriados

## 🐛 Troubleshooting

### Problemas Comuns

#### App não carrega no Chatwoot
- Verifique se a URL está correta nas configurações
- Confirme que o servidor está acessível publicamente
- Verifique os headers CORS

#### Dados não são recebidos
- Verifique se a origem está na lista de origens permitidas
- Confirme que o Chatwoot está enviando dados corretamente
- Verifique o console do navegador para erros

#### Avisos de segurança
- Verifique se a origem da mensagem está autorizada
- Confirme que os dados têm a estrutura esperada
- Verifique se não está excedendo o rate limit

### Logs e Debugging

Para habilitar logs detalhados, abra o console do navegador. A aplicação usa o `SecureLogger` que registra:

- Dados recebidos do Chatwoot
- Validações de segurança
- Erros de processamento
- Avisos de origem não autorizada

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

Para suporte e dúvidas:

1. Verifique a documentação acima
2. Consulte a seção de troubleshooting
3. Abra uma issue no GitHub
4. Entre em contato com a equipe de desenvolvimento

## 🔄 Atualizações

Para manter a aplicação atualizada:

```bash
git pull origin main
pnpm install
pnpm run build
```

## 📈 Roadmap

- [ ] Drag & Drop entre colunas
- [ ] Notificações em tempo real
- [ ] Integração com API do Chatwoot para ações
- [ ] Relatórios e métricas
- [ ] Temas personalizáveis
- [ ] Suporte a múltiplos idiomas

---

**Desenvolvido com ❤️ para a comunidade Chatwoot**


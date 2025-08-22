# Sistema Laboratorial - Multitenant

Um sistema moderno e completo para gestão laboratorial, desenvolvido com Next.js 15, TypeScript, Prisma e PostgreSQL, seguindo as melhores práticas de desenvolvimento e arquitetura DDD (Domain-Driven Design).

## 🚀 Características Principais

- **Arquitetura Multitenant**: Uma instância para múltiplos clientes
- **Segurança Avançada**: JWT, bcrypt, rate limiting, auditoria completa
- **Interface Moderna**: Design responsivo com Tailwind CSS e temas dark/light
- **Performance Otimizada**: Redis para cache, indexação inteligente do banco
- **Tipagem Forte**: TypeScript em todo o projeto
- **Containerização**: Docker com desenvolvimento e produção otimizados

## 🛠️ Tecnologias

### Backend
- **Next.js 15**: Framework React com App Router
- **TypeScript**: Tipagem estática
- **Prisma**: ORM moderno para TypeScript
- **PostgreSQL**: Banco de dados principal
- **Redis**: Cache e sessões
- **JWT**: Autenticação e autorização
- **Joi**: Validação de dados
- **bcrypt**: Hash de senhas

### Frontend
- **React 18**: Biblioteca UI
- **Tailwind CSS**: Framework CSS utilitário
- **next-themes**: Gerenciamento de temas
- **Lucide React**: Ícones modernos
- **Context API**: Gerenciamento de estado

### Infraestrutura
- **Docker**: Containerização
- **Nginx**: Proxy reverso para produção
- **Docker Compose**: Orquestração de containers

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── api/               # Rotas da API
│   ├── auth/              # Páginas de autenticação
│   ├── dashboard/         # Dashboard principal
│   └── layout.tsx         # Layout raiz
├── components/            # Componentes React reutilizáveis
├── contexts/              # Contexts do React (Account, Business)
├── domain/                # Camada de domínio (DDD)
├── application/           # Camada de aplicação (DDD)
├── infrastructure/        # Camada de infraestrutura (DDD)
├── lib/                   # Configurações (Prisma, Redis, JWT)
├── middleware/            # Middlewares de autenticação
├── types/                 # Tipos TypeScript
├── utils/                 # Utilitários (validação, crypto)
└── styles/                # Estilos globais
```

## 🗄️ Banco de Dados

### Tabelas Principais

- **business**: Empresas (tenants)
- **accounts**: Usuários do sistema
- **account_preferences**: Preferências dos usuários
- **tokens_jwt**: Controle de sessões
- **auditoria**: Log de todas as ações

### Características do Banco
- Índices otimizados para performance
- Triggers automáticos para `updated_at`
- Views úteis para consultas frequentes
- Function para limpeza automática de tokens

## 🔧 Configuração e Instalação

### Pré-requisitos
- Node.js 18+
- Docker e Docker Compose
- Git

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd app-laboratoriais
```

2. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
# Edite .env.local com suas configurações
```

3. **Para desenvolvimento com Docker**
```bash
npm run docker:dev
```

4. **Para produção com Docker**
```bash
npm run docker:prod
```

### Desenvolvimento Local (sem Docker)

1. **Instale as dependências**
```bash
npm install
```

2. **Configure o banco PostgreSQL e Redis localmente**

3. **Execute as migrações**
```bash
npm run db:push
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

## 🐳 Docker

### Desenvolvimento
```bash
# Iniciar ambiente completo
./scripts/dev.sh

# Ou manualmente
docker-compose -f docker-compose.dev.yml up --build
```

### Produção
```bash
# Iniciar ambiente otimizado
./scripts/prod.sh

# Ou manualmente  
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🔐 Segurança

### Implementadas
- Autenticação JWT com tokens seguros
- Rate limiting para prevenir ataques
- Validação rigorosa de entrada
- Hash seguro de senhas (bcrypt)
- Headers de segurança (CORS, CSP, etc.)
- Auditoria completa de ações
- Sanitização de dados
- HTTPS para produção

### Políticas de Senha
- Mínimo 8 caracteres
- 1 letra minúscula
- 1 letra maiúscula  
- 1 número
- 1 caractere especial

## 📱 Interface

### Características
- Design responsivo e moderno
- Tema dark/light com persistência
- Navegação intuitiva
- Feedback visual consistente
- Acessibilidade otimizada

### Páginas Implementadas
- `/auth/login` - Login do usuário
- `/auth/create` - Criação de conta/empresa
- `/auth/recovery` - Recuperação de senha
- `/dashboard` - Dashboard principal
- `/profile` - Perfil do usuário
- `/sessions` - Gerenciamento de sessões
- `/logs` - Logs de auditoria

## 🔍 Auditoria e Logs

Todas as ações são registradas na tabela `auditoria` incluindo:
- Login/logout de usuários
- Alterações de perfil
- Mudanças de senha
- Criação/edição de registros
- Tentativas de acesso negadas

## 🚦 Monitoramento

### Health Checks
- Conexão com PostgreSQL
- Conexão com Redis  
- Status dos serviços

### Rate Limiting
- Login: 5 tentativas por minuto
- APIs gerais: Configurável por endpoint

## 📊 Performance

### Otimizações Implementadas
- Índices de banco otimizados
- Cache Redis para sessões
- Queries Prisma otimizadas
- Lazy loading de componentes
- Compressão Gzip
- Assets otimizados

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev                 # Servidor de desenvolvimento
npm run docker:dev          # Ambiente Docker de desenvolvimento

# Produção
npm run build               # Build de produção
npm run start               # Servidor de produção
npm run docker:prod         # Ambiente Docker de produção

# Banco de dados
npm run db:generate         # Gerar cliente Prisma
npm run db:push             # Aplicar mudanças no banco
npm run db:migrate          # Criar migração
npm run db:studio           # Interface visual do banco

# Utilidades
npm run lint                # Linter
```

## 🔄 CI/CD

O projeto está preparado para integração contínua com:
- Testes automatizados
- Build otimizado
- Deploy automatizado
- Monitoramento de qualidade

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte, abra uma issue no repositório ou entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ seguindo as melhores práticas de desenvolvimento seguro e performance.**

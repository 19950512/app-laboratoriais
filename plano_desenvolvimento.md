# Plano de desenvolvimento

# Banco de dados
O sistema será multitanance, ou seja, 1 instância do banco de dados (Postgres) para N clientes, todos os clientes e demais tabelas terão uma coluna "business_id" para delimitar os dados.

As colunas a seguir, são básicas e posteriormente sofrerão alterações.

# Tecnologias
- Next.js 15 (latest)
    - Tailwind CSS
- TypeScript
- Prisma (ORM)
- PostgreSQL
- Redis
- Docker
- Nginx

### Crie um init-db.sql
#### Tabelas

- business
    - id (UUID)
    - name
    - document (CPF/CNPJ) unico
    - active (bool)

- accounts (cada empresa pode ter N usuários, unico[business_id,email] )
    - business_id (UUID)
    - id (UUID)
    - email
    - name
    - photo_profile
    - hash_password
    - active (bool)

- account_preferences (preferencias do usuário)
    - business_id (UUID)
    - account_id
    - theme enum [dark,light]

- tokens_jwt (gerenciar sessões/logins no sistema, saber qual usuario está conectado e o ADM pode inativar o token para forçar a saída)
    - business_id (UUID)
    - id (UUID)
    - account_id (UUID)
    - expire_in
    - token
    - active (bool)

- auditoria (fica armazenado as mudanças que os usuários fazem no sistema)
    - business_id (UUID)
    - id (UUID)
    - account_id (UUID)
    
    - description (mensagem livre)

    - context (enum) [auth_login,auth_logout,auth_recovery,auth_deny,...]
    - moment (Timestamp)

OBS:
- crie índices para o banco de dados focando na performance!
- crie comentários para auxiliar o entendimento

### Segurança
Implemente autenticação e autorização robustas, utilizando JWT para gerenciar sessões de usuários. Assegure-se de que todas as rotas estejam protegidas e que apenas usuários autenticados possam acessá-las.
Implemente políticas de senha forte e recuperação de senha segura. Utilize HTTPS para todas as comunicações e armazene senhas utilizando hashing seguro (bcrypt ou Argon2).
Implemente validação de entrada rigorosa para prevenir ataques comuns como SQL Injection e XSS. Utilize bibliotecas de validação como Joi ou Yup para garantir que os dados recebidos estejam no formato esperado.

### Arquitetura
Seja extremamente cuidadoso e siga as melhores práticas de desenvolvimento do mercado, SEMPRE aplique o SOLID, use DDD e CQRS. Faça a estrutura de pastas bem cláras de oque é regra de negocio, dependencias, etc.
Use o melhor do TypeScript que são os tipos, o sistema precisa ser FORTEMENTE tipado, nada de any!
Siga as melhores práticas de desenvolvimento seguro, como validação de entrada e proteção contra CSRF.


### Dependências
Use algum ORM (prisma quem sabe? use bom) para facilitar o desenvolvimento e agilidade, pois inicialmente serão apenas CRUDs.
Use bibliotecas de validação como Joi ou Yup para garantir que os dados recebidos estejam no formato esperado.


### Estrutura

# Docker
Crie o projeto com Nextjs 15 (latest)
Use docker compose, container para postgres, node, nginx e redis
Use .env.production | .env.local && .env.example
Faça um docker-compose.dev.yml e um docker-compose.prod.yml
Faça um script .sh para desenvolvimento e outro otimizado para produção.

# Layout
Com Nextjs, faça um layout bonito, moderno, agradavél com as melhores praticas de desenvolvimento focado na performance do sistema.
O sistema deverá ter 2 temas, Dark e Light mode.

Deverá ter pelo menos 2 context no Nextjs. Account (usuário logado [token,preferencias,etc..]) Business (Empresa que o usuário pertence [usuarios,informacoes,etc..]) pois estas informações serão transitadas entre as telas que posteriormente irá ter

# Rotas

### Auth
/auth/login (email, password)
/auth/create (business name, user name, user password) || (Login with Google + business name) 
/auth/recovery (user email)

/ -> /dashboard (hello world)

### Account
/profile (poderá alterar name, photo, password)

### Administraion
/sessions (controle de todos os tokens (JWT), com filtro por usuários, ativos, expirados, etc.)
/logs (autorias) (apenas leitura, exibição com filtros.)

# UX
Ao fazer o login, o sistema identifica as preferências do usuário e ajusta o layout conforme necessário.

# OBS:
Cada ação do usuário deverá salvar um "evento" na tabela "auditoria" com account_id, nome do usuário no momento, oque ele está fazendo, quando foi, etc.

O projeto deve rodar neste diretório mesmo!
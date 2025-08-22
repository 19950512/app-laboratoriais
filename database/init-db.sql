-- =====================================================
-- Sistema de Gestão Laboratorial - Multitenant
-- Arquivo de inicialização do banco de dados
-- =====================================================

-- Recriar o esquema public para garantir um estado limpo
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE theme_enum AS ENUM ('dark', 'light');
CREATE TYPE context_enum AS ENUM (
    'auth_login',
    'auth_logout', 
    'auth_recovery',
    'auth_deny',
    'auth_password_change',
    'account_create',
    'account_update',
    'account_deactivate',
    'account_role_add',
    'account_role_remove',
    'business_create',
    'business_update',
    'profile_update',
    'preferences_update',
    'theme_change',
    'session_create',
    'session_revoke',
    'role_create',
    'role_update',
    'role_delete'
);

-- =====================================================
-- TABELA: business (Empresas/Tenants)
-- =====================================================

CREATE TABLE business (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    document VARCHAR(20) UNIQUE NOT NULL, -- CPF/CNPJ
    logo VARCHAR(500), -- Caminho para o arquivo de logo
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comentários para auxiliar entendimento
COMMENT ON TABLE business IS 'Tabela que armazena as empresas (tenants) do sistema multitenant';
COMMENT ON COLUMN business.id IS 'Identificador único da empresa';
COMMENT ON COLUMN business.name IS 'Nome da empresa';
COMMENT ON COLUMN business.document IS 'CPF ou CNPJ da empresa (único no sistema)';
COMMENT ON COLUMN business.logo IS 'Caminho para o arquivo de logo da empresa';
COMMENT ON COLUMN business.active IS 'Indica se a empresa está ativa no sistema';

-- Índices para performance
CREATE INDEX idx_business_document ON business(document);
CREATE INDEX idx_business_active ON business(active);
CREATE INDEX idx_business_name_trgm ON business USING gin(name gin_trgm_ops);

-- =====================================================
-- TABELA: accounts (Usuários do sistema)
-- =====================================================

CREATE TABLE accounts (
    business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    photo_profile TEXT,
    hash_password VARCHAR(255) NOT NULL,
    is_company_owner BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para garantir unicidade de email por empresa
    CONSTRAINT unique_business_email UNIQUE (business_id, email)
);

-- Comentários
COMMENT ON TABLE accounts IS 'Usuários do sistema, vinculados às empresas (multitenant)';
COMMENT ON COLUMN accounts.business_id IS 'ID da empresa à qual o usuário pertence';
COMMENT ON COLUMN accounts.email IS 'Email do usuário (único por empresa)';
COMMENT ON COLUMN accounts.hash_password IS 'Hash da senha do usuário (bcrypt/Argon2)';
COMMENT ON COLUMN accounts.photo_profile IS 'URL ou path da foto de perfil';
COMMENT ON COLUMN accounts.is_company_owner IS 'Indica se o usuário é o criador/dono da empresa';

-- Índices para performance
CREATE INDEX idx_accounts_business_id ON accounts(business_id);
CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_accounts_business_email ON accounts(business_id, email);
CREATE INDEX idx_accounts_active ON accounts(active);
CREATE INDEX idx_accounts_is_company_owner ON accounts(is_company_owner);
CREATE INDEX idx_accounts_name_trgm ON accounts USING gin(name gin_trgm_ops);

-- =====================================================
-- TABELA: account_preferences (Preferências do usuário)
-- =====================================================

CREATE TABLE account_preferences (
    business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    theme theme_enum NOT NULL DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para garantir uma preferência por usuário
    CONSTRAINT pk_account_preferences PRIMARY KEY (business_id, account_id)
);

-- Comentários
COMMENT ON TABLE account_preferences IS 'Preferências personalizadas dos usuários';
COMMENT ON COLUMN account_preferences.theme IS 'Tema preferido pelo usuário (dark/light)';

-- Índices para performance
CREATE INDEX idx_account_preferences_account ON account_preferences(account_id);

-- =====================================================
-- TABELA: tokens_jwt (Gerenciamento de sessões)
-- =====================================================

CREATE TABLE tokens_jwt (
    business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    expire_in TIMESTAMP WITH TIME ZONE NOT NULL,
    token TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comentários
COMMENT ON TABLE tokens_jwt IS 'Controle de tokens JWT e sessões ativas';
COMMENT ON COLUMN tokens_jwt.expire_in IS 'Data/hora de expiração do token';
COMMENT ON COLUMN tokens_jwt.token IS 'Hash do token JWT para validação';
COMMENT ON COLUMN tokens_jwt.active IS 'Permite revogar tokens manualmente';

-- Índices para performance
CREATE INDEX idx_tokens_business_id ON tokens_jwt(business_id);
CREATE INDEX idx_tokens_account_id ON tokens_jwt(account_id);
CREATE INDEX idx_tokens_active ON tokens_jwt(active);
CREATE INDEX idx_tokens_expire_in ON tokens_jwt(expire_in);
CREATE INDEX idx_tokens_token_hash ON tokens_jwt USING hash(token);

-- =====================================================
-- TABELA: roles (Cargos do sistema)
-- =====================================================

CREATE TABLE roles (
    business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL, -- Hex color format (#FFFFFF)
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para garantir unicidade de nome por empresa
    CONSTRAINT unique_business_role_name UNIQUE (business_id, name)
);

-- Comentários
COMMENT ON TABLE roles IS 'Cargos/funções definidos por empresa para controle de acesso';
COMMENT ON COLUMN roles.business_id IS 'ID da empresa à qual o cargo pertence';
COMMENT ON COLUMN roles.name IS 'Nome do cargo (único por empresa)';
COMMENT ON COLUMN roles.color IS 'Cor do cargo em formato hexadecimal (#FFFFFF)';
COMMENT ON COLUMN roles.active IS 'Indica se o cargo está ativo no sistema';

-- Índices para performance
CREATE INDEX idx_roles_business_id ON roles(business_id);
CREATE INDEX idx_roles_active ON roles(active);

-- =====================================================
-- TABELA: account_roles (Cargos atribuídos aos usuários)
-- =====================================================

CREATE TABLE account_roles (
    business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para garantir unicidade
    CONSTRAINT pk_account_roles PRIMARY KEY (business_id, account_id, role_id)
);

-- Comentários
COMMENT ON TABLE account_roles IS 'Relação many-to-many entre usuários e cargos';
COMMENT ON COLUMN account_roles.business_id IS 'ID da empresa (para particionamento)';
COMMENT ON COLUMN account_roles.account_id IS 'ID do usuário que possui o cargo';
COMMENT ON COLUMN account_roles.role_id IS 'ID do cargo atribuído ao usuário';

-- Índices para performance
CREATE INDEX idx_account_roles_account_id ON account_roles(account_id);
CREATE INDEX idx_account_roles_role_id ON account_roles(role_id);
CREATE INDEX idx_account_roles_business_account ON account_roles(business_id, account_id);

-- =====================================================
-- TABELA: route_roles (Cargos necessários para acessar rotas)
-- =====================================================

CREATE TABLE route_roles (
    business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route VARCHAR(100) NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para garantir unicidade de rota+cargo por empresa
    CONSTRAINT unique_business_route_role UNIQUE (business_id, route, role_id)
);

-- Comentários
COMMENT ON TABLE route_roles IS 'Define quais cargos podem acessar cada rota do sistema';
COMMENT ON COLUMN route_roles.business_id IS 'ID da empresa (para particionamento)';
COMMENT ON COLUMN route_roles.route IS 'Rota/página que requer o cargo (ex: /dashboard)';
COMMENT ON COLUMN route_roles.role_id IS 'ID do cargo que pode acessar a rota';

-- Índices para performance
CREATE INDEX idx_route_roles_business_id ON route_roles(business_id);
CREATE INDEX idx_route_roles_role_id ON route_roles(role_id);
CREATE INDEX idx_route_roles_route ON route_roles(route);
CREATE INDEX idx_route_roles_business_route ON route_roles(business_id, route);

-- =====================================================
-- TABELA: auditoria (Log de ações dos usuários)
-- =====================================================

CREATE TABLE auditoria (
    business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    context context_enum NOT NULL,
    moment TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    additional_data JSONB
);

-- Comentários
COMMENT ON TABLE auditoria IS 'Log de auditoria de todas as ações realizadas no sistema';
COMMENT ON COLUMN auditoria.description IS 'Descrição detalhada da ação realizada';
COMMENT ON COLUMN auditoria.context IS 'Contexto/categoria da ação (login, logout, etc.)';
COMMENT ON COLUMN auditoria.moment IS 'Timestamp preciso da ação';
COMMENT ON COLUMN auditoria.ip_address IS 'Endereço IP de origem da ação';
COMMENT ON COLUMN auditoria.user_agent IS 'User-Agent do navegador/cliente';
COMMENT ON COLUMN auditoria.additional_data IS 'Dados adicionais em formato JSON';

-- Índices para performance (importantes para consultas de auditoria)
CREATE INDEX idx_auditoria_business_id ON auditoria(business_id);
CREATE INDEX idx_auditoria_account_id ON auditoria(account_id);
CREATE INDEX idx_auditoria_context ON auditoria(context);
CREATE INDEX idx_auditoria_moment ON auditoria(moment DESC);
CREATE INDEX idx_auditoria_business_moment ON auditoria(business_id, moment DESC);
CREATE INDEX idx_auditoria_account_moment ON auditoria(account_id, moment DESC);

-- Índice composto para consultas de auditoria por empresa e período
CREATE INDEX idx_auditoria_business_context_moment ON auditoria(business_id, context, moment DESC);

-- =====================================================
-- TRIGGERS PARA UPDATE AUTOMÁTICO DE updated_at
-- =====================================================

-- Função para atualizar campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas que possuem updated_at
CREATE TRIGGER update_business_updated_at 
    BEFORE UPDATE ON business 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at 
    BEFORE UPDATE ON accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_preferences_updated_at 
    BEFORE UPDATE ON account_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tokens_jwt_updated_at 
    BEFORE UPDATE ON tokens_jwt 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION PARA LIMPEZA AUTOMÁTICA DE TOKENS EXPIRADOS
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM tokens_jwt 
    WHERE expire_in < CURRENT_TIMESTAMP 
    OR active = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da limpeza
    INSERT INTO auditoria (business_id, description, context, additional_data)
    SELECT DISTINCT 
        business_id, 
        'Limpeza automática de tokens expirados',
        'auth_logout',
        jsonb_build_object('deleted_tokens', deleted_count)
    FROM business
    WHERE deleted_count > 0;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS ÚTEIS PARA CONSULTAS
-- =====================================================

-- View para listar usuários ativos com suas empresas
CREATE VIEW v_active_users AS
SELECT 
    a.id,
    a.business_id,
    b.name as business_name,
    a.email,
    a.name,
    a.photo_profile,
    a.is_company_owner,
    a.active,
    a.created_at,
    ap.theme
FROM accounts a
JOIN business b ON a.business_id = b.id
LEFT JOIN account_preferences ap ON a.id = ap.account_id AND a.business_id = ap.business_id
WHERE a.active = true AND b.active = true;

-- View para sessões ativas
CREATE VIEW v_active_sessions AS
SELECT 
    t.id,
    t.business_id,
    b.name as business_name,
    t.account_id,
    a.name as account_name,
    a.email,
    t.expire_in,
    t.created_at
FROM tokens_jwt t
JOIN business b ON t.business_id = b.id
JOIN accounts a ON t.account_id = a.id
WHERE t.active = true 
AND t.expire_in > CURRENT_TIMESTAMP
AND a.active = true 
AND b.active = true;

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

COMMENT ON DATABASE app_laboratoriais IS 'Sistema de Gestão Laboratorial - Arquitetura Multitenant';

-- Exibir resumo da criação
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created: business, accounts, account_preferences, tokens_jwt, roles, account_roles, route_roles, auditoria';
    RAISE NOTICE 'Views created: v_active_users, v_active_sessions';
    RAISE NOTICE 'Indexes created for optimal performance';
    RAISE NOTICE 'Triggers set for automatic updated_at management';
    RAISE NOTICE 'Role-based access control system implemented';
    RAISE NOTICE '========================================';
END $$;

-- CreateEnum
CREATE TYPE "ThemeEnum" AS ENUM ('dark', 'light');

-- CreateEnum
CREATE TYPE "ContextEnum" AS ENUM ('auth_login', 'auth_logout', 'auth_recovery', 'auth_deny', 'auth_password_change', 'account_create', 'account_update', 'account_deactivate', 'business_create', 'business_update', 'profile_update', 'preferences_update', 'theme_change', 'session_create', 'session_revoke');

-- CreateTable
CREATE TABLE "business" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "document" VARCHAR(20) NOT NULL,
    "logo" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "business_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "photo_profile" TEXT,
    "hash_password" VARCHAR(255) NOT NULL,
    "is_company_owner" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_preferences" (
    "business_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "theme" "ThemeEnum" NOT NULL DEFAULT 'light',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "account_preferences_pkey" PRIMARY KEY ("business_id","account_id")
);

-- CreateTable
CREATE TABLE "tokens_jwt" (
    "business_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "expire_in" TIMESTAMPTZ NOT NULL,
    "token" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tokens_jwt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "business_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "account_id" UUID,
    "description" TEXT NOT NULL,
    "context" "ContextEnum" NOT NULL,
    "moment" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" INET,
    "user_agent" TEXT,
    "additional_data" JSONB,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "business_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_roles" (
    "business_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_roles_pkey" PRIMARY KEY ("business_id","account_id","role_id")
);

-- CreateTable
CREATE TABLE "route_roles" (
    "business_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "route" VARCHAR(100) NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "route_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_document_key" ON "business"("document");

-- CreateIndex
CREATE INDEX "business_document_idx" ON "business"("document");

-- CreateIndex
CREATE INDEX "business_active_idx" ON "business"("active");

-- CreateIndex
CREATE INDEX "accounts_business_id_idx" ON "accounts"("business_id");

-- CreateIndex
CREATE INDEX "accounts_email_idx" ON "accounts"("email");

-- CreateIndex
CREATE INDEX "accounts_business_id_email_idx" ON "accounts"("business_id", "email");

-- CreateIndex
CREATE INDEX "accounts_active_idx" ON "accounts"("active");

-- CreateIndex
CREATE INDEX "accounts_is_company_owner_idx" ON "accounts"("is_company_owner");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_business_id_email_key" ON "accounts"("business_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "account_preferences_account_id_key" ON "account_preferences"("account_id");

-- CreateIndex
CREATE INDEX "account_preferences_account_id_idx" ON "account_preferences"("account_id");

-- CreateIndex
CREATE INDEX "tokens_jwt_business_id_idx" ON "tokens_jwt"("business_id");

-- CreateIndex
CREATE INDEX "tokens_jwt_account_id_idx" ON "tokens_jwt"("account_id");

-- CreateIndex
CREATE INDEX "tokens_jwt_active_idx" ON "tokens_jwt"("active");

-- CreateIndex
CREATE INDEX "tokens_jwt_expire_in_idx" ON "tokens_jwt"("expire_in");

-- CreateIndex
CREATE INDEX "tokens_jwt_token_idx" ON "tokens_jwt" USING HASH ("token");

-- CreateIndex
CREATE INDEX "auditoria_business_id_idx" ON "auditoria"("business_id");

-- CreateIndex
CREATE INDEX "auditoria_account_id_idx" ON "auditoria"("account_id");

-- CreateIndex
CREATE INDEX "auditoria_context_idx" ON "auditoria"("context");

-- CreateIndex
CREATE INDEX "auditoria_moment_idx" ON "auditoria"("moment" DESC);

-- CreateIndex
CREATE INDEX "auditoria_business_id_moment_idx" ON "auditoria"("business_id", "moment" DESC);

-- CreateIndex
CREATE INDEX "auditoria_account_id_moment_idx" ON "auditoria"("account_id", "moment" DESC);

-- CreateIndex
CREATE INDEX "auditoria_business_id_context_moment_idx" ON "auditoria"("business_id", "context", "moment" DESC);

-- CreateIndex
CREATE INDEX "roles_business_id_idx" ON "roles"("business_id");

-- CreateIndex
CREATE INDEX "roles_active_idx" ON "roles"("active");

-- CreateIndex
CREATE UNIQUE INDEX "roles_business_id_name_key" ON "roles"("business_id", "name");

-- CreateIndex
CREATE INDEX "account_roles_account_id_idx" ON "account_roles"("account_id");

-- CreateIndex
CREATE INDEX "account_roles_role_id_idx" ON "account_roles"("role_id");

-- CreateIndex
CREATE INDEX "account_roles_business_id_account_id_idx" ON "account_roles"("business_id", "account_id");

-- CreateIndex
CREATE INDEX "route_roles_business_id_idx" ON "route_roles"("business_id");

-- CreateIndex
CREATE INDEX "route_roles_role_id_idx" ON "route_roles"("role_id");

-- CreateIndex
CREATE INDEX "route_roles_route_idx" ON "route_roles"("route");

-- CreateIndex
CREATE INDEX "route_roles_business_id_route_idx" ON "route_roles"("business_id", "route");

-- CreateIndex
CREATE UNIQUE INDEX "route_roles_business_id_route_role_id_key" ON "route_roles"("business_id", "route", "role_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_preferences" ADD CONSTRAINT "account_preferences_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_preferences" ADD CONSTRAINT "account_preferences_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens_jwt" ADD CONSTRAINT "tokens_jwt_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens_jwt" ADD CONSTRAINT "tokens_jwt_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_roles" ADD CONSTRAINT "account_roles_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_roles" ADD CONSTRAINT "account_roles_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_roles" ADD CONSTRAINT "account_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_roles" ADD CONSTRAINT "route_roles_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_roles" ADD CONSTRAINT "route_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

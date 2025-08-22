-- CreateTable
CREATE TABLE "public"."bank_accounts" (
    "id" UUID NOT NULL,
    "name_account_bank" VARCHAR(255) NOT NULL,
    "bank_name" VARCHAR(50) NOT NULL,
    "certificate_public" TEXT NOT NULL,
    "certificate_private" TEXT NOT NULL,
    "client_id" VARCHAR(255) NOT NULL,
    "secret_id" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_accounts_active_idx" ON "public"."bank_accounts"("active");

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContextEnum" ADD VALUE 'account_role_add';
ALTER TYPE "ContextEnum" ADD VALUE 'account_role_remove';
ALTER TYPE "ContextEnum" ADD VALUE 'role_create';
ALTER TYPE "ContextEnum" ADD VALUE 'role_update';
ALTER TYPE "ContextEnum" ADD VALUE 'role_delete';

-- DropIndex
DROP INDEX "account_preferences_account_id_key";

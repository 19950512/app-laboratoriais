/*
  Warnings:

  - Added the required column `business_id` to the `bank_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."bank_accounts" ADD COLUMN     "business_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."bank_accounts" ADD CONSTRAINT "bank_accounts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

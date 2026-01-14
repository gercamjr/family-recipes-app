/*
  Warnings:

  - You are about to drop the column `content` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `recipeId` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `favorites` table. All the data in the column will be lost.
  - You are about to drop the column `recipeId` on the `favorites` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `favorites` table. All the data in the column will be lost.
  - You are about to drop the column `cookTime` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `ingredientsEn` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `ingredientsEs` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `instructionsEn` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `instructionsEs` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `prepTime` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `titleEn` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `titleEs` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `recipes` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `inviteToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `inviteTokenExpires` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `invitedBy` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `languagePref` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[recipe_id,user_id]` on the table `favorites` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `comment_text` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_at` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipe_id` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_at` to the `favorites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipe_id` to the `favorites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `favorites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_at` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_at` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password_hash` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."comments" DROP CONSTRAINT "comments_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."comments" DROP CONSTRAINT "comments_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."favorites" DROP CONSTRAINT "favorites_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."favorites" DROP CONSTRAINT "favorites_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."recipes" DROP CONSTRAINT "recipes_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_invitedBy_fkey";

-- DropIndex
DROP INDEX "public"."favorites_userId_recipeId_key";

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "content",
DROP COLUMN "createdAt",
DROP COLUMN "recipeId",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "comment_text" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "recipe_id" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "favorites" DROP COLUMN "createdAt",
DROP COLUMN "recipeId",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "recipe_id" INTEGER NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "cookTime",
DROP COLUMN "createdAt",
DROP COLUMN "ingredientsEn",
DROP COLUMN "ingredientsEs",
DROP COLUMN "instructionsEn",
DROP COLUMN "instructionsEs",
DROP COLUMN "isPublic",
DROP COLUMN "prepTime",
DROP COLUMN "titleEn",
DROP COLUMN "titleEs",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "cook_time" INTEGER,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "ingredients_en" JSON,
ADD COLUMN     "ingredients_es" JSON,
ADD COLUMN     "instructions_en" TEXT,
ADD COLUMN     "instructions_es" TEXT,
ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "prep_time" INTEGER,
ADD COLUMN     "title_en" VARCHAR(255),
ADD COLUMN     "title_es" VARCHAR(255),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "createdAt",
DROP COLUMN "inviteToken",
DROP COLUMN "inviteTokenExpires",
DROP COLUMN "invitedBy",
DROP COLUMN "isActive",
DROP COLUMN "languagePref",
DROP COLUMN "passwordHash",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL,
ADD COLUMN     "invite_token" VARCHAR(255),
ADD COLUMN     "invite_token_expires" TIMESTAMPTZ(6),
ADD COLUMN     "invited_by" INTEGER,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "language_pref" "enum_users_languagePref" NOT NULL DEFAULT 'en',
ADD COLUMN     "password_hash" VARCHAR(255) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "favorites_recipe_id_user_id_key" ON "favorites"("recipe_id", "user_id");

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

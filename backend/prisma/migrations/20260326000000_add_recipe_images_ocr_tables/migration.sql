-- CreateEnum
CREATE TYPE "enum_image_status" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "enum_processing_status" AS ENUM ('started', 'completed', 'failed');

-- CreateTable
CREATE TABLE "recipe_images" (
    "id" SERIAL NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "original_url" TEXT NOT NULL,
    "cloudinary_public_id" VARCHAR(512) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size" INTEGER,
    "status" "enum_image_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "recipe_id" INTEGER,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "recipe_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_results" (
    "id" SERIAL NOT NULL,
    "raw_text" TEXT,
    "confidence" DOUBLE PRECISION,
    "detected_language" VARCHAR(10),
    "parsed_title" VARCHAR(255),
    "parsed_ingredients" JSON,
    "parsed_instructions" TEXT,
    "is_manually_edited" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipe_image_id" INTEGER NOT NULL,
    "edited_by" INTEGER,

    CONSTRAINT "ocr_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_processing_logs" (
    "id" SERIAL NOT NULL,
    "status" "enum_processing_status" NOT NULL,
    "processing_time_ms" INTEGER,
    "error_message" TEXT,
    "api_cost" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipe_image_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "ocr_processing_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipe_images_recipe_id_idx" ON "recipe_images"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_images_user_id_idx" ON "recipe_images"("user_id");

-- CreateIndex
CREATE INDEX "recipe_images_status_idx" ON "recipe_images"("status");

-- CreateIndex
CREATE INDEX "recipe_images_created_at_idx" ON "recipe_images"("created_at");

-- CreateIndex
CREATE INDEX "ocr_results_recipe_image_id_idx" ON "ocr_results"("recipe_image_id");

-- CreateIndex
CREATE INDEX "ocr_results_edited_by_idx" ON "ocr_results"("edited_by");

-- CreateIndex
CREATE INDEX "ocr_results_created_at_idx" ON "ocr_results"("created_at");

-- CreateIndex
CREATE INDEX "ocr_results_detected_language_idx" ON "ocr_results"("detected_language");

-- CreateIndex
CREATE INDEX "ocr_processing_logs_recipe_image_id_idx" ON "ocr_processing_logs"("recipe_image_id");

-- CreateIndex
CREATE INDEX "ocr_processing_logs_user_id_idx" ON "ocr_processing_logs"("user_id");

-- CreateIndex
CREATE INDEX "ocr_processing_logs_created_at_idx" ON "ocr_processing_logs"("created_at");

-- CreateIndex
CREATE INDEX "ocr_processing_logs_status_idx" ON "ocr_processing_logs"("status");

-- AddForeignKey
ALTER TABLE "recipe_images" ADD CONSTRAINT "recipe_images_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_images" ADD CONSTRAINT "recipe_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_results" ADD CONSTRAINT "ocr_results_recipe_image_id_fkey" FOREIGN KEY ("recipe_image_id") REFERENCES "recipe_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_results" ADD CONSTRAINT "ocr_results_edited_by_fkey" FOREIGN KEY ("edited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_processing_logs" ADD CONSTRAINT "ocr_processing_logs_recipe_image_id_fkey" FOREIGN KEY ("recipe_image_id") REFERENCES "recipe_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_processing_logs" ADD CONSTRAINT "ocr_processing_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

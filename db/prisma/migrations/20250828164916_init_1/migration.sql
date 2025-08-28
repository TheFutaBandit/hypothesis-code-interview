-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "transcript" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "user_id_key" ON "public"."user"("id");

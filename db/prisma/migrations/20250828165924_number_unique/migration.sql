/*
  Warnings:

  - A unique constraint covering the columns `[number]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user_number_key" ON "public"."user"("number");

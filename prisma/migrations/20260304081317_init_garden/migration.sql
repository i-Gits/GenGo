-- CreateTable
CREATE TABLE "languages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "writingSystemType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "primaryDisplay" TEXT NOT NULL,
    "difficultyWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "jlptLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_meanings" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "item_meanings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_readings" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "readingType" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "item_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_mnemonics" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "mnemonicType" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "item_mnemonics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependencies" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "dependsOnItemId" TEXT NOT NULL,

    CONSTRAINT "dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "srs_configs" (
    "id" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "stage" INTEGER NOT NULL,
    "intervalHours" INTEGER NOT NULL,
    "penaltyStages" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "srs_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "honorific" TEXT NOT NULL DEFAULT '勇者',
    "preferredName" TEXT NOT NULL DEFAULT '',
    "encouragementMode" TEXT NOT NULL DEFAULT 'playful',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "lessonBatchSize" INTEGER NOT NULL DEFAULT 5,
    "dailyReviewLimit" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_item_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "srsStage" INTEGER NOT NULL DEFAULT 0,
    "correctStreak" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3),
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "burnedAt" TIMESTAMP(3),
    "userNote" TEXT,

    CONSTRAINT "user_item_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "previousStage" INTEGER NOT NULL,
    "newStage" INTEGER NOT NULL,
    "responseTimeMs" INTEGER,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- CreateIndex
CREATE INDEX "items_languageId_level_idx" ON "items"("languageId", "level");

-- CreateIndex
CREATE INDEX "items_languageId_type_level_idx" ON "items"("languageId", "type", "level");

-- CreateIndex
CREATE UNIQUE INDEX "dependencies_itemId_dependsOnItemId_key" ON "dependencies"("itemId", "dependsOnItemId");

-- CreateIndex
CREATE UNIQUE INDEX "srs_configs_languageId_stage_key" ON "srs_configs"("languageId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_item_states_userId_nextReviewAt_idx" ON "user_item_states"("userId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "user_item_states_userId_srsStage_idx" ON "user_item_states"("userId", "srsStage");

-- CreateIndex
CREATE UNIQUE INDEX "user_item_states_userId_itemId_key" ON "user_item_states"("userId", "itemId");

-- CreateIndex
CREATE INDEX "review_logs_userId_reviewedAt_idx" ON "review_logs"("userId", "reviewedAt");

-- CreateIndex
CREATE INDEX "review_logs_userId_itemId_idx" ON "review_logs"("userId", "itemId");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_meanings" ADD CONSTRAINT "item_meanings_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_readings" ADD CONSTRAINT "item_readings_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_mnemonics" ADD CONSTRAINT "item_mnemonics_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependencies" ADD CONSTRAINT "dependencies_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependencies" ADD CONSTRAINT "dependencies_dependsOnItemId_fkey" FOREIGN KEY ("dependsOnItemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "srs_configs" ADD CONSTRAINT "srs_configs_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_item_states" ADD CONSTRAINT "user_item_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_item_states" ADD CONSTRAINT "user_item_states_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

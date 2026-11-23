-- CreateEnum
CREATE TYPE "Language" AS ENUM ('en', 'id', 'nl', 'ru', 'es');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('whatsapp', 'web');

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('whatsapp_ad', 'website', 'referral', 'social', 'direct');

-- CreateEnum
CREATE TYPE "Score" AS ENUM ('hot', 'warm', 'cold');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('new', 'qualified', 'call_booked', 'site_visit', 'reservation', 'won', 'lost');

-- CreateEnum
CREATE TYPE "Purpose" AS ENUM ('live', 'rent_out', 'hold');

-- CreateEnum
CREATE TYPE "Ownership" AS ENUM ('leasehold', 'freehold_pt_pma', 'undecided');

-- CreateEnum
CREATE TYPE "Financing" AS ENUM ('cash', 'mortgage', 'undecided');

-- CreateEnum
CREATE TYPE "Consent" AS ENUM ('granted', 'pending', 'withdrawn');

-- CreateEnum
CREATE TYPE "LeadMode" AS ENUM ('bot', 'human');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('advisor', 'admin');

-- CreateEnum
CREATE TYPE "MessageAuthor" AS ENUM ('lead', 'bot', 'advisor', 'system');

-- CreateEnum
CREATE TYPE "KbCategory" AS ENUM ('project', 'ownership', 'process', 'pricing', 'investment', 'visit', 'company');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('Apartment', 'Villa');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('available', 'reserved', 'sold');

-- CreateEnum
CREATE TYPE "TemplateKind" AS ENUM ('day1', 'day3', 'day7', 'day14', 'reminder24', 'reminder1');

-- CreateEnum
CREATE TYPE "TemplateChannel" AS ENUM ('whatsapp', 'email');

-- CreateEnum
CREATE TYPE "QaVerdict" AS ENUM ('correct', 'wrong');

-- CreateEnum
CREATE TYPE "QaIssue" AS ENUM ('wrong_fact', 'should_escalate', 'off_brand', 'wrong_language', 'other');

-- CreateTable
CREATE TABLE "Advisor" (
    "seq" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "languages" "Language"[],
    "projects" TEXT[],
    "senior" BOOLEAN NOT NULL DEFAULT false,
    "calendlyUrl" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'advisor',

    CONSTRAINT "Advisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "timezone" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "channel" "Channel" NOT NULL,
    "source" "Source" NOT NULL,
    "sourceDetail" TEXT,
    "project" TEXT NOT NULL,
    "budget" TEXT,
    "timeline" TEXT,
    "purpose" "Purpose",
    "ownership" "Ownership",
    "financing" "Financing",
    "score" "Score" NOT NULL,
    "stage" "Stage" NOT NULL DEFAULT 'new',
    "advisorId" TEXT,
    "consent" "Consent" NOT NULL DEFAULT 'pending',
    "optedOut" BOOLEAN NOT NULL DEFAULT false,
    "mode" "LeadMode" NOT NULL DEFAULT 'bot',
    "escalation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "unread" INTEGER NOT NULL DEFAULT 0,
    "topics" TEXT[],
    "objections" TEXT[],
    "unanswered" TEXT[],
    "briefGeneratedAt" TIMESTAMP(3),
    "unitIds" TEXT[],
    "followUpStep" INTEGER NOT NULL DEFAULT 0,
    "nextFollowUp" TIMESTAMP(3),
    "lostReason" TEXT,
    "starred" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "author" "MessageAuthor" NOT NULL,
    "advisorId" TEXT,
    "text" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "assets" JSONB,
    "sources" TEXT[],
    "voiceDurationSec" INTEGER,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "leadId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "advisorId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "remindersSent" TEXT[],

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("leadId")
);

-- CreateTable
CREATE TABLE "KbArticle" (
    "seq" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "category" "KbCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "keywords" TEXT[],
    "body" JSONB NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "escalate" BOOLEAN NOT NULL DEFAULT false,
    "owner" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KbArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "seq" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "UnitType" NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "sizeSqm" INTEGER NOT NULL,
    "priceUsd" INTEGER NOT NULL,
    "leaseYears" INTEGER NOT NULL,
    "status" "UnitStatus" NOT NULL,
    "handover" TEXT NOT NULL,
    "adrUsd" INTEGER NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "seq" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "kind" "TemplateKind" NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "TemplateChannel" NOT NULL,
    "body" JSONB NOT NULL,
    "metaApproved" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEntry" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "leadId" TEXT,

    CONSTRAINT "AuditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QaReview" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "verdict" "QaVerdict" NOT NULL,
    "issue" "QaIssue",
    "note" TEXT,
    "reviewer" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QaReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "version" INTEGER NOT NULL,
    "settings" JSONB NOT NULL,
    "assumptions" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Advisor_email_key" ON "Advisor"("email");

-- CreateIndex
CREATE INDEX "Lead_stage_idx" ON "Lead"("stage");

-- CreateIndex
CREATE INDEX "Lead_advisorId_idx" ON "Lead"("advisorId");

-- CreateIndex
CREATE INDEX "Lead_lastMessageAt_idx" ON "Lead"("lastMessageAt");

-- CreateIndex
CREATE INDEX "Message_leadId_position_idx" ON "Message"("leadId", "position");

-- CreateIndex
CREATE INDEX "AuditEntry_at_idx" ON "AuditEntry"("at");

-- CreateIndex
CREATE UNIQUE INDEX "QaReview_messageId_key" ON "QaReview"("messageId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

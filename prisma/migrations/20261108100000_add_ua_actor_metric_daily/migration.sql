-- CreateTable
CREATE TABLE "UaActorMetricDaily" (
    "day" DATE NOT NULL,
    "uaFingerprint" TEXT NOT NULL,
    "uaPreview" TEXT NOT NULL,
    "actorClass" TEXT NOT NULL,
    "botFamily" TEXT,
    "metric" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UaActorMetricDaily_pkey" PRIMARY KEY ("day","uaFingerprint","metric"),
    CONSTRAINT "UaActorMetricDaily_metric_check" CHECK ("metric" IN ('view', 'click')),
    CONSTRAINT "UaActorMetricDaily_actorClass_check" CHECK ("actorClass" IN ('human', 'known_bot', 'suspected_bot'))
);

-- CreateIndex
CREATE INDEX "UaActorMetricDaily_day_actorClass_idx" ON "UaActorMetricDaily"("day", "actorClass");

-- CreateIndex
CREATE INDEX "UaActorMetricDaily_day_botFamily_idx" ON "UaActorMetricDaily"("day", "botFamily");

-- CreateIndex
CREATE INDEX "UaActorMetricDaily_day_metric_idx" ON "UaActorMetricDaily"("day", "metric");

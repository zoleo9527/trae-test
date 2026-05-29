-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "plots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plotNo" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "area" REAL NOT NULL,
    "soilType" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "seedling_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plotId" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "plantingDate" DATETIME NOT NULL,
    "expectedSize" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GROWING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "seedling_batches_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "harvest_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "batchId" TEXT,
    "creatorId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "scheduledDate" DATETIME NOT NULL,
    "actualDate" DATETIME,
    "targetQuantity" INTEGER NOT NULL,
    "actualQuantity" INTEGER,
    "qualityGrade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "harvest_records_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "harvest_records_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "seedling_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "harvest_records_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "harvest_records_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "loading_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "harvestId" TEXT NOT NULL,
    "loadingDate" DATETIME NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "driverName" TEXT,
    "quantity" INTEGER NOT NULL,
    "checkedBy" TEXT,
    "customerName" TEXT NOT NULL,
    "orderNo" TEXT,
    "discrepancyNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "loading_records_harvestId_fkey" FOREIGN KEY ("harvestId") REFERENCES "harvest_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "batchId" TEXT,
    "workerId" TEXT NOT NULL,
    "maintenanceDate" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "weather" TEXT,
    "dosage" TEXT,
    "notes" TEXT,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "maintenance_records_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "maintenance_records_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "seedling_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "maintenance_records_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "disease_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "batchId" TEXT,
    "reporterId" TEXT NOT NULL,
    "discoveredDate" DATETIME NOT NULL,
    "symptoms" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "affectedArea" REAL,
    "suspectedCause" TEXT,
    "initialAction" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolutionNote" TEXT,
    "resolvedAt" DATETIME,
    "followUpDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "disease_reports_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "plots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "disease_reports_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "seedling_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "disease_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customer_visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "loadingId" TEXT,
    "salesId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "visitDate" DATETIME NOT NULL,
    "visitType" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "hasComplaint" BOOLEAN NOT NULL DEFAULT false,
    "complaintDetail" TEXT,
    "followUpDate" DATETIME,
    "followUpNote" TEXT,
    "isFollowedUp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "customer_visits_loadingId_fkey" FOREIGN KEY ("loadingId") REFERENCES "loading_records" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "customer_visits_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reseed_negotiations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "currentHandlerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerComplaint" TEXT NOT NULL,
    "proposedReseedQty" INTEGER NOT NULL,
    "proposedReseedDate" DATETIME,
    "actualReseedQty" INTEGER,
    "actualReseedDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "reworkNote" TEXT,
    "managerNote" TEXT,
    "customerConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmationNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reseed_negotiations_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "customer_visits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reseed_negotiations_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reseed_negotiations_currentHandlerId_fkey" FOREIGN KEY ("currentHandlerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "negotiation_status_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "negotiationId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "changeReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "negotiation_status_history_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "reseed_negotiations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "negotiation_status_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "todo_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "referenceId" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "dueDate" DATETIME,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "todo_items_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "todo_items_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "changeSummary" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "harvest_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "loading_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "maintenance_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "disease_reports" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "customer_visits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "reseed_negotiations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "requestBody" TEXT,
    "responseBody" TEXT,
    "statusCode" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "plots_plotNo_key" ON "plots"("plotNo");

-- CreateIndex
CREATE UNIQUE INDEX "harvest_records_idempotencyKey_key" ON "harvest_records"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "loading_records_idempotencyKey_key" ON "loading_records"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_records_idempotencyKey_key" ON "maintenance_records"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "disease_reports_idempotencyKey_key" ON "disease_reports"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "customer_visits_idempotencyKey_key" ON "customer_visits"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "reseed_negotiations_idempotencyKey_key" ON "reseed_negotiations"("idempotencyKey");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_idempotencyKey_key" ON "idempotency_records"("idempotencyKey");

-- CreateIndex
CREATE INDEX "idempotency_records_idempotencyKey_userId_idx" ON "idempotency_records"("idempotencyKey", "userId");

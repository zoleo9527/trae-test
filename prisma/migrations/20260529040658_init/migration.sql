-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "realName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "storeName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partCode" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "originalCode" TEXT,
    "brand" TEXT NOT NULL,
    "spec" TEXT,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inquiryNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "carModel" TEXT,
    "vinNo" TEXT,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "expectedDate" DATETIME,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "handledById" TEXT,
    "rejectReason" TEXT,
    "supplementNote" TEXT,
    "hasException" BOOLEAN NOT NULL DEFAULT false,
    "exceptionType" TEXT,
    "exceptionNote" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inquiry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inquiry_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InquiryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inquiryId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partCode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "quotedPrice" DECIMAL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InquiryItem_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InquiryItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockLock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lockNo" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "validUntil" DATETIME,
    "warehouseNote" TEXT,
    "createdById" TEXT NOT NULL,
    "handledById" TEXT,
    "rejectReason" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockLock_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockLock_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockLock_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockLockItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stockLockId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partCode" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "location" TEXT,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "checkedAt" DATETIME,
    "checkedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockLockItem_stockLockId_fkey" FOREIGN KEY ("stockLockId") REFERENCES "StockLock" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StockLockItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockLockItem_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReturnOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "returnNo" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_IDENTIFY',
    "returnReason" TEXT NOT NULL,
    "returnDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalSalesDate" DATETIME,
    "originalAmount" DECIMAL NOT NULL,
    "applyRefundAmount" DECIMAL NOT NULL,
    "identifyResult" TEXT,
    "identifyDate" DATETIME,
    "identifyById" TEXT,
    "rejectReason" TEXT,
    "supplementNote" TEXT,
    "reworkNote" TEXT,
    "hasException" BOOLEAN NOT NULL DEFAULT false,
    "exceptionType" TEXT,
    "exceptionNote" TEXT,
    "createdById" TEXT NOT NULL,
    "handledById" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReturnOrder_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReturnOrder_identifyById_fkey" FOREIGN KEY ("identifyById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReturnOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReturnOrder_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "returnOrderId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partCode" TEXT NOT NULL,
    "returnQuantity" INTEGER NOT NULL DEFAULT 1,
    "originalQuantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "subTotal" DECIMAL NOT NULL,
    "inspectionResult" TEXT,
    "inspectionNote" TEXT,
    "inspected" BOOLEAN NOT NULL DEFAULT false,
    "inspectedById" TEXT,
    "inspectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReturnItem_returnOrderId_fkey" FOREIGN KEY ("returnOrderId") REFERENCES "ReturnOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReturnItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReturnItem_inspectedById_fkey" FOREIGN KEY ("inspectedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RefundOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refundNo" TEXT NOT NULL,
    "returnOrderId" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "refundAmount" DECIMAL NOT NULL,
    "actualRefundAmount" DECIMAL,
    "paymentMethod" TEXT,
    "paymentDate" DATETIME,
    "paymentTraceNo" TEXT,
    "reviewResult" TEXT,
    "reviewDate" DATETIME,
    "reviewById" TEXT,
    "rejectReason" TEXT,
    "supplementNote" TEXT,
    "isCreditCustomer" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" DATETIME,
    "hasDelay" BOOLEAN NOT NULL DEFAULT false,
    "delayDays" INTEGER,
    "hasException" BOOLEAN NOT NULL DEFAULT false,
    "exceptionType" TEXT,
    "exceptionNote" TEXT,
    "createdById" TEXT NOT NULL,
    "handledById" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RefundOrder_returnOrderId_fkey" FOREIGN KEY ("returnOrderId") REFERENCES "ReturnOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RefundOrder_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RefundOrder_reviewById_fkey" FOREIGN KEY ("reviewById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RefundOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RefundOrder_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evidenceType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "description" TEXT,
    "uploadedById" TEXT NOT NULL,
    "inquiryId" TEXT,
    "stockLockId" TEXT,
    "returnOrderId" TEXT,
    "refundOrderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Evidence_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Evidence_stockLockId_fkey" FOREIGN KEY ("stockLockId") REFERENCES "StockLock" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Evidence_returnOrderId_fkey" FOREIGN KEY ("returnOrderId") REFERENCES "ReturnOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Evidence_refundOrderId_fkey" FOREIGN KEY ("refundOrderId") REFERENCES "RefundOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationType" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "operatorName" TEXT NOT NULL,
    "operatorRole" TEXT NOT NULL,
    "detail" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "inquiryId" TEXT,
    "stockLockId" TEXT,
    "returnOrderId" TEXT,
    "refundOrderId" TEXT,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationLog_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OperationLog_stockLockId_fkey" FOREIGN KEY ("stockLockId") REFERENCES "StockLock" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OperationLog_returnOrderId_fkey" FOREIGN KEY ("returnOrderId") REFERENCES "ReturnOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OperationLog_refundOrderId_fkey" FOREIGN KEY ("refundOrderId") REFERENCES "RefundOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Remark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "inquiryId" TEXT,
    "stockLockId" TEXT,
    "returnOrderId" TEXT,
    "refundOrderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Remark_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Remark_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Remark_stockLockId_fkey" FOREIGN KEY ("stockLockId") REFERENCES "StockLock" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Remark_returnOrderId_fkey" FOREIGN KEY ("returnOrderId") REFERENCES "ReturnOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Remark_refundOrderId_fkey" FOREIGN KEY ("refundOrderId") REFERENCES "RefundOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Part_partCode_key" ON "Part"("partCode");

-- CreateIndex
CREATE UNIQUE INDEX "Inquiry_inquiryNo_key" ON "Inquiry"("inquiryNo");

-- CreateIndex
CREATE UNIQUE INDEX "Inquiry_idempotencyKey_key" ON "Inquiry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Inquiry_status_idx" ON "Inquiry"("status");

-- CreateIndex
CREATE INDEX "Inquiry_customerName_idx" ON "Inquiry"("customerName");

-- CreateIndex
CREATE INDEX "Inquiry_createdAt_idx" ON "Inquiry"("createdAt");

-- CreateIndex
CREATE INDEX "Inquiry_hasException_idx" ON "Inquiry"("hasException");

-- CreateIndex
CREATE UNIQUE INDEX "StockLock_lockNo_key" ON "StockLock"("lockNo");

-- CreateIndex
CREATE UNIQUE INDEX "StockLock_inquiryId_key" ON "StockLock"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "StockLock_idempotencyKey_key" ON "StockLock"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnOrder_returnNo_key" ON "ReturnOrder"("returnNo");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnOrder_inquiryId_key" ON "ReturnOrder"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnOrder_idempotencyKey_key" ON "ReturnOrder"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "RefundOrder_refundNo_key" ON "RefundOrder"("refundNo");

-- CreateIndex
CREATE UNIQUE INDEX "RefundOrder_returnOrderId_key" ON "RefundOrder"("returnOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "RefundOrder_inquiryId_key" ON "RefundOrder"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "RefundOrder_idempotencyKey_key" ON "RefundOrder"("idempotencyKey");

-- CreateIndex
CREATE INDEX "OperationLog_inquiryId_idx" ON "OperationLog"("inquiryId");

-- CreateIndex
CREATE INDEX "OperationLog_operatorId_idx" ON "OperationLog"("operatorId");

-- CreateIndex
CREATE INDEX "OperationLog_createdAt_idx" ON "OperationLog"("createdAt");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_invoices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "userId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "total" REAL NOT NULL DEFAULT 0,
    "taxableTotal" REAL NOT NULL DEFAULT 0,
    "taxTotal" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "changeAmount" REAL NOT NULL DEFAULT 0,
    "paidAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invoices_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_invoices" ("changeAmount", "createdAt", "discount", "id", "invoiceNumber", "notes", "paidAt", "paymentMethod", "paymentStatus", "status", "taxTotal", "taxableTotal", "total", "updatedAt", "userId") SELECT "changeAmount", "createdAt", "discount", "id", "invoiceNumber", "notes", "paidAt", "paymentMethod", "paymentStatus", "status", "taxTotal", "taxableTotal", "total", "updatedAt", "userId" FROM "invoices";
DROP TABLE "invoices";
ALTER TABLE "new_invoices" RENAME TO "invoices";
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");
CREATE INDEX "invoices_invoiceNumber_idx" ON "invoices"("invoiceNumber");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

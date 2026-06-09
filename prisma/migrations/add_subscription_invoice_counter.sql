-- Migration: add SubscriptionInvoiceCounter table
-- Used to generate sequential invoice numbers per year (FAC-YYYY-XXXX)

CREATE TABLE IF NOT EXISTS "SubscriptionInvoiceCounter" (
  "id"        SERIAL PRIMARY KEY,
  "year"      INTEGER NOT NULL UNIQUE,
  "counter"   INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

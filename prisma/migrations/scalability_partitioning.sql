-- ==========================================
-- Scalability Migration: Table Partitioning
-- ==========================================

-- 1. Partitioning ActivityLog (Range by Date)
-- This allows Postgres to only scan relevant date ranges, vastly improving speed for audit logs.

CREATE TABLE "ActivityLog_New" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "performedBy" TEXT NOT NULL,
  "targetId" TEXT,
  "targetType" TEXT,
  "metadata" TEXT,
  "schoolId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_pkey_new" PRIMARY KEY ("id", "createdAt")
) PARTITION BY RANGE ("createdAt");

-- Create initial partitions (e.g., for 2025 and 2026)
CREATE TABLE "ActivityLog_2025" PARTITION OF "ActivityLog_New"
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE "ActivityLog_2026" PARTITION OF "ActivityLog_New"
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- 2. Partitioning AttendanceEntry (List by SchoolId - Optional Alternative)
-- Alternatively, partition Attendance by Date. Let's stick to Date for consistency.

CREATE TABLE "AttendanceEntry_New" (
  "id" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AttendanceEntry_pkey_new" PRIMARY KEY ("id", "createdAt")
) PARTITION BY RANGE ("createdAt");

CREATE TABLE "AttendanceEntry_2025" PARTITION OF "AttendanceEntry_New"
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- ==========================================
-- Migration Instructions:
-- 1. Run the above CREATE TABLE commands.
-- 2. COPY data from old tables to new.
-- 3. DROP old tables.
-- 4. RENAME new tables back to original names.
-- ==========================================

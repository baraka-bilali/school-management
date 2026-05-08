-- ============================================================
-- OPTIMISATION PERFORMANCE - INDEXES CRITIQUES
-- ============================================================
-- Application: School Management
-- Date: 2026-05-08
-- Impact: Réduction 50-80% temps réponse API
-- À exécuter sur: Supabase Production Database
-- ============================================================

-- 🔴 CRITIQUE #1: User - Dashboard queries (students/teachers count)
-- Used by: /api/admin/dashboard-stats-simple
CREATE INDEX IF NOT EXISTS "User_schoolId_isActive_idx" ON "User"("schoolId", "isActive");
CREATE INDEX IF NOT EXISTS "User_schoolId_role_isActive_idx" ON "User"("schoolId", "role", "isActive");

-- 🔴 CRITIQUE #2: Enrollment - Balance élève & stats
-- Used by: /api/admin/fees/stats, /api/admin/fees/balance
CREATE INDEX IF NOT EXISTS "Enrollment_studentId_yearId_status_idx" ON "Enrollment"("studentId", "yearId", "status");
CREATE INDEX IF NOT EXISTS "Enrollment_yearId_status_idx" ON "Enrollment"("yearId", "status");

-- 🔴 CRITIQUE #3: Tarification - Calculs frais attendus
-- Used by: /api/admin/fees/stats
CREATE INDEX IF NOT EXISTS "Tarification_schoolId_yearId_isActive_idx" ON "Tarification"("schoolId", "yearId", "isActive");
CREATE INDEX IF NOT EXISTS "Tarification_yearId_isActive_classId_idx" ON "Tarification"("yearId", "isActive", "classId");

-- 🔴 CRITIQUE #4: Paiement - Stats frais & dashboard
-- Used by: /api/admin/fees/stats, /api/admin/dashboard-stats-simple
CREATE INDEX IF NOT EXISTS "Paiement_schoolId_isAnnule_idx" ON "Paiement"("schoolId", "isAnnule");
CREATE INDEX IF NOT EXISTS "Paiement_enrollmentId_isAnnule_idx" ON "Paiement"("enrollmentId", "isAnnule");
CREATE INDEX IF NOT EXISTS "Paiement_tarificationId_isAnnule_idx" ON "Paiement"("tarificationId", "isAnnule");
CREATE INDEX IF NOT EXISTS "Paiement_studentId_isAnnule_idx" ON "Paiement"("studentId", "isAnnule");

-- ============================================================
-- VÉRIFICATION DES INDEXES CRÉÉS
-- ============================================================
-- Pour vérifier après exécution:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('User', 'Enrollment', 'Tarification', 'Paiement')
-- AND indexname LIKE '%_idx'
-- ORDER BY tablename, indexname;

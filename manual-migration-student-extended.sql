-- Migration: Add extended fields to Student table
-- Run this in your Supabase SQL editor or psql

ALTER TABLE "Student"
  ADD COLUMN IF NOT EXISTS "birthPlace"        TEXT,
  ADD COLUMN IF NOT EXISTS "nationality"       TEXT,
  ADD COLUMN IF NOT EXISTS "address"           TEXT,
  ADD COLUMN IF NOT EXISTS "photoUrl"          TEXT,
  ADD COLUMN IF NOT EXISTS "parentName1"       TEXT,
  ADD COLUMN IF NOT EXISTS "parentPhone1"      TEXT,
  ADD COLUMN IF NOT EXISTS "parentJob1"        TEXT,
  ADD COLUMN IF NOT EXISTS "parentEmail1"      TEXT,
  ADD COLUMN IF NOT EXISTS "parentName2"       TEXT,
  ADD COLUMN IF NOT EXISTS "parentPhone2"      TEXT,
  ADD COLUMN IF NOT EXISTS "parentJob2"        TEXT,
  ADD COLUMN IF NOT EXISTS "parentEmail2"      TEXT,
  ADD COLUMN IF NOT EXISTS "bloodGroup"        TEXT,
  ADD COLUMN IF NOT EXISTS "allergies"         TEXT,
  ADD COLUMN IF NOT EXISTS "medicalNotes"      TEXT,
  ADD COLUMN IF NOT EXISTS "emergencyContact"  TEXT,
  ADD COLUMN IF NOT EXISTS "emergencyPhone"    TEXT;

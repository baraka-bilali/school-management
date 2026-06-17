-- Le code élève est unique par classe/année (logique applicative), pas globalement
ALTER TABLE "Student" DROP CONSTRAINT IF EXISTS "Student_code_key";

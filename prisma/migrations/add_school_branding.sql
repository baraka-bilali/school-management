-- Logo, sceau et photo de profil de l'établissement (base64 ou URL)
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "sealUrl" TEXT;
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "profilePhotoUrl" TEXT;

-- Assurer que logoUrl accepte les images encodées
ALTER TABLE "School" ALTER COLUMN "logoUrl" TYPE TEXT;

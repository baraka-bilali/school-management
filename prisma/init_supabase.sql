-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('SALAIRE', 'PRIME', 'BONUS', 'AVANCE', 'AUTRE');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('FOURNITURES', 'EQUIPEMENT', 'MAINTENANCE', 'TRANSPORT', 'COMMUNICATION', 'EVENEMENT', 'AUTRE');

-- CreateEnum
CREATE TYPE "User_role" AS ENUM ('ADMIN', 'ELEVE', 'COMPTABLE', 'PROFESSEUR', 'DIRECTEUR_DISCIPLINE', 'DIRECTEUR_ETUDES', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED', 'DROPPED_OUT', 'EXPELLED');

-- CreateEnum
CREATE TYPE "TypeEtablissement" AS ENUM ('PUBLIC', 'PRIVE', 'SEMI_PRIVE');

-- CreateEnum
CREATE TYPE "EtatCompte" AS ENUM ('ACTIF', 'EN_ATTENTE', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SUBSCRIPTION_EXPIRING_15_DAYS', 'SUBSCRIPTION_EXPIRING_10_DAYS', 'SUBSCRIPTION_EXPIRING_5_DAYS', 'SUBSCRIPTION_EXPIRING_2_DAYS', 'SUBSCRIPTION_EXPIRING_1_DAY', 'SUBSCRIPTION_EXPIRED');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('CASH', 'VIREMENT', 'MOBILE_MONEY', 'CHEQUE', 'AUTRE');

-- CreateEnum
CREATE TYPE "BreakType" AS ENUM ('RECREATION', 'PAUSE_DEJEUNER', 'INTER_COURS', 'DEBUT_VACATION', 'FIN_VACATION');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "User_role" NOT NULL DEFAULT 'ELEVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nom" TEXT,
    "prenom" TEXT,
    "telephone" TEXT,
    "fonction" TEXT,
    "schoolId" INTEGER,
    "dateCreation" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "temporaryPassword" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "letter" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "stream" TEXT,
    "schoolId" INTEGER NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "specialty" TEXT,
    "phone" TEXT,
    "hiredAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "yearId" INTEGER NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "exitReason" TEXT,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" SERIAL NOT NULL,
    "nomEtablissement" TEXT NOT NULL,
    "typeEtablissement" "TypeEtablissement" NOT NULL DEFAULT 'PRIVE',
    "niveauEnseignement" TEXT,
    "codeEtablissement" TEXT,
    "anneeCreation" INTEGER,
    "slogan" TEXT,
    "logoUrl" TEXT,
    "statutJuridique" TEXT,
    "rccm" TEXT,
    "idNat" TEXT,
    "nif" TEXT,
    "agrementMinisteriel" TEXT,
    "dateAgrement" TIMESTAMP(3),
    "ministereTutelle" TEXT,
    "statutsReglements" TEXT,
    "responsableLegal" TEXT,
    "pieceIdentiteResponsable" TEXT,
    "adresse" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "pays" TEXT NOT NULL DEFAULT 'RDC',
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "siteWeb" TEXT,
    "directeurNom" TEXT NOT NULL,
    "directeurTelephone" TEXT NOT NULL,
    "directeurEmail" TEXT,
    "secretaireAcademique" TEXT,
    "comptable" TEXT,
    "personnelAdministratifTotal" INTEGER,
    "cycles" TEXT,
    "nombreClasses" INTEGER,
    "nombreEleves" INTEGER,
    "nombreEnseignants" INTEGER,
    "langueEnseignement" TEXT,
    "programmes" TEXT,
    "calendrierScolaire" TEXT,
    "joursOuverture" TEXT,
    "domaine" TEXT,
    "identifiantInterne" TEXT NOT NULL,
    "etatCompte" "EtatCompte" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateInscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "derniereMiseAJour" TIMESTAMP(3) NOT NULL,
    "creeParId" INTEGER,
    "modifieParId" INTEGER,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,
    "dateDebutAbonnement" TIMESTAMP(3),
    "dateFinAbonnement" TIMESTAMP(3),
    "periodeAbonnement" TEXT,
    "planAbonnement" TEXT,
    "typePaiement" TEXT,
    "montantPaye" DOUBLE PRECISION,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "schoolId" INTEGER,
    "userId" INTEGER,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "daysLeft" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeFrais" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "schoolId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypeFrais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarification" (
    "id" SERIAL NOT NULL,
    "typeFraisId" INTEGER NOT NULL,
    "yearId" INTEGER NOT NULL,
    "classId" INTEGER,
    "montant" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "schoolId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Echeance" (
    "id" SERIAL NOT NULL,
    "tarificationId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Echeance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" SERIAL NOT NULL,
    "numeroRecu" TEXT NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "tarificationId" INTEGER NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modePaiement" "ModePaiement" NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "notes" TEXT,
    "recuPdfPath" TEXT,
    "schoolId" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "isAnnule" BOOLEAN NOT NULL DEFAULT false,
    "motifAnnulation" TEXT,
    "annulePar" INTEGER,
    "dateAnnulation" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaiementModification" (
    "id" SERIAL NOT NULL,
    "paiementId" INTEGER NOT NULL,
    "champModifie" TEXT NOT NULL,
    "ancienneValeur" TEXT NOT NULL,
    "nouvelleValeur" TEXT NOT NULL,
    "modifiePar" INTEGER NOT NULL,
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaiementModification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptCounter" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "yearId" INTEGER NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReceiptCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherPayment" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "type" "PaymentType" NOT NULL DEFAULT 'SALAIRE',
    "mois" TEXT NOT NULL,
    "description" TEXT,
    "modePaiement" "ModePaiement" NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolExpense" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "categorie" "ExpenseCategory" NOT NULL DEFAULT 'AUTRE',
    "motif" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "beneficiaire" TEXT,
    "modePaiement" "ModePaiement" NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "dateDepense" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "coefficient" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "maxWeeklyHours" INTEGER NOT NULL DEFAULT 5,
    "schoolId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseAssignment" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "yearId" INTEGER NOT NULL,
    "weeklyHours" DOUBLE PRECISION NOT NULL,
    "maxDailyHours" DOUBLE PRECISION,
    "schoolId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleSlot" (
    "id" SERIAL NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "schoolId" INTEGER NOT NULL,
    "yearId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleBreak" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BreakType" NOT NULL DEFAULT 'RECREATION',
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "section" TEXT,
    "schoolId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleBreak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_schoolId_idx" ON "User"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_name_key" ON "AcademicYear"("name");

-- CreateIndex
CREATE INDEX "Class_section_idx" ON "Class"("section");

-- CreateIndex
CREATE INDEX "Class_level_idx" ON "Class"("level");

-- CreateIndex
CREATE INDEX "Class_schoolId_idx" ON "Class"("schoolId");

-- CreateIndex
CREATE INDEX "Class_section_level_letter_idx" ON "Class"("section", "level", "letter");

-- CreateIndex
CREATE UNIQUE INDEX "Class_name_schoolId_key" ON "Class"("name", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_code_key" ON "Student"("code");

-- CreateIndex
CREATE INDEX "Student_lastName_idx" ON "Student"("lastName");

-- CreateIndex
CREATE INDEX "Student_code_idx" ON "Student"("code");

-- CreateIndex
CREATE INDEX "Student_lastName_firstName_idx" ON "Student"("lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");

-- CreateIndex
CREATE INDEX "Teacher_lastName_idx" ON "Teacher"("lastName");

-- CreateIndex
CREATE INDEX "Teacher_specialty_idx" ON "Teacher"("specialty");

-- CreateIndex
CREATE INDEX "Teacher_lastName_firstName_idx" ON "Teacher"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Enrollment_classId_idx" ON "Enrollment"("classId");

-- CreateIndex
CREATE INDEX "Enrollment_yearId_idx" ON "Enrollment"("yearId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_classId_yearId_key" ON "Enrollment"("studentId", "classId", "yearId");

-- CreateIndex
CREATE UNIQUE INDEX "School_codeEtablissement_key" ON "School"("codeEtablissement");

-- CreateIndex
CREATE UNIQUE INDEX "School_identifiantInterne_key" ON "School"("identifiantInterne");

-- CreateIndex
CREATE INDEX "School_codeEtablissement_idx" ON "School"("codeEtablissement");

-- CreateIndex
CREATE INDEX "School_email_idx" ON "School"("email");

-- CreateIndex
CREATE INDEX "School_creeParId_idx" ON "School"("creeParId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_schoolId_isRead_idx" ON "Notification"("schoolId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TypeFrais_code_key" ON "TypeFrais"("code");

-- CreateIndex
CREATE INDEX "TypeFrais_schoolId_idx" ON "TypeFrais"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "TypeFrais_schoolId_code_key" ON "TypeFrais"("schoolId", "code");

-- CreateIndex
CREATE INDEX "Tarification_schoolId_idx" ON "Tarification"("schoolId");

-- CreateIndex
CREATE INDEX "Tarification_yearId_idx" ON "Tarification"("yearId");

-- CreateIndex
CREATE INDEX "Tarification_classId_idx" ON "Tarification"("classId");

-- CreateIndex
CREATE INDEX "Tarification_typeFraisId_idx" ON "Tarification"("typeFraisId");

-- CreateIndex
CREATE UNIQUE INDEX "Tarification_typeFraisId_yearId_classId_schoolId_key" ON "Tarification"("typeFraisId", "yearId", "classId", "schoolId");

-- CreateIndex
CREATE INDEX "Echeance_tarificationId_idx" ON "Echeance"("tarificationId");

-- CreateIndex
CREATE INDEX "Echeance_dateEcheance_idx" ON "Echeance"("dateEcheance");

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_numeroRecu_key" ON "Paiement"("numeroRecu");

-- CreateIndex
CREATE INDEX "Paiement_schoolId_idx" ON "Paiement"("schoolId");

-- CreateIndex
CREATE INDEX "Paiement_studentId_idx" ON "Paiement"("studentId");

-- CreateIndex
CREATE INDEX "Paiement_enrollmentId_idx" ON "Paiement"("enrollmentId");

-- CreateIndex
CREATE INDEX "Paiement_tarificationId_idx" ON "Paiement"("tarificationId");

-- CreateIndex
CREATE INDEX "Paiement_numeroRecu_idx" ON "Paiement"("numeroRecu");

-- CreateIndex
CREATE INDEX "Paiement_datePaiement_idx" ON "Paiement"("datePaiement");

-- CreateIndex
CREATE INDEX "Paiement_schoolId_datePaiement_idx" ON "Paiement"("schoolId", "datePaiement");

-- CreateIndex
CREATE INDEX "PaiementModification_paiementId_idx" ON "PaiementModification"("paiementId");

-- CreateIndex
CREATE INDEX "PaiementModification_createdAt_idx" ON "PaiementModification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptCounter_schoolId_yearId_key" ON "ReceiptCounter"("schoolId", "yearId");

-- CreateIndex
CREATE INDEX "TeacherPayment_schoolId_idx" ON "TeacherPayment"("schoolId");

-- CreateIndex
CREATE INDEX "TeacherPayment_teacherId_idx" ON "TeacherPayment"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherPayment_datePaiement_idx" ON "TeacherPayment"("datePaiement");

-- CreateIndex
CREATE INDEX "TeacherPayment_schoolId_mois_idx" ON "TeacherPayment"("schoolId", "mois");

-- CreateIndex
CREATE INDEX "SchoolExpense_schoolId_idx" ON "SchoolExpense"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolExpense_dateDepense_idx" ON "SchoolExpense"("dateDepense");

-- CreateIndex
CREATE INDEX "SchoolExpense_schoolId_categorie_idx" ON "SchoolExpense"("schoolId", "categorie");

-- CreateIndex
CREATE INDEX "Subject_schoolId_idx" ON "Subject"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_schoolId_code_key" ON "Subject"("schoolId", "code");

-- CreateIndex
CREATE INDEX "CourseAssignment_schoolId_idx" ON "CourseAssignment"("schoolId");

-- CreateIndex
CREATE INDEX "CourseAssignment_teacherId_idx" ON "CourseAssignment"("teacherId");

-- CreateIndex
CREATE INDEX "CourseAssignment_classId_idx" ON "CourseAssignment"("classId");

-- CreateIndex
CREATE INDEX "CourseAssignment_yearId_idx" ON "CourseAssignment"("yearId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseAssignment_subjectId_classId_yearId_schoolId_key" ON "CourseAssignment"("subjectId", "classId", "yearId", "schoolId");

-- CreateIndex
CREATE INDEX "ScheduleSlot_schoolId_idx" ON "ScheduleSlot"("schoolId");

-- CreateIndex
CREATE INDEX "ScheduleSlot_classId_idx" ON "ScheduleSlot"("classId");

-- CreateIndex
CREATE INDEX "ScheduleSlot_assignmentId_idx" ON "ScheduleSlot"("assignmentId");

-- CreateIndex
CREATE INDEX "ScheduleSlot_dayOfWeek_idx" ON "ScheduleSlot"("dayOfWeek");

-- CreateIndex
CREATE INDEX "ScheduleSlot_yearId_idx" ON "ScheduleSlot"("yearId");

-- CreateIndex
CREATE INDEX "ScheduleBreak_schoolId_idx" ON "ScheduleBreak"("schoolId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarification" ADD CONSTRAINT "Tarification_typeFraisId_fkey" FOREIGN KEY ("typeFraisId") REFERENCES "TypeFrais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarification" ADD CONSTRAINT "Tarification_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarification" ADD CONSTRAINT "Tarification_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Echeance" ADD CONSTRAINT "Echeance_tarificationId_fkey" FOREIGN KEY ("tarificationId") REFERENCES "Tarification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_tarificationId_fkey" FOREIGN KEY ("tarificationId") REFERENCES "Tarification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaiementModification" ADD CONSTRAINT "PaiementModification_paiementId_fkey" FOREIGN KEY ("paiementId") REFERENCES "Paiement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptCounter" ADD CONSTRAINT "ReceiptCounter_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherPayment" ADD CONSTRAINT "TeacherPayment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAssignment" ADD CONSTRAINT "CourseAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAssignment" ADD CONSTRAINT "CourseAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAssignment" ADD CONSTRAINT "CourseAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAssignment" ADD CONSTRAINT "CourseAssignment_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "CourseAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


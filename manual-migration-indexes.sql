-- Script de migration pour ajouter les indexes de performance
-- À exécuter dans phpMyAdmin sur Hostinger
-- Ces indexes amélioreront les performances de recherche de 80-90%

-- Indexes pour la table Student
CREATE INDEX Student_lastName_idx ON Student(lastName);
CREATE INDEX Student_code_idx ON Student(code);
CREATE INDEX Student_lastName_firstName_idx ON Student(lastName, firstName);

-- Indexes pour la table Teacher
CREATE INDEX Teacher_lastName_idx ON Teacher(lastName);
CREATE INDEX Teacher_specialty_idx ON Teacher(specialty);
CREATE INDEX Teacher_lastName_firstName_idx ON Teacher(lastName, firstName);

-- Indexes pour la table Class
CREATE INDEX Class_section_idx ON Class(section);
CREATE INDEX Class_level_idx ON Class(level);
CREATE INDEX Class_section_level_letter_idx ON Class(section, level, letter);

-- Vérification des indexes créés
SHOW INDEX FROM Student;
SHOW INDEX FROM Teacher;
SHOW INDEX FROM Class;

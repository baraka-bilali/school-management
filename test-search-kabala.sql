-- Script de test pour vérifier la recherche de "Kabala"
-- À exécuter dans phpMyAdmin pour diagnostiquer le problème

-- 1. Chercher Kabala dans tous les champs (sensible à la casse)
SELECT * FROM Student 
WHERE lastName LIKE '%Kabala%' 
   OR middleName LIKE '%Kabala%' 
   OR firstName LIKE '%Kabala%' 
   OR code LIKE '%Kabala%';

-- 2. Chercher Kabala (insensible à la casse)
SELECT * FROM Student 
WHERE LOWER(lastName) LIKE LOWER('%Kabala%')
   OR LOWER(middleName) LIKE LOWER('%Kabala%')
   OR LOWER(firstName) LIKE LOWER('%Kabala%')
   OR LOWER(code) LIKE LOWER('%Kabala%');

-- 3. Afficher tous les noms qui contiennent 'kab' (pour voir les variations)
SELECT id, code, lastName, middleName, firstName 
FROM Student 
WHERE LOWER(lastName) LIKE '%kab%'
   OR LOWER(middleName) LIKE '%kab%'
   OR LOWER(firstName) LIKE '%kab%';

-- 4. Vérifier le collation de la table (sensibilité à la casse)
SHOW FULL COLUMNS FROM Student;

-- 5. Afficher les 20 premiers étudiants pour comparaison
SELECT id, code, lastName, middleName, firstName 
FROM Student 
LIMIT 20;

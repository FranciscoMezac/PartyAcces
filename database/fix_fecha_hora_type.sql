-- Fix: Cambiar tipo de dato de fecha_hora a timestamptz
-- Este script corrige el problema de que fecha_hora está almacenado como VARCHAR en lugar de TIMESTAMPTZ

-- Paso 1: Ver el tipo actual
\d acceso

-- Paso 2: Cambiar el tipo de dato a timestamptz
ALTER TABLE acceso ALTER COLUMN fecha_hora TYPE timestamptz USING fecha_hora::timestamptz;

-- Paso 3: Verificar el cambio
\d acceso

-- Paso 4: Ver los datos actuales
SELECT acceso_id, usuario_id, fecha_hora, tipo_acceso, 
       DATE(fecha_hora AT TIME ZONE 'America/Santiago') as fecha_chile
FROM acceso 
ORDER BY fecha_hora DESC 
LIMIT 10;

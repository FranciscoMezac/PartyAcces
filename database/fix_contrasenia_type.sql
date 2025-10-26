-- Script para cambiar el tipo de dato de contrasenia de CHAR(256) a VARCHAR(256)
-- Esto evita el relleno con espacios que causa problemas con bcrypt

-- Cambiar tipo de dato
ALTER TABLE usuario 
ALTER COLUMN contrasenia TYPE VARCHAR(256);

-- Limpiar espacios existentes
UPDATE usuario 
SET contrasenia = TRIM(contrasenia);

-- Verificar cambios
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'usuario' AND column_name = 'contrasenia';

-- Script para normalizar emails a minúsculas en la base de datos
-- Ejecutar este script en pgAdmin una sola vez

UPDATE usuario 
SET email = LOWER(email)
WHERE email != LOWER(email);

-- Verificar cambios
SELECT usuario_id, nombre, email, rut 
FROM usuario 
ORDER BY usuario_id;

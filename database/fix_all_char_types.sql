-- Script para cambiar todas las columnas CHAR(256) a VARCHAR(256)
-- Esto evita el relleno con espacios que causa problemas

-- Tabla: usuario
ALTER TABLE usuario 
ALTER COLUMN nombre TYPE VARCHAR(256),
ALTER COLUMN rut TYPE VARCHAR(20),
ALTER COLUMN email TYPE VARCHAR(256),
ALTER COLUMN contrasenia TYPE VARCHAR(256),
ALTER COLUMN rol TYPE VARCHAR(50),
ALTER COLUMN estado TYPE VARCHAR(50);

-- Tabla: cuenta_puntos
ALTER TABLE cuenta_puntos 
ALTER COLUMN rut TYPE VARCHAR(20);

-- Tabla: sesiones (si existe)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sesiones') THEN
        EXECUTE 'ALTER TABLE sesiones ALTER COLUMN rut TYPE VARCHAR(20)';
        EXECUTE 'ALTER TABLE sesiones ALTER COLUMN token TYPE VARCHAR(256)';
    END IF;
END $$;

-- Limpiar espacios existentes en todas las tablas
UPDATE usuario SET 
    nombre = TRIM(nombre),
    rut = TRIM(rut),
    email = TRIM(email),
    contrasenia = TRIM(contrasenia),
    rol = TRIM(rol),
    estado = TRIM(estado);

UPDATE cuenta_puntos SET 
    rut = TRIM(rut);

-- Verificar cambios
SELECT 
    table_name,
    column_name, 
    data_type, 
    character_maximum_length 
FROM information_schema.columns 
WHERE table_name IN ('usuario', 'cuenta_puntos', 'sesiones')
AND data_type IN ('character', 'character varying')
ORDER BY table_name, column_name;

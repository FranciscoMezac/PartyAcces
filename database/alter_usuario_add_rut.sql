-- Script para agregar columna rut a la tabla usuario

ALTER TABLE usuario 
ADD COLUMN IF NOT EXISTS rut VARCHAR(20) UNIQUE;

-- Crear índice para búsquedas por rut
CREATE INDEX IF NOT EXISTS idx_usuario_rut ON usuario(rut);

-- Comentario
COMMENT ON COLUMN usuario.rut IS 'RUT único del usuario';

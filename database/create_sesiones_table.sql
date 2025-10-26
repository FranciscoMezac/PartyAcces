-- Tabla de sesiones de usuario
-- Almacena las sesiones activas con tokens y tiempos de expiración

CREATE TABLE IF NOT EXISTS sesiones (
    session_id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    rut VARCHAR(12) NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    expira_en TIMESTAMP NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT TRUE,
    
    -- Foreign key a la tabla usuario
    CONSTRAINT fk_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuario(usuario_id)
        ON DELETE CASCADE
);

-- Índice para búsquedas por usuario_id
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones(usuario_id);

-- Índice para búsquedas por token
CREATE INDEX IF NOT EXISTS idx_sesiones_token_activas ON sesiones(token) WHERE activa = TRUE;

-- Índice para limpiar sesiones expiradas
CREATE INDEX IF NOT EXISTS idx_sesiones_expira_en ON sesiones(expira_en);

-- Comentarios de documentación
COMMENT ON TABLE sesiones IS 'Almacena las sesiones activas de usuarios con tokens únicos';
COMMENT ON COLUMN sesiones.session_id IS 'ID único de la sesión';
COMMENT ON COLUMN sesiones.usuario_id IS 'ID del usuario propietario de la sesión';
COMMENT ON COLUMN sesiones.rut IS 'RUT del usuario (para referencia rápida)';
COMMENT ON COLUMN sesiones.token IS 'Token único generado para la sesión (64 caracteres hex)';
COMMENT ON COLUMN sesiones.expira_en IS 'Fecha y hora en que expira la sesión';
COMMENT ON COLUMN sesiones.creado_en IS 'Fecha y hora de creación de la sesión';
COMMENT ON COLUMN sesiones.activa IS 'Indica si la sesión está activa o fue invalidada (logout)';

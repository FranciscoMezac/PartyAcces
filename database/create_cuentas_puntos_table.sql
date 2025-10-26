-- Script SQL para crear la tabla de cuentas de puntos

CREATE TABLE IF NOT EXISTS cuentas (
    id BIGSERIAL PRIMARY KEY,
    rut VARCHAR(20) NOT NULL,
    saldo INTEGER DEFAULT 0 CHECK (saldo >= 0),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas rápidas por rut
CREATE INDEX IF NOT EXISTS idx_cuentas_rut ON cuentas(rut);

-- Comentarios
COMMENT ON TABLE cuentas IS 'Tabla de cuentas de puntos de usuarios';
COMMENT ON COLUMN cuentas.id IS 'ID único de la cuenta de puntos';
COMMENT ON COLUMN cuentas.rut IS 'RUT o email del usuario';
COMMENT ON COLUMN cuentas.saldo IS 'Saldo de puntos acumulados';
COMMENT ON COLUMN cuentas.actualizado_en IS 'Fecha y hora de última actualización';


-- Tabla de accesos (registros de ingreso mediante QR)
CREATE TABLE IF NOT EXISTS acceso (
    acceso_id    SERIAL PRIMARY KEY,
    usuario_id   INTEGER NOT NULL REFERENCES usuario(usuario_id),
    qr_referencia VARCHAR(100) NOT NULL,
    fecha_hora   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_acceso  VARCHAR(20) NOT NULL DEFAULT 'INGRESO'
);

-- Índice para búsquedas rápidas por usuario y fecha
CREATE INDEX IF NOT EXISTS idx_acceso_usuario_fecha ON acceso(usuario_id, fecha_hora DESC);

-- Índice para búsquedas por referencia QR
CREATE INDEX IF NOT EXISTS idx_acceso_qr_referencia ON acceso(qr_referencia);

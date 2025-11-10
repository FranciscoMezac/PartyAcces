-- Tabla QR para almacenar códigos únicos por usuario
CREATE TABLE IF NOT EXISTS qr (
    qr_id       SERIAL PRIMARY KEY,
    usuario_id  INTEGER NOT NULL REFERENCES usuario(usuario_id),
    data        TEXT    NOT NULL,
    referencia  VARCHAR(100) NOT NULL,
    estado      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
    creado_en   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qr_usuario_estado ON qr(usuario_id, estado);


-- Tabla de historial de cierres de jornada
-- Registra cuántas personas ingresaron cada día antes del cierre automático

CREATE TABLE IF NOT EXISTS historial_cierres (
    cierre_id           SERIAL PRIMARY KEY,
    fecha_cierre        DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_cierre         TIME NOT NULL DEFAULT CURRENT_TIME,
    total_ingresos      INTEGER NOT NULL DEFAULT 0,
    usuarios_procesados INTEGER NOT NULL DEFAULT 0,
    fecha_hora_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones       TEXT
);

-- Índice para búsquedas rápidas por fecha
CREATE INDEX IF NOT EXISTS idx_historial_cierres_fecha ON historial_cierres(fecha_cierre DESC);

-- Comentarios
COMMENT ON TABLE historial_cierres IS 'Historial de cierres automáticos de jornada a las 14:00';
COMMENT ON COLUMN historial_cierres.fecha_cierre IS 'Fecha del cierre (día de la jornada cerrada)';
COMMENT ON COLUMN historial_cierres.hora_cierre IS 'Hora en que se ejecutó el cierre';
COMMENT ON COLUMN historial_cierres.total_ingresos IS 'Total de ingresos registrados ese día';
COMMENT ON COLUMN historial_cierres.usuarios_procesados IS 'Usuarios a los que se les registró salida automática';

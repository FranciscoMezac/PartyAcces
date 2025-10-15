-- Script SQL para crear la tabla de usuarios (adaptado al proyecto PartyAccess)

-- Tabla principal de usuarios
CREATE TABLE IF NOT EXISTS usuario (
    usuario_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contrasenia VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'USER' CHECK (rol IN ('USER', 'ADMIN')),
    estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas rápidas por email
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);

-- Índice para filtrar por estado
CREATE INDEX IF NOT EXISTS idx_usuario_estado ON usuario(estado);

-- Datos de prueba
INSERT INTO usuario (nombre, email, contrasenia, rol, estado) VALUES
('Juan Pérez', 'juan@example.com', '123456', 'USER', 'ACTIVO'),
('María García', 'maria@example.com', '123456', 'USER', 'ACTIVO'),
('Admin Test', 'admin@example.com', 'admin123', 'ADMIN', 'ACTIVO')
ON CONFLICT (email) DO NOTHING;

-- Comentarios
COMMENT ON TABLE usuario IS 'Tabla principal de usuarios del sistema PartyAccess';
COMMENT ON COLUMN usuario.usuario_id IS 'ID único del usuario';
COMMENT ON COLUMN usuario.nombre IS 'Nombre completo del usuario';
COMMENT ON COLUMN usuario.email IS 'Email único del usuario';
COMMENT ON COLUMN usuario.contrasenia IS 'Contraseña (en producción usar bcrypt)';
COMMENT ON COLUMN usuario.rol IS 'Rol del usuario: USER o ADMIN';
COMMENT ON COLUMN usuario.estado IS 'Estado del usuario: ACTIVO o INACTIVO';

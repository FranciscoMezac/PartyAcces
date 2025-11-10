/**
 * Patrón: Repository Pattern
 * Propósito: Abstraer acceso a datos de QR desde la lógica de negocio
 */

const Qr = require('../models/Qr');

class QrRepository {
    #db;

    /**
     * @param {Object} db - Pool de conexión a BD
     */
    constructor(db) {
        this.#db = db;
    }

    /**
     * Busca QR activo por usuario
     * Retorna instancia del Modelo con Repositorio inyectado o null
     */
    async findActiveByUsuarioId(usuarioId) {
        const r = await this.#db.query(
            `SELECT qr_id, usuario_id, data, referencia, estado, creado_en
               FROM qr
              WHERE usuario_id = $1 AND estado = 'ACTIVO'
              ORDER BY qr_id DESC
              LIMIT 1`,
            [usuarioId]
        );
        return r.rows[0] ? new Qr(r.rows[0], this) : null;
    }

    /**
     * Inserta un nuevo QR
     * Retorna instancia del Modelo con Repositorio inyectado
     */
    async insert(qr) {
        const r = await this.#db.query(
            `INSERT INTO qr (usuario_id, data, referencia, estado)
             VALUES ($1, $2, $3, $4)
             RETURNING qr_id, usuario_id, data, referencia, estado, creado_en`,
            [qr.usuarioId, qr.data, qr.referencia, qr.estado]
        );
        return new Qr(r.rows[0], this);
    }
}

module.exports = QrRepository;


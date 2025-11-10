/**
 * Patrón: Repository Pattern
 * Propósito: Abstraer acceso a datos de Acceso desde la lógica de negocio
 */

const Acceso = require('../models/Acceso');

class AccesoRepository {
    #db;

    /**
     * @param {Object} db - Pool de conexión a BD
     */
    constructor(db) {
        this.#db = db;
    }

    /**
     * Inserta un nuevo acceso
     * @param {Acceso} acceso
     * @returns {Promise<Acceso>}
     */
    async insert(acceso) {
        const r = await this.#db.query(
            `INSERT INTO acceso (usuario_id, qr_referencia, tipo_acceso)
             VALUES ($1, $2, $3)
             RETURNING acceso_id, usuario_id, qr_referencia, fecha_hora, tipo_acceso`,
            [acceso.usuarioId, acceso.qrReferencia, acceso.tipoAcceso]
        );
        return new Acceso(r.rows[0], this);
    }

    /**
     * Busca el último acceso de un usuario en las últimas X horas
     * @param {number} usuarioId
     * @param {number} horas
     * @returns {Promise<Acceso|null>}
     */
    async findRecentByUsuarioId(usuarioId, horas = 8) {
        const r = await this.#db.query(
            `SELECT acceso_id, usuario_id, qr_referencia, fecha_hora, tipo_acceso
             FROM acceso
             WHERE usuario_id = $1
               AND fecha_hora >= NOW() - INTERVAL '${horas} hours'
             ORDER BY fecha_hora DESC
             LIMIT 1`,
            [usuarioId]
        );
        return r.rows[0] ? new Acceso(r.rows[0], this) : null;
    }
}

module.exports = AccesoRepository;

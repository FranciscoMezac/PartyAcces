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
     * Inserta un nuevo acceso con hora de Chile (America/Santiago)
     * @param {Acceso} acceso
     * @returns {Promise<Acceso>}
     */
    async insert(acceso) {
        const r = await this.#db.query(
            `INSERT INTO acceso (usuario_id, qr_referencia, tipo_acceso, fecha_hora)
             VALUES ($1, $2, $3, NOW() AT TIME ZONE 'America/Santiago')
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

    /**
     * Obtiene usuarios cuyo último movimiento HOY es INGRESO (están actualmente en el local)
     * Usa zona horaria de Chile para determinar "hoy"
     * @returns {Promise<Array>} Array con datos del último ingreso
     */
    async findIngresosHoy() {
        const r = await this.#db.query(
            `SELECT 
                a.acceso_id,
                a.usuario_id,
                a.qr_referencia,
                a.fecha_hora,
                a.tipo_acceso
             FROM (
                 SELECT DISTINCT ON (usuario_id)
                     acceso_id,
                     usuario_id,
                     qr_referencia,
                     fecha_hora,
                     tipo_acceso
                 FROM acceso
                 WHERE DATE(fecha_hora AT TIME ZONE 'America/Santiago') = (NOW() AT TIME ZONE 'America/Santiago')::date
                 ORDER BY usuario_id, fecha_hora DESC
             ) a
             WHERE a.tipo_acceso = 'INGRESO'
             ORDER BY a.fecha_hora DESC`
        );
        return r.rows;
    }

    /**
     * Cuenta cuántos usuarios están actualmente en el local (cuyo último movimiento hoy es INGRESO)
     * Usa zona horaria de Chile
     * @returns {Promise<number>}
     */
    async countIngresosSinSalida() {
        const r = await this.#db.query(
            `SELECT COUNT(DISTINCT usuario_id)::int AS total
             FROM (
                 SELECT DISTINCT ON (usuario_id) 
                     usuario_id, 
                     tipo_acceso
                 FROM acceso
                 WHERE DATE(fecha_hora AT TIME ZONE 'America/Santiago') = (NOW() AT TIME ZONE 'America/Santiago')::date
                 ORDER BY usuario_id, fecha_hora DESC
             ) AS ultimos_movimientos
             WHERE tipo_acceso = 'INGRESO'`
        );
        return r.rows[0].total;
    }

    /**
     * Obtiene IDs de usuarios cuyo último movimiento hoy es INGRESO (para cierre de jornada)
     * Usa zona horaria de Chile
     * @returns {Promise<Array<number>>}
     */
    async findUsuariosConIngresoAbierto() {
        const r = await this.#db.query(
            `SELECT usuario_id
             FROM (
                 SELECT DISTINCT ON (usuario_id) 
                     usuario_id, 
                     tipo_acceso
                 FROM acceso
                 WHERE DATE(fecha_hora AT TIME ZONE 'America/Santiago') = (NOW() AT TIME ZONE 'America/Santiago')::date
                 ORDER BY usuario_id, fecha_hora DESC
             ) AS ultimos_movimientos
             WHERE tipo_acceso = 'INGRESO'`
        );
        return r.rows.map(row => row.usuario_id);
    }

    /**
     * Registra salidas masivas para cierre de jornada con hora de Chile
     * @param {Array<number>} usuarioIds
     * @returns {Promise<number>} Cantidad de salidas registradas
     */
    async insertSalidasMasivas(usuarioIds) {
        if (!Array.isArray(usuarioIds) || usuarioIds.length === 0) return 0;

        // Construir placeholders correctamente: ($1, $2, $3, NOW()), ($4, $5, $6, NOW()), ...
        const values = usuarioIds.map((_, idx) => {
            const base = idx * 3;
            return `($${base + 1}, $${base + 2}, $${base + 3}, NOW() AT TIME ZONE 'America/Santiago')`;
        }).join(', ');

        // Construir parámetros en el mismo orden
        const params = [];
        usuarioIds.forEach(id => {
            params.push(id);           // usuario_id
            params.push('CIERRE_AUTO'); // qr_referencia
            params.push('SALIDA');      // tipo_acceso
        });

        const r = await this.#db.query(
            `INSERT INTO acceso (usuario_id, qr_referencia, tipo_acceso, fecha_hora)
             VALUES ${values}
             RETURNING acceso_id`,
            params
        );
        return r.rowCount;
    }

    /**
     * Obtiene todos los ingresos de una fecha específica con datos de usuario
     * Solo incluye ingresos ANTES de las 14:00 (hora de cierre de jornada)
     * @param {string} fecha - Formato 'YYYY-MM-DD'
     * @returns {Promise<Array>}
     */
    async findIngresosPorFecha(fecha) {
        const r = await this.#db.query(
            `SELECT 
                a.acceso_id,
                a.usuario_id,
                a.fecha_hora,
                u.nombre,
                u.rut,
                u.email
             FROM acceso a
             INNER JOIN usuario u ON u.usuario_id = a.usuario_id
             WHERE DATE(a.fecha_hora) = $1
               AND a.tipo_acceso = 'INGRESO'
               AND EXTRACT(HOUR FROM a.fecha_hora) < 14
             ORDER BY a.fecha_hora ASC`,
            [fecha]
        );
        return r.rows;
    }

    /**
     * Cuenta TODOS los ingresos del día (no solo únicos, incluye reingresos)
     * Usa zona horaria de Chile
     * @returns {Promise<number>}
     */
    async countTotalIngresosHoy() {
        const r = await this.#db.query(
            `SELECT COUNT(*)::int AS total
             FROM acceso
             WHERE DATE(fecha_hora AT TIME ZONE 'America/Santiago') = (NOW() AT TIME ZONE 'America/Santiago')::date
               AND tipo_acceso = 'INGRESO'`
        );
        return r.rows[0].total;
    }
}


module.exports = AccesoRepository;

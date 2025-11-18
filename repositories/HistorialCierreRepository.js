/**
 * Patrón: Repository Pattern
 * Propósito: Abstraer acceso a datos de HistorialCierre
 */

const HistorialCierre = require('../models/HistorialCierre');

class HistorialCierreRepository {
    #db;

    /**
     * @param {Object} db - Pool de conexión a BD
     */
    constructor(db) {
        this.#db = db;
    }

    /**
     * Inserta un nuevo registro de cierre
     * @param {HistorialCierre} historialCierre
     * @returns {Promise<HistorialCierre>}
     */
    async insert(historialCierre) {
        const r = await this.#db.query(
            `INSERT INTO historial_cierres 
             (fecha_cierre, hora_cierre, total_ingresos, usuarios_procesados, observaciones)
             VALUES (
                 (NOW() AT TIME ZONE 'America/Santiago')::date,
                 (NOW() AT TIME ZONE 'America/Santiago')::time,
                 $1, $2, $3
             )
             RETURNING cierre_id, fecha_cierre, hora_cierre, total_ingresos, 
                       usuarios_procesados, fecha_hora_registro, observaciones`,
            [
                historialCierre.totalIngresos,
                historialCierre.usuariosProcesados,
                historialCierre.observaciones || null
            ]
        );
        return new HistorialCierre(r.rows[0], this);
    }

    /**
     * Obtiene historial paginado de cierres
     * @param {Object} opciones - {page, limit, fechaDesde, fechaHasta}
     * @returns {Promise<{items: Array<HistorialCierre>, total: number, page: number, limit: number}>}
     */
    async findAllPaginated({ page = 1, limit = 10, fechaDesde = null, fechaHasta = null } = {}) {
        const p = Number(page) > 0 ? Number(page) : 1;
        const l = Number(limit) > 0 && Number(limit) <= 100 ? Number(limit) : 10;
        const offset = (p - 1) * l;

        const whereParts = [];
        const params = [];

        if (fechaDesde) {
            params.push(fechaDesde);
            whereParts.push(`fecha_cierre >= $${params.length}`);
        }

        if (fechaHasta) {
            params.push(fechaHasta);
            whereParts.push(`fecha_cierre <= $${params.length}`);
        }

        const whereSql = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';

        const rowsRes = await this.#db.query(
            `SELECT cierre_id, 
                    fecha_cierre::text AS fecha_cierre, 
                    hora_cierre::text AS hora_cierre, 
                    total_ingresos, 
                    usuarios_procesados, 
                    fecha_hora_registro, 
                    observaciones
             FROM historial_cierres
             ${whereSql}
             ORDER BY fecha_cierre DESC, hora_cierre DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, l, offset]
        );

        const totalRes = await this.#db.query(
            `SELECT COUNT(*)::int AS total FROM historial_cierres ${whereSql}`,
            params
        );

        const items = rowsRes.rows.map(row => new HistorialCierre(row, this));

        return {
            items,
            total: totalRes.rows[0].total,
            page: p,
            limit: l
        };
    }

    /**
     * Busca cierre por fecha específica
     * @param {string} fecha - Formato 'YYYY-MM-DD'
     * @returns {Promise<HistorialCierre|null>}
     */
    async findByFecha(fecha) {
        const r = await this.#db.query(
            `SELECT cierre_id, 
                    fecha_cierre::text AS fecha_cierre, 
                    hora_cierre::text AS hora_cierre, 
                    total_ingresos, 
                    usuarios_procesados, 
                    fecha_hora_registro, 
                    observaciones
             FROM historial_cierres
             WHERE fecha_cierre = $1
             ORDER BY hora_cierre DESC
             LIMIT 1`,
            [fecha]
        );
        return r.rows[0] ? new HistorialCierre(r.rows[0], this) : null;
    }

    /**
     * Obtiene estadísticas generales
     * @returns {Promise<Object>}
     */
    async getEstadisticas() {
        const r = await this.#db.query(
            `SELECT 
                COUNT(*)::int AS total_cierres,
                COALESCE(SUM(total_ingresos), 0)::int AS ingresos_totales,
                COALESCE(AVG(total_ingresos), 0)::numeric(10,2) AS promedio_ingresos,
                COALESCE(MAX(total_ingresos), 0)::int AS max_ingresos,
                COALESCE(MIN(total_ingresos), 0)::int AS min_ingresos
             FROM historial_cierres`
        );
        return r.rows[0];
    }

    /**
     * Obtiene el último cierre registrado
     * @returns {Promise<HistorialCierre|null>}
     */
    async findUltimoCierre() {
        const r = await this.#db.query(
            `SELECT cierre_id, 
                    fecha_cierre::text AS fecha_cierre, 
                    hora_cierre::text AS hora_cierre, 
                    total_ingresos, 
                    usuarios_procesados, 
                    fecha_hora_registro, 
                    observaciones
             FROM historial_cierres
             ORDER BY fecha_cierre DESC, hora_cierre DESC
             LIMIT 1`
        );
        return r.rows[0] ? new HistorialCierre(r.rows[0], this) : null;
    }
}

module.exports = HistorialCierreRepository;

/**
 * Patrón: Service Layer Pattern
 * Propósito: Coordinar la obtención de historial de cierres con estadísticas
 */

class HistorialService {
    #historialCierreRepository;
    #accesoRepository;

    /**
     * @param {HistorialCierreRepository} historialCierreRepository
     * @param {AccesoRepository} accesoRepository
     */
    constructor(historialCierreRepository, accesoRepository = null) {
        this.#historialCierreRepository = historialCierreRepository;
        this.#accesoRepository = accesoRepository;
    }

    /**
     * Obtiene historial paginado de cierres
     * @param {Object} opciones - {page, limit, fechaDesde, fechaHasta}
     * @returns {Promise<Object>}
     */
    async obtenerHistorial({ page = 1, limit = 10, fechaDesde = null, fechaHasta = null } = {}) {
        const resultado = await this.#historialCierreRepository.findAllPaginated({
            page,
            limit,
            fechaDesde,
            fechaHasta
        });

        // Convertir modelos a JSON
        const items = resultado.items.map(item => item.toJSON());

        return {
            items,
            total: resultado.total,
            page: resultado.page,
            limit: resultado.limit,
            totalPages: Math.ceil(resultado.total / resultado.limit)
        };
    }

    /**
     * Obtiene estadísticas generales del historial
     * @returns {Promise<Object>}
     */
    async obtenerEstadisticas() {
        const estadisticas = await this.#historialCierreRepository.getEstadisticas();
        const ultimoCierre = await this.#historialCierreRepository.findUltimoCierre();

        return {
            ...estadisticas,
            ultimoCierre: ultimoCierre ? ultimoCierre.toJSON() : null
        };
    }

    /**
     * Busca cierre por fecha específica
     * @param {string} fecha - Formato 'YYYY-MM-DD'
     * @returns {Promise<Object|null>}
     */
    async obtenerPorFecha(fecha) {
        const cierre = await this.#historialCierreRepository.findByFecha(fecha);
        return cierre ? cierre.toJSON() : null;
    }

    /**
     * Obtiene el listado de usuarios que ingresaron en una fecha específica
     * @param {string} fecha - Formato 'YYYY-MM-DD'
     * @returns {Promise<Array>}
     */
    async obtenerUsuariosPorFecha(fecha) {
        if (!this.#accesoRepository) {
            throw new Error('AccesoRepository no inyectado en HistorialService');
        }

        const usuarios = await this.#accesoRepository.findIngresosPorFecha(fecha);
        
        return usuarios.map(u => ({
            accesoId: u.acceso_id,
            usuarioId: u.usuario_id,
            nombre: u.nombre,
            rut: u.rut,
            email: u.email,
            fechaHora: u.fecha_hora
        }));
    }
}

module.exports = HistorialService;

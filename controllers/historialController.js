const BaseController = require('./BaseController');

class HistorialController extends BaseController {
    #historialService;

    /**
     * @param {HistorialService} historialService
     */
    constructor(historialService) {
        super();
        this.#historialService = historialService;
    }

    /**
     * GET /api/historial/cierres
     * Obtiene historial paginado de cierres de jornada
     */
    async obtenerHistorial(req, res) {
        try {
            const { page, limit, fechaDesde, fechaHasta } = req.query || {};
            
            const resultado = await this.#historialService.obtenerHistorial({
                page,
                limit,
                fechaDesde,
                fechaHasta
            });
            
            return this.sendSuccess(res, resultado, 200);
        } catch (error) {
            return this.handleError(res, error, 'obtención de historial de cierres');
        }
    }

    /**
     * GET /api/historial/estadisticas
     * Obtiene estadísticas generales del historial
     */
    async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = await this.#historialService.obtenerEstadisticas();
            return this.sendSuccess(res, estadisticas, 200);
        } catch (error) {
            return this.handleError(res, error, 'obtención de estadísticas');
        }
    }

    /**
     * GET /api/historial/usuarios/:fecha
     * Obtiene el listado de usuarios que ingresaron en una fecha específica
     */
    async obtenerUsuariosPorFecha(req, res) {
        try {
            let { fecha } = req.params || {};
            
            if (!fecha) {
                return this.sendError(res, 'Fecha requerida', 400);
            }

            // Limpiar fecha (remover espacios, saltos de línea, tabulaciones)
            fecha = String(fecha).trim().replace(/[\r\n\t]/g, '');
            
            // Validar formato YYYY-MM-DD
            const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!fechaRegex.test(fecha)) {
                return this.sendError(res, 'Formato de fecha inválido. Use YYYY-MM-DD', 400);
            }

            const usuarios = await this.#historialService.obtenerUsuariosPorFecha(fecha);
            return this.sendSuccess(res, { fecha, usuarios, total: usuarios.length }, 200);
        } catch (error) {
            return this.handleError(res, error, 'obtención de usuarios por fecha');
        }
    }
}

module.exports = HistorialController;

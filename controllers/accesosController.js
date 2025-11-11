const BaseController = require('./BaseController');

class AccesosController extends BaseController {
    #accesosService;

    /**
     * @param {AccesosService} accesosService
     */
    constructor(accesosService) {
        super();
        this.#accesosService = accesosService;
    }

    /**
     * POST /internal/accesos/cierre-jornada
     * Cierra la jornada registrando salidas masivas
     * (Llamado por tarea programada del sistema - autenticación no requerida)
     */
    async cerrarJornada(req, res) {
        try {
            const resultado = await this.#accesosService.cerrarJornada();
            return this.sendSuccess(res, resultado, 200);
        } catch (error) {
            return this.handleError(res, error, 'cierre de jornada');
        }
    }
}

module.exports = AccesosController;

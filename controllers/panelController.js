const BaseController = require('./BaseController');

class PanelController extends BaseController {
    #panelService;

    /**
     * @param {PanelService} panelService
     */
    constructor(panelService) {
        super();
        this.#panelService = panelService;
    }

    /**
     * GET /api/panel/ingresos
     * Obtiene el listado de usuarios actualmente en el local
     * (Trabajador/Admin ya autenticado - no se re-valida token)
     */
    async obtenerIngresos(req, res) {
        try {
            const resultado = await this.#panelService.obtenerPanel();
            return this.sendSuccess(res, resultado, 200);
        } catch (error) {
            return this.handleError(res, error, 'obtención de panel de ingresos');
        }
    }
}

module.exports = PanelController;

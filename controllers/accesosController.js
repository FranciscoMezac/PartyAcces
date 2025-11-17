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
     * POST /api/accesos/guardar-panel
     * Guarda el panel registrando salidas masivas para todos los usuarios actualmente en el local
     * (Llamado manualmente por el administrador)
     */
    async cerrarJornada(req, res) {
        try {
            // Extraer token del header (admin ya autenticado)
            const authHeader = req.headers['authorization'];
            if (!authHeader) {
                return this.sendError(res, 'No autorizado', 401);
            }

            const token = authHeader.startsWith('Bearer ')
                ? authHeader.substring(7)
                : authHeader;

            if (!token) {
                return this.sendError(res, 'Token requerido', 401);
            }

            const resultado = await this.#accesosService.cerrarJornada();
            console.log('📤 Enviando al frontend:', JSON.stringify(resultado, null, 2));
            return this.sendSuccess(res, resultado, 200);
        } catch (error) {
            return this.handleError(res, error, 'guardado de panel');
        }
    }
}

module.exports = AccesosController;

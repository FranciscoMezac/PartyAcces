const BaseController = require('./BaseController');

class AccesoController extends BaseController {
    #accesoService;

    /**
     * @param {AccesoService} accesoService
     */
    constructor(accesoService) {
        super();
        this.#accesoService = accesoService;
    }

    /**
     * POST /api/acceso/validar
     * Valida acceso mediante escaneo de QR (solo para trabajadores/admin autenticados)
     */
    async validarAcceso(req, res) {
        try {
            // Extraer token del header (trabajador ya autenticado)
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

            // Obtener código QR del body
            const { codigoQr } = req.body;
            if (!codigoQr) {
                return this.sendError(res, 'Código QR requerido', 400);
            }

            const result = await this.#accesoService.validarAccesoPorCodigo(codigoQr);
            return this.sendSuccess(res, { data: result }, 201);
        } catch (error) {
            if (error.code === 'INVALID_QR') return this.sendError(res, error.message, 400);
            if (error.code === 'NOT_FOUND') return this.sendError(res, error.message, 404);
            if (error.code === 'DUPLICATE') return this.sendError(res, error.message, 409);
            return this.handleError(res, error, 'validación de acceso');
        }
    }
}

module.exports = AccesoController;

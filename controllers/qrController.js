const BaseController = require('./BaseController');

class QrController extends BaseController {
    #qrService;

    /**
     * @param {QrService} qrService
     */
    constructor(qrService) {
        super();
        this.#qrService = qrService;
    }

    /**
     * POST /api/qr/generar
     * Genera QR para el usuario autenticado
     */
    async generarQR(req, res) {
        try {
            // Extraer token del header (usuario ya autenticado)
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

            const result = await this.#qrService.generarDesdeToken(token);
            const status = result.created ? 201 : 200;
            return this.sendSuccess(res, { qr: result.qr }, status);
        } catch (error) {
            return this.handleError(res, error, 'generación de QR');
        }
    }
}

module.exports = QrController;


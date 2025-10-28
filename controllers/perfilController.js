const BaseController = require('./BaseController');

/**
 * Controlador para gestión de perfiles de usuario
 * Patrón: Controller con Dependency Injection
 */
class PerfilController extends BaseController {
    #perfilService;

    /**
     * Constructor con inyección de dependencias
     * @param {PerfilService} perfilService 
     */
    constructor(perfilService) {
        super();
        this.#perfilService = perfilService;
    }

    /**
     * Obtiene el perfil del usuario autenticado
     * GET /api/perfil
     * @param {Object} req 
     * @param {Object} res 
     */
    async obtenerPerfil(req, res) {
        try {
            // Extraer token del header Authorization: Bearer <token>
            const authHeader = req.headers['authorization'];
            
            if (!authHeader) {
                return this.sendError(res, 'No autorizado', 401);
            }

            // Extraer token (formato: "Bearer <token>")
            const token = authHeader.startsWith('Bearer ') 
                ? authHeader.substring(7) 
                : authHeader;

            if (!token) {
                return this.sendError(res, 'Token requerido', 401);
            }

            console.log('Obteniendo perfil con token:', token.substring(0, 10) + '...');

            // Obtener perfil desde el servicio
            const perfil = await this.#perfilService.obtenerPerfil(token);

            return this.sendSuccess(res, { data: perfil }, 200);

        } catch (error) {
            if (error.message.includes('Token inválido') || error.message.includes('expirado')) {
                return this.sendError(res, error.message, 401);
            }
            if (error.message.includes('no encontrado')) {
                return this.sendError(res, error.message, 404);
            }
            return this.handleError(res, error, 'obtener perfil');
        }
    }

    /**
     * Actualiza el perfil del usuario autenticado
     * PATCH /api/perfil
     * @param {Object} req 
     * @param {Object} res 
     */
    async actualizarPerfil(req, res) {
        try {
            // Extraer token del header Authorization: Bearer <token>
            const authHeader = req.headers['authorization'];
            
            if (!authHeader) {
                return this.sendError(res, 'No autorizado', 401);
            }

            // Extraer token
            const token = authHeader.startsWith('Bearer ') 
                ? authHeader.substring(7) 
                : authHeader;

            if (!token) {
                return this.sendError(res, 'Token requerido', 401);
            }

            console.log('Actualizando perfil...');

            // Validar que haya datos para actualizar
            const { nombre, email, telefono, password } = req.body;

            if (!nombre && !email && !telefono && !password) {
                return this.sendError(res, 'Debe proporcionar al menos un campo para actualizar', 400);
            }

            // Validar campos
            const validacion = this.#perfilService.validarCamposPerfil(req.body);
            if (!validacion.isValid) {
                return this.sendError(res, validacion.errors.join(', '), 400);
            }

            // Actualizar perfil
            const perfilActualizado = await this.#perfilService.actualizarPerfil(token, req.body);

            return this.sendSuccess(res, { data: perfilActualizado }, 200);

        } catch (error) {
            if (error.message.includes('Token inválido') || error.message.includes('expirado')) {
                return this.sendError(res, error.message, 401);
            }
            if (error.message.includes('ya está en uso')) {
                return this.sendError(res, error.message, 409);
            }
            if (error.message.includes('no encontrado')) {
                return this.sendError(res, error.message, 404);
            }
            return this.handleError(res, error, 'actualizar perfil');
        }
    }
}

module.exports = PerfilController;

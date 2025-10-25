const BaseController = require('./BaseController');

class AuthController extends BaseController {
    #authService;

    /**
     * Constructor con inyección de dependencias
     * @param {AuthService} authService 
     */
    constructor(authService) {
        super();
        this.#authService = authService;
    }

    /**
     * Registra un nuevo usuario
     * @param {Object} req 
     * @param {Object} res 
     */
    async register(req, res) {
        try {
            const validation = this.validateRequiredFields(req.body, ['nombre', 'rut', 'email', 'contrasenia']);
            if (!validation.isValid) {
                return this.sendError(res, validation.message, 400);
            }

            const usuarioId = await this.#authService.registrarUsuario(req.body);

            return this.sendSuccess(res, {
                message: 'Usuario registrado exitosamente',
                usuarioId: usuarioId
            }, 201);

        } catch (error) {
            if (error.message.includes('ya está registrado') || error.message.includes('ya existe')) {
                return this.sendError(res, error.message, 409);
            }
            return this.handleError(res, error, 'registro de usuario');
        }
    }

    /**
     * Autentica un usuario
     * @param {Object} req 
     * @param {Object} res 
     */
    async login(req, res) {
        try {
            const validation = this.validateRequiredFields(req.body, ['email', 'password']);
            if (!validation.isValid) {
                return this.sendError(res, validation.message, 400);
            }

            const resultado = await this.#authService.login(req.body.email, req.body.password);

            return this.sendSuccess(res, {
                message: 'Login exitoso',
                token: resultado.token,
                expiraEn: resultado.expiraEn,
                user: resultado.user
            }, 200);

        } catch (error) {
            if (error.message.includes('Credenciales inválidas')) {
                return this.sendError(res, error.message, 401);
            }
            if (error.message.includes('bloqueado')) {
                return this.sendError(res, 'Usuario bloqueado', 403);
            }
            return this.handleError(res, error, 'autenticación');
        }
    }

    /**
     * Verifica disponibilidad de email
     * @param {Object} req 
     * @param {Object} res 
     */
    async checkEmail(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return this.sendError(res, 'Email es requerido', 400);
            }

            const isAvailable = await this.#authService.verificarEmailDisponible(email);

            return this.sendSuccess(res, {
                available: isAvailable
            });

        } catch (error) {
            return this.handleError(res, error, 'verificación de email');
        }
    }

    /**
     * Cierra sesión de un usuario
     * @param {Object} req 
     * @param {Object} res 
     */
    async logout(req, res) {
        try {
            // Extraer token del header Authorization: Bearer <token>
            const authHeader = req.headers['authorization'];
            
            if (!authHeader) {
                return this.sendError(res, 'Token requerido', 401);
            }

            // Extraer token (formato: "Bearer <token>")
            const token = authHeader.startsWith('Bearer ') 
                ? authHeader.substring(7) 
                : authHeader;

            if (!token) {
                return this.sendError(res, 'Token requerido', 401);
            }

            console.log('🔑 Intentando cerrar sesión con token:', token.substring(0, 10) + '...');

            // Llamar al servicio para cerrar sesión
            const resultado = await this.#authService.cerrarSesion(token);

            return this.sendSuccess(res, {
                message: resultado.message
            }, 200);

        } catch (error) {
            if (error.message.includes('Token inválido') || error.message.includes('expirado')) {
                return this.sendError(res, error.message, 401);
            }
            return this.handleError(res, error, 'cerrar sesión');
        }
    }

    /**
     * TEMPORAL: Resetea la contraseña de un usuario
     * @param {Object} req 
     * @param {Object} res 
     */
    async resetPassword(req, res) {
        try {
            const validation = this.validateRequiredFields(req.body, ['rut', 'nuevaContrasena']);
            if (!validation.isValid) {
                return this.sendError(res, validation.message, 400);
            }

            await this.#authService.resetearContrasena(req.body.rut, req.body.nuevaContrasena);

            return this.sendSuccess(res, {
                message: 'Contraseña actualizada correctamente'
            }, 200);

        } catch (error) {
            if (error.message.includes('no encontrado')) {
                return this.sendError(res, error.message, 404);
            }
            return this.handleError(res, error, 'reseteo de contraseña');
        }
    }
}

module.exports = AuthController;

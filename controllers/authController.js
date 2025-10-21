const BaseController = require('./BaseController');
const Usuario = require('../models/Usuario');
const db = require('../config/database');
const bcrypt = require('bcryptjs');

class AuthController extends BaseController {
    
    /**

     * @param {Object} req 
     * @param {Object} res 
     */
    async register(req, res) {
        try {
            const { nombre, rut, email, contrasenia, rol, estado } = req.body;

            const validation = this.validateRequiredFields(req.body, ['nombre', 'rut', 'email', 'contrasenia']);
            if (!validation.isValid) {
                return this.sendError(res, validation.message, 400);
            }

            if (contrasenia.length < 8) {
                return this.sendError(res, 'La contraseña debe tener al menos 8 caracteres', 400);
            }

            const existingUser = await Usuario.findByEmail(email);
            if (existingUser) {
                return this.sendError(res, 'El email ya está en uso', 409);
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(contrasenia, salt);

            const usuario = new Usuario({
                nombre,
                rut,
                email,
                contrasenia: hashedPassword,
                rol: rol || 'USER',
                estado: estado || 'ACTIVO'
            });

            const usuarioValidation = usuario.validate();
            if (!usuarioValidation.isValid) {
                return this.sendError(res, usuarioValidation.errors.join(', '), 400);
            }

            const usuarioId = await db.withTransaction(async (client) => {
                const id = await Usuario.insert(client, usuario);
                
                await client.query(
                    'INSERT INTO cuentas (rut, saldo) VALUES ($1, $2)',
                    [rut, 0]
                );
                
                return id;
            });

            return this.sendSuccess(res, {
                message: 'Usuario registrado exitosamente',
                usuarioId: usuarioId
            }, 201);

        } catch (error) {
            return this.handleError(res, error, 'registro de usuario');
        }
    }

    /**

     * @param {Object} req 
     * @param {Object} res 
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            const validation = this.validateRequiredFields(req.body, ['email', 'password']);
            if (!validation.isValid) {
                return this.sendError(res, validation.message, 400);
            }

            const usuario = await Usuario.findByEmail(email);

            if (!usuario) {
                return this.sendError(res, 'Credenciales inválidas', 401);
            }

            const isPasswordValid = await bcrypt.compare(password, usuario.contrasenia);
            if (!isPasswordValid) {
                return this.sendError(res, 'Credenciales inválidas', 401);
            }

            if (!usuario.isActive()) {
                return this.sendError(res, 'Usuario inactivo. Contacte al administrador', 403);
            }

            return this.sendSuccess(res, {
                message: 'Login exitoso',
                user: usuario.toJSON()
            });

        } catch (error) {
            return this.handleError(res, error, 'autenticación');
        }
    }

    /**

     * @param {Object} req 
     * @param {Object} res 
     */
    async checkEmail(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return this.sendError(res, 'Email es requerido', 400);
            }

            const usuario = await Usuario.findByEmail(email);
            const isAvailable = usuario === null;

            return this.sendSuccess(res, {
                available: isAvailable
            });

        } catch (error) {
            return this.handleError(res, error, 'verificación de email');
        }
    }
}

// Exportar instancia única (Singleton)
module.exports = new AuthController();

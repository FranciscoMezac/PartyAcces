const BaseController = require('./BaseController');
const Usuario = require('../models/Usuario');


class UserController extends BaseController {

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

            if (usuario.contrasenia !== password) {
                return this.sendError(res, 'Credenciales inválidas', 401);
            }

            if (!usuario.isActive()) {
                return this.sendError(res, 'Usuario inactivo', 403);
            }

            return this.sendSuccess(res, {
                message: 'Login exitoso',
                user: usuario.toJSON()
            });

        } catch (error) {
            return this.handleError(res, error, 'login');
        }
    }

    /**
     * @param {Object} req 
     * @param {Object} res 
     */
    async getAllUsers(req, res) {
        try {
            const usuarios = await Usuario.findAll();

            // Convertir a JSON (sin contraseñas)
            const usuariosJSON = usuarios.map(u => u.toJSON());

            return this.sendSuccess(res, {
                data: usuariosJSON
            });

        } catch (error) {
            return this.handleError(res, error, 'obtención de usuarios');
        }
    }

    /**

     * @param {Object} req 
     * @param {Object} res 
     */
    async getUserById(req, res) {
        try {
            const { id } = req.params || req.body;

            if (!id) {
                return this.sendError(res, 'ID de usuario requerido', 400);
            }

            const usuario = await Usuario.findById(id);

            if (!usuario) {
                return this.sendError(res, 'Usuario no encontrado', 404);
            }

            return this.sendSuccess(res, {
                data: usuario.toJSON()
            });

        } catch (error) {
            return this.handleError(res, error, 'obtención de usuario');
        }
    }

    /**

     * @param {Object} req 
     * @param {Object} res 
     */
    async createUser(req, res) {
        try {
            const { name, email, password } = req.body;

            const validation = this.validateRequiredFields(req.body, ['name', 'email', 'password']);
            if (!validation.isValid) {
                return this.sendError(res, validation.message, 400);
            }

            const existingUser = await Usuario.findByEmail(email);
            if (existingUser) {
                return this.sendError(res, 'El email ya está en uso', 400);
            }

            const nuevoUsuario = new Usuario({
                nombre: name,
                email: email,
                contrasenia: password
            });

            const validacion = nuevoUsuario.validate();
            if (!validacion.isValid) {
                return this.sendError(res, validacion.errors.join(', '), 400);
            }

            const usuarioCreado = await Usuario.create(nuevoUsuario);

            return this.sendSuccess(res, {
                message: 'Usuario creado exitosamente',
                user: usuarioCreado.toJSON()
            }, 201);

        } catch (error) {
            return this.handleError(res, error, 'creación de usuario');
        }
    }

    /**
     * @param {Object} req 
     * @param {Object} res 
     */
    async updateUser(req, res) {
        try {
            const { id } = req.params || req.body;
            const { nombre, email, rol, estado } = req.body;

            if (!id) {
                return this.sendError(res, 'ID de usuario requerido', 400);
            }

            const usuarioExistente = await Usuario.findById(id);
            if (!usuarioExistente) {
                return this.sendError(res, 'Usuario no encontrado', 404);
            }

            const usuarioActualizado = await Usuario.update(id, {
                nombre: nombre || usuarioExistente.nombre,
                email: email || usuarioExistente.email,
                rol: rol || usuarioExistente.rol,
                estado: estado || usuarioExistente.estado
            });

            return this.sendSuccess(res, {
                message: 'Usuario actualizado exitosamente',
                user: usuarioActualizado.toJSON()
            });

        } catch (error) {
            return this.handleError(res, error, 'actualización de usuario');
        }
    }

    /**
     * @param {Object} req 
     * @param {Object} res 
     */
    async deleteUser(req, res) {
        try {
            const { id } = req.params || req.body;

            if (!id) {
                return this.sendError(res, 'ID de usuario requerido', 400);
            }

            const deleted = await Usuario.delete(id);

            if (!deleted) {
                return this.sendError(res, 'Usuario no encontrado', 404);
            }

            return this.sendSuccess(res, {
                message: 'Usuario eliminado exitosamente'
            });

        } catch (error) {
            return this.handleError(res, error, 'eliminación de usuario');
        }
    }
}

// Exportar instancia única (Singleton)
module.exports = new UserController();

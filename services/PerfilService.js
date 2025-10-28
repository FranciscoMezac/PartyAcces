/**
 * Patron de diseño: Service Layer Pattern
 * Propósito: Encapsular la lógica de negocio de gestión de perfiles
 */

const bcrypt = require('bcryptjs');

class PerfilService {
    #usuarioRepository;
    #sessionRepository;
    #cuentaPuntosRepository;

    /**
     * Constructor con inyección de dependencias
     * @param {UsuarioRepository} usuarioRepository 
     * @param {SessionRepository} sessionRepository 
     * @param {CuentaPuntosRepository} cuentaPuntosRepository 
     */
    constructor(usuarioRepository, sessionRepository, cuentaPuntosRepository) {
        this.#usuarioRepository = usuarioRepository;
        this.#sessionRepository = sessionRepository;
        this.#cuentaPuntosRepository = cuentaPuntosRepository;
    }

    /**
     * Obtiene el perfil del usuario autenticado
     * @param {string} token - Token de sesión
     * @returns {Promise<Object>} - Datos del perfil
     */
    async obtenerPerfil(token) {
        if (!token) {
            throw new Error('Token requerido');
        }

        console.log('🔍 Buscando sesión para obtener perfil...');

        // Buscar sesión por token
        const session = await this.#sessionRepository.findByToken(token);
        
        if (!session) {
            throw new Error('Token inválido o expirado');
        }

        // Verificar que la sesión esté activa
        if (!session.estaActiva()) {
            throw new Error('Token inválido o expirado');
        }

        console.log('📋 Sesión válida - Usuario ID:', session.usuarioId);

        // Obtener usuario completo (SELECT * FROM usuario WHERE id=$1)
        const usuario = await this.#usuarioRepository.findById(session.usuarioId);
        
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        console.log('👤 Usuario encontrado:', usuario.email);

        // Obtener cuenta de puntos del usuario
        let saldo = 0;
        try {
            const cuenta = await this.#cuentaPuntosRepository.findByRut(usuario.rut);
            if (cuenta) {
                saldo = cuenta.saldo;
            }
        } catch (error) {
            console.warn('⚠️ No se pudo obtener saldo de puntos:', error.message);
        }

        // Retornar datos del perfil (sin contraseña) incluyendo saldo
        return {
            ...usuario.toJSON(),
            saldo: saldo
        };
    }

    /**
     * Actualiza el perfil del usuario autenticado
     * @param {string} token - Token de sesión
     * @param {Object} datosActualizar - Datos a actualizar (nombre, email, telefono, password opcional)
     * @returns {Promise<Object>} - Perfil actualizado
     */
    async actualizarPerfil(token, datosActualizar) {
        if (!token) {
            throw new Error('Token requerido');
        }

        console.log('🔍 Buscando sesión para actualizar perfil...');

        // Buscar sesión por token
        const session = await this.#sessionRepository.findByToken(token);
        
        if (!session) {
            throw new Error('Token inválido o expirado');
        }

        // Verificar que la sesión esté activa
        if (!session.estaActiva()) {
            throw new Error('Token inválido o expirado');
        }

        // Obtener usuario
        const usuario = await this.#usuarioRepository.findById(session.usuarioId);
        
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        console.log('👤 Actualizando perfil de:', usuario.email);

        // Validar datos de actualización
        const { nombre, email, telefono, password } = datosActualizar;

        // Si se cambia el email, verificar que no exista en otro usuario
        if (email && email !== usuario.email) {
            const emailExiste = await this.#usuarioRepository.findByEmail(email);
            
            // Verificar que el email no pertenezca a otro usuario
            if (emailExiste && emailExiste.usuarioId !== usuario.usuarioId) {
                throw new Error('El email ya está siendo utilizado por otro usuario');
            }
        }

        // Preparar datos para actualización
        const datosParaActualizar = {
            nombre: nombre || usuario.nombre,
            email: email || usuario.email,
            rol: usuario.rol, // No cambiar rol
            estado: usuario.estado // No cambiar estado
        };

        // Si hay password, validar longitud y hashear
        if (password) {
            if (password.length < 8) {
                throw new Error('La contraseña debe tener al menos 8 caracteres');
            }
            
            // Hashear nueva contraseña con bcryptjs
            const bcrypt = require('bcryptjs');
            const hasheada = await bcrypt.hash(password, 10);
            
            // Incluir contraseña hasheada en datos de actualización
            datosParaActualizar.contrasenia = hasheada;
        }

        // UPDATE usuario SET ... WHERE id=$1
        const usuarioActualizado = await this.#usuarioRepository.update(
            usuario.usuarioId, 
            datosParaActualizar
        );

        if (!usuarioActualizado) {
            throw new Error('Error al actualizar perfil');
        }

        console.log('✅ Perfil actualizado exitosamente');

        // Obtener saldo actualizado
        let saldo = 0;
        try {
            const cuenta = await this.#cuentaPuntosRepository.findByRut(usuarioActualizado.rut);
            if (cuenta) {
                saldo = cuenta.saldo;
            }
        } catch (error) {
            console.warn('⚠️ No se pudo obtener saldo de puntos:', error.message);
        }

        return {
            ...usuarioActualizado.toJSON(),
            saldo: saldo
        };
    }

    /**
     * Valida campos del perfil
     * @param {Object} datos 
     * @returns {Object} - {isValid, errors}
     */
    validarCamposPerfil(datos) {
        const errors = [];

        if (datos.nombre && datos.nombre.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }

        if (datos.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(datos.email)) {
                errors.push('Email inválido');
            }
        }

        if (datos.password && datos.password.length < 8) {
            errors.push('La contraseña debe tener al menos 8 caracteres');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = PerfilService;

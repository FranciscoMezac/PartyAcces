/**
 * Patron de diseño: Service Layer Pattern
 * Propósito: Encapsular la lógica de negocio de gestión de perfiles
 */

const Usuario = require('../models/Usuario');
const Session = require('../models/Session');
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
     * COORDINACIÓN: El Servicio usa métodos del Modelo, NO del Repositorio
     * @param {string} token - Token de sesión
     * @returns {Promise<Object>} - Datos del perfil
     */
    async obtenerPerfil(token) {
        if (!token) {
            throw new Error('Token requerido');
        }

        console.log('🔍 Buscando sesión para obtener perfil...');

        // Crear instancia de Session con repositorio inyectado
        const session = new Session({ token }, this.#sessionRepository);

        // El Modelo se carga a sí mismo desde BD
        const encontrada = await session.cargarPorToken();
        
        if (!encontrada) {
            throw new Error('Token inválido o expirado');
        }

        // Verificar que la sesión esté activa
        if (!session.estaActiva()) {
            throw new Error('Token inválido o expirado');
        }

        console.log('📋 Sesión válida - Usuario ID:', session.usuarioId);

        // Crear instancia de Usuario con repositorio inyectado
        const usuario = new Usuario({ 
            usuarioId: session.usuarioId 
        }, this.#usuarioRepository);

        // El Modelo se carga a sí mismo desde BD
        const usuarioEncontrado = await usuario.cargarPorId();
        
        if (!usuarioEncontrado) {
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
     * COORDINACIÓN: El Servicio usa métodos del Modelo, NO del Repositorio
     * @param {string} token - Token de sesión
     * @param {Object} datosActualizar - Datos a actualizar (nombre, email, telefono, password opcional)
     * @returns {Promise<Object>} - Perfil actualizado
     */
    async actualizarPerfil(token, datosActualizar) {
        if (!token) {
            throw new Error('Token requerido');
        }

        console.log('🔍 Buscando sesión para actualizar perfil...');

        // Crear instancia de Session con repositorio inyectado
        const session = new Session({ token }, this.#sessionRepository);

        // El Modelo se carga a sí mismo desde BD
        const encontrada = await session.cargarPorToken();
        
        if (!encontrada) {
            throw new Error('Token inválido o expirado');
        }

        // Verificar que la sesión esté activa
        if (!session.estaActiva()) {
            throw new Error('Token inválido o expirado');
        }

        // Crear instancia de Usuario con repositorio inyectado
        const usuario = new Usuario({ 
            usuarioId: session.usuarioId 
        }, this.#usuarioRepository);

        // El Modelo se carga a sí mismo desde BD
        const encontrado = await usuario.cargarPorId();
        
        if (!encontrado) {
            throw new Error('Usuario no encontrado');
        }

        console.log('👤 Actualizando perfil de:', usuario.email);

        // Validar datos de actualización
        const { nombre, email, password } = datosActualizar;

        // Si se cambia el email, verificar que no exista en otro usuario
        if (email && email !== usuario.email) {
            const emailExiste = await this.#usuarioRepository.findByEmail(email);
            
            // Verificar que el email no pertenezca a otro usuario
            if (emailExiste && emailExiste.usuarioId !== usuario.usuarioId) {
                throw new Error('El email ya está siendo utilizado por otro usuario');
            }
        }

        // Validar longitud de contraseña si se proporciona
        if (password && password.length < 8) {
            throw new Error('La contraseña debe tener al menos 8 caracteres');
        }

        // El Modelo se actualiza a sí mismo
        await usuario.actualizarPerfil({ nombre, email, password });

        console.log('✅ Perfil actualizado exitosamente');

        // Obtener saldo actualizado
        let saldo = 0;
        try {
            const cuenta = await this.#cuentaPuntosRepository.findByRut(usuario.rut);
            if (cuenta) {
                saldo = cuenta.saldo;
            }
        } catch (error) {
            console.warn('⚠️ No se pudo obtener saldo de puntos:', error.message);
        }

        return {
            ...usuario.toJSON(),
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

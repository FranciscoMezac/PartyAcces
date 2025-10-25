/**
 * Patron de diseño: Service Layer Pattern
 * Propósito: Encapsular la lógica de negocio de autenticación
 * Problema que resuelve: Coordina entre múltiples repositorios, maneja transacciones
 * y validaciones complejas, separando la lógica de negocio del controlador
 */

const Usuario = require('../models/Usuario');
const db = require('../config/database');

class AuthService {
    #usuarioRepository;
    #cuentaPuntosRepository;
    #sessionRepository;

    /**
     * Constructor con inyección de dependencias
     * Patron: Dependency Injection
     * @param {UsuarioRepository} usuarioRepository 
     * @param {CuentaPuntosRepository} cuentaPuntosRepository 
     * @param {SessionRepository} sessionRepository 
     */
    constructor(usuarioRepository, cuentaPuntosRepository, sessionRepository) {
        this.#usuarioRepository = usuarioRepository;
        this.#cuentaPuntosRepository = cuentaPuntosRepository;
        this.#sessionRepository = sessionRepository;
    }

    /**
     * Registra un nuevo usuario con su cuenta de puntos
     * Lógica de negocio: Valida datos, verifica duplicados, hashea contraseña,
     * crea usuario y cuenta en una transacción
     * @param {Object} datos - Datos del usuario
     * @returns {Promise<number>} - ID del usuario creado
     */
    async registrarUsuario(datos) {
        const { nombre, rut, email, contrasenia, rol, estado } = datos;

        // Validación de datos requeridos
        if (!nombre || !rut || !email || !contrasenia) {
            throw new Error('Todos los campos son obligatorios');
        }

        // Validación de longitud de contraseña
        if (contrasenia.length < 8) {
            throw new Error('La contraseña debe tener al menos 8 caracteres');
        }

        // Verificar si el email ya existe
        const emailExiste = await this.#usuarioRepository.findByEmail(email);
        if (emailExiste) {
            throw new Error('El email ya está registrado');
        }

        // Verificar si el RUT ya existe
        const rutExiste = await this.#usuarioRepository.findByRut(rut);
        if (rutExiste) {
            throw new Error('El RUT ya está registrado');
        }

        // Crear instancia de Usuario
        const usuario = new Usuario({
            nombre,
            rut,
            email,
            contrasenia,
            rol: rol || 'USER',
            estado: estado || 'ACTIVO'
        });

        // Validar el usuario
        const validacion = usuario.validate();
        if (!validacion.isValid) {
            throw new Error(validacion.errors.join(', '));
        }

        // Hashear la contraseña
        await usuario.hashPassword();

        // Ejecutar en transacción
        return await db.withTransaction(async (client) => {
            // Insertar usuario
            const usuarioId = await this.#usuarioRepository.insert(client, usuario);

            // Crear cuenta de puntos
            await this.#cuentaPuntosRepository.crearCuenta(client, rut, 0);

            return usuarioId;
        });
    }

    /**
     * Autentica un usuario y crea una sesión
     * Lógica de negocio: Verifica credenciales, valida estado activo, crea sesión
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña del usuario
     * @returns {Promise<Object>} - Usuario autenticado con token de sesión
     */
    async login(email, password) {
        // Validación de datos requeridos
        if (!email || !password) {
            throw new Error('Email y contraseña son obligatorios');
        }

        // Normalizar email a minúsculas para comparación
        const emailNormalizado = email.toLowerCase().trim();

        console.log('🔍 Buscando usuario con Email:', emailNormalizado);

        // Buscar usuario por Email (SELECT * FROM usuario WHERE email = $1)
        const usuario = await this.#usuarioRepository.findByEmail(emailNormalizado);

        console.log('👤 Usuario encontrado:', usuario ? 'SÍ' : 'NO');
        
        if (!usuario) {
            throw new Error('Credenciales inválidas');
        }
        
        console.log('📧 Email BD:', usuario.email);
        console.log('🔑 Contraseña hasheada:', usuario.contrasenia.substring(0, 20) + '...');
        console.log('📏 Longitud contraseña ingresada:', password.length);
        console.log('🔤 Primeros 2 caracteres:', password.substring(0, 2) + '...');

        // Verificar contraseña (comparePassword(usuario.hash_password))
        const esValida = await usuario.comparePassword(password);
        
        console.log('✅ Contraseña válida:', esValida);
        
        if (!esValida) {
            throw new Error('Credenciales inválidas');
        }

        // Verificar que el usuario esté activo
        if (!usuario.isActive()) {
            throw new Error('Usuario bloqueado');
        }

        // Crear sesión en transacción (BEGIN, new Session(rut, activatedUntil), INSERT INTO sessions)
        const session = await db.withTransaction(async (client) => {
            const nuevaSesion = await this.#sessionRepository.crearSesion(
                client,
                usuario.usuarioId,
                usuario.rut,
                8 // 8 horas de expiración
            );
            return nuevaSesion;
        });

        // Retornar usuario y token (token, expira_en)
        return {
            token: session.token,
            expiraEn: session.expiraEn,
            user: usuario.toJSON()
        };
    }

    /**
     * Verifica si un email está disponible
     * @param {string} email 
     * @returns {Promise<boolean>}
     */
    async verificarEmailDisponible(email) {
        const usuario = await this.#usuarioRepository.findByEmail(email);
        return usuario === null;
    }

    /**
     * Verifica si un RUT está disponible
     * @param {string} rut 
     * @returns {Promise<boolean>}
     */
    async verificarRutDisponible(rut) {
        const usuario = await this.#usuarioRepository.findByRut(rut);
        return usuario === null;
    }

    /**
     * Obtiene un usuario por ID (sin contraseña)
     * @param {number} id 
     * @returns {Promise<Object|null>}
     */
    async obtenerUsuarioPorId(id) {
        const usuario = await this.#usuarioRepository.findById(id);
        return usuario ? usuario.toJSON() : null;
    }

    /**
     * TEMPORAL: Resetea la contraseña de un usuario
     * @param {string} rut 
     * @param {string} nuevaContrasena 
     * @returns {Promise<boolean>}
     */
    async resetearContrasena(rut, nuevaContrasena) {
        if (!rut || !nuevaContrasena) {
            throw new Error('RUT y nueva contraseña son obligatorios');
        }

        if (nuevaContrasena.length < 8) {
            throw new Error('La contraseña debe tener al menos 8 caracteres');
        }

        const usuario = await this.#usuarioRepository.findByRut(rut);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        // Hashear nueva contraseña
        const bcrypt = require('bcryptjs');
        const hasheada = await bcrypt.hash(nuevaContrasena, 10);

        // Actualizar solo la contraseña en BD
        await this.#usuarioRepository.actualizarContrasenia(usuario.usuarioId, hasheada);

        console.log('✅ Contraseña reseteada para RUT:', rut);
        return true;
    }
}

module.exports = AuthService;

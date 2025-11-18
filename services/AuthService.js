/**
 * Patron de diseño: Service Layer Pattern
 * Propósito: Encapsular la lógica de negocio de autenticación
 * Problema que resuelve: Coordina entre múltiples repositorios, maneja transacciones
 * y validaciones complejas, separando la lógica de negocio del controlador
 */

const Usuario = require('../models/Usuario');
const CuentaPuntos = require('../models/CuentaPuntos');
const Session = require('../models/Session');
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
     * COORDINACIÓN: El Servicio usa métodos del Modelo, NO del Repositorio
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

        // Crear instancia de Usuario con Repositorio inyectado
        const usuario = new Usuario({
            nombre,
            rut,
            email,
            contrasenia,
            rol: rol || 'USER',
            estado: estado || 'ACTIVO'
        }, this.#usuarioRepository);

        // Servicio USA MÉTODOS DEL MODELO (no del repositorio)
        const emailExiste = await usuario.verificarExistenciaPorEmail();
        if (emailExiste) {
            throw new Error('El email ya está registrado');
        }

        const rutExiste = await usuario.verificarExistenciaPorRut();
        if (rutExiste) {
            throw new Error('El RUT ya está registrado');
        }

        // Ejecutar en transacción
        return await db.withTransaction(async (client) => {
            // El Modelo Usuario se guarda a sí mismo
            const usuarioId = await usuario.guardar(client);

            // Crear objeto CuentaPuntos con repositorio inyectado
            const cuentaPuntos = new CuentaPuntos({
                rut: rut,
                saldo: 0
            }, this.#cuentaPuntosRepository);

            // El Modelo CuentaPuntos se guarda a sí mismo
            await cuentaPuntos.guardar(client);

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

        // Crear objeto Usuario con repositorio inyectado
        const usuario = new Usuario({
            email: emailNormalizado
        }, this.#usuarioRepository);

        // El Usuario se carga a sí mismo desde BD
        const encontrado = await usuario.cargarPorEmail();

        console.log('👤 Usuario encontrado:', encontrado ? 'SÍ' : 'NO');
        
        if (!encontrado) {
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

        // Crear sesión en transacción usando Active Record
        const sessionData = await db.withTransaction(async (client) => {
            // Crear objeto Session con repositorio inyectado
            const session = new Session({
                usuarioId: usuario.usuarioId,
                rut: usuario.rut
            }, this.#sessionRepository);

            // El Modelo Session se guarda a sí mismo
            await session.guardar(client);

            return session;
        });

        // Retornar usuario y token
        return {
            token: sessionData.token,
            expiraEn: sessionData.expiraEn,
            user: usuario.toJSON()
        };
    }

    /**
     * Verifica si un email está disponible
     * @param {string} email 
     * @returns {Promise<boolean>}
     */
    async verificarEmailDisponible(email) {
        // Crear instancia temporal para verificar existencia
        const usuarioTemp = new Usuario({ email }, this.#usuarioRepository);
        const existe = await usuarioTemp.verificarExistenciaPorEmail();
        return !existe;
    }

    /**
     * Verifica si un RUT está disponible
     * @param {string} rut 
     * @returns {Promise<boolean>}
     */
    async verificarRutDisponible(rut) {
        // Crear instancia temporal para verificar existencia
        const usuarioTemp = new Usuario({ rut }, this.#usuarioRepository);
        const existe = await usuarioTemp.verificarExistenciaPorRut();
        return !existe;
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
     * Cierra la sesión de un usuario (logout)
     * @param {string} token - Token de sesión
     * @returns {Promise<Object>}
     */
    async cerrarSesion(token) {
        if (!token) {
            throw new Error('Token requerido');
        }

        console.log('🔍 Buscando sesión con token:', token.substring(0, 10) + '...');

        // Crear instancia de Session con token y repositorio inyectado
        const session = new Session({ token }, this.#sessionRepository);

        // El Modelo se carga a sí mismo desde BD
        const encontrada = await session.cargarPorToken();
        
        if (!encontrada) {
            throw new Error('Token inválido o expirado');
        }

        console.log('📋 Sesión encontrada - ID:', session.sessionId, 'Usuario ID:', session.usuarioId);

        // Verificar que la sesión esté activa
        if (!session.estaActiva()) {
            throw new Error('Token inválido o expirado');
        }

        // El Modelo se invalida a sí mismo en BD
        await session.invalidarEnBD();

        console.log('✅ Sesión cerrada exitosamente');

        return {
            message: 'Sesión cerrada',
            sessionId: session.sessionId
        };
    }

    /**
     * TEMPORAL: Resetea la contraseña de un usuario
     * COORDINACIÓN: El Servicio usa métodos del Modelo, NO del Repositorio
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

        // Crear instancia de Usuario con repositorio inyectado
        const usuario = new Usuario({ rut }, this.#usuarioRepository);

        // El Modelo se carga a sí mismo desde BD
        const encontrado = await usuario.cargarPorRut();
        
        if (!encontrado) {
            throw new Error('Usuario no encontrado');
        }

        // El Modelo resetea su propia contraseña
        await usuario.resetearContrasena(nuevaContrasena);

        console.log('✅ Contraseña reseteada para RUT:', rut);
        return true;
    }
}

module.exports = AuthService;

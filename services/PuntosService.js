/**
 * Patron de diseño: Service Layer Pattern
 * Propósito: Encapsular la lógica de negocio de gestión de puntos
 * Demuestra comunicación entre objetos: Usuario, CuentaPuntos
 */

const Usuario = require('../models/Usuario');
const CuentaPuntos = require('../models/CuentaPuntos');

class PuntosService {
    #usuarioRepository;
    #cuentaPuntosRepository;

    /**
     * Constructor con inyección de dependencias
     * @param {UsuarioRepository} usuarioRepository 
     * @param {CuentaPuntosRepository} cuentaPuntosRepository 
     */
    constructor(usuarioRepository, cuentaPuntosRepository) {
        this.#usuarioRepository = usuarioRepository;
        this.#cuentaPuntosRepository = cuentaPuntosRepository;
    }

    /**
     * Agrega puntos a un usuario (objetos comunicándose)
     * @param {string} rut - RUT del usuario
     * @param {number} cantidad - Cantidad de puntos
     * @returns {Promise<Object>} - Usuario y cuenta actualizados
     */
    async agregarPuntos(rut, cantidad) {
        // 1. Obtener el usuario (instancia de Usuario)
        const usuario = await this.#usuarioRepository.findByRut(rut);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        // 2. Verificar que el usuario esté activo (método de instancia)
        if (!usuario.isActive()) {
            throw new Error('No se pueden agregar puntos a un usuario inactivo');
        }

        // 3. Obtener la cuenta (instancia de CuentaPuntos)
        const cuenta = await this.#cuentaPuntosRepository.findByRut(rut);
        if (!cuenta) {
            throw new Error('Cuenta de puntos no encontrada');
        }

        // 4. Verificar que la cuenta pertenece al usuario (comunicación entre objetos)
        if (!cuenta.perteneceAUsuario(usuario)) {
            throw new Error('La cuenta no pertenece al usuario');
        }

        // 5. Agregar puntos (método de instancia de CuentaPuntos)
        cuenta.agregarPuntos(cantidad);

        // 6. Guardar cambios en la BD
        const cuentaActualizada = await this.#cuentaPuntosRepository.actualizar(cuenta);

        return {
            usuario: usuario.toJSON(),
            cuenta: cuentaActualizada.toJSON()
        };
    }

    /**
     * Canjea puntos de un usuario
     * @param {string} rut - RUT del usuario
     * @param {number} cantidad - Cantidad de puntos a canjear
     * @returns {Promise<Object>}
     */
    async canjearPuntos(rut, cantidad) {
        // Obtener usuario y verificar
        const usuario = await this.#usuarioRepository.findByRut(rut);
        if (!usuario || !usuario.isActive()) {
            throw new Error('Usuario no válido o inactivo');
        }

        // Obtener cuenta
        const cuenta = await this.#cuentaPuntosRepository.findByRut(rut);
        if (!cuenta) {
            throw new Error('Cuenta no encontrada');
        }

        // Verificar pertenencia (comunicación entre objetos)
        if (!cuenta.perteneceAUsuario(usuario)) {
            throw new Error('Cuenta no pertenece al usuario');
        }

        // Intentar canjear (método de instancia con lógica)
        const exito = cuenta.canjearPuntos(cantidad);
        if (!exito) {
            throw new Error('Saldo insuficiente para canjear');
        }

        // Guardar
        const cuentaActualizada = await this.#cuentaPuntosRepository.actualizar(cuenta);

        return {
            mensaje: 'Puntos canjeados exitosamente',
            usuario: usuario.toJSON(),
            cuenta: cuentaActualizada.toJSON()
        };
    }

    /**
     * Obtiene información completa de puntos de un usuario
     * @param {string} rut 
     * @returns {Promise<Object>}
     */
    async obtenerInformacionPuntos(rut) {
        const usuario = await this.#usuarioRepository.findByRut(rut);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        const cuenta = await this.#cuentaPuntosRepository.findByRut(rut);
        if (!cuenta) {
            throw new Error('Cuenta no encontrada');
        }

        // Usar métodos de instancia para obtener información
        const nivel = cuenta.calcularNivel();
        const siguienteNivel = cuenta.puntosParaSiguienteNivel();

        return {
            usuario: {
                nombre: usuario.nombre,
                rut: usuario.rut,
                email: usuario.email,
                estado: usuario.estado,
                rol: usuario.rol,
                esAdmin: usuario.isAdmin(),
                estaActivo: usuario.isActive()
            },
            puntos: {
                saldo: cuenta.saldo,
                nivel: nivel,
                siguienteNivel: siguienteNivel,
                puedeAccederOro: cuenta.puedeAccederANivel('ORO'),
                puedeAccederPlatino: cuenta.puedeAccederANivel('PLATINO')
            }
        };
    }

    /**
     * Transfiere puntos de un usuario a otro (comunicación entre múltiples objetos)
     * @param {string} rutOrigen - RUT del usuario que transfiere
     * @param {string} rutDestino - RUT del usuario que recibe
     * @param {number} cantidad - Cantidad de puntos
     * @returns {Promise<Object>}
     */
    async transferirPuntos(rutOrigen, rutDestino, cantidad) {
        // Obtener ambos usuarios (instancias de Usuario)
        const usuarioOrigen = await this.#usuarioRepository.findByRut(rutOrigen);
        const usuarioDestino = await this.#usuarioRepository.findByRut(rutDestino);

        if (!usuarioOrigen || !usuarioDestino) {
            throw new Error('Uno o ambos usuarios no existen');
        }

        // Verificar que ambos estén activos (métodos de instancia)
        if (!usuarioOrigen.isActive() || !usuarioDestino.isActive()) {
            throw new Error('Ambos usuarios deben estar activos');
        }

        // Obtener cuentas (instancias de CuentaPuntos)
        const cuentaOrigen = await this.#cuentaPuntosRepository.findByRut(rutOrigen);
        const cuentaDestino = await this.#cuentaPuntosRepository.findByRut(rutDestino);

        if (!cuentaOrigen || !cuentaDestino) {
            throw new Error('Una o ambas cuentas no existen');
        }

        // Verificar pertenencia (comunicación entre objetos)
        if (!cuentaOrigen.perteneceAUsuario(usuarioOrigen)) {
            throw new Error('Cuenta origen no pertenece al usuario');
        }
        if (!cuentaDestino.perteneceAUsuario(usuarioDestino)) {
            throw new Error('Cuenta destino no pertenece al usuario');
        }

        // Verificar saldo suficiente (método de instancia)
        if (!cuentaOrigen.tieneSuficientesPuntos(cantidad)) {
            throw new Error('Saldo insuficiente en cuenta origen');
        }

        // Realizar transferencia (métodos de instancia)
        cuentaOrigen.restarPuntos(cantidad);
        cuentaDestino.agregarPuntos(cantidad);

        // Guardar ambos cambios
        const cuentaOrigenActualizada = await this.#cuentaPuntosRepository.actualizar(cuentaOrigen);
        const cuentaDestinoActualizada = await this.#cuentaPuntosRepository.actualizar(cuentaDestino);

        return {
            mensaje: 'Transferencia exitosa',
            origen: {
                usuario: usuarioOrigen.toJSON(),
                cuenta: cuentaOrigenActualizada.toJSON()
            },
            destino: {
                usuario: usuarioDestino.toJSON(),
                cuenta: cuentaDestinoActualizada.toJSON()
            }
        };
    }

    /**
     * Verifica si un usuario puede administrar puntos de otro
     * Demuestra comunicación entre objetos Usuario
     * @param {string} rutAdmin - RUT del administrador
     * @param {string} rutUsuario - RUT del usuario a modificar
     * @returns {Promise<boolean>}
     */
    async puedeAdministrarPuntos(rutAdmin, rutUsuario) {
        const admin = await this.#usuarioRepository.findByRut(rutAdmin);
        const usuario = await this.#usuarioRepository.findByRut(rutUsuario);

        if (!admin || !usuario) {
            return false;
        }

        // Usar método de instancia que comunica objetos Usuario
        return admin.puedeModificar(usuario);
    }
}

module.exports = PuntosService;

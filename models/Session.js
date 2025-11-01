/**
 * Modelo de Dominio - Session
 * Patrón: Active Record / Rich Domain Model
 * Propósito: Representar una sesión de usuario ACTIVA que conoce su repositorio
 */
class Session {
    #sessionId;
    #usuarioId;
    #rut;
    #token;
    #expiraEn;
    #creadoEn;
    #activa;
    
    /**
     * @type {import('../repositories/SessionRepository')|null}
     */
    #sessionRepository; // El Modelo conoce su Repositorio (Active Record Pattern)

    /**
     * Constructor con inyección del repositorio
     * @param {Object} data - Datos de la sesión
     * @param {import('../repositories/SessionRepository')|null} sessionRepository - Repositorio inyectado (opcional)
     */
    constructor(data = {}, sessionRepository = null) {
        this.#sessionId = data.sessionId || data.session_id || null;
        this.#usuarioId = data.usuarioId || data.usuario_id || null;
        // Trim para eliminar espacios que agrega CHAR(256)
        this.#rut = (data.rut || '').trim();
        this.#token = (data.token || '').trim();
        this.#expiraEn = data.expiraEn || data.expira_en || null;
        this.#creadoEn = data.creadoEn || data.creado_en || new Date();
        this.#activa = data.activa !== undefined ? data.activa : true;
        this.#sessionRepository = sessionRepository; // Inyección de dependencia
    }

    // Getters
    get sessionId() {
        return this.#sessionId;
    }

    get usuarioId() {
        return this.#usuarioId;
    }

    get rut() {
        return this.#rut;
    }

    get token() {
        return this.#token;
    }

    get expiraEn() {
        return this.#expiraEn;
    }

    get creadoEn() {
        return this.#creadoEn;
    }

    get activa() {
        return this.#activa;
    }

    /**
     * Verifica si la sesión está activa
     * @returns {boolean}
     */
    estaActiva() {
        if (!this.#activa) {
            return false;
        }
        
        // Verificar si no ha expirado
        if (this.#expiraEn && new Date() > new Date(this.#expiraEn)) {
            return false;
        }
        
        return true;
    }

    /**
     * Verifica si la sesión ha expirado
     * @returns {boolean}
     */
    haExpirado() {
        if (!this.#expiraEn) {
            return false;
        }
        return new Date() > new Date(this.#expiraEn);
    }

    /**
     * Invalida la sesión
     * @returns {Session}
     */
    invalidar() {
        this.#activa = false;
        return this;
    }

    /**
     * Verifica si la sesión pertenece a un usuario
     * @param {Usuario} usuario - Instancia de Usuario
     * @returns {boolean}
     */
    perteneceAUsuario(usuario) {
        return this.#usuarioId === usuario.usuarioId;
    }

    /**
     * Calcula el tiempo restante de la sesión en minutos
     * @returns {number}
     */
    tiempoRestante() {
        if (!this.#expiraEn) {
            return Infinity;
        }
        
        const ahora = new Date();
        const expira = new Date(this.#expiraEn);
        const diferencia = expira - ahora;
        
        return Math.max(0, Math.floor(diferencia / 1000 / 60));
    }

    /**
     * Convierte a JSON para respuestas HTTP
     * @returns {Object}
     */
    toJSON() {
        return {
            sessionId: this.#sessionId,
            token: this.#token,
            expiraEn: this.#expiraEn,
            activa: this.#activa
        };
    }

    /**
     * Convierte a formato para base de datos
     * @returns {Object}
     */
    toDatabase() {
        return {
            usuario_id: this.#usuarioId,
            rut: this.#rut,
            token: this.#token,
            expira_en: this.#expiraEn,
            activa: this.#activa
        };
    }

    /**
     * Valida la sesión
     * @returns {Object}
     */
    validate() {
        const errors = [];

        if (!this.#usuarioId) {
            errors.push('ID de usuario requerido');
        }

        // NO validar token aquí porque se genera en el repositorio
        // if (!this.#token) {
        //     errors.push('Token requerido');
        // }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // ==================== MÉTODOS ACTIVE RECORD ====================
    // El Modelo se comunica con su Repositorio

    /**
     * Guarda la sesión en la base de datos
     * COMPORTAMIENTO: El Modelo se guarda a sí mismo
     * @param {Object} client - Cliente de transacción (requerido)
     * @returns {Promise<Session>}
     */
    async guardar(client) {
        if (!this.#sessionRepository) {
            throw new Error('Repositorio no inyectado en Session');
        }

        if (!client) {
            throw new Error('Se requiere cliente de transacción para guardar Session');
        }

        // Validar antes de guardar
        const validacion = this.validate();
        if (!validacion.isValid) {
            throw new Error(validacion.errors.join(', '));
        }

        // Crear sesión en BD y obtener datos completos
        const sessionData = await this.#sessionRepository.crearSesion(
            client,
            this.#usuarioId,
            this.#rut,
            8 // 8 horas de expiración
        );

        // Actualizar datos del modelo con los retornados de BD
        this.#sessionId = sessionData.sessionId;
        this.#token = sessionData.token;
        this.#expiraEn = sessionData.expiraEn;
        this.#creadoEn = sessionData.creadoEn;
        this.#activa = sessionData.activa;

        return this;
    }

    // ==================== FIN MÉTODOS ACTIVE RECORD ====================
}

module.exports = Session;

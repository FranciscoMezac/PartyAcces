/**
 * Modelo de Dominio - Session
 * Patrón: Domain Model
 * Propósito: Representar una sesión de usuario sin lógica de BD
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
     * @param {Object} data 
     */
    constructor(data = {}) {
        this.#sessionId = data.sessionId || data.session_id || null;
        this.#usuarioId = data.usuarioId || data.usuario_id || null;
        // Trim para eliminar espacios que agrega CHAR(256)
        this.#rut = (data.rut || '').trim();
        this.#token = (data.token || '').trim();
        this.#expiraEn = data.expiraEn || data.expira_en || null;
        this.#creadoEn = data.creadoEn || data.creado_en || new Date();
        this.#activa = data.activa !== undefined ? data.activa : true;
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

        if (!this.#token) {
            errors.push('Token requerido');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = Session;

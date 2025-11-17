/**
 * Modelo de Dominio - Acceso
 * Patrón: Active Record / Rich Domain Model
 * Propósito: Representar un acceso de usuario al local mediante QR
 */
class Acceso {
    #accesoId;
    #usuarioId;
    #qrReferencia;
    #fechaHora;
    #tipoAcceso;
    #accesoRepository;

    /**
     * @param {Object} data
     * @param {import('../repositories/AccesoRepository')|null} accesoRepository
     */
    constructor(data = {}, accesoRepository = null) {
        this.#accesoId = data.accesoId || data.acceso_id || null;
        this.#usuarioId = data.usuarioId || data.usuario_id || null;
        this.#qrReferencia = (data.qrReferencia || data.qr_referencia || '').trim();
        this.#fechaHora = data.fechaHora || data.fecha_hora || null;
        this.#tipoAcceso = (data.tipoAcceso || data.tipo_acceso || 'INGRESO').trim();
        this.#accesoRepository = accesoRepository;
    }

    // Getters
    get accesoId() { return this.#accesoId; }
    get usuarioId() { return this.#usuarioId; }
    get qrReferencia() { return this.#qrReferencia; }
    get fechaHora() { return this.#fechaHora; }
    get tipoAcceso() { return this.#tipoAcceso; }

    toJSON() {
        return {
            accesoId: this.#accesoId,
            usuarioId: this.#usuarioId,
            qrReferencia: this.#qrReferencia,
            fechaHora: this.#fechaHora,
            tipoAcceso: this.#tipoAcceso
        };
    }

    /**
     * Registra el acceso en la base de datos
     * @returns {Promise<Acceso>}
     */
    async registrar() {
        if (!this.#accesoRepository) throw new Error('Repositorio no inyectado en Acceso');
        if (!this.#usuarioId) throw new Error('usuarioId requerido');
        if (!this.#qrReferencia) throw new Error('qrReferencia requerida');

        const creado = await this.#accesoRepository.insert(this);
        this.#accesoId = creado.accesoId;
        this.#fechaHora = creado.fechaHora;
        return this;
    }

    /**
     * Verifica si ya existe un acceso reciente (últimas 8 horas)
     * @returns {Promise<boolean>}
     */
    async existeAccesoReciente() {
        if (!this.#accesoRepository) throw new Error('Repositorio no inyectado en Acceso');
        if (!this.#usuarioId) throw new Error('usuarioId requerido');

        const acceso = await this.#accesoRepository.findRecentByUsuarioId(this.#usuarioId, 0.004);
        return acceso !== null;
    }

    /**
     * Registra salida masiva (cierre de jornada)
     * @param {Array<number>} usuarioIds - IDs de usuarios a registrar salida
     * @returns {Promise<number>} Cantidad de salidas registradas
     */
    static async registrarSalidasMasivas(usuarioIds, accesoRepository) {
        if (!accesoRepository) throw new Error('Repositorio no inyectado');
        if (!Array.isArray(usuarioIds) || usuarioIds.length === 0) return 0;
        
        return await accesoRepository.insertSalidasMasivas(usuarioIds);
    }
}

module.exports = Acceso;

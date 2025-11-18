/**
 * Modelo de Dominio - Qr
 * Patrón: Active Record / Rich Domain Model
 * Propósito: Representar un QR ACTIVO asociado a un usuario y conocer su repositorio
 */
class Qr {
    #qrId;
    #usuarioId;
    #data;
    #referencia;
    #estado;
    #creadoEn;

    /**
     * @type {import('../repositories/QrRepository')|null}
     */
    #qrRepository; // El Modelo conoce su Repositorio (Active Record Pattern)

    /**
     * @param {Object} data
     * @param {import('../repositories/QrRepository')|null} qrRepository
     */
    constructor(data = {}, qrRepository = null) {
        this.#qrId = data.qrId || data.qr_id || null;
        this.#usuarioId = data.usuarioId || data.usuario_id || null;
        this.#data = (data.data || '').trim();
        this.#referencia = (data.referencia || data.ref || '').trim();
        this.#estado = (data.estado || 'ACTIVO').trim();
        this.#creadoEn = data.creadoEn || data.creado_en || null;
        this.#qrRepository = qrRepository;
    }

    // Getters para el repositorio
    get qrId() { return this.#qrId; }
    get usuarioId() { return this.#usuarioId; }
    get data() { return this.#data; }
    get referencia() { return this.#referencia; }
    get estado() { return this.#estado; }
    get creadoEn() { return this.#creadoEn; }

    toJSON() {
        return {
            qrId: this.#qrId,
            usuarioId: this.#usuarioId,
            data: this.#data,
            referencia: this.#referencia,
            estado: this.#estado,
            creadoEn: this.#creadoEn
        };
    }

    /**
     * Carga el QR activo del usuario (si existe)
     * @returns {Promise<boolean>}
     */
    async cargarActivo() {
        if (!this.#qrRepository) throw new Error('Repositorio no inyectado en Qr');
        if (!this.#usuarioId) throw new Error('usuarioId requerido');

        const encontrado = await this.#qrRepository.findActiveByUsuarioId(this.#usuarioId);
        if (!encontrado) return false;

        this.#qrId = encontrado.qrId;
        this.#data = encontrado.data;
        this.#referencia = encontrado.referencia;
        this.#estado = encontrado.estado;
        this.#creadoEn = encontrado.creadoEn;
        return true;
    }

    /**
     * Genera datos del QR a partir del RUT
     * @param {string} rut
     */
    generarDesdeRut(rut) {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const ref = `TX-PA-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
        this.#referencia = ref;
        this.#data = `PA|USER:${rut}|REF:${ref}`;
        this.#estado = 'ACTIVO';
    }

    /**
     * Guarda el QR en BD
     * @returns {Promise<Qr>}
     */
    async guardar() {
        if (!this.#qrRepository) throw new Error('Repositorio no inyectado en Qr');
        if (!this.#usuarioId) throw new Error('usuarioId requerido');
        if (!this.#data || !this.#referencia) throw new Error('Datos de QR incompletos');

        const creado = await this.#qrRepository.insert(this);
        this.#qrId = creado.qrId;
        this.#creadoEn = creado.creadoEn;
        this.#estado = creado.estado;
        return this;
    }
}

module.exports = Qr;


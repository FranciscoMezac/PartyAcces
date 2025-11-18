/**
 * Modelo de Dominio - HistorialCierre
 * Patrón: Active Record / Rich Domain Model
 * Propósito: Representar un registro de cierre de jornada con estadísticas del día
 */
class HistorialCierre {
    #cierreId;
    #fechaCierre;
    #horaCierre;
    #totalIngresos;
    #usuariosProcesados;
    #fechaHoraRegistro;
    #observaciones;
    #historialCierreRepository;

    /**
     * @param {Object} data
     * @param {import('../repositories/HistorialCierreRepository')|null} historialCierreRepository
     */
    constructor(data = {}, historialCierreRepository = null) {
        this.#cierreId = data.cierreId || data.cierre_id || null;
        this.#fechaCierre = data.fechaCierre || data.fecha_cierre || null;
        this.#horaCierre = data.horaCierre || data.hora_cierre || null;
        this.#totalIngresos = data.totalIngresos || data.total_ingresos || 0;
        this.#usuariosProcesados = data.usuariosProcesados || data.usuarios_procesados || 0;
        this.#fechaHoraRegistro = data.fechaHoraRegistro || data.fecha_hora_registro || null;
        this.#observaciones = (data.observaciones || '').trim();
        this.#historialCierreRepository = historialCierreRepository;
    }

    // Getters
    get cierreId() { return this.#cierreId; }
    get fechaCierre() { return this.#fechaCierre; }
    get horaCierre() { return this.#horaCierre; }
    get totalIngresos() { return this.#totalIngresos; }
    get usuariosProcesados() { return this.#usuariosProcesados; }
    get fechaHoraRegistro() { return this.#fechaHoraRegistro; }
    get observaciones() { return this.#observaciones; }

    toJSON() {
        return {
            cierreId: this.#cierreId,
            fechaCierre: this.#fechaCierre,
            horaCierre: this.#horaCierre,
            totalIngresos: this.#totalIngresos,
            usuariosProcesados: this.#usuariosProcesados,
            fechaHoraRegistro: this.#fechaHoraRegistro,
            observaciones: this.#observaciones
        };
    }

    /**
     * Registra el cierre en la base de datos
     * @returns {Promise<HistorialCierre>}
     */
    async registrar() {
        if (!this.#historialCierreRepository) {
            throw new Error('Repositorio no inyectado en HistorialCierre');
        }

        const creado = await this.#historialCierreRepository.insert(this);
        this.#cierreId = creado.cierreId;
        this.#fechaHoraRegistro = creado.fechaHoraRegistro;
        return this;
    }
}

module.exports = HistorialCierre;

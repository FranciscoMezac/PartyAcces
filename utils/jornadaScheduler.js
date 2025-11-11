/**
 * Scheduler - Cierre Automático de Jornada
 * Ejecuta tareas programadas sin usar librerías externas
 */

class JornadaScheduler {
    #accesosService;
    #horaEjecucion;
    #intervalo;
    #ejecutado;
    #fechaEjecucion;

    /**
     * @param {AccesosService} accesosService
     * @param {string} horaEjecucion - Formato "HH:MM" (ej: "14:00")
     */
    constructor(accesosService, horaEjecucion = "14:00") {
        this.#accesosService = accesosService;
        this.#horaEjecucion = horaEjecucion;
        this.#intervalo = null;
        this.#ejecutado = false;
        this.#fechaEjecucion = null;
    }

    /**
     * Inicia el scheduler
     */
    iniciar() {
        console.log(`[Scheduler] Iniciado - Cierre automático programado para las ${this.#horaEjecucion}`);
        
        // Verificar cada minuto si es hora de ejecutar
        this.#intervalo = setInterval(() => {
            this.verificarYEjecutar();
        }, 60000); // 60 segundos

        // Ejecutar verificación inmediata
        this.verificarYEjecutar();
    }

    /**
     * Detiene el scheduler
     */
    detener() {
        if (this.#intervalo) {
            clearInterval(this.#intervalo);
            this.#intervalo = null;
            console.log('[Scheduler] Detenido');
        }
    }

    /**
     * Verifica si es hora de ejecutar el cierre de jornada
     */
    async verificarYEjecutar() {
        const ahora = new Date();
        const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
        const fechaActual = ahora.toDateString();

        // Verificar si ya se ejecutó hoy
        if (this.#ejecutado && this.#fechaEjecucion === fechaActual) {
            return;
        }

        // Si cambió el día, resetear flag
        if (this.#fechaEjecucion !== fechaActual) {
            this.#ejecutado = false;
        }

        // Ejecutar si es la hora programada
        if (horaActual === this.#horaEjecucion && !this.#ejecutado) {
            console.log(`[Scheduler] Ejecutando cierre de jornada automático...`);
            await this.ejecutarCierre();
            this.#ejecutado = true;
            this.#fechaEjecucion = fechaActual;
        }
    }

    /**
     * Ejecuta el cierre de jornada
     */
    async ejecutarCierre() {
        try {
            const resultado = await this.#accesosService.cerrarJornada();
            console.log(`[Scheduler] Cierre exitoso - ${resultado.procesados} salidas registradas`);
        } catch (error) {
            console.error('[Scheduler] Error al cerrar jornada:', error);
        }
    }

    /**
     * Ejecuta manualmente el cierre (para pruebas)
     */
    async ejecutarManual() {
        console.log('[Scheduler] Ejecución manual iniciada...');
        await this.ejecutarCierre();
        this.#ejecutado = false; // Permitir re-ejecución
    }
}

module.exports = JornadaScheduler;

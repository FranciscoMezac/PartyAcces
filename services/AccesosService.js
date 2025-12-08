/**
 * Patrón: Service Layer Pattern
 * Propósito: Coordinar el cierre automático de jornada (registrar salidas masivas)
 */

const Acceso = require('../models/Acceso');
const HistorialCierre = require('../models/HistorialCierre');

class AccesosService {
    #accesoRepository;
    #historialCierreRepository;

    /**
     * @param {AccesoRepository} accesoRepository
     * @param {HistorialCierreRepository} historialCierreRepository
     */
    constructor(accesoRepository, historialCierreRepository = null) {
        this.#accesoRepository = accesoRepository;
        this.#historialCierreRepository = historialCierreRepository;
    }

    /**
     * Guarda el panel registrando salida para todos los usuarios con INGRESO sin SALIDA
     * Guarda el historial del guardado
     * Sigue el patrón Active Record: Servicio → Modelo → Repositorio
     * @returns {Promise<{procesados: number, totalIngresos: number, historial: Object}>}
     */
    async cerrarJornada() {
        console.log('🔄 Iniciando cierre de jornada...');
        
        try {
            // Servicio usa método estático del MODELO (no del repositorio directamente)
            const totalIngresos = await Acceso.contarTotalIngresosHoy(this.#accesoRepository);
            console.log(`📊 Total ingresos del día: ${totalIngresos}`);

            // Servicio usa método estático del MODELO (no del repositorio directamente)
            const usuarioIds = await Acceso.obtenerUsuariosConIngresoAbierto(this.#accesoRepository);
            console.log(`👥 Usuarios con ingreso abierto: ${usuarioIds.length}`, usuarioIds);

            let procesados = 0;
            if (usuarioIds.length > 0) {
                // Servicio usa método estático del MODELO para registrar salidas masivas
                console.log('🚪 Registrando salidas masivas...');
                procesados = await Acceso.registrarSalidasMasivas(usuarioIds, this.#accesoRepository);
                console.log(`✅ Salidas procesadas: ${procesados}`);
            }

            // Guardar historial del cierre usando el MODELO
            let historial = null;
            if (this.#historialCierreRepository) {
                console.log('📝 Guardando historial...');
                const cierreHistorial = new HistorialCierre({
                    totalIngresos: totalIngresos,
                    usuariosProcesados: procesados,
                    observaciones: `Guardado manual por administrador - ${procesados} salidas registradas de ${totalIngresos} ingresos totales`
                }, this.#historialCierreRepository);

                // El Modelo se registra a sí mismo
                historial = await cierreHistorial.registrar();
                console.log('✅ Historial guardado');
            }

            console.log('✅ Cierre de jornada completado');
            return {
                procesados,
                totalIngresos,
                historial: historial ? historial.toJSON() : null
            };
        } catch (error) {
            console.error('❌ Error en cerrarJornada:', error);
            throw error;
        }
    }
}

module.exports = AccesosService;

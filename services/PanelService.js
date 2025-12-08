/**
 * Patrón: Service Layer Pattern
 * Propósito: Coordinar la obtención de accesos activos del día para el panel de administración
 */

const Acceso = require('../models/Acceso');
const Usuario = require('../models/Usuario');

class PanelService {
    #accesoRepository;
    #usuarioRepository;

    /**
     * @param {AccesoRepository} accesoRepository
     * @param {UsuarioRepository} usuarioRepository
     */
    constructor(accesoRepository, usuarioRepository) {
        this.#accesoRepository = accesoRepository;
        this.#usuarioRepository = usuarioRepository;
    }

    /**
     * Obtiene el listado de usuarios que ingresaron hoy y están en el local
     * (tienen INGRESO sin SALIDA posterior)
     * Sigue el patrón Active Record: Servicio → Modelo → Repositorio
     * @returns {Promise<{items: Array, total: number}>}
     */
    async obtenerPanel() {
        // Servicio usa método estático del MODELO (no del repositorio directamente)
        const accesos = await Acceso.cargarIngresosHoy(this.#accesoRepository);

        // Obtener datos completos de cada usuario
        const items = [];
        for (const acceso of accesos) {
            // Crear instancia del Modelo Usuario con repositorio inyectado
            const usuario = new Usuario({ usuarioId: acceso.usuarioId }, this.#usuarioRepository);
            
            // El Modelo se carga a sí mismo
            const cargado = await usuario.cargarPorId();
            
            if (cargado) {
                // acceso.toJSON() ya tiene fechaHora con zona horaria Chile
                const accesoData = acceso.toJSON();
                items.push({
                    usuarioId: usuario.usuarioId,
                    nombre: usuario.nombre,
                    rut: usuario.rut,
                    email: usuario.email,
                    fechaHora: accesoData.fechaHora
                });
            }
        }

        // Servicio usa método estático del MODELO para contar
        const total = await Acceso.contarIngresosActuales(this.#accesoRepository);

        return { items, total };
    }
}

module.exports = PanelService;

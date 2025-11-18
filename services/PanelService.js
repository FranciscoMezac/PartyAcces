/**
 * Patrón: Service Layer Pattern
 * Propósito: Coordinar la obtención de accesos activos del día para el panel de administración
 */

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
     * @returns {Promise<{items: Array, total: number}>}
     */
    async obtenerPanel() {
        // Obtener accesos de hoy (INGRESO sin SALIDA)
        const accesos = await this.#accesoRepository.findIngresosHoy();

        // Obtener datos completos de cada usuario
        const items = [];
        for (const acceso of accesos) {
            const usuario = await this.#usuarioRepository.findById(acceso.usuario_id);
            if (usuario) {
                items.push({
                    usuarioId: usuario.usuarioId,
                    nombre: usuario.nombre,
                    rut: usuario.rut,
                    email: usuario.email,
                    fechaHora: acceso.fecha_hora
                });
            }
        }

        // Contar total de usuarios actualmente en el local
        const total = await this.#accesoRepository.countIngresosSinSalida();

        return { items, total };
    }
}

module.exports = PanelService;

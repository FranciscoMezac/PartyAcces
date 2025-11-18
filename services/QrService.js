/**
 * Patrón: Service Layer Pattern
 * Propósito: Coordinar la generación de QR único siguiendo Active Record
 */

const Usuario = require('../models/Usuario');
const Session = require('../models/Session');
const Qr = require('../models/Qr');

class QrService {
    #usuarioRepository;
    #qrRepository;
    #sessionRepository;

    /**
     * @param {UsuarioRepository} usuarioRepository
     * @param {QrRepository} qrRepository
     * @param {SessionRepository} sessionRepository
     */
    constructor(usuarioRepository, qrRepository, sessionRepository) {
        this.#usuarioRepository = usuarioRepository;
        this.#qrRepository = qrRepository;
        this.#sessionRepository = sessionRepository;
    }

    /**
     * Genera (o retorna) QR activo para usuario autenticado
     * @param {string} token - Token de sesión activa
     * @returns {Promise<{qr: object, created: boolean}>}
     */
    async generarDesdeToken(token) {
        // Cargar sesión para obtener usuarioId
        const session = new Session({ token }, this.#sessionRepository);
        await session.cargarPorToken();

        // Cargar usuario para obtener RUT
        const usuario = new Usuario({ usuarioId: session.usuarioId }, this.#usuarioRepository);
        await usuario.cargarPorId();

        // Buscar QR activo existente
        const qr = new Qr({ usuarioId: usuario.usuarioId }, this.#qrRepository);
        const tiene = await qr.cargarActivo();
        if (tiene) {
            return { qr: qr.toJSON(), created: false };
        }

        // Generar nuevo QR
        qr.generarDesdeRut(usuario.rut);
        await qr.guardar();
        return { qr: qr.toJSON(), created: true };
    }
}

module.exports = QrService;


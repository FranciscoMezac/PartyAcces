/**
 * Patrón: Service Layer Pattern
 * Propósito: Coordinar la validación de acceso por escaneo de QR
 */

const Acceso = require('../models/Acceso');
const Qr = require('../models/Qr');

class AccesoService {
    #qrRepository;
    #accesoRepository;
    #usuarioRepository;

    /**
     * @param {QrRepository} qrRepository
     * @param {AccesoRepository} accesoRepository
     * @param {UsuarioRepository} usuarioRepository
     */
    constructor(qrRepository, accesoRepository, usuarioRepository) {
        this.#qrRepository = qrRepository;
        this.#accesoRepository = accesoRepository;
        this.#usuarioRepository = usuarioRepository;
    }

    /**
     * Valida y registra acceso mediante código QR
     * @param {string} codigoQr - Código escaneado (formato: PA|USER:{rut}|REF:{referencia})
     * @returns {Promise<{acceso: object, duplicado: boolean}>}
     */
    async validarAccesoPorCodigo(codigoQr) {
        if (!codigoQr) {
            const err = new Error('Código QR requerido');
            err.code = 'INVALID_QR';
            throw err;
        }

        // Parsear código QR
        const partes = codigoQr.split('|');
        if (partes.length !== 3 || partes[0] !== 'PA') {
            const err = new Error('Código QR inválido');
            err.code = 'INVALID_QR';
            throw err;
        }

        const referencia = partes[2].replace('REF:', '');

        // Buscar QR en la base de datos
        const qrData = await this.#qrRepository.findByReferencia(referencia);
        if (!qrData) {
            const err = new Error('QR no encontrado');
            err.code = 'NOT_FOUND';
            throw err;
        }

        const usuarioId = qrData.usuario_id;

        // Verificar si ya existe acceso reciente (control de duplicados)
        const acceso = new Acceso({ usuarioId, qrReferencia: referencia }, this.#accesoRepository);
        const yaIngreso = await acceso.existeAccesoReciente();

        if (yaIngreso) {
            // Usuario ya ingresó recientemente
            const err = new Error('Usuario ya ingresó en las últimas 8 horas');
            err.code = 'DUPLICATE';
            throw err;
        }

        // Registrar nuevo acceso
        await acceso.registrar();

        // Obtener datos del usuario
        const usuarioData = await this.#usuarioRepository.findById(usuarioId);

        return {
            acceso: acceso.toJSON(),
            usuario: {
                nombre: usuarioData.nombre,
                rut: usuarioData.rut,
                email: usuarioData.email
            },
            duplicado: false
        };
    }
}

module.exports = AccesoService;

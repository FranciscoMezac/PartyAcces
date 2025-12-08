/**
 * Patrón: Service Layer Pattern
 * Propósito: Coordinar la validación de acceso por escaneo de QR
 * Sigue el patrón Active Record: Servicio → Modelo → Repositorio
 */

const Acceso = require('../models/Acceso');
const Qr = require('../models/Qr');
const Usuario = require('../models/Usuario');

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

        // Servicio usa método estático del MODELO Qr (no del repositorio directamente)
        const qrData = await Qr.buscarPorReferencia(referencia, this.#qrRepository);
        if (!qrData) {
            const err = new Error('QR no encontrado');
            err.code = 'NOT_FOUND';
            throw err;
        }

        const usuarioId = qrData.usuario_id;

        // Crear instancia del Modelo Acceso con repositorio inyectado
        const acceso = new Acceso({ usuarioId, qrReferencia: referencia }, this.#accesoRepository);
        
        // El Modelo se valida a sí mismo
        const yaIngreso = await acceso.existeAccesoReciente();

        console.log(`🚪 Usuario ${usuarioId} - Ya ingresó: ${yaIngreso}`);

        if (yaIngreso) {
            // Usuario ya ingresó recientemente
            const err = new Error('Usuario ya ingresó en las últimas 8 horas');
            err.code = 'DUPLICATE';
            throw err;
        }

        // El Modelo se registra a sí mismo
        console.log(`✅ Registrando nuevo acceso para usuario ${usuarioId}`);
        await acceso.registrar();
        console.log(`✅ Acceso registrado:`, acceso.toJSON());

        // Crear instancia del Modelo Usuario con repositorio inyectado
        const usuario = new Usuario({ usuarioId }, this.#usuarioRepository);
        
        // El Modelo se carga a sí mismo
        await usuario.cargarPorId();

        return {
            acceso: acceso.toJSON(),
            usuario: {
                nombre: usuario.nombre,
                rut: usuario.rut,
                email: usuario.email
            },
            duplicado: false
        };
    }
}

module.exports = AccesoService;

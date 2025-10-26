/**
 * Patron de diseño: Repository Pattern
 * Propósito: Abstraer el acceso a datos de sesiones de la lógica de negocio
 */

const Session = require('../models/Session');
const crypto = require('crypto');

class SessionRepository {
    #db;

    /**
     * Constructor con inyección de dependencias
     * @param {Object} db - Pool de conexión a la base de datos
     */
    constructor(db) {
        this.#db = db;
    }

    /**
     * Genera un token único para la sesión
     * @returns {string}
     */
    generarToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Crea una nueva sesión dentro de una transacción
     * @param {Object} client - Cliente de transacción
     * @param {number} usuarioId - ID del usuario
     * @param {string} rut - RUT del usuario
     * @param {number} horasExpiracion - Horas hasta que expire (default 8)
     * @returns {Promise<Session>}
     */
    async crearSesion(client, usuarioId, rut, horasExpiracion = 8) {
        try {
            const token = this.generarToken();
            const expiraEn = new Date();
            expiraEn.setHours(expiraEn.getHours() + horasExpiracion);

            const result = await client.query(
                `INSERT INTO sesiones (usuario_id, rut, token, expira_en, activa) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING *`,
                [usuarioId, rut, token, expiraEn, true]
            );

            return new Session(result.rows[0]);
        } catch (error) {
            console.error('Error al crear sesión:', error);
            throw error;
        }
    }

    /**
     * Busca una sesión por token
     * @param {string} token 
     * @returns {Promise<Session|null>}
     */
    async findByToken(token) {
        try {
            const result = await this.#db.query(
                'SELECT * FROM sesiones WHERE token = $1',
                [token]
            );

            return result.rows[0] ? new Session(result.rows[0]) : null;
        } catch (error) {
            console.error('Error al buscar sesión por token:', error);
            throw error;
        }
    }

    /**
     * Busca sesiones activas de un usuario
     * @param {number} usuarioId 
     * @returns {Promise<Array<Session>>}
     */
    async findActivasByUsuario(usuarioId) {
        try {
            const result = await this.#db.query(
                `SELECT * FROM sesiones 
                 WHERE usuario_id = $1 AND activa = true AND expira_en > NOW()
                 ORDER BY creado_en DESC`,
                [usuarioId]
            );

            return result.rows.map(row => new Session(row));
        } catch (error) {
            console.error('Error al buscar sesiones activas:', error);
            throw error;
        }
    }

    /**
     * Invalida una sesión (logout)
     * @param {string} token 
     * @returns {Promise<boolean>}
     */
    async invalidarSesion(token) {
        try {
            const result = await this.#db.query(
                'UPDATE sesiones SET activa = false WHERE token = $1 RETURNING session_id',
                [token]
            );

            return result.rows.length > 0;
        } catch (error) {
            console.error('Error al invalidar sesión:', error);
            throw error;
        }
    }

    /**
     * Invalida todas las sesiones de un usuario
     * @param {number} usuarioId 
     * @returns {Promise<number>} - Cantidad de sesiones invalidadas
     */
    async invalidarTodasLasSesiones(usuarioId) {
        try {
            const result = await this.#db.query(
                'UPDATE sesiones SET activa = false WHERE usuario_id = $1 AND activa = true RETURNING session_id',
                [usuarioId]
            );

            return result.rows.length;
        } catch (error) {
            console.error('Error al invalidar todas las sesiones:', error);
            throw error;
        }
    }

    /**
     * Limpia sesiones expiradas (tarea de mantenimiento)
     * @returns {Promise<number>} - Cantidad de sesiones eliminadas
     */
    async limpiarSesionesExpiradas() {
        try {
            const result = await this.#db.query(
                'DELETE FROM sesiones WHERE expira_en < NOW() RETURNING session_id'
            );

            return result.rows.length;
        } catch (error) {
            console.error('Error al limpiar sesiones expiradas:', error);
            throw error;
        }
    }
}

module.exports = SessionRepository;

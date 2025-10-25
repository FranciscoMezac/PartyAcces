/**
 * Patron de diseño: Repository Pattern
 * Propósito: Abstraer el acceso a datos de las cuentas de puntos de la lógica de negocio
 * Problema que resuelve: Separa las consultas a base de datos del modelo de dominio,
 * permitiendo cambiar la fuente de datos sin afectar la lógica de negocio
 */

const CuentaPuntos = require('../models/CuentaPuntos');

class CuentaPuntosRepository {
    #db;

    /**
     * Constructor con inyección de dependencias
     * @param {Object} db - Pool de conexión a la base de datos
     */
    constructor(db) {
        this.#db = db;
    }

    /**
     * Crea una nueva cuenta de puntos dentro de una transacción
     * @param {Object} client - Cliente de transacción
     * @param {string} rut - RUT del usuario
     * @param {number} saldoInicial - Saldo inicial (por defecto 0)
     * @returns {Promise<CuentaPuntos>} - Instancia de CuentaPuntos
     */
    async crearCuenta(client, rut, saldoInicial = 0) {
        try {
            const result = await client.query(
                'INSERT INTO cuentas (rut, saldo) VALUES ($1, $2) RETURNING *',
                [rut, saldoInicial]
            );
            
            return new CuentaPuntos(result.rows[0]);
        } catch (error) {
            console.error('Error al crear cuenta de puntos:', error);
            throw error;
        }
    }

    /**
     * Obtiene el saldo de una cuenta por RUT
     * @param {string} rut 
     * @returns {Promise<number|null>}
     */
    async obtenerSaldo(rut) {
        try {
            const result = await this.#db.query(
                'SELECT saldo FROM cuentas WHERE rut = $1',
                [rut]
            );
            
            return result.rows[0] ? result.rows[0].saldo : null;
        } catch (error) {
            console.error('Error al obtener saldo:', error);
            throw error;
        }
    }

    /**
     * Obtiene una cuenta completa por RUT
     * @param {string} rut 
     * @returns {Promise<CuentaPuntos|null>}
     */
    async findByRut(rut) {
        try {
            const result = await this.#db.query(
                'SELECT * FROM cuentas WHERE rut = $1',
                [rut]
            );
            
            return result.rows[0] ? new CuentaPuntos(result.rows[0]) : null;
        } catch (error) {
            console.error('Error al buscar cuenta por RUT:', error);
            throw error;
        }
    }

    /**
     * Actualiza el saldo de una cuenta usando una instancia de CuentaPuntos
     * @param {CuentaPuntos} cuenta - Instancia del modelo
     * @returns {Promise<CuentaPuntos|null>}
     */
    async actualizar(cuenta) {
        try {
            const data = cuenta.toDatabase();
            const result = await this.#db.query(
                'UPDATE cuentas SET saldo = $1, actualizado_en = CURRENT_TIMESTAMP WHERE rut = $2 RETURNING *',
                [data.saldo, data.rut]
            );
            
            return result.rows[0] ? new CuentaPuntos(result.rows[0]) : null;
        } catch (error) {
            console.error('Error al actualizar cuenta:', error);
            throw error;
        }
    }

    /**
     * Incrementa el saldo de una cuenta
     * @param {string} rut 
     * @param {number} cantidad 
     * @returns {Promise<CuentaPuntos|null>}
     */
    async incrementarSaldo(rut, cantidad) {
        try {
            const result = await this.#db.query(
                'UPDATE cuentas SET saldo = saldo + $1, actualizado_en = CURRENT_TIMESTAMP WHERE rut = $2 RETURNING *',
                [cantidad, rut]
            );
            
            return result.rows[0] ? new CuentaPuntos(result.rows[0]) : null;
        } catch (error) {
            console.error('Error al incrementar saldo:', error);
            throw error;
        }
    }

    /**
     * Decrementa el saldo de una cuenta
     * @param {string} rut 
     * @param {number} cantidad 
     * @returns {Promise<CuentaPuntos|null>}
     */
    async decrementarSaldo(rut, cantidad) {
        try {
            const result = await this.#db.query(
                'UPDATE cuentas SET saldo = saldo - $1, actualizado_en = CURRENT_TIMESTAMP WHERE rut = $2 RETURNING *',
                [cantidad, rut]
            );
            
            return result.rows[0] ? new CuentaPuntos(result.rows[0]) : null;
        } catch (error) {
            console.error('Error al decrementar saldo:', error);
            throw error;
        }
    }

    /**
     * Obtiene todas las cuentas
     * @returns {Promise<Array<CuentaPuntos>>}
     */
    async findAll() {
        try {
            const result = await this.#db.query(
                'SELECT * FROM cuentas ORDER BY actualizado_en DESC'
            );
            
            return result.rows.map(row => new CuentaPuntos(row));
        } catch (error) {
            console.error('Error al obtener todas las cuentas:', error);
            throw error;
        }
    }

    /**
     * Elimina una cuenta por RUT
     * @param {string} rut 
     * @returns {Promise<boolean>}
     */
    async delete(rut) {
        try {
            const result = await this.#db.query(
                'DELETE FROM cuentas WHERE rut = $1 RETURNING id',
                [rut]
            );
            
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error al eliminar cuenta:', error);
            throw error;
        }
    }
}

module.exports = CuentaPuntosRepository;

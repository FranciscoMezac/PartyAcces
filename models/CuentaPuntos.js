/**
 * Modelo de Dominio - CuentaPuntos
 * Patrón: Domain Model
 * Propósito: Representar la entidad CuentaPuntos sin lógica de BD
 * Los objetos de esta clase se comunican con objetos Usuario
 */
class CuentaPuntos {
    #id;
    #rut;
    #saldo;
    #actualizadoEn;

    /**
     * @param {Object} data 
     */
    constructor(data = {}) {
        this.#id = data.id || null;
        // Trim para eliminar espacios que agrega CHAR(256)
        this.#rut = (data.rut || '').trim();
        this.#saldo = data.saldo || 0;
        this.#actualizadoEn = data.actualizado_en || data.actualizadoEn || null;
    }

    // Getters
    get id() {
        return this.#id;
    }

    get rut() {
        return this.#rut;
    }

    get saldo() {
        return this.#saldo;
    }

    get actualizadoEn() {
        return this.#actualizadoEn;
    }

    // Setters con validación
    set rut(value) {
        if (!value || value.trim().length < 8) {
            throw new Error('El RUT debe ser válido');
        }
        this.#rut = value.trim();
    }

    set saldo(value) {
        if (value < 0) {
            throw new Error('El saldo no puede ser negativo');
        }
        this.#saldo = value;
    }

    /**
     * Agrega puntos a la cuenta
     * @param {number} cantidad - Cantidad de puntos a agregar
     * @returns {CuentaPuntos} - Retorna this para method chaining
     */
    agregarPuntos(cantidad) {
        if (cantidad <= 0) {
            throw new Error('La cantidad debe ser mayor a 0');
        }
        this.#saldo += cantidad;
        return this;
    }

    /**
     * Resta puntos de la cuenta
     * @param {number} cantidad - Cantidad de puntos a restar
     * @returns {CuentaPuntos} - Retorna this para method chaining
     */
    restarPuntos(cantidad) {
        if (cantidad <= 0) {
            throw new Error('La cantidad debe ser mayor a 0');
        }
        if (this.#saldo < cantidad) {
            throw new Error('Saldo insuficiente');
        }
        this.#saldo -= cantidad;
        return this;
    }

    /**
     * Verifica si tiene suficientes puntos
     * @param {number} cantidad - Cantidad a verificar
     * @returns {boolean}
     */
    tieneSuficientesPuntos(cantidad) {
        return this.#saldo >= cantidad;
    }

    /**
     * Canjea puntos (resta puntos si hay suficiente saldo)
     * @param {number} cantidad - Cantidad a canjear
     * @returns {boolean} - true si se canjeó exitosamente
     */
    canjearPuntos(cantidad) {
        if (!this.tieneSuficientesPuntos(cantidad)) {
            return false;
        }
        this.restarPuntos(cantidad);
        return true;
    }

    /**
     * Resetea el saldo a cero
     * @returns {CuentaPuntos} - Retorna this para method chaining
     */
    resetearSaldo() {
        this.#saldo = 0;
        return this;
    }

    /**
     * Establece un nuevo saldo
     * @param {number} nuevoSaldo 
     * @returns {CuentaPuntos} - Retorna this para method chaining
     */
    establecerSaldo(nuevoSaldo) {
        if (nuevoSaldo < 0) {
            throw new Error('El saldo no puede ser negativo');
        }
        this.#saldo = nuevoSaldo;
        return this;
    }

    /**
     * Verifica si la cuenta pertenece a un usuario específico
     * @param {Usuario} usuario - Instancia de Usuario
     * @returns {boolean}
     */
    perteneceAUsuario(usuario) {
        return this.#rut === usuario.rut;
    }

    /**
     * Calcula el nivel del usuario según sus puntos
     * @returns {string} - BRONCE, PLATA, ORO, PLATINO
     */
    calcularNivel() {
        if (this.#saldo >= 1000) return 'PLATINO';
        if (this.#saldo >= 500) return 'ORO';
        if (this.#saldo >= 200) return 'PLATA';
        return 'BRONCE';
    }

    /**
     * Verifica si puede acceder a beneficios de un nivel específico
     * @param {string} nivel - BRONCE, PLATA, ORO, PLATINO
     * @returns {boolean}
     */
    puedeAccederANivel(nivel) {
        const niveles = { 'BRONCE': 0, 'PLATA': 200, 'ORO': 500, 'PLATINO': 1000 };
        return this.#saldo >= niveles[nivel];
    }

    /**
     * Calcula puntos faltantes para el siguiente nivel
     * @returns {Object} - { nivelActual, siguienteNivel, puntosFaltantes }
     */
    puntosParaSiguienteNivel() {
        const nivelActual = this.calcularNivel();
        let siguienteNivel = '';
        let puntosFaltantes = 0;

        if (nivelActual === 'BRONCE') {
            siguienteNivel = 'PLATA';
            puntosFaltantes = 200 - this.#saldo;
        } else if (nivelActual === 'PLATA') {
            siguienteNivel = 'ORO';
            puntosFaltantes = 500 - this.#saldo;
        } else if (nivelActual === 'ORO') {
            siguienteNivel = 'PLATINO';
            puntosFaltantes = 1000 - this.#saldo;
        } else {
            siguienteNivel = 'MAX';
            puntosFaltantes = 0;
        }

        return { nivelActual, siguienteNivel, puntosFaltantes };
    }

    /**
     * Convierte a JSON para respuestas HTTP
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.#id,
            rut: this.#rut,
            saldo: this.#saldo,
            actualizadoEn: this.#actualizadoEn,
            nivel: this.calcularNivel()
        };
    }

    /**
     * Convierte a formato para base de datos
     * @returns {Object}
     */
    toDatabase() {
        return {
            rut: this.#rut,
            saldo: this.#saldo
        };
    }

    /**
     * Valida la cuenta
     * @returns {Object} - { isValid, errors }
     */
    validate() {
        const errors = [];

        if (!this.#rut || this.#rut.trim().length < 8) {
            errors.push('RUT inválido');
        }

        if (this.#saldo < 0) {
            errors.push('El saldo no puede ser negativo');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = CuentaPuntos;

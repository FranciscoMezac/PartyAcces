class CuentaPuntos {
    #id;
    #rut;
    #saldo;
    #actualizadoEn;
    
    /**
     * @type {import('../repositories/CuentaPuntosRepository')|null}
     */
    #cuentaPuntosRepository; // El Modelo conoce su Repositorio (Active Record Pattern)

    /**
     * Constructor con inyección del repositorio
     * @param {Object} data - Datos de la cuenta
     * @param {import('../repositories/CuentaPuntosRepository')|null} cuentaPuntosRepository - Repositorio inyectado (opcional)
     */
    constructor(data = {}, cuentaPuntosRepository = null) {
        this.#id = data.id || null;
        this.#rut = (data.rut || data.rut_usuario || '').trim();
        this.#saldo = data.saldo || 0;
        this.#actualizadoEn = data.actualizado_en || data.actualizadoEn || null;
        this.#cuentaPuntosRepository = cuentaPuntosRepository; // Inyección de dependencia
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
     * Acredita puntos a la cuenta (alias de agregarPuntos, compatible con Cuenta.js)
     * @param {number} puntos - Cantidad de puntos a acreditar
     * @returns {number} - Nuevo saldo
     */
    acreditar(puntos) {
        const cantidad = Number(puntos);
        if (!Number.isFinite(cantidad) || cantidad <= 0) {
            throw new Error('Puntos inválidos');
        }
        this.#saldo += cantidad;
        return this.#saldo;
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
     * Debita puntos de la cuenta (alias de restarPuntos, compatible con Cuenta.js)
     * @param {number} costo - Cantidad de puntos a debitar
     * @returns {number} - Nuevo saldo
     */
    debitar(costo) {
        const valor = Number(costo);
        if (!Number.isFinite(valor) || valor <= 0) {
            throw new Error('Costo inválido');
        }
        if (this.#saldo < valor) {
            const err = new Error('Saldo insuficiente');
            err.code = 'SALDO_INSUFICIENTE';
            throw err;
        }
        this.#saldo -= valor;
        return this.#saldo;
    }

    /**
     * Verifica si tiene suficientes puntos
     * @param {number} cantidad - Cantidad a verificar
     * @returns {boolean}
     */
    tieneSuficientesPuntos(cantidad) {
        return this.#saldo >= cantidad;
    }

    // Alias del diagrama: puedeDebitar(costo)
    puedeDebitar(costo) {
        return this.tieneSuficientesPuntos(Number(costo));
    }

    // Del diagrama: calcularPuntosAcreditacion(monto)
    calcularPuntosAcreditacion(monto, tasa = (process.env.PUNTOS_PORCENTAJE ? Number(process.env.PUNTOS_PORCENTAJE) : 0.1)) {
        const m = Number(monto);
        if (!Number.isFinite(m) || m <= 0) throw new Error('Monto inválido');
        return Math.floor(m * tasa);
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

    // ==================== MÉTODOS ACTIVE RECORD ====================
    // El Modelo se comunica con su Repositorio

    /**
     * Guarda la cuenta en la base de datos
     * COMPORTAMIENTO: El Modelo se guarda a sí mismo
     * @param {Object} client - Cliente de transacción (requerido)
     * @returns {Promise<void>}
     */
    async guardar(client) {
        if (!this.#cuentaPuntosRepository) {
            throw new Error('Repositorio no inyectado en CuentaPuntos');
        }

        if (!client) {
            throw new Error('Se requiere cliente de transacción para guardar CuentaPuntos');
        }

        // Validar antes de guardar
        const validacion = this.validate();
        if (!validacion.isValid) {
            throw new Error(validacion.errors.join(', '));
        }

        // Insertar en BD
        await this.#cuentaPuntosRepository.crearCuenta(client, this.#rut, this.#saldo);
    }

    // ==================== FIN MÉTODOS ACTIVE RECORD ====================
}

module.exports = CuentaPuntos;

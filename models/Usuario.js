const bcrypt = require('bcryptjs');
class Usuario {
    #usuarioId;
    #nombre;
    #rut;
    #email;
    #contrasenia;
    #rol;
    #estado;
    #createdAt;

    /**
     * @param {Object} data 
     */
    constructor(data = {}) {
        this.#usuarioId = data.usuarioId || data.usuario_id || null;
        // Trim para eliminar espacios que agrega CHAR(256)
        this.#nombre = (data.nombre || '').trim();
        this.#rut = (data.rut || '').trim();
        this.#email = (data.email || '').trim();
        this.#contrasenia = (data.contrasenia || '').trim();
        this.#rol = (data.rol || 'USER').trim();
        this.#estado = (data.estado || 'ACTIVO').trim();
        this.#createdAt = data.created_at || data.createdAt || null;
    }

    get usuarioId() {
        return this.#usuarioId;
    }

    get nombre() {
        return this.#nombre;
    }

    get rut() {
        return this.#rut;
    }

    get email() {
        return this.#email;
    }

    get contrasenia() {
        return this.#contrasenia;
    }

    get rol() {
        return this.#rol;
    }

    get estado() {
        return this.#estado;
    }

    get createdAt() {
        return this.#createdAt;
    }

    set nombre(value) {
        if (!value || value.trim().length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres');
        }
        this.#nombre = value.trim();
    }

    set rut(value) {
        if (!value || value.trim().length < 8) {
            throw new Error('El RUT debe ser válido');
        }
        this.#rut = value.trim();
    }

    set email(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            throw new Error('Email inválido');
        }
        this.#email = value.toLowerCase().trim();
    }

    set contrasenia(value) {
        if (!value || value.length < 8) {
            throw new Error('La contraseña debe tener al menos 8 caracteres');
        }
        this.#contrasenia = value;
    }

    set rol(value) {
        const rolesValidos = ['USER', 'ADMIN'];
        if (!rolesValidos.includes(value)) {
            throw new Error('Rol inválido. Debe ser USER o ADMIN');
        }
        this.#rol = value;
    }

    set estado(value) {
        const estadosValidos = ['ACTIVO', 'INACTIVO'];
        if (!estadosValidos.includes(value)) {
            throw new Error('Estado inválido. Debe ser ACTIVO o INACTIVO');
        }
        this.#estado = value;
    }

    /**
     * @returns {Object}
     */
    toDatabase() {
        return {
            nombre: this.#nombre,
            rut: this.#rut,
            email: this.#email,
            contrasenia: this.#contrasenia,
            rol: this.#rol,
            estado: this.#estado
        };
    }

    /**
     * @returns {Object}
     */
    toJSON() {
        return {
            usuarioId: this.#usuarioId,
            nombre: this.#nombre,
            rut: this.#rut,
            email: this.#email,
            rol: this.#rol,
            estado: this.#estado,
            createdAt: this.#createdAt
        };
    }

    /**
     * @returns {boolean}
     */
    isAdmin() {
        return this.#rol === 'ADMIN';
    }

    /**
     * @returns {boolean}
     */
    isActive() {
        return this.#estado === 'ACTIVO';
    }

    /**
     * @returns {Object}
     */
    validate() {
        const errors = [];

        try {
            if (!this.#nombre || this.#nombre.trim().length < 2) {
                errors.push('El nombre debe tener al menos 2 caracteres');
            }

            if (!this.#rut || this.#rut.trim().length < 8) {
                errors.push('El RUT debe ser válido');
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.#email)) {
                errors.push('Email inválido');
            }

            if (!this.#contrasenia || this.#contrasenia.length < 8) {
                errors.push('La contraseña debe tener al menos 8 caracteres');
            }

            const rolesValidos = ['USER', 'ADMIN'];
            if (!rolesValidos.includes(this.#rol)) {
                errors.push('Rol inválido');
            }

            const estadosValidos = ['ACTIVO', 'INACTIVO'];
            if (!estadosValidos.includes(this.#estado)) {
                errors.push('Estado inválido');
            }
        } catch (error) {
            errors.push(error.message);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }



    /**
     * Hashea la contraseña del usuario
     * @returns {Promise<void>}
     */
    async hashPassword() {
        if (this.#contrasenia) {
            this.#contrasenia = await bcrypt.hash(this.#contrasenia, 10);
        }
    }

    /**
     * Compara una contraseña con la contraseña hasheada del usuario
     * @param {string} plainPassword 
     * @returns {Promise<boolean>}
     */
    async comparePassword(plainPassword) {
        const hashLimpio = this.#contrasenia.trim();
        return await bcrypt.compare(plainPassword, hashLimpio);
    }

    /**
     * Verifica si el usuario es administrador
     * @returns {boolean}
     */
    isAdmin() {
        return this.#rol === 'ADMIN';
    }

    /**
     * Verifica si el usuario está activo
     * @returns {boolean}
     */
    isActive() {
        return this.#estado === 'ACTIVO';
    }

    /**
     * Cambia el estado del usuario
     * @param {string} nuevoEstado - ACTIVO o INACTIVO
     * @returns {Usuario} - Retorna this para permitir method chaining
     */
    cambiarEstado(nuevoEstado) {
        const estadosValidos = ['ACTIVO', 'INACTIVO'];
        if (!estadosValidos.includes(nuevoEstado)) {
            throw new Error('Estado inválido. Debe ser ACTIVO o INACTIVO');
        }
        this.#estado = nuevoEstado;
        return this;
    }

    /**
     * Actualiza el rol del usuario
     * @param {string} nuevoRol - USER o ADMIN
     * @returns {Usuario} - Retorna this para permitir method chaining
     */
    cambiarRol(nuevoRol) {
        const rolesValidos = ['USER', 'ADMIN'];
        if (!rolesValidos.includes(nuevoRol)) {
            throw new Error('Rol inválido. Debe ser USER o ADMIN');
        }
        this.#rol = nuevoRol;
        return this;
    }

    /**
     * Actualiza la información del usuario
     * @param {Object} datos - Objeto con los campos a actualizar
     * @returns {Usuario} - Retorna this para permitir method chaining
     */
    actualizarDatos(datos) {
        if (datos.nombre) this.nombre = datos.nombre;
        if (datos.email) this.email = datos.email;
        if (datos.rut) this.rut = datos.rut;
        if (datos.rol) this.cambiarRol(datos.rol);
        if (datos.estado) this.cambiarEstado(datos.estado);
        return this;
    }

    /**
     * Desactiva el usuario
     * @returns {Usuario} - Retorna this para permitir method chaining
     */
    desactivar() {
        this.#estado = 'INACTIVO';
        return this;
    }

    /**
     * Activa el usuario
     * @returns {Usuario} - Retorna this para permitir method chaining
     */
    activar() {
        this.#estado = 'ACTIVO';
        return this;
    }

    /**
     * Promover a administrador
     * @returns {Usuario} - Retorna this para permitir method chaining
     */
    promoverAAdmin() {
        this.#rol = 'ADMIN';
        return this;
    }

    /**
     * Degradar a usuario normal
     * @returns {Usuario} - Retorna this para permitir method chaining
     */
    degradarAUser() {
        this.#rol = 'USER';
        return this;
    }

    /**
     * Verifica si este usuario puede modificar a otro usuario
     * @param {Usuario} otroUsuario - Instancia de otro usuario
     * @returns {boolean}
     */
    puedeModificar(otroUsuario) {
        // Solo los administradores pueden modificar otros usuarios
        if (!this.isAdmin()) {
            return false;
        }
        // Un usuario no puede modificarse a sí mismo para evitar bloqueos
        if (this.#usuarioId === otroUsuario.usuarioId) {
            return false;
        }
        return true;
    }

    /**
     * Verifica si este usuario tiene los mismos privilegios que otro
     * @param {Usuario} otroUsuario - Instancia de otro usuario
     * @returns {boolean}
     */
    tieneLosMismosPrivilegiosQue(otroUsuario) {
        return this.#rol === otroUsuario.rol;
    }

    /**
     * Verifica si este usuario tiene más privilegios que otro
     * @param {Usuario} otroUsuario - Instancia de otro usuario
     * @returns {boolean}
     */
    tieneMasPrivilegiosQue(otroUsuario) {
        return this.isAdmin() && !otroUsuario.isAdmin();
    }
}

module.exports = Usuario;

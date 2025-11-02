const bcrypt = require('bcryptjs');

/**
 * Patron de diseño: Active Record / Rich Domain Model
 * Propósito: Entidad de dominio ACTIVA que conoce su repositorio y se comunica con él
 * El Modelo NO es solo contenedor de datos, tiene comportamiento y lógica de negocio
 */
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
     * @type {import('../repositories/UsuarioRepository')|null}
     */
    #usuarioRepository; // El Modelo conoce su Repositorio (Active Record Pattern)

    /**
     * Constructor con inyección del repositorio
     * @param {Object} data - Datos del usuario
     * @param {import('../repositories/UsuarioRepository')|null} usuarioRepository - Repositorio inyectado (opcional)
     */
    constructor(data = {}, usuarioRepository = null) {
        this.#usuarioId = data.usuarioId || data.usuario_id || null;
        // Trim para eliminar espacios que agrega CHAR(256)
        this.#nombre = (data.nombre || '').trim();
        this.#rut = (data.rut || '').trim();
        this.#email = (data.email || '').trim();
        this.#contrasenia = (data.contrasenia || '').trim();
        this.#rol = (data.rol || 'USER').trim();
        this.#estado = (data.estado || 'ACTIVO').trim();
        this.#createdAt = data.created_at || data.createdAt || null;
        this.#usuarioRepository = usuarioRepository; // Inyección de dependencia
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

    // ==================== MÉTODOS ACTIVE RECORD ====================
    // El Modelo se comunica con su Repositorio

    /**
     * Verifica si el usuario ya existe en la base de datos por RUT
     * COMPORTAMIENTO: El Modelo usa su Repositorio
     * SOLUCIÓN: Usa existsByRut() en lugar de findByRut() para evitar crear segundo objeto
     * @returns {Promise<boolean>}
     */
    async verificarExistenciaPorRut() {
        if (!this.#usuarioRepository) {
            throw new Error('Repositorio no inyectado en Usuario');
        }
        // NO crear segundo objeto Usuario, solo verificar existencia
        return await this.#usuarioRepository.existsByRut(this.#rut);
    }

    /**
     * Verifica si el usuario ya existe en la base de datos por Email
     * COMPORTAMIENTO: El Modelo usa su Repositorio
     * SOLUCIÓN: Usa existsByEmail() en lugar de findByEmail() para evitar crear segundo objeto
     * @returns {Promise<boolean>}
     */
    async verificarExistenciaPorEmail() {
        if (!this.#usuarioRepository) {
            throw new Error('Repositorio no inyectado en Usuario');
        }
        // NO crear segundo objeto Usuario, solo verificar existencia
        return await this.#usuarioRepository.existsByEmail(this.#email);
    }

    /**
     * Guarda el usuario en la base de datos
     * COMPORTAMIENTO: El Modelo se guarda a sí mismo
     * @param {Object} client - Cliente de transacción (opcional)
     * @returns {Promise<number>} - ID del usuario creado
     */
    async guardar(client = null) {
        if (!this.#usuarioRepository) {
            throw new Error('Repositorio no inyectado en Usuario');
        }

        // Validar antes de guardar
        const validacion = this.validate();
        if (!validacion.isValid) {
            throw new Error(validacion.errors.join(', '));
        }

        // Hashear contraseña antes de guardar
        await this.hashPassword();

        // Insertar en BD
        const id = await this.#usuarioRepository.insert(client, this);
        this.#usuarioId = id;
        return id;
    }

    /**
     * Carga el usuario desde la base de datos por email
     * COMPORTAMIENTO: El Modelo se carga a sí mismo desde BD
     * @returns {Promise<boolean>} - true si encontró y cargó datos, false si no existe
     */
    async cargarPorEmail() {
        if (!this.#usuarioRepository) {
            throw new Error('Repositorio no inyectado en Usuario');
        }

        if (!this.#email) {
            throw new Error('Email requerido para cargar usuario');
        }

        const usuarioEncontrado = await this.#usuarioRepository.findByEmail(this.#email);
        
        if (!usuarioEncontrado) {
            return false;
        }

        // Poblar este objeto con los datos encontrados
        this.#usuarioId = usuarioEncontrado.usuarioId;
        this.#nombre = usuarioEncontrado.nombre;
        this.#rut = usuarioEncontrado.rut;
        this.#contrasenia = usuarioEncontrado.contrasenia;
        this.#rol = usuarioEncontrado.rol;
        this.#estado = usuarioEncontrado.estado;
        this.#createdAt = usuarioEncontrado.createdAt;

        return true;
    }

    /**
     * Carga el usuario desde la base de datos por RUT
     * COMPORTAMIENTO: El Modelo se carga a sí mismo desde BD
     * @returns {Promise<boolean>} - true si encontró y cargó datos, false si no existe
     */
    async cargarPorRut() {
        if (!this.#usuarioRepository) {
            throw new Error('Repositorio no inyectado en Usuario');
        }

        if (!this.#rut) {
            throw new Error('RUT requerido para cargar usuario');
        }

        const usuarioEncontrado = await this.#usuarioRepository.findByRut(this.#rut);
        
        if (!usuarioEncontrado) {
            return false;
        }

        // Poblar este objeto con los datos encontrados
        this.#usuarioId = usuarioEncontrado.usuarioId;
        this.#nombre = usuarioEncontrado.nombre;
        this.#email = usuarioEncontrado.email;
        this.#contrasenia = usuarioEncontrado.contrasenia;
        this.#rol = usuarioEncontrado.rol;
        this.#estado = usuarioEncontrado.estado;
        this.#createdAt = usuarioEncontrado.createdAt;

        return true;
    }

    /**
     * Carga el usuario desde la base de datos por ID
     * COMPORTAMIENTO: El Modelo se carga a sí mismo desde BD
     * @returns {Promise<boolean>} - true si encontró y cargó datos, false si no existe
     */
    async cargarPorId() {
        if (!this.#usuarioRepository) {
            throw new Error('Repositorio no inyectado en Usuario');
        }

        if (!this.#usuarioId) {
            throw new Error('ID requerido para cargar usuario');
        }

        const usuarioEncontrado = await this.#usuarioRepository.findById(this.#usuarioId);
        
        if (!usuarioEncontrado) {
            return false;
        }

        // Poblar este objeto con los datos encontrados
        this.#nombre = usuarioEncontrado.nombre;
        this.#rut = usuarioEncontrado.rut;
        this.#email = usuarioEncontrado.email;
        this.#contrasenia = usuarioEncontrado.contrasenia;
        this.#rol = usuarioEncontrado.rol;
        this.#estado = usuarioEncontrado.estado;
        this.#createdAt = usuarioEncontrado.createdAt;

        return true;
    }

    /**
     * Actualiza el perfil del usuario en la base de datos
     * COMPORTAMIENTO: El Modelo se actualiza a sí mismo
     * @param {Object} datosNuevos - Datos a actualizar (nombre, email, password opcional)
     * @returns {Promise<boolean>}
     */
    async actualizarPerfil(datosNuevos) {
        if (!this.#usuarioRepository) {
            throw new Error('Repositorio no inyectado en Usuario');
        }

        if (!this.#usuarioId) {
            throw new Error('No se puede actualizar un usuario sin ID');
        }

        // Actualizar datos internos
        if (datosNuevos.nombre) this.#nombre = datosNuevos.nombre;
        if (datosNuevos.email) this.#email = datosNuevos.email;
        
        // Si hay password, hashear
        if (datosNuevos.password) {
            this.#contrasenia = await bcrypt.hash(datosNuevos.password, 10);
        }

        // Validar antes de actualizar
        const validacion = this.validate();
        if (!validacion.isValid) {
            throw new Error(validacion.errors.join(', '));
        }

        // Preparar datos para BD
        const datosActualizacion = {
            nombre: this.#nombre,
            email: this.#email,
            rol: this.#rol,
            estado: this.#estado
        };

        // Si se actualizó password, incluirlo
        if (datosNuevos.password) {
            datosActualizacion.contrasenia = this.#contrasenia;
        }

        // Actualizar en BD
        const usuarioActualizado = await this.#usuarioRepository.update(this.#usuarioId, datosActualizacion);
        
        return usuarioActualizado !== null;
    }

    /**
     * Actualiza el usuario en la base de datos
     * COMPORTAMIENTO: El Modelo se actualiza a sí mismo
     * @returns {Promise<boolean>}
     */
    async actualizar() {
        if (!this.#usuarioRepository) {
            throw new Error('Repositorio no inyectado en Usuario');
        }

        if (!this.#usuarioId) {
            throw new Error('No se puede actualizar un usuario sin ID');
        }

        // Validar antes de actualizar
        const validacion = this.validate();
        if (!validacion.isValid) {
            throw new Error(validacion.errors.join(', '));
        }

        return await this.#usuarioRepository.update(this.#usuarioId, this);
    }

    /**
     * Bloquea el usuario en la base de datos
     * COMPORTAMIENTO: El Modelo se bloquea a sí mismo
     * @param {Object} opciones - { motivo, adminId }
     * @returns {Promise<boolean>}
     */
    async bloquearUsuario({ motivo = null, adminId = null } = {}) {
        if (!this.#usuarioRepository) {
            throw new Error('Repositorio no inyectado en Usuario');
        }

        if (!this.#rut) {
            throw new Error('RUT requerido para bloquear usuario');
        }

        // Verificar que no esté ya bloqueado
        if (this.isBloqueado()) {
            const error = new Error('Usuario ya está bloqueado');
            error.code = 'ALREADY_BLOCKED';
            throw error;
        }

        // Cambiar estado en memoria
        this.#estado = 'BLOQUEADO';

        // Actualizar en BD
        const datosActualizacion = {
            nombre: this.#nombre,
            email: this.#email,
            rol: this.#rol,
            estado: 'BLOQUEADO'
        };

        const usuarioActualizado = await this.#usuarioRepository.update(this.#usuarioId, datosActualizacion);
        
        return usuarioActualizado !== null;
    }

    // ==================== FIN MÉTODOS ACTIVE RECORD ====================

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
     * Verifica si el usuario está bloqueado
     * @returns {boolean}
     */
    isBloqueado() {
        return this.#estado === 'BLOQUEADO';
    }

    /**
     * Cambia el estado del usuario
     * @param {string} nuevoEstado - ACTIVO, INACTIVO o BLOQUEADO
     * @returns {Usuario} - Retorna this para permitir method chaining
     */
    cambiarEstado(nuevoEstado) {
        const estadosValidos = ['ACTIVO', 'INACTIVO', 'BLOQUEADO'];
        if (!estadosValidos.includes(nuevoEstado)) {
            throw new Error('Estado inválido. Debe ser ACTIVO, INACTIVO o BLOQUEADO');
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

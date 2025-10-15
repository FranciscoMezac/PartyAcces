const db = require('../config/database');

class Usuario {
    #usuarioId;
    #nombre;
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
        this.#nombre = data.nombre || '';
        this.#email = data.email || '';
        this.#contrasenia = data.contrasenia || '';
        this.#rol = data.rol || 'USER';
        this.#estado = data.estado || 'ACTIVO';
        this.#createdAt = data.created_at || data.createdAt || null;
    }

    get usuarioId() {
        return this.#usuarioId;
    }

    get nombre() {
        return this.#nombre;
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

    set email(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            throw new Error('Email inválido');
        }
        this.#email = value.toLowerCase().trim();
    }

    set contrasenia(value) {
        if (!value || value.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
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

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.#email)) {
                errors.push('Email inválido');
            }

            if (!this.#contrasenia || this.#contrasenia.length < 6) {
                errors.push('La contraseña debe tener al menos 6 caracteres');
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

     * @param {string} email 
     * @returns {Promise<Usuario|null>}
     */
    static async findByEmail(email) {
        try {
            const result = await db.query(
                'SELECT * FROM usuario WHERE email = $1',
                [email]
            );
            
            return result.rows[0] ? new Usuario(result.rows[0]) : null;
        } catch (error) {
            console.error('Error al buscar usuario por email:', error);
            throw error;
        }
    }

    /**
     * @param {number} id 
     * @returns {Promise<Usuario|null>}
     */
    static async findById(id) {
        try {
            const result = await db.query(
                'SELECT * FROM usuario WHERE usuario_id = $1',
                [id]
            );
            
            return result.rows[0] ? new Usuario(result.rows[0]) : null;
        } catch (error) {
            console.error('Error al buscar usuario por ID:', error);
            throw error;
        }
    }

    /**
     * @returns {Promise<Array<Usuario>>}
     */
    static async findAll() {
        try {
            const result = await db.query(
                'SELECT * FROM usuario ORDER BY created_at DESC'
            );
            
            return result.rows.map(row => new Usuario(row));
        } catch (error) {
            console.error('Error al obtener todos los usuarios:', error);
            throw error;
        }
    }

    /**
     * @param {Object} client
     * @param {Usuario} usuario 
     * @returns {Promise<number>} 
     */
    static async insert(client, usuario) {
        try {
            const data = usuario.toDatabase();
            
            const result = await client.query(
                'INSERT INTO usuario (nombre, email, contrasenia, rol, estado) VALUES ($1, $2, $3, $4, $5) RETURNING usuario_id',
                [data.nombre, data.email, data.contrasenia, data.rol, data.estado]
            );
            
            return result.rows[0].usuario_id;
        } catch (error) {
            console.error('Error al insertar usuario:', error);
            throw error;
        }
    }

    /**
     * @param {Usuario} usuario 
     * @returns {Promise<Usuario>}
     */
    static async create(usuario) {
        try {
            const data = usuario.toDatabase();
            
            const result = await db.query(
                'INSERT INTO usuario (nombre, email, contrasenia, rol, estado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [data.nombre, data.email, data.contrasenia, data.rol, data.estado]
            );
            
            return new Usuario(result.rows[0]);
        } catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
        }
    }

    /**

     * @param {number} id 
     * @param {Object} data 
     * @returns {Promise<Usuario|null>}
     */
    static async update(id, data) {
        try {
            const result = await db.query(
                'UPDATE usuario SET nombre = $1, email = $2, rol = $3, estado = $4 WHERE usuario_id = $5 RETURNING *',
                [data.nombre, data.email, data.rol, data.estado, id]
            );
            
            return result.rows[0] ? new Usuario(result.rows[0]) : null;
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            throw error;
        }
    }

    /**
     * @param {number} id 
     * @returns {Promise<boolean>}
     */
    static async delete(id) {
        try {
            const result = await db.query(
                'DELETE FROM usuario WHERE usuario_id = $1 RETURNING usuario_id',
                [id]
            );
            
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            throw error;
        }
    }

    /**
     * @param {string} rol 
     * @returns {Promise<Array<Usuario>>}
     */
    static async findByRole(rol) {
        try {
            const result = await db.query(
                'SELECT * FROM usuario WHERE rol = $1 ORDER BY created_at DESC',
                [rol]
            );
            
            return result.rows.map(row => new Usuario(row));
        } catch (error) {
            console.error('Error al buscar usuarios por rol:', error);
            throw error;
        }
    }

    /**
     * @returns {Promise<Array<Usuario>>}
     */
    static async findActive() {
        try {
            const result = await db.query(
                'SELECT * FROM usuario WHERE estado = $1 ORDER BY created_at DESC',
                ['ACTIVO']
            );
            
            return result.rows.map(row => new Usuario(row));
        } catch (error) {
            console.error('Error al buscar usuarios activos:', error);
            throw error;
        }
    }
}

module.exports = Usuario;

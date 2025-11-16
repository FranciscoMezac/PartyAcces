const Usuario = require('../models/Usuario');
/**
 * Patron de diseño: Repository Pattern
 * Propósito: Abstraer el acceso a datos de la entidad Usuario de la lógica de negocio
 * Problema que resuelve: Separa las consultas a base de datos del modelo de dominio,
 * permitiendo cambiar la fuente de datos sin afectar la lógica de negocio
 */

class UsuarioRepository {
    #db;

    /**
     * Constructor con inyección de dependencias
     * @param {Object} db - Pool de conexión a la base de datos
     */
    constructor(db) {
        this.#db = db;
    }

    /**
     * Listado paginado con filtros por estado y búsqueda por nombre/email/rut
     * Retorna instancias del Modelo con Repositorio inyectado
     */
    async findAllPaginated({ page = 1, limit = 10, estado = 'all', search = '' } = {}) {
        const p = Number(page) > 0 ? Number(page) : 1;
        const l = Number(limit) > 0 && Number(limit) <= 100 ? Number(limit) : 10;
        const offset = (p - 1) * l;

        const whereParts = [];
        const params = [];
        if (estado && estado !== 'all') {
            params.push(estado);
            whereParts.push(`estado = $${params.length}`);
        }
        if (search) {
            params.push(`%${search}%`);
            params.push(`%${search}%`);
            params.push(`%${search}%`);
            whereParts.push(`(nombre ILIKE $${params.length - 2} OR email ILIKE $${params.length - 1} OR rut ILIKE $${params.length})`);
        }
        const whereSql = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';

        const rowsRes = await this.#db.query(
            `SELECT usuario_id, nombre, email, rut, rol, estado
             FROM usuario
             ${whereSql}
             ORDER BY usuario_id DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, l, offset]
        );

        const totalRes = await this.#db.query(
            `SELECT COUNT(*)::int AS total FROM usuario ${whereSql}`,
            params
        );

        // IMPORTANTE: Inyectar repositorio en cada instancia
        const items = rowsRes.rows.map(row => new Usuario({
            usuarioId: row.usuario_id,
            nombre: row.nombre,
            email: row.email,
            rut: row.rut,
            rol: row.rol,
            estado: row.estado
        }, this));

        return { items, total: totalRes.rows[0].total, page: p, limit: l };
    }

    /**
     * Busca un usuario por su email
     * @param {string} email 
     * @returns {Promise<Usuario|null>}
     */
    async findByEmail(email) {
        try {
            const result = await this.#db.query(
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
     * Busca un usuario por su ID
     * @param {number} id 
     * @returns {Promise<Usuario|null>}
     */
    async findById(id) {
        try {
            const result = await this.#db.query(
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
     * Busca un usuario por su RUT
     * @param {string} rut 
     * @returns {Promise<Usuario|null>}
     */
    async findByRut(rut) {
        try {
            const result = await this.#db.query(
                'SELECT * FROM usuario WHERE rut = $1',
                [rut]
            );
            
            return result.rows[0] ? new Usuario(result.rows[0]) : null;
        } catch (error) {
            console.error('Error al buscar usuario por RUT:', error);
            throw error;
        }
    }

    /**
     * Obtiene todos los usuarios
     * @returns {Promise<Array<Usuario>>}
     */
    async findAll() {
        try {
            const result = await this.#db.query(
                'SELECT * FROM usuario ORDER BY created_at DESC'
            );
            
            return result.rows.map(row => new Usuario(row));
        } catch (error) {
            console.error('Error al obtener todos los usuarios:', error);
            throw error;
        }
    }

    /**
     * Crea un nuevo usuario (sin transacción externa)
     * @param {Usuario} usuario 
     * @returns {Promise<Usuario>}
     */
    async create(usuario) {
        try {
            const data = usuario.toDatabase();
            
            const result = await this.#db.query(
                'INSERT INTO usuario (nombre, rut, email, contrasenia, rol, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [data.nombre, data.rut, data.email, data.contrasenia, data.rol, data.estado]
            );
            
            return new Usuario(result.rows[0]);
        } catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
        }
    }

    /**
     * Inserta un usuario dentro de una transacción
     * @param {Object} client - Cliente de transacción
     * @param {Usuario} usuario 
     * @returns {Promise<number>} - ID del usuario insertado
     */
    async insert(client, usuario) {
        try {
            const data = usuario.toDatabase();
            
            const result = await client.query(
                'INSERT INTO usuario (nombre, rut, email, contrasenia, rol, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING usuario_id',
                [data.nombre, data.rut, data.email, data.contrasenia, data.rol, data.estado]
            );
            
            return result.rows[0].usuario_id;
        } catch (error) {
            console.error('Error al insertar usuario:', error);
            throw error;
        }
    }

    /**
     * Actualiza un usuario existente
     * @param {number} id 
     * @param {Object} data 
     * @returns {Promise<Usuario|null>}
     */
    async update(id, data) {
        try {
            // Construir query dinámicamente según los campos presentes
            const campos = [];
            const valores = [];
            let contador = 1;

            if (data.nombre !== undefined) {
                campos.push(`nombre = $${contador++}`);
                valores.push(data.nombre);
            }
            if (data.email !== undefined) {
                campos.push(`email = $${contador++}`);
                valores.push(data.email);
            }
            if (data.rol !== undefined) {
                campos.push(`rol = $${contador++}`);
                valores.push(data.rol);
            }
            if (data.estado !== undefined) {
                campos.push(`estado = $${contador++}`);
                valores.push(data.estado);
            }
            if (data.contrasenia !== undefined) {
                campos.push(`contrasenia = $${contador++}`);
                valores.push(data.contrasenia);
            }

            // Agregar el ID al final
            valores.push(id);

            const query = `UPDATE usuario SET ${campos.join(', ')} WHERE usuario_id = $${contador} RETURNING *`;

            const result = await this.#db.query(query, valores);
            
            return result.rows[0] ? new Usuario(result.rows[0]) : null;
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            throw error;
        }
    }

    /**
     * Actualiza solo la contraseña de un usuario
     * @param {number} id 
     * @param {string} contraseniaHasheada 
     * @returns {Promise<boolean>}
     */
    async actualizarContrasenia(id, contraseniaHasheada) {
        try {
            const result = await this.#db.query(
                'UPDATE usuario SET contrasenia = $1 WHERE usuario_id = $2 RETURNING usuario_id',
                [contraseniaHasheada, id]
            );
            
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            throw error;
        }
    }

    /**
     * Elimina un usuario por su ID
     * @param {number} id 
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        try {
            const result = await this.#db.query(
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
     * Busca usuarios por rol
     * @param {string} rol 
     * @returns {Promise<Array<Usuario>>}
     */
    async findByRole(rol) {
        try {
            const result = await this.#db.query(
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
     * Busca todos los usuarios activos
     * @returns {Promise<Array<Usuario>>}
     */
    async findActive() {
        try {
            const result = await this.#db.query(
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

module.exports = UsuarioRepository;

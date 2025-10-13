const db = require('../config/database');

// Buscar usuario por email
async function findByEmail(email) {
    try {
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error al buscar usuario por email:', error);
        throw error;
    }
}

// Buscar usuario por ID
async function findById(id) {
    try {
        const result = await db.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error al buscar usuario por ID:', error);
        throw error;
    }
}

// Obtener todos los usuarios
async function findAll() {
    try {
        const result = await db.query(
            'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC'
        );
        
        return result.rows;
    } catch (error) {
        console.error('Error al obtener todos los usuarios:', error);
        throw error;
    }
}

// Crear nuevo usuario
async function create(userData) {
    try {
        const { name, email, password } = userData;
        
        const result = await db.query(
            'INSERT INTO users (name, email, password, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, name, email, created_at',
            [name, email, password]
        );
        
        return result.rows[0];
    } catch (error) {
        console.error('Error al crear usuario:', error);
        throw error;
    }
}

// Actualizar usuario
async function update(id, userData) {
    try {
        const { name, email } = userData;
        
        const result = await db.query(
            'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, created_at',
            [name, email, id]
        );
        
        return result.rows[0];
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        throw error;
    }
}

// Eliminar usuario
async function remove(id) {
    try {
        const result = await db.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [id]
        );
        
        return result.rows[0];
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        throw error;
    }
}

module.exports = {
    findByEmail,
    findById,
    findAll,
    create,
    update,
    remove
};

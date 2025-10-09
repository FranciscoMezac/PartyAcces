import pool from '../config/db.js';

export class UsuarioRepository {
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT usuario_id, nombre, email, contrasenia, rol, estado FROM usuario WHERE email = $1',
      [email]
    );
    return rows[0] ?? null;
  }

  async insert(client, usuario) {
    const { rows } = await client.query(
      `INSERT INTO usuario (nombre, email, contrasenia, rol, estado)
       VALUES ($1, $2, $3, $4, $5) RETURNING usuario_id`,
      [usuario.nombre, usuario.email, usuario.contrasenia, usuario.rol, usuario.estado]
    );
    return rows[0].usuario_id;
  }
}

const userRepository = new UsuarioRepository();
export default userRepository;

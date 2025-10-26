const Usuario = require('../models/Usuario');

class UsuarioRepository {
  constructor(db) { this.db = db; }

  async findAllPaginated({ page = 1, limit = 10, estado = 'all', search = '' } = {}) {
    const p = Number(page) > 0 ? Number(page) : 1;
    const l = Number(limit) > 0 && Number(limit) <= 100 ? Number(limit) : 10;
    const offset = (p - 1) * l;

    // Repositorio para tabla 'usuarios' (usuario_id, nombre, email, contrasenia, rol, estado, rut)
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
      // Buscar por nombre, email o rut
      whereParts.push(`(nombre ILIKE $${params.length - 2} OR email ILIKE $${params.length - 1} OR rut ILIKE $${params.length})`);
    }

    const whereSql = whereParts.length ? 'WHERE ' + whereParts.join(' AND ') : '';

    const rowsRes = await this.db.query(
      `SELECT usuario_id, nombre, email, rut, rol, estado
       FROM usuario
       ${whereSql}
       ORDER BY usuario_id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, l, offset]
    );

    const totalRes = await this.db.query(
      `SELECT COUNT(*)::int AS total FROM usuario ${whereSql}`,
      params
    );

    const items = rowsRes.rows.map(r => new Usuario({
      id: r.usuario_id,
      nombre: r.nombre,
      correo: r.email,
      rut: r.rut,
      rol: r.rol,
      estado: r.estado
    }));

    return { items, total: totalRes.rows[0].total, page: p, limit: l };
  }

  mapRow(row) {
    if (!row) return null;
    return new Usuario({
      id: row.usuario_id,
      nombre: row.nombre,
      correo: row.email,
      rut: row.rut,
      rol: row.rol,
      estado: row.estado
    });
  }

  async findByRut(rut) {
    const r = await this.db.query(
      `SELECT usuario_id, nombre, email, rut, rol, estado
       FROM usuario WHERE rut = $1`,
      [rut]
    );
    return this.mapRow(r.rows[0]);
  }

  async bloquear(rut, { motivo = null, adminId = null } = {}) {
    // Intenta bloquear sólo si no está ya bloqueado (idempotencia)
    const r = await this.db.query(
      `UPDATE usuario
         SET estado = 'BLOQUEADO'
       WHERE rut = $1 AND estado <> 'BLOQUEADO'
       RETURNING usuario_id, nombre, email, rut, rol, estado`,
      [rut]
    );
    if (r.rows[0]) return this.mapRow(r.rows[0]);

    // Si no se actualizó, verificamos el motivo (no existe o ya bloqueado)
    const current = await this.findByRut(rut);
    if (!current) return null;
    if (current.estado === 'BLOQUEADO') {
      const err = new Error('Ya está bloqueado');
      err.code = 'ALREADY_BLOCKED';
      throw err;
    }
    return null;
  }
}

module.exports = UsuarioRepository;

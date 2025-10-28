const CuentaPuntos = require('../models/CuentaPuntos');

class CuentaRepository {
  constructor(db) { this.db = db; }

  async ensureExists(client, rut) {
    const q = `INSERT INTO cuentas (rut, saldo, actualizado_en)
               VALUES ($1, 0, NOW())
               ON CONFLICT (rut) DO NOTHING`;
    await client.query(q, [rut]);
  }

  async findByRut(client, rut, { forUpdate = false } = {}) {
    const sql = `SELECT rut, saldo FROM cuentas WHERE rut = $1${forUpdate ? ' FOR UPDATE' : ''}`;
    const r = await client.query(sql, [rut]);
    const row = r.rows[0];
    return row ? new CuentaPuntos({ rut: row.rut, saldo: row.saldo }) : null;
  }

  async acreditar(client, rut, puntos) {
    const r = await client.query(
      `UPDATE cuentas SET saldo = saldo + $1, actualizado_en = NOW()
       WHERE rut = $2 RETURNING saldo`,
      [Number(puntos), rut]
    );
    return r.rows[0] ? Number(r.rows[0].saldo) : null;
  }

  async actualizarSaldo(client, rut, nuevoSaldo) {
    const r = await client.query(
      `UPDATE cuentas SET saldo = $1, actualizado_en = NOW()
       WHERE rut = $2 RETURNING saldo`,
      [Number(nuevoSaldo), rut]
    );
    return r.rows[0] ? Number(r.rows[0].saldo) : null;
  }

  async getSaldo(rut) {
    const r = await this.db.query('SELECT saldo FROM cuentas WHERE rut = $1', [rut]);
    return r.rows[0] ? Number(r.rows[0].saldo) : null;
  }
}

module.exports = CuentaRepository;

